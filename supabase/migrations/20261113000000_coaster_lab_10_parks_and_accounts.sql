-- Coaster Lab 10.0: shared parks (publish, visit, rate, leaderboards) and player accounts (cloud saves).
-- Additive only: three new tables and fourteen functions (six for shared parks, six for
-- accounts, two helpers). Nothing that exists (profiles, coasters, auth, the
-- handle_new_user trigger) is changed.
--
-- WHO CAN DO WHAT
--  · cl_parks, cl_park_ratings: closed to direct access (RLS on, no policies, no grants). Browsers use only the
--    functions below, with the project's publishable key.
--  · A published park belongs to the ACCOUNT that published it when the player is signed in (user_id), otherwise to
--    the DEVICE that published it (a random secret the device keeps; only its SHA-256 hash is stored). A park that
--    belongs to an account can only be updated or removed by that account.
--  · cl_saves: a signed-in player's own parks (one row per slot: career, sandbox). RLS: a player can read and write
--    only their own rows; signed-out visitors have no access at all.
--  · Player names live in the existing public.profiles table (created by the existing sign-up trigger).
--
-- TO UNDO
--   drop function public.cl_publish_park(text,text,text,text,jsonb,jsonb), public.cl_get_park(text),
--     public.cl_rate_park(text,text,int), public.cl_list_parks(text,int), public.cl_my_parks(text),
--     public.cl_unpublish_park(text,text), public.cl_me(), public.cl_username_free(text), public.cl_set_username(text),
--     public.cl_save_put(text,jsonb,jsonb,text,bigint), public.cl_save_get(text), public.cl_save_delete(text),
--     public.cl_clean(text,int,text), public.cl_hash(text);
--   drop table public.cl_saves, public.cl_park_ratings, public.cl_parks;

-- ============================================================ tables
create table if not exists public.cl_parks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[2-9A-HJ-NP-Z]{6}$'),
  owner_hash text not null check (char_length(owner_hash) = 64),
  park_key text not null check (park_key ~ '^[A-Za-z0-9]{4,40}$'),
  name text not null check (char_length(name) between 1 and 40),
  author text not null default 'Anonymous' check (char_length(author) between 1 and 24),
  data jsonb not null,
  stats jsonb not null default '{}'::jsonb,
  visits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  unique (owner_hash, park_key)
);
create index if not exists cl_parks_user_idx on public.cl_parks (user_id) where user_id is not null;
create index if not exists cl_parks_updated_idx on public.cl_parks (updated_at desc);
create table if not exists public.cl_park_ratings (
  park_id uuid not null references public.cl_parks(id) on delete cascade,
  rater_hash text not null check (char_length(rater_hash) = 64),
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (park_id, rater_hash)
);
alter table public.cl_parks enable row level security;
alter table public.cl_park_ratings enable row level security;
revoke all on table public.cl_parks from anon, authenticated;
revoke all on table public.cl_park_ratings from anon, authenticated;


create table if not exists public.cl_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null check (slot in ('career', 'sandbox')),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 400000),
  meta jsonb not null default '{}'::jsonb check (jsonb_typeof(meta) = 'object' and octet_length(meta::text) <= 2000),
  device text not null default '' check (char_length(device) <= 40),
  rev bigint not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);
alter table public.cl_saves enable row level security;
revoke all on table public.cl_saves from anon, authenticated;
grant select, insert, update, delete on table public.cl_saves to authenticated;
drop policy if exists "Players can view their own park saves" on public.cl_saves;
drop policy if exists "Players can create their own park saves" on public.cl_saves;
drop policy if exists "Players can update their own park saves" on public.cl_saves;
drop policy if exists "Players can delete their own park saves" on public.cl_saves;
create policy "Players can view their own park saves" on public.cl_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "Players can create their own park saves" on public.cl_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Players can update their own park saves" on public.cl_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Players can delete their own park saves" on public.cl_saves for delete to authenticated using ((select auth.uid()) = user_id);

-- ============================================================ helpers (not callable from browsers)
create or replace function public.cl_hash(p text) returns text
language sql immutable set search_path = '' as $$ select encode(sha256(convert_to(p, 'UTF8')), 'hex') $$;
revoke execute on function public.cl_hash(text) from public, anon, authenticated;

create or replace function public.cl_clean(p text, n int, dflt text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(nullif(btrim(left(regexp_replace(coalesce(p, ''), '[[:cntrl:]<>"&]', '', 'g'), n)), ''), dflt) $$;
revoke execute on function public.cl_clean(text, int, text) from public, anon, authenticated;

-- ============================================================ shared parks
-- publish a new park, or update one published before (same park_key) by this account or this device
create or replace function public.cl_publish_park(p_owner_key text, p_park_key text, p_name text, p_author text, p_data jsonb, p_stats jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner text; v_uid uuid := auth.uid(); v_id uuid; v_upd timestamptz; v_code text; v_user uuid; v_n int; v_author text; v_name text;
begin
  if p_owner_key is null or p_owner_key !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'bad owner key'; end if;
  if p_park_key is null or p_park_key !~ '^[A-Za-z0-9]{4,40}$' then raise exception 'bad park key'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 400000 then raise exception 'park data is missing or too large'; end if;
  if p_stats is null or jsonb_typeof(p_stats) <> 'object' or octet_length(p_stats::text) > 4000 then raise exception 'bad stats'; end if;
  v_owner := public.cl_hash(p_owner_key);
  v_author := public.cl_clean(p_author, 24, 'Anonymous');
  if v_uid is not null then select username into v_name from public.profiles where id = v_uid; v_author := coalesce(v_name, v_author); end if;
  select id, updated_at, code, user_id into v_id, v_upd, v_code, v_user from public.cl_parks
    where park_key = p_park_key and (owner_hash = v_owner or (v_uid is not null and user_id = v_uid))
    order by (user_id is not distinct from v_uid) desc limit 1;
  if found then
    if v_user is not null and v_user is distinct from v_uid then raise exception 'this park belongs to an account: sign in to that account to update it'; end if;
    if v_upd > now() - interval '15 seconds' then raise exception 'please wait a few seconds before publishing again'; end if;
    update public.cl_parks set name = public.cl_clean(p_name, 40, 'My Park'), author = v_author, data = p_data, stats = p_stats, updated_at = now(), user_id = coalesce(user_id, v_uid) where id = v_id;
    return jsonb_build_object('code', v_code, 'updated', true, 'member', v_uid is not null);
  end if;
  select count(*) into v_n from public.cl_parks where (owner_hash = v_owner and user_id is null) or (v_uid is not null and user_id = v_uid);
  if v_n >= 5 then raise exception 'you can publish at most 5 parks: remove one first'; end if;
  select count(*) into v_n from public.cl_parks where created_at > now() - interval '1 minute';
  if v_n >= 30 then raise exception 'the cloud is busy, try again in a minute'; end if;
  for i in 1..10 loop
    v_code := '';
    for j in 1..6 loop v_code := v_code || substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1); end loop;
    begin
      insert into public.cl_parks (code, owner_hash, park_key, name, author, data, stats, user_id)
      values (v_code, v_owner, p_park_key, public.cl_clean(p_name, 40, 'My Park'), v_author, p_data, p_stats, v_uid);
      return jsonb_build_object('code', v_code, 'updated', false, 'member', v_uid is not null);
    exception when unique_violation then
      if exists (select 1 from public.cl_parks where owner_hash = v_owner and park_key = p_park_key) then raise exception 'this park was already published from this device by another account'; end if;
    end;
  end loop;
  raise exception 'could not create a park code, try again';
end $$;

-- fetch a published park by its code (counts a visit)
create or replace function public.cl_get_park(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.cl_parks; v_avg numeric; v_n int;
begin
  update public.cl_parks set visits = visits + 1 where code = upper(btrim(coalesce(p_code, ''))) returning * into v;
  if not found then return null; end if;
  select coalesce(avg(stars), 0), count(*) into v_avg, v_n from public.cl_park_ratings where park_id = v.id;
  return jsonb_build_object('code', v.code, 'name', v.name, 'author', v.author, 'data', v.data, 'stats', v.stats, 'visits', v.visits, 'stars', round(v_avg, 2), 'votes', v_n, 'updated', v.updated_at, 'member', v.user_id is not null);
end $$;

-- one rating per account (signed in) or per device (signed out) per park; changing it replaces the old one;
-- nobody can rate their own park
create or replace function public.cl_rate_park(p_code text, p_rater_key text, p_stars int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_id uuid; v_owner text; v_user uuid; v_dev text; v_rater text; v_avg numeric; v_n int;
begin
  if p_stars is null or p_stars not between 1 and 5 then raise exception 'stars must be 1 to 5'; end if;
  if p_rater_key is null or p_rater_key !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'bad rater key'; end if;
  select id, owner_hash, user_id into v_id, v_owner, v_user from public.cl_parks where code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'no park with that code'; end if;
  v_dev := public.cl_hash(p_rater_key);
  if v_dev = v_owner or (v_uid is not null and v_uid = v_user) then raise exception 'you cannot rate your own park'; end if;
  if v_uid is not null then
    v_rater := public.cl_hash('user:' || v_uid::text);
    delete from public.cl_park_ratings where park_id = v_id and rater_hash = v_dev;-- the same person's signed-out vote
  else v_rater := v_dev; end if;
  insert into public.cl_park_ratings (park_id, rater_hash, stars) values (v_id, v_rater, p_stars)
  on conflict (park_id, rater_hash) do update set stars = excluded.stars, created_at = now();
  select avg(stars), count(*) into v_avg, v_n from public.cl_park_ratings where park_id = v_id;
  return jsonb_build_object('stars', round(v_avg, 2), 'votes', v_n);
end $$;

-- leaderboards: 'top' (visitor stars, weighted towards 3 until a park has a few votes), 'rating' (the park's own
-- in-game rating), 'visits', 'new'. Park data is not included (only the summary).
create or replace function public.cl_list_parks(p_sort text default 'top', p_limit int default 20) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.ord), '[]'::jsonb) from (
    select p.code, p.name, p.author, p.stats, p.visits, p.updated_at as updated, round(coalesce(r.avg, 0), 2) as stars, coalesce(r.n, 0) as votes, (p.user_id is not null) as member,
      row_number() over (order by
        case when p_sort = 'visits' then p.visits::numeric
             when p_sort = 'rating' then coalesce((p.stats ->> 'rating')::numeric, 0)
             when p_sort = 'new' then extract(epoch from p.updated_at)::numeric
             else (coalesce(r.avg, 0) * coalesce(r.n, 0) + 9) / (coalesce(r.n, 0) + 3) end desc, p.updated_at desc) as ord
    from public.cl_parks p
    left join (select park_id, avg(stars) as avg, count(*) as n from public.cl_park_ratings group by park_id) r on r.park_id = p.id
    order by ord limit least(greatest(coalesce(p_limit, 20), 1), 50)) t $$;

-- parks this account (signed in) and this device published
create or replace function public.cl_my_parks(p_owner_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', code, 'name', name, 'park_key', park_key, 'visits', visits, 'updated', updated_at, 'member', user_id is not null) order by updated_at desc), '[]'::jsonb)
  from public.cl_parks
  where (user_id is null and p_owner_key is not null and p_owner_key ~ '^[A-Za-z0-9_-]{32,128}$' and owner_hash = public.cl_hash(p_owner_key))
     or (auth.uid() is not null and user_id = auth.uid()) $$;

-- remove a park this account or this device published (its ratings go with it)
create or replace function public.cl_unpublish_park(p_owner_key text, p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  delete from public.cl_parks where code = upper(btrim(coalesce(p_code, '')))
    and ((user_id is null and p_owner_key is not null and p_owner_key ~ '^[A-Za-z0-9_-]{32,128}$' and owner_hash = public.cl_hash(p_owner_key))
      or (v_uid is not null and user_id = v_uid));
  return found;
end $$;

-- ============================================================ player accounts
-- the signed-in player: name and a summary of their cloud saves (no park data)
create or replace function public.cl_me() returns jsonb
language sql stable set search_path = '' as $$
  select case when (select auth.uid()) is null then null else jsonb_build_object(
    'id', (select auth.uid()),
    'username', (select username from public.profiles where id = (select auth.uid())),
    'saves', (select coalesce(jsonb_agg(jsonb_build_object('slot', slot, 'meta', meta, 'rev', rev, 'device', device, 'updated', updated_at) order by slot), '[]'::jsonb)
              from public.cl_saves where user_id = (select auth.uid()))) end $$;

-- is a player name still free? (asked by the sign-up form before the account is made)
create or replace function public.cl_username_free(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select char_length(btrim(coalesce(p_name, ''))) between 3 and 24
     and not exists (select 1 from public.profiles where lower(username) = lower(btrim(p_name))) $$;

-- change the player name (also shown on the parks this account published)
create or replace function public.cl_set_username(p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v text := btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>"&]', '', 'g'));
begin
  if v_uid is null then raise exception 'sign in first'; end if;
  if char_length(v) not between 3 and 24 then raise exception 'a player name has 3 to 24 letters'; end if;
  if exists (select 1 from public.profiles where lower(username) = lower(v) and id <> v_uid) then raise exception 'that player name is taken'; end if;
  begin
    update public.profiles set username = v where id = v_uid;
    if not found then insert into public.profiles (id, username) values (v_uid, v); end if;
  exception when unique_violation then raise exception 'that player name is taken';
  end;
  update public.cl_parks set author = v where user_id = v_uid;
  return jsonb_build_object('username', v);
end $$;

-- save one of the player's parks. p_base_rev is the revision this device last saw: when another device has saved
-- since, nothing is overwritten and the answer says so (the player then chooses which park to keep).
create or replace function public.cl_save_put(p_slot text, p_data jsonb, p_meta jsonb default '{}'::jsonb, p_device text default '', p_base_rev bigint default null)
returns jsonb language plpgsql set search_path = '' as $$
declare v_uid uuid := auth.uid(); v public.cl_saves;
begin
  if v_uid is null then raise exception 'sign in first'; end if;
  if p_slot is null or p_slot not in ('career', 'sandbox') then raise exception 'bad slot'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 400000 then raise exception 'park data is missing or too large'; end if;
  if p_meta is not null and (jsonb_typeof(p_meta) <> 'object' or octet_length(p_meta::text) > 2000) then raise exception 'bad summary'; end if;
  select * into v from public.cl_saves where user_id = v_uid and slot = p_slot for update;
  if found then
    if p_base_rev is distinct from v.rev then
      return jsonb_build_object('conflict', true, 'rev', v.rev, 'meta', v.meta, 'device', v.device, 'updated', v.updated_at);
    end if;
    update public.cl_saves set data = p_data, meta = coalesce(p_meta, '{}'::jsonb), device = left(coalesce(p_device, ''), 40), rev = v.rev + 1, updated_at = now()
      where user_id = v_uid and slot = p_slot;
    return jsonb_build_object('rev', v.rev + 1, 'updated', now());
  end if;
  insert into public.cl_saves (user_id, slot, data, meta, device) values (v_uid, p_slot, p_data, coalesce(p_meta, '{}'::jsonb), left(coalesce(p_device, ''), 40));
  return jsonb_build_object('rev', 1, 'updated', now());
end $$;

create or replace function public.cl_save_get(p_slot text) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('slot', slot, 'data', data, 'meta', meta, 'rev', rev, 'device', device, 'updated', updated_at)
  from public.cl_saves where user_id = (select auth.uid()) and slot = p_slot $$;

create or replace function public.cl_save_delete(p_slot text) returns boolean
language plpgsql set search_path = '' as $$
begin
  delete from public.cl_saves where user_id = (select auth.uid()) and slot = p_slot;
  return found;
end $$;

-- ============================================================ who may call what
revoke execute on function public.cl_publish_park(text, text, text, text, jsonb, jsonb) from public;
revoke execute on function public.cl_get_park(text) from public;
revoke execute on function public.cl_rate_park(text, text, int) from public;
revoke execute on function public.cl_list_parks(text, int) from public;
revoke execute on function public.cl_my_parks(text) from public;
revoke execute on function public.cl_unpublish_park(text, text) from public;
revoke execute on function public.cl_username_free(text) from public;
grant execute on function public.cl_publish_park(text, text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.cl_get_park(text) to anon, authenticated;
grant execute on function public.cl_rate_park(text, text, int) to anon, authenticated;
grant execute on function public.cl_list_parks(text, int) to anon, authenticated;
grant execute on function public.cl_my_parks(text) to anon, authenticated;
grant execute on function public.cl_unpublish_park(text, text) to anon, authenticated;
grant execute on function public.cl_username_free(text) to anon, authenticated;
-- signed-in players only
revoke execute on function public.cl_me() from public, anon;
revoke execute on function public.cl_set_username(text) from public, anon;
revoke execute on function public.cl_save_put(text, jsonb, jsonb, text, bigint) from public, anon;
revoke execute on function public.cl_save_get(text) from public, anon;
revoke execute on function public.cl_save_delete(text) from public, anon;
grant execute on function public.cl_me() to authenticated;
grant execute on function public.cl_set_username(text) to authenticated;
grant execute on function public.cl_save_put(text, jsonb, jsonb, text, bigint) to authenticated;
grant execute on function public.cl_save_get(text) to authenticated;
grant execute on function public.cl_save_delete(text) to authenticated;
