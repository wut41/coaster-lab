// REFERENCE ONLY — part of the payment-readiness design in docs/payments/README.md.
// This file has never been deployed or executed, and nothing in Coaster Lab calls it. Before any use: create a
// provider TEST sandbox, check every call below against the provider's current documentation, and apply
// docs/payments/proposed_schema.sql to a copy of the database first.
//
// Supabase Edge Function "create-checkout". Sign-in checking stays ON for this function (verify_jwt = true): only a
// signed-in player can start a purchase, and WHO is buying comes from the verified token, never from the request body.
//
// Function secrets (set with the Supabase CLI or dashboard; never in the repository or the page):
//   STRIPE_RESTRICTED_KEY   a restricted key (rk_…) that may only create Checkout Sessions
//   SHOP_RETURN_URL         the one address the game is hosted at, e.g. https://example.com/coaster/
// Provided by Supabase to every Edge Function: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
import Stripe from 'npm:stripe@^23';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_RESTRICTED_KEY')!, { apiVersion: '2026-10-28.endive' });
const SITE = Deno.env.get('SHOP_RETURN_URL')!;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': new URL(SITE).origin, 'access-control-allow-headers': 'authorization, content-type, apikey' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return json({});
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  // 1. who is asking: the verified sign-in token, nothing else
  const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);

  // 2. what they want: a product id and nothing more. No price, no amount, no return address comes from the page
  let product = '';
  try { product = String((await req.json()).product ?? '') } catch { /* fall through to the check below */ }
  if (!/^[a-z][a-z0-9_]{2,39}$/.test(product)) return json({ error: 'unknown product' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: row } = await admin.from('cl_products').select('id, provider_price_id, active').eq('id', product).maybeSingle();
  if (!row || !row.active || !row.provider_price_id) return json({ error: 'not for sale' }, 404);
  const { data: owned } = await admin.from('cl_entitlements').select('product_id').eq('user_id', user.id).eq('product_id', product).is('revoked_at', null).maybeSingle();
  if (owned) return json({ error: 'already owned' }, 409);

  // 3. a hosted checkout for the stored price. No payment_method_types: the provider's dashboard decides which
  //    methods are offered. No automatic tax until the business is registered where it has to be (README, section 7).
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: row.provider_price_id, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { product_id: row.id },
    success_url: SITE + '#shop=back',          // only a place to land: the page then ASKS the server what is owned
    cancel_url: SITE + '#shop=back',
    integration_identifier: 'coasterlab_unlock_qhzkwmtb',
  });

  // 4. remember it as pending. If this fails the player is not sent to pay
  const { error } = await admin.rpc('cl_purchase_begin', { p_user: user.id, p_product: row.id, p_session: session.id });
  if (error) return json({ error: 'could not start the purchase' }, 500);
  return json({ url: session.url });
});
