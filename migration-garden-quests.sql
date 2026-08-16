-- Daily quests.
--
-- One jsonb blob, and a small one: which of today's three quests have been
-- claimed.
--
--   quests  { day: 'YYYY-MM-DD', claimed: [<quest key>, ...] }
--
-- Nothing else is stored. Which three quests a day offers is a pure function
-- of the date (see src/lib/quests.js), and progress is read from the `daily`
-- bucket that migration-garden-progress.sql already added — so a quest can't
-- be rerolled by reloading, and the whole board rotates at the user's own
-- midnight with no reset job.
--
-- A record whose `day` isn't today is treated as no claims at all, exactly as
-- `daily` is, so yesterday's row needs no cleanup.
--
-- Run this in the Supabase SQL editor.

alter table garden_state
  add column if not exists quests jsonb not null default '{}'::jsonb;
