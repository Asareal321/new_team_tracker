import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { CALENDAR_SCOPE, saveToken, clearToken } from '../lib/googleCalendar'

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
      // Supabase surfaces the Google access token exactly once, on the sign-in
      // that granted it — it is absent from every later session read. So it is
      // caught here or not at all.
      if (newSession?.provider_token) {
        saveToken(newSession.provider_token, newSession.provider_token_expires_in)
      }
      setSession(newSession)
      if (newSession) fetchProfile(newSession.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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
  // sign-in. Consent is forced because Google silently omits the scope on a
  // repeat authorisation otherwise, which looks exactly like a broken button.
  function connectCalendar() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: CALENDAR_SCOPE,
        queryParams: { access_type: 'online', prompt: 'consent' },
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
