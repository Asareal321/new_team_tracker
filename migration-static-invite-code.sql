-- Non-destructive migration: add a permanent invite_code to each team.
-- Run this once in the Supabase SQL Editor.
-- Does NOT drop any tables — safe on a live database.

-- ── 1. Add invite_code column ──────────────────────────────────────────
alter table teams
  add column if not exists invite_code text unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

-- ── 2. Backfill any teams that got a NULL code (shouldn't happen, but safe) ──
update teams
  set invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  where invite_code is null;

-- ── 3. Make the column non-nullable now that all rows have a value ──────
alter table teams
  alter column invite_code set not null;

-- ── 4. Replace create_team() — auto-generates invite_code on creation ──
create or replace function create_team(_name text)
returns uuid language plpgsql security definer as $$
declare
  _team_id uuid;
  _code    text;
begin
  -- generate a unique 8-char code, retrying on collision
  loop
    _code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    exit when not exists (select 1 from teams where invite_code = _code);
  end loop;

  insert into teams (name, created_by, invite_code)
    values (_name, auth.uid(), _code)
    returning id into _team_id;

  insert into team_members (team_id, user_id, role)
    values (_team_id, auth.uid(), 'owner');

  return _team_id;
end;
$$;

-- ── 5. Replace join_team_with_code() — looks up teams.invite_code ──────
create or replace function join_team_with_code(_code text)
returns uuid language plpgsql security definer as $$
declare
  _team_id uuid;
begin
  select id into _team_id from teams where invite_code = _code;
  if _team_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into team_members (team_id, user_id, role)
    values (_team_id, auth.uid(), 'member')
    on conflict (team_id, user_id) do nothing;

  return _team_id;
end;
$$;

-- ── 6. RLS: let team members read their team's invite_code ─────────────
-- The teams table already has an RLS policy allowing members to select.
-- invite_code is just another column — no extra policy needed.
-- (team_invites table is now unused but left in place — harmless.)
