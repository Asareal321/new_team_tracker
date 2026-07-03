import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Per-tab isolated login.
//
// Normally the auth session lives in localStorage, which every tab of the site
// shares — so signing into a second account in a new tab replaces the first.
// Open the app with a ?account=<label> query param (e.g. ?account=tester) to
// give THIS tab its own session in sessionStorage instead. That tab can be
// signed into a different account without disturbing your main session or any
// other tab — handy for testing flows between two users. Isolated sessions
// aren't shared with other tabs and are cleared when the tab closes.
const isolatedLabel =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('account')
    : null

export const isIsolatedSession = Boolean(isolatedLabel)
export const isolatedSessionLabel = isolatedLabel

const authOptions = isolatedLabel
  ? {
      auth: {
        storage: window.sessionStorage,
        storageKey: `sb-trakkit-${isolatedLabel}-auth`,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  : undefined

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, authOptions)
  : null
