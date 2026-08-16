-- Grow a Garden: unopened packets sit on a shelf in the greenhouse.
--
-- Buying a packet used to roll its contents immediately. Now the purchase
-- stores a sealed packet and the roll happens when you tear it open, so
-- garden_state needs somewhere to keep them: {"common": 2, "rare": 1}.
--
-- Run this in the Supabase SQL editor. Safe to re-run.

alter table garden_state
  add column if not exists packet_inventory jsonb not null default '{}'::jsonb;
