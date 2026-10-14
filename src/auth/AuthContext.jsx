import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { pendingReferral, clearReferral } from '../lib/referral'
import { claimReferral } from '../lib/community'
import { nativeAuthAvailable, startNativeOAuth, installNativeAuthBridge } from '../lib/nativeAuth'

// Exported for the render harness only; the app goes through useAuth().
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [authError, setAuthError] = useState('')

  // The shell's way back in. Installed once, for the life of the provider —
  // the callback can arrive at any point after the Safari sheet opens, which
  // may be after the user has navigated somewhere else entirely.
  useEffect(() => installNativeAuthBridge(supabase, { onError: setAuthError }), [])

  // The Google Calendar integration is gone. A browser that used it may still
  // hold its access token and its on/off switch; clear both once.
  useEffect(() => {
    try { sessionStorage.removeItem('trakkit.gcal') } catch { /* storage blocked */ }
    try { localStorage.removeItem('trakkit.calendarFill') } catch { /* storage blocked */ }
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session) fetchProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
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
    // In the iOS shell there is no redirect to come back to: Google refuses
    // the embedded web view, so the round-trip happens in a Safari sheet the
    // shell owns and the callback is handed back to us. See lib/nativeAuth.
    if (nativeAuthAvailable()) return startNativeOAuth(supabase)
    // Preserve the current path + query (e.g. ?account=tester) so an isolated
    // tab lands back in the same isolated session after the OAuth round-trip.
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname + window.location.search },
    })
  }

  function signOut() {
    return supabase.auth.signOut()
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
    // Only ever set by the iOS sign-in path, which has no page to show an
    // error on — the Safari sheet has already closed by the time it fails.
    authError,
    clearAuthError: () => setAuthError(''),
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
