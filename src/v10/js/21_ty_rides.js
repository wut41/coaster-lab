// ---- 10.0 MY PARK — rides: how a coaster of the game becomes a park attraction, footprints, and the 3D models.
// A park coaster is a replica of the real ride: the same centre line (scaled so it fits a park plot), the same banking,
// and a train that follows the ride's own simulated lap (standard Earth physics, the same equations as the ride).
const RP10 = new Map();
// the classic four are already "park scale"; rides built from track pieces are in real metres and are scaled down
const SEATS10 = { sit: 2, spinning: 2, inverted: 2, flying: 2, swing: 2, woodie: 2, hyper: 2, bullet: 2, bike: 2, wing: 4, floorless: 4, dive: 6 };
const HANG10 = { inverted: 1, flying: 1, swing: 1 };
// run fn with standard Earth physics, whatever the Lab or Gravity Lab is set to (park attractions are rated once, fairly)
function earth10(fn) { if (!phMod()) return fn(); const sv = { ...PH }; Object.assign(PH, PH0); physChanged(); try { return fn() } finally { Object.assign(PH, sv); physChanged() } }
// one lap with the ride's equations and standard settings: time → distance, sampled every 0.1 s
function parkLap10(c) {
  const g = PH0.g, fr = PH0.fric, dr = PH0.drag, LV = PH0.lift, BK = PH0.brake, h = 1 / 240, L_ = c.L, Z = c.ZN, ts = [0], ss = [0]; let s_ = 0, v_ = LV, t = 0, n = 0;
  while (t < 600) {
    const i = Math.floor(s_ / L_ * N) % N;
    if (Z) { v_ += (-g * c.T[i].y - fr - dr * v_ * v_) * h; for (const z of Z) if (s_ >= z.a && s_ < z.b) { if (z.k === 'lift') { if (v_ < LV) v_ = LV } else if (z.k === 'launch') { if (v_ < z.v) v_ = Math.min(z.v, v_ + z.acc * h) } else if (z.k === 'brake') { if (v_ > z.v) v_ = Math.max(z.v, v_ - BK * h) } else if (z.k === 'station') { v_ = v_ > z.v ? Math.max(z.v, v_ - BK * h) : Math.min(z.v, v_ + 2 * h) } } v_ = Math.max(v_, 1.5) }
    else if (s_ < c.sCrest - .5) v_ = LV; else { v_ += (-g * c.T[i].y - fr - dr * v_ * v_) * h; if (s_ > L_ - c.BR && v_ > LV) v_ = Math.max(LV, v_ - BK * h); v_ = Math.max(v_, 1.5) }
    s_ += v_ * h; t += h; n++; if (s_ >= L_) { ts.push(t); ss.push(L_); break } if (n % 24 === 0) { ts.push(t); ss.push(s_) }
  }
  return { t: Float32Array.from(ts), s: Float32Array.from(ss), T: t };
}
function rideProf10(def) {
  let p = RP10.get(def); if (p) return p;
  const c = ctxOf(def), m = earth10(() => { const tr = traceOf(c), st = statsOf(c, tr, 0), E = elementsOf(c, tr); return { thrill: st.thrill, intensity: st.intensity, comfort: st.comfort, air: st.air, inv: E.inv, h: st.maxH, vmax: tr.vmax } });
  const P0 = c.P[0], t0 = c.T[0], psi = Math.atan2(t0.z, t0.x), cs = Math.cos(psi), sn = Math.sin(psi), classic = !def.zonesF;
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; const raw = new Float32Array(N * 3), up = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const q = c.P[i], dx = q.x - P0.x, dz = q.z - P0.z, X = dx * cs + dz * sn, Z = -dx * sn + dz * cs, u = c.U[i]; raw[i * 3] = X; raw[i * 3 + 1] = q.y + .7; raw[i * 3 + 2] = Z; up[i * 3] = u.x * cs + u.z * sn; up[i * 3 + 1] = u.y; up[i * 3 + 2] = -u.x * sn + u.z * cs; x0 = Math.min(x0, X); x1 = Math.max(x1, X); z0 = Math.min(z0, Z); z1 = Math.max(z1, Z) }
  const big = Math.max(x1 - x0, z1 - z0), sc = Math.min(classic ? 1 : .42, 100 / big), pts = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) pts[i] = raw[i] * sc;
  const lap = parkLap10(c), tk = Math.sqrt(sc), style = def.trainStyle || 'sit';// a scale model runs √scale faster (same gravity)
  let SL = 10; if (def.srcEls && def.srcEls[0]) SL = +def.srcEls[0][1].len || 14; else if (def.zonesF) { const z = def.zonesF.find(q => q.k === 'station'); if (z) SL = (z.fb - z.fa) * c.L }
  const exc = clamp(m.thrill * .8 + Math.min(m.air, 6) * 2 + Math.min(m.inv, 7) * 1.5, 6, 100), int = classic ? clamp(34 + m.inv * 12 + m.h * .6, 10, 100) : m.intensity, nau = classic ? clamp(18 + m.inv * 10, 0, 100) : clamp((100 - m.comfort) * .5 + m.inv * 3.5, 0, 100);
  p = {
    def, c, sc, pts, up, L: c.L * sc, bb: [x0 * sc, x1 * sc, z0 * sc, z1 * sc], H: m.h * sc, lapT: lap.t, lapS: lap.s, T: lap.T * tk, tk, SL: Math.max(6, Math.min(SL * sc, 12)), style, seats: (SEATS10[style] || 2) * 4, hang: !!HANG10[style],
    exc: Math.round(exc), int: Math.round(int), nau: Math.round(nau), inv: m.inv, realH: m.h, realV: m.vmax, realL: c.L, yS: pts[1],
    hw: style === 'wing' ? 1.95 : style === 'dive' ? 1.7 : style === 'floorless' ? 1.2 : .5,// half width of the train: the platform edge stands clear of it
    cost: Math.round((4200 + c.L * 9 + m.h * 150 + m.inv * 1100) / 100) * 100, run: Math.round(24 + c.L * .035 + m.h * .45), lv: def.name === 'Thunder Comet' || def.name === 'Nova Giant' ? 9 : exc < 32 ? 1 : exc < 58 ? 2 : exc < 76 ? 4 : exc < 92 ? 6 : 8, fare: Math.max(2, Math.round(exc / 14))
  };
  p.zp0 = -(p.hw + .3); p.zp1 = p.zp0 - 2.1; p.yP = p.hang ? Math.max(.25, p.yS - 1.9) : p.yS - .32;// platform: inner edge, outer edge, height
  RP10.set(def, p); return p;
}
// what a thing in the park is, whatever kind it is: {t, n, ic, cost, exc, int, nau, cap, dur, run, lv, fare, prof?}
function objInfo10(o) {
  if (o.k[1] === ':') { const def = coasterDef10(o.k); if (!def) return null; const p = rideProf10(def); return { t: 'coaster', n: def.name, ic: '🎢', cost: p.cost, exc: p.exc, int: p.int, nau: p.nau, cap: p.seats, dur: p.T, run: p.run, lv: p.lv, fare: p.fare, prof: p, def, type: def.type } }
  return CAT10[o.k] || null;
}
const objName10 = o => (o.name && o.name.length ? o.name : (objInfo10(o) || {}).n) || 'Attraction';
// ---- footprints. solid = tiles the thing stands on; air = tiles under low track (paths and small scenery may use them);
// pad = the queue yard of a ride; all in grid tiles. Local frame of a coaster: origin = start of the station, track heads +x,
// the platform and the queue yard are on the left (−z).
const rotL10 = (x, z, r) => r === 0 ? [x, z] : r === 1 ? [-z, x] : r === 2 ? [-x, -z] : [z, -x];
const FPC10 = new Map();
function coasterCells10(p, r) {
  const key = r; p.fp = p.fp || {}; if (p.fp[key]) return p.fp[key];
  const solid = new Map(), air = new Map(), put = (m, x, z) => { const [X, Z] = rotL10(x, z, r), i = Math.floor(X / TS10), j = Math.floor(Z / TS10); m.set(i + ',' + j, [i, j]) };
  for (let i = 0; i < N; i++) { const x = p.pts[i * 3], y = p.pts[i * 3 + 1], z = p.pts[i * 3 + 2]; if (y < 4.4) { for (const dx of [-.7, .7]) for (const dz of [-.7, .7]) put(solid, x + dx, z + dz) } else if (y < 11) put(air, x, z) }
  // the station complex: platform strip and an 8 × 8 m queue yard on the left of the station
  const pad = []; for (let a = 0; a < 2; a++) for (let b = -3; b < 0; b++) { put(solid, a * 4 + 2, b * 4 + 2); if (b < -1) { const [X, Z] = rotL10(a * 4 + 2, b * 4 + 2, r); pad.push([Math.floor(X / TS10), Math.floor(Z / TS10)]) } }
  for (let x = 1; x < p.SL + 1; x += 2) for (const z of [-2.5, -.5, .6]) put(solid, x, z);
  air.forEach((v_, k) => { if (solid.has(k)) air.delete(k) });
  return p.fp[key] = { solid: [...solid.values()], air: [...air.values()], pad };
}
function footprint10(o) {
  const inf = objInfo10(o); if (!inf) return null;
  if (inf.t === 'coaster') { const f = coasterCells10(inf.prof, o.r), sh = a => a.map(([i, j]) => [i + o.x, j + o.z]); return { solid: sh(f.solid), air: sh(f.air), pad: sh(f.pad), coaster: true } }
  const W = o.r % 2 ? inf.d : inf.w, D = o.r % 2 ? inf.w : inf.d, solid = []; for (let j = 0; j < D; j++) for (let i = 0; i < W; i++) solid.push([o.x + i, o.z + j]);
  return { solid, W, D, pad: inf.t === 'flat' ? solid : null };
}
// can it stand there? Returns '' when it fits, or the reason in plain words.
function fitWhy10(fp, o, loading) {
  const inf = objInfo10(o), small = inf && inf.t === 'deco';
  for (const [i, j] of fp.solid) { if (!inG10(i, j)) return 'It reaches outside the park grounds'; const k = tI10(i, j); if (!TY.own[k]) return 'Part of it is on land you do not own yet'; if (TY.occ[k] && TY.occ[k] !== o.id) return 'Something is already built there'; if (TY.path[k]) return 'A path is in the way'; if (!small && TY.air[k] && TY.air[k] !== o.id) return 'A coaster track passes low over that spot' }
  if (fp.air) for (const [i, j] of fp.air) { if (!inG10(i, j)) return 'It reaches outside the park grounds'; const k = tI10(i, j); if (!TY.own[k]) return 'Part of it is over land you do not own yet'; const q = TY.occ[k]; if (q && q !== o.id) { const b = TY.objById.get(q), bi = b && objInfo10(b); if (!bi || bi.t !== 'deco') return 'The track would pass through ' + (b ? objName10(b) : 'something') } if (TY.air[k] && TY.air[k] !== o.id) return 'It would cross another coaster' }
  return '';
}
const fits10 = (fp, o, loading) => fitWhy10(fp, o, loading) === '';
// ---- small geometry helpers: many boxes with their own colours merged into ONE mesh (one draw call)
function mergeCol10(parts) {
  let nV = 0, nI = 0; for (const [g] of parts) { nV += g.attributes.position.count; nI += g.index ? g.index.count : g.attributes.position.count }
  const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), col = new Float32Array(nV * 3), idx = new Uint32Array(nI), nm = new THREE.Matrix3(), v_ = V(), cc = new THREE.Color(); let vo = 0, io = 0;
  for (const [g, m, c] of parts) { const p_ = g.attributes.position, n_ = g.attributes.normal; nm.getNormalMatrix(m); cc.set(c);
    for (let i = 0; i < p_.count; i++) { v_.fromBufferAttribute(p_, i).applyMatrix4(m); pos[(vo + i) * 3] = v_.x; pos[(vo + i) * 3 + 1] = v_.y; pos[(vo + i) * 3 + 2] = v_.z; v_.fromBufferAttribute(n_, i).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v_.x; nor[(vo + i) * 3 + 1] = v_.y; nor[(vo + i) * 3 + 2] = v_.z; col[(vo + i) * 3] = cc.r; col[(vo + i) * 3 + 1] = cc.g; col[(vo + i) * 3 + 2] = cc.b }
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[io + i] = g.index.getX(i) + vo; io += g.index.count } else { for (let i = 0; i < p_.count; i++) idx[io + i] = vo + i; io += p_.count } vo += p_.count; g.dispose() }
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.BufferAttribute(pos, 3)); o.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); o.setAttribute('color', new THREE.BufferAttribute(col, 3)); o.setIndex(new THREE.BufferAttribute(idx, 1)); o.computeBoundingSphere(); return o;
}
const TYM = {};// shared materials of the park world (made once)
function tyMats10() {
  if (TYM.vc) return TYM;
  TYM.vc = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .62, metalness: .12, envMapIntensity: .6 });
  TYM.vcMetal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .35, metalness: .55, envMapIntensity: .8 });
  TYM.glow = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  TYM.ghostOk = new THREE.MeshBasicMaterial({ color: 0x2fe38a, transparent: true, opacity: .42, depthWrite: false }); TYM.ghostBad = new THREE.MeshBasicMaterial({ color: 0xff4a4a, transparent: true, opacity: .48, depthWrite: false }); TYM.ghostAir = new THREE.MeshBasicMaterial({ color: 0x5ab8ff, transparent: true, opacity: .26, depthWrite: false });
  return TYM;
}
class Kit10 {// collects coloured boxes / cylinders and turns them into one mesh
  constructor() { this.p = []; this.e = new THREE.Euler(); this.q = new THREE.Quaternion(); this.one = V(1, 1, 1) }
  add(g, c, x, y, z, rx = 0, ry = 0, rz = 0) { this.q.setFromEuler(this.e.set(rx, ry, rz)); this.p.push([g, new THREE.Matrix4().compose(V(x, y, z), this.q, this.one), c]); return this }
  box(w, h, d, c, x, y, z, rx, ry, rz) { return this.add(new THREE.BoxGeometry(w, h, d), c, x, y, z, rx, ry, rz) }
  cyl(r0, r1, h, c, x, y, z, seg = 10, rx, ry, rz) { return this.add(new THREE.CylinderGeometry(r0, r1, h, seg), c, x, y, z, rx, ry, rz) }
  mesh(metal) { if (!this.p.length) return null; const m = new THREE.Mesh(mergeCol10(this.p), metal ? tyMats10().vcMetal : tyMats10().vc); m.castShadow = true; m.receiveShadow = true; this.p = []; return m }
}
function nameSign10(text, col, w, h) { const t = canvasTex(512, Math.round(512 * h / w), (g, W, H_) => { g.fillStyle = '#0d1b33'; g.fillRect(0, 0, W, H_); g.fillStyle = col; g.fillRect(0, H_ - 12, W, 12); g.fillStyle = '#fff'; let fs = Math.round(H_ * .46); g.font = '800 ' + fs + 'px system-ui,sans-serif'; while (g.measureText(text.toUpperCase()).width > W - 30 && fs > 12) { fs -= 2; g.font = '800 ' + fs + 'px system-ui,sans-serif' } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text.toUpperCase(), W / 2, H_ * .46) }), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); m.userData.sign10 = 1; return m }
// ---- the coaster replica: rails, ties, supports, station, queue yard, trains
const STN10 = [{ n: 'Classic', roof: 0x283040 }, { n: 'Pavilion', roof: 0xd94b3b }, { n: 'Glass hall', roof: 0x9fd8ff }, { n: 'Timber lodge', roof: 0x7a5230 }];
function coasterBuild10(o, inf) {
  const p = inf.prof, def = inf.def, g = new THREE.Group(), col = o.col || {}, hx = (k, d) => col[k] ? parseInt(col[k].slice(1), 16) : d, railC = hx('rail', def.rail), tieC = hx('tie', def.tie), darkC = def.dark || 0x2b3441, wood = !!def.noSup10, M_ = tyMats10();
  const P3 = i => V(p.pts[i * 3], p.pts[i * 3 + 1], p.pts[i * 3 + 2]), U3 = i => V(p.up[i * 3], p.up[i * 3 + 1], p.up[i * 3 + 2]), T3 = i => { const a = (i + 1) % N, b = (i + N - 1) % N; return V(p.pts[a * 3] - p.pts[b * 3], p.pts[a * 3 + 1] - p.pts[b * 3 + 1], p.pts[a * 3 + 2] - p.pts[b * 3 + 2]).normalize() };
  // rails: three tubes through every 3rd sample (closed curves)
  const step = 3, off = (so, uo) => { const a = []; for (let i = 0; i < N; i += step) { const u = U3(i), t = T3(i), sd = V().crossVectors(u, t); a.push(P3(i).addScaledVector(sd, so).addScaledVector(u, uo)) } return a };
  const railM = new THREE.MeshStandardMaterial({ color: railC, roughness: wood ? .5 : .3, metalness: wood ? .5 : .55, envMapIntensity: .7 }), tube = (a, r, m) => { const me = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(a, true, 'centripetal'), a.length, r, 5, true), m); me.castShadow = true; g.add(me); return me };
  tube(off(.3, 0), .075, railM); tube(off(-.3, 0), .075, railM); if (!wood) tube(off(0, -.26), .11, new THREE.MeshStandardMaterial({ color: darkC, roughness: .5, metalness: .4 }));
  g.userData.railM = railM;
  // ties
  const nT = Math.max(8, Math.floor(p.L / (wood ? .7 : .95))), ties = new THREE.InstancedMesh(new THREE.BoxGeometry(wood ? 1.5 : .8, .07, .17), new THREE.MeshStandardMaterial({ color: tieC, roughness: .7 }), nT), mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), one = V(1, 1, 1);
  for (let k = 0; k < nT; k++) { const i = Math.floor(k / nT * N), u = U3(i), t = T3(i), sd = V().crossVectors(u, t); qq.setFromRotationMatrix(mm.makeBasis(sd, u, t)); ties.setMatrixAt(k, mm.compose(P3(i).addScaledVector(u, -.08), qq, one)) } ties.castShadow = true; g.add(ties);
  // supports: steel columns, or pairs of timber posts for wooden coasters
  const sup = []; const gap = wood ? 3 : 6.5; let acc_ = gap; for (let i = 0; i < N; i++) { acc_ += p.L / N; if (acc_ < gap) continue; const u = U3(i), y = p.pts[i * 3 + 1]; if (u.y > .55 && y > 1.5) { sup.push(i); acc_ = 0 } }
  if (sup.length) {
    if (wood) { const po = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, 1, .16), new THREE.MeshStandardMaterial({ color: 0xd2b48a, roughness: .9 }), sup.length * 2), be = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .1, .12), po.material, sup.length * 3); let nb = 0;
      sup.forEach((i, k) => { const t = T3(i), sd = V(-t.z, 0, t.x).normalize(), y = p.pts[i * 3 + 1] - .2, zq = V().crossVectors(sd, Yax); qq.setFromRotationMatrix(mm.makeBasis(sd, Yax, zq)); for (const s_ of [-.75, .75]) po.setMatrixAt(k * 2 + (s_ > 0 ? 1 : 0), mm.compose(V(p.pts[i * 3] + sd.x * s_, y / 2, p.pts[i * 3 + 2] + sd.z * s_), qq, V(1, y, 1))); for (let yy = y; yy > .8 && nb < sup.length * 3; yy -= 3.2) be.setMatrixAt(nb++, mm.compose(V(p.pts[i * 3], yy, p.pts[i * 3 + 2]), qq, one)) }); be.count = nb; po.castShadow = true; g.add(po, be) }
    else { const co = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .16, 1, 7), new THREE.MeshStandardMaterial({ color: darkC, roughness: .5, metalness: .4 }), sup.length); sup.forEach((i, k) => { const u = U3(i), y = p.pts[i * 3 + 1] - .3; co.setMatrixAt(k, mm.compose(V(p.pts[i * 3] - u.x * .3, y / 2, p.pts[i * 3 + 2] - u.z * .3), qq.identity(), V(1, y, 1))) }); co.castShadow = true; g.add(co) }
  }
  // station (platform on the left of the track), roof by style, name board, queue yard with rails and an arch
  const K = new Kit10(), yS = p.yS, SL = p.SL, st = STN10[col.stn || 0] || STN10[0], roofC = hx('roof', st.roof), accC = parseInt((def.color || '#ffc233').slice(1), 16) || 0xffc233, hang = p.hang, yP = p.yP, zc = (p.zp0 + p.zp1) / 2;
  K.box(SL + 1, yP, 2.1, 0xd6dae0, SL / 2, yP / 2, zc).box(SL + 1, .06, .14, 0xffd23f, SL / 2, yP + .03, p.zp0 - .08);
  if (hang) K.box(SL + 1, yP, p.hw * 2 + .6, 0xc3c9d2, SL / 2, yP / 2, 0);// trains that hang under the track load from a floor below it
  for (let x = 0; x <= SL + .01; x += SL / 2) for (const z of [p.zp1 + .15, hang ? p.hw + .45 : p.zp0 - .15]) K.box(.16, yS + 2.9, .16, 0x3a4250, x + .5, (yS + 2.9) / 2, z);
  const rw = hang ? 2.1 + p.hw * 2 + 1 : 2.9 + (p.hw - .5), rz = hang ? (p.zp1 + p.hw + .45) / 2 : zc + (p.hw - .5) / 2;
  if ((col.stn || 0) === 1) { K.box(SL + 1.8, .14, rw + .5, roofC, SL / 2 + .5, yS + 3.0, rz); K.box(SL + 1.2, .5, rw - .6, roofC, SL / 2 + .5, yS + 3.3, rz); K.box(SL * .6, .5, rw - 1.6, 0xfff6e8, SL / 2 + .5, yS + 3.75, rz) }
  else if ((col.stn || 0) === 2) { K.box(SL + 1.8, .1, rw + .4, roofC, SL / 2 + .5, yS + 3.1, rz); for (let x = 0; x <= SL + 1; x += (SL + 1) / 4) K.box(.1, .5, rw + .5, 0xf2f4f8, x, yS + 3.35, rz) }
  else if ((col.stn || 0) === 3) { K.box(SL + 2, .16, rw * .62, roofC, SL / 2 + .5, yS + 3.3, rz - rw * .22, .42).box(SL + 2, .16, rw * .62, roofC, SL / 2 + .5, yS + 3.3, rz + rw * .22, -.42) }
  else K.box(SL + 1.8, .16, rw + .3, roofC, SL / 2 + .5, yS + 3.05, rz).box(SL + 1.9, .28, .1, accC, SL / 2 + .5, yS + 3.05, rz - rw / 2 - .15);
  // ramp from the yard up to the platform, the yard floor, the zig-zag rails and the entrance arch
  { const z0 = Math.min(-4.3, p.zp1 - 1.5), len = Math.hypot(p.zp1 - z0, yP); K.box(1.6, .1, len, 0xb9c0c9, 1.2, yP * .5, (p.zp1 + z0) / 2, -Math.atan2(yP, p.zp1 - z0)) }
  K.box(8, .08, 8, 0xc9b79a, 4, .04, -8);
  for (let r = 0; r < 4; r++) { const z = -4.9 - r * 1.75; K.box(r % 2 ? 5.4 : 5.4, .05, .05, 0xe8edf3, r % 2 ? 3.5 : 3.1, .78, z); for (let x = .6; x < 6; x += 1.35) K.box(.05, .78, .05, 0x8b97a6, x + (r % 2 ? .4 : 0), .39, z) }
  for (const x of [.25, 7.75]) K.box(.06, .8, 7.4, 0x8b97a6, x, .4, -8); K.box(.06, .8, .06, 0x8b97a6, 6.6, .4, -11.9);
  for (const x of [.9, 3.3]) K.box(.22, 3, .22, accC, x, 1.5, -11.9); K.box(2.9, .5, .3, accC, 2.1, 3.1, -11.9);
  const sm = K.mesh(); if (sm) g.add(sm);
  const sg = nameSign10(objName10(o), def.color || '#ffc233', Math.min(SL + .6, 7), 1.05); sg.position.set(SL / 2 + .5, yS + 3.95, rz - rw / 2 - .2); g.add(sg); g.userData.sign = sg;
  const lights = new THREE.Mesh(new THREE.BoxGeometry(SL, .06, .1), M_.glow); lights.position.set(SL / 2 + .5, yS + 2.9, rz); lights.userData.night10 = 1; lights.visible = false; g.add(lights);
  return g;
}
// one car as a single coloured mesh; riders are instanced heads + bodies (shown only for seats that are taken)
function carGeo10(style, body, accent, lead) {
  const K = new Kit10(), dk = 0x23272e;
  if (style === 'wing') { K.box(.5, .32, 1, body, 0, 0, 0).box(3.4, .1, .3, dk, 0, .1, -.1); for (const s_ of [-1, 1]) K.box(1.02, .34, .6, body, s_ * 1.33, .02, -.1).box(.08, .36, .62, accent, s_ * 1.92, .04, -.1) }
  else if (style === 'dive' || style === 'floorless') { const W = style === 'dive' ? 3.3 : 2.3; K.box(W, .3, .62, body, 0, .06, -.06).box(W + .04, .05, .66, accent, 0, .22, -.06).box(.5, .2, .9, dk, 0, -.12, 0) }
  else if (style === 'bike') { for (const s_ of [-.3, .3]) K.box(.26, .34, .84, body, s_, .06, .02).box(.22, .22, .3, accent, s_, .24, .36, -.5); K.box(.9, .05, .96, dk, 0, -.16, 0) }
  else if (style === 'woodie') { K.box(.94, .46, 1.02, body, 0, .08, 0).box(.98, .06, 1.06, accent, 0, .33, 0) }
  else { K.box(.9, .36, 1, body, 0, .02, 0).box(.96, .06, 1.04, accent, 0, .12, 0); if (HANG10[style]) K.box(.12, 1.1, .2, dk, 0, .82, -.05) }
  if (lead && style !== 'wing' && style !== 'bike') K.box(.6, .24, .36, body, 0, 0, .62).box(.3, .06, .04, 0xfff6d8, 0, 0, .81);
  K.box(.6, .1, .86, dk, 0, -.22, 0);
  return mergeCol10(K.p);
}
function seatPos10(style) { const a = []; if (style === 'wing') [-1.6, -1.05, 1.05, 1.6].forEach(x => a.push([x, 0, -.1])); else if (style === 'dive') [-1.3, -.78, -.26, .26, .78, 1.3].forEach(x => a.push([x, .24, -.1])); else if (style === 'floorless') [-.78, -.26, .26, .78].forEach(x => a.push([x, .24, -.1])); else if (style === 'bike') [-.3, .3].forEach(x => a.push([x, .34, -.12])); else[-.24, .24].forEach(x => a.push([x, .22, -.1])); return a }
function trainBuild10(o, inf, k) {
  const p = inf.prof, def = inf.def, col = o.col || {}, style = col.train && SEATS10[col.train] === SEATS10[p.style] && !!HANG10[col.train] === p.hang ? col.train : p.style, hx = (key, d) => col[key] ? parseInt(col[key].slice(1), 16) : d, body = hx('body', def.body), accent = hx('accent', def.accent), cars = [], M_ = tyMats10();
  for (let c = 0; c < 4; c++) { const me = new THREE.Mesh(carGeo10(style, body, accent, c === 0), M_.vcMetal); me.castShadow = true; cars.push(me) }
  const seats = seatPos10(style), nS = seats.length * 4, heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.13, 8, 6), new THREE.MeshStandardMaterial({ roughness: .7 }), nS), bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(.3, .36, .24), new THREE.MeshStandardMaterial({ roughness: .75 }), nS);
  heads.count = bodies.count = 0; heads.frustumCulled = bodies.frustumCulled = false;
  return { cars, heads, bodies, seats, style, riders: [], tau: 0, ph: k ? 'hold' : 'load', wait: 0, s: 0 };
}
