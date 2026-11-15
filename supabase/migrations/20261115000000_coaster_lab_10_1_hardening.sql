-- Coaster Lab 10.1: security hardening for the park cloud and accounts.
-- Run AFTER 20261113000000_coaster_lab_10_parks_and_accounts.sql (it replaces eight of that file's functions with
-- stricter versions that keep the same names, arguments and answers, so the 10.0 and 10.1 game files both work with it).
-- Safe to run more than once.
--
-- WHAT IT CHANGES, AND WHY
--  1. Statistics a browser sends with a published park are rebuilt on the server: only the known number fields are
--     kept, each inside its range. Before, any JSON object up to 4 kB was stored and handed to every player's
--     leaderboard (and one park with a non-number "rating" made the "Best parks" list fail for everyone).
--  2. Abuse limits that do not depend on a key the browser chooses. They use a one-way fingerprint of the caller's
--     network address (the address itself is never stored): how many new parks, updates, ratings, visits and saves one
--     connection can make. Before, one script could publish 30 parks a minute for ever, which also locked everybody
--     else out ("the cloud is busy").
--  3. A visit is counted once per caller, per park, per day, instead of on every fetch.
--  4. At most three signed-out ratings per park from one connection (signed-in players stay one each).
--  5. Player names are cleaned by the database itself, wherever they come from (the sign-up form, the name change, or
--     a direct API call): no control characters, no < > " & ` or backslash, and a short list of names that look
--     official is refused. Before, only the game's own form cleaned them.
--  6. Least privilege on the two tables that existed before 10.0: signed-out callers lose every table privilege
--     (they never had a policy, so nothing they could do changes); signed-in players can change only their own
--     `username`, and no longer hold INSERT, DELETE, TRUNCATE, REFERENCES or TRIGGER on profiles.
--  7. `coasters` (not used by the game yet) gets a size limit per design and a limit of 60 designs per player, so it
--     cannot be used to fill the database.
--  8. Park data must look like a park (an object with a list of things) before it is stored.
--
-- TO UNDO: run the 10.0 migration again (it restores its versions of the eight functions), then
--   drop trigger if exists cl_profiles_clean on public.profiles; drop trigger if exists cl_coasters_limit on public.coasters;
--   drop function if exists public.cl_profiles_clean(), public.cl_coasters_limit(), public.cl_name(text), public.cl_name_reserved(text),
--     public.cl_stats_clean(jsonb), public.cl_num(jsonb,text,numeric,numeric), public.cl_allow(text,text,int,interval), public.cl_caller(), public.cl_park_ok(jsonb);
--   drop table if exists public.cl_park_visits, public.cl_rate;
--   alter table public.cl_parks drop column if exists creator_hash; alter table public.cl_park_ratings drop column if exists ip_hash;
--   (the grants in section 6 can be put back with: grant all on public.profiles, public.coasters to anon, authenticated;)

-- ============================================================ 1 · helpers (none of them callable from browsers)
create table if not exists public.cl_rate (
  bucket text not null check (char_length(bucket) <= 120),
  win timestamptz not null,
  n integer not null default 1,
  primary key (bucket, win)
);
create index if not exists cl_rate_win_idx on public.cl_rate (win);
alter table public.cl_rate enable row level security;
revoke all on table public.cl_rate from public, anon, authenticated;

create table if not exists public.cl_park_visits (
  park_id uuid not null references public.cl_parks(id) on delete cascade,
  visitor_hash text not null check (char_length(visitor_hash) = 64),
  day date not null default (now() at time zone 'utc')::date,
  primary key (park_id, visitor_hash, day)
);
create index if not exists cl_park_visits_day_idx on public.cl_park_visits (day);
alter table public.cl_park_visits enable row level security;
revoke all on table public.cl_park_visits from public, anon, authenticated;

alter table public.cl_parks add column if not exists creator_hash text;
alter table public.cl_park_ratings add column if not exists ip_hash text;
create index if not exists cl_parks_creator_idx on public.cl_parks (creator_hash) where creator_hash is not null and user_id is null;

-- who is calling: a one-way fingerprint of the network address the API gateway reports (never the address itself)
create or replace function public.cl_caller() returns text
language plpgsql stable set search_path = '' as $$
declare h jsonb; ip text;
begin
  begin h := nullif(current_setting('request.headers', true), '')::jsonb; exception when others then h := null; end;
  ip := coalesce(nullif(btrim(h ->> 'cf-connecting-ip'), ''), nullif(btrim(h ->> 'x-real-ip'), ''), nullif(btrim(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1)), ''), 'unknown');
  return public.cl_hash('ip:' || left(ip, 64));
end $$;
revoke execute on function public.cl_caller() from public, anon, authenticated;

-- count one call in a fixed time window; false when the caller is over the limit. (A refused call is rolled back
-- with its transaction, so the counter stays at the limit until the window ends.)
create or replace function public.cl_allow(p_what text, p_who text, p_max int, p_window interval) returns boolean
language plpgsql set search_path = '' as $$
declare v_len double precision := greatest(1, extract(epoch from p_window)); v_win timestamptz := to_timestamp(floor(extract(epoch from now()) / v_len) * v_len); v_n int;
begin
  insert into public.cl_rate (bucket, win, n) values (left(p_what || ':' || p_who, 120), v_win, 1)
  on conflict (bucket, win) do update set n = public.cl_rate.n + 1 returning n into v_n;
  if random() < 0.02 then
    delete from public.cl_rate where win < now() - interval '2 days';
    delete from public.cl_park_visits where day < (now() at time zone 'utc')::date - 2;
  end if;
  return v_n <= p_max;
end $$;
revoke execute on function public.cl_allow(text, text, int, interval) from public, anon, authenticated;

create or replace function public.cl_num(p jsonb, k text, lo numeric, hi numeric) returns numeric
language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p -> k) = 'number' then round(least(greatest((p ->> k)::numeric, lo), hi)) end $$;
revoke execute on function public.cl_num(jsonb, text, numeric, numeric) from public, anon, authenticated;

-- the summary shown on leaderboards: known fields only, numbers only, each inside its range
create or replace function public.cl_stats_clean(p jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select case when p is null or jsonb_typeof(p) <> 'object' then '{}'::jsonb else jsonb_strip_nulls(jsonb_build_object(
    'rating', public.cl_num(p, 'rating', 0, 100), 'rep', public.cl_num(p, 'rep', 0, 100), 'day', public.cl_num(p, 'day', 1, 1000000),
    'guests', public.cl_num(p, 'guests', 0, 1e13), 'rides', public.cl_num(p, 'rides', 0, 1e13), 'coasters', public.cl_num(p, 'coasters', 0, 900),
    'attractions', public.cl_num(p, 'attractions', 0, 900), 'level', public.cl_num(p, 'level', 1, 30), 'money', public.cl_num(p, 'money', -1e12, 1e12),
    'mode', case when p ->> 'mode' in ('career', 'sandbox') then p ->> 'mode' end)) end $$;
revoke execute on function public.cl_stats_clean(jsonb) from public, anon, authenticated;

-- does this JSON look like a Coaster Lab park? (the game checks every field again when it opens one)
create or replace function public.cl_park_ok(p jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(p is not null and jsonb_typeof(p) = 'object' and octet_length(p::text) <= 400000
     and jsonb_typeof(p -> 'objs') = 'array' and jsonb_array_length(p -> 'objs') <= 1200
     and (not (p ? 'name') or jsonb_typeof(p -> 'name') = 'string'), false) $$;-- (a missing field gives "unknown", which must count as no)
revoke execute on function public.cl_park_ok(jsonb) from public, anon, authenticated;

-- player names: cleaned text, 3 to 24 characters; '' when nothing usable is left
create or replace function public.cl_name(p text) returns text
language sql immutable set search_path = '' as $$
  select btrim(left(btrim(regexp_replace(regexp_replace(coalesce(p, ''), '[[:cntrl:]<>"&`\\]', '', 'g'), '\s+', ' ', 'g')), 24)) $$;
revoke execute on function public.cl_name(text) from public, anon, authenticated;

-- names that could pass for the game's own staff
create or replace function public.cl_name_reserved(p text) returns boolean
language sql immutable set search_path = '' as $$
  select regexp_replace(lower(coalesce(p, '')), '[^a-z0-9]', '', 'g') in
    ('admin', 'administrator', 'moderator', 'mod', 'owner', 'staff', 'support', 'official', 'system', 'coasterlab', 'coasterlabteam',
     'coasterlabofficial', 'coasterlabsupport', 'coasterlabadmin', 'anonymous', 'supabase', 'null', 'undefined') $$;
revoke execute on function public.cl_name_reserved(text) from public, anon, authenticated;

-- ============================================================ 2 · player names are cleaned by the database
-- (runs with its owner's rights: the caller's role is not allowed to call the helpers itself)
create or replace function public.cl_profiles_clean() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v text := public.cl_name(new.username);
begin
  if tg_op = 'UPDATE' and new.username is not distinct from old.username then return new; end if;
  if char_length(v) < 3 then
    if tg_op = 'UPDATE' then raise exception 'a player name has 3 to 24 letters'; end if;
    v := 'rider_' || substr(new.id::text, 1, 8);-- a new account always gets a usable name
  end if;
  if public.cl_name_reserved(v) then raise exception 'that player name is not available'; end if;
  new.username := v;
  return new;
end $$;
revoke execute on function public.cl_profiles_clean() from public, anon, authenticated;
drop trigger if exists cl_profiles_clean on public.profiles;
create trigger cl_profiles_clean before insert or update of username on public.profiles
  for each row execute function public.cl_profiles_clean();

-- "Bob" and "bob" are the same name. (Skipped with a notice if two existing names already clash that way.)
do $$ begin
  if exists (select 1 from public.profiles group by lower(username) having count(*) > 1) then
    raise notice 'cl 10.1: two existing player names differ only by capital letters; the case-insensitive unique index was NOT created';
  else
    create unique index if not exists profiles_username_lower_key on public.profiles (lower(username));
  end if;
end $$;

-- ============================================================ 3 · least privilege on the tables from before 10.0
revoke all on table public.profiles from anon;
revoke all on table public.coasters from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from authenticated;
grant update (username) on table public.profiles to authenticated;-- the existing policy still limits it to the player's own row
revoke truncate, references, trigger on table public.coasters from authenticated;
revoke truncate, references, trigger on table public.cl_saves from authenticated;

-- `coasters` is not used by the game yet: keep it from being used to fill the database
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coasters_design_size' and conrelid = 'public.coasters'::regclass) then
    alter table public.coasters add constraint coasters_design_size check (jsonb_typeof(design) = 'object' and octet_length(design::text) <= 400000) not valid;
  end if;
end $$;
create or replace function public.cl_coasters_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.coasters where user_id = new.user_id) >= 60 then raise exception 'you can keep at most 60 coasters in your account: delete one first'; end if;
  return new;
end $$;
revoke execute on function public.cl_coasters_limit() from public, anon, authenticated;
drop trigger if exists cl_coasters_limit on public.coasters;
create trigger cl_coasters_limit before insert on public.coasters for each row execute function public.cl_coasters_limit();

-- ============================================================ 4 · shared parks (same names, arguments and answers as 10.0)
create or replace function public.cl_publish_park(p_owner_key text, p_park_key text, p_name text, p_author text, p_data jsonb, p_stats jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner text; v_uid uuid := auth.uid(); v_id uuid; v_upd timestamptz; v_code text; v_user uuid; v_n int; v_author text; v_name text;
  v_ip text := public.cl_caller(); v_stats jsonb;
begin
  if p_owner_key is null or p_owner_key !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'bad owner key'; end if;
  if p_park_key is null or p_park_key !~ '^[A-Za-z0-9]{4,40}$' then raise exception 'bad park key'; end if;
  if not public.cl_park_ok(p_data) then raise exception 'park data is missing, too large or not a Coaster Lab park'; end if;
  if p_stats is null or jsonb_typeof(p_stats) <> 'object' or octet_length(p_stats::text) > 4000 then raise exception 'bad stats'; end if;
  v_stats := public.cl_stats_clean(p_stats);
  v_owner := public.cl_hash(p_owner_key);
  v_author := public.cl_clean(p_author, 24, 'Anonymous');
  if v_uid is not null then select username into v_name from public.profiles where id = v_uid; v_author := public.cl_clean(coalesce(v_name, v_author), 24, 'Anonymous'); end if;
  select id, updated_at, code, user_id into v_id, v_upd, v_code, v_user from public.cl_parks
    where park_key = p_park_key and (owner_hash = v_owner or (v_uid is not null and user_id = v_uid))
    order by (user_id is not distinct from v_uid) desc limit 1;
  if found then
    if v_user is not null and v_user is distinct from v_uid then raise exception 'this park belongs to an account: sign in to that account to update it'; end if;
    if v_upd > now() - interval '15 seconds' then raise exception 'please wait a few seconds before publishing again'; end if;
    if not public.cl_allow('upd', coalesce(v_uid::text, v_ip), 40, interval '1 hour') then raise exception 'slow down: this park was updated very often in the last hour, try again later'; end if;
    update public.cl_parks set name = public.cl_clean(p_name, 40, 'My Park'), author = v_author, data = p_data, stats = v_stats, updated_at = now(), user_id = coalesce(user_id, v_uid) where id = v_id;
    return jsonb_build_object('code', v_code, 'updated', true, 'member', v_uid is not null);
  end if;
  select count(*) into v_n from public.cl_parks where (owner_hash = v_owner and user_id is null) or (v_uid is not null and user_id = v_uid);
  if v_n >= 5 then raise exception 'you can publish at most 5 parks: remove one first'; end if;
  if v_uid is null then
    select count(*) into v_n from public.cl_parks where creator_hash = v_ip and user_id is null;
    if v_n >= 10 then raise exception 'this connection has published its share of parks: sign in to publish more, or remove one first'; end if;
  end if;
  if not public.cl_allow('new', v_ip, 6, interval '1 hour') or not public.cl_allow('newd', v_ip, 20, interval '1 day') then raise exception 'slow down: too many new parks from this connection, try again later'; end if;
  select count(*) into v_n from public.cl_parks where created_at > now() - interval '1 minute';
  if v_n >= 60 then raise exception 'the cloud is busy, try again in a minute'; end if;
  for i in 1..10 loop
    v_code := '';
    for j in 1..6 loop v_code := v_code || substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1); end loop;
    begin
      insert into public.cl_parks (code, owner_hash, park_key, name, author, data, stats, user_id, creator_hash)
      values (v_code, v_owner, p_park_key, public.cl_clean(p_name, 40, 'My Park'), v_author, p_data, v_stats, v_uid, v_ip);
      return jsonb_build_object('code', v_code, 'updated', false, 'member', v_uid is not null);
    exception when unique_violation then
      if exists (select 1 from public.cl_parks where owner_hash = v_owner and park_key = p_park_key) then raise exception 'this park was already published from this device by another account'; end if;
    end;
  end loop;
  raise exception 'could not create a park code, try again';
end $$;

-- fetch a published park by its code. A visit is counted once per caller, per park, per day.
create or replace function public.cl_get_park(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.cl_parks; v_avg numeric; v_n int; v_ip text := public.cl_caller();
begin
  if not public.cl_allow('get', v_ip, 600, interval '1 hour') then raise exception 'slow down: too many parks opened from this connection, try again later'; end if;
  select * into v from public.cl_parks where code = upper(btrim(coalesce(p_code, '')));
  if not found then return null; end if;
  insert into public.cl_park_visits (park_id, visitor_hash) values (v.id, v_ip) on conflict do nothing;
  if found then update public.cl_parks set visits = visits + 1 where id = v.id returning visits into v.visits; end if;
  select coalesce(avg(stars), 0), count(*) into v_avg, v_n from public.cl_park_ratings where park_id = v.id;
  return jsonb_build_object('code', v.code, 'name', public.cl_clean(v.name, 40, 'My Park'), 'author', public.cl_clean(v.author, 24, 'Anonymous'), 'data', v.data, 'stats', public.cl_stats_clean(v.stats),
    'visits', v.visits, 'stars', round(v_avg, 2), 'votes', v_n, 'updated', v.updated_at, 'member', v.user_id is not null);
end $$;

-- one rating per account (signed in) or per device (signed out) per park, at most three signed-out ratings per park
-- from one connection, and a limit on how fast one connection can rate. Nobody can rate their own park.
create or replace function public.cl_rate_park(p_code text, p_rater_key text, p_stars int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_id uuid; v_owner text; v_user uuid; v_dev text; v_rater text; v_avg numeric; v_n int; v_ip text := public.cl_caller();
begin
  if p_stars is null or p_stars not between 1 and 5 then raise exception 'stars must be 1 to 5'; end if;
  if p_rater_key is null or p_rater_key !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'bad rater key'; end if;
  select id, owner_hash, user_id into v_id, v_owner, v_user from public.cl_parks where code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'no park with that code'; end if;
  v_dev := public.cl_hash(p_rater_key);
  if v_dev = v_owner or (v_uid is not null and v_uid = v_user) then raise exception 'you cannot rate your own park'; end if;
  if not public.cl_allow('rate', coalesce(v_uid::text, v_ip), 30, interval '1 hour') then raise exception 'slow down: too many ratings from this connection, try again later'; end if;
  if v_uid is not null then
    v_rater := public.cl_hash('user:' || v_uid::text);
    delete from public.cl_park_ratings where park_id = v_id and rater_hash = v_dev;-- the same person's signed-out vote
  else
    v_rater := v_dev;
    select count(*) into v_n from public.cl_park_ratings where park_id = v_id and ip_hash = v_ip and rater_hash <> v_rater;
    if v_n >= 3 then raise exception 'this connection has already rated this park'; end if;
  end if;
  insert into public.cl_park_ratings (park_id, rater_hash, stars, ip_hash) values (v_id, v_rater, p_stars, case when v_uid is null then v_ip end)
  on conflict (park_id, rater_hash) do update set stars = excluded.stars, created_at = now(), ip_hash = excluded.ip_hash;
  select avg(stars), count(*) into v_avg, v_n from public.cl_park_ratings where park_id = v_id;
  return jsonb_build_object('stars', round(v_avg, 2), 'votes', v_n);
end $$;

-- leaderboards. Every row is cleaned again on the way out, so a row stored before 10.1 cannot break a list.
create or replace function public.cl_list_parks(p_sort text default 'top', p_limit int default 20) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', t.code, 'name', t.name, 'author', t.author, 'stats', t.stats, 'visits', t.visits, 'updated', t.updated, 'stars', t.stars, 'votes', t.votes, 'member', t.member) order by t.ord), '[]'::jsonb) from (
    select p.code, public.cl_clean(p.name, 40, 'My Park') as name, public.cl_clean(p.author, 24, 'Anonymous') as author, public.cl_stats_clean(p.stats) as stats, p.visits, p.updated_at as updated,
      round(coalesce(r.avg, 0), 2) as stars, coalesce(r.n, 0) as votes, (p.user_id is not null) as member,
      row_number() over (order by
        case when p_sort = 'visits' then p.visits::numeric
             when p_sort = 'rating' then coalesce(public.cl_num(p.stats, 'rating', 0, 100), 0)
             when p_sort = 'new' then extract(epoch from p.updated_at)::numeric
             else (coalesce(r.avg, 0) * coalesce(r.n, 0) + 9) / (coalesce(r.n, 0) + 3) end desc, p.updated_at desc) as ord
    from public.cl_parks p
    left join (select park_id, avg(stars) as avg, count(*) as n from public.cl_park_ratings group by park_id) r on r.park_id = p.id
    order by ord limit least(greatest(coalesce(p_limit, 20), 1), 50)) t $$;

-- ============================================================ 5 · player accounts
-- change the player name: cleaned and checked here as well as by the trigger, and not more than 5 times an hour
create or replace function public.cl_set_username(p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v text := public.cl_name(p_name);
begin
  if v_uid is null then raise exception 'sign in first'; end if;
  if char_length(v) not between 3 and 24 then raise exception 'a player name has 3 to 24 letters'; end if;
  if public.cl_name_reserved(v) then raise exception 'that player name is not available'; end if;
  if exists (select 1 from public.profiles where lower(username) = lower(v) and id <> v_uid) then raise exception 'that player name is taken'; end if;
  if not public.cl_allow('name', v_uid::text, 5, interval '1 hour') then raise exception 'slow down: you changed your player name a lot just now, try again later'; end if;
  begin
    update public.profiles set username = v where id = v_uid;
    if not found then insert into public.profiles (id, username) values (v_uid, v); end if;
  exception when unique_violation then raise exception 'that player name is taken';
  end;
  update public.cl_parks set author = v where user_id = v_uid;
  return jsonb_build_object('username', v);
end $$;

create or replace function public.cl_username_free(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select char_length(public.cl_name(p_name)) between 3 and 24 and not public.cl_name_reserved(public.cl_name(p_name))
     and not exists (select 1 from public.profiles where lower(username) = lower(public.cl_name(p_name))) $$;

-- save one of the player's parks (unchanged rules: nothing newer is ever overwritten; see 10.0). New in 10.1: the
-- data must look like a park, and one account can save at most 240 times an hour. It now runs with the function
-- owner's rights so that it can keep that count; every statement still names the caller's own id.
create or replace function public.cl_save_put(p_slot text, p_data jsonb, p_meta jsonb default '{}'::jsonb, p_device text default '', p_base_rev bigint default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v public.cl_saves;
begin
  if v_uid is null then raise exception 'sign in first'; end if;
  if p_slot is null or p_slot not in ('career', 'sandbox') then raise exception 'bad slot'; end if;
  if not public.cl_park_ok(p_data) then raise exception 'park data is missing, too large or not a Coaster Lab park'; end if;
  if p_meta is not null and (jsonb_typeof(p_meta) <> 'object' or octet_length(p_meta::text) > 2000) then raise exception 'bad summary'; end if;
  if not public.cl_allow('save', v_uid::text, 240, interval '1 hour') then raise exception 'slow down: too many saves in the last hour, the next one will go through later'; end if;
  select * into v from public.cl_saves where user_id = v_uid and slot = p_slot for update;
  if found then
    if p_base_rev is distinct from v.rev then
      return jsonb_build_object('conflict', true, 'rev', v.rev, 'meta', v.meta, 'device', v.device, 'updated', v.updated_at);
    end if;
    update public.cl_saves set data = p_data, meta = coalesce(p_meta, '{}'::jsonb), device = left(coalesce(p_device, ''), 40), rev = v.rev + 1, updated_at = now()
      where user_id = v_uid and slot = p_slot;
    return jsonb_build_object('rev', v.rev + 1, 'updated', now());
  end if;
  begin
    insert into public.cl_saves (user_id, slot, data, meta, device) values (v_uid, p_slot, p_data, coalesce(p_meta, '{}'::jsonb), left(coalesce(p_device, ''), 40));
  exception when unique_violation then-- two devices saved a first park at the same moment: the second one is told, like any other clash
    select * into v from public.cl_saves where user_id = v_uid and slot = p_slot;
    return jsonb_build_object('conflict', true, 'rev', v.rev, 'meta', v.meta, 'device', v.device, 'updated', v.updated_at);
  end;
  return jsonb_build_object('rev', 1, 'updated', now());
end $$;

-- ============================================================ 6 · who may call what (create or replace keeps earlier grants; stated again in full)
revoke execute on function public.cl_publish_park(text, text, text, text, jsonb, jsonb) from public;
revoke execute on function public.cl_get_park(text) from public;
revoke execute on function public.cl_rate_park(text, text, int) from public;
revoke execute on function public.cl_list_parks(text, int) from public;
revoke execute on function public.cl_username_free(text) from public;
grant execute on function public.cl_publish_park(text, text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.cl_get_park(text) to anon, authenticated;
grant execute on function public.cl_rate_park(text, text, int) to anon, authenticated;
grant execute on function public.cl_list_parks(text, int) to anon, authenticated;
grant execute on function public.cl_username_free(text) to anon, authenticated;
revoke execute on function public.cl_set_username(text) from public, anon;
revoke execute on function public.cl_save_put(text, jsonb, jsonb, text, bigint) from public, anon;
grant execute on function public.cl_set_username(text) to authenticated;
grant execute on function public.cl_save_put(text, jsonb, jsonb, text, bigint) to authenticated;
