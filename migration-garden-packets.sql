-- Seed packets.
--
-- You no longer buy a species directly — you buy a packet and roll for what's
-- inside, so owned seeds have to be tracked per species. unlocked_rarity is
-- retired by this change; it's left in place rather than dropped so an older
-- build still running against this database doesn't break.

alter table garden_state
  add column if not exists seed_inventory jsonb not null default '{}'::jsonb;
