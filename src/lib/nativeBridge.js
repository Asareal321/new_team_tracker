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

// --- notifications --------------------------------------------------------
//
// Local ones: the shell holds the alarms, but everything about what they say
// and when is decided here and handed over whole. See lib/notificationPlan.js
// for the plan itself and Trakkit/Notifications.swift for the other end.

const NOTIFY_SETTINGS_KEY = 'trakkit.notify'

export function notificationsAvailable() {
  return isNativeApp()
    && typeof window !== 'undefined'
    && !!window.webkit?.messageHandlers?.notify
}

function post(message) {
  if (!notificationsAvailable()) return false
  window.webkit.messageHandlers.notify.postMessage(message)
  return true
}

// iOS shows its permission sheet exactly once, ever. Asking before anybody
// knows what the notifications are for is the one unrecoverable mistake here,
// so the caller checks this first and explains itself before asking.
export function notificationStatus() {
  return new Promise(resolve => {
    if (!notificationsAvailable()) { resolve('unavailable'); return }
    const timer = setTimeout(() => resolve('unavailable'), 3000)
    window.__trakkitNotifyStatus = status => {
      clearTimeout(timer)
      resolve(String(status || 'denied'))
    }
    post('status')
  })
}

export function requestNotifications() {
  return new Promise(resolve => {
    if (!notificationsAvailable()) { resolve('unavailable'); return }
    // No timeout: the person may sit on the system sheet for a while, and
    // resolving early would report a denial they never made.
    window.__trakkitNotifyStatus = status => resolve(String(status || 'denied'))
    post('request')
  })
}

export function scheduleNotifications(plan) {
  return post(JSON.stringify(plan || []))
}

export function cancelNotifications() {
  return post('cancel')
}

// Which categories are on. Per-device rather than per-account: notifications
// are a property of the phone in your pocket, not of the login.
export function notificationSettings() {
  try { return JSON.parse(localStorage.getItem(NOTIFY_SETTINGS_KEY) || '{}') } catch { return {} }
}

export function setNotificationSettings(next) {
  try { localStorage.setItem(NOTIFY_SETTINGS_KEY, JSON.stringify(next || {})) } catch { /* nothing was saved anyway */ }
}
