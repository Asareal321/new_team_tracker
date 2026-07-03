-- Adds a "Projects" grouping level above what used to be called "projects"
-- (now labeled "Sprints" in the UI, table name unchanged to avoid churn).
-- A project_group can contain many sprints; a sprint belongs to at most one group.

create table if not exists project_groups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table projects
  add column if not exists group_id uuid references project_groups(id) on delete set null;

alter table project_groups enable row level security;

drop policy if exists "project_groups_select" on project_groups;
create policy "project_groups_select" on project_groups
  for select using (is_team_member(team_id, auth.uid()));

drop policy if exists "project_groups_insert" on project_groups;
create policy "project_groups_insert" on project_groups
  for insert with check (is_team_member(team_id, auth.uid()));

drop policy if exists "project_groups_update" on project_groups;
create policy "project_groups_update" on project_groups
  for update using (is_team_member(team_id, auth.uid()));

drop policy if exists "project_groups_delete" on project_groups;
create policy "project_groups_delete" on project_groups
  for delete using (is_team_member(team_id, auth.uid()));

alter publication supabase_realtime add table project_groups;
