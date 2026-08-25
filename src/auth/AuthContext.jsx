import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { CALENDAR_SCOPE, saveToken, clearToken, storeRefreshToken } from '../lib/googleCalendar'
import { pendingReferral, clearReferral } from '../lib/referral'
import { claimReferral } from '../lib/community'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session) fetchProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Supabase surfaces both Google tokens exactly once, on the sign-in that
      // granted them — they are absent from every later session read. So they
      // are caught here or not at all.
      if (newSession?.provider_token) {
        saveToken(newSession.provider_token, newSession.provider_token_expires_in)
      }
      // The refresh token is the whole difference between a connection that
      // lasts an hour and one that lasts. It goes straight to the server and
      // is never kept here.
      if (newSession?.provider_refresh_token) {
        storeRefreshToken(newSession.provider_refresh_token)
      }
      setSession(newSession)
      if (newSession) { fetchProfile(newSession.user.id); redeemReferral() }
      else { setProfile(null); setLoading(false) }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Spend the parked code, if there is one. The server refuses a second claim,
  // a self-claim, and an unknown code, so this is safe to call on every sign-in
  // — and it is cleared either way, because retrying a code the server has
  // already declined would mean doing it on every load forever.
  async function redeemReferral() {
    if (!pendingReferral()) return
    try { await claimReferral(pendingReferral()) } catch { /* unmigrated, or refused */ }
    clearReferral()
  }

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  function signUp(email, password, displayName) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
  }

  function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  function signInWithGoogle() {
    // Preserve the current path + query (e.g. ?account=tester) so an isolated
    // tab lands back in the same isolated session after the OAuth round-trip.
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname + window.location.search },
    })
  }

  function signOut() {
    clearToken()
    return supabase.auth.signOut()
  }

  // Re-runs the Google round-trip asking for calendar.readonly on top of
  // sign-in.
  //
  // access_type=offline is what asks Google for a refresh token, and without
  // it there is nothing to store and the connection can only ever be
  // temporary. prompt=consent goes with it: Google issues a refresh token on
  // the FIRST consent only, so a repeat authorisation without this returns an
  // access token and no refresh token — which looks like it worked and then
  // quietly expires an hour later.
  function connectCalendar() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: CALENDAR_SCOPE,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        redirectTo: window.location.origin + window.location.pathname + window.location.search,
      },
    })
  }

  async function refreshProfile() {
    if (session) await fetchProfile(session.user.id)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    connectCalendar,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
