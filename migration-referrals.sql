-- Bringing people to the app.
--
-- One legendary packet for every three people who sign up on your link and
-- finish setting up. That is a real reward, so the counting has to happen
-- somewhere the person being counted for cannot reach.
--
-- The shape:
--
--   • Every profile gets a short code. It is not the user id: a referral link
--     is pasted into group chats, and a user id is a key that appears in other
--     tables. A separate, meaningless code can be regenerated if it is abused.
--   • A new account claims a code ONCE, and only before it has claimed one.
--     Self-referral is refused, and so is claiming after the fact.
--   • A referral only counts once the referred account has finished onboarding.
--     Otherwise the loop is: make an account, claim, abandon, repeat.
--   • Packets are granted by a function that reads the count itself and
--     subtracts what it has already given. The client cannot say how many it
--     is owed; it can only ask.

alter table profiles add column if not exists referral_code text;
alter table profiles add column if not exists referred_by uuid references auth.users(id) on delete set null;
alter table profiles add column if not exists referral_packets_granted int not null default 0;

create unique index if not exists profiles_referral_code_idx on profiles (referral_code);
create index if not exists profiles_referred_by_idx on profiles (referred_by);

-- Eight characters from an alphabet with no 0/O or 1/I/l, because these get
-- read aloud and typed by hand.
create or replace function new_referral_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    end loop;
    exit when not exists (select 1 from profiles where referral_code = code);
  end loop;
  return code;
end;
$$;

-- Backfill, and keep new rows supplied.
update profiles set referral_code = new_referral_code() where referral_code is null;

create or replace function ensure_referral_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.referral_code is null then
    new.referral_code := new_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_referral_code on profiles;
create trigger profiles_referral_code
  before insert on profiles
  for each row execute function ensure_referral_code();

-- Your own code, to build a link from.
create or replace function my_referral_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select referral_code from profiles where id = auth.uid();
$$;

-- Claim someone's code. Once, ever, and never your own.
create or replace function claim_referral(_code text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  referrer uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _code is null or btrim(_code) = '' then return false; end if;

  -- Already claimed one. Not an error — the link may simply have been opened
  -- twice — but nothing changes.
  if exists (select 1 from profiles where id = auth.uid() and referred_by is not null) then
    return false;
  end if;

  select id into referrer from profiles where upper(referral_code) = upper(btrim(_code));
  if referrer is null or referrer = auth.uid() then return false; end if;

  update profiles set referred_by = referrer where id = auth.uid();
  return true;
end;
$$;

-- How many people you have actually brought on, and what you have been paid.
--
-- Counts only accounts that finished onboarding: without that, the cycle is
-- make an account, claim, abandon, repeat, and three minutes of that is a
-- legendary packet.
create or replace function referral_stats()
returns table (joined int, granted int)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::int
       from profiles p
       join garden_state g on g.user_id = p.id
      where p.referred_by = auth.uid()
        and g.onboarded is true),
    (select coalesce(referral_packets_granted, 0) from profiles where id = auth.uid());
$$;

-- Hand over whatever is owed. Returns the number of packets added, so the
-- caller can say something when it is more than zero.
--
-- The client does not get to say how many it is owed — this counts, subtracts
-- what it has already given, and records the new total in the same statement
-- it grants. Calling it twice in a row pays nothing the second time.
create or replace function claim_referral_packets(_packet_key text, _per int)
returns int
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  n_joined int;
  n_granted int;
  owed int;
  inv jsonb;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _per is null or _per < 1 then raise exception 'bad threshold'; end if;

  select count(*)::int into n_joined
    from profiles p
    join garden_state g on g.user_id = p.id
   where p.referred_by = auth.uid()
     and g.onboarded is true;

  select coalesce(referral_packets_granted, 0) into n_granted
    from profiles where id = auth.uid();

  owed := (n_joined / _per) - n_granted;
  if owed <= 0 then return 0; end if;

  select coalesce(packet_inventory, '{}'::jsonb) into inv
    from garden_state where user_id = auth.uid();
  if inv is null then return 0; end if;   -- no garden row yet; nothing to add to

  update garden_state
     set packet_inventory = jsonb_set(
           inv, array[_packet_key],
           to_jsonb(coalesce((inv ->> _packet_key)::int, 0) + owed))
   where user_id = auth.uid();

  update profiles
     set referral_packets_granted = n_granted + owed
   where id = auth.uid();

  return owed;
end;
$$;

revoke all on function my_referral_code()             from anon;
revoke all on function claim_referral(text)           from anon;
revoke all on function referral_stats()               from anon;
revoke all on function claim_referral_packets(text, int) from anon;

grant execute on function my_referral_code()             to authenticated;
grant execute on function claim_referral(text)           to authenticated;
grant execute on function referral_stats()               to authenticated;
grant execute on function claim_referral_packets(text, int) to authenticated;
