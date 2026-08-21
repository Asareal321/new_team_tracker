-- Patch: the market's two list functions named four columns and supplied three.
--
-- `price` was the one left out, so every attempt to put something up failed
-- with "INSERT has more target columns than expressions". The delete/decrement
-- that precedes the insert is in the same transaction, so a failed listing
-- rolled back cleanly — nothing was ever lost, it simply could not be sold.
--
-- Safe to run on its own; it only replaces the two functions. Re-running the
-- whole of migration-community.sql does the same thing.

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
  values (auth.uid(), 'flower', f.seed_key, _price)
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
  values (auth.uid(), 'packet', _packet_key, _price)
  returning id into new_id;

  return new_id;
end;
$$;
