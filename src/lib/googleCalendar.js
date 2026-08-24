// Reading today's calendar.
//
// Scope and lifetime, stated up front because both are deliberate:
//
//   • calendar.readonly, and nothing else. This feature reads event titles and
//     times to decide what to put on your board. It never writes to a calendar.
//   • The token lives in sessionStorage, not localStorage. Supabase hands back
//     a Google access token once, at sign-in, and does not refresh it — so the
//     connection is good for about an hour and dies with the tab. That matches
//     what this feature is: the board reacts while trakkit is open. Keeping the
//     token per-tab and short-lived is the honest storage for that, and it
//     keeps a third party's access token out of long-lived storage.
//
// Making this survive a closed tab means storing a Google refresh token
// server-side, which is a different feature with a much larger blast radius.

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

const KEY = 'trakkit.gcal'

// Google's tokens last an hour; expire ours slightly early so a request can't
// die halfway through a poll.
const EARLY_S = 60

export function saveToken(token, expiresInSeconds = 3600) {
  if (!token) return
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      token,
      expiresAt: Date.now() + Math.max(0, expiresInSeconds - EARLY_S) * 1000,
    }))
  } catch { /* private mode; the feature simply stays disconnected */ }
}

export function readToken() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const { token, expiresAt } = JSON.parse(raw)
    if (!token || Date.now() >= expiresAt) { clearToken(); return null }
    return token
  } catch { return null }
}

export function clearToken() {
  try { sessionStorage.removeItem(KEY) } catch { /* nothing to clear */ }
}

export function isConnected() {
  return !!readToken()
}

// Google's shape, reduced to what planFill needs. All-day events arrive as
// `date` rather than `dateTime`, and are flagged so they can be ignored — a
// day-long "Product" would otherwise hold the board from midnight to midnight.
function toBlock(item) {
  const allDay = !item.start?.dateTime
  return {
    id: item.id,
    title: item.summary || '',
    start: item.start?.dateTime || item.start?.date,
    end: item.end?.dateTime || item.end?.date,
    allDay,
  }
}

export class CalendarAuthError extends Error {}

// Today's events on the primary calendar. Cancelled events are excluded by
// singleEvents + the status check; recurring ones are expanded to instances so
// a weekly "Product" block is a real 1–2pm today rather than a rule.
export async function fetchTodaysEvents({ now = new Date(), token = readToken() } = {}) {
  if (!token) throw new CalendarAuthError('Not connected to Google Calendar')

  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999)

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', dayStart.toISOString())
  url.searchParams.set('timeMax', dayEnd.toISOString())
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '50')

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401 || res.status === 403) {
    clearToken()
    throw new CalendarAuthError('Google Calendar access has expired. Connect again.')
  }
  if (!res.ok) throw new Error(`Calendar request failed (${res.status})`)

  const body = await res.json()
  return (body.items || [])
    .filter(i => i.status !== 'cancelled')
    .map(toBlock)
}
