-- Keeping a Google Calendar connection alive.
--
-- The connection used to last about an hour at best, and in practice much less
-- on a phone: Supabase hands the browser a Google ACCESS token once, at
-- sign-in, and never refreshes it. Everything after that was borrowed time.
--
-- A refresh token is the thing that makes it permanent, and a refresh token is
-- not something a browser may hold. Exchanging one needs the Google client
-- secret, so the exchange has to happen on a server. That is the whole reason
-- this file and the calendar-events Edge Function exist.
--
-- The shape of it:
--
--   • The browser receives the refresh token once (Supabase gives it no
--     choice) and immediately hands it here, to a SECURITY DEFINER function
--     that writes but never reads back.
--   • The table has RLS on and NO policies at all. That is deliberate and is
--     not an oversight: with RLS enabled and nothing granted, anon and
--     authenticated can do nothing whatsoever with it. Only the service role,
--     which bypasses RLS and lives only inside the Edge Function, can read it.
--   • Nothing in the app ever reads a token back. Not the owner, not an admin,
--     not a support view. If you find yourself adding a select policy here,
--     something has gone wrong upstream.

create table if not exists google_credentials (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table google_credentials enable row level security;

-- Belt and braces alongside "no policies": the client roles are stripped of
-- table privileges outright, so a policy added by accident later still grants
-- nothing on its own.
revoke all on table google_credentials from anon, authenticated;

-- Store (or replace) the caller's refresh token. Write-only by construction:
-- it returns nothing, and there is no matching read anywhere in the schema.
create or replace function store_google_refresh_token(_token text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _token is null or length(btrim(_token)) = 0 then
    raise exception 'no token supplied';
  end if;

  insert into google_credentials (user_id, refresh_token)
  values (auth.uid(), _token)
  on conflict (user_id) do update
    set refresh_token = excluded.refresh_token,
        updated_at = now();
end;
$$;

-- Whether the caller has a stored connection. A boolean, never the token —
-- the app needs to know if it is connected, and that is all it needs.
create or replace function google_calendar_connected()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from google_credentials where user_id = auth.uid());
$$;

-- Disconnecting is the user's, and it really deletes.
create or replace function disconnect_google_calendar()
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from google_credentials where user_id = auth.uid();
end;
$$;

revoke all on function store_google_refresh_token(text) from anon;
revoke all on function google_calendar_connected()      from anon;
revoke all on function disconnect_google_calendar()     from anon;

grant execute on function store_google_refresh_token(text) to authenticated;
grant execute on function google_calendar_connected()      to authenticated;
grant execute on function disconnect_google_calendar()     to authenticated;
