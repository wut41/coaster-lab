// Coaster Lab VIP — Stripe webhook.
// Stripe calls this when a VIP checkout completes. We verify Stripe's signature (no Stripe secret key needed,
// only the webhook signing secret), then record the purchase so the game can unlock VIP for that player.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const safeEq = (a: string, b: string) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

// Stripe-Signature: t=<unix>,v1=<hex hmac>[,v1=...]; signed payload is `${t}.${rawBody}` with HMAC-SHA256
async function verifyStripe(raw: string, header: string, secret: string, toleranceSec = 300): Promise<boolean> {
  let t = ''; const sigs: string[] = [];
  for (const part of header.split(',')) { const [k, v] = part.split('='); if (k === 't') t = v; else if (k === 'v1' && v) sigs.push(v); }
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${raw}`)));
  return sigs.some((s) => safeEq(s, mac));
}

// restore code: 8 characters, no look-alikes (0/O, 1/I/L), shown as XXXX-XXXX
const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const newCode = () => { const b = crypto.getRandomValues(new Uint8Array(8)); const s = [...b].map((x) => ALPHA[x % ALPHA.length]).join(''); return s.slice(0, 4) + '-' + s.slice(4); };
const PLAYER_RE = /^cl_[A-Za-z0-9]{12,40}$/;
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'webhook secret not configured' }, 500);
  const raw = await req.text();
  if (!(await verifyStripe(raw, req.headers.get('stripe-signature') ?? '', secret))) return json({ error: 'bad signature' }, 400);

  const evt = JSON.parse(raw);
  if (evt.type !== 'checkout.session.completed' && evt.type !== 'checkout.session.async_payment_succeeded') return json({ ignored: evt.type });
  const s = evt.data?.object ?? {};
  if (s.metadata?.product !== 'coaster_lab_vip') return json({ ignored: 'not a VIP checkout' });
  if (s.payment_status !== 'paid') return json({ ignored: 'not paid yet' }); // async methods arrive later as async_payment_succeeded

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const player = PLAYER_RE.test(s.client_reference_id ?? '') ? s.client_reference_id : 'none:' + s.id;
  const email = (s.customer_details?.email ?? s.customer_email ?? '').toLowerCase() || null;
  // idempotent: Stripe retries webhooks, the session id is the primary key, so the first row (and its code) wins
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await db.from('vip_purchases').upsert({
      session_id: s.id, player_id: player, email, restore_code: newCode(),
      amount_total: s.amount_total ?? null, currency: s.currency ?? null, livemode: !!evt.livemode,
    }, { onConflict: 'session_id', ignoreDuplicates: true });
    if (!error) return json({ ok: true });
    if (!/restore_code/.test(error.message)) { console.error('vip insert failed', error.message); return json({ error: 'db' }, 500); }
  }
  return json({ error: 'could not make a unique code' }, 500);
});
