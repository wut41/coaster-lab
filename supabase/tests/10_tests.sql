-- Coaster Lab database tests (run by run.sh on a throw-away local PostgreSQL). Every check prints PASS or FAIL.
-- The checks call the functions and tables the way a browser can: as the `anon` role (signed out) or the
-- `authenticated` role with a user id (signed in), with the network address the API gateway would report.
create schema t;
create function t.ok(c boolean, name text) returns void language plpgsql as $$ begin raise notice '%', (case when c is true then 'PASS ' else 'FAIL ' end) || name; end $$;
-- true when the statement fails and its message matches
create function t.throws(q text, pat text default '') returns boolean language plpgsql as $$ begin execute q; return false; exception when others then return (sqlerrm ~* pat) or (sqlstate = pat); end $$;
create function t.j(q text) returns jsonb language plpgsql as $$ declare r jsonb; begin execute q into r; return r; end $$;
create function t.n(q text) returns bigint language plpgsql as $$ declare r bigint; begin execute q into r; return r; end $$;
create function t.who(uid uuid, ip text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claims', case when uid is null then '{"role":"anon"}' else json_build_object('sub', uid, 'role', 'authenticated')::text end, false);
  perform set_config('request.headers', json_build_object('cf-connecting-ip', ip, 'x-forwarded-for', '10.0.0.1, 10.0.0.2')::text, false); end $$;
grant usage on schema t to anon, authenticated; grant execute on all functions in schema t to anon, authenticated;
create table t.park as select '{"v":1,"name":"Test Park","mode":"career","objs":[{"id":1,"k":"carousel","x":20,"z":40,"r":0}],"paths":{}}'::jsonb as p;
grant select on t.park to anon, authenticated;
create table t.ids (k text primary key, id uuid); grant select on t.ids to anon, authenticated;

-- three players made the way sign-up makes them (the trigger creates their profile)
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000000000a', 'ana@example.test', '{"username":"Ana"}'),
  ('00000000-0000-4000-8000-00000000000b', 'ben@example.test', '{"username":"Ben"}');
insert into t.ids values ('a', '00000000-0000-4000-8000-00000000000a'), ('b', '00000000-0000-4000-8000-00000000000b');

-- ============================================================ A · what the catalog says
select t.ok(not exists (select 1 from unnest(array['profiles','coasters','cl_parks','cl_park_ratings','cl_saves','cl_rate','cl_park_visits']) tb, unnest(array['select','insert','update','delete','truncate']) pr where has_table_privilege('anon', 'public.' || tb, pr)),
  'A1 signed-out callers hold no privilege on any of the seven tables');
select t.ok(has_table_privilege('authenticated', 'public.profiles', 'select') and not has_table_privilege('authenticated', 'public.profiles', 'update') and has_column_privilege('authenticated', 'public.profiles', 'username', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'id', 'update') and not has_table_privilege('authenticated', 'public.profiles', 'insert') and not has_table_privilege('authenticated', 'public.profiles', 'delete') and not has_table_privilege('authenticated', 'public.profiles', 'truncate'),
  'A2 signed-in players can read profiles and change only the username column');
select t.ok(not exists (select 1 from unnest(array['cl_parks','cl_park_ratings','cl_rate','cl_park_visits']) tb, unnest(array['select','insert','update','delete']) pr where has_table_privilege('authenticated', 'public.' || tb, pr)),
  'A3 signed-in players cannot touch parks, ratings, visit counts or rate limits directly');
select t.ok((select bool_and(c.relrowsecurity) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'), 'A4 row level security is on for every table in public');
select t.ok(not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')),
  'A5 every function that runs with its owner''s rights has a fixed search_path');
select t.ok(not exists (select 1 from pg_proc p, unnest(array['anon','authenticated']) r where p.pronamespace = 'public'::regnamespace
  and p.proname in ('cl_hash','cl_clean','cl_allow','cl_caller','cl_stats_clean','cl_num','cl_name','cl_name_reserved','cl_park_ok','cl_profiles_clean','cl_coasters_limit','handle_new_user','set_updated_at') and has_function_privilege(r, p.oid, 'execute')),
  'A6 helper and trigger functions cannot be called from a browser');
select t.ok(not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('cl_me','cl_set_username','cl_save_put','cl_save_get','cl_save_delete') and has_function_privilege('anon', p.oid, 'execute')),
  'A7 the account functions cannot be called signed out');
select t.ok(not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and has_function_privilege('public', p.oid, 'execute')), 'A8 no function in public is open to PUBLIC');

-- ============================================================ B · tables, asked directly
set role anon; select t.who(null, '198.51.100.1');
select t.ok(t.throws('select 1 from public.cl_parks', 'permission denied') and t.throws('select 1 from public.cl_saves', 'permission denied') and t.throws('select 1 from public.profiles', 'permission denied') and t.throws('select 1 from public.cl_rate', 'permission denied'),
  'B1 signed out: reading any table directly is refused');
select t.ok(t.throws('insert into public.cl_parks (code, owner_hash, park_key, name, data) values (''ABCDEF'', repeat(''a'',64), ''abcd'', ''x'', ''{}'')', 'permission denied'), 'B2 signed out: writing a park row directly is refused');
reset role;

set role authenticated; select t.who((select id from t.ids where k = 'a'), '198.51.100.2');
select t.ok(t.n('select count(*) from public.profiles') = 1 and t.j('select to_jsonb(username) from public.profiles') = '"Ana"', 'B3 a player sees their own profile and nobody else''s');
select t.ok(t.n($$with u as (update public.profiles set username = 'Hacked' where id = '00000000-0000-4000-8000-00000000000b' returning 1) select count(*) from u$$) = 0, 'B4 a player cannot rename someone else');
select t.ok(t.throws($$update public.profiles set id = '00000000-0000-4000-8000-00000000000b' where id = auth.uid()$$, 'permission denied') and t.throws('update public.profiles set created_at = now() where id = auth.uid()', 'permission denied'), 'B5 a player cannot change the id or creation date of their profile');
select t.ok(t.j($$with u as (update public.profiles set username = '<b>Ana</b> "The" & `Great`' where id = auth.uid() returning username) select to_jsonb(username) from u$$) = '"bAna/b The Great"', 'B6 a name written straight to the table is cleaned by the database (no < > " & `)');
select t.ok(t.throws($$update public.profiles set username = 'Admin' where id = auth.uid()$$, 'not available') and t.throws($$update public.profiles set username = ' Coaster-Lab ' where id = auth.uid()$$, 'not available') and t.throws($$update public.profiles set username = 'x' where id = auth.uid()$$, '3 to 24'), 'B7 official-looking and too-short names are refused');
select t.ok(t.throws($$update public.profiles set username = 'BEN' where id = auth.uid()$$, 'unique|duplicate'), 'B8 a name that differs from another player''s only by capitals is refused');
select t.ok(t.throws($$insert into public.profiles (id, username) values (gen_random_uuid(), 'Ghost')$$, 'permission denied') and t.throws('delete from public.profiles', 'permission denied'), 'B9 a player cannot add or delete profile rows');
update public.profiles set username = 'Ana' where id = auth.uid();
-- cloud saves, asked directly
select t.ok(not t.throws($$insert into public.cl_saves (user_id, slot, data) values (auth.uid(), 'sandbox', (select p from t.park))$$), 'B10 a player can store their own save row');
select t.ok(t.throws($$insert into public.cl_saves (user_id, slot, data) values ('00000000-0000-4000-8000-00000000000b', 'career', (select p from t.park))$$, 'row-level security'), 'B11 a player cannot store a save under another player''s id');
delete from public.cl_saves where user_id = auth.uid();
-- coasters (not used by the game yet)
select t.ok(not t.throws($$insert into public.coasters (user_id, name, design) values (auth.uid(), 'One', '{"v":2}')$$) and t.throws($$insert into public.coasters (user_id, name, design) values ('00000000-0000-4000-8000-00000000000b', 'Two', '{}')$$, 'row-level security'), 'B12 coasters: a player can add their own and not someone else''s');
select t.ok(t.throws($$insert into public.coasters (user_id, name, design) values (auth.uid(), 'Big', jsonb_build_object('pad', repeat('x', 400001)))$$, 'coasters_design_size'), 'B13 coasters: a design over 400 kB is refused');
insert into public.coasters (user_id, name, design) select auth.uid(), 'C' || g, '{}' from generate_series(2, 60) g;
select t.ok(t.throws($$insert into public.coasters (user_id, name, design) values (auth.uid(), 'Too many', '{}')$$, 'at most 60'), 'B14 coasters: the 61st design is refused');
reset role;
set role authenticated; select t.who((select id from t.ids where k = 'b'), '198.51.100.3');
select t.ok(t.n('select count(*) from public.coasters') = 0 and t.n('select count(*) from public.cl_saves') = 0 and t.n('select count(*) from public.profiles') = 1, 'B15 another player sees none of those rows');
reset role;

-- ============================================================ C · sign-up (the existing trigger, with 10.1 cleaning)
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-00000000000c', 'cy@example.test', '{"username":"<img src=x onerror=1>"}');
select t.ok((select username from public.profiles where id = '00000000-0000-4000-8000-00000000000c') = 'img src=x onerror=1', 'C1 markup in a sign-up name is removed before it is stored');
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-00000000000d', 'di@example.test', '{"username":"<>"}');
select t.ok((select username from public.profiles where id = '00000000-0000-4000-8000-00000000000d') = 'rider_00000000', 'C2 a sign-up name with nothing usable in it becomes rider_…');
select t.ok(t.throws($$insert into auth.users (email, raw_user_meta_data) values ('e@example.test', '{"username":"Moderator"}')$$, 'not available') and t.throws($$insert into auth.users (email, raw_user_meta_data) values ('f@example.test', '{"username":"ana"}')$$, 'unique|duplicate'),
  'C3 sign-up with an official-looking name, or a taken one in other capitals, fails (the game says “taken or not allowed”)');
insert into t.ids values ('c', '00000000-0000-4000-8000-00000000000c');

-- ============================================================ D · shared parks, signed out
set role anon; select t.who(null, '203.0.113.10');
create temp table r (k text primary key, v jsonb); grant all on r to anon, authenticated;
insert into r values ('p1', public.cl_publish_park(repeat('a', 48), 'parkone1', '<b>Fun</b> Park', 'Zoe "Z" <script>', (select p from t.park),
  '{"rating":61.6,"rep":40,"day":3,"guests":120,"rides":300,"coasters":2,"attractions":5,"level":4,"mode":"career","money":1234,"evil":"<img src=x onerror=alert(1)>","nested":{"a":1}}'));
select t.ok((select v ->> 'code' from r where k = 'p1') ~ '^[2-9A-HJ-NP-Z]{6}$' and (select (v ->> 'updated')::boolean from r where k = 'p1') = false and (select (v ->> 'member')::boolean from r where k = 'p1') = false, 'D1 publishing gives a six-character code');
insert into r values ('l1', public.cl_list_parks('new', 10));
select t.ok((select v -> 0 ->> 'name' from r where k = 'l1') = 'bFun/b Park' and (select v -> 0 ->> 'author' from r where k = 'l1') = 'Zoe Z script', 'D2 the park name and author are stored without < > " &');
select t.ok((select v -> 0 -> 'stats' from r where k = 'l1') = '{"day":3,"rep":40,"mode":"career","level":4,"money":1234,"rides":300,"guests":120,"rating":62,"coasters":2,"attractions":5}'::jsonb, 'D3 statistics keep only the known number fields (the extra "evil" field is gone)');
-- a park whose statistics are not numbers at all
insert into r values ('p2', public.cl_publish_park(repeat('b', 48), 'parktwo2', 'Second', 'Sam', (select p from t.park), '{"rating":"<img src=x onerror=alert(document.cookie)>","coasters":"<svg onload=alert(1)>","guests":1e99,"level":-5,"mode":"<x>"}'));
insert into r values ('l2', public.cl_list_parks('rating', 10));
select t.ok(jsonb_array_length((select v from r where k = 'l2')) = 2, 'D4 the "Best parks" list still works when a park sent text as its rating');
select t.ok(not (select v::text from r where k = 'l2') ~ '[<>]' and (select q -> 'stats' from r, jsonb_array_elements(v) q where k = 'l2' and q ->> 'name' = 'Second') = '{"level":1,"guests":10000000000000}'::jsonb, 'D5 text sent as statistics never reaches other players; numbers are kept inside their range');
select t.ok(t.throws($$select public.cl_publish_park('short', 'parkone1', 'x', 'y', (select p from t.park), '{}')$$, 'bad owner key') and t.throws($$select public.cl_publish_park(repeat('a',48), 'no spaces!', 'x', 'y', (select p from t.park), '{}')$$, 'bad park key')
  and t.throws($$select public.cl_publish_park(repeat('c',48), 'parkbad1', 'x', 'y', '{"a":1}', '{}')$$, 'not a Coaster Lab park') and t.throws($$select public.cl_publish_park(repeat('c',48), 'parkbad1', 'x', 'y', '[1,2]', '{}')$$, 'not a Coaster Lab park')
  and t.throws($$select public.cl_publish_park(repeat('c',48), 'parkbad1', 'x', 'y', jsonb_build_object('objs', '[]'::jsonb, 'pad', repeat('x', 400001)), '{}')$$, 'too large') and t.throws($$select public.cl_publish_park(repeat('c',48), 'parkbad1', 'x', 'y', (select p from t.park), '[]')$$, 'bad stats'),
  'D6 bad keys, things that are not parks, oversized parks and bad statistics are refused');
select t.ok(t.throws($$select public.cl_publish_park(repeat('a', 48), 'parkone1', 'Again', 'Zoe', (select p from t.park), '{}')$$, 'wait a few seconds'), 'D7 updating the same park again within 15 seconds is refused');
reset role; update public.cl_parks set updated_at = now() - interval '1 minute'; set role anon;
insert into r values ('p1b', public.cl_publish_park(repeat('a', 48), 'parkone1', 'Fun Park 2', 'Zoe', (select p from t.park), '{"rating":70}'));
select t.ok((select v ->> 'code' from r where k = 'p1b') = (select v ->> 'code' from r where k = 'p1') and (select (v ->> 'updated')::boolean from r where k = 'p1b'), 'D8 publishing again later updates the same park under the same code');
-- visits: once per caller, per park, per day
insert into r values ('g1', public.cl_get_park((select v ->> 'code' from r where k = 'p1'))); insert into r values ('g2', public.cl_get_park(lower((select v ->> 'code' from r where k = 'p1')))); insert into r values ('g3', public.cl_get_park((select v ->> 'code' from r where k = 'p1')));
select t.ok((select (v ->> 'visits')::int from r where k = 'g3') = 1 and (select v -> 'data' -> 'objs' -> 0 ->> 'k' from r where k = 'g3') = 'carousel' and (select v ->> 'name' from r where k = 'g3') = 'Fun Park 2', 'D9 opening a park three times from one connection counts one visit');
select t.who(null, '203.0.113.11'); insert into r values ('g4', public.cl_get_park((select v ->> 'code' from r where k = 'p1')));
select t.ok((select (v ->> 'visits')::int from r where k = 'g4') = 2 and public.cl_get_park('ZZZZZZ') is null, 'D10 a second connection counts a second visit; an unknown code gives nothing');
-- ratings
select t.ok(t.throws($$select public.cl_rate_park('$$ || (select v ->> 'code' from r where k = 'p1') || $$', repeat('a', 48), 5)$$, 'cannot rate your own') and t.throws($$select public.cl_rate_park('$$ || (select v ->> 'code' from r where k = 'p1') || $$', repeat('d', 48), 6)$$, '1 to 5') and t.throws($$select public.cl_rate_park('ZZZZZZ', repeat('d', 48), 3)$$, 'no park'), 'D11 rating your own park, a bad number of stars or an unknown park is refused');
insert into r values ('s1', public.cl_rate_park((select v ->> 'code' from r where k = 'p1'), repeat('d', 48), 5)); insert into r values ('s2', public.cl_rate_park((select v ->> 'code' from r where k = 'p1'), repeat('d', 48), 3));
select t.ok((select (v ->> 'votes')::int from r where k = 's2') = 1 and (select (v ->> 'stars')::numeric from r where k = 's2') = 3, 'D12 rating again from the same device replaces the first rating');
select public.cl_rate_park((select v ->> 'code' from r where k = 'p1'), repeat('e', 48), 5); select public.cl_rate_park((select v ->> 'code' from r where k = 'p1'), repeat('f', 48), 5);
select t.ok(t.throws($$select public.cl_rate_park('$$ || (select v ->> 'code' from r where k = 'p1') || $$', repeat('g', 48), 5)$$, 'already rated') and not t.throws($$select public.cl_rate_park('$$ || (select v ->> 'code' from r where k = 'p1') || $$', repeat('d', 48), 4)$$), 'D13 a fourth signed-out rating of one park from the same connection is refused (new device keys do not help); changing an earlier one still works');
select t.who(null, '203.0.113.12'); insert into r values ('s3', public.cl_rate_park((select v ->> 'code' from r where k = 'p1'), repeat('h', 48), 1));
select t.ok((select (v ->> 'votes')::int from r where k = 's3') = 4, 'D14 another connection can still rate it');
-- my parks, unpublish
select t.ok(jsonb_array_length(public.cl_my_parks(repeat('a', 48))) = 1 and jsonb_array_length(public.cl_my_parks(repeat('z', 48))) = 0 and public.cl_unpublish_park(repeat('z', 48), (select v ->> 'code' from r where k = 'p1')) = false, 'D15 only the device that published a park lists it and can remove it');
-- limits per connection
select t.who(null, '203.0.113.20');
select public.cl_publish_park(repeat('k', 47) || g::text, 'flood' || g::text, 'F' || g, 'x', (select p from t.park), '{}') from generate_series(1, 6) g;
select t.ok(t.throws($$select public.cl_publish_park(repeat('k', 47) || '7', 'flood7', 'F7', 'x', (select p from t.park), '{}')$$, 'slow down'), 'D16 a seventh new park in an hour from one connection is refused, whatever device key it sends');
select t.who(null, '203.0.113.21');
select t.ok(not t.throws($$select public.cl_publish_park(repeat('m', 48), 'other1', 'Other', 'x', (select p from t.park), '{}')$$), 'D17 other connections can still publish while that one is limited');
reset role; delete from public.cl_rate; set role anon; select t.who(null, '203.0.113.20');
select public.cl_publish_park(repeat('n', 47) || g::text, 'more' || g::text, 'M' || g, 'x', (select p from t.park), '{}') from generate_series(1, 4) g;
reset role; delete from public.cl_rate; set role anon;
select t.ok(t.throws($$select public.cl_publish_park(repeat('q', 48), 'eleven', 'E', 'x', (select p from t.park), '{}')$$, 'its share of parks'), 'D18 one connection can hold at most ten signed-out parks');
select t.who(null, '203.0.113.30');
select public.cl_publish_park(repeat('w', 48), 'five' || g::text, 'W' || g, 'x', (select p from t.park), '{}') from generate_series(1, 5) g;
select t.ok(t.throws($$select public.cl_publish_park(repeat('w', 48), 'five6', 'W6', 'x', (select p from t.park), '{}')$$, 'at most 5'), 'D19 one device can publish at most five parks');
reset role;
-- a row stored by 10.0 (before statistics were cleaned) cannot break or poison a list
insert into public.cl_parks (code, owner_hash, park_key, name, author, data, stats) values ('LEGACY', repeat('9', 64), 'legacy01', 'Old <i>park</i>', 'Old "author"', (select p from t.park), '{"rating":"abc","coasters":"<b>"}');
set role anon; select t.who(null, '203.0.113.40');
insert into r values ('l3', public.cl_list_parks('rating', 50)), ('l4', public.cl_list_parks('top', 50)), ('l5', public.cl_list_parks('visits', 50)), ('g5', public.cl_get_park('LEGACY'));
select t.ok(not (select string_agg(v::text, '') from r where k in ('l3', 'l4', 'l5')) ~ '[<>]' and (select v ->> 'name' from r where k = 'g5') = 'Old ipark/i' and (select v -> 'stats' from r where k = 'g5') = '{}'::jsonb, 'D20 a park stored before 10.1 with text statistics and markup comes out clean in every list');
reset role;

-- ============================================================ E · accounts
set role anon; select t.who(null, '203.0.113.50');
select t.ok(t.throws('select public.cl_me()', 'permission denied') and t.throws($$select public.cl_save_put('career', (select p from t.park))$$, 'permission denied') and t.throws($$select public.cl_save_get('career')$$, 'permission denied') and t.throws($$select public.cl_set_username('Nobody')$$, 'permission denied'), 'E1 signed out: the account functions are refused');
select t.ok(public.cl_username_free('Brand New') and not public.cl_username_free('ANA') and not public.cl_username_free('admin') and not public.cl_username_free('<>') and not public.cl_username_free('ab'), 'E2 the name check knows taken, official-looking, empty and too-short names');
reset role;
set role authenticated; select t.who((select id from t.ids where k = 'a'), '203.0.113.51');
insert into r values ('v1', public.cl_save_put('career', (select p from t.park), '{"name":"Test Park","day":1}', 'iPhone 1a2b', null));
insert into r values ('v2', public.cl_save_put('career', (select p || '{"day":2}' from t.park), '{"name":"Test Park","day":2}', 'iPhone 1a2b', 1));
select t.ok((select (v ->> 'rev')::int from r where k = 'v1') = 1 and (select (v ->> 'rev')::int from r where k = 'v2') = 2, 'E3 a first save is revision 1, the next one revision 2');
insert into r values ('v3', public.cl_save_put('career', (select p || '{"day":99}' from t.park), '{}', 'iPad 9z9z', 1)), ('v4', public.cl_save_put('career', (select p || '{"day":98}' from t.park), '{}', 'iPad 9z9z', null));
select t.ok((select (v ->> 'conflict')::boolean and (v ->> 'rev')::int = 2 and v ->> 'device' = 'iPhone 1a2b' from r where k = 'v3') and (select (v ->> 'conflict')::boolean from r where k = 'v4') and (public.cl_save_get('career') -> 'data' ->> 'day') = '2',
  'E4 a save based on an older revision (or on none) changes nothing and says which save is newer');
select t.ok(t.throws($$select public.cl_save_put('career', '{"a":1}'::jsonb)$$, 'not a Coaster Lab park') and t.throws($$select public.cl_save_put('scn', (select p from t.park))$$, 'bad slot') and t.throws($$select public.cl_save_put('career', (select p from t.park), '[]'::jsonb)$$, 'bad summary'), 'E5 things that are not parks, unknown slots and bad summaries are refused');
insert into r values ('me', public.cl_me());
select t.ok((select v ->> 'username' = 'Ana' and jsonb_array_length(v -> 'saves') = 1 and v -> 'saves' -> 0 ->> 'slot' = 'career' and not (v -> 'saves' -> 0) ? 'data' from r where k = 'me'), 'E6 the account summary lists the saves without their park data');
insert into r values ('n1', public.cl_set_username(' Ana <b>the</b> "Brave" '));
select t.ok((select v ->> 'username' from r where k = 'n1') = 'Ana bthe/b Brave' and t.throws($$select public.cl_set_username('BEN')$$, 'taken') and t.throws($$select public.cl_set_username('Owner')$$, 'not available') and t.throws($$select public.cl_set_username('<>')$$, '3 to 24'), 'E7 a new player name is cleaned; taken and official-looking names are refused');
-- a park published while signed in belongs to the account
insert into r values ('ap', public.cl_publish_park(repeat('1', 48), 'acctpark', 'Account Park', 'ignored', (select p from t.park), '{"rating":50}'));
select t.ok((select (v ->> 'member')::boolean from r where k = 'ap') and (select q ->> 'author' from jsonb_array_elements(public.cl_list_parks('new', 50)) q where q ->> 'name' = 'Account Park') = 'Ana bthe/b Brave', 'E8 a park published signed in carries the account''s player name');
select public.cl_set_username('Ana Two'); select public.cl_set_username('Ana Three'); select public.cl_set_username('Ana Four'); select public.cl_set_username('Ana');
select t.ok(t.throws($$select public.cl_set_username('Ana Six')$$, 'slow down') and (select q ->> 'author' from jsonb_array_elements(public.cl_list_parks('new', 50)) q where q ->> 'name' = 'Account Park') = 'Ana', 'E9 a sixth name change in an hour is refused; the published park follows the name');
reset role;
set role anon; select t.who(null, '203.0.113.52');
select t.ok(t.throws($$select public.cl_publish_park(repeat('1', 48), 'acctpark', 'Stolen', 'x', (select p from t.park), '{}')$$, 'belongs to an account') and public.cl_unpublish_park(repeat('1', 48), (select v ->> 'code' from r where k = 'ap')) = false, 'E10 signed out, even the device that published an account''s park cannot change or remove it');
reset role;
set role authenticated; select t.who((select id from t.ids where k = 'b'), '203.0.113.53');
select t.ok(public.cl_save_get('career') is null and jsonb_array_length(public.cl_me() -> 'saves') = 0 and t.n('select count(*) from public.cl_saves') = 0, 'E11 another player cannot see that save, through the functions or the table');
select t.ok(t.throws($$select public.cl_publish_park(repeat('2', 48), 'acctpark', 'Mine now', 'x', (select p from t.park), '{}')$$, '') = false and public.cl_unpublish_park(repeat('2', 48), (select v ->> 'code' from r where k = 'ap')) = false, 'E12 another player publishing under the same park key gets their own park, and cannot remove the first one');
select t.ok(t.throws($$select public.cl_rate_park('$$ || (select v ->> 'code' from r where k = 'ap') || $$', repeat('2', 48), 4)$$, '') = false and t.throws($$select public.cl_rate_park('$$ || (select q ->> 'code' from jsonb_array_elements(public.cl_my_parks(repeat('2', 48))) q limit 1) || $$', repeat('3', 48), 5)$$, 'cannot rate your own'), 'E13 a signed-in player can rate someone else''s park, never their own (even with another device key)');
reset role;
-- the save limit (the counter is set near its limit instead of saving 240 times)
insert into public.cl_rate (bucket, win, n) select 'save:00000000-0000-4000-8000-00000000000a', to_timestamp(floor(extract(epoch from now()) / 3600) * 3600), 240 on conflict (bucket, win) do update set n = 240;
set role authenticated; select t.who((select id from t.ids where k = 'a'), '203.0.113.51');
select t.ok(t.throws($$select public.cl_save_put('career', (select p from t.park), '{}', 'iPhone', 2)$$, 'slow down') and (public.cl_save_get('career') ->> 'rev')::int = 2, 'E14 past 240 saves in an hour the next save is refused and nothing is changed');
select t.ok(public.cl_save_delete('career') and not public.cl_save_delete('career'), 'E15 a player can delete their own save');
reset role;
-- deleting an account (done by the owner in the dashboard)
delete from public.cl_rate where bucket like 'save:%';
set role authenticated; select t.who('00000000-0000-4000-8000-00000000000a', '203.0.113.51'); select public.cl_save_put('sandbox', (select p from t.park)); reset role;
delete from auth.users where id = '00000000-0000-4000-8000-00000000000a';
select t.ok(not exists (select 1 from public.profiles where id = '00000000-0000-4000-8000-00000000000a') and not exists (select 1 from public.cl_saves where user_id = '00000000-0000-4000-8000-00000000000a') and not exists (select 1 from public.coasters where user_id = '00000000-0000-4000-8000-00000000000a')
  and (select user_id is null from public.cl_parks where park_key = 'acctpark' and name = 'Account Park'), 'E16 deleting an account removes its profile, saves and coasters; its published park stays without an owner');
-- nothing above stored a network address in clear
select t.ok(not exists (select 1 from public.cl_rate where bucket ~ '203\.0\.113') and not exists (select 1 from public.cl_parks where creator_hash ~ '\.') and not exists (select 1 from public.cl_park_visits where visitor_hash ~ '\.'), 'E17 network addresses are only ever stored as one-way fingerprints');
