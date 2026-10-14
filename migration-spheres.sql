-- Spheres: the shape of the app after tasks.
--
--   area → sphere → goal → progress log
--   Academics → ECON 2220 → "A on the midterm by Nov 14" → "Did problem set 3"
--
-- The unit of the day is no longer a finished task but a logged piece of
-- progress, and each log plants something in its sphere's garden — so a
-- garden's size is a literal record of the work done there, and a sphere you
-- have neglected is visibly smaller than the others. Nothing here decays.
--
-- A fresh start: these tables sit beside the old task tables and nothing is
-- copied across. Coins and packets in garden_state carry over untouched.
--
-- Safe to re-run.

-- ── areas ────────────────────────────────────────────────────────────────
-- Personal only. A community's shared spheres have no area of their own; the
-- app shows them grouped under their community instead.
create table if not exists areas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  color      text,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists areas_user_idx on areas (user_id, position);

-- ── spheres ──────────────────────────────────────────────────────────────
-- Either personal (in one of your areas) or shared (owned by a community, and
-- logged into by all of its members). Never both, never neither.
create table if not exists spheres (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  area_id     uuid references areas(id) on delete cascade,
  team_id     uuid references teams(id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  color       text,
  position    int  not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint sphere_has_one_home check (
    (team_id is null and area_id is not null) or (team_id is not null and area_id is null)
  )
);
create index if not exists spheres_area_idx on spheres (area_id, position);
create index if not exists spheres_team_idx on spheres (team_id) where team_id is not null;

-- ── goals ────────────────────────────────────────────────────────────────
-- An end date is the one hard requirement. Everything else SMART asks for is
-- encouraged by the form, not enforced here — a goal you were nagged into
-- rewording is still your goal.
create table if not exists goals (
  id         uuid primary key default gen_random_uuid(),
  sphere_id  uuid not null references spheres(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 140),
  notes      text check (notes is null or char_length(notes) <= 1000),
  end_date   date not null,
  status     text not null default 'active' check (status in ('active', 'done', 'dropped')),
  closed_at  timestamptz,
  created_at timestamptz not null default now(),
  -- Lets a log's (goal_id, sphere_id) pair be checked against this table, so a
  -- log can never name a goal that belongs to a different sphere.
  unique (id, sphere_id)
);
create index if not exists goals_sphere_idx on goals (sphere_id, status, end_date);

-- ── progress logs ────────────────────────────────────────────────────────
-- One sentence of progress. The goal is optional — "general progress on
-- Recruiting" is still progress — but if one is named it must be in the same
-- sphere, which the composite foreign key enforces.
--
-- seed_key is what grew from this log in the sphere's garden. Stored rather
-- than derived so that buying better packets later does not repaint the
-- plants you already have.
create table if not exists progress_logs (
  id         uuid primary key default gen_random_uuid(),
  sphere_id  uuid not null references spheres(id) on delete cascade,
  goal_id    uuid,
  user_id    uuid not null references auth.users(id) on delete cascade,
  note       text not null check (char_length(btrim(note)) between 1 and 500),
  seed_key   text,
  logged_at  timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (goal_id, sphere_id) references goals (id, sphere_id) on delete set null (goal_id)
);
create index if not exists logs_sphere_idx on progress_logs (sphere_id, logged_at desc);
create index if not exists logs_user_idx   on progress_logs (user_id, logged_at desc);
create index if not exists logs_goal_idx   on progress_logs (goal_id) where goal_id is not null;

-- ── who can see a sphere ─────────────────────────────────────────────────
-- The one question every policy below asks. SECURITY DEFINER so the policies
-- on goals and logs can ask it without recursing through the spheres policy.
create or replace function can_see_sphere(_sphere uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from spheres s
    where s.id = _sphere
      and (
        (s.team_id is null and s.user_id = auth.uid())
        or (s.team_id is not null and is_team_member(s.team_id, auth.uid()))
      )
  )
$$;

-- Who may rename, archive or delete a sphere: its creator, or for a shared
-- sphere, the community's owner too.
create or replace function can_manage_sphere(_sphere uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from spheres s
    where s.id = _sphere
      and (
        s.user_id = auth.uid()
        or (s.team_id is not null and is_team_owner(s.team_id, auth.uid()))
      )
  )
$$;

alter table areas         enable row level security;
alter table spheres       enable row level security;
alter table goals         enable row level security;
alter table progress_logs enable row level security;

-- areas: yours alone.
drop policy if exists areas_own on areas;
create policy areas_own on areas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- spheres
drop policy if exists spheres_read   on spheres;
drop policy if exists spheres_insert on spheres;
drop policy if exists spheres_update on spheres;
drop policy if exists spheres_delete on spheres;
-- Reads the row's own columns rather than calling can_see_sphere(id): on
-- INSERT ... RETURNING the function's lookup runs against a snapshot from
-- before the row existed and finds nothing, refusing every new sphere.
create policy spheres_read on spheres
  for select using (
    (team_id is null and user_id = auth.uid())
    or (team_id is not null and is_team_member(team_id, auth.uid()))
  );
create policy spheres_insert on spheres
  for insert with check (
    user_id = auth.uid()
    and (
      (team_id is null and exists (select 1 from areas a where a.id = area_id and a.user_id = auth.uid()))
      or (team_id is not null and is_team_member(team_id, auth.uid()))
    )
  );
create policy spheres_update on spheres
  for update using (can_manage_sphere(id)) with check (can_manage_sphere(id));
create policy spheres_delete on spheres
  for delete using (can_manage_sphere(id));

-- goals: visible with their sphere. On a shared sphere anyone can add a goal;
-- only its author (or whoever manages the sphere) can change it.
drop policy if exists goals_read   on goals;
drop policy if exists goals_insert on goals;
drop policy if exists goals_change on goals;
drop policy if exists goals_delete on goals;
create policy goals_read on goals
  for select using (can_see_sphere(sphere_id));
create policy goals_insert on goals
  for insert with check (user_id = auth.uid() and can_see_sphere(sphere_id));
create policy goals_change on goals
  for update using (user_id = auth.uid() or can_manage_sphere(sphere_id))
  with check (can_see_sphere(sphere_id));
create policy goals_delete on goals
  for delete using (user_id = auth.uid() or can_manage_sphere(sphere_id));

-- logs: everyone in the sphere sees them; each person writes only their own.
drop policy if exists logs_read   on progress_logs;
drop policy if exists logs_insert on progress_logs;
drop policy if exists logs_change on progress_logs;
drop policy if exists logs_delete on progress_logs;
create policy logs_read on progress_logs
  for select using (can_see_sphere(sphere_id));
create policy logs_insert on progress_logs
  for insert with check (user_id = auth.uid() and can_see_sphere(sphere_id));
create policy logs_change on progress_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid() and can_see_sphere(sphere_id));
create policy logs_delete on progress_logs
  for delete using (user_id = auth.uid());
