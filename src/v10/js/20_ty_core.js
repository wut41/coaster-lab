// ---- 10.0 MY PARK — core: the park's data, the catalogue of things you can build, the grid, the ledger and saving.
// My Park is a park you build yourself on a grid of 4 m tiles: paths, coasters (park-size replicas of the game's rides
// and of your own designs, running on their real simulated lap), flat rides, shops, facilities and scenery. Every
// visitor is simulated individually (22_ty_sim.js). Career and Sandbox are two separate saves.
const TS10 = 4, GW10 = 48, GH10 = 48, PLOT10 = 8, NPL10 = 6;// tile size (m), grid, land plot size (tiles), plots per side
const GATE_I10 = 24, GATE_J10 = 47;// the entrance tile (middle of the south edge)
const TY = {
  on: false, park: null, slot: null, visit: null,// visit: {name, by, code} while looking at someone else's park (read only)
  root: null, built: false, t: 0, simT: 0,
  occ: new Int32Array(GW10 * GH10),// object id standing on each tile (0 = free)
  air: new Int32Array(GW10 * GH10),// coaster id whose track passes low over the tile (paths and small scenery may still go there)
  path: new Uint8Array(GW10 * GH10),// 0 = no path, 1.. = path style + 1
  own: new Uint8Array(GW10 * GH10),// 1 = the park owns this tile
  beauty: new Float32Array(GW10 * GH10), pathVer: 1, objById: new Map(),
  guests: [], staff: [], litter: [], sel: null, tool: null, ghost: null, cam: { x: 0, z: 70, yaw: 0, pitch: .95, dist: 78 }, ui: {}, perf: { ms: 0, n: 0 }
};
const tI10 = (i, j) => j * GW10 + i, tX10 = i => (i - GW10 / 2 + .5) * TS10, tZ10 = j => (j - GH10 / 2 + .5) * TS10;
const xT10 = x => Math.floor(x / TS10 + GW10 / 2), zT10 = z => Math.floor(z / TS10 + GH10 / 2), inG10 = (i, j) => i >= 0 && j >= 0 && i < GW10 && j < GH10;
const NB10 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// ---- catalogue. Costs are park dollars. exc / int / nau = excitement, intensity, nausea (0-100) for rides.
// Flat rides, shops and scenery reuse the 3D models of the 8.0 park lands (att3d80 / shop3d80 / the scenery builders).
const CAT10 = {
  // flat rides: w × d tiles, seats per cycle, cycle seconds, running cost per park hour
  carousel: { t: 'flat', n: 'Carousel', ic: '🎠', w: 3, d: 3, cost: 2200, exc: 26, int: 8, nau: 5, cap: 12, dur: 22, run: 9, lv: 1, model: 'carousel', col: 0xff5a6e, fare: 2 },
  teacups: { t: 'flat', n: 'Spinning Teacups', ic: '☕', w: 3, d: 3, cost: 2800, exc: 34, int: 24, nau: 32, cap: 10, dur: 20, run: 10, lv: 1, model: 'teacups', col: 0xff6fb5, fare: 2 },
  bumper: { t: 'flat', n: 'Bumper Cars', ic: '🚗', w: 3, d: 3, cost: 3600, exc: 40, int: 30, nau: 10, cap: 12, dur: 24, run: 12, lv: 2, model: 'bumper', col: 0x36a7ff, fare: 3 },
  ferris: { t: 'flat', n: 'Ferris Wheel', ic: '🎡', w: 4, d: 3, cost: 4800, exc: 42, int: 6, nau: 4, cap: 20, dur: 34, run: 14, lv: 2, model: 'ferris', col: 0xffc233, fare: 3 },
  swing: { t: 'flat', n: 'Wave Swinger', ic: '🌀', w: 3, d: 3, cost: 4200, exc: 46, int: 36, nau: 26, cap: 10, dur: 22, run: 12, lv: 3, model: 'swing', col: 0x36a7ff, fare: 3 },
  pirate: { t: 'flat', n: 'Pirate Ship', ic: '🏴‍☠️', w: 3, d: 3, cost: 5600, exc: 54, int: 50, nau: 44, cap: 16, dur: 24, run: 15, lv: 4, model: 'pirate', col: 0x8a5a33, fare: 4 },
  drop: { t: 'flat', n: 'Drop Tower', ic: '🗼', w: 2, d: 2, cost: 8200, exc: 70, int: 80, nau: 34, cap: 8, dur: 16, run: 18, lv: 6, model: 'drop', col: 0xff3d6b, fare: 5 },
  // shops: what they sell, default price, what a sale costs the park
  burger: { t: 'shop', n: 'Burger Bar', ic: '🍔', w: 1, d: 1, cost: 900, sells: 'food', price: 6, unit: 2.2, run: 6, lv: 1, model: 'food', col: 0xff8a3d },
  drinks: { t: 'shop', n: 'Drinks Stand', ic: '🥤', w: 1, d: 1, cost: 650, sells: 'drink', price: 3, unit: .8, run: 4, lv: 1, model: 'drink', col: 0x36a7ff },
  icecream: { t: 'shop', n: 'Ice Cream Cart', ic: '🍦', w: 1, d: 1, cost: 750, sells: 'treat', price: 4, unit: 1.1, run: 4, lv: 2, model: 'icecream', col: 0xff6fb5 },
  gifts: { t: 'shop', n: 'Souvenir Shop', ic: '🎁', w: 1, d: 1, cost: 1400, sells: 'gift', price: 12, unit: 4.5, run: 6, lv: 3, model: 'gifts', col: 0x9b6bff },
  // facilities
  toilet: { t: 'fac', n: 'Restrooms', ic: '🚻', w: 1, d: 1, cost: 600, sells: 'wc', price: 0, unit: 0, run: 3, lv: 1, model: 'toilets', col: 0x2fd18b },
  info: { t: 'fac', n: 'Info & First Aid', ic: 'ℹ️', w: 1, d: 1, cost: 800, sells: 'info', price: 8, unit: 2, run: 5, lv: 2, model: 'info', col: 0x22e0ff },
  // scenery: beauty points spread to the tiles around it. bench / bin / lamp also do a job.
  tree: { t: 'deco', n: 'Tree', ic: '🌳', w: 1, d: 1, cost: 45, beauty: 3, lv: 1, model: 'tree' },
  pine: { t: 'deco', n: 'Pine', ic: '🌲', w: 1, d: 1, cost: 45, beauty: 3, lv: 1, model: 'pine' },
  palm: { t: 'deco', n: 'Palm', ic: '🌴', w: 1, d: 1, cost: 70, beauty: 4, lv: 3, model: 'palm' },
  bush: { t: 'deco', n: 'Bush', ic: '🌿', w: 1, d: 1, cost: 25, beauty: 2, lv: 1, model: 'bush' },
  flowers: { t: 'deco', n: 'Flower Bed', ic: '🌷', w: 1, d: 1, cost: 60, beauty: 5, lv: 1, model: 'flowers' },
  rock: { t: 'deco', n: 'Rock', ic: '🪨', w: 1, d: 1, cost: 30, beauty: 1.5, lv: 1, model: 'rock' },
  bench: { t: 'deco', n: 'Bench', ic: '🪑', w: 1, d: 1, cost: 70, beauty: 1, lv: 1, model: 'bench', job: 'bench' },
  bin: { t: 'deco', n: 'Litter Bin', ic: '🗑', w: 1, d: 1, cost: 50, beauty: 0, lv: 1, model: 'bin', job: 'bin' },
  lamp: { t: 'deco', n: 'Lamp Post', ic: '💡', w: 1, d: 1, cost: 90, beauty: 2, lv: 1, model: 'lamp', job: 'lamp' },
  fountain: { t: 'deco', n: 'Fountain', ic: '⛲', w: 1, d: 1, cost: 420, beauty: 12, lv: 2, model: 'fountain' },
  statue: { t: 'deco', n: 'Statue', ic: '🗿', w: 1, d: 1, cost: 360, beauty: 9, lv: 4, model: 'statue' },
  flag: { t: 'deco', n: 'Flag', ic: '🚩', w: 1, d: 1, cost: 40, beauty: 2, lv: 2, model: 'flag' },
  mushroom: { t: 'deco', n: 'Giant Mushroom', ic: '🍄', w: 1, d: 1, cost: 120, beauty: 6, lv: 5, model: 'mushroom' },
  lolly: { t: 'deco', n: 'Lollipop', ic: '🍭', w: 1, d: 1, cost: 110, beauty: 6, lv: 5, model: 'lolly' },
  torch: { t: 'deco', n: 'Tiki Torch', ic: '🔥', w: 1, d: 1, cost: 80, beauty: 4, lv: 6, model: 'torch' },
  castle: { t: 'deco', n: 'Castle Folly', ic: '🏰', w: 2, d: 2, cost: 2400, beauty: 40, lv: 8, model: 'castle' }
};
const PATHS10 = [{ n: 'Tarmac', c: 0x8a9099, cost: 12 }, { n: 'Sandstone', c: 0xd8c59c, cost: 16 }, { n: 'Red brick', c: 0xb5654a, cost: 20 }, { n: 'Slate', c: 0x5f7186, cost: 20 }, { n: 'Boardwalk', c: 0x9a7248, cost: 24 }];
const GT10 = [// visitor types: share of arrivals, intensity they like, minutes of queue they accept, cash, how much nausea bothers them
  { k: 'thrill', n: 'Thrill seeker', ic: '🤘', share: .22, lo: 50, hi: 100, pat: 9, cash: [60, 110], nau: .5, coaster: 1.25 },
  { k: 'family', n: 'Family', ic: '👨‍👩‍👧', share: .26, lo: 0, hi: 46, pat: 6, cash: [80, 140], nau: 1.2, coaster: .9 },
  { k: 'casual', n: 'Casual visitor', ic: '🙂', share: .28, lo: 12, hi: 72, pat: 7, cash: [50, 95], nau: 1, coaster: 1 },
  { k: 'fan', n: 'Coaster enthusiast', ic: '🎢', share: .12, lo: 35, hi: 100, pat: 12, cash: [70, 130], nau: .6, coaster: 1.7 },
  { k: 'gentle', n: 'Gentle rider', ic: '🌷', share: .12, lo: 0, hi: 30, pat: 7, cash: [50, 90], nau: 1.5, coaster: .7 }
];
const INC10 = [['gate', '🎟 Entrance tickets'], ['rides', '🎢 Ride tickets'], ['food', '🍔 Food & drink'], ['shops', '🎁 Shops & services'], ['prize', '🏆 Goal prizes'], ['sale', '♻️ Sold attractions'], ['loan', '🏦 Loan taken']];
const EXP10 = [['build', '🏗 Building & upgrades'], ['land', '🏞 Land'], ['run', '⚡ Power & running costs'], ['wages', '👷 Wages & ride operators'], ['repair', '🔧 Repairs & inspections'], ['stock', '📦 Stock for the shops'], ['loan', '🏦 Loan interest & repayments'], ['promo', '📣 Marketing']];
const newLed10 = () => { const o = { inc: {}, exp: {} }; INC10.forEach(k => o.inc[k[0]] = 0); EXP10.forEach(k => o.exp[k[0]] = 0); return o };
const ledSum10 = l => { let a = 0, b = 0; for (const k in l.inc) a += l.inc[k]; for (const k in l.exp) b += l.exp[k]; return { inc: a, exp: b, profit: a - b } };
// ---- money. Every dollar goes through these two functions, so the balance and the books always agree.
// (Sandbox: nothing is charged and the balance never changes, but income and costs are still written to the books.)
function earn10(cat, amt) { const P_ = TY.park; if (!P_ || !(amt > 0)) return; P_.led.inc[cat] = (P_.led.inc[cat] || 0) + amt; P_.tot.inc += amt; if (P_.mode !== 'sandbox') P_.money += amt }
function pay10(cat, amt) { const P_ = TY.park; if (!P_ || !(amt > 0)) return; P_.led.exp[cat] = (P_.led.exp[cat] || 0) + amt; P_.tot.exp += amt; if (P_.mode !== 'sandbox') P_.money -= amt }
const canPay10 = amt => !!TY.park && (TY.park.mode === 'sandbox' || TY.park.money >= amt);
// ---- a new park
function startLand10() { let s = ''; for (let pz = 0; pz < NPL10; pz++) for (let px = 0; px < NPL10; px++) s += (pz >= 4 && px >= 1 && px <= 4) ? '1' : '0'; return s }
function newPark10(mode) {
  const sb = mode === 'sandbox', paths = {}; for (let j = GATE_J10; j >= GATE_J10 - 5; j--) paths[tI10(GATE_I10, j)] = 0;
  return {
    v: 1, id: 'P' + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36), name: sb ? 'Sandbox Park' : 'My Park', mode: sb ? 'sandbox' : 'career', made: Date.now(),
    money: sb ? 0 : 25000, loan: 0, day: 1, min: 540, speed: 1, open: true, fee: 10,
    land: sb ? '1'.repeat(NPL10 * NPL10) : startLand10(), paths, objs: [], nextId: 1, staff: { jan: 1, mech: 1 },
    rep: 18, rating: 0, xp: 0, perks: {}, goals: {}, seen: {}, led: newLed10(), tot: { inc: 0, exp: 0, guests: 0, rides: 0, turned: 0, sales: 0 }, hist: [],
    wx: { k: 'sunny', until: 0, auto: true }, clock: { auto: true }, look: { path: 0, gate: '#ff7a2f', sign: '#ffc233' }, custom: {}, promo: 0, tut: sb ? 9 : 0
  };
}
const landOwned10 = (P_, px, pz) => px >= 0 && pz >= 0 && px < NPL10 && pz < NPL10 && P_.land[pz * NPL10 + px] === '1';
const landCount10 = P_ => { let n = 0; for (const c of P_.land) if (c === '1') n++; return n };
const landPrice10 = P_ => Math.round((1800 + 650 * Math.max(0, landCount10(P_) - 8)) / 50) * 50;
// ---- coasters in the catalogue: every ride of the game the player can use, plus designs saved in the Track Builder
const coasterKey10 = d => 'c:' + (d.baseName || d.name);
function coasterDef10(key, P_) {
  if (key.startsWith('c:')) { const n = key.slice(2); return RIDES.find(r => (r.baseName || r.name) === n) || null }
  if (key.startsWith('u:')) { const P2 = P_ || TY.park, c = P2 && P2.custom[key.slice(2)]; return c ? customDef10(key.slice(2), c) : null }
  return null;
}
// a player's own design becomes a ride definition through the same generate → fillDef path the builder uses
const CUSTDEF10 = new Map();
function customDef10(id, c) {
  const sig = id + '|' + JSON.stringify(c.els).length + '|' + (c.name || ''); let d = CUSTDEF10.get(sig); if (d) return d;
  try { const r = sanDesign({ v: 2, name: c.name || 'My Coaster', els: c.els, style: c.style }); if (!r.ok) return null; const g = generate(r.D); if (g.bad) return null; d = { ...CUSTOM, pts: [], rollFn: null, zonesF: null, secF: null }; fillDef(d, r.D, g); const st = r.D.style || {};
    d.rail = st.rail ? parseInt(st.rail.slice(1), 16) : 0xe8503a; d.tie = st.tie ? parseInt(st.tie.slice(1), 16) : 0xe8e0c8; d.body = st.body ? parseInt(st.body.slice(1), 16) : 0xd94b3b; d.accent = st.accent ? parseInt(st.accent.slice(1), 16) : 0xffc233; d.dark = 0x2b3441; d.trainStyle = st.train || 'sit'; d.color = st.rail || '#ffc233'; d.name = cleanName(c.name) || 'My Coaster'; d.type = 'Your own design'; d.custom10 = id; CUSTDEF10.set(sig, d); return d }
  catch (e) { console.warn('10.0 custom coaster', e); return null }
}
// which coasters can be built right now (secret rides only once their secret is found)
function coasterList10(P_) {
  const a = []; RIDES.forEach((r, i) => { if (r.secret && !secOpen7(r.secret)) return; a.push({ key: coasterKey10(r), def: r, i }) });
  for (const id in (P_ || TY.park || { custom: {} }).custom) { const d = customDef10(id, (P_ || TY.park).custom[id]); if (d) a.push({ key: 'u:' + id, def: d, i: -1 }) }
  return a;
}
// ---- saving. Career and Sandbox are separate slots; everything read back is checked (never trust stored data).
const numP10 = (x, d, a, b) => typeof x === 'number' && isFinite(x) ? clamp(x, a, b) : d;
function cleanPark10(o, mode) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const P_ = newPark10(mode || (o.mode === 'sandbox' ? 'sandbox' : 'career')), sb = P_.mode === 'sandbox';
  if (typeof o.id === 'string' && /^[A-Za-z0-9]{4,40}$/.test(o.id)) P_.id = o.id; P_.name = cleanName(o.name) || P_.name; P_.made = numP10(o.made, P_.made, 0, 4e12);
  P_.money = sb ? 0 : numP10(o.money, 25000, -1e9, 1e12); P_.loan = numP10(o.loan, 0, 0, 1e7); P_.day = Math.round(numP10(o.day, 1, 1, 1e6)); P_.min = numP10(o.min, 540, 0, 1439.99); P_.speed = [0, 1, 2, 4].includes(o.speed) ? o.speed : 1; P_.open = o.open !== false; P_.fee = Math.round(numP10(o.fee, 10, 0, 80));
  if (typeof o.land === 'string' && /^[01]{36}$/.test(o.land)) P_.land = sb ? '1'.repeat(36) : o.land; if (P_.land[5 * NPL10 + 3] !== '1') P_.land = P_.land.slice(0, 33) + '1' + P_.land.slice(34);// the gate plot is always owned
  P_.paths = {}; if (o.paths && typeof o.paths === 'object') for (const k in o.paths) { const i = +k; if (Number.isInteger(i) && i >= 0 && i < GW10 * GH10) P_.paths[i] = Math.round(numP10(o.paths[k], 0, 0, PATHS10.length - 1)) }
  for (let j = GATE_J10; j >= GATE_J10 - 1; j--) if (P_.paths[tI10(GATE_I10, j)] == null) P_.paths[tI10(GATE_I10, j)] = 0;
  P_.custom = {}; if (o.custom && typeof o.custom === 'object') Object.keys(o.custom).slice(0, 24).forEach(id => { const c = o.custom[id]; if (!/^[a-z0-9]{2,24}$/i.test(id) || !c || !Array.isArray(c.els) || c.els.length > 60) return; try { const r = sanDesign({ v: 2, name: c.name, els: c.els, style: c.style }); if (r.ok) P_.custom[id] = { name: cleanName(c.name) || 'My Coaster', els: r.D.els.map(e => ({ t: e.t, p: e.p })), style: r.D.style } } catch (e) {} });
  P_.objs = []; let maxId = 0;
  if (Array.isArray(o.objs)) o.objs.slice(0, 900).forEach(q => {
    if (!q || typeof q !== 'object' || typeof q.k !== 'string') return; const isC = /^[cu]:/.test(q.k); if (!isC && !CAT10[q.k]) return; if (isC && !coasterDef10(q.k, P_)) return;
    const b = { id: Math.round(numP10(q.id, 0, 1, 1e7)), k: q.k, x: Math.round(numP10(q.x, 0, -40, GW10 + 40)), z: Math.round(numP10(q.z, 0, -40, GH10 + 40)), r: Math.round(numP10(q.r, 0, 0, 3)) };
    if (!b.id || P_.objs.some(x => x.id === b.id)) b.id = ++maxId + 100000; maxId = Math.max(maxId, b.id < 100000 ? b.id : 0);
    const C = CAT10[q.k]; if (isC || (C && (C.t === 'flat' || C.t === 'shop' || C.t === 'fac'))) {
      if (typeof q.name === 'string') b.name = cleanName(q.name); b.price = +numP10(q.price, -1, -1, 99).toFixed(2); b.open = q.open !== false; b.rel = numP10(q.rel, 100, 0, 100); b.age = numP10(q.age, 0, 0, 1e7);
      b.up = { cap: Math.round(numP10(q.up && q.up.cap, 0, 0, 3)), rel: Math.round(numP10(q.up && q.up.rel, 0, 0, 3)), fx: Math.round(numP10(q.up && q.up.fx, 0, 0, 3)) };
      b.st = { n: numP10(q.st && q.st.n, 0, 0, 1e9), inc: numP10(q.st && q.st.inc, 0, 0, 1e12), run: numP10(q.st && q.st.run, 0, 0, 1e12), like: numP10(q.st && q.st.like, 0, 0, 1e9), rated: numP10(q.st && q.st.rated, 0, 0, 1e9), down: numP10(q.st && q.st.down, 0, 0, 1e6) };
      if (q.col && typeof q.col === 'object') { b.col = {}; ['rail', 'tie', 'body', 'accent', 'roof'].forEach(k => { if (typeof q.col[k] === 'string' && /^#[0-9a-f]{6}$/i.test(q.col[k])) b.col[k] = q.col[k].toLowerCase() }); if (typeof q.col.train === 'string' && (STY10[q.col.train] || ['sit', 'inverted', 'flying', 'spinning'].includes(q.col.train))) b.col.train = q.col.train; if (Number.isInteger(q.col.stn) && q.col.stn >= 0 && q.col.stn < 4) b.col.stn = q.col.stn }
    }
    P_.objs.push(b);
  });
  P_.nextId = Math.max(maxId + 1, Math.round(numP10(o.nextId, 1, 1, 1e7)));
  P_.staff = { jan: Math.round(numP10(o.staff && o.staff.jan, 1, 0, 30)), mech: Math.round(numP10(o.staff && o.staff.mech, 1, 0, 20)) };
  P_.rep = numP10(o.rep, 18, 0, 100); P_.rating = numP10(o.rating, 0, 0, 100); P_.xp = Math.round(numP10(o.xp, 0, 0, 1e9)); P_.promo = numP10(o.promo, 0, 0, 1e5); P_.tut = Math.round(numP10(o.tut, sb ? 9 : 0, 0, 9));
  ['perks', 'goals', 'seen'].forEach(k => { if (o[k] && typeof o[k] === 'object') for (const q in o[k]) if (q.length < 40 && (typeof o[k][q] === 'number' || typeof o[k][q] === 'boolean')) P_[k][q] = o[k][q] });
  if (o.led && typeof o.led === 'object') { for (const k in P_.led.inc) P_.led.inc[k] = numP10(o.led.inc && o.led.inc[k], 0, 0, 1e12); for (const k in P_.led.exp) P_.led.exp[k] = numP10(o.led.exp && o.led.exp[k], 0, 0, 1e12) }
  if (o.tot && typeof o.tot === 'object') for (const k in P_.tot) P_.tot[k] = numP10(o.tot[k], 0, 0, 1e13);
  if (Array.isArray(o.hist)) P_.hist = o.hist.filter(h => h && typeof h === 'object').slice(-40).map(h => ({ day: Math.round(numP10(h.day, 1, 1, 1e6)), inc: numP10(h.inc, 0, 0, 1e12), exp: numP10(h.exp, 0, 0, 1e12), guests: numP10(h.guests, 0, 0, 1e7), peak: numP10(h.peak, 0, 0, 1e6), rating: numP10(h.rating, 0, 0, 100), happy: numP10(h.happy, 0, 0, 100), money: numP10(h.money, 0, -1e12, 1e12), wx: typeof h.wx === 'string' ? h.wx.slice(0, 10) : 'sunny' }));
  if (o.wx && typeof o.wx === 'object') { if (WX10[o.wx.k]) P_.wx.k = o.wx.k; P_.wx.until = numP10(o.wx.until, 0, 0, 1e9); P_.wx.auto = o.wx.auto !== false }
  if (o.clock && typeof o.clock === 'object') P_.clock.auto = o.clock.auto !== false;
  if (o.look && typeof o.look === 'object') { P_.look.path = Math.round(numP10(o.look.path, 0, 0, PATHS10.length - 1));['gate', 'sign'].forEach(k => { if (typeof o.look[k] === 'string' && /^#[0-9a-f]{6}$/i.test(o.look[k])) P_.look[k] = o.look[k] }) }
  return P_;
}
const WX10 = {// weather: how many visitors still come, the sky tint, how wet it is
  sunny: { n: 'Sunny', ic: '☀️', come: 1, cover: .15, dim: 1 }, cloudy: { n: 'Cloudy', ic: '☁️', come: .88, cover: .8, dim: .78 }, rain: { n: 'Rain', ic: '🌧', come: .5, cover: .95, dim: .6, rain: 1 },
  storm: { n: 'Thunderstorm', ic: '⛈', come: .28, cover: 1, dim: .42, rain: 1, storm: 1 }, fog: { n: 'Fog', ic: '🌫', come: .8, cover: .6, dim: .8, fog: 1 }
};
function parkJSON10(P_) { return JSON.stringify(P_) }
let saveT10 = 0;
function savePark10() { const P_ = TY.park; if (!P_ || TY.visit || !TY.slot) return false; return SS10('park.' + TY.slot, P_) }
function loadPark10(slot) { const raw = LS10('park.' + slot, null); return raw ? cleanPark10(raw, slot === 'sandbox' ? 'sandbox' : 'career') : null }
// rebuild the fast grids (ownership, paths, what stands where) from the park data
function gridSync10() {
  const P_ = TY.park; TY.occ.fill(0); TY.air.fill(0); TY.path.fill(0); TY.own.fill(0); TY.objById.clear();
  for (let pz = 0; pz < NPL10; pz++) for (let px = 0; px < NPL10; px++) if (landOwned10(P_, px, pz)) for (let j = 0; j < PLOT10; j++) for (let i = 0; i < PLOT10; i++) TY.own[tI10(px * PLOT10 + i, pz * PLOT10 + j)] = 1;
  for (const k in P_.paths) TY.path[+k] = P_.paths[k] + 1;
  const bad = []; for (const o of P_.objs) { const fp = footprint10(o); if (!fp || !fits10(fp, o, true)) { bad.push(o); continue } stamp10(o, fp, o.id); TY.objById.set(o.id, o) }
  if (bad.length) P_.objs = P_.objs.filter(o => !bad.includes(o));// anything that no longer fits (damaged save) is dropped, never drawn half inside something else
  TY.pathVer++;
}
function stamp10(o, fp, id) { for (const [i, j] of fp.solid) TY.occ[tI10(i, j)] = id; if (fp.air) for (const [i, j] of fp.air) if (id || TY.air[tI10(i, j)] === o.id) TY.air[tI10(i, j)] = id }
