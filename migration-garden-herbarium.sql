-- Herbarium: a permanent record of every species you have ever found.
--
-- This can't be derived from what you currently hold — selling a flower or
-- planting your last seed of a species would erase it from your collection —
-- so the count of how many of each species you've ever obtained is stored
-- outright. Shape: { "<seed_key>": <count ever found> }.
--
-- Existing accounts are backfilled on first load from whatever they still hold
-- (seed tray, the growing slot, planted beds), so nobody starts at zero.
--
-- Run this in the Supabase SQL editor.

alter table garden_state
  add column if not exists discovered jsonb not null default '{}'::jsonb;
