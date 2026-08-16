-- Recurring tasks.
--
-- A repeat is not a schedule that fires on its own: completing an occurrence is
-- what mints the next one (see respawnRecurring in src/pages/BoardPage.jsx).
-- That keeps a late weekly chore moving with you instead of leaving a stack of
-- unfinished copies behind, and it means no background job is required.
--
-- Run this in the Supabase SQL editor.

alter table tasks
  add column if not exists recurrence text
  check (recurrence is null or recurrence in ('daily', 'weekly', 'monthly'));

-- Only recurring rows are ever filtered on, and they're the minority.
create index if not exists tasks_recurrence_idx
  on tasks (recurrence)
  where recurrence is not null;
