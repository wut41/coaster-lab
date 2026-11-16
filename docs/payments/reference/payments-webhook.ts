// REFERENCE ONLY — part of the payment-readiness design in docs/payments/README.md.
// This file has never been deployed or executed, and nothing in Coaster Lab calls it. Before any use: create a
// provider TEST sandbox, check every call and every event field below against the provider's current documentation,
// and send it the unhappy paths listed in the README (section 7, step 7).
//
// Supabase Edge Function "payments-webhook". The payment provider calls it; players never do. Sign-in checking is OFF
// for this one function (verify_jwt = false), because the provider cannot send a player's token. The provider's
// SIGNATURE is the authentication: a request that does not carry a valid one changes nothing.
//
// Function secrets: STRIPE_RESTRICTED_KEY (only needed to construct the client), STRIPE_WEBHOOK_SECRET (whsec_…).
// Provided by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Register the endpoint for exactly these events: checkout.session.completed,
// checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired,
// charge.refunded, charge.dispute.created.
import Stripe from 'npm:stripe@^23';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_RESTRICTED_KEY')!, { apiVersion: '2026-10-28.endive' });
const crypto = Stripe.createSubtleCryptoProvider();
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const id = (v: unknown) => typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : null;

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('method', { status: 405 });
  // the signature is checked against the body exactly as it arrived: read it as text, do not parse it first
  const body = await req.text(), sig = req.headers.get('stripe-signature') ?? '';
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, crypto) }
  catch { return new Response('bad signature', { status: 400 }) }

  // what does this event mean for a purchase? (anything else is acknowledged and ignored)
  let action: 'paid' | 'failed' | 'expired' | 'refunded' | 'disputed' | null = null, session: string | null = null, payment: string | null = null, amount: number | null = null, currency: string | null = null;
  const o = event.data.object as Record<string, unknown>;
  switch (event.type) {
    case 'checkout.session.completed':
      // with a delayed payment method the checkout completes while the money is still on its way: wait for the
      // "async" events below instead of granting now
      if (o.payment_status !== 'unpaid') action = 'paid';
      session = id(o.id); payment = id(o.payment_intent); amount = o.amount_total as number ?? null; currency = o.currency as string ?? null; break;
    case 'checkout.session.async_payment_succeeded':
      action = 'paid'; session = id(o.id); payment = id(o.payment_intent); amount = o.amount_total as number ?? null; currency = o.currency as string ?? null; break;
    case 'checkout.session.async_payment_failed': action = 'failed'; session = id(o.id); break;
    case 'checkout.session.expired': action = 'expired'; session = id(o.id); break;
    case 'charge.refunded':
      // only a FULL refund takes the product away (the charge's "refunded" flag); a partial refund is the owner's call
      if (o.refunded === true) action = 'refunded'; payment = id(o.payment_intent); break;
    case 'charge.dispute.created': action = 'disputed'; payment = id(o.payment_intent); break;
  }
  if (!action) return new Response('ignored', { status: 200 });

  // applied once: the event id is the key. An error answers 500 so the provider sends the event again later
  const { data, error } = await admin.rpc('cl_payment_event', { p_event_id: event.id, p_type: event.type, p_action: action, p_session: session, p_payment: payment, p_amount: amount, p_currency: currency });
  if (error) { console.error('payment event not applied', event.id, event.type, error.code); return new Response('try again', { status: 500 }) }
  if (data === 'unknown') console.warn('payment event for a checkout this database did not start', event.id, event.type);
  return new Response(String(data), { status: 200 });
});
