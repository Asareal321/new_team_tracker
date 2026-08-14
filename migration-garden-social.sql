-- Visitable gardens + onboarding flag.
--
-- The wireframes make each teammate's garden viewable from the team directory
-- ("visiting is the only social mechanic — no leaderboard"). That needs a
-- read-only widening of the garden RLS: you may SELECT a garden belonging to
-- someone you share a team with. Writes stay locked to the owner.

alter table garden_state add column if not exists onboarded boolean not null default false;

-- Do you share at least one team with this user?
create or replace function shares_team_with(_other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from team_members mine
    join team_members theirs on theirs.team_id = mine.team_id
    where mine.user_id = auth.uid()
      and theirs.user_id = _other
  );
$$;

-- Split the old "for all" policies: everyone keeps full control of their own
-- garden, and teammates get SELECT only.
drop policy if exists "garden_state_all" on garden_state;
drop policy if exists "garden_state_own" on garden_state;
drop policy if exists "garden_state_read_team" on garden_state;
create policy "garden_state_own" on garden_state
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "garden_state_read_team" on garden_state
  for select using (user_id <> auth.uid() and shares_team_with(user_id));

drop policy if exists "garden_flowers_all" on garden_flowers;
drop policy if exists "garden_flowers_own" on garden_flowers;
drop policy if exists "garden_flowers_read_team" on garden_flowers;
create policy "garden_flowers_own" on garden_flowers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "garden_flowers_read_team" on garden_flowers
  for select using (user_id <> auth.uid() and shares_team_with(user_id));
