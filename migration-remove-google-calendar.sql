-- Removes the Google Calendar integration.
--
-- The app no longer asks for calendar access or reads events, so the stored
-- refresh tokens are deleted rather than left sitting in the database. Run
-- once in the Supabase SQL editor. Safe to run again.
--
-- Also delete the `calendar-events` Edge Function in the Supabase dashboard
-- (Edge Functions → calendar-events → Delete), and remove its GOOGLE_CLIENT_ID /
-- GOOGLE_CLIENT_SECRET secrets if nothing else uses them.

drop function if exists store_google_refresh_token(text);
drop function if exists google_calendar_connected();
drop function if exists disconnect_google_calendar();
drop table if exists google_credentials;

-- A focus block from the calendar may still be stored on a garden; it no
-- longer means anything.
update garden_state set focus = '{}'::jsonb where focus is not null and focus <> '{}'::jsonb;
