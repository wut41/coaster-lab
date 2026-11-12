-- Coaster Lab 10.0: shared parks (publish, visit, rate, leaderboards).
-- Additive only: two new tables and seven functions. Nothing that exists (profiles, coasters, auth) is changed.
-- The two tables are closed to direct access (RLS on, no policies, no grants). Browsers use only the functions
-- below, with the project's publishable key. A device proves it owns a park with a random secret it keeps; only a
-- SHA-256 hash of that secret is stored.
-- To undo: drop function public.cl_publish_park(text,text,text,text,jsonb,jsonb), public.cl_get_park(text),
--   public.cl_rate_park(text,text,int), public.cl_list_parks(text,int), public.cl_my_parks(text),
--   public.cl_unpublish_park(text,text), public.cl_clean(text,int,text), public.cl_hash(text);
--   drop table public.cl_park_ratings, public.cl_parks;
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
  unique (owner_hash, park_key)
);
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

create or replace function public.cl_hash(p text) returns text
language sql immutable set search_path = '' as $$ select encode(sha256(convert_to(p, 'UTF8')), 'hex') $$;
revoke execute on function public.cl_hash(text) from public, anon, authenticated;

create or replace function public.cl_clean(p text, n int, dflt text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(nullif(btrim(left(regexp_replace(coalesce(p, ''), '[[:cntrl:]<>"&]', '', 'g'), n)), ''), dflt) $$;
revoke execute on function public.cl_clean(text, int, text) from public, anon, authenticated;

-- publish a new park, or update one this device published before (same park_key)
create or replace function public.cl_publish_park(p_owner_key text, p_park_key text, p_name text, p_author text, p_data jsonb, p_stats jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner text; v_id uuid; v_upd timestamptz; v_code text; v_n int;
begin
  if p_owner_key is null or char_length(p_owner_key) not between 32 and 128 then raise exception 'bad owner key'; end if;
  if p_park_key is null or p_park_key !~ '^[A-Za-z0-9]{4,40}$' then raise exception 'bad park key'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 400000 then raise exception 'park data is missing or too large'; end if;
  if p_stats is null or jsonb_typeof(p_stats) <> 'object' or octet_length(p_stats::text) > 4000 then raise exception 'bad stats'; end if;
  v_owner := public.cl_hash(p_owner_key);
  select id, updated_at, code into v_id, v_upd, v_code from public.cl_parks where owner_hash = v_owner and park_key = p_park_key;
  if found then
    if v_upd > now() - interval '15 seconds' then raise exception 'please wait a few seconds before publishing again'; end if;
    update public.cl_parks set name = public.cl_clean(p_name, 40, 'My Park'), author = public.cl_clean(p_author, 24, 'Anonymous'), data = p_data, stats = p_stats, updated_at = now() where id = v_id;
    return jsonb_build_object('code', v_code, 'updated', true);
  end if;
  select count(*) into v_n from public.cl_parks where owner_hash = v_owner;
  if v_n >= 5 then raise exception 'a device can publish at most 5 parks'; end if;
  select count(*) into v_n from public.cl_parks where created_at > now() - interval '1 minute';
  if v_n >= 30 then raise exception 'the cloud is busy, try again in a minute'; end if;
  for i in 1..10 loop
    v_code := '';
    for j in 1..6 loop v_code := v_code || substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1); end loop;
    begin
      insert into public.cl_parks (code, owner_hash, park_key, name, author, data, stats)
      values (v_code, v_owner, p_park_key, public.cl_clean(p_name, 40, 'My Park'), public.cl_clean(p_author, 24, 'Anonymous'), p_data, p_stats);
      return jsonb_build_object('code', v_code, 'updated', false);
    exception when unique_violation then
      if exists (select 1 from public.cl_parks where owner_hash = v_owner and park_key = p_park_key) then raise exception 'already published'; end if;
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
  return jsonb_build_object('code', v.code, 'name', v.name, 'author', v.author, 'data', v.data, 'stats', v.stats, 'visits', v.visits, 'stars', round(v_avg, 2), 'votes', v_n, 'updated', v.updated_at);
end $$;

-- one rating per device per park (changing it replaces the old one); owners cannot rate their own park
create or replace function public.cl_rate_park(p_code text, p_rater_key text, p_stars int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_owner text; v_rater text; v_avg numeric; v_n int;
begin
  if p_stars is null or p_stars not between 1 and 5 then raise exception 'stars must be 1 to 5'; end if;
  if p_rater_key is null or char_length(p_rater_key) not between 32 and 128 then raise exception 'bad rater key'; end if;
  select id, owner_hash into v_id, v_owner from public.cl_parks where code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'no park with that code'; end if;
  v_rater := public.cl_hash(p_rater_key);
  if v_rater = v_owner then raise exception 'you cannot rate your own park'; end if;
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
    select p.code, p.name, p.author, p.stats, p.visits, p.updated_at as updated, round(coalesce(r.avg, 0), 2) as stars, coalesce(r.n, 0) as votes,
      row_number() over (order by
        case when p_sort = 'visits' then p.visits::numeric
             when p_sort = 'rating' then coalesce((p.stats ->> 'rating')::numeric, 0)
             when p_sort = 'new' then extract(epoch from p.updated_at)::numeric
             else (coalesce(r.avg, 0) * coalesce(r.n, 0) + 9) / (coalesce(r.n, 0) + 3) end desc, p.updated_at desc) as ord
    from public.cl_parks p
    left join (select park_id, avg(stars) as avg, count(*) as n from public.cl_park_ratings group by park_id) r on r.park_id = p.id
    order by ord limit least(greatest(coalesce(p_limit, 20), 1), 50)) t $$;

-- parks this device published
create or replace function public.cl_my_parks(p_owner_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', code, 'name', name, 'park_key', park_key, 'visits', visits, 'updated', updated_at) order by updated_at desc), '[]'::jsonb)
  from public.cl_parks where p_owner_key is not null and char_length(p_owner_key) between 32 and 128 and owner_hash = public.cl_hash(p_owner_key) $$;

-- remove a park this device published (its ratings go with it)
create or replace function public.cl_unpublish_park(p_owner_key text, p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if p_owner_key is null or char_length(p_owner_key) not between 32 and 128 then return false; end if;
  delete from public.cl_parks where code = upper(btrim(coalesce(p_code, ''))) and owner_hash = public.cl_hash(p_owner_key);
  return found;
end $$;

revoke execute on function public.cl_publish_park(text, text, text, text, jsonb, jsonb) from public;
revoke execute on function public.cl_get_park(text) from public;
revoke execute on function public.cl_rate_park(text, text, int) from public;
revoke execute on function public.cl_list_parks(text, int) from public;
revoke execute on function public.cl_my_parks(text) from public;
revoke execute on function public.cl_unpublish_park(text, text) from public;
grant execute on function public.cl_publish_park(text, text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.cl_get_park(text) to anon, authenticated;
grant execute on function public.cl_rate_park(text, text, int) to anon, authenticated;
grant execute on function public.cl_list_parks(text, int) to anon, authenticated;
grant execute on function public.cl_my_parks(text) to anon, authenticated;
grant execute on function public.cl_unpublish_park(text, text) to anon, authenticated;
