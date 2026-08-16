-- The fully-grown payoff cinematic plays once per grow.
--
-- "Has this grow already been celebrated?" can't be derived: a finished flower
-- sits in the greenhouse until you choose to keep or sell it, so without a flag
-- the cinematic would replay on every visit to the garden until you cleared the
-- slot. Reset when a new seed is planted.
--
-- Run this in the Supabase SQL editor.

alter table garden_state
  add column if not exists harvest_celebrated boolean not null default false;
