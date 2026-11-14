// ---- 10.2 MY PARK — building, round two. Move anything you built (✥ Move, or G to grab it), undo your last builds (↶ Undo, or
// Ctrl+Z), entertainers in mascot suits who cheer up the longest queues, Swan Boats that float on a lake, four new
// stalls (Pizza Slice, Cotton Candy, a Balloon Stand whose balloons visitors carry round, and an ATM for visitors who
// run out of cash), and the Weekly Park Awards: every 7th evening the judges hand out trophies (and a few roasts).
const PB10 = { undo: [], undoing: false, mv: null, root: null, m: null, fly: [] };
SIM10.wageEnt = 14;
// ---- the catalogue
Object.assign(CAT10, {
  swans: { t: 'flat', n: 'Swan Boats', ic: '🦢', w: 3, d: 3, cost: 3200, exc: 30, int: 4, nau: 2, cap: 12, dur: 40, run: 8, lv: 2, model: 'swans10', col: 0xffffff, fare: 2, lake: 1 },
  pizza: { t: 'shop', n: 'Pizza Slice', ic: '🍕', w: 1, d: 1, cost: 1100, sells: 'food', price: 7, unit: 2.4, run: 6, lv: 2, model: 'pizza10', col: 0xe63946 },
  candy: { t: 'shop', n: 'Cotton Candy', ic: '🍬', w: 1, d: 1, cost: 850, sells: 'treat', price: 4, unit: .7, run: 4, lv: 1, model: 'candy10', col: 0xff8fd0 },
  balloons: { t: 'shop', n: 'Balloon Stand', ic: '🎈', w: 1, d: 1, cost: 800, sells: 'gift', price: 5, unit: 1.2, run: 4, lv: 2, model: 'balloon10', col: 0xffc233 },
  atm: { t: 'fac', n: 'ATM', ic: '🏧', w: 1, d: 1, cost: 1200, sells: 'cash', price: 2, unit: .4, run: 2, lv: 3, model: 'atm10', col: 0x2fd18b }
});
Object.assign(SHOP80, { pizza10: { n: 'Pizza', ic: '🍕' }, candy10: { n: 'Cotton candy', ic: '🍬' }, balloon10: { n: 'Balloons', ic: '🎈' }, atm10: { n: 'ATM', ic: '🏧' } });
const BALC10 = [0xff3d6b, 0xffc233, 0x36a7ff, 0x2fd18b, 0x9b6bff, 0xff7a3d, 0xff6fb5];
const ENTC10 = [0xff6fb5, 0x9b6bff, 0x36a7ff, 0xffc233, 0x2fd18b, 0xff7a3d];
const onLake10 = (i, j) => inG10(i, j) && !!TY.hgt && TY.hgt[tI10(i, j)] < 0;
// the Weekly Park Awards: trophies (rep + a cash prize) and roasts (rep down). t() tests the week, d() says why.
const AWARDS10 = [
  { id: 'golden', ic: '🏆', n: 'The Golden Coaster', rep: 3, cash: 500, t: S => S.best && S.bestScore >= 3.4, d: S => objName10(S.best) + ' was the best-loved ride in town' },
  { id: 'crowd', ic: '👥', n: 'Packed House', rep: 2, cash: 500, t: S => S.guests >= 1200, d: S => S.guests.toLocaleString('en-US') + ' visitors this week' },
  { id: 'happy', ic: '😁', n: 'Happiest Crowd', rep: 2, cash: 400, t: S => S.happy >= 68 && S.guests >= 40, d: S => 'Visitors went home ' + Math.round(S.happy) + '% happy on average' },
  { id: 'sparkle', ic: '✨', n: 'Spotless Sparkle Award', rep: 2, cash: 300, t: S => S.clean >= 90 && S.guests >= 40, d: () => 'Not a crumb on the paths. The judges checked twice.' },
  { id: 'pretty', ic: '🌸', n: 'Prettiest Park in Town', rep: 2, cash: 300, t: S => S.scen >= 55, d: () => 'The scenery made a judge cry (happy tears)' },
  { id: 'money', ic: '💰', n: 'Money Machine', rep: 1, cash: 0, t: S => S.profit >= 12000, d: S => money10(S.profit) + ' profit in seven days' },
  { id: 'balloon', ic: '🎈', n: 'Balloon Tycoon', rep: 1, cash: 200, t: S => S.wk.balloons >= 25, d: S => S.wk.balloons + ' balloons floating round the park' },
  { id: 'mascot', ic: '🤡', n: 'Funniest Mascot', rep: 1, cash: 200, t: S => S.wk.cheers >= 30, d: () => 'Your entertainers turned queues into a comedy show' },
  { id: 'trash', ic: '🗑', n: 'The Golden Trash Can', rep: -3, cash: 0, bad: 1, t: S => S.clean < 55, d: () => 'A judge found a sandwich older than the park' },
  { id: 'barf', ic: '🤢', n: 'Most Barf per Square Metre', rep: -2, cash: 0, bad: 1, t: S => S.wk.sick >= 12, d: S => S.wk.sick + ' visitors lost their lunch this week' },
  { id: 'grumpy', ic: '😤', n: 'Grumpiest Guests', rep: -2, cash: 0, bad: 1, t: S => S.happy < 45 && S.guests >= 20, d: () => 'Even the ducks looked annoyed' },
  { id: 'ghost', ic: '👻', n: 'Ghost Town Award', rep: -1, cash: 0, bad: 1, t: S => S.guests < 60, d: () => 'Only the ghosts came, and they left early' },
  { id: 'balloonlost', ic: '🎈', n: 'Sky Full of Balloons', rep: 0, cash: 0, bad: 1, t: S => S.wk.lost >= 10, d: S => S.wk.lost + ' balloons escaped on the wild rides' }
];
// the shop tray: a line for the ATM, and the Swan Boats say they need a lake
{ const t0 = trayHTML10; trayHTML10 = function () {
  let h = t0(); if (TY.ui.cat === 'shop') h = h.replace(/(data-v="atm"><i>[^<]*<\/i><b>[^<]*<\/b><small>)undefined/, '$1Cash for visitors who run low');
  if (TY.ui.cat === 'flat') h = h.replace(/(data-v="swans"><i>[^<]*<\/i><b>[^<]*<\/b><small>)/, '$1🌊 Floats on a lake · ');
  return h;
} }
// ---------------------------------------------------------------------------------------------------------------------
// 3D: toppers on the new stalls, and the Swan Boats (four swans circling a little lily island)
const TOP10 = {
  pizza10: K => { K.add(new THREE.CylinderGeometry(.95, .95, .14, 14, 1, false, 0, PI / 3.4), 0xf2b552, 0, 3.75, -.2, 1.25, -PI / 2 + .3, 0); for (const [x, y] of [[-.18, 3.55], [.12, 3.75], [-.05, 4.05]]) K.cyl(.1, .1, .05, 0xc62828, x, y, -.1, 10, 1.25 + PI / 2, 0, 0) },
  candy10: K => { K.add(new THREE.ConeGeometry(.22, .9, 10).rotateX(PI), 0xf7f2e8, 0, 3.75, -.3); for (const [x, y, z, r, c] of [[0, 4.4, -.3, .42, 0xff8fd0], [-.25, 4.25, -.2, .3, 0xffb3e1], [.27, 4.3, -.35, .3, 0xff8fd0], [0, 4.7, -.35, .28, 0xffb3e1]]) K.add(new THREE.SphereGeometry(r, 12, 9), c, x, y, z) },
  balloon10: K => { BALC10.slice(0, 5).forEach((c, k) => { const a = k / 5 * PI * 2, x = Math.cos(a) * .45, z = Math.sin(a) * .3 - .3, y = 4.15 + (k % 2) * .35; K.add(new THREE.SphereGeometry(.3, 12, 9).scale(1, 1.18, 1), c, x, y, z); K.cyl(.012, .012, y - 3.2, 0xf2f2f2, x * .5, 3.2 + (y - 3.2) / 2 - .3, z * .5 - .15, 4) }) },
  atm10: K => { K.cyl(.55, .55, .12, 0xffc233, 0, 4, -.3, 20, PI / 2, 0, 0); K.cyl(.42, .42, .14, 0xf5d36b, 0, 4, -.3, 20, PI / 2, 0, 0); for (let k = 0; k < 4; k++) K.cyl(.22, .22, .07, 0xffc233, .75, 3.25 + k * .08, -.3, 14) }
};
function swanBoat10(seat) {
  const K = new Kit10(), W = 0xfafafa;
  K.add(new THREE.SphereGeometry(.62, 14, 10).scale(1, .55, 1.55), W, 0, .18, 0);
  for (const s_ of [-1, 1]) K.add(new THREE.SphereGeometry(.4, 10, 8).scale(.35, .55, 1.1), 0xf0f0f0, s_ * .5, .42, -.15, .3 * s_, 0, -.35 * s_);
  K.box(.75, .12, .8, seat, 0, .42, -.05); K.box(.75, .4, .1, seat, 0, .6, -.45);
  K.cyl(.08, .11, .85, W, 0, .75, .82, 8, -.35, 0, 0); K.cyl(.07, .08, .4, W, 0, 1.2, .98, 8, .7, 0, 0);
  K.add(new THREE.SphereGeometry(.14, 10, 8), W, 0, 1.3, 1.1); K.add(new THREE.ConeGeometry(.06, .2, 8).rotateX(PI / 2), 0xff8a1f, 0, 1.27, 1.3);
  for (const s_ of [-1, 1]) K.add(new THREE.SphereGeometry(.03, 6, 5), 0x111111, s_ * .09, 1.34, 1.18);
  return K.mesh();
}
{ const b0 = objBuild10; objBuild10 = function (o) {
  const g = b0(o), inf = objInfo10(o); if (!inf) return g;
  safe10('topper', () => {
    if (inf.model === 'swans10') {
      const pad = g.children.find(c => c.isMesh); if (pad) { g.remove(pad); pad.geometry.dispose() }
      const ring = new THREE.Group(); ring.position.y = TER10.water - .05; g.add(ring);
      const K = new Kit10(); K.cyl(.9, 1.05, .3, 0x5a9e4b, 0, .05, 0, 14); K.cyl(.05, .05, 2.4, 0xf2f2f2, 0, 1.3, 0, 6); K.add(new THREE.ConeGeometry(.35, .5, 3).rotateZ(-PI / 2), 0xff6fb5, .28, 2.3, 0);
      for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + .4; K.cyl(.3, .3, .03, 0x3f8f3a, Math.cos(a) * 1.7, .02, Math.sin(a) * 1.7, 10) } ring.add(K.mesh());
      const boats = []; ['#ff6fb5', '#36a7ff', '#ffc233', '#9b6bff'].forEach((c, k) => { const b = swanBoat10(parseInt(c.slice(1), 16)), a = k / 4 * PI * 2; b.position.set(Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4); b.rotation.y = -a; ring.add(b); boats.push(b) });
      (o.rt.anim || (o.rt.anim = [])).push(t => { ring.rotation.y = t * .16; boats.forEach((b, k) => { b.position.y = Math.sin(TY.t * 1.7 + k * 1.3) * .05; b.rotation.z = Math.sin(TY.t * 1.3 + k) * .04 }) });
    } else if (TOP10[inf.model]) { const K = new Kit10(); TOP10[inf.model](K); const m = K.mesh(); if (m) g.add(m) }
  });
  return g;
} }
// ---------------------------------------------------------------------------------------------------------------------
// Swan Boats only go on water: every tile under them has to be lake, and the ground under them is never levelled
{ const f0 = fitWhy10; fitWhy10 = function (fp, o, loading) {
  const inf = objInfo10(o); if (!inf || !inf.lake) return f0(fp, o, loading);
  let w = f0(fp, o, loading); if (/in the lake/.test(w)) w = ''; if (w || loading) return w;
  for (const [i, j] of fp.solid) if (!onLake10(i, j)) return 'Swan Boats float: put them on a lake (dig one with ⛰ Terrain)';
  return '';
} }
{ const e0 = earthPlan10; earthPlan10 = function (o) { const inf = objInfo10(o); return inf && inf.lake ? null : e0(o) } }
// the placement preview: lake tiles are green for Swan Boats, and a move shows what it costs (only earthworks)
{ const s0 = ghostSet10; ghostSet10 = function (i, j) {
  s0(i, j); const T_ = TY.tool, G_ = TY.ghost; if (!T_ || T_.k !== 'place' || !G_) return;
  const C = CAT10[T_.key];
  if (C && C.lake && TY.ghostM) { const M_ = TY.ghostM, m = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), s = V(), c = new THREE.Color();
    for (let n = 0; n < M_.count; n++) { M_.getMatrixAt(n, m); m.decompose(p, q, s); const a = xT10(p.x), b = zT10(p.z), k = inG10(a, b) ? tI10(a, b) : -1; const ok = k >= 0 && TY.own[k] && !TY.occ[k] && !TY.path[k] && !TY.air[k] && onLake10(a, b); M_.setColorAt(n, c.setHex(ok ? 0x2fe38a : 0xff4a4a)) }
    if (M_.instanceColor) M_.instanceColor.needsUpdate = true;
    const o = newObj10(T_.key, G_.ax, G_.az, T_.r), fp = footprint10(o), w = fp ? fitWhy10(fp, o) : ''; if (w) G_.why = w }
  if (T_.move) { const o = TY.objById.get(T_.move); if (!o) return; const tmp = { ...o, x: G_.ax, z: G_.az, r: T_.r }, ep = earthPlan10(tmp); G_.cost = ep ? ep.cost : 0; G_.name = '✥ Move ' + objName10(o); if (G_.why === 'Not enough money' || /^Unlocks/.test(G_.why)) G_.why = canPay10(G_.cost) ? '' : 'Not enough money to level the ground there' }
} }
{ const p0 = placeBar10; placeBar10 = function () { p0(); const T_ = TY.tool, el = $ty10('tyPlace'); if (!T_ || !T_.move || !el || el.hidden) return; const b = el.querySelector('[data-ty="build"]'); if (b && !/Put it here/.test(b.textContent)) b.textContent = '✥ Put it here'; const s_ = el.querySelector('.pMsg b'); if (s_ && TY.ghost && !TY.ghost.cost) s_.textContent = TY.ghost.name + ' · free' } }
// ---------------------------------------------------------------------------------------------------------------------
// ✥ MOVE. The thing is lifted off the grid (nobody can use it meanwhile), the placement preview follows the finger, and
// it is put down again keeping everything: its name, prices, upgrades, colours and takings. Cancel puts it back.
function moveStart10(o) {
  if (!canEdit10() || !o || PB10.mv || !TY.objById.has(o.id)) return false; const fp = footprint10(o), inf = objInfo10(o); if (!fp || !inf) return false;
  rideClear10(o); stamp10(o, fp, 0); o.mv10 = true; PB10.mv = { id: o.id, x: o.x, z: o.z, r: o.r };
  if (o.rt) { o.rt.linked = false; o.rt.entry = []; if (o.rt.g) o.rt.g.visible = false } if (inf.t === 'deco') TY.decoDirty = .01;
  TY.pathVer++; toolSet10({ k: 'place', key: o.k, r: o.r, move: o.id });
  toast10('✥ Moving ' + objName10(o) + (mobile ? ': tap where it should go' : ': click where it should go · R turns it · Esc puts it back'), 'move'); return true;
}
// put o (already lifted off the grid) at a new anchor; earthworks on a hill are paid like building. '' when it worked.
function moveTo10(o, ax, az, r, free) {
  const old = { x: o.x, z: o.z, r: o.r }; o.x = ax; o.z = az; o.r = r; const fp = footprint10(o), why = fp ? fitWhy10(fp, o) : 'That cannot go there';
  if (why) { Object.assign(o, old); return why }
  const ep = earthPlan10(o); if (ep && !free && !canPay10(ep.cost)) { Object.assign(o, old); return 'Not enough money: ' + money10(ep.cost) + ' to level the ground' }
  if (ep) { if (!free) pay10('build', ep.cost); for (const [k, to] of ep.plan) TY.hgt[k] = to; terraStore10(); safe10('earthworks', () => terraRefresh10(true)) }
  stamp10(o, fp, o.id); return '';
}
function moveEnd10(o, rebuild) {
  o.mv10 = false; const inf = objInfo10(o); TY.pathVer++;
  if (inf.t === 'deco') { beauty10(); TY.decoDirty = .01 } else if (rebuild || !o.rt || !o.rt.g) objAdd3d10(o); else o.rt.g.visible = true;
  if (o.rt && o.rt.g) o.rt.g.visible = true; linkAll10();
}
function moveDrop10(ax, az, r) {
  const M = PB10.mv, o = M && TY.objById.get(M.id); if (!o) { PB10.mv = null; toolSet10(null); return false }
  const w = moveTo10(o, ax, az, r); if (w) { toast10('⚠ ' + w, 'nofit'); return false }
  PB10.mv = null; moveEnd10(o, true); undoPush10({ t: 'move', id: o.id, from: { x: M.x, z: M.z, r: M.r }, n: objName10(o) });
  toolSet10(null); TY.sel = { id: o.id }; TY.ui.cardTab = 'main'; try { sfx('chime') } catch (e) {}
  const inf = objInfo10(o); if (inf.t !== 'deco' && !o.rt.linked) toast10('🛤 ' + objName10(o) + ' needs a path beside it in its new spot', 'needpath', true); tyUi10(); return true;
}
function moveCancel10() { const M = PB10.mv; PB10.mv = null; const o = M && TY.objById.get(M.id); if (!o) return; o.x = M.x; o.z = M.z; o.r = M.r; const fp = footprint10(o); if (fp) stamp10(o, fp, o.id); moveEnd10(o, false) }
{ const t0 = toolSet10; toolSet10 = function (t) { if (PB10.mv && !(t && t.move === PB10.mv.id)) moveCancel10(); return t0(t) } }
{ const b0 = ghostBuild10; ghostBuild10 = function () { const T_ = TY.tool; if (T_ && T_.move && TY.ghost) return moveDrop10(TY.ghost.ax, TY.ghost.az, T_.r); return b0() } }
{ const l0 = linkObj10; linkObj10 = function (o) { if (o && o.mv10 && o.rt) { o.rt.linked = false; o.rt.entry = []; return } return l0(o) } }
{ const d0 = decoRebuild10; decoRebuild10 = function () { const P_ = TY.park, all = P_.objs; if (!all.some(o => o.mv10)) return d0(); P_.objs = all.filter(o => !o.mv10); try { d0() } finally { P_.objs = all } } }
// ---------------------------------------------------------------------------------------------------------------------
// ↶ UNDO: building (full refund for a couple of minutes, then it is a normal sale), removing, paths (a whole drag at
// once) and moves. The list lives only while the park is open.
const UNDO_FULL10 = 120000;// ms: a build undone within this gets all its money back
function undoPush10(e) { if (PB10.undoing) return; e.at = performance.now(); PB10.undo.push(e); if (PB10.undo.length > 40) PB10.undo.shift(); undoBtn10() }
const objSnap10 = o => { const c = {}; for (const k in o) if (k !== 'rt' && k !== 'mv10') c[k] = o[k]; return JSON.parse(JSON.stringify(c)) };
{ const b0 = tyBuild10; tyBuild10 = function (key, i, j, r, free) {
  if (free || PB10.undoing || !canEdit10()) return b0(key, i, j, r, free);
  const P_ = TY.park, e0 = P_.tot.exp, ep = safe10('undo plan', () => earthPlan10(newObj10(key, i, j, r))), hs = ep ? ep.plan.map(([k]) => [k, TY.hgt[k]]) : null;
  const res = b0(key, i, j, r, free); if (res && res.ok) undoPush10({ t: 'build', id: res.o.id, paid: Math.max(0, P_.tot.exp - e0), hs, n: objName10(res.o) }); return res;
} }
{ const r0 = tyRemove10; tyRemove10 = function (o, quiet) {
  if (PB10.undoing || !canEdit10() || !o) return r0(o, quiet);
  const snap = objSnap10(o), i0 = TY.park.tot.inc, ok = r0(o, quiet); if (ok) undoPush10({ t: 'del', snap, got: Math.max(0, TY.park.tot.inc - i0), n: objName10(o) }); return ok;
} }
{ const p0 = tyPath10; tyPath10 = function (i, j, on, style) {
  const T_ = TY.tool; if (PB10.undoing || !canEdit10() || !inG10(i, j) || (T_ && T_.k === 'terra')) return p0(i, j, on, style);
  const k = tI10(i, j), before = TY.path[k], e0 = TY.park.tot.exp, w = p0(i, j, on, style);
  if (!w && TY.path[k] !== before) { const now = performance.now(), top = PB10.undo[PB10.undo.length - 1], paid = Math.max(0, TY.park.tot.exp - e0);
    if (top && top.t === 'path' && now - top.last < 1500) { top.tiles.push([k, before, paid]); top.last = now } else undoPush10({ t: 'path', tiles: [[k, before, paid]], last: now }) }
  return w;
} }
function undo10() {
  if (!canEdit10()) return false; if (PB10.mv) { toolSet10(null); toast10('↶ Move cancelled', 'undo'); return true }
  const e = PB10.undo.pop(); if (!e) { undoBtn10(); toast10('Nothing to undo', 'undo'); return false }
  const P_ = TY.park; let msg = ''; PB10.undoing = true;
  try {
    if (e.t === 'build') {
      const o = TY.objById.get(e.id); if (!o) msg = e.n + ' is already gone';
      else { const full = performance.now() - e.at < UNDO_FULL10, i0 = P_.tot.inc; tyRemove10(o); const got = P_.tot.inc - i0; if (full && e.paid > got) earn10('sale', e.paid - got);
        if (full && e.hs) { for (const [k, h] of e.hs) TY.hgt[k] = h; terraStore10(); safe10('earthworks', () => terraRefresh10(true)) }
        msg = full ? 'Took back ' + e.n + ' (' + money10(e.paid) + ' refunded)' : 'Sold ' + e.n + ' (it was built a while ago, so half the price comes back)' }
    } else if (e.t === 'del') {
      const o = JSON.parse(JSON.stringify(e.snap)); if (TY.objById.has(o.id)) o.id = P_.nextId++; const fp = footprint10(o), w = fp ? fitWhy10(fp, o) : 'x';
      if (w) msg = '⚠ ' + e.n + ' cannot go back: ' + w; else if (!canPay10(e.got)) msg = '⚠ Not enough money to buy ' + e.n + ' back (' + money10(e.got) + ')';
      else { pay10('build', e.got); P_.objs.push(o); stamp10(o, fp, o.id); TY.objById.set(o.id, o); TY.pathVer++; objAdd3d10(o); linkAll10(); if (objInfo10(o).t === 'deco') beauty10(); msg = 'Put ' + e.n + ' back' + (e.got ? ' (' + money10(e.got) + ')' : '') }
    } else if (e.t === 'path') {
      let n = 0; for (let q = e.tiles.length - 1; q >= 0; q--) { const [k, before, paid] = e.tiles[q], i = k % GW10, j = (k - i) / GW10;
        if (before) { if (TY.occ[k]) continue; P_.paths[k] = before - 1; TY.path[k] = before } else { if (i === GATE_I10 && j >= GATE_J10 - 1) continue; delete P_.paths[k]; TY.path[k] = 0; if (paid) earn10('sale', paid) } n++ }
      TY.pathVer++; TY.pathDirty = true; linkAll10(); msg = 'Undid ' + n + ' path tile' + (n === 1 ? '' : 's');
    } else if (e.t === 'move') {
      const o = TY.objById.get(e.id); if (!o) msg = e.n + ' is already gone';
      else { const fp0 = footprint10(o); rideClear10(o); stamp10(o, fp0, 0); o.mv10 = true; const w = moveTo10(o, e.from.x, e.from.z, e.from.r); if (w) { stamp10(o, footprint10(o), o.id); o.mv10 = false; msg = '⚠ ' + e.n + ' cannot go back: ' + w } else { moveEnd10(o, true); msg = 'Moved ' + e.n + ' back' } }
    }
  } finally { PB10.undoing = false }
  undoBtn10(); toast10('↶ ' + msg, 'undo'); try { sfx('click') } catch (er) {} savePark10(); tyUi10(); return true;
}
function undoBtn10() {
  // phones held upright have no room left in the build bar, so Undo joins the side buttons there
  const narrow = innerWidth < 520, bar = $ty10(narrow ? 'tySide' : 'tyBar'); if (!bar) return; let b = $ty10('ty10').querySelector('[data-ty="undo"]');
  if (!b) { b = document.createElement('button'); b.className = 'tyB tyUndo10'; b.dataset.ty = 'undo'; b.innerHTML = '<i>↶</i><span>Undo</span>' }
  if (b.parentNode !== bar) bar.appendChild(b);
  const top = PB10.undo[PB10.undo.length - 1]; b.disabled = !top && !PB10.mv; b.title = PB10.mv ? 'Cancel the move' : top ? 'Undo: ' + (top.t === 'build' ? 'build ' + top.n : top.t === 'del' ? 'remove ' + top.n : top.t === 'move' ? 'move ' + top.n : 'path') + (mobile ? '' : ' (Ctrl+Z)') : 'Nothing to undo';
}
{ const u0 = tyUi10; tyUi10 = function () { const r = u0.apply(this, arguments); safe10('undo button', undoBtn10); return r } }
// the card of a selected thing gets a ✥ Move button next to Sell / Remove
{ const c0 = cardHTML10; cardHTML10 = function () { const h = c0.apply(this, arguments); return canEdit10() && !PB10.mv ? h.replace(/<button class="btn" data-ty="sell">/, '<button class="btn" data-ty="move">✥ Move</button>$&') : h } }
{ const a0 = tyAct10; tyAct10 = async function (a, v_) {
  if (a === 'undo') { undo10(); return }
  if (a === 'move') { const o = TY.sel && TY.sel.id ? TY.objById.get(TY.sel.id) : null; if (o) moveStart10(o); return }
  return a0(a, v_);
} }
addEventListener('keydown', e => {
  if (!TY.on || isTyping72() || UI72.pk || !$('#dlg7').hidden || TY.visit) return; const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) { e.preventDefault(); undo10() }
  else if (k === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey && !TY.tool && TY.sel && TY.sel.id) moveStart10(TY.objById.get(TY.sel.id));
});
// a park opened or closed: nothing half-moved, and a fresh undo list
{ const e0 = tyEnter10; tyEnter10 = function () { PB10.mv = null; PB10.undo.length = 0; PB10.fly.length = 0; return e0.apply(this, arguments) } }
{ const x0 = tyExit10; tyExit10 = function () { if (PB10.mv && TY.on) { const t = TY.tool; TY.tool = null; moveCancel10(); TY.tool = t } return x0.apply(this, arguments) } }
// ---------------------------------------------------------------------------------------------------------------------
// ENTERTAINERS: staff in mascot suits. Each walks to the longest queue nobody is entertaining yet and performs there:
// the people waiting lose patience much more slowly and cheer up; visitors they pass on the path smile too.
const ENTSAY10 = ['😂', '🤣', '🥳', '👏', '🤩'];
function entSync10() {
  const P_ = TY.park, want = (P_.staff && P_.staff.ent) | 0; let have = TY.staff.filter(s_ => s_.k === 'ent');
  while (have.length > want) { const s_ = have.pop(); if (s_.job && s_.job.rt && s_.job.rt.ent10 === s_) s_.job.rt.ent10 = null; TY.staff.splice(TY.staff.indexOf(s_), 1) }
  while (have.length < want) { const s_ = { k: 'ent', x: tX10(GATE_I10) + rnd7(-1, 1), z: tZ10(GATE_J10 - 1) + rnd7(-1, 1), ti: tI10(GATE_I10, GATE_J10 - 1), tx: 0, tz: 0, st: 'idle', t: Math.random(), job: null, yaw: 0, bob: 0, off: rnd7(-.8, .8), goal: null, c: ENTC10[have.length % ENTC10.length], ph: Math.random() * 6, cheer: 0 }; s_.tx = s_.x; s_.tz = s_.z; TY.staff.push(s_); have.push(s_) }
}
{ const s0 = staffSync10; staffSync10 = function () { s0(); entSync10() } }
function entStep10(dt) {
  const P_ = TY.park, ents = TY.staff.filter(s_ => s_.k === 'ent'); if (!ents.length) return;
  if (parkOpen10()) pay10('wages', ents.length * SIM10.wageEnt * dt * SIM10.minPerSec / 60);
  for (const s_ of ents) {
    s_.t -= dt; s_.cheer -= dt;
    if (s_.st === 'work') {
      const o = s_.job, R = o && o.rt;
      if (!R || !rideOpen10(o) || s_.t <= 0 || !R.q.length) { if (R && R.ent10 === s_) R.ent10 = null; s_.job = null; s_.st = 'idle'; s_.t = 1 + Math.random() * 2; continue }
      s_.yaw += dt * 2.4;
      for (const g of R.q) { g.wq = Math.max(0, g.wq - dt * .6); g.happy = Math.min(100, g.happy + .07 * dt) }
      if (s_.cheer <= 0) { s_.cheer = 2.2 + Math.random() * 2; const g = R.q[Math.floor(Math.random() * R.q.length)]; if (g) say10(g, ENTSAY10[rndi10(ENTSAY10.length)], 'The mascot at ' + objName10(o) + ' made the wait fun'); wk10().cheers++ }
      continue;
    }
    if (!s_.job && s_.t <= 0) {
      let best = null, bs = 2.5; for (const o of P_.objs) { const R = o.rt; if (!R || !R.slots || !R.linked || o.mv10 || !rideOpen10(o) || R.q.length < 3 || (R.ent10 && R.ent10 !== s_)) continue; const w = R.xf || objWorld10(o), sc = R.q.length - Math.hypot(w.x - s_.x, w.z - s_.z) / 30; if (sc > bs) { bs = sc; best = o } }
      if (best) { s_.job = best; best.rt.ent10 = s_; s_.goal = best.rt.gateTile }
      else { const gate = field10('gate', [gateT10()]), PT = pathTiles10(); for (let k = 0; k < 4 && PT.length; k++) { const t = PT[Math.floor(Math.random() * PT.length)]; if (gate[t] >= 0) { s_.goal = t; break } } s_.t = 5 + Math.random() * 4 }
    }
    const dx = s_.tx - s_.x, dz = s_.tz - s_.z, d = Math.hypot(dx, dz), stp = 1.7 * dt;
    if (d > stp) { s_.x += dx / d * stp; s_.z += dz / d * stp; s_.yaw = Math.atan2(dx, dz); s_.bob += dt * 9; continue } s_.x = s_.tx; s_.z = s_.tz;
    if (s_.cheer <= 0) { s_.cheer = 1.2; for (const g of TY.guests) if (!g.hide && Math.abs(g.x - s_.x) < 4 && Math.abs(g.z - s_.z) < 4) { g.happy = Math.min(100, g.happy + .8); if (Math.random() < .04) say10(g, '👋') } }
    if (!TY.path[s_.ti]) { const g = { x: s_.x, z: s_.z }; gRescue10(g); if (g.ti != null) { s_.ti = g.ti; s_.tx = g.tx; s_.tz = g.tz } continue }
    if (s_.goal == null || !TY.path[s_.goal]) { s_.goal = null; if (s_.job) { if (s_.job.rt && s_.job.rt.ent10 === s_) s_.job.rt.ent10 = null; s_.job = null } continue }
    const f = field10('t' + s_.goal, [s_.goal]), dd = f[s_.ti];
    if (dd < 0) { s_.goal = null; if (s_.job) { if (s_.job.rt && s_.job.rt.ent10 === s_) s_.job.rt.ent10 = null; s_.job = null } continue }
    if (dd === 0) { s_.goal = null; if (s_.job) { s_.st = 'work'; s_.t = 20 + Math.random() * 10 } continue }
    const i = s_.ti % GW10, j = (s_.ti - i) / GW10; for (const [ax, az] of NB10) { const a = i + ax, b = j + az; if (inG10(a, b) && f[tI10(a, b)] === dd - 1) { s_.ti = tI10(a, b); s_.tx = tX10(a) + s_.off; s_.tz = tZ10(b) + s_.off; break } }
  }
}
// the 10.0 staff loop only knows janitors and mechanics, so it never sees the entertainers
{ const s0 = staffStep10; staffStep10 = function (dt) {
  const all = TY.staff; if (all.some(s_ => s_.k === 'ent')) { TY.staff = all.filter(s_ => s_.k !== 'ent'); try { s0(dt) } finally { TY.staff = all } } else s0(dt);
  entStep10(dt); safe10('balloons', () => balloonStep10(dt));
} }
// ---------------------------------------------------------------------------------------------------------------------
// VISITORS: the ATM, balloons (carried round; a wild coaster can blow one away), and the week's tallies
const wk10 = () => { const P_ = TY.park; return P_.wk10 || (P_.wk10 = { sick: 0, balloons: 0, cheers: 0, atm: 0, lost: 0 }) };
function shopHere10(g, kind) { for (const q of TY.park.objs) { const C = CAT10[q.k]; if (C && q.rt && !q.mv10 && C.sells === kind && q.rt.entry.includes(g.ti) && !(g.skip[q.id] > g.t)) return q } return null }
{ const d0 = gDecide10; gDecide10 = function (g) {
  if (!g.leave && !g.atm && g.cash < 9 && g.happy > 30 && g.t < g.stay - 20 && parkOpen10() && gKind10(g, 'cash')) return;
  return d0(g);
} }
function atmUse10(g) {
  const P_ = TY.park, o = g.atm ? null : shopHere10(g, 'cash'); g.atm = 1; g.goal = null; if (!o) { g.st = 'idle'; g.useT = .4; return }
  const C = CAT10[o.k], fee = o.price >= 0 ? o.price : C.price, w = o.rt.xf || objWorld10(o); g.yaw = Math.atan2(w.x - g.x, w.z - g.z);
  if (fee > 4.5) { say10(g, '💸', 'The ATM fee is a rip-off'); g.happy -= 3; g.st = 'idle'; g.useT = .6; return }
  const amt = 20 + 10 * rndi10(4); g.cash += amt - fee; if (fee > 0) earn10('shops', fee); pay10('stock', C.unit); o.st.n++; o.st.inc += fee; o.rt.sold++; P_.tot.sales++; wk10().atm++;
  g.st = 'use'; g.useT = 2.4; g.stay += 45; say10(g, '🏧', 'Got more cash from the ATM');
}
{ const a0 = gArrive10; gArrive10 = function (g) {
  const G_ = g.goal; if (G_ && G_.k === 'cash') return atmUse10(g);
  if (G_ && G_.k === 'gift') { const o = shopHere10(g, 'gift'), c0 = g.cash, r = a0(g); if (o && o.k === 'balloons' && g.cash < c0 && !g.balloon) { g.balloon = BALC10[rndi10(BALC10.length)]; wk10().balloons++; say10(g, '🎈', 'I got a balloon!') } return r }
  return a0(g);
} }
// riding something wild with a balloon: it may fly away
function balloonStep10(dt) {
  for (const g of TY.guests) {
    if (g.st !== 'ride') { if (g.blChk) { g.blChk = 0; if (g.lostB) { say10(g, '😭', 'I lost my balloon on ' + g.lostB); g.happy = Math.max(0, g.happy - 4); g.lostB = 0 } } continue }
    if (!g.balloon || g.blChk) continue; g.blChk = 1; const o = g.ro, inf = o && objInfo10(o);
    if (inf && inf.int > 45 && Math.random() < .35) { PB10.fly.push({ x: g.x, y: (g.y || 0) + 2, z: g.z, c: g.balloon, t: 0 }); g.balloon = 0; g.lostB = objName10(o); wk10().lost++ }
  }
  for (let k = PB10.fly.length - 1; k >= 0; k--) { const f = PB10.fly[k]; f.t += dt; f.y += 1.6 * dt; f.x += Math.sin(f.t * 1.3) * .4 * dt; if (f.t > 9) PB10.fly.splice(k, 1) }
}
{ const s0 = say10; say10 = function (g, e, th) { if (th === 'I was sick' && TY.park) wk10().sick++; return s0(g, e, th) } }
// ---------------------------------------------------------------------------------------------------------------------
// drawing: mascots (round body, big head with ears, googly eyes) and balloons on strings
function pbMeshes10() {
  if (PB10.m && PB10.root === TY.root) return PB10.m; const R = TY.root; if (!R) return null; PB10.root = R;
  const mk = (geo, cap, mat) => { const o = new THREE.InstancedMesh(geo, mat || new THREE.MeshStandardMaterial({ roughness: .7 }), cap); o.count = 0; o.castShadow = true; o.frustumCulled = false; R.add(o); return o };
  const head = mergeGeo([[new THREE.SphereGeometry(.27, 14, 10), new THREE.Matrix4().makeTranslation(0, 1.2, 0), false], [new THREE.SphereGeometry(.1, 8, 6), new THREE.Matrix4().makeTranslation(-.19, 1.44, 0), false], [new THREE.SphereGeometry(.1, 8, 6), new THREE.Matrix4().makeTranslation(.19, 1.44, 0), false]]);
  const eyes = mergeGeo([[new THREE.SphereGeometry(.075, 8, 6), new THREE.Matrix4().makeTranslation(-.09, 1.25, .21), false], [new THREE.SphereGeometry(.075, 8, 6), new THREE.Matrix4().makeTranslation(.09, 1.25, .21), false]]);
  const pup = mergeGeo([[new THREE.SphereGeometry(.035, 6, 5), new THREE.Matrix4().makeTranslation(-.09, 1.25, .28), false], [new THREE.SphereGeometry(.035, 6, 5), new THREE.Matrix4().makeTranslation(.09, 1.25, .28), false], [new THREE.SphereGeometry(.05, 6, 5), new THREE.Matrix4().makeTranslation(0, 1.14, .26), false]]);
  const feet = mergeGeo([[new THREE.BoxGeometry(.14, .1, .24), new THREE.Matrix4().makeTranslation(-.1, .05, .04), false], [new THREE.BoxGeometry(.14, .1, .24), new THREE.Matrix4().makeTranslation(.1, .05, .04), false]]);
  PB10.m = { body: mk(new THREE.CapsuleGeometry(.27, .34, 4, 12).translate(0, .53, 0), 16), head: mk(head, 16), eyes: mk(eyes, 16, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4 })), pup: mk(pup, 16, new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: .3 })), feet: mk(feet, 16, new THREE.MeshStandardMaterial({ color: 0x2b3441, roughness: .6 })),
    bal: mk(new THREE.SphereGeometry(.3, 12, 9).scale(1, 1.18, 1), 320, new THREE.MeshStandardMaterial({ roughness: .25, metalness: .05 })), str: mk(new THREE.CylinderGeometry(.008, .008, 1, 3).translate(0, .5, 0), 320, new THREE.MeshBasicMaterial({ color: 0xeeeeee })) };
  PB10.m.str.castShadow = false; return PB10.m;
}
const _pbm10 = new THREE.Matrix4(), _pbq10 = new THREE.Quaternion(), _pbv10 = V(), _pbs10 = V(1, 1, 1), _pbc10 = new THREE.Color();
function pbDraw10(dt) {
  const M_ = pbMeshes10(); if (!M_) return; let n = 0, b = 0; const any = TY.terra && TY.terra.any;
  for (const s_ of TY.staff) {
    if (s_.k !== 'ent' || n >= 16) continue; const work = s_.st === 'work', hop = work ? Math.abs(Math.sin(TY.t * 6 + s_.ph)) * .32 : Math.abs(Math.sin(s_.bob)) * .06;
    _pbq10.setFromAxisAngle(Yax, s_.yaw); _pbv10.set(s_.x, hop + (any ? walkY10(s_.x, s_.z) : 0), s_.z); _pbs10.set(1.15, 1.15, 1.15); _pbm10.compose(_pbv10, _pbq10, _pbs10);
    for (const k of ['body', 'head', 'eyes', 'pup', 'feet']) M_[k].setMatrixAt(n, _pbm10); M_.body.setColorAt(n, _pbc10.setHex(s_.c)); M_.head.setColorAt(n, _pbc10.setHex(s_.c)); n++;
  }
  _pbs10.set(1, 1, 1);
  for (const g of TY.guests) {
    if (!g.balloon || g.hide || b >= 320) continue; const c = Math.cos(g.yaw), s = Math.sin(g.yaw), ks = g.kid ? .68 : 1, hx = g.x + c * .22 * ks, hz = g.z - s * .22 * ks, hy = (g.y || 0) + .72 * ks, sw = Math.sin(TY.t * 1.6 + g.id) * .12, top = 1.15;
    _pbq10.identity(); _pbv10.set(hx, hy, hz); _pbs10.set(1, top, 1); _pbm10.compose(_pbv10, _pbq10, _pbs10); M_.str.setMatrixAt(b, _pbm10); _pbs10.set(1, 1, 1);
    _pbv10.set(hx + sw * .3, hy + top + .32, hz + sw * .2); _pbm10.compose(_pbv10, _pbq10, _pbs10); M_.bal.setMatrixAt(b, _pbm10); M_.bal.setColorAt(b, _pbc10.setHex(g.balloon)); b++;
  }
  for (const f of PB10.fly) { if (b >= 320) break; _pbq10.identity(); _pbs10.set(1, 1.15, 1); _pbv10.set(f.x, f.y - 1.1, f.z); _pbm10.compose(_pbv10, _pbq10, _pbs10); M_.str.setMatrixAt(b, _pbm10); _pbs10.set(1, 1, 1); _pbv10.set(f.x, f.y, f.z); _pbm10.compose(_pbv10, _pbq10, _pbs10); M_.bal.setMatrixAt(b, _pbm10); M_.bal.setColorAt(b, _pbc10.setHex(f.c)); b++ }
  for (const [k, cnt] of [['body', n], ['head', n], ['eyes', n], ['pup', n], ['feet', n], ['bal', b], ['str', b]]) { const o = M_[k]; o.count = cnt; o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true }
}
{ const p0 = peopleDraw10; peopleDraw10 = function (dt) {
  const all = TY.staff; if (all.some(s_ => s_.k === 'ent')) { TY.staff = all.filter(s_ => s_.k !== 'ent'); try { p0(dt) } finally { TY.staff = all } } else p0(dt);
  safe10('mascots', () => pbDraw10(dt));
} }
// ---------------------------------------------------------------------------------------------------------------------
// the Park Office: entertainers on the Staff tab, a trophy cabinet on Goals
{ const o0 = officeHTML10; officeHTML10 = function (tab) {
  let h = o0(tab); const P_ = TY.park; if (!P_ || TY.visit) return h;
  if (tab === 'staff') {
    const n = (P_.staff.ent | 0), ed = canEdit10(), wOld = money10((P_.staff.jan * SIM10.wageJan + P_.staff.mech * SIM10.wageMech) * 12), wNew = money10((P_.staff.jan * SIM10.wageJan + P_.staff.mech * SIM10.wageMech + n * SIM10.wageEnt) * 12);
    h = h.replace('<div class="tyGrid">', pkStep10('ent', '🤡 ' + n + ' entertainer' + (n === 1 ? '' : 's'), 'Mascots who cheer up the longest queues · $' + SIM10.wageEnt + ' a park hour each', ed) + '<div class="tyGrid">').replace('<span>Wages a day<b>' + wOld, '<span>Wages a day<b>' + wNew).replace('</p>', ' Entertainers wear big mascot suits and head for the longest queue.</p>');
  }
  if (tab === 'goals') { const aw = P_.aw10; if (aw && aw.n) { const cab = AWARDS10.filter(a => aw.won[a.id]).map(a => `<span class="tyTro10${a.bad ? ' bad' : ''}" title="${html10(a.n)}">${a.ic}<b>${html10(a.n)}</b><small>×${aw.won[a.id]}</small></span>`).join(''); h = h.replace('<div class="ty10pk">', `<div class="ty10pk"><h3>🏆 Trophy cabinet · ${aw.n} week${aw.n === 1 ? '' : 's'} judged</h3><div class="tyCab10">${cab || '<small>No trophies yet. The judges come every 7th evening.</small>'}</div>`) } else h = h.replace('<div class="ty10pk">', '<div class="ty10pk"><p class="tyNote">🏆 The award judges visit every 7th evening. Keep the park clean, pretty and fun to win trophies.</p>') }
  return h;
} }
{ const T = PANELS72.ty10, a0 = T.act; T.act = async function (a, t) { const [k, v_] = a.split(':'); if (k === 'ent' && canEdit10()) { const P_ = TY.park; P_.staff.ent = clamp((P_.staff.ent | 0) + (+v_ || 0), 0, 12); staffSync10(); return a0.call(this, 'noop10:0', t) } return a0.call(this, a, t) } }
// saving: entertainers, the week's tallies and the trophy cabinet
{ const c0 = cleanPark10; cleanPark10 = function (o, mode) {
  const P_ = c0(o, mode); if (!P_ || !o || typeof o !== 'object') return P_;
  P_.staff.ent = Math.round(numP10(o.staff && o.staff.ent, 0, 0, 12));
  if (o.wk10 && typeof o.wk10 === 'object') { const w = {}; for (const k of ['sick', 'balloons', 'cheers', 'atm', 'lost']) w[k] = Math.round(numP10(o.wk10[k], 0, 0, 1e7)); P_.wk10 = w }
  if (o.aw10 && typeof o.aw10 === 'object') { const a = { n: Math.round(numP10(o.aw10.n, 0, 0, 1e5)), won: {} }; if (o.aw10.won && typeof o.aw10.won === 'object') for (const x of AWARDS10) if (o.aw10.won[x.id] != null) a.won[x.id] = Math.round(numP10(o.aw10.won[x.id], 0, 0, 1e5)); P_.aw10 = a }
  return P_;
} }
// ---------------------------------------------------------------------------------------------------------------------
// THE WEEKLY PARK AWARDS. Every 7th closing time the judges score the week: up to three trophies (reputation and a
// cash prize) and up to two roasts (reputation down). They show at the top of that evening's day card.
function weekStats10() {
  const P_ = TY.park, h7 = P_.hist.slice(-7); let guests = 0, hs = 0, hn = 0, profit = 0; for (const h of h7) { guests += h.guests; profit += h.inc - h.exp; if (h.guests) { hs += h.happy * h.guests; hn += h.guests } }
  let best = null, bestScore = 0; for (const o of P_.objs) { if (!o.rt || !o.rt.slots || !o.st || o.st.rated < 15) continue; const sc = o.st.like / o.st.rated; if (sc > bestScore) { bestScore = sc; best = o } }
  const R = TY.rate || {}; return { guests, happy: hn ? hs / hn : 0, profit, best, bestScore, clean: TY.clean != null ? TY.clean : 100, scen: R.scen || 0, wk: { sick: 0, balloons: 0, cheers: 0, atm: 0, lost: 0, ...(P_.wk10 || {}) } };
}
function awards10() {
  const P_ = TY.park, S = weekStats10(), good = [], bad = []; for (const a of AWARDS10) { let ok = false; try { ok = a.t(S) } catch (e) {} if (ok) (a.bad ? bad : good).push(a) }
  const list = good.slice(0, 3).concat(bad.slice(0, 2)); if (!list.length) list.push({ id: 'ribbon', ic: '🎗', n: 'Participation Ribbon', rep: 0, cash: 0, d: () => 'You showed up. The judges respect the hustle.' });
  const aw = P_.aw10 || (P_.aw10 = { n: 0, won: {} }); aw.n++; const out = [];
  for (const a of list) { const cash = P_.mode === 'career' ? a.cash : 0; P_.rep = clamp(P_.rep + a.rep, 0, 100); if (cash > 0) earn10('prize', cash); if (a.id !== 'ribbon') aw.won[a.id] = (aw.won[a.id] || 0) + 1; let d = ''; try { d = a.d(S) } catch (e) {} out.push({ id: a.id, ic: a.ic, n: a.n, d, rep: a.rep, cash, bad: !!a.bad }) }
  P_.wk10 = { sick: 0, balloons: 0, cheers: 0, atm: 0, lost: 0 }; if (good.length) xp10(20 * good.length); try { sfx(good.length ? 'unlock' : 'click') } catch (e) {}
  return { week: Math.round(P_.day / 7), list: out };
}
function awardsHTML10(A) {
  return `<div class="tyAw10"><h4>🏆 Weekly Park Awards · week ${A.week}</h4>${A.list.map(a => `<div class="aw${a.bad ? ' bad' : ''}"><i>${a.ic}</i><div><b>${html10(a.n)}</b><small>${html10(a.d)}</small></div><em>${a.rep ? (a.rep > 0 ? '+' : '−') + Math.abs(a.rep) + ' rep' : ''}${a.cash ? ' · +' + money10(a.cash) : ''}</em></div>`).join('')}</div>`;
}
{ const e0 = endDay10; endDay10 = function () {
  const P_ = TY.park, d = P_ && P_.day, r = e0.apply(this, arguments);
  if (P_ && !TY.visit && d && d % 7 === 0 && P_.awDay10 !== d) { P_.awDay10 = d; const A = safe10('awards', awards10); if (A) { TY.awards10 = A; const el = $ty10('tyDay'); if (el && TY.on && !el.hidden) { el.querySelectorAll('.tyAw10').forEach(x => x.remove()); el.insertAdjacentHTML('afterbegin', awardsHTML10(A)) } savePark10() } }
  return r;
} }
// ---------------------------------------------------------------------------------------------------------------------
// test hooks
Object.assign(DBG10.ty, {
  move: (id, i, j, r) => { const o = TY.objById.get(id); if (!o || !moveStart10(o)) return 'x'; const [ax, az] = ghostAnchor10(o.k, r == null ? o.r : r, i, j); if (r != null) TY.tool.r = r; ghostSet10(i, j); const ok = moveDrop10(ax, az, TY.tool ? TY.tool.r : o.r); if (!ok) { const w = TY.ghost && TY.ghost.why; toolSet10(null); return w || 'no' } return { x: o.x, z: o.z, r: o.r } },
  moveStart: id => moveStart10(TY.objById.get(id)), moving: () => PB10.mv ? { ...PB10.mv } : null, moveCancel: () => { toolSet10(null); return !PB10.mv },
  undo: () => undo10(), undoList: () => PB10.undo.map(e => ({ t: e.t, n: e.n, tiles: e.tiles ? e.tiles.length : 0, paid: e.paid })),
  ents: () => TY.staff.filter(s_ => s_.k === 'ent').map(s_ => ({ st: s_.st, job: s_.job ? s_.job.id : 0, x: Math.round(s_.x), z: Math.round(s_.z) })), staffSet: (k, n) => { TY.park.staff[k] = n; staffSync10(); return TY.staff.filter(s_ => s_.k === k).length },
  balloons: () => ({ tg: PB10.tg ? { st: PB10.tg.st, goal: PB10.tg.goal && PB10.tg.goal.k, cash: Math.round(PB10.tg.cash), bal: !!PB10.tg.balloon } : null, carry: TY.guests.filter(g => g.balloon).length, fly: PB10.fly.length, drawn: PB10.m ? PB10.m.bal.count : 0, mascots: PB10.m ? PB10.m.body.count : 0 }),
  wk: () => ({ ...wk10() }), awards: () => { const A = awards10(); return A }, aw: () => TY.park.aw10 ? JSON.parse(JSON.stringify(TY.park.aw10)) : null,
  guestTo: (kind, cash) => { const g = TY.guests.find(q => !q.hide && q.st !== 'ride' && q.st !== 'board' && !q.leave) || TY.guests[0]; if (!g) return null; if (g.qo) gLeaveQ10(g, false); PB10.tg = g; if (cash != null) g.cash = cash; g.atm = 0; g.leave = false; return gKind10(g, kind) },
  lake: (i, j) => onLake10(i, j), keyOk: () => [TY.on, isTyping72(), UI72.pk || null]
});
