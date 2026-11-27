-- Coaster Lab 10.10.1 release attacks (2026-11-27). Runs after 10_tests.sql, on the repository migrations, as a
-- signed-out visitor and as signed-in players. Every check prints PASS or FAIL. These are the attacks the earlier
-- suites did not try: staff impersonation, Unicode look-alikes, rate-limit bypass with forged network headers and
-- IPv6 address rotation, direct table writes that skip the server checks, forged JWT claims, unthrottled reads,
-- unbounded text, and how the network fingerprints are stored. Uses its own players and addresses (documentation
-- ranges 192.0.2.0/24, 198.18.0.0/15 and 2001:db8::/32) and removes them at the end.
--
-- X = server-side authorization and owner permissions · N = names and impersonation · L = rate limits
-- D = direct table access · V = input validation · F = network fingerprints · M = owner moderation runbook
create function t.hdr(uid uuid, h jsonb, claims jsonb default null) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claims', coalesce(claims, case when uid is null then '{"role":"anon"}'::jsonb else jsonb_build_object('sub', uid, 'role', 'authenticated') end)::text, false);
  perform set_config('request.headers', h::text, false); end $$;
grant execute on function t.hdr(uuid, jsonb, jsonb) to anon, authenticated;
create table t.out (k text primary key, v jsonb); grant all on t.out to anon, authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000e1', 'eve@example.test', '{"username":"Eve"}'),
  ('00000000-0000-4000-8000-0000000000f1', 'finn@example.test', '{"username":"Finn"}');

-- ============================================================ X · authorization and owner permissions
select t.ok((select array_agg(p.proname::text order by p.proname) from pg_proc p where p.pronamespace = 'public'::regnamespace
    and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute')))
  = array['cl_get_park','cl_list_parks','cl_me','cl_my_parks','cl_publish_park','cl_rate_park','cl_save_delete','cl_save_get','cl_save_put','cl_set_username','cl_unpublish_park','cl_username_free'],
  'X1 browsers can call exactly the twelve game functions, nothing else (no hidden admin or helper entry point)');
select t.ok(not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace
    and p.prosrc ~* '(request\.jwt|app_metadata|user_metadata|auth\.jwt\(|auth\.role\(|current_user|session_user)'),
  'X2 no function decides anything from JWT claims, metadata or the database role: only auth.uid() identifies a player');
select t.ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and column_name ~* '(^|_)(role|admin|owner|moder|mod|staff|perm|privilege|is_vip|tier|banned)(_|$)' and not (table_name = 'cl_parks' and column_name = 'owner_hash')),
  'X3 no table stores a staff, owner or role flag a player could try to set (cl_parks.owner_hash is the publishing device''s key hash)');
-- forged claims: a player who edits their token to say service_role / admin (PostgREST verifies the signature, but
-- even a claim that got through must give nothing: the database role stays `authenticated`)
set role authenticated; select t.hdr('00000000-0000-4000-8000-0000000000e1', '{"cf-connecting-ip":"192.0.2.10"}',
  '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"service_role","app_metadata":{"role":"admin","is_owner":true},"user_metadata":{"role":"admin"}}');
select t.ok(t.throws('select 1 from public.cl_parks', 'permission denied') and t.throws('select 1 from public.cl_rate', 'permission denied') and t.n('select count(*) from public.profiles') = 1,
  'X4 a token that claims service_role or admin still cannot read parks, rate limits or other players');
insert into t.out values ('xe', public.cl_publish_park(repeat('e', 48), 'evepark1', 'Eve Park', 'x', (select p from t.park), '{}'));
reset role;
set role authenticated; select t.hdr('00000000-0000-4000-8000-0000000000f1', '{"cf-connecting-ip":"192.0.2.11"}',
  '{"sub":"00000000-0000-4000-8000-0000000000f1","role":"service_role","app_metadata":{"role":"admin"}}');
select t.ok(public.cl_unpublish_park(repeat('f', 48), (select v ->> 'code' from t.out where k = 'xe')) = false and public.cl_save_get('career') is null
  and (select count(*) from jsonb_array_elements(public.cl_my_parks(repeat('f', 48)))) = 0,
  'X5 with forged admin claims, another player still cannot remove Eve''s park or see her saves or parks');
reset role;
select t.ok(exists (select 1 from public.cl_parks where code = (select v ->> 'code' from t.out where k = 'xe')), 'X6 Eve''s park is still there');
-- nothing a browser gets back ever carries a device-key hash or a network fingerprint
set role anon; select t.hdr(null, '{"cf-connecting-ip":"192.0.2.12"}');
insert into t.out values ('xl', public.cl_list_parks('new', 50)), ('xg', public.cl_get_park((select v ->> 'code' from t.out where k = 'xe')));
select t.ok(not exists (select 1 from t.out o, jsonb_array_elements(case when jsonb_typeof(o.v) = 'array' then o.v else jsonb_build_array(o.v) end) e
    where o.k in ('xl', 'xg') and (e ? 'owner_hash' or e ? 'creator_hash' or e ? 'user_id' or e ? 'park_key' or e ? 'id')),
  'X7 lists and fetched parks never include device-key hashes, network fingerprints, account ids or private park keys');
reset role;

-- ============================================================ N · names and impersonation
set role anon; select t.hdr(null, '{"cf-connecting-ip":"192.0.2.20"}');
insert into t.out values
  ('n1', public.cl_publish_park(repeat('1', 47) || 'a', 'imp1', 'Real Park', 'Admin', (select p from t.park), '{}')),
  ('n2', public.cl_publish_park(repeat('1', 47) || 'b', 'imp2', 'Real Park', ' coaster-lab OFFICIAL ', (select p from t.park), '{}')),
  ('n3', public.cl_publish_park(repeat('1', 47) || 'c', 'imp3', 'Real Park', 'EVE', (select p from t.park), '{}')),
  ('n4', public.cl_publish_park(repeat('1', 47) || 'd', 'imp4', 'Real Park', E'\uFF21\uFF44\uFF4D\uFF49\uFF4E', (select p from t.park), '{}'));
create temp table na as select k, (select q ->> 'author' from jsonb_array_elements(public.cl_list_parks('new', 50)) q where q ->> 'code' = o.v ->> 'code') a from t.out o where k like 'n_';
grant select on na to anon, authenticated;
select t.ok((select a from na where k = 'n1') = 'Anonymous' and (select a from na where k = 'n2') = 'Anonymous', 'N1 a signed-out park cannot be credited to "Admin" or "Coaster Lab Official"');
select t.ok((select a from na where k = 'n4') = 'Anonymous', 'N2 full-width look-alike letters (U+FF21 U+FF44 ...) do not get round the staff-name check');
select t.ok((select a from na where k = 'n3') = 'Anonymous', 'N3 a signed-out park cannot be credited to a registered player''s name (EVE for Eve)');
insert into t.out values ('n5', public.cl_publish_park(repeat('1', 47) || 'e', 'imp5', E'Fun\u202E\u2066Park\u200B', E'Zo\u200Be\u202E', (select p from t.park), '{}'));
select t.ok((select q ->> 'name' || '|' || (q ->> 'author') from jsonb_array_elements(public.cl_list_parks('new', 50)) q where q ->> 'code' = (select v ->> 'code' from t.out where k = 'n5')) = 'FunPark|Zoe',
  'N4 invisible characters and right-to-left overrides are removed from park and author names (no text that displays differently than it reads)');
reset role;
set role authenticated; select t.hdr('00000000-0000-4000-8000-0000000000f1', '{"cf-connecting-ip":"192.0.2.21"}');
select t.ok(t.throws($$select public.cl_set_username(E'\uFF21\uFF44\uFF4D\uFF49\uFF4E')$$, 'not available') and t.throws($$select public.cl_set_username(E'\uFF2D\uFF4F\uFF44')$$, 'not available'),
  'N5 a player name cannot be a staff name written in full-width look-alike letters');
insert into t.out values ('n6', public.cl_set_username(E'\u202Enimda\u202C'));
select t.ok((select v ->> 'username' from t.out where k = 'n6') = 'nimda', 'N5b a right-to-left override is removed: U+202E + "nimda" is stored and shown as "nimda", never displayed reversed as "admin"');
select t.ok(t.throws($$select public.cl_set_username(E'E\u200Bve')$$, 'taken') and t.throws($$select public.cl_set_username(E'\uFF25ve')$$, 'taken') and not public.cl_username_free(E'Ev\u200Be'),
  'N6 a name that only differs from a taken one by invisible or full-width characters counts as taken');
reset role;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000f2', 'gus@example.test', jsonb_build_object('username', E'\u202EGus\u200F'));
select t.ok((select username from public.profiles where id = '00000000-0000-4000-8000-0000000000f2') = 'Gus', 'N7 sign-up names are cleaned of invisible and direction characters too');
select t.ok(public.cl_name(E'Gu\U000E0061\U000E0064\U000E006D\U000E0069\U000E006Es\uFE0F\U000E0100') = 'Gus' and not public.cl_username_free(E'G\U000E0041us'),
  'N8 invisible Unicode tag characters ("ASCII smuggling") and variation selectors are removed too, and do not make a taken name look free');

-- ============================================================ L · rate limits
-- The limits key on a fingerprint of the caller's address. Cloudflare sets cf-connecting-ip itself, but anything in
-- x-forwarded-for before the last hop, and x-real-ip, is whatever the browser sent.
update public.cl_parks set created_at = created_at - interval '2 minutes';-- (keeps the whole cloud's 60-a-minute guard out of these checks)
set role anon;
-- L1: the real address is there; the browser sends a different made-up x-forwarded-for every time
do $$ begin for g in 1..6 loop
  perform t.hdr(null, jsonb_build_object('cf-connecting-ip', '198.18.0.1', 'x-forwarded-for', '10.9.9.' || g || ', 198.18.0.1'));
  perform public.cl_publish_park(repeat('l', 46) || lpad(g::text, 2, '0'), 'xff' || g, 'X', 'x', (select p from t.park), '{}'); end loop; end $$;
select t.hdr(null, '{"cf-connecting-ip":"198.18.0.1","x-forwarded-for":"10.9.9.99, 198.18.0.1"}');
select t.ok(t.throws($$select public.cl_publish_park(repeat('l', 46) || '07', 'xff7', 'X', 'x', (select p from t.park), '{}')$$, 'slow down'), 'L1 a made-up x-forwarded-for does not reset the limit when the real address is known');
-- L2: no cf-connecting-ip; the browser puts a new made-up address first in x-forwarded-for (and in x-real-ip) every time
do $$ begin for g in 1..6 loop
  perform t.hdr(null, jsonb_build_object('x-forwarded-for', '10.8.8.' || g || ', 198.18.0.2', 'x-real-ip', '10.7.7.' || g));
  perform public.cl_publish_park(repeat('m', 46) || lpad(g::text, 2, '0'), 'xfg' || g, 'X', 'x', (select p from t.park), '{}'); end loop; end $$;
select t.hdr(null, '{"x-forwarded-for":"10.8.8.99, 198.18.0.2","x-real-ip":"10.7.7.99"}');
select t.ok(t.throws($$select public.cl_publish_park(repeat('m', 46) || '07', 'xfg7', 'X', 'x', (select p from t.park), '{}')$$, 'slow down'), 'L2 without cf-connecting-ip, the browser-written start of x-forwarded-for and x-real-ip are not trusted');
-- L3: IPv6 rotation. One home connection or one cloud server gets a whole /64 (18 billion billion addresses)
do $$ begin for g in 1..6 loop
  perform t.hdr(null, jsonb_build_object('cf-connecting-ip', '2001:db8:aa:bb::' || to_hex(g)));
  perform public.cl_publish_park(repeat('n', 46) || lpad(g::text, 2, '0'), 'six' || g, 'X', 'x', (select p from t.park), '{}'); end loop; end $$;
select t.hdr(null, '{"cf-connecting-ip":"2001:db8:aa:bb:dead:beef:1:2"}');
select t.ok(t.throws($$select public.cl_publish_park(repeat('n', 46) || '07', 'six7', 'X', 'x', (select p from t.park), '{}')$$, 'slow down'), 'L3 rotating through the addresses of one IPv6 /64 does not reset the limit');
select t.hdr(null, '{"cf-connecting-ip":"2001:db8:aa:bc::1"}');
select t.ok(not t.throws($$select public.cl_publish_park(repeat('n', 46) || '08', 'six8', 'X', 'x', (select p from t.park), '{}')$$), 'L4 a neighbouring /64 (another household) is not affected');
-- L5: IPv4 addresses written in IPv6 form (::ffff:a.b.c.d) are separate callers, not one shared /64
reset role; update public.cl_parks set created_at = created_at - interval '2 minutes'; set role anon;
do $$ begin for g in 1..6 loop
  perform t.hdr(null, jsonb_build_object('cf-connecting-ip', '::ffff:198.18.1.' || g));
  perform public.cl_publish_park(repeat('o', 46) || lpad(g::text, 2, '0'), 'map' || g, 'X', 'x', (select p from t.park), '{}'); end loop; end $$;
select t.hdr(null, '{"cf-connecting-ip":"::ffff:198.18.1.7"}');
select t.ok(not t.throws($$select public.cl_publish_park(repeat('o', 46) || '07', 'map7', 'X', 'x', (select p from t.park), '{}')$$), 'L5 IPv4 addresses written in IPv6 form are still told apart (they are not lumped into one bucket)');
reset role;
-- L6: the leaderboard is the most expensive read (it ranks every park): it is limited per connection too
set role anon; select t.hdr(null, '{"cf-connecting-ip":"198.18.0.50"}'); reset role;
insert into public.cl_rate (bucket, win, n) select left('list:' || public.cl_caller(), 120), to_timestamp(floor(extract(epoch from now()) / 3600) * 3600), 100000
  on conflict (bucket, win) do update set n = 100000;
set role anon;
select t.ok(t.throws($$select public.cl_list_parks('top', 20)$$, 'slow down'), 'L6 one connection cannot ask for the leaderboards without limit');
select t.hdr(null, '{"cf-connecting-ip":"198.18.0.51"}');
select t.ok(jsonb_typeof(public.cl_list_parks('top', 20)) = 'array', 'L7 other connections still get the leaderboards');
reset role;

-- ============================================================ D · direct table access (PostgREST exposes every granted table)
set role authenticated; select t.hdr('00000000-0000-4000-8000-0000000000e1', '{"cf-connecting-ip":"192.0.2.30"}');
select t.ok(t.throws($$insert into public.cl_saves (user_id, slot, data) values (auth.uid(), 'career', '{"not":"a park"}')$$, 'permission denied'),
  'D1 a player cannot write a save straight into the table (that would skip the park check and the 240-an-hour limit)');
select public.cl_save_put('career', (select p from t.park), '{}', 'Eve phone', null);
select t.ok(t.throws($$update public.cl_saves set rev = 999999, data = '{"x":1}' where user_id = auth.uid()$$, 'permission denied') and (public.cl_save_get('career') ->> 'rev')::int = 1,
  'D2 a player cannot rewrite a save''s revision or data directly');
select t.ok(public.cl_save_delete('career') and t.n('select count(*) from public.cl_saves') = 0, 'D3 a player can still read and delete their own saves');
select t.ok(t.throws($$update public.profiles set username = 'Evie' where id = auth.uid()$$, 'permission denied') and (public.cl_set_username('Evie') ->> 'username') = 'Evie',
  'D4 a player name changes only through cl_set_username (which is limited to 5 an hour and renames their parks too)');
select t.ok(t.throws($$insert into public.coasters (user_id, name, design) values (auth.uid(), 'x', '{}')$$, 'permission denied')
  and t.throws($$update public.coasters set name = 'x'$$, 'permission denied') and t.throws('delete from public.coasters', 'permission denied'),
  'D5 the unused coasters table cannot be written (no build uses it; 60 x 400 kB per account was open storage)');
reset role;

-- ============================================================ V · input validation
set role authenticated; select t.hdr('00000000-0000-4000-8000-0000000000e1', '{"cf-connecting-ip":"192.0.2.40"}');
select public.cl_save_put('sandbox', (select p from t.park), '{}', '<img src=x onerror=alert(1)>' || repeat('z', 50), null);
select t.ok((select s ->> 'device' from jsonb_array_elements(public.cl_me() -> 'saves') s where s ->> 'slot' = 'sandbox') !~ '[<>"&]', 'V1 the device label stored with a save is cleaned (it is shown on the player''s other devices)');
select public.cl_save_delete('sandbox');
reset role;
set role anon; select t.hdr(null, '{"cf-connecting-ip":"192.0.2.41"}');
insert into t.out values ('v2', public.cl_publish_park(repeat('2', 48), 'bigname', repeat('N', 2000000), repeat('A', 2000000), (select p from t.park), '{}'));
select t.ok((select char_length(q ->> 'name') <= 40 and char_length(q ->> 'author') <= 24 from jsonb_array_elements(public.cl_list_parks('new', 50)) q where q ->> 'code' = (select v ->> 'code' from t.out where k = 'v2')), 'V2 two-megabyte names are cut to size');
select t.ok(t.throws($$select public.cl_get_park(repeat('A', 2000000))$$, '') = false and public.cl_get_park(repeat('A', 2000000)) is null and t.throws($$select public.cl_rate_park(repeat('A', 2000000), repeat('3', 48), 3)$$, 'no park'),
  'V3 a two-megabyte park code is simply not found');
reset role;

-- ============================================================ F · network fingerprints
set role anon; select t.hdr(null, '{"cf-connecting-ip":"192.0.2.77"}'); reset role;
select t.ok(public.cl_caller() not in (public.cl_hash('ip:192.0.2.77'), public.cl_hash('192.0.2.77'), public.cl_hash('ip:192.0.2.77/32')),
  'F1 a stored fingerprint cannot be turned back into the address by hashing all four billion IPv4 addresses (it is keyed with a server secret)');
select t.ok(not exists (select 1 from pg_class c, unnest(array['anon','authenticated']) r, unnest(array['select','insert','update','delete']) pr
    where c.relnamespace = 'public'::regnamespace and c.relname = 'cl_secret' and has_table_privilege(r, c.oid, pr)) and exists (select 1 from pg_class where relname = 'cl_secret' and relrowsecurity),
  'F2 that server secret cannot be read or changed from a browser');

-- ============================================================ M · owner moderation (docs/security/RELEASE-10.10.1.md, "Moderation runbook")
-- The owner has no in-game server power by design (X1-X3); abuse is handled in the Supabase dashboard's SQL editor,
-- which runs as the table owner. These are the runbook's statements, word for word, with Finn as the abusive player.
update public.cl_parks set created_at = created_at - interval '2 minutes';
set role authenticated; select t.hdr('00000000-0000-4000-8000-0000000000f1', '{"cf-connecting-ip":"192.0.2.90"}');
insert into t.out values ('m1', public.cl_publish_park(repeat('9', 48), 'rudepark', 'Rude park', 'x', (select p from t.park), '{}'));
reset role;
set role anon; select t.hdr(null, '{"cf-connecting-ip":"192.0.2.91"}');
select public.cl_rate_park((select v ->> 'code' from t.out where k = 'm1'), repeat('8', 48), 5); select public.cl_get_park((select v ->> 'code' from t.out where k = 'm1'));
insert into t.out values ('m2', public.cl_publish_park(repeat('7', 48), 'spam0001', 'Spam 1', 'x', (select p from t.park), '{}')), ('m3', public.cl_publish_park(repeat('6', 48), 'spam0002', 'Spam 2', 'x', (select p from t.park), '{}'));
reset role;
-- runbook 1: take one park down by its code (its ratings and visit counts go with it)
delete from public.cl_parks where code = (select v ->> 'code' from t.out where k = 'm1');
select t.ok(not exists (select 1 from public.cl_parks where code = (select v ->> 'code' from t.out where k = 'm1')) and not exists (select 1 from public.cl_park_ratings r left join public.cl_parks p on p.id = r.park_id where p.id is null)
  and not exists (select 1 from public.cl_park_visits v left join public.cl_parks p on p.id = v.park_id where p.id is null), 'M1 runbook: deleting a park by its code also removes its ratings and visit counts');
-- runbook 2: give an abusive player a neutral name, on their profile and on every park they published
update public.profiles set username = 'rider_' || substr(md5(random()::text), 1, 10) where id = '00000000-0000-4000-8000-0000000000f1';
update public.cl_parks p set author = pr.username from public.profiles pr where pr.id = p.user_id and p.user_id = '00000000-0000-4000-8000-0000000000f1';
select t.ok((select username ~ '^rider_[0-9a-f]{10}$' from public.profiles where id = '00000000-0000-4000-8000-0000000000f1'), 'M2 runbook: an abusive player name can be replaced with a neutral one');
-- runbook 3: remove every signed-out park published from the same connection as a reported one
delete from public.cl_parks where user_id is null and creator_hash = (select creator_hash from public.cl_parks where code = (select v ->> 'code' from t.out where k = 'm2'));
select t.ok(not exists (select 1 from public.cl_parks where code in (select v ->> 'code' from t.out where k in ('m2', 'm3'))), 'M3 runbook: every signed-out park from the connection that published a reported park can be removed at once');

-- clean up: remove this file's players and parks so later steps start from the same state
delete from public.cl_parks where park_key ~ '^(evepark1|imp[1-5]|xff[0-9]+|xfg[0-9]+|six[0-9]+|map[0-9]+|bigname|rudepark|spam000[12])$';
delete from auth.users where id in ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000f2');
delete from public.cl_rate;
