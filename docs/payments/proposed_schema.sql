-- Coaster Lab — PROPOSED database objects for purchases and entitlements.
--
-- ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
-- │ DESIGN ONLY. This file is NOT a migration, is NOT in supabase/migrations and has NOT been run on the real   │
-- │ project. Nothing in the game uses it. It exists so the design in docs/payments/README.md is concrete and     │
-- │ testable: `bash supabase/tests/run.sh payments` applies it to a throw-away local PostgreSQL and runs         │
-- │ docs/payments/proposed_schema_tests.sql against it.                                                          │
-- └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
--
-- The rules it encodes:
--   1. The browser can READ what is for sale and what the signed-in player owns. It can WRITE nothing here: no table
--      privilege and no function that grants, changes or revokes a purchase is given to `anon` or `authenticated`.
--   2. Only the payment provider's signed webhook, handled by a server function that holds the service role, can mark
--      a purchase paid. "The page says it was paid" is never an input.
--   3. Every provider event is applied at most once (cl_payment_events.event_id is the idempotency key), and events
--      that arrive late or twice cannot re-grant something that was refunded.
--   4. Prices live at the payment provider. This database stores which provider price a product maps to and what was
--      actually charged, for the record; it never decides an amount.
--   5. Only one-time, non-consumable unlocks are modelled. Park money is single-player data kept on the player's
--      device; it is not server-authoritative and must not be sold (see the README).
--
-- Who can do what (after this file):
--   anon           cl_shop() (what is for sale; "owned" is always false)
--   authenticated  cl_shop(), cl_my_entitlements(), cl_has(product)
--   service_role   cl_purchase_begin(), cl_payment_event()  (called only by the two server functions)
--   nobody         direct table access from the API
--
-- To remove everything again:
--   drop function if exists public.cl_shop(), public.cl_my_entitlements(), public.cl_has(text),
--     public.cl_purchase_begin(uuid, text, text), public.cl_payment_event(text, text, text, text, text, bigint, text);
--   drop table if exists public.cl_entitlements, public.cl_purchases, public.cl_payment_events, public.cl_products;

-- ---------------------------------------------------------------------------------------------------------------------
-- what can be bought
create table if not exists public.cl_products (
  id                text primary key check (id ~ '^[a-z][a-z0-9_]{2,39}$'),
  name              text not null check (char_length(name) between 1 and 60),
  kind              text not null default 'unlock' check (kind in ('unlock')),      -- one-time, kept for good
  provider          text not null default 'stripe' check (provider in ('stripe')),
  provider_price_id text unique,                                                     -- e.g. a Stripe Price id
  active            boolean not null default false,                                  -- nothing is for sale until switched on
  created_at        timestamptz not null default now()
);

-- one row for each checkout a player started
create table if not exists public.cl_purchases (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  product_id          text not null references public.cl_products (id),
  provider            text not null default 'stripe' check (provider in ('stripe')),
  provider_session_id text not null unique check (char_length(provider_session_id) between 8 and 255),
  provider_payment_id text check (provider_payment_id is null or char_length(provider_payment_id) between 8 and 255),
  status              text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'disputed')),
  amount_total        bigint check (amount_total is null or amount_total >= 0),      -- smallest currency unit, as charged
  currency            text check (currency is null or currency ~ '^[a-z]{3}$'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists cl_purchases_user on public.cl_purchases (user_id);
create index if not exists cl_purchases_payment on public.cl_purchases (provider_payment_id) where provider_payment_id is not null;

-- what a player owns. A refund or a dispute sets revoked_at; the row stays as the record
create table if not exists public.cl_entitlements (
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  text not null references public.cl_products (id),
  purchase_id uuid references public.cl_purchases (id) on delete set null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  revoked_why text check (revoked_why is null or revoked_why in ('refunded', 'disputed')),
  primary key (user_id, product_id)
);

-- every provider event that was received, once. Only what is needed to prove it was handled is kept (no payload)
create table if not exists public.cl_payment_events (
  event_id    text primary key check (char_length(event_id) between 8 and 255),
  provider    text not null default 'stripe',
  type        text not null check (char_length(type) <= 80),
  result      text not null check (char_length(result) <= 40),
  purchase_id uuid references public.cl_purchases (id) on delete set null,
  received_at timestamptz not null default now()
);

alter table public.cl_products       enable row level security;
alter table public.cl_purchases      enable row level security;
alter table public.cl_entitlements   enable row level security;
alter table public.cl_payment_events enable row level security;
-- no policies on purpose: with row level security on and no policy, the API roles can see and change nothing even if
-- a privilege were granted by mistake later. Reads go through the functions below.
revoke all on public.cl_products, public.cl_purchases, public.cl_entitlements, public.cl_payment_events from public, anon, authenticated;
grant select, insert, update, delete on public.cl_products, public.cl_purchases, public.cl_entitlements, public.cl_payment_events to service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- what the page may ask

-- what is for sale, and whether the caller already has it
create or replace function public.cl_shop() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'kind', p.kind,
           'owned', exists (select 1 from public.cl_entitlements e where e.user_id = (select auth.uid()) and e.product_id = p.id and e.revoked_at is null))
         order by p.created_at, p.id), '[]'::jsonb)
  from public.cl_products p where p.active and p.provider_price_id is not null
$$;

-- the product ids the signed-in player owns
create or replace function public.cl_my_entitlements() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(e.product_id order by e.product_id), '[]'::jsonb)
  from public.cl_entitlements e where e.user_id = (select auth.uid()) and e.revoked_at is null
$$;

-- does the caller own this? For other server functions to use when a feature is gated (for example extra cloud
-- save slots): the check then happens in the database, next to the thing it protects
create or replace function public.cl_has(p_product text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cl_entitlements e where e.user_id = (select auth.uid()) and e.product_id = p_product and e.revoked_at is null)
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- what only the server functions may do (service role)

-- a checkout was created at the provider for this player and product: remember it as pending.
-- Returns the purchase id. Refuses a product that is not for sale and one the player already owns.
create or replace function public.cl_purchase_begin(p_user uuid, p_product text, p_session text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_user is null or not exists (select 1 from auth.users u where u.id = p_user) then raise exception 'unknown player' using errcode = '22023'; end if;
  if not exists (select 1 from public.cl_products p where p.id = p_product and p.active and p.provider_price_id is not null) then raise exception 'not for sale' using errcode = '22023'; end if;
  if exists (select 1 from public.cl_entitlements e where e.user_id = p_user and e.product_id = p_product and e.revoked_at is null) then raise exception 'already owned' using errcode = '23505'; end if;
  insert into public.cl_purchases (user_id, product_id, provider_session_id) values (p_user, p_product, p_session) returning id into v_id;
  return v_id;
end $$;

-- one verified provider event. p_action is what the server function worked out from the event type:
--   'paid'      the checkout is paid (never called while the provider still says "unpaid")
--   'failed'    a delayed payment failed          'expired'   the checkout was abandoned
--   'refunded'  the payment was refunded          'disputed'  the cardholder disputed it
-- The purchase is found by the checkout session id, or by the payment id for refunds and disputes.
-- Returns what happened: 'granted', 'revoked', 'noted', 'already', 'duplicate', 'unknown' or 'ignored'.
create or replace function public.cl_payment_event(p_event_id text, p_type text, p_action text, p_session text, p_payment text, p_amount bigint, p_currency text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_p public.cl_purchases%rowtype; v_res text; v_new boolean;
begin
  if p_action is null or p_action not in ('paid', 'failed', 'expired', 'refunded', 'disputed') then raise exception 'unknown action' using errcode = '22023'; end if;
  -- the idempotency key: a second delivery of the same event stops here
  insert into public.cl_payment_events (event_id, type, result) values (p_event_id, left(coalesce(p_type, ''), 80), 'received') on conflict (event_id) do nothing;
  get diagnostics v_new = row_count;
  if not v_new then return 'duplicate'; end if;

  select * into v_p from public.cl_purchases q
   where (p_session is not null and q.provider_session_id = p_session) or (p_payment is not null and q.provider_payment_id = p_payment)
   order by (q.provider_session_id = p_session) desc nulls last limit 1 for update;
  if not found then
    update public.cl_payment_events set result = 'unknown' where event_id = p_event_id; return 'unknown';
  end if;

  if p_action = 'paid' then
    if v_p.status in ('pending', 'failed', 'expired') then
      update public.cl_purchases set status = 'paid', provider_payment_id = coalesce(p_payment, provider_payment_id), amount_total = p_amount, currency = lower(p_currency), updated_at = now() where id = v_p.id;
      insert into public.cl_entitlements (user_id, product_id, purchase_id) values (v_p.user_id, v_p.product_id, v_p.id)
        on conflict (user_id, product_id) do update set purchase_id = excluded.purchase_id, granted_at = now(), revoked_at = null, revoked_why = null;
      v_res := 'granted';
    elsif v_p.status = 'paid' then v_res := 'already';                               -- e.g. "completed" then "async succeeded"
    else v_res := 'ignored';                                                          -- refunded or disputed: a late "paid" never re-grants
    end if;
  elsif p_action in ('failed', 'expired') then
    if v_p.status = 'pending' then update public.cl_purchases set status = p_action, updated_at = now() where id = v_p.id; v_res := 'noted';
    else v_res := 'ignored'; end if;
  else                                                                                -- refunded, disputed
    if v_p.status in ('refunded', 'disputed') then v_res := 'already';
    else
      update public.cl_purchases set status = p_action, provider_payment_id = coalesce(provider_payment_id, p_payment), updated_at = now() where id = v_p.id;
      update public.cl_entitlements set revoked_at = now(), revoked_why = p_action where user_id = v_p.user_id and product_id = v_p.product_id and purchase_id = v_p.id and revoked_at is null;
      v_res := 'revoked';
    end if;
  end if;
  update public.cl_payment_events set result = v_res, purchase_id = v_p.id where event_id = p_event_id;
  return v_res;
end $$;

revoke all on function public.cl_shop(), public.cl_my_entitlements(), public.cl_has(text),
  public.cl_purchase_begin(uuid, text, text), public.cl_payment_event(text, text, text, text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.cl_shop() to anon, authenticated, service_role;
grant execute on function public.cl_my_entitlements(), public.cl_has(text) to authenticated, service_role;
grant execute on function public.cl_purchase_begin(uuid, text, text), public.cl_payment_event(text, text, text, text, text, bigint, text) to service_role;
