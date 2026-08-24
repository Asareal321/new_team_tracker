// Today's calendar, fetched on the server so the connection can be permanent.
//
// The browser cannot do this itself. Turning a refresh token into a working
// access token requires the Google client secret, and a secret in a browser is
// not a secret. So the refresh token never leaves the database, the access
// token never leaves this function, and the client gets nothing but a list of
// events.
//
// Deploy: Supabase Dashboard → Edge Functions → deploy `calendar-events`,
// then set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as secrets. The
// SUPABASE_* variables are injected for you.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

// Google's shape reduced to what the board needs. All-day entries arrive as
// `date` rather than `dateTime` and are flagged, because a day-long "Product"
// would otherwise hold the board from midnight to midnight.
function toBlock(item: Record<string, any>) {
  return {
    id: item.id,
    title: item.summary ?? '',
    start: item.start?.dateTime ?? item.start?.date,
    end: item.end?.dateTime ?? item.end?.date,
    allDay: !item.start?.dateTime,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    return json({ error: 'Server is missing its Google credentials.' }, 500)
  }

  // Who is asking. The caller's own JWT is used to identify them; it is never
  // used to read the credentials table, which their role cannot touch at all.
  const auth = req.headers.get('Authorization') ?? ''
  const asUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  )
  const { data: { user } } = await asUser.auth.getUser()
  if (!user) return json({ error: 'Not signed in.' }, 401)

  // Service role, used for exactly one read and nothing else.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data: cred } = await admin
    .from('google_credentials')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cred?.refresh_token) return json({ error: 'not_connected' }, 428)

  // Refresh tokens are revoked by the user, by a password change, or by six
  // months of disuse. When that happens the only cure is to connect again, so
  // the stale row is cleared rather than left to fail once a minute forever.
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: cred.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenRes.ok) {
    await admin.from('google_credentials').delete().eq('user_id', user.id)
    return json({ error: 'reconnect_required' }, 428)
  }

  const { access_token } = await tokenRes.json()

  const now = new Date()
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999)

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', dayStart.toISOString())
  url.searchParams.set('timeMax', dayEnd.toISOString())
  url.searchParams.set('singleEvents', 'true')   // expand recurrences to instances
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '50')

  const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } })
  if (!res.ok) return json({ error: `Calendar request failed (${res.status})` }, 502)

  const body = await res.json()
  const events = (body.items ?? [])
    .filter((i: Record<string, any>) => i.status !== 'cancelled')
    .map(toBlock)

  // Only the events. Neither token is in this response, and neither should
  // ever be.
  return json({ events })
})
