-- Planning hours: the two times of day when writing tasks down pays double.
--
-- One column, and a private one. It deliberately does NOT go in `stats`, which
-- is the obvious jsonb blob to reach for and is the wrong one: garden_share's
-- payload returns `stats` to anyone holding a share code, and when you sleep is
-- not something a shared garden should disclose.
--
-- Shape: { "wake": "07:00", "bed": "23:00", "effectiveFrom": "2026-08-27" }
--   effectiveFrom is the local day the current hours start counting. Changing
--   your hours writes tomorrow's date, so "bedtime is in five minutes" cannot
--   be used to mint a planning window on demand.

alter table garden_state
  add column if not exists prefs jsonb not null default '{}'::jsonb;

-- The focus record, for the same reasons and in the same trip.
--
-- When a calendar block takes over the board, everything not from that project
-- is parked — moved to the braindump with the band it was in written down here
-- so the board can be rebuilt when the hour ends. Without this the park is
-- indistinguishable from a shove into the pile.
--
-- Shape: { "blockId": "...", "projectId": "...", "projectName": "BCG",
--          "endsAt": "2026-08-26T15:00:00Z",
--          "parked": [{ "id": "...", "status": "in_progress" }] }
--        or {} when no block owns the board.

alter table garden_state
  add column if not exists focus jsonb not null default '{}'::jsonb;

-- Nothing else changes: RLS on garden_state already restricts every row to its
-- owner, and both columns are covered by the same policies. They are left out
-- of every sharing function on purpose — see garden_share_payload.
