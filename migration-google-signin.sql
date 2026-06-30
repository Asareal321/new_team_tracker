-- Non-destructive migration: pick up a display name from Google OAuth.
-- Run this once in the Supabase SQL Editor.
-- Does NOT drop any tables — safe on a live database.
--
-- Also requires a dashboard step (cannot be done via SQL):
--   Supabase Dashboard → Authentication → Providers → Google → enable it,
--   and paste in the Client ID + Client Secret from a Google Cloud OAuth
--   client (Web application type). Add this as an authorized redirect URI
--   in Google Cloud Console:
--     https://<your-project-ref>.supabase.co/auth/v1/callback

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;
