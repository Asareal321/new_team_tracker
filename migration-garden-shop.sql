-- Grow a Garden — seed tray.
--
-- Completing a task now banks a seed and some coins. Seeds are the currency
-- you spend to put a plant in the ground; coins are what the shop takes to
-- unlock new species. Run this in the Supabase SQL editor.

alter table garden_state add column if not exists seeds int not null default 0;
