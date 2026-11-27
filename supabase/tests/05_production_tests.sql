-- Coaster Lab: the PRODUCTION database as it is on 2026-11-27 (01 + 02), attacked the way a browser can.
-- Runs before the repository migrations. Every check prints PASS or FAIL; INFO lines are facts to know, not failures.
-- P = privileges in the catalog · R = row level security, asked as players · O = owner / admin / VIP permissions
begin; -- everything below is rolled back at the end, so the repository-migration tests start from the same clean copy
create schema p;
create function p.ok(c boolean, name text) returns void language plpgsql as $$ begin raise notice '%', (case when c is true then 'PASS ' else 'FAIL ' end) || name; end $$;
create function p.info(name text) returns void language plpgsql as $$ begin raise notice 'INFO %', name; end $$;
create function p.throws(q text, pat text default '') returns boolean language plpgsql as $$ begin execute q; return false; exception when others then return (sqlerrm ~* pat) or (sqlstate = pat); end $$;
create function p.n(q text) returns bigint language plpgsql as $$ declare r bigint; begin execute q into r; return r; end $$;
create function p.who(uid uuid) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claims', case when uid is null then '{"role":"anon"}' else json_build_object('sub', uid, 'role', 'authenticated')::text end, false); end $$;
grant usage on schema p to anon, authenticated, service_role; grant execute on all functions in schema p to anon, authenticated, service_role;

-- two players, made the way sign-up makes them; the second signs up as "Admin" with a forged role in its metadata
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', 'ana@example.test', '{"username":"Ana"}'),
  ('00000000-0000-4000-8000-0000000000b1', 'ben@example.test', '{"username":"Admin","role":"admin","is_owner":true}');
insert into public.coasters (user_id, name) values ('00000000-0000-4000-8000-0000000000b1', 'Ben''s coaster');
insert into public.vip_purchases (session_id, player_id, email, restore_code) values ('cs_test_ben', 'cl_bensplayer000001', 'ben@example.test', 'ABCD-EFGH');

-- ============================================================ P · what the catalog allows
select p.ok((select bool_and(c.relrowsecurity) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'), 'P1 row level security is on for every table in public');
select p.ok(not exists (select 1 from pg_class c, unnest(array['select','insert','update','delete','truncate','references','trigger']) pr where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and has_table_privilege('anon', c.oid, pr)), 'P2 signed-out callers hold no privilege on any table');
select p.ok(has_table_privilege('authenticated', 'public.profiles', 'select') and has_column_privilege('authenticated', 'public.profiles', 'username', 'update') and not has_column_privilege('authenticated', 'public.profiles', 'id', 'update')
  and not has_table_privilege('authenticated', 'public.profiles', 'insert') and not has_table_privilege('authenticated', 'public.profiles', 'delete') and not has_table_privilege('authenticated', 'public.profiles', 'truncate'),
  'P3 signed-in players can read profiles and change only the username column');
select p.ok(not exists (select 1 from pg_class c, unnest(array['truncate','references','trigger']) pr where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and has_table_privilege('authenticated', c.oid, pr)), 'P4 no signed-in player can TRUNCATE (which ignores row level security) any table');
select p.ok(not exists (select 1 from pg_proc f, unnest(array['public','anon','authenticated']) r where f.pronamespace = 'public'::regnamespace and has_function_privilege(r, f.oid, 'execute')), 'P5 no function in public can be called from a browser');
select p.ok(not exists (select 1 from pg_proc f where f.pronamespace = 'public'::regnamespace and f.prosecdef and not exists (select 1 from unnest(coalesce(f.proconfig, '{}')) c where c like 'search_path=%')), 'P6 every function that runs with its owner''s rights has a fixed search_path');
select p.ok(not exists (select 1 from pg_policies where schemaname = 'public' and 'public' = any(roles) or (schemaname = 'public' and 'anon' = any(roles))), 'P7 no policy lets signed-out callers in');

-- ============================================================ R · rows, asked as players
set role anon; select p.who(null);
select p.ok(p.throws('select 1 from public.profiles', 'permission denied') and p.throws('select 1 from public.coasters', 'permission denied') and p.throws('select 1 from public.vip_purchases', 'permission denied'), 'R1 signed out: reading any table is refused');
select p.ok(p.throws($$insert into public.coasters (user_id, name) values ('00000000-0000-4000-8000-0000000000a1', 'x')$$, 'permission denied') and p.throws('delete from public.coasters', 'permission denied'), 'R2 signed out: writing any table is refused');
reset role;

set role authenticated; select p.who('00000000-0000-4000-8000-0000000000a1');
select p.ok(p.n('select count(*) from public.profiles') = 1 and p.n('select count(*) from public.profiles where id = auth.uid()') = 1, 'R3 a player sees only their own profile');
select p.ok(p.n($$with u as (update public.profiles set username = 'Hacked' where id = '00000000-0000-4000-8000-0000000000b1' returning 1) select count(*) from u$$) = 0, 'R4 a player cannot rename another player');
select p.ok(p.throws($$update public.profiles set id = '00000000-0000-4000-8000-0000000000b1' where id = auth.uid()$$, 'permission denied') and p.throws('update public.profiles set created_at = now() where id = auth.uid()', 'permission denied'), 'R5 a player cannot change their profile id or creation date');
select p.ok(p.throws($$insert into public.profiles (id, username) values (gen_random_uuid(), 'Ghost')$$, 'permission denied') and p.throws('delete from public.profiles', 'permission denied'), 'R6 a player cannot create or delete profiles');
select p.ok(p.n('select count(*) from public.coasters') = 0, 'R7 a player cannot see another player''s coasters');
select p.ok(not p.throws($$insert into public.coasters (user_id, name) values (auth.uid(), 'Ana''s coaster')$$) and p.n('select count(*) from public.coasters') = 1, 'R8 a player can save their own coaster');
select p.ok(p.throws($$insert into public.coasters (user_id, name) values ('00000000-0000-4000-8000-0000000000b1', 'planted')$$, 'row-level security'), 'R9 a player cannot save a coaster into another player''s account');
select p.ok(p.throws($$update public.coasters set user_id = '00000000-0000-4000-8000-0000000000b1' where user_id = auth.uid()$$, 'row-level security'), 'R10 a player cannot hand their coaster to another account');
select p.ok(p.n($$with u as (update public.coasters set name = 'pwned' where user_id = '00000000-0000-4000-8000-0000000000b1' returning 1) select count(*) from u$$) = 0
  and p.n($$with d as (delete from public.coasters where user_id = '00000000-0000-4000-8000-0000000000b1' returning 1) select count(*) from d$$) = 0, 'R11 a player cannot change or delete another player''s coaster');
select p.ok(p.throws('truncate public.coasters', 'permission denied'), 'R12 a player cannot TRUNCATE the coasters table');
reset role;
select p.ok((select count(*) from public.coasters where user_id = '00000000-0000-4000-8000-0000000000b1' and name = 'Ben''s coaster') = 1, 'R13 after every attack, Ben''s coaster is untouched');

-- ============================================================ O · owner, admin and VIP permissions
select p.ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and column_name ~* '(^|_)(role|admin|owner|moder|mod|staff|perm|privilege|is_vip|tier|banned)(_|$)'),
  'O1 no table stores an owner / admin / moderator / role flag a player could try to set');
select p.ok(not exists (select 1 from pg_policies where schemaname = 'public' and (coalesce(qual, '') || coalesce(with_check, '')) ~* '(user_metadata|raw_user_meta|app_metadata|jwt\(\)|request\.jwt)'),
  'O2 no policy trusts JWT or sign-up metadata (which a player controls) for access: only auth.uid()');
select p.ok((select raw_user_meta_data ? 'role' from auth.users where id = '00000000-0000-4000-8000-0000000000b1') and not exists (select 1 from pg_policies where schemaname = 'public' and (coalesce(qual,'') || coalesce(with_check,'')) ~* 'role'),
  'O3 a forged "role":"admin" in sign-up metadata is stored but grants nothing');
set role authenticated; select p.who('00000000-0000-4000-8000-0000000000a1');
select p.ok(p.n('select count(*) from public.vip_purchases') = 0, 'O4 a signed-in player cannot read any VIP purchase (not even emails or restore codes)');
select p.ok(p.throws($$insert into public.vip_purchases (session_id, player_id, restore_code) values ('cs_fake', 'cl_anaplayer0000001', 'ZZZZ-ZZZZ')$$, 'permission denied')
  and p.throws($$update public.vip_purchases set player_id = 'cl_anaplayer0000001'$$, 'permission denied') and p.throws('delete from public.vip_purchases', 'permission denied'),
  'O5 a signed-in player cannot grant themselves VIP or take over someone else''s purchase');
reset role;
set role service_role;
select p.ok(p.n('select count(*) from public.vip_purchases') = 1, 'O6 the service role (used only by the vip-webhook / vip-status server functions) can read purchases');
reset role;
select p.ok(not exists (select 1 from pg_proc f where f.pronamespace = 'public'::regnamespace and f.proname ~* '(owner|admin|moder|grant|promote|ban)'),
  'O7 the database has no owner / admin function: the in-game owner and moderator tools cannot reach other players'' data');
select p.info('the in-game owner and moderator locks are checked only in the browser (PBKDF2 hash in the page): there is no server-side owner permission to verify. Safe today only because O1-O7 give those tools no server power.');
select p.info('sign-up takes the username from metadata unchecked in production: "' || (select username from public.profiles where id = '00000000-0000-4000-8000-0000000000b1') || '" was accepted for a forged admin sign-up. Reserved names (admin, owner, coasterlab...) are refused only by the unapplied 10.1 migration.');
select p.info('authenticated still holds a SELECT grant on vip_purchases; row level security with no policies returns nothing (O4). Revoking it would be defence in depth.');
rollback;
