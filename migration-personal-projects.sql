-- Allows personal (non-team) projects and project groups, so the "Personal"
-- workspace can also organize tasks into sprints (projects) and projects
-- (project_groups), the same two-level structure teams already have.
-- Personal rows have team_id = null and are scoped to their creator instead
-- of team membership.

alter table projects alter column team_id drop not null;
alter table project_groups alter column team_id drop not null;

drop policy if exists "projects_select" on projects;
create policy "projects_select" on projects
  for select using (
    (team_id is not null and is_team_member(team_id, auth.uid()))
    or (team_id is null and created_by = auth.uid())
  );

drop policy if exists "projects_insert" on projects;
create policy "projects_insert" on projects
  for insert with check (
    created_by = auth.uid()
    and (team_id is null or is_team_member(team_id, auth.uid()))
  );

drop policy if exists "projects_update" on projects;
create policy "projects_update" on projects
  for update using (
    (team_id is not null and is_team_member(team_id, auth.uid()))
    or (team_id is null and created_by = auth.uid())
  );

drop policy if exists "projects_delete" on projects;
create policy "projects_delete" on projects
  for delete using (
    (team_id is not null and is_team_member(team_id, auth.uid()))
    or (team_id is null and created_by = auth.uid())
  );

drop policy if exists "project_groups_select" on project_groups;
create policy "project_groups_select" on project_groups
  for select using (
    (team_id is not null and is_team_member(team_id, auth.uid()))
    or (team_id is null and created_by = auth.uid())
  );

drop policy if exists "project_groups_insert" on project_groups;
create policy "project_groups_insert" on project_groups
  for insert with check (
    created_by = auth.uid()
    and (team_id is null or is_team_member(team_id, auth.uid()))
  );

drop policy if exists "project_groups_update" on project_groups;
create policy "project_groups_update" on project_groups
  for update using (
    (team_id is not null and is_team_member(team_id, auth.uid()))
    or (team_id is null and created_by = auth.uid())
  );

drop policy if exists "project_groups_delete" on project_groups;
create policy "project_groups_delete" on project_groups
  for delete using (
    (team_id is not null and is_team_member(team_id, auth.uid()))
    or (team_id is null and created_by = auth.uid())
  );
