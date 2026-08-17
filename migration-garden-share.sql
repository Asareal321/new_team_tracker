-- Shareable gardens.
--
-- Visiting used to require sharing a team: RLS let you SELECT the garden of
-- anyone in one of your teams (see migration-garden-social.sql). A share code
-- is the other half — a string you can hand to someone who isn't in your
-- community at all.
--
-- The code deliberately does NOT widen RLS. Opening `garden_state` to "anyone
-- who knows a code" would mean a policy that can't check what the reader typed,
-- so instead there are two security-definer functions: one mints your code, one
-- returns a single garden by code. Nothing else about the row becomes readable,
-- and the payload below is the whole of what a visitor can ever see.
--
-- Run this in the Supabase SQL editor.

alter table garden_state
  add column if not exists share_code text;

create unique index if not exists garden_state_share_code_key
  on garden_state (share_code)
  where share_code is not null;

-- Codes are read aloud and typed in, so the alphabet drops the characters that
-- get confused for each other: no O/0, no I/1, no L.
create or replace function generate_garden_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789',
           floor(random() * 31)::int + 1, 1), '')
  from generate_series(1, 6);
$$;

-- Your code, minted on first use. Idempotent: calling it again returns the same
-- code rather than rotating it, so a code you've already given out keeps working.
create or replace function my_garden_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  code text;
  tries int := 0;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select share_code into code from garden_state where user_id = auth.uid();
  if code is not null then
    return code;
  end if;

  -- The unique index is the authority on collisions; this just retries.
  loop
    tries := tries + 1;
    code := generate_garden_code();
    begin
      insert into garden_state (user_id, share_code) values (auth.uid(), code)
      on conflict (user_id) do update set share_code = excluded.share_code;
      return code;
    exception when unique_violation then
      if tries >= 8 then raise; end if;
    end;
  end loop;
end;
$$;

-- Deliberately separate from my_garden_code(): rotating is a decision ("stop
-- letting the old code in"), not something that should happen because a page
-- loaded.
create or replace function reset_garden_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  update garden_state set share_code = null where user_id = auth.uid();
  return my_garden_code();
end;
$$;

-- One garden, by code. This is the entire visitor payload — no email, no task
-- data, no coins-spent history, and no columns that could be written back.
-- Signed-in only, so a code that leaks still isn't a public URL.
create or replace function garden_by_code(_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'user_id',              gs.user_id,
    'display_name',         coalesce(p.display_name, 'A gardener'),
    'plot_count',           gs.plot_count,
    'discovered',           coalesce(gs.discovered, '{}'::jsonb),
    'achievements',         coalesce(gs.achievements, '{}'::jsonb),
    'stats',                coalesce(gs.stats, '{}'::jsonb),
    'streak',               coalesce(gs.streak, '{}'::jsonb),
    'growing_seed',         gs.growing_seed,
    'growing_started_at',   gs.growing_started_at,
    'growing_grow_seconds', gs.growing_grow_seconds,
    'shaved_seconds',       gs.shaved_seconds,
    'flowers', coalesce((
      select jsonb_agg(jsonb_build_object('seed_key', f.seed_key, 'plot_index', f.plot_index))
      from garden_flowers f where f.user_id = gs.user_id
    ), '[]'::jsonb)
  )
  from garden_state gs
  left join profiles p on p.id = gs.user_id
  where gs.share_code = upper(btrim(_code))
    and auth.uid() is not null;
$$;

revoke all on function my_garden_code()      from anon;
revoke all on function reset_garden_code()   from anon;
revoke all on function garden_by_code(text)  from anon;
grant execute on function my_garden_code()     to authenticated;
grant execute on function reset_garden_code()  to authenticated;
grant execute on function garden_by_code(text) to authenticated;
