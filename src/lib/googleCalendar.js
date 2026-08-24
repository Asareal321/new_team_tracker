// Reading today's calendar.
//
// calendar.readonly and nothing else: this reads event titles and times to
// decide what goes on your board, and never writes to a calendar.
//
// Two routes, and the difference is how long a connection lasts.
//
//   • Server (preferred). A refresh token is stored server-side and the
//     calendar-events Edge Function mints a fresh access token per request.
//     This is what makes the connection permanent, and it is the only way:
//     exchanging a refresh token needs the Google client secret, and a secret
//     in a browser is not a secret.
//   • Browser (fallback). The access token Supabase hands over at sign-in,
//     held in sessionStorage. Good for under an hour and gone when the tab is
//     discarded — which on a phone is far sooner than that. This exists only
//     so the feature still works before the Edge Function is deployed.
//
// The browser path is deliberately the fallback, not the default. Reconnecting
// twice an hour is not a connection.

import { supabase } from '../supabase'

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

// The stored, permanent connection. Never returns a token — there is no way
// to read one back, by design (see migration-google-calendar.sql).
export async function hasStoredConnection() {
  try {
    const { data, error } = await supabase.rpc('google_calendar_connected')
    if (error) return false
    return !!data
  } catch { return false }
}

// Hand the refresh token over once and forget it. Supabase gives it to the
// browser whether we want it or not; the least we can do is not keep it.
export async function storeRefreshToken(token) {
  if (!token) return false
  const { error } = await supabase.rpc('store_google_refresh_token', { _token: token })
  return !error
}

export async function disconnect() {
  clearToken()
  try { await supabase.rpc('disconnect_google_calendar') } catch { /* already gone */ }
}

// Only tells you about this tab's borrowed token. Prefer hasStoredConnection.
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
// Ask the server. Returns null when the function isn't deployed, so the caller
// can fall back rather than treating a missing deployment as a lost
// connection.
export async function fetchViaServer() {
  const { data, error } = await supabase.functions.invoke('calendar-events')
  if (error) {
    const status = error?.context?.status
    // 428: connected once, but the stored token no longer works.
    if (status === 428) throw new CalendarAuthError('Google Calendar needs connecting again.')
    // Anything else — not deployed, cold start, network — is not proof that
    // the connection is gone.
    return null
  }
  if (data?.error === 'not_connected' || data?.error === 'reconnect_required') {
    throw new CalendarAuthError('Google Calendar needs connecting again.')
  }
  return data?.events ?? null
}

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
