-- Tests for docs/payments/proposed_schema.sql (DESIGN ONLY, never run on the real project).
-- Run by `bash supabase/tests/run.sh payments` on a throw-away local PostgreSQL, after the migrations and their own
-- tests. Uses the same helpers (schema t) and calls things the way a browser or a server function would.
grant usage on schema t to service_role; grant execute on all functions in schema t to service_role;   -- (the test helpers)
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000c1', 'cleo@example.test', '{"username":"Cleo"}'),
  ('00000000-0000-4000-8000-0000000000d1', 'dev@example.test', '{"username":"Dev"}');
insert into public.cl_products (id, name, provider_price_id, active) values
  ('supporter', 'Supporter pack', 'price_test_supporter', true),
  ('night_pack', 'Night lights pack', 'price_test_night', true),
  ('not_yet', 'Coming later', 'price_test_later', false),
  ('no_price', 'No price set', null, true);

-- ============================================================ P-A · what the catalog says
select t.ok(not exists (select 1 from unnest(array['cl_products','cl_purchases','cl_entitlements','cl_payment_events']) tb, unnest(array['select','insert','update','delete','truncate','references','trigger']) pr, unnest(array['anon','authenticated']) ro where has_table_privilege(ro, 'public.' || tb, pr)),
  'PA1 the API roles hold no privilege of any kind on the four payment tables');
select t.ok((select bool_and(relrowsecurity) from pg_class where oid in ('public.cl_products'::regclass, 'public.cl_purchases'::regclass, 'public.cl_entitlements'::regclass, 'public.cl_payment_events'::regclass))
  and not exists (select 1 from pg_policies where schemaname = 'public' and tablename in ('cl_products','cl_purchases','cl_entitlements','cl_payment_events')), 'PA2 row level security is on for all four, with no policy that lets anyone through');
select t.ok(not has_function_privilege('anon', 'public.cl_purchase_begin(uuid, text, text)', 'execute') and not has_function_privilege('authenticated', 'public.cl_purchase_begin(uuid, text, text)', 'execute')
  and not has_function_privilege('anon', 'public.cl_payment_event(text, text, text, text, text, bigint, text)', 'execute') and not has_function_privilege('authenticated', 'public.cl_payment_event(text, text, text, text, text, bigint, text)', 'execute')
  and has_function_privilege('service_role', 'public.cl_payment_event(text, text, text, text, text, bigint, text)', 'execute'), 'PA3 only the service role may start a purchase or apply a payment event');
select t.ok(has_function_privilege('anon', 'public.cl_shop()', 'execute') and not has_function_privilege('anon', 'public.cl_my_entitlements()', 'execute') and has_function_privilege('authenticated', 'public.cl_my_entitlements()', 'execute'), 'PA4 anyone may read the shop; only a signed-in player may ask what they own');
select t.ok(not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('cl_shop','cl_my_entitlements','cl_has','cl_purchase_begin','cl_payment_event') and (not p.prosecdef or not coalesce(array_to_string(p.proconfig, ','), '') ~ 'search_path=""')),
  'PA5 every payment function runs with a fixed, empty search path');

-- ============================================================ P-B · the page, signed out and signed in
set role anon; select t.who(null, '198.51.100.20');
select t.ok(jsonb_array_length(public.cl_shop()) = 2 and public.cl_shop() @> '[{"id":"supporter","owned":false},{"id":"night_pack","owned":false}]' and not public.cl_shop()::text ~ 'price_|not_yet|no_price', 'PB1 signed out: the shop lists the two products that are for sale, and never a provider price id');
select t.ok(t.throws('select public.cl_my_entitlements()', 'permission denied') and t.throws('select 1 from public.cl_entitlements', 'permission denied') and t.throws('select 1 from public.cl_products', 'permission denied'), 'PB2 signed out: asking what is owned, or reading the tables, is refused');
reset role;
set role authenticated; select t.who('00000000-0000-4000-8000-0000000000c1', '198.51.100.21');
select t.ok(public.cl_my_entitlements() = '[]'::jsonb and public.cl_has('supporter') = false, 'PB3 a new player owns nothing');
select t.ok(t.throws($$insert into public.cl_entitlements (user_id, product_id) values (auth.uid(), 'supporter')$$, 'permission denied'), 'PB4 a player cannot give themselves a product');
select t.ok(t.throws($$insert into public.cl_purchases (user_id, product_id, provider_session_id, status) values (auth.uid(), 'supporter', 'cs_test_forged_0001', 'paid')$$, 'permission denied')
  and t.throws($$update public.cl_purchases set status = 'paid'$$, 'permission denied'), 'PB5 a player cannot write a purchase or mark one paid');
select t.ok(t.throws($$select public.cl_purchase_begin(auth.uid(), 'supporter', 'cs_test_forged_0002')$$, 'permission denied')
  and t.throws($$select public.cl_payment_event('evt_forged_0001', 'checkout.session.completed', 'paid', 'cs_test_forged_0002', null, 499, 'usd')$$, 'permission denied'), 'PB6 a player cannot call the two server-only functions');
select t.ok(t.throws($$insert into public.cl_payment_events (event_id, type, result) values ('evt_forged_0002', 'x', 'granted')$$, 'permission denied') and t.throws($$update public.cl_products set active = true$$, 'permission denied'), 'PB7 a player cannot write an event or switch a product on');
reset role;

-- ============================================================ P-C · the server functions (service role)
set role service_role;
select t.ok(t.throws($$select public.cl_purchase_begin('00000000-0000-4000-8000-0000000000c1', 'not_yet', 'cs_test_c_inactive')$$, 'not for sale') and t.throws($$select public.cl_purchase_begin('00000000-0000-4000-8000-0000000000c1', 'no_price', 'cs_test_c_noprice')$$, 'not for sale')
  and t.throws($$select public.cl_purchase_begin('00000000-0000-4000-8000-0000000000c1', 'made_up', 'cs_test_c_madeup')$$, 'not for sale') and t.throws($$select public.cl_purchase_begin('00000000-0000-4000-8000-00000000ffff', 'supporter', 'cs_test_c_nouser')$$, 'unknown player'),
  'PC1 a checkout cannot be started for a product that is not for sale, or for a player that does not exist');
-- (a statement cannot see what a function it calls has just written, so each check is "call", then "look")
select t.ok(public.cl_purchase_begin('00000000-0000-4000-8000-0000000000c1', 'supporter', 'cs_test_cleo_0001') is not null, 'PC2 starting a checkout returns the new purchase');
select t.ok((select status = 'pending' and amount_total is null from public.cl_purchases where provider_session_id = 'cs_test_cleo_0001'), 'PC2b and records it as pending, with no amount yet');
select t.ok(t.throws($$select public.cl_purchase_begin('00000000-0000-4000-8000-0000000000d1', 'supporter', 'cs_test_cleo_0001')$$, '23505'), 'PC3 one checkout session cannot be recorded twice');
reset role;
set role authenticated; select t.who('00000000-0000-4000-8000-0000000000c1', '198.51.100.21');
select t.ok(public.cl_my_entitlements() = '[]'::jsonb, 'PC4 a pending checkout gives the player nothing yet (coming back from the payment page proves nothing)');
reset role;

set role service_role;
select t.ok(t.throws($$select public.cl_payment_event('evt_test_bad_0001', 'x', 'free', 'cs_test_cleo_0001', null, 0, 'usd')$$, 'unknown action'), 'PC5 an action the design does not know is refused');
select t.ok(public.cl_payment_event('evt_test_unknown_1', 'checkout.session.completed', 'paid', 'cs_test_someone_else', 'pi_test_unknown_1', 499, 'usd') = 'unknown' and not exists (select 1 from public.cl_entitlements), 'PC6 a paid event for a checkout this database never started grants nothing');
select t.ok(public.cl_payment_event('evt_test_paid_0001', 'checkout.session.completed', 'paid', 'cs_test_cleo_0001', 'pi_test_cleo_0001', 499, 'USD') = 'granted', 'PC7 the verified paid event grants the product');
select t.ok((select status = 'paid' and amount_total = 499 and currency = 'usd' and provider_payment_id = 'pi_test_cleo_0001' from public.cl_purchases where provider_session_id = 'cs_test_cleo_0001'), 'PC7b and the purchase is marked paid, with what was charged');
select t.ok(public.cl_payment_event('evt_test_paid_0001', 'checkout.session.completed', 'paid', 'cs_test_cleo_0001', 'pi_test_cleo_0001', 499, 'usd') = 'duplicate' and (select count(*) = 1 from public.cl_payment_events where event_id = 'evt_test_paid_0001'), 'PC8 the same event delivered again does nothing');
select t.ok(public.cl_payment_event('evt_test_paid_0002', 'checkout.session.async_payment_succeeded', 'paid', 'cs_test_cleo_0001', 'pi_test_cleo_0001', 499, 'usd') = 'already', 'PC9 a second, different "paid" event for the same checkout changes nothing');
select t.ok(t.throws($$select public.cl_purchase_begin('00000000-0000-4000-8000-0000000000c1', 'supporter', 'cs_test_cleo_0002')$$, 'already owned'), 'PC10 a player who owns a product cannot be sent to pay for it again');
reset role;
set role authenticated; select t.who('00000000-0000-4000-8000-0000000000c1', '198.51.100.21');
select t.ok(public.cl_my_entitlements() = '["supporter"]'::jsonb and public.cl_has('supporter') and not public.cl_has('night_pack') and public.cl_shop() @> '[{"id":"supporter","owned":true},{"id":"night_pack","owned":false}]', 'PC11 the player now owns it, and the shop says so');
reset role;
set role authenticated; select t.who('00000000-0000-4000-8000-0000000000d1', '198.51.100.22');
select t.ok(public.cl_my_entitlements() = '[]'::jsonb and not public.cl_has('supporter') and public.cl_shop() @> '[{"id":"supporter","owned":false}]', 'PC12 another player does not');
reset role;

-- ============================================================ P-D · refunds, disputes, failures, events out of order
set role service_role;
select t.ok(public.cl_payment_event('evt_test_refund_01', 'charge.refunded', 'refunded', null, 'pi_test_cleo_0001', 499, 'usd') = 'revoked', 'PD1 a refund is matched to the purchase by its payment id');
select t.ok((select status = 'refunded' from public.cl_purchases where provider_session_id = 'cs_test_cleo_0001') and (select revoked_at is not null and revoked_why = 'refunded' from public.cl_entitlements where user_id = '00000000-0000-4000-8000-0000000000c1' and product_id = 'supporter'),
  'PD1b it takes the product away again and keeps the record');
select t.ok(public.cl_payment_event('evt_test_paid_0003', 'checkout.session.completed', 'paid', 'cs_test_cleo_0001', 'pi_test_cleo_0001', 499, 'usd') = 'ignored', 'PD2 a "paid" event that turns up after the refund is ignored');
select t.ok((select revoked_at is not null from public.cl_entitlements where user_id = '00000000-0000-4000-8000-0000000000c1' and product_id = 'supporter') and (select status = 'refunded' from public.cl_purchases where provider_session_id = 'cs_test_cleo_0001'), 'PD2b and does not give the product back');
select t.ok(public.cl_payment_event('evt_test_refund_02', 'charge.refunded', 'refunded', null, 'pi_test_cleo_0001', 499, 'usd') = 'already', 'PD3 a second refund event changes nothing');
-- the player may buy it again after a refund
select t.ok(public.cl_purchase_begin('00000000-0000-4000-8000-0000000000c1', 'supporter', 'cs_test_cleo_0003') is not null, 'PD4 after a refund the player can start a new checkout for it');
select t.ok(public.cl_payment_event('evt_test_paid_0004', 'checkout.session.completed', 'paid', 'cs_test_cleo_0003', 'pi_test_cleo_0003', 499, 'usd') = 'granted', 'PD4b paying for it grants it again');
select t.ok((select revoked_at is null and purchase_id = (select id from public.cl_purchases where provider_session_id = 'cs_test_cleo_0003') from public.cl_entitlements where user_id = '00000000-0000-4000-8000-0000000000c1' and product_id = 'supporter'), 'PD4c and they own it through the new purchase');
select t.ok(public.cl_payment_event('evt_test_refund_03', 'charge.refunded', 'refunded', null, 'pi_test_cleo_0001', 499, 'usd') = 'already', 'PD5 another event about the OLD refunded payment changes nothing');
select t.ok((select revoked_at is null from public.cl_entitlements where user_id = '00000000-0000-4000-8000-0000000000c1' and product_id = 'supporter'), 'PD5b and does not touch the new purchase');
select t.ok(public.cl_payment_event('evt_test_dispute_1', 'charge.dispute.created', 'disputed', null, 'pi_test_cleo_0003', 499, 'usd') = 'revoked', 'PD6 a dispute is matched to its purchase');
select t.ok((select revoked_why = 'disputed' and revoked_at is not null from public.cl_entitlements where user_id = '00000000-0000-4000-8000-0000000000c1' and product_id = 'supporter'), 'PD6b and takes the product away too');
-- a delayed payment method: completed while still unpaid is never sent as "paid" by the server function; failure and expiry are noted
select t.ok(public.cl_purchase_begin('00000000-0000-4000-8000-0000000000d1', 'night_pack', 'cs_test_dev_0001') is not null, 'PD7 another player starts a checkout with a delayed payment method');
select t.ok(public.cl_payment_event('evt_test_fail_0001', 'checkout.session.async_payment_failed', 'failed', 'cs_test_dev_0001', null, null, null) = 'noted', 'PD7b the payment fails later: it is noted');
select t.ok((select status = 'failed' from public.cl_purchases where provider_session_id = 'cs_test_dev_0001') and not exists (select 1 from public.cl_entitlements where user_id = '00000000-0000-4000-8000-0000000000d1'), 'PD7c and nothing is granted');
select t.ok(public.cl_purchase_begin('00000000-0000-4000-8000-0000000000d1', 'night_pack', 'cs_test_dev_0002') is not null, 'PD8 a checkout is started and then abandoned');
select t.ok(public.cl_payment_event('evt_test_exp_00001', 'checkout.session.expired', 'expired', 'cs_test_dev_0002', null, null, null) = 'noted', 'PD8b it is marked expired');
select t.ok(public.cl_payment_event('evt_test_exp_00002', 'checkout.session.expired', 'expired', 'cs_test_dev_0002', null, null, null) = 'ignored' and (select status = 'expired' from public.cl_purchases where provider_session_id = 'cs_test_dev_0002'), 'PD8c once');
select t.ok((select count(*) from public.cl_payment_events) = 12 and not exists (select 1 from public.cl_payment_events where result = 'received'), 'PD9 every event that was accepted is on record with what happened to it (12 events)');
reset role;
set role authenticated; select t.who('00000000-0000-4000-8000-0000000000c1', '198.51.100.21');
select t.ok(public.cl_my_entitlements() = '[]'::jsonb and not public.cl_has('supporter'), 'PD10 after the dispute the player no longer owns it');
reset role;

-- ============================================================ P-E · leaving
delete from auth.users where id = '00000000-0000-4000-8000-0000000000c1';
select t.ok(not exists (select 1 from public.cl_purchases where user_id = '00000000-0000-4000-8000-0000000000c1') and not exists (select 1 from public.cl_entitlements where user_id = '00000000-0000-4000-8000-0000000000c1')
  and (select count(*) from public.cl_payment_events where purchase_id is null) >= 6, 'PE1 deleting an account removes its purchases and entitlements; the event log keeps only event ids and outcomes');
