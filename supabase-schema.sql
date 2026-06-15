-- Run this entire file in the Supabase SQL Editor.
-- This is a full rewrite of the schema for the multi-user team tracker.
-- Safe to re-run: it drops any existing tables/trigger from this schema
-- (or the earlier single-table version, which only had sample data) first.

-- ============================================================
-- Drop existing objects (safe to re-run)
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists tasks cascade;
drop table if exists projects cascade;
drop table if exists team_invites cascade;
drop table if exists team_members cascade;
drop table if exists teams cascade;
drop table if exists profiles cascade;

-- ============================================================
-- Tables
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  code text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed')),
  start_date date,
  target_date date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  assignee_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Helper functions (security definer to avoid RLS recursion)
-- ============================================================

create or replace function is_team_member(_team_id uuid, _user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from team_members
    where team_id = _team_id and user_id = _user_id
  );
$$;

create or replace function is_team_owner(_team_id uuid, _user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from team_members
    where team_id = _team_id and user_id = _user_id and role = 'owner'
  );
$$;

-- ============================================================
-- RPCs for team creation / invite redemption
-- ============================================================

create or replace function create_team(_name text)
returns uuid language plpgsql security definer as $$
declare
  _team_id uuid;
begin
  insert into teams (name, created_by) values (_name, auth.uid()) returning id into _team_id;
  insert into team_members (team_id, user_id, role) values (_team_id, auth.uid(), 'owner');
  return _team_id;
end;
$$;

create or replace function join_team_with_code(_code text)
returns uuid language plpgsql security definer as $$
declare
  _team_id uuid;
begin
  select team_id into _team_id from team_invites where code = _code;
  if _team_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into team_members (team_id, user_id, role)
  values (_team_id, auth.uid(), 'member')
  on conflict (team_id, user_id) do nothing;

  return _team_id;
end;
$$;

grant execute on function create_team(text) to authenticated;
grant execute on function join_team_with_code(text) to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_invites enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;

-- profiles: any signed-in user can read profiles (needed to show teammate
-- names), but can only edit their own row.
create policy "profiles_select" on profiles
  for select using (auth.uid() is not null);

create policy "profiles_insert_self" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_self" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- teams: members can read; owners can update/delete. Inserts happen via
-- create_team() (security definer), so no direct insert policy is needed.
create policy "teams_select" on teams
  for select using (is_team_member(id, auth.uid()));

create policy "teams_update_owner" on teams
  for update using (is_team_owner(id, auth.uid()));

create policy "teams_delete_owner" on teams
  for delete using (is_team_owner(id, auth.uid()));

-- team_members: members can read the roster; rows are written via
-- create_team()/join_team_with_code() (security definer). Users can leave a
-- team themselves, and owners can remove members.
create policy "team_members_select" on team_members
  for select using (is_team_member(team_id, auth.uid()));

create policy "team_members_delete" on team_members
  for delete using (user_id = auth.uid() or is_team_owner(team_id, auth.uid()));

-- team_invites: only owners can view/create invite codes for their team.
-- Redemption happens via join_team_with_code() (security definer), which
-- can read codes regardless of this policy.
create policy "team_invites_select" on team_invites
  for select using (is_team_owner(team_id, auth.uid()));

create policy "team_invites_insert" on team_invites
  for insert with check (is_team_owner(team_id, auth.uid()) and created_by = auth.uid());

create policy "team_invites_delete" on team_invites
  for delete using (is_team_owner(team_id, auth.uid()));

-- projects: any team member can read/write their team's projects.
create policy "projects_select" on projects
  for select using (is_team_member(team_id, auth.uid()));

create policy "projects_insert" on projects
  for insert with check (is_team_member(team_id, auth.uid()) and created_by = auth.uid());

create policy "projects_update" on projects
  for update using (is_team_member(team_id, auth.uid()));

create policy "projects_delete" on projects
  for delete using (is_team_member(team_id, auth.uid()));

-- tasks: visible/editable if you created it, you're the assignee, or it
-- belongs to a team you're a member of. Personal tasks (team_id is null)
-- are only visible to their creator/assignee.
create policy "tasks_select" on tasks
  for select using (
    user_id = auth.uid()
    or assignee_id = auth.uid()
    or (team_id is not null and is_team_member(team_id, auth.uid()))
  );

create policy "tasks_insert" on tasks
  for insert with check (
    user_id = auth.uid()
    and (team_id is null or is_team_member(team_id, auth.uid()))
  );

create policy "tasks_update" on tasks
  for update using (
    user_id = auth.uid()
    or assignee_id = auth.uid()
    or (team_id is not null and is_team_member(team_id, auth.uid()))
  );

create policy "tasks_delete" on tasks
  for delete using (
    user_id = auth.uid()
    or assignee_id = auth.uid()
    or (team_id is not null and is_team_member(team_id, auth.uid()))
  );

-- ============================================================
-- Realtime
-- ============================================================

alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table team_members;
