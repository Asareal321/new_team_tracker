-- Friends, a directory, and a marketplace.
--
-- Three things, one file, so it is run once.
--
--   1. profiles.is_public  — whether you appear in the directory at all
--   2. friendships          — request, then accept; nothing is mutual until it is
--   3. market_listings      — flowers and packets, listed for coins
--
-- The pattern follows migration-garden-share.sql: RLS is never widened to "any
-- signed-in user", because a policy cannot check what someone typed into a
-- search box or whether they are allowed to see a garden. Instead every
-- cross-user read is a SECURITY DEFINER function returning a fixed payload, and
-- every cross-user write is a SECURITY DEFINER function that does the whole
-- exchange in one statement.
--
-- Run this in the Supabase SQL editor.


-- ── 1. profile visibility ───────────────────────────────────────────────────

-- Private by default, deliberately. Appearing in a browsable list of everyone
-- who uses the app is a thing to opt into; defaulting it on would publish every
-- existing account on the day this migration runs, which is not a choice this
-- file gets to make on their behalf.
alter table profiles
  add column if not exists is_public boolean not null default false;

create index if not exists profiles_public_idx on profiles (is_public) where is_public;


-- ── 2. friendships ──────────────────────────────────────────────────────────

create table if not exists friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendship_not_self check (requester_id <> addressee_id)
);

-- One row per ordered pair. The reverse direction is blocked in the request
-- function rather than here, because a constraint cannot express "and not the
-- mirror of an existing row".
create unique index if not exists friendships_pair_idx
  on friendships (requester_id, addressee_id);
create index if not exists friendships_addressee_idx on friendships (addressee_id, status);
create index if not exists friendships_requester_idx on friendships (requester_id, status);

alter table friendships enable row level security;

-- You can see a friendship you are in, and nothing else.
drop policy if exists friendships_read on friendships;
create policy friendships_read on friendships
  for select using (auth.uid() in (requester_id, addressee_id));

-- Accepting is the only field a user changes directly, and only the person who
-- was asked can do it.
drop policy if exists friendships_respond on friendships;
create policy friendships_respond on friendships
  for update using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- Either side can walk away: the requester withdraws, the addressee declines or
-- unfriends.
drop policy if exists friendships_delete on friendships;
create policy friendships_delete on friendships
  for delete using (auth.uid() in (requester_id, addressee_id));

-- Are these two actually friends? Used by every function that hands over
-- someone else's data.
create or replace function are_friends(_a uuid, _b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = _a and addressee_id = _b)
        or (requester_id = _b and addressee_id = _a))
  );
$$;

-- Send a request. Idempotent in the ways that matter: asking twice is a no-op,
-- and asking someone who has already asked you accepts theirs instead of
-- creating a second row pointing the other way.
create or replace function request_friend(_addressee uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  existing friendships%rowtype;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _addressee = auth.uid() then raise exception 'cannot friend yourself'; end if;

  select * into existing from friendships
  where (requester_id = auth.uid() and addressee_id = _addressee)
     or (requester_id = _addressee and addressee_id = auth.uid());

  if found then
    -- They asked first: this is an acceptance, not a new request.
    if existing.status = 'pending' and existing.addressee_id = auth.uid() then
      update friendships set status = 'accepted', responded_at = now()
      where id = existing.id;
      return 'accepted';
    end if;
    return existing.status;
  end if;

  insert into friendships (requester_id, addressee_id) values (auth.uid(), _addressee);
  return 'pending';
end;
$$;

create or replace function respond_friend(_id uuid, _accept boolean)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;

  if _accept then
    update friendships set status = 'accepted', responded_at = now()
    where id = _id and addressee_id = auth.uid() and status = 'pending';
    if not found then raise exception 'no such request'; end if;
    return 'accepted';
  end if;

  delete from friendships where id = _id and addressee_id = auth.uid();
  return 'declined';
end;
$$;

-- Ending a friendship, from either side.
create or replace function unfriend(_other uuid)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  delete from friendships
  where auth.uid() is not null
    and ((requester_id = auth.uid() and addressee_id = _other)
      or (requester_id = _other and addressee_id = auth.uid()));
$$;


-- ── 3. the directory ────────────────────────────────────────────────────────

-- One person as the directory sees them. Name, whether they are public, and
-- where you stand with them. No email, ever.
create or replace function directory_row(_id uuid, _name text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', _id,
    'display_name', coalesce(_name, 'A gardener'),
    'status', coalesce((
      select case
        when f.status = 'accepted' then 'friends'
        when f.requester_id = auth.uid() then 'requested'
        else 'awaiting-you'
      end
      from friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = _id)
         or (f.requester_id = _id and f.addressee_id = auth.uid())
      limit 1
    ), 'none')
  );
$$;

-- The browsable list: public profiles only. This is the whole reason
-- is_public exists — a private account is never in this result at any offset.
create or replace function browse_profiles(_limit int default 50, _offset int default 0)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(directory_row(p.id, p.display_name) order by p.display_name), '[]'::jsonb)
  from (
    select id, display_name from profiles
    where is_public
      and id <> auth.uid()
      and auth.uid() is not null
    order by display_name
    limit greatest(0, least(_limit, 100)) offset greatest(0, _offset)
  ) p;
$$;

-- Search. Public profiles match on a fragment; private ones only on the whole
-- display name, exactly.
--
-- That asymmetry is the privacy promise: a private account cannot be discovered
-- by typing two letters and reading what comes back, because a fragment never
-- matches one. You have to already know the name to find it, which is what
-- "findable by name but not listed" has to mean to be worth anything.
create or replace function search_profiles(_query text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with q as (select btrim(coalesce(_query, '')) as raw)
  select coalesce(jsonb_agg(directory_row(p.id, p.display_name) order by p.display_name), '[]'::jsonb)
  from profiles p, q
  where auth.uid() is not null
    and length(q.raw) > 0
    and p.id <> auth.uid()
    and (
      (p.is_public and p.display_name ilike '%' || q.raw || '%')
      or
      (not p.is_public and lower(p.display_name) = lower(q.raw))
    );
$$;

-- Your friends, and the requests waiting on you.
create or replace function my_friends()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'display_name', coalesce(p.display_name, 'A gardener')
      ) order by p.display_name)
      from friendships f
      join profiles p on p.id = case when f.requester_id = auth.uid()
                                     then f.addressee_id else f.requester_id end
      where f.status = 'accepted'
        and auth.uid() in (f.requester_id, f.addressee_id)
    ), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'user_id', p.id,
        'display_name', coalesce(p.display_name, 'A gardener'),
        'created_at', f.created_at
      ) order by f.created_at desc)
      from friendships f
      join profiles p on p.id = f.requester_id
      where f.status = 'pending' and f.addressee_id = auth.uid()
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'user_id', p.id,
        'display_name', coalesce(p.display_name, 'A gardener')
      ) order by p.display_name)
      from friendships f
      join profiles p on p.id = f.addressee_id
      where f.status = 'pending' and f.requester_id = auth.uid()
    ), '[]'::jsonb)
  )
  where auth.uid() is not null;
$$;


-- ── 4. a friend's garden ────────────────────────────────────────────────────

-- Deliberately narrower than garden_by_code: the beds and the herbarium, and
-- nothing else. No streak, no awards, no stats, no coins — those are the
-- visitor payload for someone you handed a code to, and a friend list is a
-- larger and more permanent audience than that.
create or replace function friend_garden(_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'user_id',      gs.user_id,
    'display_name', coalesce(p.display_name, 'A gardener'),
    'plot_count',   gs.plot_count,
    'discovered',   coalesce(gs.discovered, '{}'::jsonb),
    'flowers', coalesce((
      select jsonb_agg(jsonb_build_object('seed_key', f.seed_key, 'plot_index', f.plot_index))
      from garden_flowers f where f.user_id = gs.user_id
    ), '[]'::jsonb)
  )
  from garden_state gs
  left join profiles p on p.id = gs.user_id
  where gs.user_id = _user_id
    and auth.uid() is not null
    and are_friends(auth.uid(), _user_id);
$$;


-- ── 5. the marketplace ──────────────────────────────────────────────────────

create table if not exists market_listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('flower', 'packet')),
  item_key    text not null,          -- seed_key for a flower, packet_key for a packet
  price       int  not null check (price > 0 and price <= 1000000),
  status      text not null default 'open' check (status in ('open', 'sold', 'cancelled')),
  buyer_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);

create index if not exists market_open_idx on market_listings (status, created_at desc) where status = 'open';
create index if not exists market_seller_idx on market_listings (seller_id, status);

alter table market_listings enable row level security;

-- Open listings are public to signed-in users — that is what a marketplace is.
-- Your own are always visible so you can see what you have sold.
drop policy if exists market_read on market_listings;
create policy market_read on market_listings
  for select using (
    auth.uid() is not null
    and (status = 'open' or seller_id = auth.uid() or buyer_id = auth.uid())
  );

-- Everything that writes goes through a function, so there is no insert,
-- update or delete policy at all. Listing something has to take it out of your
-- garden in the same breath, and no client-side policy can guarantee that.

-- List a flower. The flower leaves your beds now rather than at sale: it is
-- held by the listing itself. Otherwise you could list a flower, compost it,
-- and still have someone pay for it.
create or replace function list_flower(_flower_id uuid, _price int)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  f garden_flowers%rowtype;
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _price is null or _price <= 0 then raise exception 'price must be above zero'; end if;

  select * into f from garden_flowers where id = _flower_id and user_id = auth.uid();
  if not found then raise exception 'that flower is not yours'; end if;

  delete from garden_flowers where id = f.id;

  insert into market_listings (seller_id, kind, item_key, price)
  values (auth.uid(), 'flower', f.seed_key)
  returning id into new_id;

  return new_id;
end;
$$;

-- List a packet. Same idea: the packet comes off your shelf now.
create or replace function list_packet(_packet_key text, _price int)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  held int;
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _price is null or _price <= 0 then raise exception 'price must be above zero'; end if;

  select coalesce((packet_inventory ->> _packet_key)::int, 0) into held
  from garden_state where user_id = auth.uid();
  if coalesce(held, 0) < 1 then raise exception 'you have none of those'; end if;

  update garden_state
  set packet_inventory = jsonb_set(
        coalesce(packet_inventory, '{}'::jsonb), array[_packet_key], to_jsonb(held - 1))
  where user_id = auth.uid();

  insert into market_listings (seller_id, kind, item_key, price)
  values (auth.uid(), 'packet', _packet_key)
  returning id into new_id;

  return new_id;
end;
$$;

-- Take it back. The item returns to wherever it came from.
create or replace function cancel_listing(_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  l market_listings%rowtype;
  free_plot int;
  held int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;

  select * into l from market_listings
  where id = _id and seller_id = auth.uid() and status = 'open'
  for update;
  if not found then raise exception 'no such listing'; end if;

  if l.kind = 'flower' then
    select coalesce(min(i), 0) into free_plot
    from generate_series(0, 199) i
    where not exists (
      select 1 from garden_flowers g where g.user_id = auth.uid() and g.plot_index = i
    );
    insert into garden_flowers (user_id, seed_key, plot_index)
    values (auth.uid(), l.item_key, free_plot);
  else
    select coalesce((packet_inventory ->> l.item_key)::int, 0) into held
    from garden_state where user_id = auth.uid();
    update garden_state
    set packet_inventory = jsonb_set(
          coalesce(packet_inventory, '{}'::jsonb), array[l.item_key], to_jsonb(coalesce(held, 0) + 1))
    where user_id = auth.uid();
  end if;

  update market_listings set status = 'cancelled', closed_at = now() where id = l.id;
end;
$$;

-- Buy. One transaction: the listing is locked, the coins move, the item moves,
-- and the listing closes. If any of it raises, none of it happened — which is
-- the only acceptable behaviour when the alternative is a flower that exists
-- twice or coins that exist not at all.
create or replace function buy_listing(_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  l market_listings%rowtype;
  buyer_coins int;
  free_plot int;
  held int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;

  -- FOR UPDATE is what stops two people buying the same listing: the second
  -- waits, then finds it is no longer open.
  select * into l from market_listings where id = _id for update;
  if not found then raise exception 'no such listing'; end if;
  if l.status <> 'open' then raise exception 'that has already gone'; end if;
  if l.seller_id = auth.uid() then raise exception 'that is your own listing'; end if;

  select coalesce(coins, 0) into buyer_coins from garden_state where user_id = auth.uid() for update;
  if coalesce(buyer_coins, 0) < l.price then raise exception 'not enough coins'; end if;

  update garden_state set coins = coins - l.price where user_id = auth.uid();

  -- The seller's row is created if it somehow does not exist, so a sale can
  -- never be lost because the other side has never opened the garden.
  insert into garden_state (user_id, coins) values (l.seller_id, l.price)
  on conflict (user_id) do update set coins = coalesce(garden_state.coins, 0) + l.price;

  if l.kind = 'flower' then
    select coalesce(min(i), 0) into free_plot
    from generate_series(0, 199) i
    where not exists (
      select 1 from garden_flowers g where g.user_id = auth.uid() and g.plot_index = i
    );
    insert into garden_flowers (user_id, seed_key, plot_index)
    values (auth.uid(), l.item_key, free_plot);
  else
    select coalesce((packet_inventory ->> l.item_key)::int, 0) into held
    from garden_state where user_id = auth.uid();
    update garden_state
    set packet_inventory = jsonb_set(
          coalesce(packet_inventory, '{}'::jsonb), array[l.item_key], to_jsonb(coalesce(held, 0) + 1))
    where user_id = auth.uid();
  end if;

  update market_listings
  set status = 'sold', buyer_id = auth.uid(), closed_at = now()
  where id = l.id;

  return jsonb_build_object('kind', l.kind, 'item_key', l.item_key, 'price', l.price);
end;
$$;

-- The open market, newest first, with the seller's name attached.
create or replace function market_open(_limit int default 60, _offset int default 0)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(row_to_json(m) order by m.created_at desc), '[]'::jsonb)
  from (
    select l.id, l.kind, l.item_key, l.price, l.created_at, l.seller_id,
           coalesce(p.display_name, 'A gardener') as seller_name,
           (l.seller_id = auth.uid()) as mine
    from market_listings l
    left join profiles p on p.id = l.seller_id
    where l.status = 'open' and auth.uid() is not null
    order by l.created_at desc
    limit greatest(0, least(_limit, 100)) offset greatest(0, _offset)
  ) m;
$$;


-- ── grants ──────────────────────────────────────────────────────────────────

revoke all on function are_friends(uuid, uuid)      from anon;
revoke all on function request_friend(uuid)         from anon;
revoke all on function respond_friend(uuid, boolean) from anon;
revoke all on function unfriend(uuid)               from anon;
revoke all on function directory_row(uuid, text)    from anon;
revoke all on function browse_profiles(int, int)    from anon;
revoke all on function search_profiles(text)        from anon;
revoke all on function my_friends()                 from anon;
revoke all on function friend_garden(uuid)          from anon;
revoke all on function list_flower(uuid, int)       from anon;
revoke all on function list_packet(text, int)       from anon;
revoke all on function cancel_listing(uuid)         from anon;
revoke all on function buy_listing(uuid)            from anon;
revoke all on function market_open(int, int)        from anon;

grant execute on function are_friends(uuid, uuid)       to authenticated;
grant execute on function request_friend(uuid)          to authenticated;
grant execute on function respond_friend(uuid, boolean) to authenticated;
grant execute on function unfriend(uuid)                to authenticated;
grant execute on function directory_row(uuid, text)     to authenticated;
grant execute on function browse_profiles(int, int)     to authenticated;
grant execute on function search_profiles(text)         to authenticated;
grant execute on function my_friends()                  to authenticated;
grant execute on function friend_garden(uuid)           to authenticated;
grant execute on function list_flower(uuid, int)        to authenticated;
grant execute on function list_packet(text, int)        to authenticated;
grant execute on function cancel_listing(uuid)          to authenticated;
grant execute on function buy_listing(uuid)             to authenticated;
grant execute on function market_open(int, int)         to authenticated;
