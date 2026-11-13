// ---- 10.0 MY PARK — the simulation. Every visitor is one simulated person: they pay at the gate, walk the paths you
// built, pick rides that suit them, stand in real queues, board when a train or ride cycle loads, react to the ride,
// get hungry, thirsty and tired, buy things, drop litter and go home. Rides load from their queue, run their real lap
// and wear out; mechanics and janitors walk to their jobs. Every dollar passes through earn10 / pay10.
const SIM10 = { minPerSec: 2, open: 540, close: 1260, wageJan: 16, wageMech: 26, maxG: mobile ? 260 : 420 };
// ---- path finding: one breadth-first "distance to target" map per destination, cached until paths or buildings change
const FF10 = new Map(); let ffVer10 = -1;
function field10(key, targets) {
  if (ffVer10 !== TY.pathVer) { FF10.clear(); ffVer10 = TY.pathVer }
  let f = FF10.get(key); if (f) return f; f = new Int16Array(GW10 * GH10).fill(-1); const q = []; for (const t of targets) if (TY.path[t] && f[t] < 0) { f[t] = 0; q.push(t) }
  for (let h = 0; h < q.length; h++) { const t = q[h], i = t % GW10, j = (t - i) / GW10, d = f[t] + 1; for (const [dx, dz] of NB10) { const a = i + dx, b = j + dz; if (!inG10(a, b)) continue; const k = tI10(a, b); if (TY.path[k] && f[k] < 0) { f[k] = d; q.push(k) } } }
  FF10.set(key, f); return f;
}
const gateT10 = () => tI10(GATE_I10, GATE_J10);
// path tiles that touch a set of cells (where visitors stand to use the thing)
function touchTiles10(cells) { const set = new Set(cells.map(([i, j]) => tI10(i, j))), out = []; for (const [i, j] of cells) for (const [dx, dz] of NB10) { const a = i + dx, b = j + dz; if (!inG10(a, b)) continue; const k = tI10(a, b); if (TY.path[k] && !set.has(k) && !out.includes(k)) out.push(k) } return out }
// ---- runtime state of a placed thing
function rideRt10(o, inf) { return { g: null, xf: null, q: [], riders: [], entry: [], linked: false, ph: 'load', t: 0, wait: 0, broken: 0, fix: 0, insp: 0, used: 0, sold: 0, anim: null, animT: 0, trains: null, waitAvg: 0, lastN: 0, tmr: 0 } }
function linkObj10(o) {
  const inf = objInfo10(o); if (!inf || !o.rt) return; const fp = footprint10(o), R = o.rt, gate = field10('gate', [gateT10()]);
  R.entry = touchTiles10(inf.t === 'coaster' ? fp.pad : fp.solid).filter(t => gate[t] >= 0); R.linked = R.entry.length > 0;
  if (R.linked) { let best = R.entry[0]; for (const t of R.entry) if (gate[t] < gate[best]) best = t; R.gateTile = best }
  // queue slots in the thing's own frame (coasters: the yard beside the station; flat rides: the strip along the front)
  if (inf.t === 'coaster') { const zs = inf.prof.zs, s_ = []; for (let l = 0; l < 4; l++) for (let k = 0; k < 7; k++) s_.push([l % 2 ? 6.2 - k * .9 : .8 + k * .9, (-5.75 - l * 1.75) * zs]); R.slots = s_; R.board = [1.2, inf.prof.yP, (inf.prof.zp1 + .4) * zs]; R.exit = [7.3, -8.2 * zs] }
  else if (inf.t === 'flat') {
    // the queue forms along the side of the ride that touches the path (worked out in park coordinates)
    R.slots = []; R.wslots = null; if (!R.linked) return; const gt = R.gateTile, gi = gt % GW10, gj = (gt - gi) / GW10; let fi = gi, fj = gj, dx = 0, dz = 1;
    for (const [a, b] of NB10) if (fp.solid.some(([i, j]) => i === gi + a && j === gj + b)) { fi = gi + a; fj = gj + b; dx = -a; dz = -b; break }
    const ex = tX10(fi) + dx * TS10 / 2, ez = tZ10(fj) + dz * TS10 / 2, ax = -dz, az = dx, ws = [], w_ = objWorld10(o);
    for (const [row, dir] of [[1.5, 1], [.65, -1]]) for (let k = 0; k < 7; k++) { const t = (k - 3) * .82 * dir; ws.push([ex - dx * row + ax * t, ez - dz * row + az * t]) }
    R.wslots = ws; R.slots = ws; R.wboard = [w_.x, w_.z]; R.wexit = [ex - dx * .5 + ax * 3.4, ez - dz * .5 + az * 3.4];
    const sg = R.g && R.g.userData.sign; if (sg) { R.g.updateMatrixWorld(true); const lp = R.g.worldToLocal(V(ex - dx * .35 - ax * 3.1, 0, ez - dz * .35 - az * 3.1)); sg.position.set(lp.x, 0, lp.z); sg.rotation.y = Math.atan2(dx, dz) - R.g.rotation.y; sg.visible = true }
  }
  R.qCap = R.slots ? Math.min(R.slots.length, inf.t === 'coaster' ? 20 + 4 * (o.up ? o.up.cap : 0) : 12 + 2 * (o.up ? o.up.cap : 0)) : 0;
}
function linkAll10() { for (const o of TY.park.objs) if (o.rt) linkObj10(o); TY.linkVer = TY.pathVer }
// ---- scenery value: every tile gets the beauty of the scenery around it (felt by visitors walking and waiting there)
function beauty10() { TY.beauty.fill(0); for (const o of TY.park.objs) { const C = CAT10[o.k]; if (!C || !C.beauty) continue; for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const i = o.x + di, j = o.z + dj; if (!inG10(i, j)) continue; TY.beauty[tI10(i, j)] += C.beauty / (1 + .6 * (Math.abs(di) + Math.abs(dj))) } } }
// ---- prices, worth and appeal
const fareOf10 = (o, inf) => o.price >= 0 ? o.price : (inf.fare != null ? inf.fare : inf.price || 0);
const worth10 = inf => 1.2 + inf.exc / 8.5;// what a ride of this excitement is worth to an average visitor ($)
const perk10 = k => !!(TY.park && TY.park.perks[k]);
function rideOpen10(o) { const R = o.rt; return !!R && o.open !== false && !R.broken && !R.insp && R.linked && parkOpen10() }
const parkOpen10 = () => { const P_ = TY.park; return P_.open && P_.min >= SIM10.open && P_.min < SIM10.close };
// ---- visitors
let gid10 = 1;
const SK10 = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0xa86b3c], SH10 = [0x2f7dff, 0xffd23f, 0x2fd18b, 0xff6fa8, 0xff7a3d, 0x9b6bff, 0xf2f2f2, 0x18b8c9, 0xe63946, 0x2a9d8f], PA10 = [0x2d3a55, 0x3b3b3b, 0x5a4632, 0x1f4f6b, 0x6b2d3a, 0x8a8f99];
function guestSpawn10() {
  const P_ = TY.park; let r = Math.random(), ty = 0; for (let k = 0; k < GT10.length; k++) { r -= GT10[k].share; if (r <= 0) { ty = k; break } } const T_ = GT10[ty];
  // the gate: each person has a price they are willing to pay, higher for a park with a good name and more to do
  const nR = P_.objs.reduce((a, o) => { const i = objInfo10(o); return a + (i && (i.t === 'coaster' ? 2.2 : i.t === 'flat' ? 1 : 0)) }, 0), will = (9 + P_.rep * .3 + Math.min(18, nR * 1.6)) * (.7 + Math.random() * .7) * (perk10('value1') ? 1.12 : 1) * (perk10('value2') ? 1.12 : 1);
  if (P_.fee > will) { P_.tot.turned++; TY.day.turned++; if (Math.random() < .3) bubbleAt10(tX10(GATE_I10) + rnd7(-2, 2), HALF10 + 4, '💸'); return null }
  const h = (gid10 * 2654435761) >>> 0, g = { id: gid10++, ty, x: tX10(GATE_I10) + rnd7(-1.2, 1.2), z: HALF10 + rnd7(4, 9), y: 0, tx: 0, tz: 0, ti: gateT10(), st: 'walk', goal: null, cash: rnd7(T_.cash[0], T_.cash[1]) * (perk10('vip') ? 1.2 : 1), happy: 58 + Math.random() * 16, hunger: rnd7(8, 40), thirst: rnd7(8, 40), energy: rnd7(78, 100), bladder: rnd7(0, 30), nausea: 0,
    t: 0, stay: rnd7(190, 330), sp: 1.45 + Math.random() * .5, off: (Math.random() - .5) * 2.4, yaw: PI, bob: Math.random() * 6, shirt: SH10[(h >>> 3) % SH10.length], pants: PA10[(h >>> 7) % PA10.length], skin: SK10[(h >>> 11) % SK10.length], did: {}, skip: {}, rides: 0, spent: 0, wq: 0, leave: false, umb: false, gift: false, say: '', sayT: 0, th: '', hide: false, sit: 0, useT: 0 };
  g.tx = tX10(GATE_I10) + g.off * .5; g.tz = tZ10(GATE_J10); g.cash -= P_.fee; g.spent += P_.fee; earn10('gate', P_.fee); P_.tot.guests++; TY.day.guests++; TY.guests.push(g); return g;
}
function say10(g, e, th) { g.say = e; g.sayT = 2.6; if (th) g.th = th; TY.thoughts[th || e] = (TY.thoughts[th || e] || 0) + 1 }
// choose what to do next (called whenever a visitor is free and standing on a path)
function gDecide10(g) {
  const P_ = TY.park, T_ = GT10[g.ty]; g.goal = null; g.wq = 0;
  if (g.leave || !parkOpen10() || g.t > g.stay || g.cash < 2 || g.happy < 16 || g.energy < 5) { if (!g.leave) { g.leave = true; if (g.happy < 16) say10(g, '😡', 'I want to go home') } return gGo10(g, { k: 'exit' }, 'gate', [gateT10()]) }
  // needs come first
  if (g.bladder > 68 && gKind10(g, 'wc')) return; if (g.nausea > 62 && (gKind10(g, 'bench') || gKind10(g, 'info'))) return;
  if (g.hunger > 60 && (gKind10(g, 'food') || gKind10(g, 'treat'))) return; if (g.thirst > 60 && gKind10(g, 'drink')) return; if (g.energy < 26 && gKind10(g, 'bench')) return;
  if (WX10[P_.wx.k].rain && !g.umb && g.cash > 12 && Math.random() < .5 && gKind10(g, 'info')) return;
  if (g.hunger > 60 && !g.saidH) { g.saidH = 1; say10(g, '🍔', 'I am hungry and there is nowhere to eat') } if (g.thirst > 60 && !g.saidT) { g.saidT = 1; say10(g, '🥤', 'I am thirsty and there is nowhere to get a drink') } if (g.bladder > 68 && !g.saidW) { g.saidW = 1; say10(g, '🚻', 'I need a restroom') }
  // then a ride: how well it suits this person, minus the wait, the walk and having done it before
  let best = null, bs = .22, exp = false, long = false; const here = g.ti;
  for (const o of P_.objs) { const R = o.rt; if (!R || !R.slots || g.skip[o.id] > g.t) continue; const inf = objInfo10(o); if (!rideOpen10(o)) continue;
    const f = field10('o' + o.id, R.entry), d = f[here]; if (d < 0) continue; const fare = fareOf10(o, inf);
    if (fare > g.cash) continue; if (fare > worth10(inf) * (1.15 + (g.ty === 3 && inf.t === 'coaster' ? .35 : 0)) * (perk10('value1') ? 1.12 : 1) * (perk10('value2') ? 1.12 : 1)) { exp = true; continue }
    const fit = inf.int < T_.lo ? 1 - (T_.lo - inf.int) / 40 : inf.int > T_.hi ? 1 - (inf.int - T_.hi) / 28 : 1; if (fit <= .05) continue;
    const wait = R.q.length / Math.max(.05, inf.cap / (inf.dur + 14)); if (wait > T_.pat * 8 || R.q.length >= R.qCap) { long = true; continue }
    const n = g.did[o.id] || 0, sc = (inf.exc / 55) * (.35 + .65 * fit) * (inf.t === 'coaster' ? T_.coaster : 1) * Math.pow(g.ty === 3 ? .78 : .52, n) * (1 - Math.min(.6, wait / (T_.pat * 9))) * (1 - Math.min(.5, d / 70)) * (.75 + Math.random() * .5) * (g.nausea > 45 ? Math.max(.2, 1 - inf.nau / 60) : 1);
    if (sc > bs) { bs = sc; best = o } }
  if (best) return gGo10(g, { k: 'ride', id: best.id }, 'o' + best.id, best.rt.entry);
  if (exp && Math.random() < .35) say10(g, '💸', 'The rides cost too much'); else if (long && Math.random() < .35) say10(g, '😤', 'The queues are too long');
  if (g.happy > 50 && g.cash > 14 && Math.random() < .3 && (!g.gift && Math.random() < .5 ? gKind10(g, 'gift') : gKind10(g, 'treat'))) return;
  if (g.rides > 0 && g.t > 70 && Math.random() < .16 + (P_.objs.some(o => o.rt && o.rt.slots && rideOpen10(o)) ? 0 : .5)) { g.leave = true; if (!P_.objs.some(o => o.rt && o.rt.slots && rideOpen10(o))) say10(g, '😕', 'There is nothing to ride'); return gGo10(g, { k: 'exit' }, 'gate', [gateT10()]) }
  // otherwise stroll to a random spot (prettier places attract more)
  const gate = field10('gate', [gateT10()]), PT = pathTiles10(); let pick = -1, pw = -1; for (let k = 0; k < 6 && PT.length; k++) { const t = PT[Math.floor(Math.random() * PT.length)]; if (gate[t] >= 0) { const w = Math.random() * (1 + TY.beauty[t] * .08); if (w > pw) { pw = w; pick = t } } }
  if (pick >= 0) gGo10(g, { k: 'stroll' }, 't' + pick, [pick]); else { g.st = 'idle'; g.useT = 1.5 }
}
// head for the nearest thing of a kind (food, drink, treat, gift, wc, info, bench). Returns false when there is none in reach.
function gKind10(g, kind) {
  const P_ = TY.park, tg = [], here = g.ti; for (const o of P_.objs) { const C = CAT10[o.k]; if (!C || !o.rt || !o.rt.linked) continue; if ((C.sells === kind || C.job === kind) && (C.job || o.open !== false) && !(g.skip[o.id] > g.t) && !(kind === 'bench' && o.rt.used >= 2)) for (const t of o.rt.entry) tg.push(t) }
  if (!tg.length) return false; const f = field10('k' + kind + '|' + tg.length + '|' + tg[0], tg); if (f[here] < 0) return false; gGo10(g, { k: kind }, 'k' + kind + '|' + tg.length + '|' + tg[0], tg); return true;
}
let _ptV = -1, _pt = [];
function pathTiles10() { if (_ptV !== TY.pathVer) { _ptV = TY.pathVer; _pt = []; for (let t = 0; t < GW10 * GH10; t++) if (TY.path[t]) _pt.push(t) } return _pt }
function gGo10(g, goal, key, targets) { g.goal = goal; g.fkey = key; g.ftg = targets; g.st = 'walk'; gStep10(g) }
// pick the next tile towards the goal (or act when already there)
function gStep10(g) {
  const f = field10(g.fkey, g.ftg), d = f[g.ti]; if (d < 0) { if (g.goal && g.goal.id) g.skip[g.goal.id] = g.t + 40; g.st = 'idle'; g.useT = .4; g.goal = null; return } if (d === 0) return gArrive10(g);
  const i = g.ti % GW10, j = (g.ti - i) / GW10; let nx = -1, n = 0; for (const [dx, dz] of NB10) { const a = i + dx, b = j + dz; if (!inG10(a, b)) continue; const k = tI10(a, b); if (f[k] === d - 1 && Math.random() < 1 / ++n) nx = k }
  if (nx < 0) { g.st = 'idle'; g.useT = .4; return } const a = nx % GW10, b = (nx - a) / GW10, dx = a - i, dz = b - j; g.ti = nx; g.tx = tX10(a) + (dz !== 0 ? g.off : g.off * .35 * dz); g.tz = tZ10(b) + (dx !== 0 ? g.off : 0); g.st = 'walk';
}
function gArrive10(g) {
  const P_ = TY.park, G_ = g.goal; if (!G_) return gDecide10(g);
  if (G_.k === 'exit') { g.st = 'out'; g.tx = tX10(GATE_I10) + g.off * .5; g.tz = HALF10 + 12; return }
  if (G_.k === 'stroll') { g.st = 'idle'; g.useT = 1.5 + Math.random() * 3; g.goal = null; return }
  if (G_.k === 'ride') { const o = TY.objById.get(G_.id); if (!o || !o.rt || !rideOpen10(o) || o.rt.q.length >= o.rt.qCap) { if (o) g.skip[o.id] = g.t + 30; if (o && o.rt && o.rt.q.length >= o.rt.qCap) { say10(g, '😤', 'The queue for ' + objName10(o) + ' is full'); g.happy -= 2 } return gDecide10(g) } o.rt.q.push(g); g.st = 'queue'; g.qo = o; g.wq = 0; return }
  // a shop, facility or bench next to this tile
  const here = g.ti, kind = G_.k; let o = null; for (const q of P_.objs) { const C = CAT10[q.k]; if (C && q.rt && q.rt.entry.includes(here) && (C.sells === kind || C.job === kind) && !(g.skip[q.id] > g.t)) { o = q; break } } if (!o) return gDecide10(g);
  const C = CAT10[o.k], w = o.rt.xf || objWorld10(o); g.yaw = Math.atan2(w.x - g.x, w.z - g.z);
  if (kind === 'bench') { o.rt.used++; g.st = 'use'; g.useT = 6 + Math.random() * 5; g.sit = 1; g.uo = o; g.energy = Math.min(100, g.energy + 38); g.nausea = Math.max(0, g.nausea - 40); return }
  const price = o.price >= 0 ? o.price : C.price, max = ({ food: 9.5, drink: 5.5, treat: 6.5, gift: 19, wc: 1.5, info: 13 })[kind] * (.8 + (g.id % 7) * .07) * (perk10('value1') ? 1.12 : 1) * (perk10('value2') ? 1.12 : 1);
  if (kind === 'info' && !(WX10[P_.wx.k].rain && !g.umb)) { g.nausea = Math.max(0, g.nausea - 60); g.st = 'use'; g.useT = 2.5; say10(g, '🩹'); return }// first aid is free
  if (price > max || price > g.cash) { say10(g, '💸', 'The ' + C.n.toLowerCase() + ' is too expensive'); g.happy -= 3; g.skip[o.id] = g.t + 60; return gDecide10(g) }
  g.cash -= price; g.spent += price; if (price > 0) earn10(kind === 'food' || kind === 'drink' || kind === 'treat' ? 'food' : 'shops', price); pay10('stock', C.unit); o.st.n++; o.st.inc += price; o.rt.sold++; P_.tot.sales++; g.st = 'use'; g.useT = 2.2;
  if (kind === 'food') { g.hunger = Math.max(0, g.hunger - 62); g.bladder += 8; g.happy += 2; g.lit = .55; say10(g, '😋') } else if (kind === 'drink') { g.thirst = Math.max(0, g.thirst - 66); g.bladder += 22; g.lit = .4 } else if (kind === 'treat') { g.hunger = Math.max(0, g.hunger - 22); g.happy += 6; g.lit = .35; say10(g, '🍦') }
  else if (kind === 'gift') { g.happy += 8; g.gift = true; say10(g, '🎁') } else if (kind === 'wc') { g.bladder = 0; g.useT = 3 } else if (kind === 'info') { g.umb = true; say10(g, '☂️') }
}
// a visitor's verdict after a ride
function gRated10(g, o, inf) {
  const T_ = GT10[g.ty], fit = inf.int < T_.lo ? 1 - (T_.lo - inf.int) / 40 : inf.int > T_.hi ? 1 - (inf.int - T_.hi) / 28 : 1, n = g.did[o.id] || 0, fp = o.rt.gateTile != null ? TY.beauty[o.rt.gateTile] : 0;
  let joy = (30 + inf.exc * .55) * (.55 + .45 * Math.max(0, fit)) * (inf.t === 'coaster' ? .9 + .12 * T_.coaster : 1) + (n ? 0 : 7) + Math.min(8, fp * .5) + (o.up ? o.up.fx * 4 : 0) - Math.min(14, g.wq * .08);
  joy = clamp(joy + rnd7(-6, 6), 0, 115); g.happy = clamp(g.happy + (joy - 44) * .24, 0, 100); g.nausea = clamp(g.nausea + inf.nau * T_.nau * rnd7(.3, .6), 0, 100); g.energy -= 3 + inf.int * .03; g.did[o.id] = n + 1; g.rides++;
  const fare = fareOf10(o, inf); if (fare > worth10(inf) * 1.02) { g.happy -= 2.5 }
  o.st.like += clamp(joy / 20, 0, 5); o.st.rated++;
  if (inf.int > T_.hi + 16) say10(g, '😱', objName10(o) + ' was too intense for me'); else if (g.nausea > 72) say10(g, '🤢', objName10(o) + ' made me feel sick'); else if (joy > 84) say10(g, '🤩', objName10(o) + ' was amazing!'); else if (joy > 62) say10(g, '😄', objName10(o) + ' was great'); else if (joy > 42) say10(g, '🙂'); else say10(g, '😐', objName10(o) + ' was a bit dull');
}
// ---- one step of everyone
const _gp = V();
function guestsStep10(dt) {
  const P_ = TY.park, W_ = WX10[P_.wx.k], rain = W_.rain ? (W_.storm ? 2 : 1) : 0, hot = P_.wx.k === 'sunny' ? 1.25 : 1, dirt = (100 - TY.clean) * .0005, list = TY.guests, closed = !parkOpen10();// after closing time people hurry home
  for (let n = list.length - 1; n >= 0; n--) {
    const g = list[n]; g.t += dt; if (g.sayT > 0) g.sayT -= dt;
    if (g.st === 'ride') continue;
    g.hunger += .2 * dt; g.thirst += .27 * hot * dt; g.bladder += .1 * dt; g.nausea = Math.max(0, g.nausea - .55 * dt); g.happy -= dirt * dt * 60; if (rain && !g.umb) g.happy -= .16 * rain * dt;
    if (g.st === 'walk' || g.st === 'out') {
      const dx = g.tx - g.x, dz = g.tz - g.z, d = Math.hypot(dx, dz), stp = g.sp * dt * (g.leave ? (closed ? 1.7 : 1.15) : 1) * (rain && !g.umb ? 1.15 : 1); g.energy -= .1 * dt; g.bob += dt * 8 * g.sp;
      if (d <= stp) { g.x = g.tx; g.z = g.tz; if (g.st === 'out') { guestLeft10(g); list[n] = list[list.length - 1]; list.pop(); continue }
        if (g.lit && Math.random() < .12) litterMaybe10(g); if (g.nausea > 88 && Math.random() < .2) { TY.litter.push({ x: g.x, z: g.z, v: 1 }); g.nausea -= 45; say10(g, '🤮', 'I was sick'); g.happy -= 6 }
        const b = TY.beauty[g.ti]; if (b > 1) g.happy = Math.min(100, g.happy + Math.min(.5, b * .03));
        if (!TY.path[g.ti]) { gRescue10(g); continue } if (g.goal && g.fkey) gStep10(g); else gDecide10(g) }
      else { g.x += dx / d * stp; g.z += dz / d * stp; g.yaw = Math.atan2(dx, dz) }
    } else if (g.st === 'queue') {
      const o = g.qo, R = o && o.rt; if (!R || !rideOpen10(o)) { gLeaveQ10(g, false); continue } const qi = R.q.indexOf(g); if (qi < 0) { g.st = 'idle'; g.useT = .2; continue }
      const sl = R.slots[Math.min(qi, R.slots.length - 1)]; if (R.wslots) _gp.set(sl[0], 0, sl[1]); else objPt10(o, sl[0], 0, sl[1], _gp); const dx = _gp.x - g.x, dz = _gp.z - g.z, d = Math.hypot(dx, dz), stp = 1.5 * dt; if (d > .05) { if (d <= stp) { g.x = _gp.x; g.z = _gp.z } else { g.x += dx / d * stp; g.z += dz / d * stp; g.yaw = Math.atan2(dx, dz); g.bob += dt * 7 } }
      g.wq += dt; if (g.wq > 30) g.happy -= (.04 - Math.min(.025, TY.beauty[R.gateTile || 0] * .002)) * dt; if (g.wq > GT10[g.ty].pat * 10) { say10(g, '😤', 'I waited too long for ' + objName10(o)); g.happy -= 6; gLeaveQ10(g, true) }
    } else if (g.st === 'use' || g.st === 'idle') { g.useT -= dt; if (g.useT <= 0) { if (g.sit) { g.sit = 0; if (g.uo && g.uo.rt) g.uo.rt.used = Math.max(0, g.uo.rt.used - 1); g.uo = null } gDecide10(g) } }
    else if (g.st === 'board') { const dx = g.tx - g.x, dz = g.tz - g.z, d = Math.hypot(dx, dz), stp = 2 * dt; if (d <= stp) { g.st = 'ride'; g.hide = true } else { g.x += dx / d * stp; g.z += dz / d * stp; g.y += (g.ty_ - g.y) * Math.min(1, stp / d); g.yaw = Math.atan2(dx, dz); g.bob += dt * 8 } }
  }
}
function gLeaveQ10(g, angry) { const R = g.qo && g.qo.rt; if (R) { const i = R.q.indexOf(g); if (i >= 0) R.q.splice(i, 1); g.skip[g.qo.id] = g.t + 45 } g.qo = null; g.st = 'idle'; g.useT = .3; if (!TY.path[g.ti]) gRescue10(g) }
// someone standing where a path was removed is put back on the nearest path
function gRescue10(g) { const i0 = xT10(g.x), j0 = zT10(g.z); for (let r = 0; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const i = i0 + di, j = j0 + dj; if (inG10(i, j) && TY.path[tI10(i, j)]) { g.ti = tI10(i, j); g.tx = tX10(i); g.tz = tZ10(j); g.st = 'walk'; g.goal = null; g.fkey = 't' + g.ti; g.ftg = [g.ti]; g.goal = { k: 'stroll' }; return } } g.ti = gateT10(); g.x = tX10(GATE_I10); g.z = tZ10(GATE_J10); g.st = 'idle'; g.useT = .2 }
function litterMaybe10(g) { const p = g.lit * (perk10('tidy2') ? .65 : 1); g.lit = 0; if (Math.random() > p || TY.litter.length > 220) return; const i = g.ti % GW10, j = (g.ti - i) / GW10; for (const o of TY.park.objs) if (o.k === 'bin' && Math.abs(o.x - i) <= 3 && Math.abs(o.z - j) <= 3) return; TY.litter.push({ x: g.x + rnd7(-.8, .8), z: g.z + rnd7(-.8, .8), v: 0 }) }
function guestLeft10(g) { const P_ = TY.park; P_.rep = clamp(P_.rep + (clamp(g.happy, 0, 100) - P_.rep) * .012, 0, 100); TY.day.left++; TY.day.happySum += g.happy; if (g.happy > 62) xp10(1); if (g.qo) gLeaveQ10(g) }
// ---- rides: load from the queue, run, unload
function trainPose10(p, s_, oP, oU, oT) { const f = (((s_ % p.L) + p.L) % p.L) / p.L * N, i = Math.floor(f) % N, j = (i + 1) % N, a = f - Math.floor(f), P_ = p.pts, U_ = p.up; oP.set(P_[i * 3] + (P_[j * 3] - P_[i * 3]) * a, P_[i * 3 + 1] + (P_[j * 3 + 1] - P_[i * 3 + 1]) * a, P_[i * 3 + 2] + (P_[j * 3 + 2] - P_[i * 3 + 2]) * a); oU.set(U_[i * 3] + (U_[j * 3] - U_[i * 3]) * a, U_[i * 3 + 1] + (U_[j * 3 + 1] - U_[i * 3 + 1]) * a, U_[i * 3 + 2] + (U_[j * 3 + 2] - U_[i * 3 + 2]) * a); const k = (i + 2) % N, h = (i + N - 1) % N; oT.set(P_[k * 3] - P_[h * 3], P_[k * 3 + 1] - P_[h * 3 + 1], P_[k * 3 + 2] - P_[h * 3 + 2]).normalize(); oU.addScaledVector(oT, -oU.dot(oT)).normalize() }
function lapS10(p, tau) { const t = p.lapT, s_ = p.lapS; let lo = 0, hi = t.length - 1; if (tau >= t[hi]) return s_[hi]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t[m] <= tau) lo = m; else hi = m } return s_[lo] + (s_[hi] - s_[lo]) * (tau - t[lo]) / Math.max(1e-6, t[hi] - t[lo]) }
function boardOne10(o, inf, into, yB) {// the front of the queue pays, walks to the platform and gets on
  const R = o.rt, g = R.q.shift(), fare = fareOf10(o, inf); if (g.cash < fare) { g.st = 'idle'; g.useT = .3; g.qo = null; return false }
  g.cash -= fare; g.spent += fare; g.fare = fare; earn10('rides', fare); o.st.n++; o.st.inc += fare; TY.park.tot.rides++; TY.day.rides++; R.waitAvg += (g.wq - R.waitAvg) * .15;
  if (R.wboard) _gp.set(R.wboard[0] + rnd7(-1.2, 1.2), 0, R.wboard[1] + rnd7(-1.2, 1.2)); else objPt10(o, R.board[0], 0, R.board[2], _gp); g.st = 'board'; g.tx = _gp.x; g.tz = _gp.z; g.ty_ = yB; g.qo = null; g.ro = o; into.push(g); return true;
}
function unload10(o, inf, riders, refund) { const R = o.rt; let k = 0; for (const g of riders) { if (R.wexit) _gp.set(R.wexit[0] + rnd7(-.8, .8), 0, R.wexit[1] + rnd7(-.8, .8)); else objPt10(o, R.exit[0] + (k % 2) * .5, 0, R.exit[1] - (k >> 1) * .5, _gp); g.x = _gp.x; g.z = _gp.z; g.y = 0; g.hide = false; g.ro = null; g.ti = R.gateTile != null ? R.gateTile : g.ti; g.tx = tX10(g.ti % GW10) + g.off * .5; g.tz = tZ10(Math.floor(g.ti / GW10)); g.st = 'walk'; g.goal = null; g.fkey = 't' + g.ti; g.ftg = [g.ti]; g.goal = { k: 'stroll' }; if (refund) { const f = g.fare || 0; if (f > 0) { pay10('refund', f); g.cash += f; g.spent -= f } g.happy -= 3; g.skip[o.id] = g.t + 60; if (k === 0) say10(g, '🔧', objName10(o) + ' broke down before we set off') } else gRated10(g, o, inf); g.fare = 0; k++ } riders.length = 0 }
// a broken ride never keeps people on board: trains already out on the track come home and unload; people who paid but never set off get off with their money back
function evac10(o, inf, dt) {
  const R = o.rt;
  if (inf.t === 'flat') { if (!R.riders.length) return; if (R.ph === 'run') { R.t += dt; R.animT += dt; if (R.t >= inf.dur) { R.ph = 'load'; R.t = 0; unload10(o, inf, R.riders) } } else unload10(o, inf, R.riders, true); return }
  const p = inf.prof, T_ = p.lapT[p.lapT.length - 1], s0 = p.SL - .7;
  for (const tr of R.trains) { if (!tr.riders.length) continue;
    if (tr.ph === 'run' && tr.tau < T_) { tr.tau = Math.min(T_, tr.tau + dt / p.tk); tr.s = tr.tau >= T_ ? s0 - 6.2 : s0 + lapS10(p, tr.tau) * p.sc; continue }
    unload10(o, inf, tr.riders, tr.ph === 'load') }
}
function ridesStep10(dt) {
  const P_ = TY.park, open = parkOpen10(), dh = dt * SIM10.minPerSec / 60;// park hours in this step
  for (const o of P_.objs) {
    const R = o.rt; if (!R) continue; const inf = objInfo10(o); if (!inf || inf.t === 'deco') continue;
    const runs = o.open !== false && open && R.linked;
    if (runs && !R.broken) { const c = (inf.t === 'coaster' ? 6 : inf.t === 'flat' ? 3 : inf.run) * dh; pay10(inf.t === 'shop' || inf.t === 'fac' ? 'run' : 'wages', c); o.st.run += c }
    if (inf.t === 'shop' || inf.t === 'fac') continue;
    if (R.broken) { o.st.down += dt; evac10(o, inf, dt); continue }
    if (R.insp > 0) { R.insp -= dt; if (R.insp <= 0) { o.rel = 100; pay10('repair', 40 + inf.cost * .004) } continue }
    const loadGap = .3 * (perk10('ops1') ? .75 : 1) * (1 - .12 * (o.up ? o.up.cap : 0));
    if (inf.t === 'flat') {
      if (R.ph === 'load') { R.t += dt; R.tmr -= dt; if (runs && R.riders.length < inf.cap + 2 * (o.up ? o.up.cap : 0) && R.q.length && R.tmr <= 0 && nearSlot10(o, R.q[0])) { boardOne10(o, inf, R.riders, .1); R.tmr = loadGap }
        const full = R.riders.length >= inf.cap + 2 * (o.up ? o.up.cap : 0), ready = R.riders.length && R.riders.every(g => g.st === 'ride'); if (ready && (full || R.t > 9 && !R.q.length || R.t > 16)) { R.ph = 'run'; R.t = 0; wear10(o, inf) } }
      else if (R.ph === 'run') { R.t += dt; R.animT += dt; if (R.t >= inf.dur) { R.ph = 'load'; R.t = 0; unload10(o, inf, R.riders); if (!breakMaybe10(o, inf)) xp10(.2) } }
    } else {
      const p = inf.prof, s0 = p.SL - .7; let busy = R.trains.some(t => t.ph === 'load' || t.ph === 'unload');
      R.trains.forEach((tr, k) => {
        if (tr.ph === 'hold') { tr.s = s0 - 6.2; if (!busy && R.trains[0].ph === 'run' && R.trains[0].tau > p.lapT[p.lapT.length - 1] * .45) { tr.ph = 'load'; tr.wait = 0; busy = true } }
        else if (tr.ph === 'load') { tr.s = s0; tr.wait += dt; R.tmr -= dt; if (runs && tr.riders.length < p.seats && R.q.length && R.tmr <= 0 && nearSlot10(o, R.q[0])) { boardOne10(o, inf, tr.riders, p.yP); R.tmr = loadGap }
          const full = tr.riders.length >= p.seats, ready = tr.riders.length && tr.riders.every(g => g.st === 'ride'), behind = R.trains.some(q => q !== tr && q.ph === 'run' && q.riders.length && q.tau >= p.lapT[p.lapT.length - 1]);
          if (ready && (full || tr.wait > 9 && !R.q.length || tr.wait > 18 || behind && tr.wait > 4) || behind && !tr.riders.length && tr.wait > 1.5) { tr.ph = 'run'; tr.tau = 0; wear10(o, inf) } }
        else if (tr.ph === 'run') { tr.tau += dt / p.tk; const T_ = p.lapT[p.lapT.length - 1]; if (tr.tau >= T_) { if (busy) { tr.tau = T_; tr.s = s0 - 6.2 } else { tr.ph = 'unload'; tr.wait = 0; tr.s = s0; busy = true } } else tr.s = s0 + lapS10(p, tr.tau) * p.sc }
        else if (tr.ph === 'unload') { tr.wait += dt; if (tr.wait > 1.6) { unload10(o, inf, tr.riders); tr.ph = 'load'; tr.wait = 0; if (!breakMaybe10(o, inf)) xp10(.3) } }
      });
    }
    // an idle, worn ride gets an inspection when a mechanic is free
    if (o.rel < 55 && !R.q.length && R.ph === 'load' && !(R.trains && R.trains.some(t => t.riders.length)) && !(R.riders && R.riders.length) && mechFree10()) { R.insp = 9 * (perk10('mech1') ? .7 : 1); toast10('🛠 ' + objName10(o) + ' is closed for a short inspection', 'insp' + o.id) }
  }
}
const nearSlot10 = (o, g) => { const sl = o.rt.slots[0]; if (o.rt.wslots) _gp.set(sl[0], 0, sl[1]); else objPt10(o, sl[0], 0, sl[1], _gp); return g.st === 'queue' && Math.hypot(_gp.x - g.x, _gp.z - g.z) < .5 };
function wear10(o, inf) { const pw = (inf.t === 'coaster' ? inf.run : inf.run * .12) * (perk10('ops2') ? .88 : 1); pay10('run', pw); o.st.run += pw; o.age = (o.age || 0) + 1; o.rel = Math.max(0, o.rel - (inf.t === 'coaster' ? .9 : .6) * (1 - .22 * (o.up ? o.up.rel : 0))) }
function breakMaybe10(o, inf) {
  const R = o.rt, p = Math.pow((100 - o.rel) / 100, 2) * .22 * (perk10('mech2') ? .7 : 1); if (TY.park.mode === 'sandbox' && !TY.park.seen.breaks || Math.random() > p) return false;
  R.broken = 1; R.fix = 0; R.q.slice().forEach(g => { g.happy -= 4; if (Math.random() < .4) say10(g, '🔧', objName10(o) + ' broke down while I was waiting'); gLeaveQ10(g, true) });
  toast10('🔧 ' + objName10(o) + ' has broken down' + (TY.park.staff.mech ? ' — a mechanic is on the way' : ' — hire a mechanic to repair it'), 'brk' + o.id, true); return true;
}
// ---- staff: janitors sweep litter, mechanics walk to broken rides. They are people on the paths too.
function staffSync10() {
  const P_ = TY.park, want = { jan: P_.staff.jan, mech: P_.staff.mech }; for (const k of ['jan', 'mech']) { let have = TY.staff.filter(s_ => s_.k === k); while (have.length > want[k]) { const s_ = have.pop(); TY.staff.splice(TY.staff.indexOf(s_), 1) } while (have.length < want[k]) { const s_ = { k, x: tX10(GATE_I10) + rnd7(-1, 1), z: tZ10(GATE_J10 - 1) + rnd7(-1, 1), ti: tI10(GATE_I10, GATE_J10 - 1), tx: 0, tz: 0, st: 'idle', t: 0, job: null, yaw: 0, bob: 0, off: rnd7(-1, 1) }; s_.tx = s_.x; s_.tz = s_.z; TY.staff.push(s_); have.push(s_) } }
}
const mechFree10 = () => TY.staff.some(s_ => s_.k === 'mech' && !s_.job);
function staffStep10(dt) {
  const P_ = TY.park;
  for (const s_ of TY.staff) {
    s_.t -= dt;
    if (s_.st === 'work') { if (s_.t <= 0) { if (s_.k === 'jan') { const i = TY.litter.indexOf(s_.job); if (i >= 0) TY.litter.splice(i, 1) } else if (s_.job && s_.job.rt) { const o = s_.job, inf = objInfo10(o); o.rt.broken = 0; o.rel = Math.min(100, o.rel + 40); pay10('repair', Math.round(120 + inf.cost * .012)); toast10('✅ ' + objName10(o) + ' is repaired and running again', 'fix' + o.id) } s_.job = null; s_.st = 'idle'; s_.t = .5 } continue }
    if (!s_.job && s_.t <= 0) {// look for work
      if (s_.k === 'jan' && TY.litter.length) { let b = null, bd = 1e9; for (const l of TY.litter) { if (l.who && l.who !== s_) continue; const d = Math.hypot(l.x - s_.x, l.z - s_.z) * (l.v ? .5 : 1); if (d < bd) { bd = d; b = l } } if (b) { b.who = s_; s_.job = b; s_.goal = tI10(clamp(xT10(b.x), 0, GW10 - 1), clamp(zT10(b.z), 0, GH10 - 1)) } }
      else if (s_.k === 'mech') { const o = P_.objs.find(q => q.rt && q.rt.broken === 1 && q.rt.linked); if (o) { o.rt.broken = 2; s_.job = o; s_.goal = o.rt.gateTile } }
      if (!s_.job) { const gate = field10('gate', [gateT10()]), PT = pathTiles10(); for (let k = 0; k < 4 && PT.length; k++) { const t = PT[Math.floor(Math.random() * PT.length)]; if (gate[t] >= 0) { s_.goal = t; break } } s_.t = 4 + Math.random() * 4 }
    }
    // walk: tile by tile towards the goal
    const dx = s_.tx - s_.x, dz = s_.tz - s_.z, d = Math.hypot(dx, dz), stp = (s_.k === 'jan' && perk10('tidy1') ? 2.5 : 1.9) * dt;
    if (d > stp) { s_.x += dx / d * stp; s_.z += dz / d * stp; s_.yaw = Math.atan2(dx, dz); s_.bob += dt * 9; continue } s_.x = s_.tx; s_.z = s_.tz;
    if (!TY.path[s_.ti]) { const g = { x: s_.x, z: s_.z }; gRescue10(g); s_.ti = g.ti; s_.tx = g.tx; s_.tz = g.tz; continue }
    if (s_.goal == null || !TY.path[s_.goal]) { if (s_.job && s_.k === 'jan') { s_.st = 'work'; s_.t = 1.1 } continue }
    const f = field10('t' + s_.goal, [s_.goal]), dd = f[s_.ti];
    if (dd <= 0) { if (s_.job) { if (s_.k === 'jan') { s_.tx = s_.job.x; s_.tz = s_.job.z; if (Math.hypot(s_.tx - s_.x, s_.tz - s_.z) < .3 || dd < 0) { s_.st = 'work'; s_.t = perk10('tidy1') ? .7 : 1.1 } } else { s_.st = 'work'; s_.t = 14 * (perk10('mech1') ? .7 : 1) * (1 - .1 * (s_.job.up ? s_.job.up.rel : 0)) } } s_.goal = null; continue }
    const i = s_.ti % GW10, j = (s_.ti - i) / GW10; for (const [ax, az] of NB10) { const a = i + ax, b = j + az; if (inG10(a, b) && f[tI10(a, b)] === dd - 1) { s_.ti = tI10(a, b); s_.tx = tX10(a) + s_.off; s_.tz = tZ10(b) + s_.off; break } }
  }
}
// ---- the clock, the weather, arrivals, the books
function newDay10() { return { guests: 0, left: 0, happySum: 0, rides: 0, turned: 0, peak: 0 } }
const WXNEXT10 = { sunny: ['sunny', 'sunny', 'sunny', 'cloudy', 'cloudy', 'fog'], cloudy: ['sunny', 'sunny', 'cloudy', 'rain', 'rain', 'fog'], rain: ['cloudy', 'cloudy', 'rain', 'storm', 'sunny'], storm: ['rain', 'rain', 'cloudy'], fog: ['sunny', 'cloudy', 'cloudy'] };
function setWx10(k, user) { const P_ = TY.park; if (!WX10[k] || P_.wx.k === k) return; P_.wx.k = k; P_.wx.until = P_.day * 1440 + P_.min + 90 + Math.random() * 200; tyWxApply10(); if (!user) toast10(WX10[k].ic + ' Weather: ' + WX10[k].n.toLowerCase() + (WX10[k].come < .7 ? ' — fewer visitors will come' : ''), 'wx'); if (k === 'rain' || k === 'storm') TY.guests.forEach(g => { if (!g.umb && Math.random() < .12) say10(g, '☔', 'It is raining') }) }
function clockStep10(dt) {
  const P_ = TY.park, open = parkOpen10(), night = P_.min >= SIM10.close + 30 || P_.min < SIM10.open - 60, empty = !TY.guests.length;
  if (P_.clock.auto !== false || TY.visit) P_.min += dt * SIM10.minPerSec * (night && empty ? 9 : 1);
  if (P_.min >= 1440) { P_.min -= 1440; P_.day++ }
  if (!TY.dayOpen && P_.min >= SIM10.open && P_.min < SIM10.close) { TY.dayOpen = true; TY.day = newDay10(); if (P_.min < SIM10.open + 8) toast10('🌅 Day ' + P_.day + ': the park is open', 'day') }
  if (TY.dayOpen && P_.min >= SIM10.close) { TY.dayOpen = false; TY.guests.forEach(g => { g.leave = true }); endDay10() }
  if (P_.wx.auto !== false && P_.day * 1440 + P_.min > P_.wx.until) setWx10(pickR10(WXNEXT10[P_.wx.k] || ['sunny']));
  // wages and arrivals only while open
  if (open) { const dh = dt * SIM10.minPerSec / 60; pay10('wages', (P_.staff.jan * SIM10.wageJan + P_.staff.mech * SIM10.wageMech) * dh); if (P_.promo > 0) P_.promo = Math.max(0, P_.promo - dt) }
  if (open && TY.guests.length < maxGuests10()) { TY.arr += arrivalRate10() * dt; while (TY.arr >= 1) { TY.arr -= 1; guestSpawn10() } } else TY.arr = Math.min(TY.arr, .9);
  TY.day.peak = Math.max(TY.day.peak, TY.guests.length);
}
function maxGuests10() { let m = 24; for (const o of TY.park.objs) { const inf = objInfo10(o); if (!inf || !o.rt || !o.rt.linked) continue; m += inf.t === 'coaster' ? inf.cap * 2.4 : inf.t === 'flat' ? inf.cap * 1.6 : inf.t === 'deco' ? .15 : 5 } return Math.min(SIM10.maxG, Math.round(m)) }
function arrivalRate10() { const P_ = TY.park, n = P_.objs.reduce((a, o) => { const i = objInfo10(o); return a + (i && o.rt && o.rt.linked && rideOpen10(o) ? (i.t === 'coaster' ? 2 : i.t === 'flat' ? 1 : 0) : 0) }, 0), h = P_.min / 60, curve = .55 + .45 * Math.exp(-(((h - 12.5) / 3.2) ** 2)) - (h > 19 ? (h - 19) * .28 : 0);
  return Math.max(0, (.06 + P_.rep * .005) * (1 + Math.min(14, n) * .16) * WX10[P_.wx.k].come * curve * (1 + .12 * (perk10('mk1') + perk10('mk2') + perk10('mk3'))) * (P_.promo > 0 ? 1.5 : 1) * (n ? 1 : .15)) }
function ratingNow10() {
  const P_ = TY.park, G_ = TY.guests; let hs = 0; for (const g of G_) hs += g.happy; const happy = G_.length ? hs / G_.length : (TY.lastHappy || 55);
  let ex = 0, kinds = new Set(), nr = 0, wsum = 0; for (const o of P_.objs) { const inf = objInfo10(o); if (!inf || !o.rt || !o.rt.slots || !o.rt.linked) continue; ex += inf.exc * (inf.t === 'coaster' ? 1.5 : 1); kinds.add(o.k); nr++; wsum += o.rt.q.length / Math.max(1, o.rt.qCap) }
  let bs = 0, bn = 0; for (let k = 0; k < GW10 * GH10; k++) if (TY.path[k]) { bs += Math.min(12, TY.beauty[k]); bn++ }
  const rides = Math.min(100, ex / 7 + kinds.size * 3.5), scen = bn ? Math.min(100, bs / bn * 14) : 0, q = nr ? 100 - Math.min(100, wsum / nr * 80) : 60, value = clamp(100 - Math.max(0, P_.fee - (8 + rides * .22)) * 4, 0, 100);
  TY.rate = { happy, rides, clean: TY.clean, scen, value, q }; return clamp(.36 * happy + .22 * rides + .14 * TY.clean + .1 * scen + .1 * value + .08 * q, 0, 100);
}
function endDay10() {
  const P_ = TY.park, d = TY.day, interest = P_.loan * .012; if (interest > 0) pay10('loan', interest);
  const happy = d.left ? d.happySum / d.left : (TY.lastHappy || 55); TY.lastHappy = happy; P_.rating = ratingNow10(); P_.rep = clamp(P_.rep + (P_.rating - P_.rep) * .12, 0, 100);
  const tot = ledSum10(P_.led), rec = { day: P_.day, inc: Math.round(tot.inc), exp: Math.round(tot.exp), guests: d.guests, peak: d.peak, rating: Math.round(P_.rating), happy: Math.round(happy), money: Math.round(P_.money), wx: P_.wx.k };
  P_.hist.push(rec); if (P_.hist.length > 40) P_.hist.shift(); TY.lastDay = { ...rec, led: JSON.parse(JSON.stringify(P_.led)), rides: d.rides, turned: d.turned };
  const profit = tot.inc - tot.exp; xp10(Math.max(0, profit) / 350 + d.guests * .05); P_.led = newLed10(); goals10(); savePark10();
  if (TY.on && !TY.visit) dayCard10(TY.lastDay); if (P_.mode === 'career' && profit > 0) stat72('tyDays');
}
// ---- progression: park XP → level → unlocks and perk stars. Milestones pay cash. Also feeds the game's own XP and coins.
const lvNeed10 = l => Math.round(110 * Math.pow(l, 1.55));
function level10(P_ = TY.park) { let l = 1, x = P_ ? P_.xp : 0; while (x >= lvNeed10(l) && l < 30) { x -= lvNeed10(l); l++ } return { lv: P_ && P_.mode === 'sandbox' ? 30 : l, into: x, need: lvNeed10(l) } }
function xp10(n) { const P_ = TY.park; if (!P_ || TY.visit || P_.mode === 'sandbox' || !(n > 0)) return; const a = level10().lv; P_.xp += n; const b = level10().lv; if (b > a) { toast10('⭐ Park level ' + b + '! New things to build and a perk star', 'lvl', true); try { sfx('unlock'); award72(40, 25, 'park level') } catch (e) {} if (TY.on) { confettiSmall(); tyUi10() } } }
const PERKS10 = [
  ['mk1', '📣', 'Local adverts', 'About 12% more visitors', 1, 'Marketing'], ['mk2', '📺', 'TV spot', 'Another 12% more visitors', 2, 'Marketing'], ['mk3', '🌐', 'Going viral', 'Another 12% more visitors', 3, 'Marketing'],
  ['ops1', '⏱', 'Fast loading', 'Rides load 25% faster', 1, 'Operations'], ['ops2', '🔌', 'Efficient motors', 'Running costs down 12%', 2, 'Operations'], ['mech1', '🧰', 'Trained mechanics', 'Repairs and inspections 30% faster', 1, 'Operations'], ['mech2', '🛡', 'Preventive care', '30% fewer breakdowns', 2, 'Operations'],
  ['tidy1', '🧹', 'Quick sweepers', 'Janitors work 30% faster', 1, 'Guests'], ['tidy2', '♻️', 'Tidy visitors', 'A third less litter', 1, 'Guests'], ['value1', '💎', 'Premium feel', 'Visitors accept 12% higher prices', 2, 'Guests'], ['value2', '👑', 'World famous', 'Another 12% on prices', 3, 'Guests'], ['vip', '💳', 'Big spenders', 'Visitors bring 20% more cash', 2, 'Guests']];
const starsLeft10 = () => { const P_ = TY.park; let used = 0; PERKS10.forEach(p => { if (P_.perks[p[0]]) used += p[4] }); return (P_.mode === 'sandbox' ? 99 : level10().lv - 1) - used };
const GOALS10 = [// career milestones, in order. test() reads the live park; each pays once.
  ['g1', 'Open your first ride', 'Build a ride and connect it to a path', 500, () => TY.park.objs.some(o => o.rt && o.rt.slots && o.rt.linked)],
  ['g2', 'First visitors', 'Have 15 visitors in the park at once', 600, () => TY.guests.length >= 15],
  ['g3', 'Feed them', 'Build a food stall and a drinks stand', 500, () => ['food', 'drink'].every(k => TY.park.objs.some(o => CAT10[o.k] && CAT10[o.k].sells === k && o.rt && o.rt.linked))],
  ['g4', 'Your first coaster', 'Build a roller coaster', 1500, () => TY.park.objs.some(o => o.k[1] === ':' && o.rt && o.rt.linked)],
  ['g5', 'A good day', 'Finish a day with a profit', 1000, () => TY.park.hist.some(h => h.inc > h.exp)],
  ['g6', 'Getting popular', '60 visitors at once', 1500, () => TY.guests.length >= 60],
  ['g7', 'Well liked', 'Reach a park rating of 60', 2000, () => TY.park.rating >= 60],
  ['g8', 'Room to grow', 'Buy two more plots of land', 1500, () => landCount10(TY.park) >= 10],
  ['g9', 'Three coasters', 'Have three coasters running', 4000, () => TY.park.objs.filter(o => o.k[1] === ':' && o.rt && o.rt.linked).length >= 3],
  ['g10', 'Big business', 'Earn $8,000 in one day', 3000, () => TY.park.hist.some(h => h.inc >= 8000)],
  ['g11', 'Crowd puller', '150 visitors at once', 5000, () => TY.guests.length >= 150],
  ['g12', 'Five-star park', 'Reach a park rating of 80', 6000, () => TY.park.rating >= 80],
  ['g13', 'Flagship', 'Build Thunder Comet or Nova Giant', 8000, () => TY.park.objs.some(o => o.k === 'c:Thunder Comet' || o.k === 'c:Nova Giant')],
  ['g14', 'Tycoon', 'Have $100,000 in the bank', 10000, () => TY.park.money >= 100000]];
function goals10() { const P_ = TY.park; if (!P_ || P_.mode !== 'career' || TY.visit) return; for (const [id, n, , cash, test] of GOALS10) { if (P_.goals[id]) continue; let ok = false; try { ok = test() } catch (e) {} if (!ok) break; P_.goals[id] = P_.day; earn10('prize', cash); toast10('🎯 Goal reached: ' + n + ' — bonus ' + money10(cash), 'goal' + id, true); xp10(30); try { sfx('ach'); award72(25, 15, 'park goal') } catch (e) {} achTy10() } }
ACH.push(['ty_open', '🏗', 'Park owner', 'Open a ride in My Park.'], ['ty_coaster', '🎢', 'Coaster tycoon', 'Run three coasters in My Park.'], ['ty_five', '🌟', 'Five-star park', 'Reach a park rating of 80 in My Park.'], ['ty_share', '🔗', 'Open house', 'Share your park with a code.'], ['ty_visit', '🧳', 'Tourist', 'Visit someone else’s park.']);
function achGet10(k) { try { if (PRG.ach[k]) return; PRG.ach[k] = Date.now(); save7(); achToast(k) } catch (e) {} }
function achTy10() { const G_ = TY.park.goals; if (G_.g1) achGet10('ty_open'); if (G_.g9) achGet10('ty_coaster'); if (G_.g12) achGet10('ty_five') }
// ---- the frame: advance the simulation in small steps, then draw people, trains and effects
TY.thoughts = {}; TY.day = newDay10(); TY.arr = 0; TY.clean = 100; TY.rate = {};
function tySim10(raw) {
  const P_ = TY.park, sp = TY.visit ? 1 : P_.speed; if (!sp) return; let left = Math.min(raw, .1) * sp, n = 0;
  while (left > 1e-4 && n < 6) { const dt = Math.min(.1, left); left -= dt; n++; clockStep10(dt); ridesStep10(dt); guestsStep10(dt); staffStep10(dt) }
  TY.simT += raw; TY.clean = clamp(100 - TY.litter.reduce((a, l) => a + (l.v ? 3 : 1), 0) * 1.1, 0, 100);
  if ((TY.rt_ = (TY.rt_ || 0) - raw) <= 0) { TY.rt_ = 1; P_.rating += (ratingNow10() - P_.rating) * .2; if (TY.linkVer !== TY.pathVer) linkAll10(); goals10(); for (const k in TY.thoughts) TY.thoughts[k] *= .985 }
}
TICKS72.push((dt, raw) => {
  if (!TY.on) return; const t0 = performance.now();
  if (TY.decoDirty > 0) { TY.decoDirty -= raw; if (TY.decoDirty <= 0) decoRebuild10() }
  tySim10(raw); tyDraw10(dt); tyLight10(dt); tyInputTick10(dt); tyHud10(raw);
  saveT10 += raw; if (saveT10 > 8) { saveT10 = 0; savePark10() }
  TY.perf.ms += (performance.now() - t0 - TY.perf.ms) * .05;
});
addEventListener('pagehide', () => { if (TY.on) savePark10() }); document.addEventListener('visibilitychange', () => { if (document.hidden && TY.on) savePark10() });
