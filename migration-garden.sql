-- Grow a Garden — gamification for the Personal workspace.
--
-- One row per user holds their coins, plot count, unlocked seed rarity, and
-- the single seed currently growing. Grown flowers get their own row pinned
-- to a plot index in the garden grid.
--
-- Run this in the Supabase SQL editor.

create table if not exists garden_state (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  coins                int not null default 0,
  plot_count           int not null default 12,   -- 3 x 4 starting grid
  unlocked_rarity      int not null default 1,    -- highest seed tier purchased
  growing_seed         text,                      -- seed key, null when no seed planted
  growing_started_at   timestamptz,
  growing_grow_seconds int,                       -- base grow time snapshotted at plant time
  shaved_seconds       int not null default 0,    -- total time removed by clouds
  updated_at           timestamptz not null default now()
);

create table if not exists garden_flowers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  seed_key   text not null,
  plot_index int not null,
  created_at timestamptz not null default now(),
  unique (user_id, plot_index)
);

create index if not exists garden_flowers_user_idx on garden_flowers(user_id);

alter table garden_state   enable row level security;
alter table garden_flowers enable row level security;

drop policy if exists "garden_state_all" on garden_state;
create policy "garden_state_all" on garden_state
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "garden_flowers_all" on garden_flowers;
create policy "garden_flowers_all" on garden_flowers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
