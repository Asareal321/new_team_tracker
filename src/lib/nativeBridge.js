// Talking to the iOS shell.
//
// The app runs the same web build as the browser, so anything iOS-only has to
// be asked for rather than assumed. The shell sets a marker on the window at
// document start; everywhere else this is simply false and the iOS-only bits
// never render.

const REMEMBER_KEY = 'trakkit.rememberMe'

export function isNativeApp() {
  return typeof window !== 'undefined' && window.__TRAKKIT_NATIVE__ === true
}

// Whether the session may be kept in the device Keychain between launches.
//
// Default on. The alternative is signing in every single time the app opens,
// which is the behaviour this replaced — so the useful default is the one
// people expect from an app on their own phone. It is a visible checkbox and
// it can be turned off later from Account, which is what makes it a choice
// rather than something that merely happens to you.
export function rememberMe() {
  try { return localStorage.getItem(REMEMBER_KEY) !== 'off' } catch { return true }
}

export function setRememberMe(on) {
  try {
    localStorage.setItem(REMEMBER_KEY, on ? 'on' : 'off')
    // The shell watches this key. Turning it off makes the next sync post an
    // empty snapshot, which clears the Keychain — so revoking is immediate
    // rather than taking effect at some later sign-out.
  } catch { /* storage unavailable; nothing was being saved anyway */ }
}
