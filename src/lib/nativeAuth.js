// Signing in with Google from inside the iOS app.
//
// Google refuses OAuth in an embedded web view — it answers
// "403: disallowed_useragent" — so the round-trip has to happen outside the
// WKWebView. The shell used to hand it to SFSafariViewController, which put
// Google's page on screen but had nowhere to deliver the callback: it landed
// in Safari, not in the app, and the app never learned that anything had
// happened. Google-only accounts simply could not use the iOS app.
//
// ASWebAuthenticationSession fixes the delivery. It is the same Safari surface
// Google accepts, and it returns the callback URL straight to the app, which
// hands it back here. The exchange itself is done by supabase-js in this web
// view, which is the only place it can be done: whichever half of the PKCE
// pair exists lives in this document's storage, so a token minted anywhere
// else would belong to nobody.
//
// The whole path is:
//
//   web   signInWithOAuth({ skipBrowserRedirect: true }) → an authorize URL
//   web   → postMessage(url) → shell
//   shell ASWebAuthenticationSession(url, callbackURLScheme: "trakkit")
//   shell → window.__trakkitAuthCallback(callbackURL) → web
//   web   exchange the code (or set the session) and carry on
//
// Nothing here runs in a browser. `nativeAuthAvailable()` is false there and
// every caller falls back to the ordinary redirect.

import { isNativeApp } from './nativeBridge.js'

// Must match the scheme the shell registers and the redirect allow-list in
// Supabase → Authentication → URL Configuration. A mismatch fails closed:
// Supabase refuses to redirect, and the sheet closes with nothing.
export const NATIVE_REDIRECT = 'trakkit://auth-callback'

export const CALLBACK_HOOK = '__trakkitAuthCallback'

export function nativeAuthAvailable() {
  return isNativeApp()
    && typeof window !== 'undefined'
    && !!window.webkit?.messageHandlers?.oauth
}

// What came back on the callback URL. Supabase uses the query string for the
// PKCE code and the fragment for implicit tokens, and which one you get
// depends on the client's flowType — so read both rather than depending on a
// default that can be changed in a config file three directories away.
export function parseCallback(rawUrl) {
  let url
  try { url = new URL(rawUrl) } catch { return { error: 'That sign-in did not come back properly.' } }

  const q = url.searchParams
  const hash = new URLSearchParams((url.hash || '').replace(/^#/, ''))
  const pick = key => q.get(key) || hash.get(key)

  // Google's own refusal arrives here too — an access_denied when somebody
  // closes the consent screen. It is not an error worth shouting about.
  const err = pick('error_description') || pick('error')
  if (err) return { error: err === 'access_denied' ? null : err }

  const code = pick('code')
  if (code) return { code }

  const access_token = pick('access_token')
  const refresh_token = pick('refresh_token')
  if (access_token && refresh_token) return { access_token, refresh_token }

  return { error: 'That sign-in did not come back properly.' }
}

// Ask the shell to run the round-trip. Resolves when the sheet has been handed
// the URL, NOT when sign-in finishes — the finish arrives on the hook below,
// and onAuthStateChange is what the app is already listening to.
export async function startNativeOAuth(supabase, { scopes, queryParams } = {}) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes,
      queryParams,
      redirectTo: NATIVE_REDIRECT,
      // Without this supabase-js navigates this web view to Google, which is
      // the exact thing Google rejects.
      skipBrowserRedirect: true,
    },
  })
  if (error) throw error
  if (!data?.url) throw new Error('Could not start Google sign-in.')
  window.webkit.messageHandlers.oauth.postMessage(data.url)
  return data.url
}

// Install the hook the shell calls. Returns a teardown so a remount does not
// leave two of them fighting over the same callback.
export function installNativeAuthBridge(supabase, { onError } = {}) {
  if (typeof window === 'undefined') return () => {}

  window[CALLBACK_HOOK] = async rawUrl => {
    const result = parseCallback(String(rawUrl || ''))
    if (result.error) { onError?.(result.error); return }
    // A cancelled consent screen: nothing to do, nothing to say.
    if (!result.code && !result.access_token) return
    try {
      if (result.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(result.code)
        if (error) throw error
      } else {
        const { error } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        })
        if (error) throw error
      }
    } catch (e) {
      onError?.(e?.message || String(e))
    }
  }

  return () => { if (window[CALLBACK_HOOK]) delete window[CALLBACK_HOOK] }
}
