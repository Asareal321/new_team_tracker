-- Run this once in the Supabase SQL Editor on your EXISTING database.
-- Safe & non-destructive: it only adds columns, a trigger, and backfills
-- existing rows. It does NOT drop any tables or data.
--
-- Adds task timestamps so the archive calendar works and Done tasks
-- auto-archive at end of day.

-- 1. Add the columns (no-op if already present)
alter table tasks add column if not exists updated_at timestamptz not null default now();
alter table tasks add column if not exists archived_at timestamptz;

-- 2. Keep updated_at fresh on every change
create or replace function set_task_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_task_updated_at();

-- 3. Backfill archived_at for tasks that are already archived so they
--    appear on the calendar. Use the task's most recent update (≈ when it
--    was marked Done) as the completion date, falling back to created_at
--    only when the task has no updates at all.
update tasks t
  set archived_at = coalesce(
    t.archived_at,
    (select max(tu.created_at) from task_updates tu where tu.task_id = t.id),
    t.created_at
  )
  where t.status = 'archived';

-- 3b. OPTIONAL — only if you ran an earlier version of this migration that
--     stamped archived_at with the creation date. This RE-derives the
--     completion date from each archived task's last update. It overwrites
--     archived_at for archived tasks, so run it once, then stop.
-- update tasks t
--   set archived_at = coalesce(
--     (select max(tu.created_at) from task_updates tu where tu.task_id = t.id),
--     t.created_at
--   )
--   where t.status = 'archived';
