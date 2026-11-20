// Coaster Lab VIP — status / restore.
// POST { player_id }            → is this browser's anonymous player VIP?
// POST { email, code }          → restore on a new device with the checkout email + restore code
// Returns { vip: boolean, code? }. Read-only; the table itself is not readable by clients (RLS, no policies).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const PLAYER_RE = /^cl_[A-Za-z0-9]{12,40}$/;
const CODE_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  if (typeof b.player_id === 'string') {
    if (!PLAYER_RE.test(b.player_id)) return json({ error: 'bad player id' }, 400);
    const { data, error } = await db.from('vip_purchases').select('restore_code').eq('player_id', b.player_id).limit(1);
    if (error) return json({ error: 'db' }, 500);
    return json(data?.length ? { vip: true, code: data[0].restore_code } : { vip: false });
  }
  if (typeof b.email === 'string' && typeof b.code === 'string') {
    const email = b.email.trim().toLowerCase(), code = b.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{4})(.{4})$/, '$1-$2');
    if (!email.includes('@') || !CODE_RE.test(code)) return json({ vip: false });
    const { data, error } = await db.from('vip_purchases').select('restore_code').eq('email', email).eq('restore_code', code).limit(1);
    if (error) return json({ error: 'db' }, 500);
    return json(data?.length ? { vip: true, code } : { vip: false });
  }
  return json({ error: 'send player_id, or email + code' }, 400);
});
