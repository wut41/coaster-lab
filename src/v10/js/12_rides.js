// ---- 10.0 NEW COASTERS: ten new rides and a rebuild of the two 8.4 flagships. Every ride is a Track Builder design
// (see 11_designs.js), so the physics, G-forces, element detection, Lab, cameras and Ride Ops treat them exactly like
// every other ride. Each one has its own train type, world and scenery.
const RIDES10 = [
  ['Talon', { name: 'Talon Strike', type: 'Dive coaster', color: '#ff6a1f', rail: 0xff5a1f, tie: 0x2a2a2a, dark: 0x30343c, body: 0x1b1b1f, accent: 0xffc233, sky: ['#2b4f8f', '#f09a5c', '#ffe0a8'], fog: 0xf0c090, fogFar: 380, trainStyle: 'dive',
    env: { ground: 0xb07a4a, hi: 0xc9935a, amp: 11, ridge: 40, mesas: [18, 0xa65f3a], rocks: [34, 0x8a6a50], walls: [12, 0x7a553a], trees: [0, 0], peaks: [8, 0x9a7a5a] }, frame: [.5, 1] }, 'Raptor canyon · 90° drop, held at the edge'],
  ['Aurora', { name: 'Aurora Wing', type: 'Launched wing coaster', color: '#35f0c0', rail: 0x35f0c0, tie: 0x1a2540, dark: 0x24304a, body: 0xeaf6ff, accent: 0x7a5cff, sky: ['#020611', '#0b2a2a', '#1f6b56'], fog: 0x0a1a22, fogFar: 340, trainStyle: 'wing',
    env: { ground: 0xdfe9f2, hi: 0xb8cbe0, amp: 6, ridge: 70, rocks: [14, 0x9fb2c8], walls: [0, 0], trees: [0, 0], peaks: [16, 0xcfe0ee] }, frame: [.4, 1] }, 'Northern lights · keyhole fly-throughs'],
  ['Nightshade', { name: 'Nightshade', type: 'Inverted coaster', color: '#b04bff', rail: 0x7a2bd6, tie: 0x1d1028, dark: 0x241a30, body: 0x2a1240, accent: 0x9dff4a, sky: ['#1a0b2e', '#5a2a7a', '#e58ad0'], fog: 0x6a4a80, fogFar: 300, trainStyle: 'inverted',
    env: { ground: 0x2a3a2a, hi: 0x3d2f4a, amp: 5, ridge: 55, rocks: [22, 0x3a3344], walls: [0, 0], trees: [0, 0], peaks: [8, 0x3a2f4a] }, frame: [.4, 1] }, 'Twisted grove · 5 inversions, feet dangling'],
  ['Manta', { name: 'Sky Manta', type: 'Flying coaster', color: '#2aa8ff', rail: 0x1f8fff, tie: 0xe8f6ff, dark: 0xdfe8f0, body: 0x12356a, accent: 0x7fe8ff, sky: ['#1f78c8', '#7fd0ff', '#e6fbff'], fog: 0xbdeaf5, fogFar: 390, trainStyle: 'flying',
    env: { ground: 0xe2cf98, hi: 0x6fae5a, amp: 5, ridge: 60, rocks: [14, 0x8a7a66], walls: [0, 0], trees: [0, 0], peaks: [8, 0x5a8a5a] }, frame: [.4, 1] }, 'Coral lagoon · fly face-down over the water'],
  ['Turbo', { name: 'Turbo Circuit', type: 'Motorbike launch coaster', color: '#ff2a3d', rail: 0xe01b2e, tie: 0x202226, dark: 0x3a3d44, body: 0xe01b2e, accent: 0xffffff, sky: ['#2f74d0', '#8ec9ff', '#eaf6ff'], fog: 0xc7e2fb, fogFar: 380, trainStyle: 'bike',
    env: { ground: 0x4f8f4a, hi: 0x7fae62, amp: 3, ridge: 50, rocks: [0, 0], walls: [0, 0], trees: [26, 0x2f7a40], peaks: [8, 0x6d8f7c] }, frame: [.3, .95] }, 'Race circuit · two launches, no lift hill'],
  ['Timberwolf', { name: 'Timberwolf', type: 'Wooden coaster', color: '#d9a066', rail: 0x8a8f96, tie: 0x8a5a33, dark: 0x6b4a2f, body: 0x7a1f1f, accent: 0xe0b04a, sky: ['#3f86d8', '#9fd0ff', '#eef6ff'], fog: 0xbfdcf5, fogFar: 360, trainStyle: 'woodie', mat7: 'wood', noSup10: true, noSpine10: true, railR10: .055,
    env: { ground: 0x4f8a4a, hi: 0x7fa86a, amp: 6, ridge: 60, round: [20, 0x3e8a46], rocks: [14, 0x8d8f86], walls: [0, 0], trees: [0, 0], peaks: [10, 0x6d8f7c] }, frame: [.4, 1] }, 'Pine forest · 13 airtime hills on timber'],
  ['Hydra', { name: 'Hydra', type: 'Floorless 7-inversion coaster', color: '#19d37a', rail: 0x12b866, tie: 0x10202a, dark: 0x1f2e38, body: 0x0c3a2a, accent: 0xff3b6b, sky: ['#12303a', '#3f7f86', '#bfe6d8'], fog: 0x86b8b0, fogFar: 300, trainStyle: 'floorless',
    env: { ground: 0x35523a, hi: 0x5a7a4a, amp: 5, ridge: 55, rocks: [26, 0x55604e], walls: [0, 0], trees: [0, 0], peaks: [8, 0x4a6a5a] }, frame: [.45, 1] }, 'Serpent marsh · 7 inversions'],
  ['Cheddar', { name: 'Cheddar Chase', type: 'Spinning wild mouse', color: '#ffc21f', rail: 0xffc21f, tie: 0x8a5a2b, dark: 0x7a808a, body: 0xf6f1e7, accent: 0xff6a8a, sky: ['#3d8ee0', '#8fd0ff', '#d8f0ff'], fog: 0xa9dcff, fogFar: 280, trainStyle: 'spinning',
    env: { ground: 0x6fb86a, hi: 0x9bd07a, amp: 3, ridge: 40, rocks: [0, 0], walls: [0, 0], trees: [20, 0x2f9a5c], peaks: [6, 0x7da58a] }, frame: [.45, 1.1] }, 'Cheese factory · hairpin turns that spin you'],
  ['Dipper', { name: 'Little Dipper', type: 'Family coaster', color: '#ff7ac8', rail: 0xff7ac8, tie: 0xfff2b0, dark: 0x8aa0c8, body: 0x7ad0ff, accent: 0xffe14a, sky: ['#4a9bea', '#a6dbff', '#fdf3ff'], fog: 0xc9e8ff, fogFar: 260, trainStyle: 'sit',
    env: { ground: 0x7cc86a, hi: 0xa8e08a, amp: 2.5, ridge: 36, rocks: [0, 0], walls: [0, 0], trees: [16, 0x3fae6a], peaks: [5, 0x8fc0a0] }, frame: [.5, 1.2] }, 'Candy meadow · a gentle first coaster'],
  ['Pendulum', { name: 'Pendulum Pass', type: 'Suspended swinging coaster', color: '#e0a030', rail: 0x8a4a2a, tie: 0x3a2a20, dark: 0x4a4038, body: 0x2f5a3a, accent: 0xe0a030, sky: ['#2f6fd0', '#7fb6f2', '#dcecff'], fog: 0xb5d3f2, fogFar: 340, trainStyle: 'swing',
    env: { ground: 0x4aa56b, hi: 0xbfd0d8, amp: 9, ridge: 80, rocks: [16, 0x8d9aa5], walls: [0, 0], trees: [0, 0], peaks: [16, 0x9fb0bc] }, frame: [.4, 1] }, 'Alpine village · cars swing out on every turn']
];
Object.assign(THEMES, {
  'Talon Strike': { key: 'talon10', amb: 'desert', parts: 'dust', sunC: 0xffc890, sky: ['#2b4f8f', '#f09a5c', '#ffe0a8', 0xf0c090], fogFar: 1.2 },
  'Aurora Wing': { key: 'aurora10', amb: 'alpine', parts: 'snow', night: true, sunI: .5, sunC: 0x9fe8d8, hemiI: .5, glowRail: 0x35f0c0, glowI: .9, glowTie: 0x7a5cff, sky: ['#020611', '#0b2a2a', '#1f6b56', 0x0a1a22], glow: '120,255,210', fogFar: 1.2 },
  'Nightshade': { key: 'night10', amb: 'haunted', parts: 'wisps', sunC: 0xe0a0ff, sky: ['#1a0b2e', '#5a2a7a', '#e58ad0', 0x6a4a80], glow: '255,170,230', glowTie: 0x9dff4a },
  'Sky Manta': { key: 'manta10', amb: 'ocean', parts: 'spray', sky: ['#1f78c8', '#7fd0ff', '#e6fbff', 0xbdeaf5], fogFar: 1.3 },
  'Turbo Circuit': { key: 'turbo10', amb: 'city', parts: 'none' },
  'Timberwolf': { key: 'timber10', amb: 'park', parts: 'leaves' },
  'Hydra': { key: 'hydra10', amb: 'jungle', parts: 'fireflies', sky: ['#12303a', '#3f7f86', '#bfe6d8', 0x86b8b0], fogNear: .5, fogMul: .8 },
  'Cheddar Chase': { key: 'cheddar10', amb: 'park', parts: 'none' },
  'Little Dipper': { key: 'dipper10', amb: 'park', parts: 'leaves' },
  'Pendulum Pass': { key: 'pend10', amb: 'alpine', parts: 'none' }
});
// ---- scenery helpers (all run from the ride hook, so the track, terrain and train already exist)
function scatter10(type, n, minD, R, smin, smax, col) { const tmp = new THREE.Group(), n2 = Math.max(1, Math.round(n * Math.min(1, .45 + QUAL[gq].fx * .55))); for (let i = 0; i < n2; i++) { const [x, z] = freeSpot(minD, R); (SCN72[type] ? placeScn72 : placeScn)(type, x, z, rnd7(smin, smax), typeof col === 'function' ? col() : col, rnd7(0, 6.28), tmp) } rg.add(mergeGroup7(tmp)) }
// a gate the train flies through: two pylons and a lintel standing on the ground, square to the track
function gate10(q, half, over, col, glow) {
  frameAt(q); const hx = _s7.x, hz = _s7.z, l = Math.hypot(hx, hz) || 1, g = new THREE.Group(), y0 = hAt(_p7.x, _p7.z); g.position.set(_p7.x, y0, _p7.z); g.rotation.y = Math.atan2(-hz / l, hx / l);
  const m = mat(col, .5, .4), top = _p7.y - y0 + over, gm = new THREE.MeshBasicMaterial({ color: glow });
  for (const sx of [-1, 1]) { box(g, 1.3, top + 1.4, 1.8, m, sx * (half + .65), (top + 1.4) / 2, 0); const e = new THREE.Mesh(new THREE.BoxGeometry(.08, top + 1.2, .1), gm); e.position.set(sx * half, (top + 1.2) / 2, .92); g.add(e) }
  box(g, half * 2 + 2.6, 1.3, 1.8, m, 0, top + .75, 0); const e2 = new THREE.Mesh(new THREE.BoxGeometry(half * 2, .08, .1), gm); e2.position.set(0, top + .1, .92); g.add(e2); rg.add(g); return gm;
}
// neon rings along a stretch of track (launches), wide enough for the widest trains
function rings10(a, b, R, col, step = 5) { const n = Math.max(2, Math.floor((b - a) / step)), gm = new THREE.MeshBasicMaterial({ color: col }), ring = mkI(new THREE.TorusGeometry(R, .13, 6, 28), gm, n); for (let k = 0; k < n; k++) { const mb = frameAt(a + k * (b - a) / (n - 1)); _q7.setFromRotationMatrix(mb); ring.setMatrixAt(k, _m7.compose(_p7.clone().addScaledVector(_u7, .5), _q7, V(1, 1, 1))) } return gm }
// water at a fixed height with a gentle swell (one plane, one draw call)
function water10(y, col, op = .86, size = 520) { const wm = new THREE.MeshStandardMaterial({ color: col, roughness: .1, metalness: .25, transparent: true, opacity: op, envMapIntensity: 1.2 }), cx = (bb[0] + bb[1]) / 2, cz = (bb[2] + bb[3]) / 2, wa = new THREE.Mesh(new THREE.PlaneGeometry(size, size), wm); wa.rotation.x = -PI / 2; wa.position.set(cx, y, cz); wa.receiveShadow = true; rg.add(wa); return wa }
// spray where the train skims low (used by the splash turns)
function splash10(q0, q1, y, cols) { let t_ = 0; anim7.push((t, dt) => { if (!playing || v < 9 || !cars[0]) return; const q = ((s % L) + L) % L; if (q < q0 || q > q1) return; t_ -= dt; if (t_ > 0) return; t_ = .07; const c0 = cars[1] ? cars[1].position : cars[0].position; emit(c0.x, y + .3, c0.z, 16, { cols, sp: 6, up: 1.8, g: -11, life: 1, r: 1.8 }) }) }
// a grand station: a glazed arch hall over the standard platform, entry towers with beacons and a large name board
function grandStation10(d, col, glow) {
  const len = (d.srcEls && d.srcEls[0] && d.srcEls[0][1].len) || 16; frameAt(len * .5 + 1); const g = new THREE.Group(); g.position.copy(_p7); g.quaternion.setFromRotationMatrix(M.makeBasis(_s7, _u7, _t7));
  const R = 6.2, cx = 1.1, ribM = mat(col, .35, .7), glass = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, roughness: .08, metalness: .3, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false }), gm = new THREE.MeshBasicMaterial({ color: glow }), half = len / 2 + 2;
  const ribs = Math.max(4, Math.round(len / 3.2)); for (let k = 0; k <= ribs; k++) { const z = -half + k * 2 * half / ribs, r = new THREE.Mesh(new THREE.TorusGeometry(R, .16, 6, 22, PI), ribM); r.position.set(cx, -.3, z); r.castShadow = true; g.add(r) }
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R - .05, R - .05, half * 2, 22, 1, true, -PI / 2, PI), glass); shell.rotation.x = -PI / 2; shell.position.set(cx, -.3, 0); g.add(shell);
  for (const z of [-half, half]) for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.55, .8, 10.5, 10), ribM); t.position.set(cx + sx * (R + .4), 4.6, z); t.castShadow = true; g.add(t); const b = new THREE.Mesh(new THREE.SphereGeometry(.7, 12, 8), gm); b.position.set(cx + sx * (R + .4), 10.2, z); g.add(b) }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, half * 2), gm); strip.position.set(cx, R - .5, 0); strip.userData.night = 1; strip.visible = false; g.add(strip);
  sign(g, d.name, d.color, cx, R + 1.3, half + .2, 0, 9.5, 1.7); sign(g, d.name, d.color, cx, R + 1.3, -half - .2, 0, 9.5, 1.7);
  rg.add(g); anim7.push(t => gm.color.set(glow).multiplyScalar(.7 + .3 * Math.sin(t * 2.4)));
}
// ---- one world per ride
DECOR.talon10 = function (d) {
  scatter10('rock', 22, 14, 150, 2.5, 6.5, () => pick7([0x9a6a48, 0x8a553a, 0xb07a50])); scatter10('cactus', 26, 8, 110, .9, 1.7); scatter10('sandArch', 3, 30, 150, .45, .7);
  const hb = secRange(d, 2); if (hb) tunnel(hb[0] - 1, hb[1] + 2, 'glow', 0xff7a1f);// the holding brake at the edge of the drop
  const sp = secRange(d, 9); if (sp) { const q = sp[0] + (sp[1] - sp[0]) * .5; frameAt(q); const pool = new THREE.Mesh(new THREE.CircleGeometry(26, 40), new THREE.MeshStandardMaterial({ color: 0x2fb7c9, roughness: .12, metalness: .2, transparent: true, opacity: .9 })); pool.rotation.x = -PI / 2; pool.position.set(_p7.x, hAt(_p7.x, _p7.z) + .22, _p7.z); rg.add(pool); splash10(sp[0] + 4, sp[1] - 4, pool.position.y, ['#ffffff', '#bff4ff', '#7fe8ff']) }
  const lr = sec84(d, 1), bm = new THREE.MeshBasicMaterial({ color: 0xff5a1f }); if (lr) { const n = 8, o = mkI(new THREE.SphereGeometry(.32, 10, 8), bm, n); for (let i = 0; i < n; i++) { pose(lr[0] + (lr[1] - lr[0]) * (i + .5) / n, _p7, _t7, _u7); o.setMatrixAt(i, _m7.compose(_p7.clone().addScaledVector(_u7, 1.7), _q7.identity(), V(1, 1, 1))) } anim7.push(t => bm.color.setHex(Math.sin(t * 3) > 0 ? 0xff5a1f : 0x5a1c06)) }
};
DECOR.aurora10 = function (d) {
  scatter10('pine', 60, 9, 150, .9, 1.8, true); scatter10('snowman', 6, 12, 70, 1, 1.4); scatter10('rock', 12, 16, 150, 2, 4, 0xaab8c8);
  // aurora: wide curtains of light that hang in the sky and slowly change colour
  const cur = [], tx = canvasTex(8, 128, (c, W, H_) => { const g = c.createLinearGradient(0, 0, 0, H_); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.35, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H_) });
  for (let i = 0; i < 5; i++) { const m = new THREE.MeshBasicMaterial({ map: tx, color: 0x35f0c0, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, fog: false }), geo = new THREE.PlaneGeometry(300, 90, 30, 1), p = geo.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(p.getX(k) * .035 + i * 1.7) * 26); const me = new THREE.Mesh(geo, m), a = i / 5 * 6.28 + .4; me.userData.dir = V(Math.cos(a), 0, Math.sin(a)); me.rotation.y = -a + PI / 2; rg.add(me); cur.push(me) }
  anim7.push(t => cur.forEach((me, i) => { me.position.copy(camera.position).addScaledVector(me.userData.dir, 250); me.position.y = 105 + i * 9; me.material.color.setHSL(.42 + .16 * Math.sin(t * .18 + i * 1.3), .9, .55); me.material.opacity = .32 + .2 * Math.sin(t * .5 + i * 2.1) }));
  // keyholes on the big hill and one of the hops home: the wings pass between the pylons
  [[6, .5], [12, .5]].forEach(([k, f]) => { const r = secRange(d, k); if (r) { const gm = gate10(r[0] + (r[1] - r[0]) * f, 3.1, 3.4, 0x1a2540, 0x35f0c0); anim7.push(t => gm.color.setHSL(.45 + .1 * Math.sin(t * .7 + k), .9, .6)) } });
  (d.zonesF || []).filter(z => z.k === 'launch').forEach(z => { const a = z.fa * L, b = z.fb * L, gm = rings10(a + 2, b, 3.5, 0x7a5cff); tun7.push([a, b, 'gate']); anim7.push(t => { const on = s >= a - 6 && s <= b; gm.color.setHex(on && Math.sin(t * 30) > 0 ? 0xffffff : on ? 0x35f0c0 : 0x7a5cff) }) });
};
DECOR.night10 = function (d) {
  scatter10('deadtree', 55, 7, 110, .9, 1.9); scatter10('mushroom', 24, 7, 80, .8, 2.2); scatter10('rock', 12, 12, 120, 1.5, 3.5, 0x3a3344);
  // toxic pools that pulse, and thorn arches the train dives under
  const pm = new THREE.MeshBasicMaterial({ color: 0x7dff3a }), n = 9, pools = mkI(new THREE.CircleGeometry(1, 20).rotateX(-PI / 2), pm, n); for (let i = 0; i < n; i++) { const [x, z] = freeSpot(7, 75), r = rnd7(1.6, 4); pools.setMatrixAt(i, _m7.compose(V(x, hAt(x, z) + .08, z), _q7.identity(), V(r, 1, r * rnd7(.6, 1)))) } anim7.push(t => pm.color.setHSL(.27 + .04 * Math.sin(t * 1.3), 1, .45 + .12 * Math.sin(t * 2.1)));
  const am = mat(0x2a1838, .8, .1), tm = mat(0x1d1028, .7); [[4, .5], [7, .5], [10, .5]].forEach(([k, f]) => { const r = secRange(d, k); if (!r) return; frameAt(r[0] + (r[1] - r[0]) * f); const hx = _s7.x, hz = _s7.z, l = Math.hypot(hx, hz) || 1, g = new THREE.Group(), y0 = hAt(_p7.x, _p7.z), R = Math.max(6, _p7.y - y0 + 2.2); g.position.set(_p7.x, y0, _p7.z); g.rotation.y = Math.atan2(-hz / l, hx / l);
    const a = new THREE.Mesh(new THREE.TorusGeometry(R, .4, 7, 22, PI), am); a.castShadow = true; g.add(a); for (let j = 1; j < 8; j++) { const an = j / 8 * PI, th = new THREE.Mesh(new THREE.ConeGeometry(.18, 1.3, 5), tm); th.position.set(Math.cos(an) * (R + .7), Math.sin(an) * (R + .7), 0); th.rotation.z = an - PI / 2; g.add(th) } rg.add(g) });
};
DECOR.manta10 = function (d) {
  DECOR.water({ ...d, secF: null });// the lagoon, sand islands, palms and waterfall of the tropical world (without its rock tunnels)
  // coral arches and manta rays gliding just under the surface
  scatter10('arch', 5, 16, 110, .7, 1.2, () => pick7([0xff7a8a, 0xffa95a, 0xd96bd0]));
  const rm = mat(0x16345e, .5, .2), rays = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), rm); b.scale.set(2.4, .22, 1.5); g.add(b); const tl = new THREE.Mesh(new THREE.ConeGeometry(.12, 2.6, 5), rm); tl.rotation.x = -PI / 2; tl.position.z = -2.3; g.add(tl); g.userData = { a: rnd7(0, 6.28), r: rnd7(18, 60), w: rnd7(.05, .12) * (i % 2 ? 1 : -1), cx: (bb[0] + bb[1]) / 2 + rnd7(-30, 30), cz: (bb[2] + bb[3]) / 2 + rnd7(-30, 30) }; rg.add(g); rays.push(g) }
  anim7.push(t => rays.forEach(g => { const u = g.userData, a = u.a + t * u.w; g.position.set(u.cx + Math.cos(a) * u.r, .02 + Math.sin(t * .8 + u.a) * .06, u.cz + Math.sin(a) * u.r); g.rotation.y = -a + (u.w > 0 ? 0 : PI) }));
  const lo = secRange(d, 5); if (lo) splash10(lo[0], lo[1], .2, ['#ffffff', '#cfefff']);
};
DECOR.turbo10 = function (d) {
  // grandstands, tyre walls, flags and a start gantry whose lights go green when the launch fires
  const gs = new THREE.Group(), cols = [0xe01b2e, 0xffffff, 0x2b66d9]; for (let i = 0; i < 4; i++) { const [x, z] = freeSpot(13, 90), g = new THREE.Group(); for (let r = 0; r < 5; r++) box(g, 16, .5, 1.1, mat(cols[r % 3], .7), 0, .4 + r * .55, -r * 1.1); box(g, 16.6, .2, 6.6, mat(0x2a2f3a, .5, .4), 0, 5.2, -2.4); for (const sx of [-8, 8]) box(g, .25, 5.2, .25, mat(0x2a2f3a, .5, .4), sx, 2.6, -5.2); g.position.set(x, hAt(x, z), z); g.lookAt(P[0].x, hAt(x, z), P[0].z); gs.add(g) } rg.add(mergeGroup7(gs));
  const nT = Math.round(150 * Math.min(1, .5 + QUAL[gq].fx * .5)), tm = mat(0x1a1a1c, .9), tyres = mkI(new THREE.CylinderGeometry(.36, .36, .24, 10), tm, nT * 3, 0); let w = 0; for (let k = 0; k < nT; k++) { const i = Math.floor(k / nT * N); _s7.crossVectors(U[i], T[i]); const sd = k % 2 ? 1 : -1, x = P[i].x + _s7.x * 4.6 * sd, z = P[i].z + _s7.z * 4.6 * sd, y = hAt(x, z); if (P[i].y > 6) continue; for (let j = 0; j < 3; j++) tyres.setMatrixAt(w++, _m7.compose(V(x, y + .12 + j * .24, z), _q7.identity(), V(1, 1, 1))) } tyres.count = w;
  scatter10('flag', 14, 6, 70, .8, 1.2, () => pick7([0xffffff, 0xe01b2e, 0x111111]));
  (d.zonesF || []).filter(z => z.k === 'launch').forEach((z, zi) => { const a = z.fa * L, b = z.fb * L, lm = new THREE.MeshBasicMaterial({ color: 0xff2a2a }); frameAt(a + 1.5); const g = new THREE.Group(), y0 = hAt(_p7.x, _p7.z), hx = _s7.x, hz = _s7.z, l = Math.hypot(hx, hz) || 1; g.position.set(_p7.x, y0, _p7.z); g.rotation.y = Math.atan2(-hz / l, hx / l); const pm = mat(0x2a2f3a, .5, .5), top = _p7.y - y0 + 3.6;
    for (const sx of [-3.2, 3.2]) box(g, .35, top + .5, .35, pm, sx, (top + .5) / 2, 0); box(g, 7, .7, .5, pm, 0, top + .3, 0); for (let j = 0; j < 5; j++) { const o = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), lm); o.position.set(-1.6 + j * .8, top + .3, .3); g.add(o) } rg.add(g); tun7.push([a, b, 'gate']);
    anim7.push(() => { const q = ((s % L) + L) % L; lm.color.setHex(q >= a - 1 && q <= b + 20 ? 0x2aff5a : 0xff2a2a) }) });
};
DECOR.timber10 = function (d) {
  scatter10('pine', 90, 8, 150, 1, 2.1); scatter10('house', 3, 22, 110, 1.1, 1.5, 0x7a5230); scatter10('rock', 10, 12, 130, 1.5, 3, 0x8d8f86);
  // the timber structure: bents (two posts, ledgers and a cross brace per level) every ~2.6 m, and plank ties under the rails
  const wm = mat(0xd2b48a, .92), step = Math.max(2, Math.round(2.6 / (L / N))), posts = [], led = [], dia = [], S = V(), Zv = V(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  for (let i = 0; i < N; i += step) { if (U[i].y < .5) continue; S.crossVectors(U[i], T[i]).setY(0); if (S.lengthSq() < 1e-4) continue; S.normalize(); Zv.crossVectors(S, Yax); q.setFromRotationMatrix(M.makeBasis(S, Yax, Zv)); const top = P[i].y - .3, g0 = hAt(P[i].x, P[i].z) - .15, h = top - g0; if (h < .7) continue;
    for (const o of [-.8, .8]) posts.push(new THREE.Matrix4().compose(V(P[i].x + S.x * o, g0 + h / 2, P[i].z + S.z * o), q, V(1, h, 1)));
    let lv = 0; for (let y = g0 + 2.4; y < top - .5; y += 2.6, lv++) { led.push(new THREE.Matrix4().compose(V(P[i].x, y, P[i].z), q, V(1, 1, 1))); if (y + 2.6 < top + .4) { q2.setFromAxisAngle(Zv, (lv % 2 ? 1 : -1) * Math.atan2(1.6, 2.6)); dia.push(new THREE.Matrix4().compose(V(P[i].x, y + 1.3, P[i].z), q2.multiply(q), V(1, 1, 1))) } }
    led.push(new THREE.Matrix4().compose(V(P[i].x, top, P[i].z), q, V(1, 1, 1))) }
  const inst = (geo, arr, sh) => { if (!arr.length) return; const o = mkI(geo, wm, arr.length, sh); arr.forEach((m, k) => o.setMatrixAt(k, m)) };
  inst(new THREE.BoxGeometry(.17, 1, .17), posts, 1); inst(new THREE.BoxGeometry(1.78, .1, .13), led, 0); inst(new THREE.BoxGeometry(.1, 3.05, .1), dia, 0);
  const nP = Math.floor(L / 1.25), pl = mkI(new THREE.BoxGeometry(1.9, .07, .22), mat(0x9a6b3f, .95), nP, 0); for (let k = 0; k < nP; k++) { const i = Math.floor(k / nP * N); S.crossVectors(U[i], T[i]); q.setFromRotationMatrix(M.makeBasis(S, U[i], T[i])); pl.setMatrixAt(k, _m7.compose(P[i].clone().addScaledVector(U[i], -.14), q, V(1, 1, 1))) }
};
DECOR.hydra10 = function (d) {
  water10(-.42, 0x2f4a3a, .88); scatter10('rock', 16, 12, 130, 1.5, 4, 0x55604e); scatter10('deadtree', 20, 9, 120, .8, 1.5); scatter10('bush', 40, 6, 100, .9, 1.8);
  // seven serpent heads rising out of the marsh
  const tmp = new THREE.Group(), nm = mat(0x1d5a3a, .55, .15), em = new THREE.MeshBasicMaterial({ color: 0xffe14a }), cx = (bb[0] + bb[1]) / 2, cz = (bb[2] + bb[3]) / 2;
  for (let i = 0; i < 7; i++) { const [x, z] = freeSpot(11, 85), y = hAt(x, z) - .4, a = Math.atan2(cz - z, cx - x), h = rnd7(10, 19), dx = Math.cos(a), dz = Math.sin(a), pts = [V(x, y, z), V(x - dx * 2, y + h * .5, z - dz * 2), V(x + dx * 1.5, y + h, z + dz * 1.5), V(x + dx * 6, y + h * .93, z + dz * 6)], cv = new THREE.CatmullRomCurve3(pts);
    const neck = new THREE.Mesh(new THREE.TubeGeometry(cv, 18, 1.05, 8, false), nm); tmp.add(neck); const hd = new THREE.Group(); hd.position.copy(pts[3]); hd.rotation.y = -a + PI / 2; const sk = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 9), nm); sk.scale.set(1, .75, 1.6); hd.add(sk); const jw = new THREE.Mesh(new THREE.ConeGeometry(1, 2.6, 8), nm); jw.rotation.x = PI / 2; jw.position.set(0, -.5, 2.2); hd.add(jw);
    for (const ex of [-.7, .7]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.24, 8, 6), em); e.position.set(ex, .5, 1.5); hd.add(e) } for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.3, 1.2, 5), nm); sp.position.set(0, 1.2, -1.2 + k * .8); hd.add(sp) } tmp.add(hd) }
  rg.add(mergeGroup7(tmp)); anim7.push(t => em.color.setHex(Math.sin(t * 2.3) > -.6 ? 0xffe14a : 0x5a4a10));
};
DECOR.cheddar10 = function (d) {
  // giant cheese wedges with holes, and a little cheese factory
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(7, 0); sh.lineTo(0, 4.4); sh.lineTo(0, 0); const wg = new THREE.ExtrudeGeometry(sh, { depth: 4.2, bevelEnabled: false }), tmp = new THREE.Group(), cm = mat(0xffc21f, .7), hm = mat(0xd99a00, .8);
  for (let i = 0; i < 9; i++) { const [x, z] = freeSpot(9, 70), g = new THREE.Group(), w = new THREE.Mesh(wg, cm); g.add(w); for (let k = 0; k < 6; k++) { const hole = new THREE.Mesh(new THREE.CylinderGeometry(rnd7(.3, .7), rnd7(.3, .7), .12, 12), hm); hole.rotation.x = PI / 2; hole.position.set(rnd7(.6, 4), rnd7(.4, 2), k % 2 ? 4.22 : -.02); g.add(hole) } const s_ = rnd7(.6, 1.4); g.scale.setScalar(s_); g.position.set(x, hAt(x, z) - .05, z); g.rotation.y = rnd7(0, 6.28); tmp.add(g) }
  const [fx, fz] = freeSpot(14, 60), f = new THREE.Group(); box(f, 9, 5, 7, mat(0xf2ead8, .85), 0, 2.5, 0); box(f, 9.6, .5, 7.6, mat(0xd94b3b, .6), 0, 5.2, 0); const ch = new THREE.Mesh(new THREE.CylinderGeometry(.7, .9, 6, 10), mat(0xb5553a, .8)); ch.position.set(3, 8, -1.5); f.add(ch); f.position.set(fx, hAt(fx, fz), fz); f.rotation.y = rnd7(0, 6.28); tmp.add(f);
  rg.add(mergeGroup7(tmp)); scatter10('bush', 22, 6, 70, .9, 1.6); anim7.push((t, dt) => { if (Math.random() < dt * 3) emit(fx + 3, hAt(fx, fz) + 11.5, fz - 1.5, 2, { cols: ['#ffffff', '#e8e8e8'], sp: .6, up: 1, g: 1.4, life: 3.5, drag: .4 }) });
};
DECOR.dipper10 = function (d) {
  scatter10('lolly', 26, 6, 70, .9, 1.8); scatter10('mushroom', 18, 6, 70, .8, 1.6); scatter10('bush', 26, 6, 80, .8, 1.5);
  // balloons on strings that bob in the breeze
  const cols = [0xff5a6e, 0xffc233, 0x36a7ff, 0x2fd18b, 0x9b6bff, 0xff7ac8], bl = []; for (let i = 0; i < 16; i++) { const [x, z] = freeSpot(6, 55), g = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(.55, 12, 9), mat(cols[i % 6], .35)); b.scale.y = 1.2; b.position.y = 4; g.add(b); const st = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 3.4, 4), lapMat); st.position.y = 2; g.add(st); g.position.set(x, hAt(x, z), z); g.userData.p = rnd7(0, 6.28); rg.add(g); bl.push(g) }
  anim7.push(t => bl.forEach(g => { g.rotation.z = Math.sin(t * 1.1 + g.userData.p) * .12; g.rotation.x = Math.cos(t * .9 + g.userData.p) * .1 }));
};
DECOR.pend10 = function (d) {
  scatter10('pine', 80, 9, 150, 1, 2.2); scatter10('chalet', 8, 16, 110, .9, 1.3); scatter10('rock', 14, 12, 140, 1.5, 4, 0x8d9aa5);
  const [lx, lz] = freeSpot(26, 95), lake = new THREE.Mesh(new THREE.CircleGeometry(20, 36), new THREE.MeshStandardMaterial({ color: 0x3a9ad0, roughness: .1, metalness: .25 })); lake.rotation.x = -PI / 2; lake.position.set(lx, hAt(lx, lz) + .25, lz); lake.scale.set(1.4, 1, 1); rg.add(lake);
};
// ---- register the ten new rides after every earlier ride (existing ride numbers and saved data are unchanged)
function frameDef10(def, g, fr) { const b = new THREE.Box3().setFromPoints(g.P), c = b.getCenter(V()), sz = b.getSize(V()); def.center = [c.x, Math.max(6, sz.y * fr[0]), c.z]; def.orbitR = (Math.max(sz.x, sz.z) * .62 + 24) * fr[1]; def.shadow = Math.max(sz.x, sz.z) * .62 + 12 }
RIDES10.forEach(([key, meta, tag]) => {
  try {
    const els = DSN10[key], D_ = mkD(meta.name, els), g = generate(D_); if (g.bad) throw new Error('track does not generate (section ' + g.badSec + ')');
    const def = { ...meta }; fillDef(def, D_, g); def.trainStyle = meta.trainStyle || 'sit'; def.mat7 = meta.mat7 || 'steel'; def.sig84 = true; def.v10 = key; def.srcEls = els; def.sigD84 = D_; frameDef10(def, g, meta.frame || [.35, 1]);
    RIDES.push(def); TAG.push(tag);
  } catch (e) { console.warn('10.0 ride skipped: ' + meta.name, e) }
});
// ---- the two flagships, rebuilt on their 8.4 identity: Thunder Comet (storm launch) and Nova Giant (hyper)
function rework10(name, key, patch, tag) {
  const i = RIDES.findIndex(r => r.name === name); if (i < 0) return;
  try { const els = DSN10[key], D_ = mkD(name, els), g = generate(D_); if (g.bad) throw new Error('track does not generate'); const def = RIDES[i]; fillDef(def, D_, g); Object.assign(def, patch); def.srcEls = els; def.sigD84 = D_; def.v10 = key; _smp.delete(def); frameDef10(def, g, patch.frame || [.42, 1.02]); TAG[i] = tag }
  catch (e) { console.warn('10.0 flagship rebuild skipped: ' + name, e) }
}
rework10('Thunder Comet', 'Comet2', { type: 'Storm launch coaster · flagship', trainStyle: 'bullet', frame: [.42, 1], glow84: [[6, 0x22e0ff], [7, 0xffe14a]] }, 'Storm skyline · 0 to 136 km/h, 46 m top hat');
rework10('Nova Giant', 'Nova2', { type: 'Hyper coaster · flagship', trainStyle: 'hyper', frame: [.45, 1.05] }, 'Skyline valley · 60 m drop, 26 m loop');
{ const f0 = DECOR.comet84; DECOR.comet84 = function (d) { f0(d); grandStation10(d, 0x2a2f52, 0x22e0ff);
  // a ring of storm cloud around the top hat that flickers with the lightning
  const th = secRange(d, 2); if (th) { pose(th[1], _p7, _t7, _u7); const cm = new THREE.MeshStandardMaterial({ color: 0x3a3f66, roughness: 1, transparent: true, opacity: .9, emissive: 0x22e0ff, emissiveIntensity: 0 }), g = new THREE.Group(); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28, b = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd7(3, 5), 1), cm); b.position.set(Math.cos(a) * 15, rnd7(-1.5, 1.5), Math.sin(a) * 15); b.scale.y = .55; g.add(b) } g.position.set(_p7.x, _p7.y + 4, _p7.z); rg.add(g); anim7.push((t, dt) => { g.rotation.y += dt * .15; cm.emissiveIntensity = flash7 > 0 ? flash7 * 1.6 : Math.max(0, cm.emissiveIntensity - dt * 2) }) } } }
{ const f0 = DECOR.nova84; DECOR.nova84 = function (d) { f0(d); grandStation10(d, 0xff7a2f, 0xffc233);
  // the Nova ring: a golden halo the train threads at the top of the loop, and pennants up the lift
  const lp = secRange(d, 4); if (lp) { frameAt((lp[0] + lp[1]) / 2); const rm = new THREE.MeshStandardMaterial({ color: 0xffc233, roughness: .25, metalness: .8, emissive: 0xff9a1f, emissiveIntensity: .5 }), r = new THREE.Mesh(new THREE.TorusGeometry(7.5, .5, 10, 44), rm), g = new THREE.Group(); g.position.copy(_p7).addScaledVector(_u7, .8); g.quaternion.setFromRotationMatrix(M.makeBasis(_s7, _u7, _t7)); g.add(r); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28, ry = new THREE.Mesh(new THREE.ConeGeometry(.5, 3.4, 6), rm); ry.position.set(Math.cos(a) * 9.6, Math.sin(a) * 9.6, 0); ry.rotation.z = a - PI / 2; g.add(ry) } rg.add(g); anim7.push(t => { rm.emissiveIntensity = .45 + .3 * Math.sin(t * 1.6) }) }
  const lr = sec84(d, 1); if (lr) { const fm = new THREE.MeshStandardMaterial({ color: 0xffc233, side: THREE.DoubleSide, roughness: .7 }), n = 10, fl = mkI(new THREE.PlaneGeometry(1.3, .7), fm, n), po = mkI(new THREE.CylinderGeometry(.04, .04, 3, 5), lapMat, n); for (let i = 0; i < n; i++) { pose(lr[0] + (lr[1] - lr[0]) * (i + .5) / n, _p7, _t7, _u7); _s7.crossVectors(_u7, _t7); const b = _p7.clone().addScaledVector(_s7, 1.3); po.setMatrixAt(i, _m7.compose(b.clone().add(V(0, 1.5, 0)), _q7.identity(), V(1, 1, 1))); fl.setMatrixAt(i, _m7.compose(b.clone().add(V(.65, 2.6, 0)), _q7.identity(), V(1, 1, 1))) } } } }
// the Daily Challenge and the ride list read tags and names; nothing else depends on how many rides exist
DBG10.rides = () => RIDES.map((r, i) => r.v10 ? { i, name: r.name, key: r.v10, style: r.trainStyle, tag: TAG[i] } : null).filter(Boolean);
DBG10.rideStats = i => { const d = RIDES[i]; if (!d) return null; const c = ctxOf(d), tr = traceOf(c), st = statsOf(c, tr, 0), E = elementsOf(c, tr); return { name: d.name, T: +tr.T.toFixed(1), v: +tr.vmax.toFixed(1), g: +st.gMax.toFixed(2), gmin: +st.gMin.toFixed(2), lat: +st.lat.toFixed(2), air: +st.air.toFixed(1), inv: E.inv, h: +st.maxH.toFixed(1), len: Math.round(c.L), stall: tr.stall >= 0, done: tr.done } };
