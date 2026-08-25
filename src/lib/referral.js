// The ?ref= on a signup link.
//
// The code arrives before there is an account to attach it to — someone opens
// the link, reads the landing page, and signs up a minute later, by which time
// the query string is long gone. So it is parked as soon as it is seen and
// redeemed once a session exists.
//
// localStorage rather than sessionStorage: the round trip through Google's
// consent screen is a full page load, and a code that did not survive it would
// only ever work for people who sign up with a password.

const KEY = 'trakkit.ref'

export const REF_PARAM = 'ref'

// Called on every load. Reads the code out of the URL and keeps it.
export function captureReferralFromUrl() {
  try {
    const code = new URLSearchParams(window.location.search).get(REF_PARAM)
    if (!code || !code.trim()) return null
    localStorage.setItem(KEY, code.trim())
    return code.trim()
  } catch { return null }
}

export function pendingReferral() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

// Redeemed, or refused — either way it is spent. Keeping it would mean
// retrying a code the server has already declined on every single load.
export function clearReferral() {
  try { localStorage.removeItem(KEY) } catch { /* nothing to clear */ }
}

export function referralLink(code, origin = window.location.origin) {
  return `${origin}/?${REF_PARAM}=${code}`
}
