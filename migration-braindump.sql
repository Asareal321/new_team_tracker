-- Braindump: an unsorted pile that sits before the board.
--
-- Captured items are real task rows from the moment they're typed — same table,
-- same ownership, same realtime — they just carry a status the board doesn't
-- render. Triaging one is a plain status change, so nothing has to be copied
-- between tables and an item can't be lost in transit.
--
-- Run this in the Supabase SQL editor.

alter table tasks drop constraint if exists tasks_status_check;

alter table tasks
  add constraint tasks_status_check
  check (status in ('braindump', 'todo', 'in_progress', 'done', 'archived'));

-- The pile is read on its own, oldest first.
create index if not exists tasks_braindump_idx
  on tasks (user_id, created_at)
  where status = 'braindump';
