-- Streaks, daily caps, lifetime stats and achievements.
--
-- Four jsonb blobs rather than a dozen scalar columns: these are all
-- append-shaped progress records that gain fields as achievements are added,
-- and none of them is ever queried across users.
--
--   daily        { day, seeds, coins, clouds }  counters for the local day named
--                by `day`; any bucket from an earlier day is treated as zero, so
--                no reset job is needed
--   streak       { current, best, lastDay }
--   stats        lifetime counters — tasksDone, tasksAdded, doingClears,
--                cloudsPopped, packetsOpened, flowersGrown, bestCloudTier
--   achievements { <key>: <ISO timestamp first seen unlocked> }
--
-- Achievements themselves are derived from stats, so this stores only when each
-- was first earned. Adding a new achievement later retroactively credits work
-- already recorded.
--
-- Run this in the Supabase SQL editor.

alter table garden_state
  add column if not exists daily        jsonb not null default '{}'::jsonb,
  add column if not exists streak       jsonb not null default '{}'::jsonb,
  add column if not exists stats        jsonb not null default '{}'::jsonb,
  add column if not exists achievements jsonb not null default '{}'::jsonb;
