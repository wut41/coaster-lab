// ---- 10.1 MY PARK — a deeper simulation:
//  · Upkeep: everything you own costs a little to keep up each day, and a career park can go broke (three days in a row
//    in the red and the bank steps in).
//  · Scenarios: four set challenges with a goal and a deadline, played in their own park.
//  · Themed areas: Western, Space and Jungle scenery and paths. A ride with enough matching scenery around it counts as
//    themed: visitors enjoy it more and the park rating gets a lift.
//  · Families walk round together: grown-ups lead, kids follow them to the same rides and stalls.
//  · On-ride photos: a ride upgrade. After the ride some visitors buy their photo at the exit.
// ---------------------------------------------------------------------------------------------------------------------
// upkeep and money categories
EXP10.push(['upkeep', '🧰 Upkeep']); INC10.push(['photo', '📸 On-ride photos']);
const UPKEEP10 = { coaster: .003, flat: .004, shop: .006, fac: .005, deco: .002 }, LAND_UPKEEP10 = 45;
function upkeepToday10(P_ = TY.park) { let s = 0; for (const o of P_.objs) { const inf = objInfo10(o); if (inf) s += inf.cost * (UPKEEP10[inf.t] || 0) } return Math.round(s + Math.max(0, landCount10(P_) - 4) * LAND_UPKEEP10) }
// ---------------------------------------------------------------------------------------------------------------------
// themes: scenery packs and paths
const THEMES10 = { western: ['🤠', 'Western'], space: ['🚀', 'Space'], jungle: ['🌴', 'Jungle'] };
Object.assign(CAT10, {
  cactus: { t: 'deco', n: 'Cactus', ic: '🌵', w: 1, d: 1, cost: 90, beauty: 3, lv: 2, model: 'cactus', theme: 'western' },
  wagon: { t: 'deco', n: 'Covered Wagon', ic: '🛞', w: 1, d: 1, cost: 260, beauty: 5, lv: 2, model: 'wagon', theme: 'western' },
  wtower: { t: 'deco', n: 'Water Tower', ic: '🗼', w: 1, d: 1, cost: 650, beauty: 8, lv: 3, model: 'wtower', theme: 'western' },
  saloon: { t: 'deco', n: 'Saloon', ic: '🍺', w: 2, d: 2, cost: 1800, beauty: 18, lv: 4, model: 'saloon', theme: 'western' },
  aplant: { t: 'deco', n: 'Alien Plant', ic: '👽', w: 1, d: 1, cost: 120, beauty: 3, lv: 2, model: 'aplant', theme: 'space' },
  dish: { t: 'deco', n: 'Radar Dish', ic: '📡', w: 1, d: 1, cost: 480, beauty: 6, lv: 3, model: 'dish', theme: 'space' },
  planet: { t: 'deco', n: 'Ringed Planet', ic: '🪐', w: 1, d: 1, cost: 700, beauty: 8, lv: 3, model: 'planet', theme: 'space' },
  rocket: { t: 'deco', n: 'Rocket', ic: '🚀', w: 2, d: 2, cost: 1600, beauty: 16, lv: 4, model: 'rocket', theme: 'space' },
  fern: { t: 'deco', n: 'Giant Fern', ic: '🌿', w: 1, d: 1, cost: 90, beauty: 3, lv: 2, model: 'fern', theme: 'jungle' },
  bamboo: { t: 'deco', n: 'Bamboo', ic: '🎋', w: 1, d: 1, cost: 140, beauty: 3, lv: 2, model: 'bamboo', theme: 'jungle' },
  tiki: { t: 'deco', n: 'Tiki Head', ic: '🗿', w: 1, d: 1, cost: 380, beauty: 5, lv: 3, model: 'tiki', theme: 'jungle' },
  ruins: { t: 'deco', n: 'Temple Ruins', ic: '🛕', w: 2, d: 2, cost: 1700, beauty: 17, lv: 4, model: 'ruins', theme: 'jungle' }
});
PATHS10.push({ n: 'Desert dust', c: 0xc9925a, cost: 14, theme: 'western' }, { n: 'Moon tiles', c: 0x6f7c9a, cost: 22, theme: 'space' }, { n: 'Jungle trail', c: 0x7d6a45, cost: 14, theme: 'jungle' });
// the models: coloured boxes, cylinders and a few other shapes merged into one mesh each
{ const d0 = decoModel10; decoModel10 = function (g, C) {
  const K = new Kit10(), add = (geo, c, x, y, z, rx, ry, rz) => K.add(geo, c, x, y, z, rx, ry, rz);
  switch (C.model) {
    case 'cactus': K.cyl(.32, .36, 3, 0x3f9b4f, 0, 1.5, 0, 10).cyl(.2, .22, 1.1, 0x3f9b4f, .62, 1.7, 0, 8, 0, 0, -.2).cyl(.18, .2, .8, 0x3f9b4f, -.55, 2.1, 0, 8, 0, 0, .25); add(new THREE.SphereGeometry(.32, 10, 6), 0x46a857, 0, 3, 0); add(new THREE.SphereGeometry(.13, 8, 6), 0xff5fa2, 0, 3.32, 0); break;
    case 'wagon': K.box(2.6, .55, 1.3, 0x8a5a33, 0, .95, 0); for (const [x, z] of [[-.9, .72], [.9, .72], [-.9, -.72], [.9, -.72]]) add(new THREE.TorusGeometry(.45, .07, 6, 14), 0x4a3320, x, .5, z); add(new THREE.CylinderGeometry(.75, .75, 2.4, 14, 1, false, 0, PI), 0xf3ead6, 0, 1.25, 0, 0, 0, PI / 2); break;
    case 'wtower': for (const [x, z] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) K.box(.16, 3.6, .16, 0x6b4a2e, x, 1.8, z); K.cyl(1.1, 1.1, 1.7, 0x9a6a3c, 0, 4.4, 0, 14).cyl(1.15, 1.15, .12, 0x3a2a1c, 0, 3.95, 0, 14).cyl(1.15, 1.15, .12, 0x3a2a1c, 0, 4.85, 0, 14); add(new THREE.ConeGeometry(1.3, .9, 14), 0x7b3b2a, 0, 5.7, 0); break;
    case 'saloon': K.box(6.6, 3.6, 5, 0xa8733f, 0, 1.8, -.4).box(7, 1.6, .25, 0xc58a4b, 0, 4.3, 2.1).box(6.6, .15, 1.6, 0x6b4a2e, 0, 2.6, 2.9).box(6.6, .3, 1.8, 0x8a5a33, 0, .15, 2.9); for (const x of [-3.1, -1, 1, 3.1]) K.box(.15, 2.5, .15, 0x6b4a2e, x, 1.35, 3.6); K.box(1.3, 1.6, .1, 0x3a2a1c, 0, 1.1, 2.1).box(1, .8, .1, 0xfff2cc, -2.2, 1.9, 2.12).box(1, .8, .1, 0xfff2cc, 2.2, 1.9, 2.12).box(3.4, .6, .08, 0x2b1d12, 0, 4.4, 2.25).box(3, .35, .1, 0xffd23f, 0, 4.4, 2.3); break;
    case 'aplant': K.cyl(.1, .16, 2.2, 0x6a3fa0, 0, 1.1, 0, 8).cyl(.07, .1, 1.5, 0x6a3fa0, .4, .9, .2, 6, .3, 0, -.4); add(new THREE.SphereGeometry(.42, 12, 8), 0x5af2c8, 0, 2.4, 0); add(new THREE.SphereGeometry(.26, 10, 8), 0xff7af5, .8, 1.7, .5); add(new THREE.SphereGeometry(.2, 10, 8), 0x9bff5a, -.5, .5, .4); break;
    case 'dish': K.cyl(.3, .45, 1.6, 0xc7ccd6, 0, .8, 0, 10).box(.3, .5, .3, 0x8d94a3, 0, 1.75, 0); add(new THREE.SphereGeometry(1.25, 18, 8, 0, PI * 2, 0, .9), 0xf2f4f8, 0, 1.6, .55, -.95, 0, 0); K.cyl(.04, .04, 1.1, 0x8d94a3, 0, 2.55, 1.2, 6, -.95, 0, 0); add(new THREE.SphereGeometry(.09, 8, 6), 0xff3d6b, 0, 2.95, 1.6); break;
    case 'planet': K.cyl(.1, .14, 2.6, 0x8d94a3, 0, 1.3, 0, 8); add(new THREE.SphereGeometry(.95, 18, 12), 0xf0a050, 0, 3.4, 0); add(new THREE.TorusGeometry(1.5, .1, 6, 28), 0xffe6a8, 0, 3.4, 0, PI / 2 - .35, 0, .2); add(new THREE.SphereGeometry(.25, 10, 8), 0x7fc8ff, 1.6, 4.4, 0); break;
    case 'rocket': K.cyl(1, 1.15, 6.5, 0xf2f4f8, 0, 3.6, 0, 16).cyl(1.02, 1.02, .5, 0xff3d6b, 0, 5.5, 0, 16).cyl(1.17, 1.17, .4, 0xff3d6b, 0, 1.2, 0, 16); add(new THREE.ConeGeometry(1, 2.2, 16), 0xff3d6b, 0, 7.95, 0); for (let k = 0; k < 4; k++) { const a = k * PI / 2; K.box(.14, 1.8, 1.2, 0x2f7dff, Math.cos(a) * 1.3, 1.1, Math.sin(a) * 1.3, 0, -a, 0) } add(new THREE.SphereGeometry(.38, 12, 8), 0x7fd8ff, 0, 4.4, 1.02); K.cyl(1.4, 1.6, .35, 0x3a4250, 0, .18, 0, 16); break;
    case 'fern': for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2; add(new THREE.ConeGeometry(.28, 2.2, 5), k % 2 ? 0x2f8f45 : 0x3aa553, Math.cos(a) * .55, 1, Math.sin(a) * .55, Math.sin(a) * .55, 0, -Math.cos(a) * .55) } add(new THREE.SphereGeometry(.35, 8, 6), 0x2b7a3d, 0, .3, 0); break;
    case 'bamboo': for (const [x, z, h] of [[0, 0, 3.8], [.45, .3, 3.1], [-.4, .35, 3.4], [.2, -.45, 2.7], [-.3, -.35, 2.3]]) { K.cyl(.1, .12, h, 0x7cb342, x, h / 2, z, 6); for (let y = .7; y < h; y += .7) K.cyl(.13, .13, .06, 0x5f8f2f, x, y, z, 6); add(new THREE.ConeGeometry(.3, .7, 4), 0x4caf50, x + .15, h - .1, z, 0, 0, -1) } break;
    case 'tiki': K.box(1.2, 2.6, 1.1, 0x8a5a33, 0, 1.3, 0).box(1.4, .3, 1.3, 0x6b4a2e, 0, 2.75, 0).box(.32, .22, .1, 0xffd23f, -.27, 2.05, .56).box(.32, .22, .1, 0xffd23f, .27, 2.05, .56).box(.24, .6, .22, 0x6b4a2e, 0, 1.6, .62).box(.8, .2, .1, 0xf2f2f2, 0, 1.0, .56).box(.9, .08, .1, 0x2b1d12, 0, 1.12, .57); for (const x of [-.75, .75]) K.box(.25, .6, .4, 0x6b4a2e, x, 1.9, 0); break;
    case 'ruins': K.box(6.6, .8, 6.6, 0x9a9583, 0, .4, 0).box(5, .8, 5, 0xa8a390, 0, 1.2, 0).box(3.4, .8, 3.4, 0xb4ae99, 0, 2, 0).box(1.8, 1.2, 1.8, 0x8d8875, 0, 3, 0).box(.9, .8, .1, 0x2b2a24, 0, 3, .91); for (const [x, z, h] of [[-2.9, 2.9, 2.6], [2.9, 2.9, 1.5], [-2.9, -2.9, 1.9], [2.9, -2.9, 3]]) K.cyl(.32, .36, h, 0xb9b4a0, x, h / 2, z, 8); add(new THREE.SphereGeometry(.7, 8, 6), 0x3f8f4a, 2.4, 2.4, -1.6); add(new THREE.SphereGeometry(.55, 8, 6), 0x46a857, -2.2, 1.9, 1.8); break;
    default: return d0(g, C);
  }
  kitTo10(g, K);
} }
// scenery is merged by material, so each colour gets its own (shared) plain material rather than vertex colours
function kitTo10(g, K) { for (const [geo, m, c] of K.p) { geo.applyMatrix4(m); const me = new THREE.Mesh(geo, lmat80(c, .75)); me.castShadow = true; g.add(me) } K.p = [] }
// which theme a ride or shop sits in: at least three pieces of one theme's scenery within three tiles of it
const THEME_R10 = 3, THEME_N10 = 3;
function themeScan10() {
  const P_ = TY.park; if (!P_) return; const pcs = []; for (const o of P_.objs) { const C = CAT10[o.k]; if (C && C.theme) pcs.push([o.x, o.z, o.x + C.w - 1, o.z + C.d - 1, C.theme]) }
  for (const o of P_.objs) { if (!o.rt) continue; const inf = objInfo10(o); if (!inf || inf.t === 'deco') continue; o.rt.theme = null; if (!pcs.length) continue; const fp = footprint10(o); if (!fp) continue;
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, z] of (inf.t === 'coaster' && typeof stationTiles10 === 'function' ? stationTiles10(o).concat(fp.pad || []) : fp.solid)) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, z); d = Math.max(d, z) }
    const n = {}; for (const [x0, z0, x1, z1, th] of pcs) { const dx = Math.max(0, a - x1, x0 - b), dz = Math.max(0, c - z1, z0 - d); if (Math.max(dx, dz) <= THEME_R10) n[th] = (n[th] || 0) + 1 }
    let best = null, bn = THEME_N10 - 1; for (const k in n) if (n[k] > bn) { bn = n[k]; best = k } o.rt.theme = best }
  TY.themeVer = (TY.themeVer || 0) + 1;
}
{ const b0 = beauty10; beauty10 = function () { b0(); safe10('themes', themeScan10) } }
// the Scenery tray gets a row to show one theme at a time
{ const t0 = trayHTML10; trayHTML10 = function () {
  let h = t0(); if (TY.ui.cat !== 'deco') return h; const th = TY.ui.theme || 'all';
  if (th !== 'all') h = h.replace(/<button class="tyIt[^"]*" data-ty="pick" data-v="([\w:]+)">[^]*?<\/button>/g, (m, k) => (CAT10[k] && (th === 'classic' ? !CAT10[k].theme : CAT10[k].theme === th)) ? m : '');
  const chip = (k, l) => `<button class="tyChip${th === k ? ' on' : ''}" data-ty="theme" data-v="${k}">${l}</button>`;
  return `<div class="tyThemes">${chip('all', 'All')}${chip('classic', '🌳 Classic')}${Object.keys(THEMES10).map(k => chip(k, THEMES10[k].join(' '))).join('')}</div>` + h;
} }
// ---------------------------------------------------------------------------------------------------------------------
// on-ride photos: a fourth upgrade for rides
UPG10.photo = ['📸', 'On-ride photos', ['A camera on the ride and a photo stand at the exit', 'Sharper photos: more people buy one', 'Photo and video combo: more people buy, and it costs more']];
const PHOTO10 = [null, [.22, 5], [.32, 6], [.4, 8]];// chance to buy, price
{ const c0 = cleanPark10; cleanPark10 = function (o, mode) {
  const P_ = c0(o, mode); if (!P_ || !o || typeof o !== 'object') return P_;
  if (Array.isArray(o.objs)) { const raw = new Map(); for (const q of o.objs) if (q && typeof q === 'object' && Number.isInteger(q.id)) raw.set(q.id, q); for (const b of P_.objs) { if (!b.up) continue; const q = raw.get(b.id); b.up.photo = Math.round(numP10(q && q.up && q.up.photo, 0, 0, 3)) } }
  P_.red = Math.round(numP10(o.red, 0, 0, 3)); P_.rescues = Math.round(numP10(o.rescues, 0, 0, 99));
  if (o.scn && typeof o.scn === 'object' && SCNS10.some(s => s.id === o.scn.id)) P_.scn = { id: o.scn.id, d0: Math.round(numP10(o.scn.d0, 1, 1, 1e6)), g0: Math.round(numP10(o.scn.g0, 0, 0, 1e9)), end: o.scn.end === 'won' || o.scn.end === 'lost' ? o.scn.end : '' };
  return P_;
} }
// one visitor's verdict after a ride: a themed ride is more fun; a photo may be bought on the way out
{ const r0 = gRated10; gRated10 = function (g, o, inf) {
  const h0 = g.happy; r0(g, o, inf); const R = o.rt;
  if (R && R.theme) { g.happy = clamp(g.happy + 3.5, 0, 100); o.st.like += .6; if (g.happy > h0 + 2 && Math.random() < .2) say10(g, THEMES10[R.theme][0], 'Love the ' + THEMES10[R.theme][1] + ' theming at ' + objName10(o)) }
  const l = o.up && o.up.photo; if (l && PHOTO10[l] && !TY.visit) { const [p, price] = PHOTO10[l]; if (g.happy > 45 && g.cash >= price && Math.random() < p * (.6 + g.happy / 200)) { g.cash -= price; g.spent += price; earn10('photo', price); o.st.inc += price; o.st.photos = (o.st.photos || 0) + 1; TY.park.tot.sales++; say10(g, '📸', 'I bought my photo from ' + objName10(o)) } }
} }
// the camera: a small post with a flash beside the track
{ const c0 = coasterBuild10; coasterBuild10 = function (o, inf) {
  const g = c0(o, inf); if (o.up && o.up.photo) safe10('photo post', () => { const p = inf.prof, i = Math.floor(N * .62), x = p.pts[i * 3], y = p.pts[i * 3 + 1], z = p.pts[i * 3 + 2]; if (y > 9) return; const K = new Kit10(); K.box(.14, y + 1.2, .14, 0x2b3441, x + 1.6, (y + 1.2) / 2, z).box(.5, .4, .4, 0x1b2028, x + 1.6, y + 1.3, z).box(.2, .2, .1, 0xfff2cc, x + 1.6, y + 1.3, z - .25); const m = K.mesh(); if (m) { m.name = 'photo10'; g.add(m) } });
  return g;
} }
{ const u0 = tyUpgrade10; tyUpgrade10 = function (o, kind) { if (o && o.up && o.up.photo == null) o.up.photo = 0; const w = u0(o, kind); if (w === '' && kind === 'photo') { const inf = objInfo10(o); if (inf && inf.t === 'coaster') { rideClear10(o); objAdd3d10(o); linkObj10(o) } toast10('📸 Photos on sale at ' + objName10(o), 'photo') } return w } }
// ---------------------------------------------------------------------------------------------------------------------
// families: a grown-up leads and one to three others (mostly kids) follow them round the park
const FAMILY10 = GT10.findIndex(t => t.k === 'family');
{ const s0 = guestSpawn10; guestSpawn10 = function () {
  const g = s0(); if (!g || g.ty !== FAMILY10 || g.lead || Math.random() > .75 || TY.guests.length > maxGuests10() - 3) return g;
  const n = 1 + rndi10(3); g.kids = []; for (let k = 0; k < n; k++) { const f = s0(); if (!f) break; f.ty = FAMILY10; f.lead = g.id; f.L = g; f.kid = k > 0 || Math.random() < .55; f.x = g.x + rnd7(-.9, .9); f.z = g.z + rnd7(.4, 1.6); f.sp = g.sp; f.off = clamp(g.off + rnd7(-.5, .5), -1.2, 1.2); f.stay = g.stay + 30; f.cash = Math.max(f.cash * .6, 30); g.kids.push(f) }
  return g;
} }
{ const d0 = gDecide10; gDecide10 = function (g) {
  const L_ = g.L; if (!L_ || L_.gone) { if (g.L) { g.L = null; g.lead = 0 } return d0(g) }
  if (L_.leave || g.leave) { g.leave = true; return d0(g) }
  const G_ = L_.goal; g.wq = 0;
  if (L_.st === 'queue' && L_.qo && L_.qo.rt && rideOpen10(L_.qo)) { const o = L_.qo; return gGo10(g, { k: 'ride', id: o.id }, 'o' + o.id, o.rt.entry) }
  if (G_ && L_.fkey && G_.k !== 'exit' && L_.st === 'walk') return gGo10(g, { ...G_ }, L_.fkey, L_.ftg);
  if (Math.hypot(L_.x - g.x, L_.z - g.z) > 9 && TY.path[L_.ti]) return gGo10(g, { k: 'stroll' }, 't' + L_.ti, [L_.ti]);
  g.st = 'idle'; g.useT = .8 + Math.random();
} }
{ const l0 = guestLeft10; guestLeft10 = function (g) { g.gone = true; return l0(g) } }
// ---------------------------------------------------------------------------------------------------------------------
// scenarios: a set park, a goal and a deadline
const SCNS10 = [
  { id: 'rusty', ic: '🏚', n: 'Save Rusty Acres', d: 'An old park in debt, with worn-out rides and nobody coming. Get the park rating up to 55 and finish a day with money in the bank.', days: 12, money: 3500, loan: 16000, rep: 12, prize: [160, 120],
    goal: P_ => P_.rating >= 55 && P_.money >= 0 && P_.hist.length > 0, prog: P_ => 'rating ' + Math.round(P_.rating) + ' / 55' + (P_.money < 0 ? ' · in the red' : '') },
  { id: 'crowd', ic: '👥', n: '1,000 by day 10', d: 'An empty field and a healthy budget. Welcome 1,000 visitors in total before day 10 is over.', days: 10, money: 32000, rep: 22, prize: [140, 100],
    goal: (P_, S_) => P_.tot.guests - S_.g0 >= 1000, prog: (P_, S_) => (P_.tot.guests - S_.g0).toLocaleString('en-US') + ' / 1,000 visitors' },
  { id: 'kingdom', ic: '🎢', n: 'Coaster Kingdom', d: 'Build a coaster lover’s park: four coasters running and a park rating of 65, by the end of day 14.', days: 14, money: 70000, rep: 20, prize: [200, 150],
    goal: P_ => P_.objs.filter(o => o.k[1] === ':' && o.rt && o.rt.linked).length >= 4 && P_.rating >= 65, prog: P_ => P_.objs.filter(o => o.k[1] === ':' && o.rt && o.rt.linked).length + ' / 4 coasters · rating ' + Math.round(P_.rating) + ' / 65' },
  { id: 'lake', ic: '🏝', n: 'Lakeside Lodge', d: 'A park around a big lake. Bridge it, build round it and have $60,000 in the bank with no loan by the end of day 12.', days: 12, money: 26000, rep: 20, prize: [180, 130],
    goal: P_ => P_.money >= 60000 && P_.loan <= 0, prog: P_ => money10(P_.money) + ' / $60,000' + (P_.loan > 0 ? ' · loan ' + money10(P_.loan) : '') }
];
const scnOf10 = P_ => P_ && P_.scn ? SCNS10.find(s => s.id === P_.scn.id) : null;
const scnDayOf10 = P_ => P_.day - P_.scn.d0 + 1;
const scnDone10 = () => { try { return JSON.parse(localStorage.getItem(K10 + 'scnDone') || '{}') || {} } catch (e) { return {} } };
// in-game helpers that set a scenario park up: find a place for something, and lay a path to it
function placeNear10(key, ci, cj, rad) { for (let r = 0; r <= rad; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; for (let rot = 0; rot < 4; rot++) { const x = tyBuild10(key, ci + di, cj + dj, rot, true); if (x.ok) return x.o } } return null }
function pathTo10(o, style) {
  const info = DBG10.tyGrid(o.id); if (!info) return 0; const G = GW10, { free, path, goal } = info, prev = new Int32Array(G * GH10).fill(-2), q = []; for (let k = 0; k < G * GH10; k++) if (path[k]) { prev[k] = -1; q.push(k) }
  let end = -1; for (let h = 0; h < q.length; h++) { const k = q[h]; if (goal.includes(k)) { end = k; break } const i = k % G, j = (k - i) / G; for (const [a, b] of NB10) { const x = i + a, z = j + b; if (!inG10(x, z)) continue; const n = tI10(x, z); if (prev[n] !== -2 || !free[n]) continue; prev[n] = k; q.push(n) } }
  if (end < 0) return 0; let n = 0; for (let k = end; k >= 0 && prev[k] !== -1; k = prev[k]) { const P_ = TY.park; P_.paths[k] = style || 0; TY.path[k] = (style || 0) + 1; n++ } TY.pathVer++; TY.pathDirty = true; return n;
}
function scnSetup10(S) {
  const P_ = TY.park;
  if (S.id === 'rusty') {
    const keep = P_.money; P_.money = 1e9;// set-up is free
    const built = []; for (const [k, i, j] of [['carousel', 20, 40], ['teacups', 28, 40], ['c:Little Dipper', 25, 33], ['burger', 21, 44], ['drinks', 27, 44], ['bench', 23, 43], ['bench', 26, 37]]) { const o = placeNear10(k, i, j, 5); if (o) built.push(o) }
    for (const o of built) pathTo10(o, 0); linkAll10();
    for (const o of built) { o.rel = 28 + rndi10(18); o.age = 900 + rndi10(600); if (o.up) o.up.fx = 0 } P_.staff = { jan: 0, mech: 0 }; P_.fee = 18; P_.money = keep;
    for (let k = 0; k < 40; k++) { const PT = pathTiles10(); if (!PT.length) break; const t = PT[rndi10(PT.length)]; TY.litter.push({ x: tX10(t % GW10) + rnd7(-1.5, 1.5), z: tZ10(Math.floor(t / GW10)) + rnd7(-1.5, 1.5), v: Math.random() < .2 ? 1 : 0 }) }
    staffSync10(); P_.name = 'Rusty Acres';
  } else if (S.id === 'lake') {
    // a lake in the middle of the land you start with, with an island
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (let k = 0; k < GW10 * GH10; k++) if (TY.own[k]) { const i = k % GW10, j = (k - i) / GW10; a = Math.min(a, i); b = Math.max(b, i); c = Math.min(c, j); d = Math.max(d, j) }
    const ci = (a + b) / 2 + 4, cj = (c + d) / 2 - 3, rx = (b - a) * .24, rz = (d - c) * .21;
    for (let k = 0; k < GW10 * GH10; k++) { if (!TY.own[k] || TY.path[k] || TY.occ[k]) continue; const i = k % GW10, j = (k - i) / GW10, e = ((i - ci) / rx) ** 2 + ((j - cj) / rz) ** 2; if (e < 1 && !(Math.abs(i - ci - 1) <= 1 && Math.abs(j - cj) <= 1)) TY.hgt[k] = e < .5 ? -2 : -1; else if (e < 1.6 && (hash10('h' + k) % 3 === 0)) TY.hgt[k] = 1 }
    terraStore10(); P_.name = 'Lakeside Lodge';
  } else P_.name = S.id === 'crowd' ? 'Turnstile Fields' : 'Coaster Kingdom';
}
function scnStart10(id) {
  const S = SCNS10.find(s => s.id === id); if (!S) return false; DEL10('park.scn'); TY.cam.set = false; const P_ = newPark10('scn');
  Object.assign(P_, { money: S.money, loan: S.loan || 0, rep: S.rep, tut: 9, scn: { id, d0: 1, g0: 0, end: '' } }); if (S.loan) P_.led.inc.loan = 0;
  TY.visit = null; if (TY.on) savePark10(); if (!tyEnter10('scn', P_)) return false; TY.cam.set = true; SS10('lastSlot', 'scn');
  safe10('scenario set-up', () => { scnSetup10(S); tyRebuild10(); linkAll10() }); P_.scn.g0 = P_.tot.guests; savePark10();
  scnCard10('start'); return true;
}
function scnCheck10(dayOver) {
  const P_ = TY.park, S = scnOf10(P_); if (!S || P_.scn.end || TY.visit) return; let won = false; try { won = S.goal(P_, P_.scn) } catch (e) {}
  if (won) { P_.scn.end = 'won'; const done = scnDone10(); done[S.id] = Math.max(done[S.id] || 0, 1); try { localStorage.setItem(K10 + 'scnDone', JSON.stringify(done)) } catch (e) {} try { award72(S.prize[0], S.prize[1], 'scenario') } catch (e) {} try { sfx('ach'); confettiSmall() } catch (e) {} savePark10(); scnCard10('won'); return }
  if (dayOver && scnDayOf10(P_) >= S.days) { P_.scn.end = 'lost'; savePark10(); scnCard10('lost') }
}
function scnCard10(kind) {
  const P_ = TY.park, S = scnOf10(P_); if (!S) return; const el = $ty10('tyDay');
  const body = kind === 'start' ? `<h3>${S.ic} ${html10(S.n)}</h3><p>${html10(S.d)}</p><div class="tyKV"><span>Time<b>${S.days} days</b></span><span>Money<b>${money10(P_.money)}${P_.loan ? ' · loan ' + money10(P_.loan) : ''}</b></span></div><div class="tyRow"><button class="btn primary" data-ty="dayx">Let’s go ▶</button></div>`
    : kind === 'won' ? `<h3>🏆 ${html10(S.n)}: done!</h3><p>You did it on day ${scnDayOf10(P_)} of ${S.days}. ${S.prize[1]} coins and ${S.prize[0]} XP are yours.</p><div class="tyRow"><button class="btn" data-ty="scnPick">🗺 Another scenario</button><button class="btn primary" data-ty="dayx">Keep playing ▶</button></div>`
    : `<h3>⌛ ${html10(S.n)}: out of time</h3><p>Day ${S.days} is over and the goal was not reached (${html10(S.prog(P_, P_.scn))}). You can keep this park going, or try again from the start.</p><div class="tyRow"><button class="btn" data-ty="scnRetry">↺ Try again</button><button class="btn primary" data-ty="dayx">Keep playing ▶</button></div>`;
  el.innerHTML = body; el.hidden = false;
}
// ---------------------------------------------------------------------------------------------------------------------
// the end of a day: upkeep is paid, debts are watched, a scenario may end
{ const e0 = endDay10; endDay10 = function () {
  const P_ = TY.park, career = P_.mode === 'career' && !TY.visit; if (career) { const u = upkeepToday10(P_); if (u > 0) pay10('upkeep', u) }
  e0();
  if (!career) return;
  if (P_.money < 0) { P_.red = Math.min(3, (P_.red || 0) + 1); if (P_.red >= 3) bustCard10(); else { toast10('⚠ In the red: day ' + P_.red + ' of 3. Raise prices, sell something or take a loan', 'red', true); if (TY.on && TY.lastDay) dayCard10(TY.lastDay) } } else P_.red = 0;
  if (P_.red < 3) scnCheck10(true);
} }
{ const c0 = dayCard10; dayCard10 = function (d) {
  c0(d); const P_ = TY.park, el = $ty10('tyDay'), tbl = el.querySelector('table'); if (!tbl || !P_ || P_.mode !== 'career') return;
  const S = scnOf10(P_), note = P_.red > 0 && P_.red < 3 ? `<p class="tyWarn">⚠ You are in the red (${P_.red} of 3 days). Three days in a row and the bank steps in.</p>` : '';
  tbl.insertAdjacentHTML('afterend', note + (S && !P_.scn.end ? `<p class="tyNote">${S.ic} ${html10(S.n)} · day ${scnDayOf10(P_)} of ${S.days} · ${html10(S.prog(P_, P_.scn))}</p>` : ''));
} }
function bustCard10() {
  const P_ = TY.park, el = $ty10('tyDay'); P_.speed = 0;
  el.innerHTML = `<h3>💸 ${html10(P_.name)} has gone broke</h3><p>Three days in a row in the red, and the bank has stepped in. It will lend you ${money10(20000)} to carry on, but word gets round: your reputation drops.</p><div class="tyKV"><span>Money<b class="neg">${money10(P_.money)}</b></span><span>Loan<b>${money10(P_.loan)}</b></span></div><div class="tyRow"><button class="btn" data-ty="bust" data-v="restart">🗑 Start again</button><button class="btn primary" data-ty="bust" data-v="rescue">🏦 Take the rescue loan</button></div>`;
  el.hidden = false; try { sfx('beep') } catch (e) {}
}
// buttons on the cards and the theme chips
{ const a0 = tyAct10; tyAct10 = async function (a, v_) {
  const P_ = TY.park;
  if (a === 'theme') { TY.ui.theme = v_; tyUi10(); return }
  if (a === 'bust') { const el = $ty10('tyDay'); el.hidden = true; if (v_ === 'rescue') { P_.loan += 20000; earn10('loan', 20000); P_.rep = Math.max(0, P_.rep - 20); P_.red = 0; P_.rescues = (P_.rescues || 0) + 1; P_.speed = 1; toast10('🏦 Rescue loan: ' + money10(20000) + '. Time to turn things round', 'bust', true); scnCheck10(true) } else if (P_.scn) scnStart10(P_.scn.id); else { DEL10('park.' + TY.slot); tyOpen10(TY.slot) } savePark10(); return }
  if (a === 'scnRetry') { $ty10('tyDay').hidden = true; if (P_.scn) scnStart10(P_.scn.id); return }
  if (a === 'scnPick') { $ty10('tyDay').hidden = true; openPk72('ty10', 'scn'); return }
  return a0(a, v_);
} }
// the badge under the top bar shows the scenario's progress
{ const h0 = tyHud10; tyHud10 = function (raw) {
  h0(raw); const P_ = TY.park, S = !TY.visit && scnOf10(P_); if (!S) return; const bd = $ty10('tyBadge');
  const t = P_.scn.end === 'won' ? '🏆 ' + S.n + ' · done!' : P_.scn.end === 'lost' ? '⌛ ' + S.n + ' · out of time' : S.ic + ' ' + S.n + ' · day ' + Math.max(1, scnDayOf10(P_)) + ' of ' + S.days + ' · ' + S.prog(P_, P_.scn);
  if (bd.textContent !== t) bd.textContent = t; bd.hidden = false; bd.className = 'scn';
  if ((TY.scnT = (TY.scnT || 0) - raw) <= 0) { TY.scnT = 1; if (!P_.scn.end && P_.speed) scnCheck10(false) }
} }
// the Park Office: a Scenarios tab, the upkeep in Money, and a way back to the scenario park
{ const T = PANELS72.ty10, desc = Object.getOwnPropertyDescriptor(T, 'tabs'); Object.defineProperty(T, 'tabs', { configurable: true, get() { const t = desc.get.call(this); if (TY.visit) return t; const k = t.findIndex(x => x[0] === 'goals'); t.splice(k + 1, 0, ['scn', '🗺 Scenarios']); return t } }) }
{ const o0 = officeHTML10; officeHTML10 = function (tab) {
  const P_ = TY.park; if (tab !== 'scn') { let h = o0(tab); if (tab === 'money' && P_.mode === 'career') h = h.replace('<div class="ty10pk">', `<div class="ty10pk"><p class="tyNote">🧰 Upkeep: everything you own costs about <b>${money10(upkeepToday10(P_))}</b> a day to keep up, paid at closing time.${P_.red ? ` <b class="neg">In the red for ${P_.red} of 3 days.</b>` : ''}</p>`); if (tab === 'park' && !TY.visit) h = h.replace('<h3>Account', `<div class="tyRow">${pkBtn10('tab:scn', '🗺 Scenarios' + (TY.slot === 'scn' ? ' ✓' : ''), TY.slot === 'scn' ? 'primary' : '')}</div><h3>Account`); return h }
  const done = scnDone10(), cur = TY.slot === 'scn' && P_.scn ? P_.scn.id : null;
  return `<div class="ty10pk"><p class="tyNote">Each scenario is its own park with a goal and a deadline. Starting one replaces the scenario you were playing; your Career and Sandbox parks are not touched.</p><div class="tyList">${SCNS10.map(S => `<div class="tyLi ${done[S.id] ? 'done' : ''}"><i>${S.ic}</i><div><b>${html10(S.n)}${done[S.id] ? ' ✅' : ''}</b><small>${html10(S.d)} · ${S.days} days · start with ${money10(S.money)}${S.loan ? ' and a ' + money10(S.loan) + ' loan' : ''}</small></div><button class="btn${cur === S.id ? '' : ' primary'}" data-x="scn:${S.id}">${cur === S.id ? 'Restart' : 'Play'}</button></div>`).join('')}</div>${cur ? '' : TY.slot !== 'scn' && loadPark10('scn') ? `<div class="tyRow">${pkBtn10('slot:scn', '↩ Back to your scenario park')}</div>` : ''}</div>`;
} }
{ const T = PANELS72.ty10, a0 = T.act; T.act = async function (a, t) { const [k, v_] = a.split(':'); if (k === 'scn' && SCNS10.some(s => s.id === v_)) { closePk72(); scnStart10(v_); return false } return a0.call(this, a, t) } }
// a park reopened: themes are worked out again
{ const r0 = tyRebuild10; tyRebuild10 = function () { r0.apply(this, arguments); safe10('themes', themeScan10) } }
{ const b0 = tyBuild10; tyBuild10 = function (key, i, j, r, free) { const res = b0(key, i, j, r, free); if (res.ok && res.o.up && res.o.up.photo == null) res.o.up.photo = 0; if (res.ok && objInfo10(res.o).t !== 'deco') safe10('themes', themeScan10); return res } }
Object.assign(DBG10.ty, {
  upkeep: () => upkeepToday10(), endDay: () => { endDay10(); return { money: Math.round(TY.park.money), red: TY.park.red || 0, loan: TY.park.loan, speed: TY.park.speed, card: $ty10('tyDay').hidden ? '' : $ty10('tyDay').innerText.slice(0, 800) } },
  theme: id => { const o = TY.objById.get(id); return o && o.rt ? o.rt.theme || null : undefined },
  scn: id => scnStart10(id), scnInfo: () => { const P_ = TY.park, S = scnOf10(P_); return S ? { id: S.id, day: scnDayOf10(P_), end: P_.scn.end, prog: S.prog(P_, P_.scn), objs: P_.objs.length, lake: TY.terra && TY.terra.lake, red: P_.red || 0 } : null },
  families: () => { const G_ = TY.guests; return { leaders: G_.filter(g => g.kids && g.kids.length).length, followers: G_.filter(g => g.L).length, kids: G_.filter(g => g.kid).length, together: G_.filter(g => g.L && !g.L.gone && Math.hypot(g.x - g.L.x, g.z - g.L.z) < 10).length } },
  rated: (id, n) => { const o = TY.objById.get(id), inf = o && objInfo10(o); if (!inf) return null; const inc0 = o.st.inc; let bought = 0; for (let k = 0; k < (n || 50); k++) { const g = { ty: 2, happy: 80, cash: 100, spent: 0, did: {}, nausea: 0, energy: 90, rides: 0, wq: 0, t: 0, skip: {} }; gRated10(g, o, inf); if (g.cash < 100) bought++ } return { bought, inc: o.st.inc - inc0 } }
});
