// A stand-in for the game's cloud, used by the tests (the test sandbox cannot reach the real one):
//  · the account server (Supabase Auth: sign up, sign in with a password, renew, sign out, user, password reset)
//  · the database functions of supabase/migrations/…_coaster_lab_10_parks_and_accounts.sql, with the same rules
// One stand-in can be shared by several "devices" (browser contexts), like the real cloud.
//   const { cloud, db } = makeCloud({ confirm: false });   open(file, { cloud })
// confirm: true plays a project where "Confirm email" is still switched on (sign-up gives no session).
module.exports = function makeCloud(opts = {}) {
  const db = { users: [], sessions: {}, refresh: {}, saves: [], parks: [], ratings: [], mails: 0, calls: [], opts: { confirm: false, mailLimit: 2, ...opts } };
  const rnd = n => { let s = ''; while (s.length < n) s += Math.random().toString(16).slice(2); return s.slice(0, n) };
  const code6 = () => { let c = ''; for (let i = 0; i < 6; i++) c += '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 32)]; return c };
  const pub = u => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, user_metadata: { username: u.meta } });
  const session = u => { const at = 'at.' + rnd(40), rt = 'rt' + rnd(20); db.sessions[at] = { uid: u.id, exp: Date.now() + 3600e3 }; db.refresh[rt] = u.id; return { access_token: at, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: rt, user: pub(u) } };
  const err = (status, error_code, msg) => ({ status, json: { code: status, error_code, msg } }), bad = message => ({ status: 400, json: { code: 'P0001', message } });
  const keyOk = k => typeof k === 'string' && /^[A-Za-z0-9_-]{32,128}$/.test(k), clean = (s, n, d) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>"&]/g, '').slice(0, n).trim() || d;
  const stars = p => { const r = db.ratings.filter(q => q.code === p.code); return { stars: r.length ? Math.round(r.reduce((x, q) => x + q.stars, 0) / r.length * 100) / 100 : 0, votes: r.length } };
  function auth(path, a, info) {
    a = a || {};
    if (path === 'signup') { const email = String(a.email || '').toLowerCase(), name = a.data && a.data.username;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(400, 'validation_failed', 'Unable to validate email address: invalid format'); if (String(a.password || '').length < 6) return err(422, 'weak_password', 'Password should be at least 6 characters.');
      if (db.users.some(u => u.email === email)) return db.opts.confirm ? { json: { id: rnd(8), email, confirmation_sent_at: new Date().toISOString() } } : err(422, 'user_already_exists', 'User already registered');
      const uname = name == null ? 'rider_' + rnd(8) : String(name); if (uname.length < 3 || uname.length > 24 || db.users.some(u => u.name === uname)) return err(500, 'unexpected_failure', 'Database error saving new user');// the profiles trigger refuses the name
      const u = { id: rnd(8) + '-' + rnd(4) + '-4' + rnd(3) + '-8' + rnd(3) + '-' + rnd(12), email, password: a.password, name: uname, meta: uname, confirmed: !db.opts.confirm }; db.users.push(u);
      return db.opts.confirm ? { json: { ...pub(u), confirmation_sent_at: new Date().toISOString() } } : { json: session(u) } }
    if (path === 'token' && info.query.grant_type === 'password') { const u = db.users.find(q => q.email === String(a.email || '').toLowerCase()); if (!u || u.password !== a.password) return err(400, 'invalid_credentials', 'Invalid login credentials'); if (!u.confirmed) return err(400, 'email_not_confirmed', 'Email not confirmed'); return { json: session(u) } }
    if (path === 'token' && info.query.grant_type === 'refresh_token') { const id = db.refresh[a.refresh_token], u = db.users.find(q => q.id === id); if (!u) return err(400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found'); delete db.refresh[a.refresh_token]; return { json: session(u) } }
    const s = info.token && db.sessions[info.token], me = s && s.exp > Date.now() ? db.users.find(u => u.id === s.uid) : null;
    if (path === 'logout') { if (info.token) delete db.sessions[info.token]; return { status: 204, json: null } }
    if (path === 'user') { if (!me) return err(401, 'bad_jwt', 'invalid JWT'); if (info.method === 'PUT') { if (a.password != null) { if (String(a.password).length < 6) return err(422, 'weak_password', 'Password should be at least 6 characters.'); me.password = a.password } } return { json: pub(me) } }
    if (path === 'recover') { db.mails++; if (db.mails > db.opts.mailLimit) return err(429, 'over_email_send_rate_limit', 'email rate limit exceeded'); return { json: {} } }
    return err(404, 'not_found', 'no such endpoint');
  }
  function rpc(fn, a, info) {
    a = a || {}; let me = null;
    if (info && info.token) { const s = db.sessions[info.token]; if (!s || s.exp <= Date.now()) return { status: 401, json: { code: 'PGRST301', message: 'JWT expired' } }; me = db.users.find(u => u.id === s.uid) || null }
    const members = ['cl_me', 'cl_set_username', 'cl_save_put', 'cl_save_get', 'cl_save_delete']; if (members.includes(fn) && !me) return { status: 401, json: { code: '42501', message: 'permission denied for function ' + fn } };
    if (fn === 'cl_username_free') { const n = String(a.p_name || '').trim(); return { json: n.length >= 3 && n.length <= 24 && !db.users.some(u => u.name.toLowerCase() === n.toLowerCase()) } }
    if (fn === 'cl_me') return { json: { id: me.id, username: me.name, saves: db.saves.filter(s => s.uid === me.id).map(s => ({ slot: s.slot, meta: s.meta, rev: s.rev, device: s.device, updated: s.updated })) } };
    if (fn === 'cl_set_username') { const n = clean(a.p_name, 99, ''); if (n.length < 3 || n.length > 24) return bad('a player name has 3 to 24 letters'); if (db.users.some(u => u !== me && u.name.toLowerCase() === n.toLowerCase())) return bad('that player name is taken'); me.name = n; db.parks.forEach(p => { if (p.uid === me.id) p.author = n }); return { json: { username: n } } }
    if (fn === 'cl_save_put') { if (!['career', 'sandbox'].includes(a.p_slot)) return bad('bad slot'); if (!a.p_data || typeof a.p_data !== 'object' || JSON.stringify(a.p_data).length > 400000) return bad('park data is missing or too large');
      const s = db.saves.find(q => q.uid === me.id && q.slot === a.p_slot), base = a.p_base_rev == null ? null : a.p_base_rev;
      if (s) { if (base !== s.rev) return { json: { conflict: true, rev: s.rev, meta: s.meta, device: s.device, updated: s.updated } }; Object.assign(s, { data: a.p_data, meta: a.p_meta || {}, device: String(a.p_device || '').slice(0, 40), rev: s.rev + 1, updated: new Date().toISOString() }); return { json: { rev: s.rev, updated: s.updated } } }
      db.saves.push({ uid: me.id, slot: a.p_slot, data: a.p_data, meta: a.p_meta || {}, device: String(a.p_device || '').slice(0, 40), rev: 1, updated: new Date().toISOString() }); return { json: { rev: 1, updated: new Date().toISOString() } } }
    if (fn === 'cl_save_get') { const s = db.saves.find(q => q.uid === me.id && q.slot === a.p_slot); return { json: s ? { slot: s.slot, data: s.data, meta: s.meta, rev: s.rev, device: s.device, updated: s.updated } : null } }
    if (fn === 'cl_save_delete') { const n = db.saves.length; db.saves = db.saves.filter(q => !(q.uid === me.id && q.slot === a.p_slot)); return { json: db.saves.length < n } }
    // ---- shared parks: a park belongs to the account that published it, else to the device
    if (fn === 'cl_publish_park') { if (!keyOk(a.p_owner_key)) return bad('bad owner key'); if (!/^[A-Za-z0-9]{4,40}$/.test(a.p_park_key || '')) return bad('bad park key'); const author = me ? me.name : clean(a.p_author, 24, 'Anonymous');
      let p = db.parks.find(q => q.key === a.p_park_key && (q.owner === a.p_owner_key || me && q.uid === me.id));
      if (p) { if (p.uid && (!me || p.uid !== me.id)) return bad('this park belongs to an account: sign in to that account to update it'); Object.assign(p, { name: clean(a.p_name, 40, 'My Park'), author, data: a.p_data, stats: a.p_stats, uid: p.uid || (me ? me.id : null), updated: new Date().toISOString() }); return { json: { code: p.code, updated: true, member: !!me } } }
      if (db.parks.filter(q => q.owner === a.p_owner_key && !q.uid || me && q.uid === me.id).length >= 5) return bad('you can publish at most 5 parks: remove one first');
      p = { code: code6(), owner: a.p_owner_key, uid: me ? me.id : null, key: a.p_park_key, name: clean(a.p_name, 40, 'My Park'), author, data: a.p_data, stats: a.p_stats, visits: 0, updated: new Date().toISOString() }; db.parks.push(p); return { json: { code: p.code, updated: false, member: !!me } } }
    if (fn === 'cl_get_park') { const p = db.parks.find(q => q.code === String(a.p_code || '').trim().toUpperCase()); if (!p) return { json: null }; p.visits++; return { json: { code: p.code, name: p.name, author: p.author, data: p.data, stats: p.stats, visits: p.visits, ...stars(p), updated: p.updated, member: !!p.uid } } }
    if (fn === 'cl_rate_park') { if (!(a.p_stars >= 1 && a.p_stars <= 5)) return bad('stars must be 1 to 5'); if (!keyOk(a.p_rater_key)) return bad('bad rater key'); const p = db.parks.find(q => q.code === String(a.p_code || '').trim().toUpperCase()); if (!p) return bad('no park with that code');
      if (p.owner === a.p_rater_key || me && p.uid === me.id) return bad('you cannot rate your own park'); const by = me ? 'user:' + me.id : a.p_rater_key;
      db.ratings = db.ratings.filter(q => !(q.code === p.code && (q.by === by || me && q.by === a.p_rater_key))); db.ratings.push({ code: p.code, by, stars: a.p_stars }); return { json: stars(p) } }
    if (fn === 'cl_list_parks') return { json: db.parks.map(p => ({ code: p.code, name: p.name, author: p.author, stats: p.stats, visits: p.visits, ...stars(p), updated: p.updated, member: !!p.uid })) };
    if (fn === 'cl_my_parks') return { json: db.parks.filter(p => !p.uid && keyOk(a.p_owner_key) && p.owner === a.p_owner_key || me && p.uid === me.id).map(p => ({ code: p.code, name: p.name, park_key: p.key, visits: p.visits, updated: p.updated, member: !!p.uid })) };
    if (fn === 'cl_unpublish_park') { const n = db.parks.length, c = String(a.p_code || '').trim().toUpperCase(); db.parks = db.parks.filter(p => !(p.code === c && (!p.uid && p.owner === a.p_owner_key || me && p.uid === me.id))); db.ratings = db.ratings.filter(r => db.parks.some(p => p.code === r.code)); return { json: db.parks.length < n } }
    return null;
  }
  // noDb: the account server works but the database functions are not installed yet (every function answers 404)
  const cloud = (fn, a, info) => { db.calls.push(fn); if (db.opts.down) return { status: 503, json: { message: 'down' } }; if (db.opts.noDb && !fn.startsWith('auth/')) return null; return fn.startsWith('auth/') ? auth(fn.slice(5), a, info || { query: {} }) : rpc(fn, a, info) };
  return { cloud, db };
};
