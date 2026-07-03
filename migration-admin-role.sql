-- Adds an "admin" class of team member. Admins are like members but also see
-- the team Dashboard tab (task stats, stalled tasks, workload split). The team
-- owner is always an admin-tier user. Only owners can grant/revoke admin.

-- 1. Allow 'admin' as a role on team_members.
alter table team_members
  drop constraint if exists team_members_role_check;
alter table team_members
  add constraint team_members_role_check check (role in ('owner', 'admin', 'member'));

-- 2. Owner-only RPC to promote/demote a member between 'member' and 'admin'.
--    Guards: caller must own the team, can't change their own role, and can't
--    touch the owner row or set anyone to 'owner' through this path.
create or replace function set_member_role(_team_id uuid, _user_id uuid, _role text)
returns void language plpgsql security definer as $$
begin
  if not is_team_owner(_team_id, auth.uid()) then
    raise exception 'Only the team owner can change member roles';
  end if;
  if _user_id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;
  if _role not in ('admin', 'member') then
    raise exception 'Role must be admin or member';
  end if;
  update team_members
    set role = _role
    where team_id = _team_id and user_id = _user_id and role <> 'owner';
end;
$$;

grant execute on function set_member_role(uuid, uuid, text) to authenticated;
