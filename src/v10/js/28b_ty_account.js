// ---- 10.0 PLAYER ACCOUNTS (optional) — email + password sign-in with Supabase Auth, and cloud saves.
//  · The whole game works without an account. An account adds: your Career and Sandbox parks are kept in the cloud
//    (open them on any device), and the parks you publish belong to your account instead of one device.
//  · Sign-up and sign-in use an email address and a password only. Nothing here depends on an email arriving:
//    with "Confirm email" switched off in Supabase a new account is signed in at once. If confirmation is switched
//    on later (with a real email sender), the same code shows "check your email" and accepts the link.
//  · The browser holds only the project's publishable key and the player's own session (in this device's storage).
//    Cloud saves are protected in the database: a player can read and write only their own rows.
//  · Password reset uses Supabase's email. Until the project has its own email sender, Supabase's built-in one is
//    limited to a couple of emails an hour (and to the project team's addresses), so resets may not arrive.
const AUTH10 = { s: null, mode: 'in', busy: '', err: '', msg: '', ui: { email: '', pw: '', name: '', show: false, pw2: '', nick: null }, saves: {}, ask: null, syncing: false, syncAt: 0, syncErr: '', recover: false, open: false, t: 20, dirty: false };
{ const s = LS10('auth', null); if (s && typeof s.at === 'string' && typeof s.rt === 'string' && typeof s.uid === 'string' && s.uid) AUTH10.s = s }
const nameOk10 = n => String(n == null ? '' : n).replace(/[\u0000-\u001f<>"&]/g, '').trim().slice(0, 24);
// the name shown on published parks and above the live pin: the account's player name, else this device's nickname
const nick10 = () => AUTH10.s && AUTH10.s.name ? AUTH10.s.name : dev10().nick;
async function authApi10(path, body, o = {}) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), o.ms || 15000);
  try {
    const h = { apikey: CLOUD10.key }; if (body) h['Content-Type'] = 'application/json'; if (o.token) h.Authorization = 'Bearer ' + o.token;
    const r = await fetch(CLOUD10.url + '/auth/v1/' + path, { method: o.method || 'POST', headers: h, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal, cache: 'no-store' });
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null } catch (e) {}
    if (!r.ok) { const e = new Error(j && (j.msg || j.message || j.error_description || j.error) || 'HTTP ' + r.status); e.status = r.status; e.code = j && (j.error_code || j.error || j.code); throw e }
    return j;
  } finally { clearTimeout(t) }
}
// plain words for what the account server said
function authWhy10(e, what) {
  if (!e || !e.status) return 'The account server cannot be reached from here (no internet, or this page is not allowed to connect). You can keep playing without an account.';
  const c = String(e.code || ''), m = String(e.message || '');
  if (c === 'invalid_credentials' || /invalid login credentials/i.test(m) || c === 'invalid_grant' && !/confirm/i.test(m)) return 'Wrong email or password.';
  if (c === 'email_not_confirmed' || /not confirmed/i.test(m)) return 'This account still has to be confirmed by email. Open the link in the email you were sent, then sign in.';
  if (c === 'user_already_exists' || c === 'email_exists' || /already registered/i.test(m)) return 'There is already an account with this email. Sign in instead.';
  if (c === 'weak_password' || /password should be|weak password/i.test(m)) return 'That password is not strong enough: ' + m.replace(/\.$/, '') + '.';
  if (c === 'same_password') return 'That is already your password.';
  if (c === 'over_email_send_rate_limit' || e.status === 429 && /email/i.test(m)) return 'The game can only send a couple of emails an hour right now, and that limit is reached. Try again later.';
  if (e.status === 429 || /rate limit/i.test(m)) return 'Too many tries. Wait a minute and try again.';
  if (c === 'signup_disabled' || /signups? not allowed/i.test(m)) return 'New accounts are switched off for this game right now.';
  if (c === 'email_address_invalid' || c === 'validation_failed' || /invalid.*email|email.*invalid/i.test(m)) return 'That email address does not look right.';
  if (/database error saving new user/i.test(m)) return 'That player name is taken or not allowed. Try another one (3 to 24 letters).';
  if (c === 'reauthentication_needed') return 'For safety, sign out, sign in again and then change the password.';
  if (c === 'session_not_found' || c === 'bad_jwt' || e.status === 401 || e.status === 403) return what === 'in' ? 'Wrong email or password.' : 'Your sign-in has run out. Please sign in again.';
  return 'The account server said: ' + m.slice(0, 160);
}
function authSet10(j) {
  if (!j || typeof j.access_token !== 'string' || typeof j.refresh_token !== 'string') return false; const u = j.user || {}, old = AUTH10.s;
  AUTH10.s = { at: j.access_token, rt: j.refresh_token, exp: j.expires_at ? j.expires_at * 1000 : Date.now() + (+j.expires_in || 3600) * 1000, uid: u.id || (old && old.uid) || '', email: u.email || (old && old.email) || '', name: nameOk10(u.user_metadata && u.user_metadata.username) || (old && old.name) || '' };
  SS10('auth', AUTH10.s); return true;
}
function authClear10(msg) { AUTH10.s = null; AUTH10.mode = 'in'; DEL10('auth'); AUTH10.saves = {}; AUTH10.ask = null; AUTH10.recover = false; AUTH10.syncErr = ''; if (msg) AUTH10.msg = msg; acctChip10(); if (AUTH10.open) acctDraw10(); if (UI72.pk === 'ty10' && UI72.pkTab === 'share') renderPk72(false) }
// a valid access token (renewed shortly before it runs out), or null when signed out
let _ref10 = null;
async function token10(force) {
  const s = AUTH10.s; if (!s) return null; if (!force && s.exp - Date.now() > 60000) return s.at;
  if (!_ref10) _ref10 = (async () => { try { authSet10(await authApi10('token?grant_type=refresh_token', { refresh_token: s.rt })) } catch (e) { if (e && e.status && e.status < 500 && e.status !== 429) authClear10('Your sign-in has run out. Please sign in again.') } finally { _ref10 = null } })();
  await _ref10; return AUTH10.s && AUTH10.s.exp - Date.now() > 5000 ? AUTH10.s.at : null;
}
// ---- sign up, sign in, sign out
const emailOk10 = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
async function signUp10(email, pw, name) {
  email = String(email || '').trim().toLowerCase(); name = nameOk10(name); AUTH10.err = AUTH10.msg = '';
  if (name.length < 3) return authFail10('Choose a player name of 3 to 24 letters.'); if (!emailOk10(email)) return authFail10('That email address does not look right.'); if (String(pw || '').length < 8) return authFail10('Use a password of at least 8 characters.');
  AUTH10.busy = 'Creating your account…'; acctDraw10();
  try {
    let free = true; try { free = await rpc10('cl_username_free', { p_name: name }) } catch (e) { if (!e || !e.status) throw e }// (when the cloud functions are not installed yet the sign-up itself still says if a name is taken)
    if (free === false) { AUTH10.busy = ''; return authFail10('That player name is taken. Try another one.') }
    const j = await authApi10('signup', { email, password: pw, data: { username: name } }); AUTH10.busy = ''; AUTH10.ui.pw = '';
    if (authSet10(j)) { if (!AUTH10.s.name) AUTH10.s.name = name; SS10('auth', AUTH10.s); AUTH10.msg = 'Welcome, ' + AUTH10.s.name + '! Your parks are now kept in your account.'; acctChip10(); acctDraw10(); try { sfx('unlock') } catch (e) {} await syncAll10(); return true }
    AUTH10.mode = 'in'; AUTH10.msg = 'Your account is made, but it has to be confirmed by email before you can sign in. Open the link in the email sent to ' + email + ', then sign in here.'; acctDraw10(); return false;
  } catch (e) { AUTH10.busy = ''; return authFail10(authWhy10(e, 'up')) }
}
async function signIn10(email, pw) {
  email = String(email || '').trim().toLowerCase(); AUTH10.err = AUTH10.msg = '';
  if (!emailOk10(email)) return authFail10('That email address does not look right.'); if (!pw) return authFail10('Type your password.');
  AUTH10.busy = 'Signing in…'; acctDraw10();
  try { const j = await authApi10('token?grant_type=password', { email, password: pw }); AUTH10.busy = ''; AUTH10.ui.pw = ''; if (!authSet10(j)) return authFail10('The account server gave no sign-in. Try again.'); AUTH10.msg = 'Signed in.'; acctChip10(); acctDraw10(); await syncAll10(); return true }
  catch (e) { AUTH10.busy = ''; return authFail10(authWhy10(e, 'in')) }
}
function authFail10(why) { AUTH10.err = why; acctDraw10(); return false }
async function signOut10() {
  const s = AUTH10.s; if (!s) return; AUTH10.busy = 'Saving and signing out…'; acctDraw10();
  try { if (!AUTH10.ask) for (const slot of ['career', 'sandbox']) await syncUp10(slot) } catch (e) {}// one last save; the parks also stay on this device
  try { const tk = await token10(); if (tk) await authApi10('logout?scope=local', null, { token: tk, ms: 6000 }) } catch (e) {}
  AUTH10.busy = ''; AUTH10.err = ''; authClear10('Signed out. Your parks are still on this device.');
}
async function recover10(email) {
  email = String(email || '').trim().toLowerCase(); AUTH10.err = AUTH10.msg = ''; if (!emailOk10(email)) return authFail10('Type your email address first, then tap “Forgot password?”.');
  AUTH10.busy = 'Asking for a reset email…'; acctDraw10();
  try { await authApi10('recover?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { email }); AUTH10.busy = ''; AUTH10.msg = 'If there is an account for ' + email + ', a reset link is on its way. This game can only send a couple of emails an hour for now, so if nothing arrives in a few minutes, try again later.'; acctDraw10(); return true }
  catch (e) { AUTH10.busy = ''; return authFail10(authWhy10(e)) }
}
async function newPw10(pw) {
  AUTH10.err = AUTH10.msg = ''; if (String(pw || '').length < 8) return authFail10('Use a password of at least 8 characters.');
  AUTH10.busy = 'Changing the password…'; acctDraw10();
  try { const tk = await token10(); if (!tk) throw { status: 401 }; await authApi10('user', { password: pw }, { method: 'PUT', token: tk }); AUTH10.busy = ''; AUTH10.ui.pw2 = ''; AUTH10.recover = false; AUTH10.msg = 'Your password is changed.'; acctDraw10(); return true }
  catch (e) { AUTH10.busy = ''; return authFail10(authWhy10(e)) }
}
async function newName10(n) {
  n = nameOk10(n); AUTH10.err = AUTH10.msg = ''; if (n.length < 3) return authFail10('A player name has 3 to 24 letters.');
  AUTH10.busy = 'Changing your player name…'; acctDraw10();
  try { const r = await rpc10('cl_set_username', { p_name: n }); AUTH10.busy = ''; AUTH10.s.name = r.username; SS10('auth', AUTH10.s); AUTH10.ui.nick = null; AUTH10.msg = 'You are now ' + r.username + '.'; acctChip10(); acctDraw10(); if (LIVE10.joined) liveTrack10(); return true }
  catch (e) { AUTH10.busy = ''; return authFail10(e && e.status && e.message && !/HTTP \d/.test(e.message) ? e.message.charAt(0).toUpperCase() + e.message.slice(1) + '.' : cloudWhy10(e)) }
}
// a link from an email (password reset, or a confirmation once those are switched on) signs the player in
function acctHash10() {
  const h = location.hash || ''; if (!/(^|[#&])(access_token|error_description)=/.test(h)) return false;
  const q = new URLSearchParams(h.replace(/^#/, '')); try { history.replaceState(null, '', location.pathname + location.search) } catch (e) {}
  if (q.get('error_description')) { AUTH10.err = 'That link did not work: ' + q.get('error_description') + '.'; acctOpen10(); return true }
  const at = q.get('access_token'), rt = q.get('refresh_token'), rec = q.get('type') === 'recovery'; if (!at || !rt) return false;
  authApi10('user', null, { method: 'GET', token: at }).then(u => { authSet10({ access_token: at, refresh_token: rt, expires_in: +q.get('expires_in') || 3600, user: u }); AUTH10.recover = rec; AUTH10.msg = rec ? 'Choose a new password for your account.' : 'You are signed in.'; acctChip10(); acctOpen10(); if (!rec) syncAll10() }).catch(e => { AUTH10.err = authWhy10(e); acctOpen10() });
  return true;
}
// ---- cloud saves: the player's Career and Sandbox parks, one row each
const rawPark10 = slot => { try { return localStorage.getItem(K10 + 'park.' + slot) } catch (e) { return null } };
const metaOf10 = P_ => ({ name: nameOk10(P_.name) || 'My Park', day: +P_.day || 1, money: P_.mode === 'sandbox' ? null : Math.round(+P_.money || 0), rating: Math.round(+P_.rating || 0), things: Array.isArray(P_.objs) ? P_.objs.length : 0 });
const metaRaw10 = raw => { try { return metaOf10(JSON.parse(raw)) } catch (e) { return null } };
const untouched10 = raw => { try { const P_ = JSON.parse(raw); return (+P_.day || 1) <= 1 && (!P_.objs || !P_.objs.length) && !(P_.tot && P_.tot.exp > 0) } catch (e) { return true } };
function devName10() { const u = navigator.userAgent || ''; return (/iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows PC' : /Linux/.test(u) ? 'Linux PC' : 'Browser') + ' ' + dev10().pid.slice(0, 4) }
function syncRec10(slot) { const st = LS10('sync', {}); return AUTH10.s && st.uid === AUTH10.s.uid && st[slot] || null }
function syncMark10(slot, rev, h) { let st = LS10('sync', {}); if (!AUTH10.s) return; if (st.uid !== AUTH10.s.uid) st = { uid: AUTH10.s.uid }; st[slot] = { rev, h }; SS10('sync', st) }
const liveSlot10 = slot => TY.on && !TY.visit && TY.slot === slot;
// send this device's park. base = the cloud revision it replaces (undefined: the one this device last saw)
async function syncUp10(slot, base) {
  if (!AUTH10.s) return { off: true }; if (liveSlot10(slot)) savePark10(); const raw = rawPark10(slot); if (!raw) return { none: true };
  const rec = syncRec10(slot), h = hash10(raw); if (base === undefined) { if (rec && rec.h === h) return { same: true }; base = rec ? rec.rev : null }
  let P_; try { P_ = JSON.parse(raw) } catch (e) { return { none: true } }
  const r = await rpc10('cl_save_put', { p_slot: slot, p_data: P_, p_meta: metaOf10(P_), p_device: devName10(), p_base_rev: base }, 30000);
  if (r && r.conflict) return r; syncMark10(slot, r.rev, h); AUTH10.saves[slot] = { slot, meta: metaOf10(P_), rev: r.rev, device: devName10(), updated: new Date().toISOString() }; return r;
}
// fetch the cloud park onto this device. The park it replaces is kept as a backup on this device.
async function syncDown10(slot) {
  const r = await rpc10('cl_save_get', { p_slot: slot }, 30000); if (!r) return false;
  const P_ = cleanPark10(r.data, slot); if (!P_) throw new Error('the park in the cloud could not be read');
  if (liveSlot10(slot)) savePark10(); const old = rawPark10(slot), raw = JSON.stringify(P_, skipRt10);
  try { if (old && old !== raw && !untouched10(old)) localStorage.setItem(K10 + 'park.' + slot + '.bak', old); localStorage.setItem(K10 + 'park.' + slot, raw) } catch (e) { saveFail81('v10.park', e); throw new Error('this device is out of storage space') }
  syncMark10(slot, r.rev, hash10(raw)); AUTH10.saves[slot] = { slot, meta: r.meta || metaOf10(P_), rev: r.rev, device: r.device, updated: r.updated };
  if (liveSlot10(slot)) { TY.sel = null; tyEnter10(slot, loadPark10(slot)); toast10('☁ Loaded the newer park from your account', 'acct', true) }// the view stays where it was
  return true;
}
// the player started a park again from nothing: the copy in the account goes too (at the next sync if offline now)
function acctWiped10(slot) { if (!AUTH10.s) return; const st = LS10('sync', {}); if (st.uid !== AUTH10.s.uid) return; st[slot] = { rev: st[slot] ? st[slot].rev : 0, h: 0, wiped: true }; SS10('sync', st); AUTH10.dirty = true; AUTH10.t = Math.min(AUTH10.t, 1.5) }
// bring this device and the account in line. Never overwrites a played park without asking.
async function syncAll10() {
  if (!AUTH10.s || AUTH10.syncing || AUTH10.ask) return false; AUTH10.syncing = true; AUTH10.syncErr = ''; if (AUTH10.open) acctDraw10(); let ok = false;
  try {
    const me = await rpc10('cl_me', {}); if (!me) throw { status: 401 }; if (!AUTH10.s) return false;
    if (me.username && me.username !== AUTH10.s.name) { AUTH10.s.name = nameOk10(me.username); SS10('auth', AUTH10.s); acctChip10() }
    AUTH10.saves = {}; for (const sv of me.saves || []) AUTH10.saves[sv.slot] = sv;
    for (const slot of ['career', 'sandbox']) {
      let cl = AUTH10.saves[slot], rec = syncRec10(slot); if (liveSlot10(slot)) savePark10(); const raw = rawPark10(slot), h = raw ? hash10(raw) : 0;
      if (rec && rec.wiped) { if (cl) await rpc10('cl_save_delete', { p_slot: slot }); delete AUTH10.saves[slot]; cl = null; const st = LS10('sync', {}); delete st[slot]; SS10('sync', st); rec = null }
      if (!cl) { if (raw && !untouched10(raw)) await syncUp10(slot, null); continue }
      if (!raw) { await syncDown10(slot); continue }
      if (rec && rec.rev === cl.rev) { if (rec.h !== h) { const r = await syncUp10(slot, cl.rev); if (r && r.conflict) { AUTH10.ask = { slot, cloud: r, local: metaRaw10(raw) }; break } } continue }// only this device changed
      if (rec && rec.h === h || untouched10(raw)) { await syncDown10(slot); continue }// only the cloud changed (or nothing was built here yet)
      AUTH10.ask = { slot, cloud: cl, local: metaRaw10(raw) }; break;// both changed, or this device's park was never part of this account: the player decides
    }
    AUTH10.syncAt = Date.now(); AUTH10.dirty = false; ok = true;
  } catch (e) { AUTH10.syncErr = e && e.status === 401 ? 'Your sign-in has run out. Please sign in again.' : e && (e.status === 404 || e.code === 'PGRST202') ? 'You are signed in. Cloud saves are not switched on for this game yet, so your parks stay on this device for now.' : e && e.status ? 'Cloud save did not work: ' + String(e.message || e.status).slice(0, 140) : !e || e.name === 'AbortError' || e instanceof TypeError ? 'The cloud cannot be reached right now. Your parks are safe on this device and will be sent later.' : 'Cloud save did not work: ' + String(e.message || e).slice(0, 140) }
  AUTH10.syncing = false; if (AUTH10.ask && TY.on && !AUTH10.open) toast10('☁ Your account has a different ' + (AUTH10.ask.slot === 'sandbox' ? 'Sandbox' : 'Career') + ' park. Open 👤 Account to choose which one to keep.', 'acctAsk', true);
  if (AUTH10.open) acctDraw10(); if (UI72.pk === 'ty10' && UI72.pkTab === 'share') renderPk72(false); return ok;
}
// the player chose which of two different parks to keep; the other one stays on this device as a backup
async function syncKeep10(which) {
  const a = AUTH10.ask; if (!a || AUTH10.syncing) return false; AUTH10.syncing = true; AUTH10.syncErr = ''; AUTH10.busy = which === 'cloud' ? 'Loading the park from your account…' : 'Sending this device’s park to your account…'; acctDraw10(); let ok = false;
  try {
    if (which === 'cloud') await syncDown10(a.slot);
    else { const r = await rpc10('cl_save_get', { p_slot: a.slot }, 30000); if (r && r.data) { try { localStorage.setItem(K10 + 'park.' + a.slot + '.bak', JSON.stringify(r.data)) } catch (e) {} } const u = await syncUp10(a.slot, r ? r.rev : null); if (u && u.conflict) throw new Error('the park in the cloud changed again just now: try once more') }
    AUTH10.ask = null; AUTH10.msg = which === 'cloud' ? 'Loaded the park from your account. The other park is kept as a backup on this device.' : 'This device’s park is now the one in your account. The other park is kept as a backup on this device.'; ok = true;
  } catch (e) { AUTH10.err = e && e.status ? cloudWhy10(e) : 'That did not work: ' + String(e && e.message || e).slice(0, 140) + '.' }
  AUTH10.syncing = false; AUTH10.busy = ''; acctDraw10(); if (ok) syncAll10(); return ok;
}
// swap the current park with the backup made when a park was replaced
function bakSwap10(slot) {
  let bak = null; try { bak = localStorage.getItem(K10 + 'park.' + slot + '.bak') } catch (e) {} if (!bak) return false; let o = null; try { o = JSON.parse(bak) } catch (e) {} const P_ = o && cleanPark10(o, slot); if (!P_) return false;
  if (liveSlot10(slot)) savePark10(); const cur = rawPark10(slot);
  try { localStorage.setItem(K10 + 'park.' + slot, JSON.stringify(P_, skipRt10)); if (cur) localStorage.setItem(K10 + 'park.' + slot + '.bak', cur); else localStorage.removeItem(K10 + 'park.' + slot + '.bak') } catch (e) { return false }
  if (liveSlot10(slot)) { TY.sel = null; tyEnter10(slot, loadPark10(slot)) } AUTH10.dirty = true; AUTH10.t = 3; return true;
}
// quiet saving while you play: a few minutes apart, at the end of each day, and when you leave the park
TICKS72.push((dt, raw) => { if (!AUTH10.s) return; AUTH10.t -= raw; if (AUTH10.t > 0) return; AUTH10.t = AUTH10.dirty ? 20 : 180; if (AUTH10.syncing || AUTH10.ask || !TY10.booted) return; if (TY.on && !TY.visit || AUTH10.dirty) syncAll10().then(ok => { if (!ok && AUTH10.s) AUTH10.t = 90 }) });
on72('ty10', ({ on }) => { if (AUTH10.s) { AUTH10.dirty = true; AUTH10.t = Math.min(AUTH10.t, on ? 2 : .5) } });
{ const f0 = endDay10; endDay10 = function () { const r = f0.apply(this, arguments); if (AUTH10.s) { AUTH10.dirty = true; AUTH10.t = Math.min(AUTH10.t, 4) } return r } }
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && AUTH10.s && TY.on && !TY.visit && !AUTH10.syncing && !AUTH10.ask) syncUp10(TY.slot).catch(() => {}) });
// ---- the account page
const ago10 = iso => { const t = Date.parse(iso); if (!isFinite(t)) return ''; const s = Math.max(0, (Date.now() - t) / 1000); return s < 90 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago' };
const metaLine10 = m => m ? 'day ' + (m.day || 1) + (m.money != null ? ' · ' + money10(m.money) : ' · sandbox') + ' · ' + (m.things || 0) + ' things built' : '';
function acctHTML10() {
  const A = AUTH10, s = A.s, u = A.ui, dis = A.busy ? ' disabled' : '', note = (A.err ? `<p class="acMsg bad" role="alert">${html10(A.err)}</p>` : '') + (A.msg ? `<p class="acMsg" role="status">${html10(A.msg)}</p>` : '') + (A.busy ? `<p class="acMsg wait" role="status">⏳ ${html10(A.busy)}</p>` : '');
  const pwField = (id, key, ac, ph) => `<span class="acPw"><input id="${id}" data-acf="${key}" type="${u.show ? 'text' : 'password'}" name="${ac === 'current-password' ? 'password' : 'new-password'}" autocomplete="${ac}" minlength="6" maxlength="72" placeholder="${ph}" value="${html10(u[key])}" required><button type="button" class="acEye" data-ac="show" aria-label="${u.show ? 'Hide' : 'Show'} the password" aria-pressed="${u.show}">${u.show ? '🙈' : '👁'}</button></span>`;
  if (!s) {
    const up = A.mode === 'up';
    return `<p class="acSub">Keep your parks in the cloud and open them on any device. The whole game works without an account too.</p>
<div class="acSeg" role="tablist"><button type="button" role="tab" aria-selected="${!up}" class="${up ? '' : 'on'}" data-ac="mode:in">Sign in</button><button type="button" role="tab" aria-selected="${up}" class="${up ? 'on' : ''}" data-ac="mode:up">Create account</button></div>
<form id="acF" data-acform="${up ? 'up' : 'in'}" novalidate>
${up ? `<label for="acName">Player name<small>Shown on the parks you share</small></label><input id="acName" data-acf="name" type="text" name="nickname" autocomplete="nickname" minlength="3" maxlength="24" placeholder="3 to 24 letters" value="${html10(u.name)}" required>` : ''}
<label for="acEmail">Email</label><input id="acEmail" data-acf="email" type="email" name="email" autocomplete="username" inputmode="email" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="254" placeholder="you@example.com" value="${html10(u.email)}" required>
<label for="acPw">Password${up ? '<small>At least 8 characters</small>' : ''}</label>${pwField('acPw', 'pw', up ? 'new-password' : 'current-password', up ? 'Choose a password' : 'Your password')}
${note}<button class="btn primary acGo" type="submit"${dis}>${up ? 'Create my account' : 'Sign in'}</button></form>
<div class="acRow">${up ? '<span></span>' : `<button type="button" class="acLink" data-ac="forgot"${dis}>Forgot password?</button>`}<button type="button" class="acLink" data-ac="close">Play without an account</button></div>
<p class="acFine">Your email is only used to sign you in and to reset your password.</p>`;
  }
  if (A.recover) return `<div class="acWho"><i>👤</i><div><b>${html10(s.name || 'Player')}</b><small>${html10(s.email)}</small></div></div><h3>Choose a new password</h3><form id="acF" data-acform="pw" novalidate><label for="acPw2">New password<small>At least 8 characters</small></label>${pwField('acPw2', 'pw2', 'new-password', 'New password')}${note}<button class="btn primary acGo" type="submit"${dis}>Save the new password</button></form><div class="acRow"><span></span><button type="button" class="acLink" data-ac="norecover">Not now</button></div>`;
  if (A.ask) { const a = A.ask, nm = a.slot === 'sandbox' ? 'Sandbox' : 'Career', c = a.cloud.meta || {}, l = a.local || {};
    return `<div class="acWho"><i>👤</i><div><b>${html10(s.name || 'Player')}</b><small>${html10(s.email)}</small></div></div><h3>Two different ${nm} parks</h3><p class="acSub">Your account has a ${nm} park, and this device has a different one. Which one do you want to keep playing? The other one is kept as a backup on this device, so nothing is lost.</p>
<div class="acPick"><button type="button" data-ac="keep:cloud"${dis}><i>☁</i><b>${html10(c.name || 'Park in your account')}</b><small>${html10(metaLine10(c))}</small><small>saved ${html10(ago10(a.cloud.updated))}${a.cloud.device ? ' from ' + html10(a.cloud.device) : ''}</small><em>Use the park in my account</em></button>
<button type="button" data-ac="keep:local"${dis}><i>📱</i><b>${html10(l.name || 'Park on this device')}</b><small>${html10(metaLine10(l))}</small><small>on this device</small><em>Keep this device’s park</em></button></div>${note}<div class="acRow"><span></span><button type="button" class="acLink" data-ac="close">Decide later</button></div>`; }
  const row = slot => { const sv = A.saves[slot], nm = slot === 'sandbox' ? '🧪 Sandbox park' : '🏆 Career park', loc = rawPark10(slot), has = loc && !untouched10(loc); let bak = false; try { bak = !!localStorage.getItem(K10 + 'park.' + slot + '.bak') } catch (e) {}
    return `<div class="acSave"><div><b>${nm}${sv && sv.meta && sv.meta.name ? ' · ' + html10(sv.meta.name) : ''}</b><small>${sv ? '☁ ' + html10(metaLine10(sv.meta)) + ' · saved ' + html10(ago10(sv.updated)) + (sv.device ? ' from ' + html10(sv.device) : '') : has ? 'On this device only so far' : 'Not started yet'}</small></div>${bak ? `<button type="button" class="acLink" data-ac="bak:${slot}"${dis} title="Swap this park with the backup kept on this device">↩ Backup</button>` : ''}</div>` };
  return `<div class="acWho"><i>👤</i><div><b>${html10(s.name || 'Player')}</b><small>${html10(s.email)}</small></div><button type="button" class="btn" data-ac="out"${dis}>Sign out</button></div>
<h3>☁ Your parks in your account</h3>${row('career')}${row('sandbox')}
<p class="acFine">${A.syncing ? '⏳ Syncing…' : A.syncErr ? '⚠ ' + html10(A.syncErr) : A.syncAt ? '✅ Up to date · checked ' + html10(ago10(new Date(A.syncAt).toISOString())) + '. Your parks are saved to your account while you play.' : 'Your parks are saved to your account while you play.'}</p>
<div class="acRow"><button type="button" class="btn primary" data-ac="sync"${dis || (A.syncing ? ' disabled' : '')}>🔄 Sync now</button><button type="button" class="btn" data-ac="play">▶ Open my park</button></div>${note}
<details class="acMore"${u.nick != null || u.pw2 ? ' open' : ''}><summary>Account settings</summary>
<form data-acform="name" novalidate><label for="acNick">Player name</label><div class="acIn"><input id="acNick" data-acf="nick" type="text" autocomplete="nickname" minlength="3" maxlength="24" value="${html10(u.nick != null ? u.nick : s.name)}"><button class="btn" type="submit"${dis}>Save</button></div></form>
<form data-acform="pw" novalidate><label for="acPw2">New password<small>At least 8 characters</small></label><div class="acIn">${pwField('acPw2', 'pw2', 'new-password', 'New password')}<button class="btn" type="submit"${dis}>Change</button></div></form>
<p class="acFine">Signing out keeps your parks on this device. To delete your account and its cloud saves, ask the game’s owner.</p></details>`;
}
function acctDraw10() {
  const el = $ty10('acct10'), b = $ty10('acB'); if (!el || !b || el.hidden) return; const f = document.activeElement, fid = f && el.contains(f) ? f.id : '', pos = fid && typeof f.selectionStart === 'number' ? [f.selectionStart, f.selectionEnd] : null;
  b.innerHTML = acctHTML10(); $ty10('acT').textContent = AUTH10.s ? 'Your account' : AUTH10.mode === 'up' ? 'Create your account' : 'Sign in';
  if (fid) { const n = $ty10(fid); if (n) { try { n.focus({ preventScroll: true }); if (pos && n.type !== 'email') n.setSelectionRange(pos[0], pos[1]) } catch (e) {} } }
}
function acctChip10() { const c = document.querySelector('#start .acChip'); if (c) c.innerHTML = AUTH10.s ? '👤 <b>' + html10(AUTH10.s.name || 'Account') + '</b>' : '👤 <b>Sign in</b>' }
function acctOpen10(mode) { const el = $ty10('acct10'); if (!el) return false; if (mode && !AUTH10.s) AUTH10.mode = mode; AUTH10.open = true; el.hidden = false; acctDraw10(); if (AUTH10.s && !AUTH10.syncing && !AUTH10.ask && Date.now() - AUTH10.syncAt > 30000) syncAll10(); if (!AUTH10.s && !mobile) { const i = $ty10(AUTH10.mode === 'up' ? 'acName' : 'acEmail'); if (i) try { i.focus() } catch (e) {} } return true }
function acctClose10() { const el = $ty10('acct10'); if (!el) return; AUTH10.open = false; el.hidden = true; AUTH10.err = ''; AUTH10.msg = ''; AUTH10.ui.pw = ''; AUTH10.ui.pw2 = ''; AUTH10.ui.show = false; if (UI72.pk === 'ty10' && UI72.pkTab === 'share') renderPk72(false) }
function acctAct10(a) {
  const [k, v_] = String(a).split(':'), A = AUTH10;
  switch (k) {
    case 'close': acctClose10(); break;
    case 'mode': A.mode = v_ === 'up' ? 'up' : 'in'; A.err = A.msg = ''; acctDraw10(); { const i = $ty10(A.mode === 'up' ? 'acName' : 'acEmail'); if (i && !mobile) i.focus() } break;
    case 'show': A.ui.show = !A.ui.show; acctDraw10(); break;
    case 'forgot': recover10(A.ui.email); break;
    case 'norecover': A.recover = false; A.err = A.msg = ''; acctDraw10(); break;
    case 'out': signOut10(); break;
    case 'sync': A.err = A.msg = ''; syncAll10(); break;
    case 'play': acctClose10(); if (!TY.on) tyOpen10(); break;
    case 'keep': syncKeep10(v_ === 'cloud' ? 'cloud' : 'local'); break;
    case 'bak': ask7('Swap this park with the backup kept on this device? The park you have now becomes the backup.', 'Swap them', 'Cancel').then(y => { if (y && bakSwap10(v_ === 'sandbox' ? 'sandbox' : 'career')) { A.msg = 'Swapped. The park you had is now the backup.'; acctDraw10() } }); break;
  }
}
{
  const el = $ty10('acct10');
  if (el) {
    el.addEventListener('click', e => { const b = e.target.closest('[data-ac]'); if (b) { e.preventDefault(); if (!b.disabled) acctAct10(b.dataset.ac) } else if (e.target === el) acctClose10() });
    el.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.acf; if (k) AUTH10.ui[k] = e.target.value });
    el.addEventListener('submit', e => { e.preventDefault(); if (AUTH10.busy) return; const k = e.target.dataset.acform, u = AUTH10.ui; if (k === 'in') signIn10(u.email, u.pw); else if (k === 'up') signUp10(u.email, u.pw, u.name); else if (k === 'pw') newPw10(u.pw2); else if (k === 'name') newName10(u.nick != null ? u.nick : AUTH10.s && AUTH10.s.name) });
    el.addEventListener('keydown', e => { if (e.key !== 'Escape') e.stopPropagation() });// typing here never reaches the game's own keys
    addEventListener('keydown', e => { if (AUTH10.open && e.key === 'Escape' && $('#dlg7').hidden) { e.preventDefault(); e.stopImmediatePropagation(); acctClose10() } }, true);
  }
  // ways in: the title screen, the hub and the Park Office
  const st = document.querySelector('#start .stLogo'); if (st) { st.insertAdjacentHTML('afterend', '<button type="button" class="acChip" data-go="acct10" aria-label="Account: sign in or see your account"></button>'); $('#start').addEventListener('click', e => { if (e.target.closest('[data-go="acct10"]')) acctOpen10() }); acctChip10() }
  hubItem72('acct10', '👤', 'Account', () => AUTH10.s ? 'Signed in as ' + (AUTH10.s.name || AUTH10.s.email) + ' · parks saved to the cloud' : 'Sign in to keep your parks on every device', () => { closeHub72(); acctOpen10() }, 2);
  { const g = HUBG82.find(q => q[1] && q[1].includes('ty10')); if (g) g[1].push('acct10') }
}
TY10.account = acctOpen10; TY10.authLink = acctHash10;
if (AUTH10.s) { AUTH10.dirty = true; AUTH10.t = 5 }// signed in from last time: check the account shortly after start-up
