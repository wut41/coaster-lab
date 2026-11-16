// ---- 10.1 MY PARK — running the park by the numbers. Nothing here replaces the simulation: it counts what already
// happens, keeps a week of books, and turns both into things the player can act on.
//  · 📊 Reports (a new Park Office tab): yesterday at a glance, a week of income and costs by category, what every
//    ride and stall earns (today, yesterday, since it was built, and when it pays for itself), queues (waits, people who
//    skipped or gave up, people who found it too dear), why visitors went home, and how busy the staff were. CSV export.
//  · 🧭 Park Advisor (on Overview): up to five suggestions, each worked out from those numbers, with the reason.
//  · 🔔 Recent events (on Overview): the important messages of the last days, so nothing is lost when a toast fades.
//  · Visitors tab: mood by visitor type and what is bothering people right now.
//  · Staff: a free mechanic goes to the broken ride that matters most (not the one built first); an optional policy
//    services worn rides before they break; a note on how busy the staff really were.
//  · Queues: a ride's line can be kept short (half length), so fewer people wait a long time.
//  · Visitors comment on what they notice (litter, rain, pretty places, the park at night, running out of money), which
//    feeds "what visitors are saying".
//  · Safety net (from the park-build line): a visitor whose decide → walk → arrive chain keeps restarting pauses for a
//    moment instead of looping until the browser runs out of stack.
// Saved with the park (all optional, ignored by older versions): per thing st.d0 / st.y (the books at the start of today
// and for yesterday) and ql (short line); for the park wk (a week of daily books) and pol (staff policy).
// ---------------------------------------------------------------------------------------------------------------------
const PRO10 = { loopStops: 0, log: [], logKey: {}, day: null, staff: null, staffY: null, fix: { sum: 0, n: 0 }, fixY: null, t1: 0, tSay: 0, bench: [-1, false], told: {} };
// ---- safety net for the visitor loop
// (the same wrap notes WHY a visitor decides to go home, at the moment they decide: by the time they reach the gate
// their mood, money and the clock have all moved on)
const whyNow10 = g => { const P_ = TY.park, hasRides = P_.objs.some(o => o.rt && o.rt.slots); if (g.L && g.L.leave && g.L.why10) return g.L.why10;// a family leaves together, for the leader's reason
  return g.happy < 16 ? 'unhappy' : g.cash < 2 ? 'broke' : g.energy < 5 ? 'tired' : !parkOpen10() ? 'closing' : !g.rides && hasRides ? 'norides' : g.t > g.stay ? 'done' : g.rides > 0 ? 'enough' : 'other' };
{ const d0 = gDecide10; gDecide10 = function (g) {
  if ((g._dd10 || 0) >= 6) { g.st = 'idle'; g.useT = .5 + Math.random() * .5; g.goal = null; PRO10.loopStops++; return }
  const was = g.leave; g._dd10 = (g._dd10 || 0) + 1; try { return d0.apply(this, arguments) } finally { g._dd10--; if (!was && g.leave && !g.why10) try { g.why10 = whyNow10(g) } catch (e) {} }
} }
// ---- what is saved with the park
const tri10 = a => Array.isArray(a) && a.length === 3 && a.every(x => typeof x === 'number' && isFinite(x)) ? [numP10(a[0], 0, 0, 1e9), numP10(a[1], 0, 0, 1e12), numP10(a[2], 0, 0, 1e12)] : null;
const WHY10 = [['done', '🙂', 'Had a full day'], ['enough', '🎢', 'Rode what they wanted'], ['closing', '🌙', 'The park closed'], ['broke', '👛', 'Ran out of money'], ['unhappy', '😡', 'Left unhappy'], ['tired', '🥱', 'Too tired'], ['norides', '🎟', 'Never got on a ride'], ['other', '🚪', 'Other reasons']];
{ const c0 = cleanPark10; cleanPark10 = function (o, mode) {
  const P_ = c0(o, mode); if (!P_ || !o || typeof o !== 'object') return P_;
  if (Array.isArray(o.objs)) { const raw = new Map(); for (const q of o.objs) if (q && typeof q === 'object' && Number.isInteger(q.id)) raw.set(q.id, q);
    for (const b of P_.objs) { const q = raw.get(b.id); if (!q || !b.st) continue; const d0 = tri10(q.st && q.st.d0), y = tri10(q.st && q.st.y); if (d0) b.st.d0 = d0; if (y) b.st.y = y; if (q.ql === 1) b.ql = 1 } }
  P_.pol = { insp: o.pol && typeof o.pol === 'object' && o.pol.insp === 1 ? 1 : 0 };
  P_.wk = Array.isArray(o.wk) ? o.wk.filter(d => d && typeof d === 'object' && d.inc && d.exp && typeof d.inc === 'object' && typeof d.exp === 'object').slice(-7).map(d => {
    const r = { day: Math.round(numP10(d.day, 1, 1, 1e6)), inc: {}, exp: {}, guests: Math.round(numP10(d.guests, 0, 0, 1e7)), left: Math.round(numP10(d.left, 0, 0, 1e7)), spend: numP10(d.spend, 0, 0, 1e6), rides: numP10(d.rides, 0, 0, 1e4), happy: numP10(d.happy, 0, 0, 100), why: {} };
    for (const k of INC10) r.inc[k[0]] = Math.round(numP10(d.inc[k[0]], 0, 0, 1e12)); for (const k of EXP10) r.exp[k[0]] = Math.round(numP10(d.exp[k[0]], 0, 0, 1e12));
    for (const k of WHY10) r.why[k[0]] = Math.round(numP10(d.why && d.why[k[0]], 0, 0, 1e7)); return r }) : [];
  return P_;
} }
// ---- counting what happens during the day
const proDay10 = () => { const P_ = TY.park; if (!PRO10.day || PRO10.day.n !== P_.day || PRO10.day.id !== P_.id) PRO10.day = { n: P_.day, id: P_.id, left: 0, spend: 0, rides: 0, why: {} }; return PRO10.day };
{ const l0 = guestLeft10; guestLeft10 = function (g) {
  safe10('leave count', () => { if (TY.visit) return; const P_ = TY.park, d = proDay10(), hasRides = P_.objs.some(o => o.rt && o.rt.slots);
    const k = WHY10.some(q => q[0] === g.why10) ? g.why10 : g.L && WHY10.some(q => q[0] === g.L.why10) ? g.L.why10 : !parkOpen10() ? 'closing' : g.happy < 16 ? 'unhappy' : g.cash < 2 ? 'broke' : g.energy < 5 ? 'tired' : !g.rides && hasRides ? 'norides' : g.t > g.stay ? 'done' : g.rides > 0 ? 'enough' : 'other';
    d.why[k] = (d.why[k] || 0) + 1; d.left++; d.spend += g.spent || 0; d.rides += g.rides || 0;
    const w = P_.wk && P_.wk[P_.wk.length - 1]; if (w && w.day === d.n) { w.left = d.left; w.spend = +(d.spend / d.left).toFixed(2); w.rides = +(d.rides / d.left).toFixed(2); w.why = { ...d.why } } });// (the report for a day is written at closing time; the people still walking out are added to it)
  return l0.apply(this, arguments);
} }
{ const q0 = gLeaveQ10; gLeaveQ10 = function (g, angry) { if (angry && g.qo && g.qo.rt && !g.qo.rt.broken) g.qo.rt.gaveUp = (g.qo.rt.gaveUp || 0) + 1; return q0.apply(this, arguments) } }
// a ride's line can be kept short
{ const k0 = linkObj10; linkObj10 = function (o) { const r = k0.apply(this, arguments); if (o && o.ql === 1 && o.rt && o.rt.qCap) o.rt.qCap = Math.max(4, Math.ceil(o.rt.qCap / 2)); return r } }
const upkeepOf10 = (o, inf) => inf.cost * (UPKEEP10[inf.t] || 0);
const sinceD0 = o => { const d = o.st.d0 || [o.st.n, o.st.inc, o.st.run]; return [o.st.n - d[0], o.st.inc - d[1], o.st.run - d[2]] };
// a thing's daily books start when it is built; things from a save made before 10.1 start counting when the park is opened
{ const b0 = tyBuild10; tyBuild10 = function () { const res = b0.apply(this, arguments); if (res && res.ok && res.o && res.o.st && !res.o.st.d0) res.o.st.d0 = [0, 0, 0]; return res } }
{ const r0 = tyRebuild10; tyRebuild10 = function () { const r = r0.apply(this, arguments); safe10('day books', () => { for (const o of TY.park.objs) if (o.st && !o.st.d0) o.st.d0 = [o.st.n || 0, o.st.inc || 0, o.st.run || 0] }); return r } }
// ---- the end of a day: each thing's books for the day, the park's books for the week, a few notices
{ const e0 = endDay10; endDay10 = function () {
  const P_ = TY.park, mine = P_ && !TY.visit, d = mine ? proDay10() : null, rate0 = P_ ? P_.rating : 0, losers = [];
  if (mine) safe10('day books', () => { for (const o of P_.objs) { if (!o.st) continue; const inf = objInfo10(o); if (!inf || inf.t === 'deco') continue; const t = sinceD0(o), py = o.st.y ? o.st.y[1] - o.st.y[2] - upkeepOf10(o, inf) : 0; o.st.y = [Math.max(0, t[0]), Math.max(0, t[1]), Math.max(0, t[2])]; o.st.d0 = [o.st.n, o.st.inc, o.st.run];
    const pn = o.st.y[1] - o.st.y[2] - upkeepOf10(o, inf); if (pn < -1 && py < -1 && o.rt && o.rt.linked && o.open !== false) losers.push(o); const R = o.rt; if (R) { R.yq = { exp: R.tooExp || 0, long: R.tooLong || 0, up: R.gaveUp || 0 }; R.tooExp = R.tooLong = R.gaveUp = 0 } } });
  const r = e0.apply(this, arguments);
  if (mine) safe10('week books', () => {
    const L = TY.lastDay; if (L && L.led) { const rec = { day: L.day, inc: {}, exp: {}, guests: L.guests || 0, left: d.left, spend: d.left ? +(d.spend / d.left).toFixed(2) : 0, rides: d.left ? +(d.rides / d.left).toFixed(2) : 0, happy: L.happy || 0, why: { ...d.why } };
      for (const k of INC10) rec.inc[k[0]] = Math.round(L.led.inc[k[0]] || 0); for (const k of EXP10) rec.exp[k[0]] = Math.round(L.led.exp[k[0]] || 0); P_.wk = (P_.wk || []).filter(q => q.day !== rec.day).concat([rec]).slice(-7) }
    PRO10.staffY = PRO10.staff; PRO10.staff = null; PRO10.fixY = PRO10.fix.n ? PRO10.fix.sum / PRO10.fix.n : null; PRO10.fix = { sum: 0, n: 0 }; PRO10.told = {};
    if (P_.mode === 'career') { if (losers.length) toast10('💸 ' + objName10(losers[0]) + (losers.length > 1 ? ' and ' + (losers.length - 1) + ' more' : '') + ' lost money two days running. 📊 Reports shows why', 'lose' + P_.day, true);
      if (rate0 - P_.rating >= 5) toast10('📉 The park rating fell from ' + Math.round(rate0) + ' to ' + Math.round(P_.rating) + ' today. 🧭 The Advisor on Overview has ideas', 'rate' + P_.day, true) }
    const sy = PRO10.staffY; if (sy && sy.jan.n > 20 && sy.jan.busy / sy.jan.n > .93 && TY.clean < 75) toast10('🧹 Your janitors were busy all day and litter is still piling up', 'jan' + P_.day, true);
    savePark10();
  });
  return r;
} }
// ---- staff: who is busy, how long repairs take, and which broken ride comes first
function proStaffTick10() {
  const P_ = TY.park; if (!P_ || TY.visit || !P_.speed || !parkOpen10()) return; const S = PRO10.staff || (PRO10.staff = { jan: { busy: 0, n: 0 }, mech: { busy: 0, n: 0 } });
  for (const s_ of TY.staff) { const q = S[s_.k]; if (!q) continue; q.n++; if (s_.job) q.busy++ }
  const now = P_.day * 1440 + P_.min; for (const o of P_.objs) { const R = o.rt; if (!R || !R.slots) continue; if (R.broken && !R.bAt) R.bAt = now; else if (!R.broken && R.bAt) { PRO10.fix.sum += Math.max(0, now - R.bAt); PRO10.fix.n++; R.bAt = 0 } }
}
const rideValue10 = o => { const inf = objInfo10(o), R = o.rt; return (o.st && o.st.y ? o.st.y[1] : 0) + (inf ? inf.exc * (inf.t === 'coaster' ? 3 : 1.5) : 0) + (R && R.q ? R.q.length * 4 : 0) };
{ const s0 = staffStep10; staffStep10 = function (dt) {
  safe10('mechanic order', () => { const P_ = TY.park; let broken = null;
    for (const s_ of TY.staff) { if (s_.k !== 'mech' || s_.job || s_.st === 'work' || s_.t - dt > 0) continue; if (!broken) broken = P_.objs.filter(q => q.rt && q.rt.broken === 1 && q.rt.linked).sort((a, b) => rideValue10(b) - rideValue10(a)); const o = broken.shift(); if (!o) break; o.rt.broken = 2; s_.job = o; s_.goal = o.rt.gateTile } });
  return s0.apply(this, arguments);
} }
// optional policy: service worn rides before they break (the game's own inspection, started earlier and on busy rides too)
{ const r0 = ridesStep10; ridesStep10 = function (dt) {
  const r = r0.apply(this, arguments);
  safe10('service policy', () => { const P_ = TY.park; if (!P_.pol || P_.pol.insp !== 1 || TY.visit || !parkOpen10() || P_.mode === 'sandbox' && !P_.seen.breaks) return; const mech = TY.staff.filter(s_ => s_.k === 'mech').length; if (!mech || !mechFree10()) return;
    let busy = 0; for (const o of P_.objs) if (o.rt && o.rt.insp > 0) busy++; if (busy >= mech) return;
    for (const o of P_.objs) { const R = o.rt; if (!R || !R.slots || !R.linked || R.broken || R.insp > 0 || o.open === false || !(o.rel < 72)) continue; const idle = R.trains ? R.trains.every(t => !t.riders.length && t.ph !== 'run') : R.ph === 'load' && !(R.riders && R.riders.length); if (!idle) continue;
      R.insp = 9 * (perk10('mech1') ? .7 : 1); toast10('🛠 ' + objName10(o) + ' is closed for a short service (before it breaks)', 'insp' + o.id); break } });
  return r;
} }
// ---- visitors say what they notice. Two people at most every couple of seconds; it only adds to "what visitors are saying".
function proBench10() { if (PRO10.bench[0] !== TY.pathVer) PRO10.bench = [TY.pathVer, TY.park.objs.some(o => CAT10[o.k] && CAT10[o.k].job === 'bench' && o.rt && o.rt.linked)]; return PRO10.bench[1] }
function proNotice10(g) {
  const P_ = TY.park, W_ = WX10[P_.wx.k], b = TY.beauty[g.ti] || 0, r = Math.random();
  if (W_.rain && !g.umb && r < .5) return ['🌧', 'I am getting soaked'];
  if (TY.clean < 55 && r < .6) return ['🗑', 'There is litter everywhere'];
  if (g.energy < 28 && !proBench10()) return ['🥱', 'I need to sit down and there are no benches'];
  if (g.cash < 6 && g.t < g.stay * .6) return ['👛', 'I am nearly out of money already'];
  if (!g.rides && g.t > 110 && P_.objs.some(o => o.rt && o.rt.slots)) return ['🤔', 'I still have not found a ride for me'];
  if (P_.min > 1170 && b > 3 && r < .5) return ['✨', 'The park looks lovely at night'];
  if (b > 7 && r < .5) return ['🌷', 'It is so pretty here'];
  if (g.happy > 88 && g.rides >= 3) return ['🥰', 'This is the best day ever'];
  if (g.happy > 78 && P_.rating > 60 && r < .3) return ['⭐', 'I will tell my friends about this park'];
  if (P_.wx.k === 'sunny' && g.thirst > 48 && r < .4) return ['☀️', 'It is hot today'];
  return null;
}
TICKS72.push((dt, raw) => {
  if (!TY.on || !TY.park) return;
  if ((PRO10.t1 -= raw) <= 0) { PRO10.t1 = 1; safe10('staff count', proStaffTick10); safe10('park notices', proWatch10) }
  if ((PRO10.tSay -= raw) > 0) return; PRO10.tSay = 2.2; const P_ = TY.park, G_ = TY.guests; if (!P_.speed || !G_.length || !parkOpen10()) return;
  safe10('visitor notices', () => { for (let k = 0; k < 2; k++) { const g = G_[Math.floor(Math.random() * G_.length)]; if (!g || g.st !== 'walk' || g.leave || g.sayT > 0 || (g.cd10 || 0) > g.t) continue; const n = proNotice10(g); if (!n) continue; g.cd10 = g.t + 45; say10(g, n[0], n[1]) } });
});
// ---- 🔔 recent events: important messages are kept with the park day and time they happened
{ const t0 = toast10; toast10 = function (msg, key, hi) {
  if (hi && TY.on && TY.park && !TY.visit) { const now = performance.now(), k = key || msg; if (!(now - (PRO10.logKey[k] || -1e9) < 9000)) { PRO10.logKey[k] = now; PRO10.log.unshift({ day: TY.park.day, min: TY.park.min, msg: String(msg).slice(0, 200), id: TY.park.id }); if (PRO10.log.length > 40) PRO10.log.pop() } }
  return t0.apply(this, arguments);
} }
// things worth a notice while the day runs (each at most once a day)
function proWatch10() {
  const P_ = TY.park; if (TY.visit || !P_.speed || !parkOpen10()) return; const tell = (k, msg) => { if (PRO10.told[k]) return; PRO10.told[k] = 1; toast10(msg, k + P_.day, true) };
  for (const o of P_.objs) { const R = o.rt; if (!R || !R.slots || !R.linked) continue; if ((R.gaveUp || 0) >= 8) tell('gu' + o.id, '⏱ ' + (R.gaveUp) + ' visitors have given up waiting for ' + objName10(o) + ' today'); else if ((R.tooExp || 0) >= 25 && (R.tooExp || 0) > sinceD0(o)[0] * 2) tell('te' + o.id, '💸 Many visitors find ' + objName10(o) + ' too expensive (' + R.tooExp + ' today)') }
  if (P_.mode === 'career' && P_.loan > 0 && P_.money > P_.loan + 8000) tell('loan', '🏦 You have enough in the bank to repay your loan and stop paying interest');
}
// ---- 🧭 Park Advisor: suggestions worked out from the numbers above, most useful first
function advice10() {
  const P_ = TY.park, A = [], G_ = TY.guests, n = G_.length, add = (pri, ic, t, why, act) => A.push({ pri, ic, t, why, act }), career = P_.mode === 'career';
  const rides = P_.objs.filter(o => o.rt && o.rt.slots && o.rt.linked), y = (P_.wk || [])[(P_.wk || []).length - 1];
  for (const o of rides) { const inf = objInfo10(o), R = o.rt, t = sinceD0(o), fare = fareOf10(o, inf), nm = objName10(o), exp = (R.tooExp || 0) + (R.yq ? R.yq.exp : 0), lng = (R.tooLong || 0) + (R.yq ? R.yq.long : 0), up = (R.gaveUp || 0) + (R.yq ? R.yq.up : 0), rode = t[0] + (o.st.y ? o.st.y[0] : 0), fair = Math.max(0, Math.floor(worth10(inf) * 1.15 * 2) / 2);// (the most an ordinary visitor accepts: see gDecide10)
    if (exp >= 12 && exp > rode * .8 && fare > 0) add(80 + Math.min(15, exp / 4), '💸', nm + ' is priced too high', exp + ' visitors turned it down as too expensive, against ' + rode + ' who rode. ' + (fair < fare ? 'Most visitors will pay up to ' + money10(fair) + ' for it.' : 'Try ' + money10(Math.max(0, fare - 1)) + '.'), 'go:' + o.id);
    else if (rideOpen10(o) && !exp && rode >= 40 && R.q.length >= R.qCap * .8 && fare < worth10(inf) * 1.1) add(55, '💵', nm + ' could cost a little more', 'Its line is nearly full and nobody found it expensive. ' + money10(fare + 1) + ' would bring in about ' + money10(rode / 2) + ' more a day.', 'go:' + o.id);
    if (up + lng >= 14) add(70 + Math.min(15, up), '⏱', 'The wait for ' + nm + ' puts people off', (up ? up + ' gave up in the line' : '') + (up && lng ? ' and ' : '') + (lng ? lng + ' did not join it' : '') + '. ' + (o.up && o.up.cap < 3 ? 'A capacity upgrade moves more people an hour.' : 'Another ride like it nearby would share the crowd.'), 'go:' + o.id);
    if (career && o.st.y) { const p = o.st.y[1] - o.st.y[2] - upkeepOf10(o, inf); if (p < -15 && o.open !== false) add(60 + Math.min(20, -p / 20), '📉', nm + ' lost ' + money10(-p) + ' yesterday', o.st.y[0] < 10 ? 'Only ' + o.st.y[0] + ' people rode it. Is it easy to reach, and is the price right?' : 'It costs more to run and keep up than it takes in tickets.', 'go:' + o.id) }
    if (o.rel < 45 && !R.broken && !P_.staff.mech) add(75, '🔧', nm + ' is worn out (' + Math.round(o.rel) + '%)', 'It will break down soon and there is no mechanic to service it.', 'tab:staff') }
  if (n >= 12) { const c = { hunger: 0, thirst: 0, wc: 0, tired: 0, sick: 0 }; for (const g of G_) { if (g.hunger > 60) c.hunger++; if (g.thirst > 60) c.thirst++; if (g.bladder > 68) c.wc++; if (g.energy < 26) c.tired++; if (g.nausea > 55) c.sick++ }
    const has = k => P_.objs.some(o => CAT10[o.k] && (CAT10[o.k].sells === k || CAT10[o.k].job === k) && o.rt && o.rt.linked);
    if (c.hunger > n * .25 && has('food')) add(66, '🍔', 'A quarter of your visitors are hungry', c.hunger + ' of ' + n + ' are hungry even though there is food. Another stall, nearer the busy rides, would help.', 'cat:shop');
    if (c.thirst > n * .25 && has('drink')) add(64, '🥤', 'Many visitors are thirsty', c.thirst + ' of ' + n + ' want a drink. Add a drinks stand where the crowds are.', 'cat:shop');
    if (c.wc > n * .2 && has('wc')) add(62, '🚻', 'The restrooms are too far away', c.wc + ' visitors need one right now.', 'cat:shop');
    if (c.tired > n * .2) add(50, '🪑', 'Visitors are getting tired', c.tired + ' of ' + n + ' are worn out. Benches along the paths let them rest instead of going home.', 'cat:deco');
    if (c.sick > n * .12) add(52, '🤢', 'Some visitors feel sick', c.sick + ' feel ill after the rides. Benches and an Info & First Aid desk near the wild rides help.', 'cat:deco') }
  const S = PRO10.staffY || PRO10.staff; if (S) { const jb = S.jan.n > 30 ? S.jan.busy / S.jan.n : null, mb = S.mech.n > 30 ? S.mech.busy / S.mech.n : null;
    if (jb != null && jb > .9 && TY.clean < 80) add(68, '🧹', 'Your janitors cannot keep up', 'They were busy ' + Math.round(jb * 100) + '% of the time and the park is ' + Math.round(TY.clean) + '% clean. Hire one more, or add litter bins by the food stalls.', 'tab:staff');
    if (career && mb != null && mb < .04 && P_.staff.mech >= 2 && !rides.some(o => o.rt.broken)) add(35, '👷', 'You may have more mechanics than you need', 'They were busy ' + Math.round(mb * 100) + '% of the time. One fewer saves ' + money10(SIM10.wageMech * 12) + ' a day.', 'tab:staff');
    if (career && jb != null && jb < .1 && P_.staff.jan >= 2 && TY.clean > 92) add(33, '🧹', 'You may have more janitors than you need', 'They were busy ' + Math.round(jb * 100) + '% of the time and the park is spotless. One fewer saves ' + money10(SIM10.wageJan * 12) + ' a day.', 'tab:staff') }
  if (career) { const cost = y ? Object.values(y.exp).reduce((a, b) => a + b, 0) : 0;
    if (P_.loan > 0 && P_.money > P_.loan + 6000) add(58, '🏦', 'Repay your loan', 'It costs ' + money10(P_.loan * .012) + ' a day in interest and you have ' + money10(P_.money) + ' in the bank.', 'tab:money');
    if (y && cost > 0 && P_.money >= 0 && P_.money < cost * 1.5) add(72, '⚠️', 'Money is tight', 'You have ' + money10(P_.money) + ' and a day costs about ' + money10(cost) + '.', 'tab:rep');
    if (y && y.guests >= 60 && !TY.day.turned && !P_.tot.turned && P_.rating > 55 && P_.fee < 60) add(40, '🎟', 'The entrance ticket could cost more', 'Nobody has turned back at the gate. ' + money10(P_.fee + 1) + ' would earn about ' + money10(y.guests) + ' more a day.', 'tab:money');
    if (P_.rating >= 55 && !(P_.promo > 0) && rides.length >= 3 && n < maxGuests10() * .45 && parkOpen10()) add(45, '📣', 'Your park has room for more visitors', n + ' are here and there is room for about ' + maxGuests10() + '. An advert brings in about half as many again for six park hours.', 'tab:money') }
  const R_ = TY.rate; if (R_ && rides.length >= 2) { if (R_.scen < 30) add(42, '🌳', 'Scenery is the weakest part of your rating', 'Trees, flowers and fountains beside the paths lift it, and visitors walking past them cheer up.', 'cat:deco'); if (y && y.why && y.left > 20 && (y.why.norides || 0) > y.left * .25) add(63, '🎟', 'A quarter of yesterday’s visitors never got on a ride', 'They paid to get in and found nothing they could afford or reach. Check prices and that every ride has a path.', 'tab:rides') }
  return A.sort((a, b) => b.pri - a.pri).slice(0, 5);
}
// ---- 📊 Reports
const pct10 = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
function repRides10() {
  const P_ = TY.park; return P_.objs.map(o => { const inf = objInfo10(o); if (!inf || inf.t === 'deco' || !o.st) return null; const t = sinceD0(o), up = upkeepOf10(o, inf), all = o.st.inc - o.st.run, yp = o.st.y ? o.st.y[1] - o.st.y[2] - up : null;
    return { o, inf, name: objName10(o), n: t[0], today: t[1] - t[2], yn: o.st.y ? o.st.y[0] : null, yp, all, cost: inf.cost, back: all >= inf.cost ? 0 : yp > 0 ? Math.ceil((inf.cost - Math.max(0, all)) / yp) : -1 } }).filter(Boolean).sort((a, b) => (b.yp != null ? b.yp : b.today) - (a.yp != null ? a.yp : a.today));
}
function repHTML10() {
  const P_ = TY.park, sb = P_.mode === 'sandbox', wk = P_.wk || [], y = wk[wk.length - 1], tile = (l, v_, s_) => `<div class="tyTile">${l}<b>${v_}</b>${s_ || ''}</div>`, sum = o => Object.values(o).reduce((a, b) => a + b, 0), d = proDay10(), rows = repRides10();
  let h = '';
  if (y) { const inc = sum(y.inc), exp = sum(y.exp), pr = inc - exp; h += `<h3>Yesterday <small>day ${y.day}</small></h3><div class="tyGrid">${tile(pr >= 0 ? 'Profit' : 'Loss', `<span class="${pr >= 0 ? 'pos' : 'neg'}">${money10(pr)}</span>`, money10(inc) + ' in · ' + money10(exp) + ' out')}${tile('Visitors', y.guests, y.left + ' went home')}${tile('Spent each', money10(y.spend), 'tickets, food and shops')}${tile('Rides each', y.rides.toFixed(1), 'on average')}${tile('Went home', Math.round(y.happy) + '% happy')}${tile('Profit a visitor', y.guests ? money10(pr / y.guests) : '—')}</div>` }
  else h += `<p class="tyNote">📊 The first report appears when the park closes tonight. Until then, “today so far” below is live.</p>`;
  if (wk.length) { const I = {}, E = {}; INC10.forEach(k => I[k[0]] = 0); EXP10.forEach(k => E[k[0]] = 0); wk.forEach(q => { for (const k in I) I[k] += q.inc[k] || 0; for (const k in E) E[k] += q.exp[k] || 0 }); const ti = sum(I), te = sum(E), mx = Math.max(1, ...Object.values(I), ...Object.values(E));
    const row = (l, v_, cls) => v_ > .5 ? `<tr><td>${l}<u class="rpB10 ${cls}"><s style="width:${Math.max(2, Math.round(v_ / mx * 100))}%"></s></u></td><td class="${cls}">${cls === 'neg' ? '−' + money10(v_).replace('−', '') : money10(v_)}</td><td>${pct10(v_, cls === 'neg' ? te : ti)}%</td></tr>` : '';
    h += `<h3>The last ${wk.length === 1 ? 'day' : wk.length + ' days'} <small>day ${wk[0].day}${wk.length > 1 ? ' to ' + wk[wk.length - 1].day : ''}</small></h3><div class="rpS10"><table class="tyLed rp10"><tr><th>Money in</th><th></th><th>share</th></tr>${INC10.map(k => row(k[1], I[k[0]], 'pos')).join('')}<tr><th>Money out</th><th></th><th>share</th></tr>${EXP10.map(k => row(k[1], E[k[0]], 'neg')).join('')}<tr class="tot"><td>${ti - te >= 0 ? 'Profit' : 'Loss'}</td><td class="${ti - te >= 0 ? 'pos' : 'neg'}">${money10(ti - te)}</td><td>${ti > 0 ? pct10(ti - te, ti) + '%' : ''}</td></tr></table></div>
<div class="rpD10">${wk.map(q => { const p = sum(q.inc) - sum(q.exp), m = Math.max(1, ...wk.map(z => Math.abs(sum(z.inc) - sum(z.exp)))); return `<div title="Day ${q.day}: ${money10(p)} · ${q.guests} visitors"><i style="height:${Math.max(3, Math.abs(p) / m * 46)}px" class="${p >= 0 ? 'pos' : 'neg'}"></i><small>${q.day}</small></div>` }).join('')}</div>` }
  h += `<h3>Rides and stalls <small>${sb ? 'sandbox: nothing is charged, the books still run' : 'best earner first'}</small></h3>` + (rows.length ? `<div class="rpS10"><table class="tyLed rp10"><tr><th>What</th><th>Today</th><th>Yesterday</th><th>Since built</th><th>Pays for itself</th></tr>${rows.map(q => `<tr><td><button class="rpL10" data-x="go:${q.o.id}">${q.inf.ic} ${html10(q.name)}</button><small>${q.n} today${q.yn != null ? ' · ' + q.yn + ' yesterday' : ''}</small></td><td class="${q.today >= 0 ? 'pos' : 'neg'}">${money10(q.today)}</td><td class="${q.yp == null ? '' : q.yp >= 0 ? 'pos' : 'neg'}">${q.yp == null ? '—' : money10(q.yp)}</td><td class="${q.all >= 0 ? 'pos' : 'neg'}">${money10(q.all)}</td><td>${q.back === 0 ? '✓ paid back' : q.back > 0 ? '≈ ' + q.back + ' day' + (q.back > 1 ? 's' : '') : '—'}</td></tr>`).join('')}</table></div><p class="tyNote">Today is tickets and sales minus running costs so far. Yesterday also takes off the day’s upkeep. “Pays for itself” compares what it has earned with what it cost to build (${money10(rows.reduce((a, q) => a + q.cost, 0))} for all of these).</p>` : '<p class="tyNote">Nothing built yet.</p>');
  const qs = rows.filter(q => q.o.rt && q.o.rt.slots && q.o.rt.linked);
  if (qs.length) h += `<h3>Queues <small>today so far</small></h3><div class="rpS10"><table class="tyLed rp10"><tr><th>Ride</th><th>In line</th><th>Wait</th><th>Skipped it</th><th>Gave up</th><th>Too dear</th><th>Line</th></tr>${qs.map(q => { const R = q.o.rt; return `<tr><td><button class="rpL10" data-x="go:${q.o.id}">${q.inf.ic} ${html10(q.name)}</button></td><td>${R.q.length} / ${R.qCap}</td><td>${Math.round(R.waitAvg || 0)} s</td><td>${R.tooLong || 0}</td><td class="${(R.gaveUp || 0) >= 8 ? 'neg' : ''}">${R.gaveUp || 0}</td><td class="${(R.tooExp || 0) >= 25 ? 'neg' : ''}">${R.tooExp || 0}</td><td>${canEdit10() ? `<button class="btn rpQ10${q.o.ql === 1 ? ' on' : ''}" data-x="ql:${q.o.id}" aria-pressed="${q.o.ql === 1}" title="A short line holds half as many people: fewer long waits, more people turned away">${q.o.ql === 1 ? 'Short' : 'Full'}</button>` : q.o.ql === 1 ? 'Short' : 'Full'}</td></tr>` }).join('')}</table></div><p class="tyNote">Wait is how long the people now boarding stood in line. “Skipped it” looked at the line and chose something else; “gave up” left the line; “too dear” wanted to ride but not at that price.</p>`;
  const why = (src, n) => n ? `<div class="tyBars">${WHY10.filter(k => src[k[0]]).sort((a, b) => src[b[0]] - src[a[0]]).map(k => bar10(k[1] + ' ' + k[2], pct10(src[k[0]], n), src[k[0]] + ' · ' + pct10(src[k[0]], n) + '%')).join('')}</div>` : '';
  if (d.left || y && y.left) h += `<h3>Why visitors went home</h3>${d.left ? `<p class="tyNote">Today so far: ${d.left} have left.</p>${why(d.why, d.left)}` : ''}${y && y.left ? `<p class="tyNote">Yesterday: ${y.left} left.</p>${why(y.why, y.left)}` : ''}`;
  const S = PRO10.staff, SY = PRO10.staffY, use = q => q && q.n > 5 ? Math.round(q.busy / q.n * 100) + '%' : '—';
  h += `<h3>Staff</h3><div class="tyGrid">${tile('Janitors busy', use(S && S.jan), SY ? 'yesterday ' + use(SY.jan) : P_.staff.jan + ' on the team')}${tile('Mechanics busy', use(S && S.mech), SY ? 'yesterday ' + use(SY.mech) : P_.staff.mech + ' on the team')}${tile('A repair takes', PRO10.fix.n ? Math.round(PRO10.fix.sum / PRO10.fix.n) + ' park min' : PRO10.fixY != null ? Math.round(PRO10.fixY) + ' park min' : '—', 'from breakdown to running again')}</div>
${canEdit10() ? `<div class="tySeg">${pkSeg10('polInsp', [['0', '🛠 Service rides when they are quiet'], ['1', '🛡 Service rides before they break']], P_.pol && P_.pol.insp === 1 ? '1' : '0')}</div><p class="tyNote">${P_.pol && P_.pol.insp === 1 ? 'Mechanics close a ride for a short service as soon as it wears below 72%, even with a line waiting (the line is sent away). Fewer breakdowns, a few more short closures.' : 'Mechanics service a worn ride (below 55%) only when nobody is waiting for it. Busy rides run until they break.'} A free mechanic always goes to the broken ride that matters most first.</p>` : ''}
<div class="tyRow">${pkBtn10('repCsv', '⬇ Download these numbers (CSV)')}</div>`;
  return `<div class="ty10pk">${h}</div>`;
}
function repCsv10() {
  // a name is the player's own text (or came with a backup file): a cell that starts like a formula gets a leading ' so a
  // spreadsheet shows it as text instead of running it
  const P_ = TY.park, q = v_ => { let t = String(v_).replace(/[\r\n]+/g, ' '); if (/^[=+\-@\t]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"' }, L = ['# Coaster Lab ' + TY10.version + ' park report: ' + P_.name.replace(/[\r\n]/g, ' ') + ', day ' + P_.day + ' (game money, simulated values)', '', 'section,name,riders_or_sales_today,profit_today,riders_or_sales_yesterday,profit_yesterday,profit_since_built,build_cost'];
  repRides10().forEach(r => L.push(['thing', q(r.name), r.n, Math.round(r.today), r.yn == null ? '' : r.yn, r.yp == null ? '' : Math.round(r.yp), Math.round(r.all), r.cost].join(',')));
  L.push('', 'section,day,visitors,' + INC10.map(k => 'in_' + k[0]).join(',') + ',' + EXP10.map(k => 'out_' + k[0]).join(',')); (P_.wk || []).forEach(d => L.push(['day', d.day, d.guests, ...INC10.map(k => d.inc[k[0]] || 0), ...EXP10.map(k => d.exp[k[0]] || 0)].join(',')));
  return L.join('\n');
}
// ---- the Park Office: the Reports tab, the Advisor and recent events on Overview, moods on Visitors
{ const T = PANELS72.ty10, desc = Object.getOwnPropertyDescriptor(T, 'tabs'); Object.defineProperty(T, 'tabs', { configurable: true, get() { const t = desc.get.call(this); if (TY.visit) return t; const k = t.findIndex(x => x[0] === 'money'); t.splice(k + 1, 0, ['rep', '📊 Reports']); return t } }) }
function proHome10() {
  const P_ = TY.park, A = advice10(), log = PRO10.log.filter(e => e.id === P_.id).slice(0, 8);
  return `<h3>🧭 Park Advisor <small>${A.length ? 'from your park’s own numbers' : 'nothing to suggest right now'}</small></h3><div class="tyList">${A.map(a => `<button class="tyLi adv10" data-x="${a.act}"><i>${a.ic}</i><div><b>${html10(a.t)}</b><small>${html10(a.why)}</small></div><em>›</em></button>`).join('') || '<div class="tyLi"><i>👍</i><div><b>The numbers look healthy</b><small>Prices, queues, staff and visitors’ needs are all in a good range. 📊 Reports has the details.</small></div></div>'}</div>
<h3>🔔 Recent events <small>${log.length ? 'newest first' : 'nothing yet'}</small></h3>${log.length ? `<div class="tyList ev10">${log.map(e => `<div class="tyLi"><div><b>${html10(e.msg)}</b><small>day ${e.day} · ${clock72(e.min)}</small></div></div>`).join('')}</div>` : '<p class="tyNote">Breakdowns, repairs, goals and warnings are kept here, so you can read them after the message has faded.</p>'}`;
}
function proGuests10() {
  const G_ = TY.guests, n = G_.length; if (!n) return ''; const by = GT10.map(() => [0, 0]), c = { hunger: 0, thirst: 0, wc: 0, tired: 0, sick: 0, poor: 0, sad: 0 };
  for (const g of G_) { by[g.ty][0]++; by[g.ty][1] += g.happy; if (g.hunger > 60) c.hunger++; if (g.thirst > 60) c.thirst++; if (g.bladder > 68) c.wc++; if (g.energy < 26) c.tired++; if (g.nausea > 55) c.sick++; if (g.cash < 6) c.poor++; if (g.happy < 35) c.sad++ }
  const items = [['hunger', '🍔 Hungry'], ['thirst', '🥤 Thirsty'], ['wc', '🚻 Need a restroom'], ['tired', '🥱 Tired'], ['sick', '🤢 Feeling sick'], ['poor', '👛 Nearly out of money'], ['sad', '😟 Unhappy']];
  return `<h3>Mood by visitor type</h3><div class="tyBars">${GT10.map((T_, k) => by[k][0] ? bar10(T_.ic + ' ' + T_.n + ' (' + by[k][0] + ')', by[k][1] / by[k][0], Math.round(by[k][1] / by[k][0]) + '%') : '').join('')}</div>
<h3>What is bothering them <small>right now, of ${n}</small></h3><div class="tyBars">${items.map(q => bar10(q[1], pct10(c[q[0]], n), c[q[0]] + ' · ' + pct10(c[q[0]], n) + '%')).join('')}</div>`;
}
{ const o0 = officeHTML10; officeHTML10 = function (tab) {
  if (tab === 'rep' && TY.park) return safe10('reports', repHTML10) || '<div class="ty10pk"><p class="tyNote">The report could not be drawn.</p></div>';
  let h = o0.apply(this, arguments); if (!TY.park) return h;
  if (tab === 'home' && !TY.visit) { const add = safe10('advisor', proHome10); if (add) { const cut = h.indexOf('<h3>What visitors are saying</h3>'); h = cut >= 0 ? h.slice(0, cut) + add + h.slice(cut) : h.replace(/<\/div>$/, add + '</div>') } }
  if (tab === 'guests') { const add = safe10('visitor moods', proGuests10); if (add) { const cut = h.indexOf('<h3>What they say</h3>'); h = cut >= 0 ? h.slice(0, cut) + add + h.slice(cut) : h.replace(/<\/div>$/, add + '</div>') } }
  return h;
} }
{ const T = PANELS72.ty10, a0 = T.act; T.act = async function (a, t) {
  const [k, v_] = String(a).split(':'), P_ = TY.park;
  if (k === 'repCsv') { say(fileSave10((P_.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'park') + '-report-day-' + P_.day + '.csv', repCsv10()) ? '⬇ Report saved to your downloads' : 'Could not save the report'); return false }
  if (k === 'ql' && canEdit10()) { const o = TY.objById.get(+v_); if (o && o.rt) { o.ql = o.ql === 1 ? 0 : 1; if (!o.ql) delete o.ql; linkObj10(o); savePark10() } return }
  if (k === 'polInsp' && canEdit10()) { P_.pol = { insp: v_ === '1' ? 1 : 0 }; savePark10(); return }
  return a0.call(this, a, t);
} }
Object.assign(DBG10, { pro: {
  advice: () => advice10().map(a => ({ pri: Math.round(a.pri), t: a.t, why: a.why, act: a.act })), rides: () => repRides10().map(r => ({ id: r.o.id, name: r.name, n: r.n, today: Math.round(r.today), yn: r.yn, yp: r.yp == null ? null : Math.round(r.yp), all: Math.round(r.all), back: r.back })),
  day: () => ({ ...proDay10(), why: { ...proDay10().why } }), wk: () => JSON.parse(JSON.stringify(TY.park.wk || [])), log: () => PRO10.log.map(e => e.msg), staff: () => ({ now: PRO10.staff, y: PRO10.staffY, fix: PRO10.fix }), loopStops: () => PRO10.loopStops,
  html: tab => officeHTML10(tab), csv: () => repCsv10(), queue: id => { const o = TY.objById.get(id); return o && o.rt ? { cap: o.rt.qCap, n: o.rt.q.length, short: o.ql === 1, exp: o.rt.tooExp || 0, long: o.rt.tooLong || 0, up: o.rt.gaveUp || 0 } : null },
  setPol: v_ => { TY.park.pol = { insp: v_ ? 1 : 0 } }, notice: g => proNotice10(g), guests: () => TY.guests,
  jobs: () => TY.staff.map(s_ => ({ k: s_.k, job: s_.job ? s_.job.id : null })), hire: (k, n) => { TY.park.staff[k] = n; staffSync10(); return TY.staff.filter(s_ => s_.k === k).length },
  thing: (id, o) => { const q = TY.objById.get(id); if (!q) return null; if (o) { if (o.rel != null) q.rel = o.rel; if (o.price != null) q.price = o.price; if (o.name != null) q.name = cleanName(o.name); if (o.broken != null) q.rt.broken = o.broken } return { rel: q.rel, price: q.price, fare: fareOf10(q, objInfo10(q)), broken: q.rt.broken || 0, insp: q.rt.insp || 0, value: Math.round(rideValue10(q)), inc: q.st.inc, run: q.st.run, n: q.st.n, d0: q.st.d0 || null, y: q.st.y || null, ql: q.ql || 0 } },
  each: o => { let n = 0; for (const g of TY.guests) { Object.assign(g, o); n++ } return n }, toast: (m, k, hi) => toast10(m, k, hi), why: () => WHY10.map(k => k[0]), tick: () => { proStaffTick10(); proWatch10() }
} });
