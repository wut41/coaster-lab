-- Test rig only. The two migrations applied to the live project (celqksoohozvqbdktapm) after the 2026-11-15 snapshot in
-- 01_live_baseline.sql, copied word for word from supabase_migrations.schema_migrations on 2026-11-27 (read-only).
-- Together, 01 + 02 are the production database as it is on 2026-11-27. Live migration list on that day:
--   20261107022611 account_system_init · 20261107123455 lock_down_rls_auto_enable ·
--   20261107123546 updated_at_trigger_and_policy_tuning · 20261120155905 create_vip_purchases ·
--   20261126213516 coaster_lab_least_privilege_table_grants
-- The repository's 10.0 / 10.1 migrations (supabase/migrations/) are NOT in that list: they have never been applied.

-- ===== 20261120155905 create_vip_purchases
-- Coaster Lab VIP: one row per completed Stripe Checkout Session ($2 one-time unlock).
-- Written only by the vip-webhook Edge Function (service role); read only by vip-status.
create table if not exists public.vip_purchases (
  session_id    text primary key,                 -- Stripe Checkout Session id (cs_...)
  player_id     text not null,                    -- anonymous id the game passes as client_reference_id
  email         text,                             -- buyer email from Checkout (lower-cased)
  restore_code  text not null unique,             -- short code shown in-game, used with the email to restore
  amount_total  integer,
  currency      text,
  livemode      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists vip_purchases_player_idx on public.vip_purchases (player_id);
create index if not exists vip_purchases_email_idx on public.vip_purchases (lower(email));
alter table public.vip_purchases enable row level security;
-- No policies on purpose: anon/authenticated clients can't read or write; Edge Functions use the service role.
comment on table public.vip_purchases is 'Coaster Lab VIP purchases (Stripe webhook). No client access; service role only.';

-- ===== 20261126213516 coaster_lab_least_privilege_table_grants
-- Coaster Lab, 26 Nov 2026: least privilege on the existing tables (approved by Jake).
-- RLS already limits rows; this removes table rights nobody needs (TRUNCATE ignores RLS).
-- Undo: grant all on public.profiles, public.coasters, public.vip_purchases to anon, authenticated;
revoke all on table public.profiles from anon;
revoke all on table public.coasters from anon;
revoke all on table public.vip_purchases from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from authenticated;
grant update (username) on table public.profiles to authenticated; -- the existing policy still limits it to the player's own row
revoke truncate, references, trigger on table public.coasters from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.vip_purchases from authenticated;
