// ---- 10.1 MY PARK — saves you can rely on.
//  · Status: when the park was last saved, how big it is, and a warning that stays on screen while saving fails.
//  · Automatic backups: at the end of every park day the park as saved is copied aside; the last three are kept.
//    A copy is also taken before anything that replaces a park (starting again, restoring a backup or a file).
//  · Damaged saves: a save that cannot be read is never thrown away and never silently replaced by an empty park.
//    Its text is kept, the newest backup that reads is loaded instead, and the player is told what happened.
//  · Two tabs: when the same park is open twice, the tab holding the older copy stops saving instead of overwriting
//    the newer one, and offers to load it.
//  · Backup files: a full copy of the park to keep outside the browser, checked (kind, checksum, every field) before
//    it is accepted back.
// Storage: coasterlab.v10.bak.<slot>.<0-2> (backups), coasterlab.v10.park.<slot>.rv (save counter),
// coasterlab.v10.park.<slot>.damaged (a save that could not be read). The park's own save format is unchanged.
const SAVE10 = { at: 0, ok: true, n: 0, fails: 0, stale: false, base: {}, sid: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), notice: '', note: '', bakErr: 0, bakAt: 0 };
const BAK_N10 = 3, BAK_WHY10 = { day: 'end of day', wipe: 'before starting again', restore: 'before a restore', file: 'before a file was loaded', damaged: 'kept automatically' };
const pkKey10 = slot => K10 + 'park.' + slot, bakKey10 = (slot, i) => K10 + 'bak.' + slot + '.' + i;
const lsGet10 = k => { try { return localStorage.getItem(k) } catch (e) { return null } };
const rvGet10 = slot => { const r = LS10('park.' + slot + '.rv', null); return r && typeof r === 'object' && Number.isInteger(r.n) && r.n >= 0 ? r : { n: 0, sid: '' } };
const slotOk10 = s => s === 'career' || s === 'sandbox' || s === 'scn';
// ---- backups. Each one is a small header line, a line break, then the park exactly as it was saved.
function bakRead10(slot, i) { const r = lsGet10(bakKey10(slot, i)); if (!r) return null; const nl = r.indexOf('\n'); if (nl < 2) return null; let h = null; try { h = JSON.parse(r.slice(0, nl)) } catch (e) {} if (!h || typeof h !== 'object') return null; return { i, t: numP10(h.t, 0, 0, 4e12), day: Math.round(numP10(h.day, 1, 1, 1e6)), why: has10(BAK_WHY10, h.why) ? h.why : 'day', name: cleanName(h.name) || 'My Park', money: h.money == null ? null : Math.round(numP10(h.money, 0, -1e12, 1e12)), things: Math.round(numP10(h.things, 0, 0, 5000)), sum: numP10(h.sum, 0, 0, 4294967295), data: r.slice(nl + 1) } }
function bakList10(slot) { const a = []; for (let i = 0; i < BAK_N10; i++) { const b = bakRead10(slot, i); if (b) a.push(b) } return a.sort((x, y) => y.t - x.t) }
// copy the saved park aside. Never raises the "storage is full" alarm: a backup that does not fit makes room by
// dropping the oldest backup once, and otherwise is skipped (the park itself is already saved).
function bakMake10(slot, why, raw) {
  if (!slotOk10(slot) || RESTORE80) return false; raw = raw || lsGet10(pkKey10(slot)); if (!raw || raw.length < 20 || raw.length > 1.5e6) return false;
  const list = bakList10(slot), sum = hash10(raw); if (list.length && list[0].sum === sum && list[0].data.length === raw.length) return false;// nothing changed since the newest backup
  let P_ = null; try { P_ = JSON.parse(raw) } catch (e) { return false } if (!P_ || typeof P_ !== 'object') return false;
  const head = JSON.stringify({ t: Date.now(), day: +P_.day || 1, why, name: cleanName(P_.name), money: P_.mode === 'sandbox' ? null : Math.round(+P_.money || 0), things: Array.isArray(P_.objs) ? P_.objs.length : 0, sum });
  let i = -1; for (let k = 0; k < BAK_N10; k++) if (!list.some(b => b.i === k)) { i = k; break } if (i < 0) i = list[list.length - 1].i;
  const put = () => { try { localStorage.setItem(bakKey10(slot, i), head + '\n' + raw); return true } catch (e) { return false } };
  if (!put()) { const old = bakList10(slot).filter(b => b.i !== i).pop(); if (old) { try { localStorage.removeItem(bakKey10(slot, old.i)) } catch (e) {} } if (!put()) { SAVE10.bakErr++; return false } }
  SAVE10.bakAt = Date.now(); return true;
}
// ---- the save counter: every save of a slot is numbered, with the tab that made it
function saveStale10(slot) {
  if (SAVE10.stale) return; SAVE10.stale = true; console.warn('10.1 saves: this park was saved by another tab; this tab has stopped saving it'); if (!TY.on) return; const el = $ty10('tyDay'); if (!el) return;
  el.innerHTML = `<h3>🗂 This park is open somewhere else</h3><p>Another tab or window saved a newer version of <b>${html10(TY.park ? TY.park.name : 'this park')}</b>. So that the two do not overwrite each other, this one has stopped saving.</p><div class="tyRow"><button class="btn primary" data-ty="svLoad">Load the newer park here</button></div><p class="tyNote">Nothing is lost: the newer park is the one that is saved.</p>`;
  el.hidden = false; saveChip10();
}
{ const s0 = savePark10; savePark10 = function () {
  const P_ = TY.park, slot = TY.slot; if (!P_ || TY.visit || !slot || RESTORE80) return false; if (SAVE10.stale) return false;
  const rv = rvGet10(slot), base = SAVE10.base[slot] || 0; if (rv.sid && rv.sid !== SAVE10.sid && rv.n > base) { saveStale10(slot); return false }
  const ok = s0.apply(this, arguments);
  if (ok) { const n = Math.max(rv.n, base) + 1; SAVE10.base[slot] = n; try { localStorage.setItem(pkKey10(slot) + '.rv', JSON.stringify({ n, sid: SAVE10.sid, t: Date.now() })) } catch (e) {} SAVE10.at = Date.now(); SAVE10.n++; if (!SAVE10.ok) { SAVE10.ok = true; saveChip10() } }
  else { SAVE10.fails++; if (SAVE10.ok) { SAVE10.ok = false; saveChip10() } }
  return ok;
} }
// another tab wrote this park while it is open here
addEventListener('storage', e => { if (!TY.on || TY.visit || !TY.slot || e.key !== pkKey10(TY.slot) || e.newValue == null) return; const rv = rvGet10(TY.slot); if (rv.sid !== SAVE10.sid) saveStale10(TY.slot) });
// write a park that did not come from this tab's own play (a backup, a file): counted like a save by this tab
function parkPut10(slot, raw) { try { localStorage.setItem(pkKey10(slot), raw) } catch (e) { saveFail81('v10.park', e); return false } const n = Math.max(rvGet10(slot).n, SAVE10.base[slot] || 0) + 1; SAVE10.base[slot] = n; try { localStorage.setItem(pkKey10(slot) + '.rv', JSON.stringify({ n, sid: SAVE10.sid, t: Date.now() })) } catch (e) {} return true }
{ const e0 = tyEnter10; tyEnter10 = function (slot, park) { const ok = e0.apply(this, arguments); if (ok && slot) { SAVE10.stale = false; SAVE10.base[slot] = rvGet10(slot).n; SAVE10.ok = true; saveChip10() } return ok } }
// ---- a save that cannot be read: keep its text, load the newest backup that reads, say so
{ const l0 = loadPark10; loadPark10 = function (slot) {
  const raw = lsGet10(pkKey10(slot)); if (raw == null) return l0(slot);
  let o = null, bad = false; try { o = JSON.parse(raw) } catch (e) { bad = true } if (!bad && (!o || typeof o !== 'object' || Array.isArray(o))) bad = true; if (!bad) return l0(slot);
  if (RESTORE80) return null;
  try { localStorage.setItem(pkKey10(slot) + '.damaged', JSON.stringify({ t: Date.now(), text: raw.slice(0, 1.5e6) })) } catch (e) {}
  const nm = slot === 'sandbox' ? 'Sandbox' : slot === 'scn' ? 'scenario' : 'Career', cands = bakList10(slot).map(b => [b.data, 'the backup from day ' + b.day]); const sb = lsGet10(pkKey10(slot) + '.bak'); if (sb) cands.push([sb, 'the copy kept at the last cloud sync']);
  for (const [txt, what] of cands) { let P_ = null; try { P_ = cleanPark10(JSON.parse(txt), slot === 'sandbox' ? 'sandbox' : 'career') } catch (e) {} if (!P_) continue; if (!parkPut10(slot, JSON.stringify(P_, skipRt10))) continue; SAVE10.notice = '🛟 Your saved ' + nm + ' park could not be read, so ' + what + ' was loaded instead. The damaged save is kept: 🏢 Office → Park → Saves.'; console.warn('10.1 saves: damaged ' + slot + ' save; restored ' + what); return l0(slot) }
  try { localStorage.removeItem(pkKey10(slot)) } catch (e) {}
  SAVE10.notice = '🛟 Your saved ' + nm + ' park could not be read and there was no backup, so a new park was started. The damaged save is kept: 🏢 Office → Park → Saves.'; console.warn('10.1 saves: damaged ' + slot + ' save; no readable backup'); return null;
} }
{ const o0 = tyOpen10; tyOpen10 = function (slot) { const ok = o0.apply(this, arguments); if (ok && SAVE10.notice) { SAVE10.note = SAVE10.notice; SAVE10.notice = ''; toast10(SAVE10.note, 'saveNote', true); try { notify81(SAVE10.note, 'save') } catch (e) {} } return ok }; TY10.open = tyOpen10 }
// ---- a backup at the end of each park day, and before a park is started again
{ const e0 = endDay10; endDay10 = function () { const r = e0.apply(this, arguments); if (TY.slot && !TY.visit) safe10('backup', () => bakMake10(TY.slot, 'day')); return r } }
// ---- restoring
function parkSwap10(slot, P_, why) {// the park in the slot becomes a backup, P_ takes its place
  if (TY.on && !TY.visit && TY.slot === slot) savePark10(); bakMake10(slot, why);
  if (!parkPut10(slot, JSON.stringify(P_, skipRt10))) return false; SAVE10.stale = false;
  if (TY.on && !TY.visit && TY.slot === slot) { TY.sel = null; tyEnter10(slot, loadPark10(slot)) } if (AUTH10.s) { AUTH10.dirty = true; AUTH10.t = Math.min(AUTH10.t, 3) } return true;
}
async function bakRestore10(slot, i) {
  const b = bakRead10(slot, i); let P_ = null; if (b) { try { P_ = cleanPark10(JSON.parse(b.data), slot === 'sandbox' ? 'sandbox' : 'career') } catch (e) {} } if (!P_) { say('That backup could not be read'); return false }
  if (!(await ask7('Go back to the backup from day ' + b.day + ' (“' + P_.name + '”, ' + P_.objs.length + ' things built)? The park you have now is kept as a backup.', 'Restore it', 'Cancel', true))) return false;
  if (!parkSwap10(slot, P_, 'restore')) return false; toast10('🗂 Restored the backup from day ' + b.day, 'bakR', true); return true;
}
// ---- backup files
const BAKFILE10 = 'park-backup';
function bakFileText10() { if (TY.on && !TY.visit) savePark10(); const raw = lsGet10(pkKey10(TY.slot)); if (!raw) return null; return JSON.stringify({ app: 'Coaster Lab', kind: BAKFILE10, v: TY10.version, slot: TY.slot, mode: TY.park.mode, scn: !!TY.park.scn, t: new Date().toISOString(), sum: hash10(raw).toString(36), park: raw }) }
// every reason a file is refused has its own plain sentence
function bakFileCheck10(txt, P0) {
  if (typeof txt !== 'string' || txt.length > 3e6) return { why: 'That file is too big to be a park backup.' };
  let o = null; try { o = JSON.parse(txt) } catch (e) { return { why: 'That file is not a Coaster Lab file (it is not readable text).' } }
  if (!o || typeof o !== 'object' || o.app !== 'Coaster Lab') return { why: 'That file was not made by Coaster Lab.' };
  if (o.kind === 'park' && typeof o.code === 'string') return { why: 'That is a park to visit, not a backup. Open it with 🔗 Share → Open a park file.' };
  if (o.kind === 'saves') return { why: 'That file holds all of the game’s saves. It can only be loaded in the Owner Control Center.' };
  if (o.kind !== BAKFILE10 || typeof o.park !== 'string') return { why: 'That file is not a park backup.' };
  if (hash10(o.park).toString(36) !== o.sum) return { why: 'That backup is damaged: it does not match its own checksum (part of the file may be missing).' };
  let raw = null; try { raw = JSON.parse(o.park) } catch (e) { return { why: 'That backup is damaged: the park inside it cannot be read.' } }
  const mode = o.mode === 'sandbox' ? 'sandbox' : 'career', P_ = cleanPark10(raw, mode); if (!P_) return { why: 'That backup does not hold a park.' };
  if (P0 && (P0.mode !== P_.mode || !!P0.scn !== !!P_.scn)) return { why: 'That backup is a ' + (P_.scn ? 'scenario' : P_.mode === 'sandbox' ? 'Sandbox' : 'Career') + ' park. Open that park first (🏢 Office → Park), then restore it.' };
  return { P: P_, t: typeof o.t === 'string' ? o.t.slice(0, 30) : '' };
}
function fileSave10(name, text) { try { const a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 10000); return true } catch (e) { return false } }
function filePick10(cb) { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.onchange = async () => { const f = inp.files && inp.files[0]; if (!f) return; if (f.size > 3e6) { cb(null, 'That file is too big to be a park backup.'); return } try { cb(await f.text(), '') } catch (e) { cb(null, 'That file could not be read.') } }; inp.click() }
async function bakFileLoad10(txt) {
  const P0 = TY.park, slot = TY.slot, r = bakFileCheck10(txt, P0); if (r.why) { SAVE10.msg = r.why; return false }
  const when = r.t && isFinite(Date.parse(r.t)) ? ' saved on ' + new Date(r.t).toLocaleDateString() : '';
  if (!(await ask7('Replace this park with the backup' + when + ' (“' + r.P.name + '”, day ' + r.P.day + ', ' + r.P.objs.length + ' things built)? The park you have now is kept as a backup.', 'Restore it', 'Cancel', true))) return false;
  if (TY.slot !== slot || !parkSwap10(slot, r.P, 'file')) return false; SAVE10.msg = ''; toast10('📂 Restored “' + r.P.name + '” from the backup file', 'bakF', true); return true;
}
// ---- the warning that stays while saving does not work
function saveChip10() {
  let c = $ty10('tySaveW'); const host = $ty10('ty10'); if (!host) return;
  if (!c) { c = document.createElement('button'); c.id = 'tySaveW'; c.type = 'button'; c.className = 'tySaveW'; c.hidden = true; c.dataset.ty = 'hq:park'; c.setAttribute('aria-live', 'assertive'); host.appendChild(c) }
  const bad = SAVE10.stale || !SAVE10.ok; c.hidden = !bad; if (bad) c.textContent = SAVE10.stale ? '⚠ Open in another tab · not saving here' : '⚠ Not saved · tap for help';
}
// ---- the Park Office: Saves and backups (on the Park tab)
const savedAgo10 = t => { const s = Math.max(0, (Date.now() - t) / 1000); return s < 20 ? 'a moment ago' : s < 90 ? 'a minute ago' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago' };
function savesHTML10() {
  const P_ = TY.park, slot = TY.slot, raw = lsGet10(pkKey10(slot)), list = bakList10(slot), rv = rvGet10(slot); let dmg = null; try { dmg = JSON.parse(lsGet10(pkKey10(slot) + '.damaged') || 'null') } catch (e) {}
  const state = SAVE10.stale ? '<b class="neg">Not saving: this park is open in another tab.</b>' : !SAVE10.ok ? '<b class="neg">The last save did not work.</b> This browser’s storage is full or blocked. Download a backup file now so nothing is lost.' : raw ? 'Saved on this device ' + (rv.t ? savedAgo10(rv.t) : 'earlier') + ' · ' + Math.max(1, Math.round(raw.length / 1024)) + ' kB' + (AUTH10.s && !AUTH10.syncErr && slot !== 'scn' ? ' · also kept in your account' : '') + '.' : 'Not saved yet.';
  return `<h3>💾 Saves and backups</h3><p class="tyNote">${state} The game saves by itself every few seconds. A backup is kept at the end of each park day (the last ${BAK_N10}), and before a park is replaced.</p>
${SAVE10.note ? `<p class="tyWarn">${html10(SAVE10.note)}</p>` : ''}${SAVE10.msg ? `<p class="tyWarn" role="alert">${html10(SAVE10.msg)}</p>` : ''}
<div class="tyRow">${pkBtn10('svNow', '💾 Save now')}${pkBtn10('svFile', '⬇ Download a backup file')}${pkBtn10('svFileIn', '📂 Restore from a backup file')}</div>
<div class="tyList">${list.map(b => `<div class="tyLi"><i>🗂</i><div><b>Day ${b.day} · ${html10(b.name)}</b><small>${b.money != null ? money10(b.money) + ' · ' : ''}${b.things} things built · ${html10(BAK_WHY10[b.why])} · ${html10(savedAgo10(b.t))}</small></div><button class="btn" data-x="svBak:${b.i}">Restore</button></div>`).join('') || '<div class="tyLi"><i>🗂</i><div><b>No backups yet</b><small>The first one is made when the park closes tonight.</small></div></div>'}</div>
${dmg && dmg.text ? `<p class="tyNote">🛟 A save from ${html10(new Date(numP10(dmg.t, 0, 0, 4e12)).toLocaleDateString())} could not be read and was kept (${Math.round(String(dmg.text).length / 1024)} kB). It can help when you report the problem.</p><div class="tyRow">${pkBtn10('svDmgDl', '⬇ Download the damaged save')}${pkBtn10('svDmgDel', '🗑 Delete it')}</div>` : ''}`;
}
{ const o0 = officeHTML10; officeHTML10 = function (tab) { let h = o0(tab); if (tab === 'park' && TY.park && !TY.visit && TY.slot) { const cut = h.indexOf('<h3>Start again</h3>'), at = cut >= 0 ? cut : h.lastIndexOf('<div class="tyRow">'); if (at >= 0) h = h.slice(0, at) + savesHTML10() + h.slice(at) } return h } }
{ const T = PANELS72.ty10, a0 = T.act; T.act = async function (a, t) {
  const [k, v_] = String(a).split(':'), slot = TY.slot, mine = TY.park && !TY.visit && slot, done = () => { if (UI72.pk === 'ty10') renderPk72(false) };
  if (!/^sv[A-Z]/.test(k)) { if (k === 'wipe' && mine) safe10('backup', () => { savePark10(); bakMake10(slot, 'wipe') }); return a0.call(this, a, t) }
  if (!mine) return false; SAVE10.msg = '';
  if (k === 'svNow') { const ok = savePark10(); say(ok ? '💾 Saved' : SAVE10.stale ? 'Not saved: this park is open in another tab' : 'Could not save: this browser’s storage is full or blocked'); done(); return false }
  if (k === 'svFile') { const txt = bakFileText10(); if (!txt || !fileSave10((TY.park.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'park') + '-day-' + TY.park.day + '.coasterbackup.json', txt)) say('Could not make the backup file'); else say('⬇ Backup file saved to your downloads'); return false }
  if (k === 'svFileIn') { filePick10(async (txt, why) => { if (why) SAVE10.msg = why; else if (await bakFileLoad10(txt)) { closePk72(); return } done() }); return false }
  if (k === 'svBak') { const i = +v_; if (Number.isInteger(i) && i >= 0 && i < BAK_N10 && await bakRestore10(slot, i)) { closePk72(); return false } done(); return false }
  if (k === 'svDmgDl') { let d = null; try { d = JSON.parse(lsGet10(pkKey10(slot) + '.damaged') || 'null') } catch (e) {} if (d && d.text) fileSave10('coaster-lab-damaged-' + slot + '-save.txt', String(d.text)); return false }
  if (k === 'svDmgDel') { if (await ask7('Delete the damaged save that was kept? This cannot be undone.', 'Delete it', 'Keep it', true)) { try { localStorage.removeItem(pkKey10(slot) + '.damaged') } catch (e) {} SAVE10.note = ''; } done(); return false }
  return false;
} }
{ const a0 = tyAct10; tyAct10 = function (a, v_) { if (a === 'svLoad') { const el = $ty10('tyDay'); if (el) el.hidden = true; const s_ = TY.slot; if (s_) tyOpen10(s_); return } return a0.apply(this, arguments) } }
Object.assign(DBG10, { saves: {
  state: () => ({ at: SAVE10.at, ok: SAVE10.ok, n: SAVE10.n, fails: SAVE10.fails, stale: SAVE10.stale, sid: SAVE10.sid, base: { ...SAVE10.base }, note: SAVE10.note, msg: SAVE10.msg || '', bakErr: SAVE10.bakErr, chip: (() => { const c = $ty10('tySaveW'); return c && !c.hidden ? c.textContent : '' })() }),
  list: slot => bakList10(slot || TY.slot).map(b => ({ i: b.i, day: b.day, why: b.why, name: b.name, things: b.things, bytes: b.data.length })), make: why => bakMake10(TY.slot, why || 'day'), rv: slot => rvGet10(slot || TY.slot),
  file: () => bakFileText10(), check: txt => { const r = bakFileCheck10(txt, TY.park); return r.why ? { why: r.why } : { ok: true, name: r.P.name, day: r.P.day, things: r.P.objs.length } }, put: (slot, P_) => parkSwap10(slot, cleanPark10(P_, slot === 'sandbox' ? 'sandbox' : 'career'), 'file'), html: () => savesHTML10()
} });
