// ---- 10.0 MY PARK — sharing and visiting.
//  · Park codes: the whole park packed into a text code (compressed). Works offline, anywhere: copy, paste, visit.
//  · The park cloud (Supabase): publish your park under a 6-letter code, visit parks by code, rate them, leaderboards.
//    The browser uses only the project's publishable key and seven database functions; the tables cannot be read or
//    written directly. A park belongs to the device that published it (a random secret kept on this device).
//  · Live presence: while you are in a published park, everyone else in that park right now is shown as a marker with
//    their name, moving where they are looking, and can send emoji reactions (Supabase Realtime presence + broadcast).
//    The park itself is the published copy: each visitor's own device simulates its visitors.
const CLOUD10 = { url: 'https://celqksoohozvqbdktapm.supabase.co', key: 'sb_publishable_hyXK3qEvoQU2wEsedYPhng_GGnBmOd8', anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHFrc29vaG96dnFiZGt0YXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NzQ4NjgsImV4cCI6MjEwOTE1MDg2OH0.YIHD1YhH78gI4Hs3jrjsxnmW9ipzP0_Ep0-n9UGAl88',
  st: 'unknown', why: '', lists: {}, sort: 'top', my: null, busy: '', ui: { code: '', nick: null }, checked: 0 };
const skipRt10 = (k, v) => k === 'rt' ? undefined : v;
// the park as saved: runtime state (3D objects, queues) is never written
savePark10 = function () { const P_ = TY.park; if (!P_ || TY.visit || !TY.slot || RESTORE80) return false; try { localStorage.setItem(K10 + 'park.' + TY.slot, JSON.stringify(P_, skipRt10)); return true } catch (e) { saveFail81('v10.park', e); return false } };
// this device: a secret (proves which parks it published; never shown) and a public id, name and colour for presence
function dev10() { let d = LSP10('dev', null); if (!d || typeof d.key !== 'string' || !/^[0-9a-f]{48}$/.test(d.key)) { const a = new Uint8Array(30); crypto.getRandomValues(a); const hx = [...a].map(b => b.toString(16).padStart(2, '0')).join(''); d = { key: hx.slice(0, 48), pid: hx.slice(48), nick: 'Guest ' + (1000 + Math.floor(Math.random() * 9000)), col: pickR10(['#ff5a6e', '#ffc233', '#2fd18b', '#22e0ff', '#9b6bff', '#ff7a2f', '#ff4fd8']) }; SSP10('dev', d) } return d }
// ---- park codes
const b64u10 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
const ub64u10 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u };
function shareSnap10(P_) { const o = JSON.parse(JSON.stringify(P_, skipRt10)); delete o.led; o.hist = (o.hist || []).slice(-10); return o }
async function pack10(obj) {
  const json = JSON.stringify(obj);
  try { if (typeof CompressionStream === 'function') { const st = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw')); return 'CL10Z' + b64u10(new Uint8Array(await new Response(st).arrayBuffer())) } } catch (e) {}
  return 'CL10J' + b64u10(new TextEncoder().encode(json));
}
async function unpack10(code) {
  const c = String(code || '').replace(/\s+/g, ''), m = /^(CL10[ZJ])([A-Za-z0-9_-]+)$/.exec(c); if (!m) return null;
  try { const u = ub64u10(m[2]); let txt; if (m[1] === 'CL10Z') { if (typeof DecompressionStream !== 'function') throw new Error('This browser cannot open compressed park codes'); const st = new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw')); txt = await new Response(st).text() } else txt = new TextDecoder().decode(u); return JSON.parse(txt) } catch (e) { return null }// a damaged code is an ordinary mistake: the caller explains it to the player
}
// ---- visiting (read only: you can look at everything, ride the coasters and watch its visitors, but not change it)
function tyVisit10(P_, meta) {
  if (!P_) return false; if (TY.on && !TY.visit) savePark10(); liveLeave10(); TY.visit = meta; TY.cam.set = false; const ok = tyEnter10(null, P_); TY.cam.set = true;
  if (ok) { achGet10('ty_visit'); toast10('👀 Welcome to ' + P_.name + (meta.by ? ' by ' + meta.by : '') + '! Look around, tap rides to ride them. 🏢 Office → Share has your way home.', 'visit', true); if (meta.code) liveJoin10(meta.code) } return ok;
}
async function visitCode10(code) {
  const c = String(code || '').trim();
  if (/^CL10/.test(c)) { const o = await unpack10(c); const P_ = o && cleanPark10(o, o.mode === 'sandbox' ? 'sandbox' : 'career'); if (!P_) return 'That park code could not be read. Check that all of it was copied.'; closePk72(); tyVisit10(P_, { name: P_.name, by: '', code: '' }); return '' }
  const k = c.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, ''); if (k.length !== 6) return 'A cloud code has 6 letters and numbers (like K7Q2XM). Long codes start with CL10.';
  CLOUD10.busy = 'Opening ' + k + '…'; renderPk72(false);
  try { const r = await rpc10('cl_get_park', { p_code: k }); CLOUD10.busy = ''; if (!r) return 'No park has the code ' + k + '.'; const P_ = cleanPark10(r.data, r.data && r.data.mode === 'sandbox' ? 'sandbox' : 'career'); if (!P_) return 'That park could not be opened.'; P_.name = cleanName(r.name) || P_.name; closePk72(); tyVisit10(P_, { name: P_.name, by: cleanName(r.author), code: r.code, cloud: true, stars: +r.stars || 0, votes: +r.votes || 0, visits: +r.visits || 0 }); return '' }
  catch (e) { CLOUD10.busy = ''; return cloudWhy10(e) }
}
// ---- the cloud
async function rpc10(fn, args, ms = 12000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try {
    // a signed-in player's requests carry their session, so the database knows whose parks these are
    const call = async tk => { const h = { 'Content-Type': 'application/json', apikey: CLOUD10.key }; if (tk) h.Authorization = 'Bearer ' + tk; return fetch(CLOUD10.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: h, body: JSON.stringify(args), signal: ctl.signal, cache: 'no-store' }) };
    let tk = await token10(), r = await call(tk); if (r.status === 401 && tk) { tk = await token10(true); r = await call(tk) }// the session ran out mid-way: renew it once
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null } catch (e) {}
    if (!r.ok) { const e = new Error(j && (j.message || j.hint) || 'HTTP ' + r.status); e.status = r.status; e.code = j && j.code; throw e }
    CLOUD10.st = 'ok'; return j;
  } finally { clearTimeout(t) }
}
function cloudWhy10(e) {
  if (e && (e.status === 404 || e.code === 'PGRST202')) { CLOUD10.st = 'missing'; return 'The park cloud is not switched on for this game yet (its database functions are missing). Park codes still work.' }
  if (e && e.status) return 'The park cloud said: ' + String(e.message || e.status).slice(0, 160);
  CLOUD10.st = 'off'; return 'The park cloud cannot be reached from here (no internet, or this page is not allowed to connect). Park codes still work.';
}
async function cloudCheck10(force) {
  if (CLOUD10.loading || !force && performance.now() - CLOUD10.checked < 20000) return; CLOUD10.checked = performance.now(); CLOUD10.loading = true;
  try { CLOUD10.lists[CLOUD10.sort] = await rpc10('cl_list_parks', { p_sort: CLOUD10.sort, p_limit: 15 }); CLOUD10.my = await rpc10('cl_my_parks', { p_owner_key: dev10().key }); CLOUD10.why = '' } catch (e) { CLOUD10.why = cloudWhy10(e) }
  CLOUD10.loading = false;
  if (UI72.pk === 'ty10' && UI72.pkTab === 'share') renderPk72(false);
}
function stats10(P_) { const L = level10(P_), co = P_.objs.filter(o => o.k[1] === ':'); return { rating: Math.round(P_.rating), rep: Math.round(P_.rep), day: P_.day, guests: Math.round(P_.tot.guests), rides: Math.round(P_.tot.rides), coasters: co.length, attractions: P_.objs.filter(o => { const i = objInfo10(o); return i && (i.t === 'coaster' || i.t === 'flat') }).length, level: L.lv, mode: P_.mode, money: P_.mode === 'sandbox' ? null : Math.round(P_.money) } }
async function publish10() {
  const P_ = TY.park, d = dev10(); if (!P_ || TY.visit) return; CLOUD10.busy = 'Publishing…'; renderPk72(false);
  try { const r = await rpc10('cl_publish_park', { p_owner_key: d.key, p_park_key: P_.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 40), p_name: P_.name, p_author: nick10(), p_data: shareSnap10(P_), p_stats: stats10(P_) }, 25000); CLOUD10.busy = ''; P_.seen.cloud = r.code; savePark10(); achGet10('ty_share'); toast10('☁ ' + (r.updated ? 'Updated' : 'Published') + '! Your park code is ' + r.code, 'pub', true); CLOUD10.checked = 0; cloudCheck10(true); if (CLOUD10.liveOwn !== false) liveJoin10(r.code) }
  catch (e) { CLOUD10.busy = ''; CLOUD10.why = cloudWhy10(e) } renderPk72(false);
}
// ---- live presence (Supabase Realtime: Phoenix protocol over one WebSocket)
const LIVE10 = { ws: null, topic: '', code: '', ref: 0, jref: '', joined: false, others: new Map(), hbT: 0, posT: 0, err: '', marks: [], lastSent: '' };
function liveSend10(m) { const ws = LIVE10.ws; if (ws && ws.readyState === 1) { m.ref = String(++LIVE10.ref); ws.send(JSON.stringify(m)); return true } return false }
function liveJoin10(code) {
  liveLeave10(); if (typeof WebSocket !== 'function' || !code) return; const d = dev10(); LIVE10.code = code; LIVE10.topic = 'realtime:clpark-' + code; LIVE10.err = '';
  let ws; try { ws = new WebSocket(CLOUD10.url.replace(/^https/, 'wss') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(CLOUD10.anon) + '&vsn=1.0.0') } catch (e) { LIVE10.err = 'Live presence is not available here'; return }
  LIVE10.ws = ws;
  ws.onopen = () => { LIVE10.jref = String(++LIVE10.ref); ws.send(JSON.stringify({ topic: LIVE10.topic, event: 'phx_join', payload: { config: { broadcast: { self: false, ack: false }, presence: { key: d.pid }, private: false }, access_token: CLOUD10.anon }, ref: LIVE10.jref, join_ref: LIVE10.jref })) };
  ws.onmessage = e => {
    let m; try { m = JSON.parse(e.data) } catch (er) { return } if (m.topic !== LIVE10.topic) return; const p = m.payload || {};
    if (m.event === 'phx_reply' && m.ref === LIVE10.jref) { if (p.status === 'ok') { LIVE10.joined = true; liveTrack10() } else LIVE10.err = 'Could not join the live park'; tyUi10() }
    else if (m.event === 'presence_state') { LIVE10.others.clear(); for (const k in p) livePut10(k, p[k]) }
    else if (m.event === 'presence_diff') { for (const k in (p.leaves || {})) LIVE10.others.delete(k); for (const k in (p.joins || {})) livePut10(k, p.joins[k]) }
    else if (m.event === 'broadcast' && p.payload) { const q = p.payload, o = LIVE10.others.get(q.id); if (!o) return; if (p.event === 'pos') { o.tx = +q.x || 0; o.tz = +q.z || 0 } else if (p.event === 'emo' && typeof q.e === 'string' && /^.{1,4}$/u.test(q.e)) { o.say = q.e; o.sayT = 3 } }
    else if (m.event === 'phx_error' || m.event === 'phx_close') { LIVE10.joined = false; LIVE10.err = 'The live connection closed' }
  };
  ws.onclose = () => { if (LIVE10.ws === ws) { LIVE10.joined = false; LIVE10.others.clear(); LIVE10.ws = null } };
  ws.onerror = () => { LIVE10.err = 'The live connection could not be opened from here' };
}
function livePut10(k, v_) { if (k === dev10().pid) return; const meta = v_ && Array.isArray(v_.metas) && v_.metas[v_.metas.length - 1]; if (!meta) return; const o = LIVE10.others.get(k) || { x: +meta.x || 0, z: +meta.z || 0, tx: +meta.x || 0, tz: +meta.z || 0, say: '', sayT: 0 }; o.name = cleanName(meta.name).slice(0, 18) || 'Visitor'; o.col = /^#[0-9a-f]{6}$/i.test(meta.col) ? meta.col : '#ffffff'; o.owner = !!meta.owner; LIVE10.others.set(k, o) }
function liveTrack10() { const d = dev10(); liveSend10({ topic: LIVE10.topic, event: 'presence', payload: { type: 'presence', event: 'track', payload: { name: nick10(), col: d.col, x: Math.round(TY.cam.x), z: Math.round(TY.cam.z), owner: !TY.visit } } }) }
function liveLeave10() { const ws = LIVE10.ws; LIVE10.ws = null; LIVE10.joined = false; LIVE10.others.clear(); LIVE10.code = ''; if (ws) { try { ws.onclose = null; ws.close() } catch (e) {} } liveMarks10() }
function liveEmo10(e) { if (!LIVE10.joined) return; liveSend10({ topic: LIVE10.topic, event: 'broadcast', payload: { type: 'broadcast', event: 'emo', payload: { id: dev10().pid, e } } }); bubbleAt10(TY.cam.x, TY.cam.z, e) }
// markers for the people who are here: a coloured pin with their name, gliding to where they are looking
function liveMarks10() {
  const want = TY.on ? [...LIVE10.others.values()] : [];
  while (LIVE10.marks.length > want.length) { const m = LIVE10.marks.pop(); m.g.traverse(q => { if (q.geometry) q.geometry.dispose(); if (q.material) { if (q.material.map) q.material.map.dispose(); q.material.dispose() } }); if (m.g.parent) m.g.parent.remove(m.g) }
  want.forEach((o, i) => { let m = LIVE10.marks[i]; if (!m || m.key !== o.name + o.col) { if (m) { m.g.traverse(q => { if (q.geometry) q.geometry.dispose(); if (q.material) { if (q.material.map) q.material.map.dispose(); q.material.dispose() } }); m.g.parent && m.g.parent.remove(m.g) } const g = new THREE.Group(), c = new THREE.Color(o.col), pin = new THREE.Mesh(new THREE.ConeGeometry(.9, 2.6, 12).rotateX(PI), new THREE.MeshBasicMaterial({ color: c })); pin.position.y = 3.4; g.add(pin); const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 24).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .7, depthWrite: false })); ring.position.y = .12; g.add(ring); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 64, (x, W, H_) => { x.fillStyle = 'rgba(10,18,34,.85)'; x.fillRect(0, 0, W, H_); x.fillStyle = o.col; x.fillRect(0, H_ - 6, W, 6); x.fillStyle = '#fff'; x.font = '800 30px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText((o.owner ? '👑 ' : '') + o.name, W / 2, H_ / 2 - 2) }), depthTest: false, transparent: true })); sp.scale.set(5, 1.25, 1); sp.position.y = 6; sp.renderOrder = 9; g.add(sp); TY.root.add(g); m = LIVE10.marks[i] = { g, key: o.name + o.col } } m.o = o });
}
TICKS72.push((dt, raw) => {
  if (!LIVE10.ws) return; LIVE10.hbT -= raw; if (LIVE10.hbT <= 0) { LIVE10.hbT = 25; liveSend10({ topic: 'phoenix', event: 'heartbeat', payload: {} }) }
  if (!LIVE10.joined || !TY.on) return; LIVE10.posT -= raw; const pos = Math.round(TY.cam.x) + ',' + Math.round(TY.cam.z); if (LIVE10.posT <= 0 && pos !== LIVE10.lastSent) { LIVE10.posT = .6; LIVE10.lastSent = pos; liveSend10({ topic: LIVE10.topic, event: 'broadcast', payload: { type: 'broadcast', event: 'pos', payload: { id: dev10().pid, x: Math.round(TY.cam.x), z: Math.round(TY.cam.z) } } }) }
  if (LIVE10.marks.length !== LIVE10.others.size) liveMarks10();
  for (const m of LIVE10.marks) { const o = m.o; if (!o) continue; o.x += (o.tx - o.x) * Math.min(1, dt * 3); o.z += (o.tz - o.z) * Math.min(1, dt * 3); m.g.position.set(o.x, 0, o.z); m.g.children[0].position.y = 3.4 + Math.sin(TY.t * 3 + o.x) * .3; if (o.sayT > 0) { o.sayT -= dt; if (o.sayT > 2.9) bubbleAt10(o.x, o.z, o.say) } }
});
on72('ty10', ({ on }) => { if (!on) liveLeave10(); else if (!TY.visit && TY.park && TY.park.seen.cloud && CLOUD10.liveOwn !== false && CLOUD10.st === 'ok') liveJoin10(TY.park.seen.cloud) });
// ---- the Share & visit tab of the Park Office
function shareHTML10() {
  const P_ = TY.park, d = dev10(), V_ = TY.visit, st = CLOUD10.st, live = LIVE10.joined, nOth = LIVE10.others.size; let h = '';
  if (st === 'unknown' || performance.now() - CLOUD10.checked > 20000) cloudCheck10(); else if (st === 'ok' && !CLOUD10.lists[CLOUD10.sort] && !CLOUD10.loading) cloudCheck10(true);// e.g. after visiting by code: the cloud is known to work but the lists were never fetched
  if (!V_) h += `<div class="tyLi${AUTH10.s ? ' now' : ''}"><i>👤</i><div><b>${AUTH10.s ? html10(AUTH10.s.name || 'Signed in') : 'Play on every device'}</b><small>${AUTH10.s ? (AUTH10.ask ? '⚠ Two different parks: choose which one to keep' : AUTH10.syncErr ? '⚠ ' + html10(AUTH10.syncErr) : 'Signed in · your parks are saved to your account') : 'Sign in or create a free account to keep your parks in the cloud. Optional.'}</small></div><button class="btn${AUTH10.s && !AUTH10.ask ? '' : ' primary'}" data-x="acct">${AUTH10.s ? (AUTH10.ask ? 'Choose' : 'Account') : 'Sign in'}</button></div>`;
  if (V_) h += `<div class="tyLi now"><i>👀</i><div><b>Visiting ${html10(V_.name)}</b><small>${V_.by ? 'by ' + html10(V_.by) + ' · ' : ''}${V_.cloud ? '☁ ' + V_.code + ' · ' + V_.visits + ' visits · ' + (V_.votes ? '★ ' + (+V_.stars).toFixed(1) + ' (' + V_.votes + ' vote' + (V_.votes > 1 ? 's' : '') + ')' : 'no stars yet') : 'from a park code'}</small></div></div>
${V_.cloud ? `<h3>Rate this park</h3><div class="tySeg">${[1, 2, 3, 4, 5].map(n => `<button data-x="rate:${n}" class="${V_.mine === n ? 'on' : ''}">${'★'.repeat(n)}</button>`).join('')}</div>` : ''}
<div class="tyRow">${pkBtn10('home', '🏠 Back to my park', 'primary')}</div>`;
  h += `<h3>🟢 Live <small>${live ? (nOth ? nOth + ' other' + (nOth > 1 ? 's' : '') + ' here now' : 'nobody else here right now') : LIVE10.ws ? 'connecting…' : 'off'}</small></h3><p class="tyNote">${live ? 'Everyone in this park right now shows up as a coloured pin with their name, moving where they look. You are “' + html10(nick10()) + '”.' : V_ && V_.cloud ? (LIVE10.err ? html10(LIVE10.err) + '. ' : '') + 'Live presence starts automatically in cloud parks.' : 'Live presence works in parks published to the cloud: yours (after publishing) and the ones you visit by cloud code.'}</p>${live ? `<div class="tySeg">${['👋', '👏', '😍', '😱', '🎉', '🤢'].map(e => `<button data-x="emo:${e}">${e}</button>`).join('')}</div>` : ''}`;
  if (!V_) h += `<h3>📋 Share with a code <small>works offline</small></h3><p class="tyNote">The whole park packed into text: send it in a message, and anyone with Coaster Lab 10 can visit it.</p><div class="tyRow">${pkBtn10('copy', '📋 Copy park code')}${pkBtn10('file', '⬇ Download park file')}${navigator.share ? pkBtn10('sys', '📤 Share…') : ''}</div>${CLOUD10.code ? `<textarea readonly id="tyOutI" aria-label="Your park code">${html10(CLOUD10.code)}</textarea>` : ''}`;
  h += `<h3>🧳 Visit a park</h3><p class="tyNote">Paste a long park code (starts with CL10) or type a 6-letter cloud code.</p><textarea id="tyCodeI" data-x="codeIn" placeholder="CL10Z… or K7Q2XM" aria-label="Park code">${html10(CLOUD10.ui.code)}</textarea><div class="tyRow">${pkBtn10('visit', '▶ Visit', 'primary')}${pkBtn10('fileIn', '📂 Open a park file')}${V_ ? '' : pkBtn10('sandIn', '📥 Load into my Sandbox')}</div>${CLOUD10.msg ? `<p class="tyNote" style="color:#ffd27a">${html10(CLOUD10.msg)}</p>` : ''}`;
  const lst = CLOUD10.lists[CLOUD10.sort];
  h += `<h3>☁ Park cloud <small>${st === 'ok' ? 'connected' : st === 'missing' ? 'not switched on yet' : st === 'off' ? 'not reachable' : 'checking…'}</small></h3>${CLOUD10.busy ? `<p class="tyNote">⏳ ${html10(CLOUD10.busy)}</p>` : ''}${CLOUD10.why ? `<p class="tyNote">${html10(CLOUD10.why)}</p>` : ''}`;
  if (st === 'ok') {
    if (!V_) h += (AUTH10.s ? `<div class="tyStep"><span><b>Your name in the cloud</b>${html10(nick10())} · your account’s player name (change it in 👤 Account)</span></div>` : `<div class="tyStep"><span><b>Your name in the cloud</b>Shown on your parks and above your pin</span></div><div style="display:flex;gap:8px"><input type="text" id="tyNickI" data-x="nick" maxlength="20" value="${html10(CLOUD10.ui.nick != null ? CLOUD10.ui.nick : d.nick)}">${pkBtn10('nickSave', 'Save')}</div>`) + `
<div class="tyRow">${pkBtn10('pub', P_.seen.cloud ? '☁ Update my published park' : '☁ Publish my park', 'primary')}</div>${P_.seen.cloud ? `<p class="tyNote">Published as <b>${P_.seen.cloud}</b>. Updating replaces the published copy with the park as it is now.</p>` : ''}${(CLOUD10.my || []).length ? `<div class="tyList">${CLOUD10.my.map(m => `<div class="tyLi"><i>☁</i><div><b>${html10(m.name)} · ${html10(m.code)}</b><small>${m.visits} visits · ${m.member ? 'in your account' : 'published from this device'}</small></div><button class="btn" data-x="unpub:${html10(m.code)}">Remove</button></div>`).join('')}</div>` : ''}`;
    h += `<h3>🏆 Leaderboards</h3><div class="tySeg">${[['top', '★ Top rated'], ['rating', '⭐ Best parks'], ['visits', '👥 Most visited'], ['new', '🆕 Newest']].map(q => `<button data-x="sort:${q[0]}" class="${CLOUD10.sort === q[0] ? 'on' : ''}">${q[1]}</button>`).join('')}</div>${lst ? (lst.length ? `<table class="tyLb">${lst.map((p, i) => `<tr><td>${i + 1}</td><td><b>${html10(p.name)}</b><br><small style="color:var(--ink2)">${html10(p.author)}${p.member ? ' <span title="Signed-in player">✔</span>' : ''} · ${p.votes ? '★ ' + (+p.stars).toFixed(1) + ' (' + p.votes + ')' : 'no stars yet'} · rating ${p.stats && p.stats.rating != null ? p.stats.rating : '—'} · ${p.visits} visits${p.stats && p.stats.coasters != null ? ' · ' + p.stats.coasters + ' coasters' : ''}</small></td><td style="width:auto"><button class="btn" data-x="cgo:${html10(p.code)}">Visit</button></td></tr>`).join('')}</table>` : '<p class="tyNote">No parks published yet. Be the first!</p>') : '<p class="tyNote">Loading…</p>'}`;
  }
  if (!V_ && P_) h += `<h3>📊 Compare</h3><p class="tyNote">Your park now: rating ${Math.round(P_.rating)} · ${Math.round(P_.tot.guests).toLocaleString('en-US')} visitors in all · ${P_.objs.filter(o => o.k[1] === ':').length} coasters · day ${P_.day}.${lst && lst.length ? ' Best in the cloud: ' + html10(lst[0].name) + ' (rating ' + (lst[0].stats && lst[0].stats.rating != null ? lst[0].stats.rating : '—') + ').' : ''}</p>`;
  return h;
}
function shareInp10(a, t) { if (a === 'codeIn') { CLOUD10.ui.code = t.value.slice(0, 200000); return false } if (a === 'nick') { CLOUD10.ui.nick = t.value; return false } return false }
function shareAct10(k, v_, t) {
  const P_ = TY.park, d = dev10(), V_ = TY.visit, done = () => { if (UI72.pk === 'ty10') renderPk72(false) };
  switch (k) {
    case 'home': closePk72(); tyOpen10(); return false;
    case 'copy': case 'sys': case 'file': (async () => { const code = await pack10(shareSnap10(P_)); CLOUD10.code = code; if (k === 'file') { const a = document.createElement('a'), u = URL.createObjectURL(new Blob([JSON.stringify({ app: 'Coaster Lab', kind: 'park', v: TY10.version, code })], { type: 'application/json' })); a.href = u; a.download = (P_.name.replace(/[^A-Za-z0-9]+/g, '-') || 'park') + '.coasterpark.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 10000) } else if (k === 'sys') { try { await navigator.share({ title: P_.name + ' — Coaster Lab park', text: 'Visit my park in Coaster Lab 10 (🏗 My Park → Office → Share → Visit a park):\n' + code }) } catch (e) {} } else { try { await navigator.clipboard.writeText(code); say('📋 Park code copied (' + Math.round(code.length / 1000) + ' k letters)') } catch (e) { say('Copy it from the box below') } } achGet10('ty_share'); done() })(); return false;
    case 'visit': { const c = ($('#tyCodeI') || {}).value || CLOUD10.ui.code; CLOUD10.msg = ''; visitCode10(c).then(w => { if (w) { CLOUD10.msg = w; done() } }); return false }
    case 'sandIn': (async () => { const c = ($('#tyCodeI') || {}).value || CLOUD10.ui.code, o = /^CL10/.test(c.trim()) ? await unpack10(c) : null, P2 = o && cleanPark10(o, 'sandbox'); if (!P2) { CLOUD10.msg = 'Paste a long park code (CL10…) to copy a park into your Sandbox.'; done(); return } if (!(await ask7('Replace your Sandbox park with “' + P2.name + '”? Your Career park is not touched.', 'Replace Sandbox', 'Cancel', true))) return; P2.id = newPark10('sandbox').id; SS10('park.sandbox', JSON.parse(JSON.stringify(P2, skipRt10))); closePk72(); tyOpen10('sandbox') })(); return false;
    case 'fileIn': { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.onchange = async () => { const f = inp.files && inp.files[0]; if (!f || f.size > 3e6) return; try { const o = JSON.parse(await f.text()); if (o && typeof o.code === 'string') { const w = await visitCode10(o.code); if (w) { CLOUD10.msg = w; done() } } else { CLOUD10.msg = 'That file is not a Coaster Lab park.'; done() } } catch (e) { CLOUD10.msg = 'That file could not be read.'; done() } }; inp.click(); return false }
    case 'pub': publish10(); return false;
    case 'nickSave': { const n = cleanName(CLOUD10.ui.nick != null ? CLOUD10.ui.nick : d.nick).slice(0, 20); if (n) { d.nick = n; SSP10('dev', d); CLOUD10.ui.nick = null; if (LIVE10.joined) liveTrack10(); say('Name saved') } return false }
    case 'unpub': (async () => { if (!(await ask7('Remove the published park ' + v_ + ' from the cloud? Its ratings go too.', 'Remove', 'Keep', true))) return; try { await rpc10('cl_unpublish_park', { p_owner_key: d.key, p_code: v_ }); if (P_ && P_.seen.cloud === v_) { delete P_.seen.cloud; savePark10(); liveLeave10() } CLOUD10.checked = 0; cloudCheck10(true) } catch (e) { CLOUD10.why = cloudWhy10(e); done() } })(); return false;
    case 'acct': acctOpen10(); return false;
    case 'sort': CLOUD10.sort = v_; if (!CLOUD10.lists[v_]) { CLOUD10.checked = 0; cloudCheck10(true) } return true;
    case 'cgo': visitCode10(v_).then(w => { if (w) { CLOUD10.msg = w; done() } }); return false;
    case 'rate': if (V_ && V_.cloud) { (async () => { try { const r = await rpc10('cl_rate_park', { p_code: V_.code, p_rater_key: d.key, p_stars: +v_ }); V_.mine = +v_; V_.stars = +r.stars; V_.votes = +r.votes; say('★ Thanks for rating ' + V_.name) } catch (e) { say(cloudWhy10(e)) } done() })() } return false;
    case 'emo': liveEmo10(v_); return false;
  }
  return undefined;
}
// open a park from a link: …#park=K7Q2XM (cloud) or …#pc=CL10Z… (park code)
TY10.deepLink = () => { const h = location.hash || ''; const m = /[#&]park=([2-9A-HJ-NP-Za-hj-np-z]{6})/.exec(h), m2 = /[#&]pc=(CL10[ZJ][A-Za-z0-9_-]+)/.exec(h); if (!m && !m2) return; setTimeout(() => { visitCode10(m ? m[1] : m2[1]).then(w => { if (w) say(w) }) }, 600) };
TY10.open = tyOpen10; TY10.visit = tyVisit10;
