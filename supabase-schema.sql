-- Run this entire file in the Supabase SQL Editor.
-- This is a full rewrite of the schema for the multi-user team tracker.
-- Safe to re-run: it drops any existing tables/trigger from this schema
-- (or the earlier single-table version, which only had sample data) first.

-- ============================================================
-- Drop existing objects (safe to re-run)
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists task_updates cascade;
drop table if exists tasks cascade;
drop table if exists project_members cascade;
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
  invite_code text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
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

create table project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'archived')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  assignee_id uuid references profiles(id) on delete set null,
  position float8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create or replace function set_task_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_task_updated_at();

create table task_assignees (
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  -- An assignee (other than the task's creator) starts 'pending' and must
  -- accept, decline, or suggest a priority/deadline change before the task
  -- counts as live — see respond_to_task_assignment() below.
  response_status text not null default 'pending'
    check (response_status in ('pending', 'accepted', 'declined', 'change_requested')),
  response_reason text,
  suggested_priority text check (suggested_priority in ('low', 'medium', 'high')),
  suggested_due_date date,
  responded_at timestamptz,
  primary key (task_id, user_id)
);

create table task_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
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

create or replace function can_access_task(_task_id uuid, _user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from tasks
    where id = _task_id
      and (
        user_id = _user_id
        or assignee_id = _user_id
        or (team_id is not null and is_team_member(team_id, _user_id))
      )
  );
$$;

-- ============================================================
-- RPCs for team creation / invite redemption
-- ============================================================

create or replace function create_team(_name text)
returns uuid language plpgsql security definer as $$
declare
  _team_id uuid;
  _code    text;
begin
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

grant execute on function create_team(text) to authenticated;
grant execute on function join_team_with_code(text) to authenticated;

-- ============================================================
-- RPCs for task-assignment approvals
-- ============================================================

-- Called by an assignee to accept, decline, or suggest a change to their own
-- pending assignment. Declining removes them from the task and leaves a note
-- on the task so the creator sees the reason in the task's update feed.
create or replace function respond_to_task_assignment(
  _task_id uuid,
  _response text,
  _reason text default null,
  _suggested_priority text default null,
  _suggested_due_date date default null
) returns void language plpgsql security definer as $$
declare
  _responder_name text;
begin
  if not exists (select 1 from task_assignees where task_id = _task_id and user_id = auth.uid()) then
    raise exception 'You are not an assignee on this task';
  end if;

  select display_name into _responder_name from profiles where id = auth.uid();

  if _response = 'accepted' then
    update task_assignees
      set response_status = 'accepted', response_reason = null,
          suggested_priority = null, suggested_due_date = null, responded_at = now()
      where task_id = _task_id and user_id = auth.uid();

  elsif _response = 'declined' then
    if _reason is null or trim(_reason) = '' then
      raise exception 'A reason is required to decline an assignment';
    end if;
    insert into task_updates (task_id, user_id, body)
      values (_task_id, auth.uid(), coalesce(_responder_name, 'Someone') || ' declined this assignment: ' || _reason);
    delete from task_assignees where task_id = _task_id and user_id = auth.uid();

  elsif _response = 'change_requested' then
    if _reason is null or trim(_reason) = '' then
      raise exception 'A reason is required to suggest a change';
    end if;
    update task_assignees
      set response_status = 'change_requested', response_reason = _reason,
          suggested_priority = _suggested_priority, suggested_due_date = _suggested_due_date,
          responded_at = now()
      where task_id = _task_id and user_id = auth.uid();

  else
    raise exception 'Invalid response type: %', _response;
  end if;
end;
$$;

grant execute on function respond_to_task_assignment(uuid, text, text, text, date) to authenticated;

-- Called by the task's creator to apply or dismiss a suggested change from
-- one assignee. Applying updates the task and marks that assignee accepted;
-- dismissing resets them to pending so they can accept/decline the original.
create or replace function resolve_change_request(
  _task_id uuid,
  _assignee_id uuid,
  _apply boolean
) returns void language plpgsql security definer as $$
declare
  _creator uuid;
  _row task_assignees%rowtype;
begin
  select user_id into _creator from tasks where id = _task_id;
  if _creator is null then raise exception 'Task not found'; end if;
  if _creator != auth.uid() then raise exception 'Only the task creator can resolve a suggested change'; end if;

  select * into _row from task_assignees where task_id = _task_id and user_id = _assignee_id;
  if not found then raise exception 'Assignment not found'; end if;

  if _apply then
    update tasks set
      priority = coalesce(_row.suggested_priority, priority),
      due_date = case when _row.suggested_due_date is not null then _row.suggested_due_date else due_date end
      where id = _task_id;
    update task_assignees
      set response_status = 'accepted', response_reason = null,
          suggested_priority = null, suggested_due_date = null, responded_at = now()
      where task_id = _task_id and user_id = _assignee_id;
  else
    update task_assignees
      set response_status = 'pending', response_reason = null,
          suggested_priority = null, suggested_due_date = null
      where task_id = _task_id and user_id = _assignee_id;
    insert into task_updates (task_id, user_id, body)
      values (_task_id, auth.uid(), 'Kept the original priority/deadline — please accept or decline.');
  end if;
end;
$$;

grant execute on function resolve_change_request(uuid, uuid, boolean) to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_invites enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_updates enable row level security;

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

-- project_members: who's assigned to a project. Any team member can read or
-- manage membership for their team's projects (same trust level as the
-- projects table itself).
create policy "project_members_select" on project_members
  for select using (
    exists (select 1 from projects p where p.id = project_id and is_team_member(p.team_id, auth.uid()))
  );

create policy "project_members_insert" on project_members
  for insert with check (
    exists (select 1 from projects p where p.id = project_id and is_team_member(p.team_id, auth.uid()))
  );

create policy "project_members_delete" on project_members
  for delete using (
    exists (select 1 from projects p where p.id = project_id and is_team_member(p.team_id, auth.uid()))
  );

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

-- task_assignees: readable/writable by anyone who can access the parent task.
create policy "task_assignees_select" on task_assignees
  for select using (can_access_task(task_id, auth.uid()));

create policy "task_assignees_insert" on task_assignees
  for insert with check (can_access_task(task_id, auth.uid()));

create policy "task_assignees_delete" on task_assignees
  for delete using (can_access_task(task_id, auth.uid()));

-- task_updates: visible/writable by anyone who can access the parent task.
-- Each update is a short note logging progress for a given day; only the
-- author can delete their own update.
create policy "task_updates_select" on task_updates
  for select using (can_access_task(task_id, auth.uid()));

create policy "task_updates_insert" on task_updates
  for insert with check (can_access_task(task_id, auth.uid()) and user_id = auth.uid());

create policy "task_updates_delete" on task_updates
  for delete using (user_id = auth.uid());

-- ============================================================
-- Realtime
-- ============================================================

alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_assignees;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table project_members;
alter publication supabase_realtime add table team_members;
alter publication supabase_realtime add table task_updates;
