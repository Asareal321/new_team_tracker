-- Cloud overflow.
--
-- A cloud's shave can now exceed what's left on the flower it's applied to — a
-- Legendary shaves ten hours, and several species don't take that long to grow
-- in the first place. Rather than throwing the excess away, it's banked here and
-- handed to the next seed the user chooses to plant.
--
-- Run this in the Supabase SQL editor.

alter table garden_state
  add column if not exists overflow_seconds integer not null default 0;

alter table garden_state
  add constraint garden_state_overflow_nonneg
  check (overflow_seconds >= 0)
  not valid;
