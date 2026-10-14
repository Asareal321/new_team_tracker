-- Fix: creating a sphere was refused.
--
-- The read policy on spheres asked can_see_sphere(id), which looks the sphere
-- up by id. On INSERT ... RETURNING (which the app uses to get the new row
-- back), Postgres checks the read policy against the new row — but the lookup
-- inside the function runs against a snapshot taken before the row existed, so
-- it found nothing and the insert failed as a policy violation.
--
-- The policy now reads the row's own columns instead of looking it up, which
-- cannot have that problem. can_see_sphere() is unchanged and still used by
-- the goal and log policies, where the sphere already exists.
--
-- Safe to re-run.

drop policy if exists spheres_read on spheres;
create policy spheres_read on spheres
  for select using (
    (team_id is null and user_id = auth.uid())
    or (team_id is not null and is_team_member(team_id, auth.uid()))
  );
