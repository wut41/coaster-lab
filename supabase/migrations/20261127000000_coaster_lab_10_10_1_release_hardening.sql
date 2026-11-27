-- Coaster Lab 10.10.1: release hardening for the park cloud and accounts (2026-11-27).
-- Run AFTER 20261113000000_coaster_lab_10_parks_and_accounts.sql and 20261115000000_coaster_lab_10_1_hardening.sql.
-- Same function names, arguments and answers, so the 10.0, 10.1 and 10.10.x game files keep working. Safe to run
-- more than once. Every change below closes an attack that supabase/tests/20_attacks.sql makes and that got through
-- before this file (the check names are in brackets).
--
-- WHAT IT CHANGES, AND WHY
--  1. Rate limits can no longer be reset by the browser [L2, L3]. The caller fingerprint used to fall back to
--     x-real-ip and to the FIRST address in x-forwarded-for, both of which a browser can write itself. It now uses
--     cf-connecting-ip (set by Cloudflare in front of the Supabase API; every request in the live API log has it), or
--     else only the LAST x-forwarded-for hop (added by the proxy, not the browser). IPv6 callers are counted per /64,
--     the block one household or one cloud server gets, instead of per address (a /64 holds 2^64 addresses).
--  2. Network fingerprints are keyed with a server secret [F1, F2]. A plain SHA-256 of an IPv4 address can be
--     reversed by hashing all 2^32 addresses in minutes, so "the address is never stored" was not true in practice.
--     The secret is created by this file, lives in public.cl_secret, and no API role can read it.
--  3. Names cannot pretend to be staff or another player, or hide characters [N1-N7]. Text is NFKC-normalised
--     (full-width letters U+FF21... become plain "Admin") and invisible / direction-changing characters are removed (zero-width
--     spaces and joiners, right-to-left overrides and isolates, tag characters, variation selectors, Hangul fillers,
--     soft hyphens). Signed-out parks credited to a staff-like name or to a registered player's name are shown as
--     "Anonymous". More staff-like names are reserved (anything containing "coasterlab", admin1, admin2, ...).
--  4. Players can no longer write the tables directly [D1, D2, D4, D5]. PostgREST exposes every table a role holds a
--     grant on, so a player could skip the park check, the save limit and the revision counter by writing cl_saves
--     with a plain REST call, rename themselves without the name-change limit, or fill the unused coasters table.
--     All writes now go through the functions; reading and deleting your own saves still works.
--  5. The leaderboard (the most expensive call: it ranks every park) is limited per connection [L6].
--  6. The device label stored with a save is cleaned [V1]; all names are cut to size before they are processed.
--  7. Defence in depth from the 2026-11-27 report (H4): no API role keeps any privilege on vip_purchases.
--
-- TO UNDO: run 20261115000000_coaster_lab_10_1_hardening.sql again (it restores its versions of the functions), then
--   drop function if exists public.cl_plain(text); drop table if exists public.cl_secret;
--   grant insert, update on public.cl_saves to authenticated; grant update (username) on public.profiles to authenticated;
--   grant insert, update, delete on public.coasters to authenticated;

-- ============================================================ 1 · the server secret and the caller fingerprint
create table if not exists public.cl_secret (
  id smallint primary key check (id = 1),
  k text not null check (char_length(k) >= 64),
  created_at timestamptz not null default now()
);
alter table public.cl_secret enable row level security;
revoke all on table public.cl_secret from public, anon, authenticated, service_role;
-- 4 x 122 random bits from the server's strong random source, hashed to 64 hex characters. Kept on later runs.
insert into public.cl_secret (id, k)
values (1, encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text || gen_random_uuid()::text || gen_random_uuid()::text, 'UTF8')), 'hex'))
on conflict (id) do nothing;

create or replace function public.cl_caller() returns text
language plpgsql stable security definer set search_path = '' as $$
declare h jsonb; ip text; a inet; v_k text;
begin
  begin h := nullif(current_setting('request.headers', true), '')::jsonb; exception when others then h := null; end;
  -- cf-connecting-ip: written by Cloudflare (a value the browser sends is replaced). Without it, only the last
  -- x-forwarded-for hop: everything before it, and x-real-ip, is whatever the browser chose to send.
  ip := nullif(btrim(left(coalesce(h ->> 'cf-connecting-ip', ''), 64)), '');
  if ip is null then ip := nullif(btrim(regexp_replace(left(coalesce(h ->> 'x-forwarded-for', ''), 2000), '^.*,', '')), ''); end if;
  ip := coalesce(left(ip, 64), 'unknown');
  begin a := ip::inet; exception when others then a := null; end;
  if a is not null then
    if family(a) = 6 and not (a <<= '::ffff:0:0/96'::inet) then ip := host(network(set_masklen(a, 64))) || '/64';-- one household / one server
    else ip := host(a); end if;-- IPv4, including IPv4 written as ::ffff:a.b.c.d
  end if;
  select s.k into v_k from public.cl_secret s where s.id = 1;
  return public.cl_hash('ip:' || coalesce(v_k, '') || ':' || ip);
end $$;
revoke execute on function public.cl_caller() from public, anon, authenticated;

-- ============================================================ 2 · text: normalised, nothing invisible, cut to size
-- NFKC (full-width and other compatibility look-alikes become plain letters), then remove C1 controls, soft hyphen,
-- combining grapheme joiner, Arabic letter mark, Hangul fillers, Khmer / Mongolian invisible vowels and selectors,
-- zero-width space / non-joiner / joiner, left-to-right and right-to-left marks, line and paragraph separators,
-- direction embeddings, overrides and isolates, word joiner and invisible operators, braille blank, variation
-- selectors, the byte-order mark, interlinear annotation marks, tag characters and supplementary variation selectors.
create or replace function public.cl_plain(p text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(normalize(left(coalesce(p, ''), 1000), NFKC),
    '[\u0080-\u009F\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u2028-\u202E\u2060-\u206F\u2800\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFFC\U000E0000-\U000E007F\U000E0100-\U000E01EF]',
    '', 'g') $$;
revoke execute on function public.cl_plain(text) from public, anon, authenticated;

create or replace function public.cl_clean(p text, n int, dflt text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(nullif(btrim(left(regexp_replace(public.cl_plain(p), '[[:cntrl:]<>"&]', '', 'g'), n)), ''), dflt) $$;
revoke execute on function public.cl_clean(text, int, text) from public, anon, authenticated;

create or replace function public.cl_name(p text) returns text
language sql immutable set search_path = '' as $$
  select btrim(left(btrim(regexp_replace(regexp_replace(public.cl_plain(p), '[[:cntrl:]<>"&`\\]', '', 'g'), '\s+', ' ', 'g')), 24)) $$;
revoke execute on function public.cl_name(text) from public, anon, authenticated;

create or replace function public.cl_name_reserved(p text) returns boolean
language sql immutable set search_path = '' as $$
  select k in ('admin', 'administrator', 'moderator', 'mod', 'owner', 'staff', 'support', 'official', 'system', 'anonymous', 'supabase',
               'null', 'undefined', 'root', 'superuser', 'webmaster', 'security', 'helpdesk')
      or k like '%coasterlab%'
      or k ~ '^(admin|administrator|moderator|mod|owner|staff|support|official|system)[0-9]+$'
  from (select regexp_replace(lower(public.cl_plain(p)), '[^a-z0-9]', '', 'g') as k) x $$;
revoke execute on function public.cl_name_reserved(text) from public, anon, authenticated;

-- ============================================================ 3 · shared parks
-- (the 10.1 version, with one change: a signed-out author name that is staff-like or a registered player's name is
-- published as "Anonymous")
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
  if v_uid is not null then select username into v_name from public.profiles where id = v_uid; end if;
  if v_name is not null then v_author := public.cl_clean(v_name, 24, 'Anonymous');
  else
    v_author := public.cl_clean(p_author, 24, 'Anonymous');
    if public.cl_name_reserved(v_author) or exists (select 1 from public.profiles where lower(username) = lower(v_author)) then v_author := 'Anonymous'; end if;
  end if;
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

-- leaderboards (the 10.1 query, unchanged), now limited per connection: 1800 an hour is one every two seconds; the
-- game asks at most every 20 seconds while the Share tab is open. It now runs as plpgsql (it writes the counter), so
-- PostgREST must be called with POST, which is what the game does.
create or replace function public.cl_list_parks(p_sort text default 'top', p_limit int default 20) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.cl_allow('list', public.cl_caller(), 1800, interval '1 hour') then raise exception 'slow down: the park lists were asked for very often from this connection, try again in a few minutes'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('code', t.code, 'name', t.name, 'author', t.author, 'stats', t.stats, 'visits', t.visits, 'updated', t.updated, 'stars', t.stars, 'votes', t.votes, 'member', t.member) order by t.ord), '[]'::jsonb) into r from (
    select p.code, public.cl_clean(p.name, 40, 'My Park') as name, public.cl_clean(p.author, 24, 'Anonymous') as author, public.cl_stats_clean(p.stats) as stats, p.visits, p.updated_at as updated,
      round(coalesce(rt.avg, 0), 2) as stars, coalesce(rt.n, 0) as votes, (p.user_id is not null) as member,
      row_number() over (order by
        case when p_sort = 'visits' then p.visits::numeric
             when p_sort = 'rating' then coalesce(public.cl_num(p.stats, 'rating', 0, 100), 0)
             when p_sort = 'new' then extract(epoch from p.updated_at)::numeric
             else (coalesce(rt.avg, 0) * coalesce(rt.n, 0) + 9) / (coalesce(rt.n, 0) + 3) end desc, p.updated_at desc) as ord
    from public.cl_parks p
    left join (select park_id, avg(stars) as avg, count(*) as n from public.cl_park_ratings group by park_id) rt on rt.park_id = p.id
    order by ord limit least(greatest(coalesce(p_limit, 20), 1), 50)) t;
  return r;
end $$;

-- ============================================================ 4 · player accounts
-- (the 10.1 version, with one change: the device label is cleaned like any other text)
create or replace function public.cl_save_put(p_slot text, p_data jsonb, p_meta jsonb default '{}'::jsonb, p_device text default '', p_base_rev bigint default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v public.cl_saves; v_dev text := public.cl_clean(p_device, 40, '');
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
    update public.cl_saves set data = p_data, meta = coalesce(p_meta, '{}'::jsonb), device = v_dev, rev = v.rev + 1, updated_at = now()
      where user_id = v_uid and slot = p_slot;
    return jsonb_build_object('rev', v.rev + 1, 'updated', now());
  end if;
  begin
    insert into public.cl_saves (user_id, slot, data, meta, device) values (v_uid, p_slot, p_data, coalesce(p_meta, '{}'::jsonb), v_dev);
  exception when unique_violation then
    select * into v from public.cl_saves where user_id = v_uid and slot = p_slot;
    return jsonb_build_object('conflict', true, 'rev', v.rev, 'meta', v.meta, 'device', v.device, 'updated', v.updated_at);
  end;
  return jsonb_build_object('rev', 1, 'updated', now());
end $$;

-- ============================================================ 5 · writes go through the functions only
-- cl_saves: players keep SELECT (cl_me, cl_save_get) and DELETE (cl_save_delete) on their own rows; every write is
-- cl_save_put (park check, 240 an hour, revision counter).
revoke insert, update, truncate, references, trigger on table public.cl_saves from authenticated;
-- profiles: players keep SELECT on their own row (cl_me); the name changes only through cl_set_username.
revoke update on table public.profiles from authenticated;
revoke update (username) on table public.profiles from authenticated;
-- coasters: no build reads or writes it. Grant the writes again when a feature needs them.
revoke insert, update, delete, truncate, references, trigger on table public.coasters from authenticated;
-- vip_purchases (production only; written and read by the VIP Edge Functions with the service role)
do $$ begin
  if to_regclass('public.vip_purchases') is not null then revoke all on table public.vip_purchases from anon, authenticated; end if;
end $$;

-- ============================================================ 6 · who may call what (stated again in full)
revoke execute on function public.cl_publish_park(text, text, text, text, jsonb, jsonb) from public;
revoke execute on function public.cl_list_parks(text, int) from public;
grant execute on function public.cl_publish_park(text, text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.cl_list_parks(text, int) to anon, authenticated;
revoke execute on function public.cl_save_put(text, jsonb, jsonb, text, bigint) from public, anon;
grant execute on function public.cl_save_put(text, jsonb, jsonb, text, bigint) to authenticated;
