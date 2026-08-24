-- Patch: signup was failing with "Database error saving new user".
--
-- The display-name check is a trigger on profiles, and the insert into
-- profiles happens inside Supabase's own handle_new_user trigger on
-- auth.users — which runs SECURITY DEFINER with search_path set to ''. These
-- three functions were the only ones in migration-community.sql without their
-- own search_path, so they inherited that empty one, could not resolve each
-- other, and raised. Postgres reports a raising trigger on that insert as a
-- failed user creation, which is why the message named the database and not
-- the name.
--
-- Nothing about the word lists changes. This sets search_path on all three,
-- schema-qualifies the internal call, and makes the profanity check unable to
-- take signup down again: if the check itself errors, the name is allowed
-- through. A filter is a courtesy, an account is not.
--
-- Safe to run on its own, and safe to run more than once.

create or replace function normalise_name(_name text)
returns text
language sql
immutable
set search_path = public
as $$
  -- Leetspeak first, then everything that is not a letter becomes a space, so
  -- "f.u.c.k" and "sh1t" collapse to the words they are pretending not to be.
  -- The two strings are positional and must stay the same length:
  --   0 1 3 4 5 7 8 @ $ ! | +
  --   o i e a s t b a s i i t
  select btrim(regexp_replace(
    translate(lower(coalesce(_name, '')), '0134578@$!|+', 'oieastbasiit'),
    '[^a-z]+', ' ', 'g'));
$$;

create or replace function name_has_profanity(_name text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  words text[] := array[
    'anal','anus','arse','arsehole','ass','asshole','bastard','bitch','bollocks',
    'boner','boob','boobs','bugger','bullshit','clit','cock','crap','cum','cunt',
    'dick','dickhead','dildo','douche','dyke','ejaculate','erection','fag','faggot',
    'fanny','fuck','fucker','fucking','goddamn','handjob','hoe','horny','jerkoff',
    'jizz','knob','labia','milf','minge','motherfucker','nazi','nigga','nigger',
    'nonce','orgasm','paedo','paedophile','pedo','penis','piss','poon','porn',
    'prick','pube','pussy','queer','rape','rapist','retard','retarded','rimjob',
    'scrotum','semen','shag','shit','shite','slut','spastic','spunk','testicle',
    'tit','tits','titty','tosser','tranny','turd','twat','vagina','wank','wanker',
    'whore','wog'];
  -- Short on purpose. Every entry must be a string that cannot occur inside an
  -- ordinary word: 'rapist' here blocked "Therapist", 'spic' would block
  -- "Spice", 'coon' would block "Raccoon". The word list catches those on
  -- token boundaries instead.
  slurs text[] := array[
    'nigger','nigga','faggot','tranny','kike','chink','wetback'];
  norm text := normalise_name(_name);
  flat text := replace(norm, ' ', '');
  w text;
begin
  foreach w in array words loop
    if norm = w or norm like w || ' %' or norm like '% ' || w or norm like '% ' || w || ' %' then
      return true;
    end if;
  end loop;
  foreach w in array slurs loop
    if position(w in flat) > 0 then return true; end if;
  end loop;
  return false;
end;
$$;

-- search_path is not optional here, and its absence broke signup entirely.
--
-- This trigger fires on the insert into profiles, and that insert happens
-- inside Supabase's own handle_new_user trigger on auth.users — which is
-- SECURITY DEFINER with search_path set to ''. Inherited, that made the
-- unqualified call to name_has_profanity unresolvable, the trigger raised,
-- and the whole signup came back as "Database error saving new user". The
-- calls are schema-qualified as well, so this holds however it is invoked.
create or replace function check_display_name()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  bad boolean := false;
begin
  if new.display_name is null then return new; end if;
  if length(btrim(new.display_name)) < 2 then
    raise exception 'that name is too short';
  end if;
  if length(btrim(new.display_name)) > 32 then
    raise exception 'that name is too long';
  end if;

  -- The filter is a courtesy; an account is not. If the check itself fails for
  -- some reason of its own, let the name through rather than refuse to create
  -- the user — that asymmetry is the whole lesson of this bug.
  begin
    bad := public.name_has_profanity(new.display_name);
  exception when others then
    bad := false;
  end;

  if bad then
    raise exception 'that name is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_display_name_check on profiles;
create trigger profiles_display_name_check
  before insert or update of display_name on profiles
  for each row execute function check_display_name();
