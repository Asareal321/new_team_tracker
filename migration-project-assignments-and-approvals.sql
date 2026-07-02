-- Non-destructive migration: project membership + task-assignment approvals.
-- Run this once in the Supabase SQL Editor. Does NOT drop any tables — safe
-- on a live database.
--
-- Adds:
--   1. project_members — who's assigned to a project (used to scope the
--      board's "Viewing" people-filter to project-mates, and to filter the
--      Teams page between "My Projects" and "All Projects").
--   2. Approval columns on task_assignees — an assignee (other than the
--      task's creator) starts 'pending' and must accept, decline, or
--      suggest a priority/deadline change before the task counts as live.
--   3. Two RPCs the app calls for the assignee's response and for the
--      creator's resolution of a suggested change.

-- ── 1. project_members ──────────────────────────────────────────────────
create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table project_members enable row level security;

drop policy if exists "project_members_select" on project_members;
create policy "project_members_select" on project_members
  for select using (
    exists (select 1 from projects p where p.id = project_id and is_team_member(p.team_id, auth.uid()))
  );

drop policy if exists "project_members_insert" on project_members;
create policy "project_members_insert" on project_members
  for insert with check (
    exists (select 1 from projects p where p.id = project_id and is_team_member(p.team_id, auth.uid()))
  );

drop policy if exists "project_members_delete" on project_members;
create policy "project_members_delete" on project_members
  for delete using (
    exists (select 1 from projects p where p.id = project_id and is_team_member(p.team_id, auth.uid()))
  );

alter publication supabase_realtime add table project_members;

-- ── 2. task_assignees approval columns ──────────────────────────────────
alter table task_assignees
  add column if not exists response_status text not null default 'pending'
    check (response_status in ('pending', 'accepted', 'declined', 'change_requested')),
  add column if not exists response_reason text,
  add column if not exists suggested_priority text
    check (suggested_priority in ('low', 'medium', 'high')),
  add column if not exists suggested_due_date date,
  add column if not exists responded_at timestamptz;

-- Existing assignee rows predate this feature — treat them as already
-- accepted so nothing already on a board suddenly becomes "pending".
update task_assignees set response_status = 'accepted' where response_status = 'pending';

-- ── 3. RPCs ──────────────────────────────────────────────────────────────

-- Called by an assignee to accept, decline, or suggest a change to their own
-- pending assignment. Declining removes them from the task (the app's client
-- code then shows them as un-assigned) and leaves a note on the task so the
-- creator sees the reason in the task's update feed.
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
