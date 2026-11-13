// ---- 10.1 MY PARK — polish: things pop in with a puff of dust when built, coins float up from rides and shops that
// earn, rain leaves puddles on paths and rings on the ground and the lake, coasters light up their track at night, flat
// rides get a ring of bulbs, and Fireworks Launchers put on a show at closing time. All of it is drawing only: nothing
// here changes the simulation or the books, except the fireworks show (paid under Marketing, it lifts the reputation).
const FX10 = { pops: [], dust: null, dustP: [], coins: [], coinT: 0, last: new Map(), pud: null, pudKey: '', rip: null, ripP: [], leds: [], fw: null, fwP: [], fwQ: [], fwShow: 0, prevMin: -1 };
const easeBack10 = t => { const c = 1.9; t = sat10(t) - 1; return 1 + (c + 1) * t * t * t + c * t * t };
function fxInit10() {
  if (FX10.dust || !TY.root) return; const R = TY.root;
  // dust puffs
  FX10.dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.5, 0), new THREE.MeshStandardMaterial({ color: 0xe9dfcc, roughness: 1, flatShading: true }), 90); FX10.dust.count = 0; FX10.dust.frustumCulled = false; R.add(FX10.dust);
  // coin labels
  for (let i = 0; i < (mobile ? 8 : 14); i++) { const cv = document.createElement('canvas'); cv.width = 160; cv.height = 64; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false, fog: false })); sp.visible = false; sp.renderOrder = 9; R.add(sp); FX10.coins.push({ sp, cv, tx, t: 0 }) }
  // rain: puddles on paths, rings where drops land
  FX10.pudM = new THREE.MeshStandardMaterial({ color: 0x3b4d60, roughness: .03, metalness: .55, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, envMapIntensity: 1.4 });
  FX10.pud = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 14).rotateX(-PI / 2), FX10.pudM, 500); FX10.pud.count = 0; FX10.pud.frustumCulled = false; FX10.pud.renderOrder = 2; R.add(FX10.pud);
  FX10.rip = new THREE.InstancedMesh(new THREE.RingGeometry(.1, .16, 14).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 180); FX10.rip.count = 0; FX10.rip.frustumCulled = false; FX10.rip.renderOrder = 3; R.add(FX10.rip);
  for (let i = 0; i < 180; i++) FX10.ripP.push({ x: 0, z: 0, y: 0, ph: Math.random() });
  // fireworks: one cloud of glowing points
  const N_ = 2600, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_ * 3).fill(-999), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N_ * 3), 3));
  const dot = canvasTex(64, 64, (c, W) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, W) });
  FX10.fw = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.4, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, sizeAttenuation: true })); FX10.fw.frustumCulled = false; FX10.fw.renderOrder = 7; R.add(FX10.fw);
  for (let i = 0; i < N_; i++) FX10.fwP.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 1, g: 1, b: 1, t: 0, T: 1, rocket: 0 });
}
// ---- building: the model springs up, dust puffs out around it
function dustAt10(x, y, z, w, d) { for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + Math.random() * .4, rx = Math.cos(a), rz = Math.sin(a); FX10.dustP.push({ x: x + rx * w * .5, y: y + .3, z: z + rz * d * .5, vx: rx * (1.5 + Math.random()), vz: rz * (1.5 + Math.random()), vy: .8 + Math.random() * .8, t: 0, T: .7 + Math.random() * .4, s: .5 + Math.random() * .6 }) } if (FX10.dustP.length > 90) FX10.dustP.splice(0, FX10.dustP.length - 90) }
{ const b0 = tyBuild10; tyBuild10 = function (key, i, j, r, free) {
  const res = b0(key, i, j, r, free); if (!res.ok) return res;
  safe10('build pop', () => { fxInit10(); const o = res.o, inf = objInfo10(o), fp = footprint10(o); if (!inf || !fp) return; let a = 1e9, b = -1e9, c = 1e9, d = -1e9; const cells = inf.t === 'coaster' && typeof stationTiles10 === 'function' ? stationTiles10(o) : fp.solid; for (const [x, z] of cells) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, z); d = Math.max(d, z) } const cx = (tX10(a) + tX10(b)) / 2, cz = (tZ10(c) + tZ10(d)) / 2, y = o.rt && o.rt.by || 0;
    dustAt10(cx, y, cz, (b - a + 1) * TS10, (d - c + 1) * TS10); if (o.rt && o.rt.g && inf.t !== 'deco') { o.rt.g.scale.setScalar(.05); FX10.pops.push({ g: o.rt.g, t: 0 }) } });
  return res;
} }
{ const r0 = tyRemove10; tyRemove10 = function (o, quiet) { let at = null; safe10('remove puff', () => { const g = o.rt && o.rt.g; if (g) at = [g.position.x, g.position.y, g.position.z]; else { const w = objWorld10(o); at = [w.x, o.rt && o.rt.by || 0, w.z] } }); const ok = r0(o, quiet); if (ok && at) safe10('remove puff', () => { fxInit10(); dustAt10(at[0], at[1], at[2], 4, 4) }); return ok } }
// ---- coins: rides and shops that took money since the last look show what they made
function coinPop10(x, y, z, txt) { const c = FX10.coins.find(q => q.t <= 0); if (!c) return; const g = c.cv.getContext('2d'); g.clearRect(0, 0, 160, 64); g.font = 'bold 34px system-ui,-apple-system,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 7; g.strokeStyle = 'rgba(20,40,20,.75)'; g.strokeText(txt, 80, 34); g.fillStyle = '#ffe14a'; g.fillText(txt, 80, 34); c.tx.needsUpdate = true; c.t = 1.6; c.x = x; c.y = y; c.z = z }
function coinsTick10(dt) {
  FX10.coinT -= dt; if (FX10.coinT <= 0 && TY.park && TY.park.speed > 0 && TY.cam.dist < 160) { FX10.coinT = .9; const f = TY.cam, R2 = (60 + TY.cam.dist) ** 2;
    for (const o of TY.park.objs) { if (!o.st || !o.rt) continue; const prev = FX10.last.get(o.id), inc = o.st.inc; FX10.last.set(o.id, inc); if (prev == null || inc - prev < .5) continue; const w = o.rt.xf || objWorld10(o); if ((w.x - f.x) ** 2 + (w.z - f.z) ** 2 > R2 || Math.random() < .35) continue; const inf = objInfo10(o), h = inf && inf.t === 'coaster' ? 6 : inf && inf.t === 'flat' ? 6.5 : 4; let x = w.x, z = w.z; if (inf && inf.t === 'coaster') { const p = V(); objPt10(o, 4, 0, -8 * (inf.prof.zs || 1), p); x = p.x; z = p.z } coinPop10(x, (o.rt.by || 0) + h, z, '+' + money10(inc - prev)) } }
  const sc = clamp(TY.cam.dist / 50, .8, 2.6); for (const c of FX10.coins) { if (c.t <= 0) { c.sp.visible = false; continue } c.t -= dt; c.sp.visible = true; c.sp.position.set(c.x, c.y + (1.6 - c.t) * 1.6 * sc, c.z); c.sp.scale.set(3.2 * sc, 1.28 * sc, 1); c.sp.material.opacity = clamp(c.t * 1.8, 0, 1) }
}
// ---- rain: puddles on paths (they fill as the ground gets wet), and rings where drops hit the ground or the lake
const _fm = new THREE.Matrix4(), _fq = new THREE.Quaternion(), _fv = V(), _fs = V();
function puddles10() {
  const key = TY.pathVer + '|' + (TY.terra ? TY.terra.ver : 0); if (key === FX10.pudKey) return; FX10.pudKey = key; const M_ = FX10.pud; let n = 0;
  for (let k = 0; k < GW10 * GH10 && n < 500; k++) { if (!TY.path[k] || (TY.hgt && TY.hgt[k] < 0)) continue; const h = hash10('p' + k); if (h % 5 > 1) continue; const i = k % GW10, j = (k - i) / GW10, x = tX10(i) + ((h >> 3) % 100 / 100 - .5) * 2.2, z = tZ10(j) + ((h >> 10) % 100 / 100 - .5) * 2.2, s = .45 + (h >> 17) % 100 / 160, y = (typeof walkY10 === 'function' ? walkY10(x, z) : 0) + .085;
    M_.setMatrixAt(n++, _fm.compose(_fv.set(x, y, z), _fq.setFromAxisAngle(Yax, (h % 628) / 100), _fs.set(s, 1, s * (.6 + (h >> 20) % 50 / 100)))) }
  M_.count = n; M_.instanceMatrix.needsUpdate = true;
}
function rainTick10(dt) {
  const W_ = WX10[TY.park.wx.k] || WX10.sunny, wet = typeof wet72 === 'number' ? wet72 : 0, raining = !!W_.rain;
  FX10.pudM.opacity = clamp(wet * 1.3 - .1, 0, .75); FX10.pud.visible = FX10.pudM.opacity > .01; if (FX10.pud.visible) puddles10();
  const M_ = FX10.rip; if (!raining || TY.cam.dist > 170) { M_.count = 0; return } const f = TY.cam, R = clamp(TY.cam.dist * .45, 18, 46), n = Math.min(180, Math.round(R * (W_.storm ? 4.5 : 3)));
  for (let i = 0; i < n; i++) { const q = FX10.ripP[i]; q.ph += dt * (W_.storm ? 2.6 : 2.1); if (q.ph >= 1 || q.y === 0) { q.ph = q.ph % 1; q.x = f.x + (Math.random() - .5) * 2 * R; q.z = f.z + (Math.random() - .5) * 2 * R; const i_ = xT10(q.x), j_ = zT10(q.z), lake = inG10(i_, j_) && TY.hgt && TY.hgt[tI10(i_, j_)] < 0; q.y = (lake ? TER10.water : (typeof walkY10 === 'function' ? walkY10(q.x, q.z) : 0)) + (lake ? .02 : .1) }
    const s = .6 + q.ph * 3.2; M_.setMatrixAt(i, _fm.compose(_fv.set(q.x, q.y, q.z), _fq.identity(), _fs.set(s, 1, s))); const a = (1 - q.ph) * .5; M_.setColorAt(i, _tc.setRGB(a, a, a * 1.1)) }
  M_.count = n; M_.instanceMatrix.needsUpdate = true; if (M_.instanceColor) M_.instanceColor.needsUpdate = true;
}
// ---- night: coasters outline their track with coloured lights, flat rides get a ring of bulbs
{ const c0 = coasterBuild10; coasterBuild10 = function (o, inf) {
  const g = c0(o, inf); safe10('coaster lights', () => { const p = inf.prof, pts = []; for (let i = 0; i < N; i += 3) pts.push(V(p.pts[i * 3] - p.up[i * 3] * .34, p.pts[i * 3 + 1] - p.up[i * 3 + 1] * .34, p.pts[i * 3 + 2] - p.up[i * 3 + 2] * .34));
    const m = new THREE.MeshBasicMaterial({ color: 0xff3df0, fog: false }), t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), pts.length, .06, 4, true), m); t.userData.night10 = 1; t.visible = !!TY.dark; t.name = 'leds10'; g.add(t); FX10.leds.push({ m, seed: (o.id * .137) % 1, g }) });
  return g;
} }
{ const b0 = objBuild10; objBuild10 = function (o) {
  const g = b0(o), inf = objInfo10(o); if (inf && inf.t === 'flat') safe10('ride bulbs', () => { const W = inf.w * TS10, D = inf.d * TS10, n = Math.round((W + D) * 2 / 1.3), bm = new THREE.InstancedMesh(new THREE.SphereGeometry(.13, 8, 6), new THREE.MeshBasicMaterial({ fog: false }), n), cols = [0xffe08a, 0xff5ab4, 0x5ad8ff];
    for (let k = 0; k < n; k++) { const u = k / n * 2 * (W + D); let x, z; if (u < W) { x = -W / 2 + u; z = -D / 2 } else if (u < W + D) { x = W / 2; z = -D / 2 + u - W } else if (u < 2 * W + D) { x = W / 2 - (u - W - D); z = D / 2 } else { x = -W / 2; z = D / 2 - (u - 2 * W - D) } x *= .93; z *= .93; bm.setMatrixAt(k, _fm.compose(_fv.set(x, .32, z), _fq.identity(), _one10)); bm.setColorAt(k, _tc.setHex(cols[k % 3])) }
    bm.userData.night10 = 1; bm.visible = !!TY.dark; bm.name = 'bulbs10'; g.add(bm) });
  return g;
} }
function ledsTick10(dt) { if (!TY.dark) return; FX10.leds = FX10.leds.filter(l => l.g.parent); const t = TY.t; for (const l of FX10.leds) l.m.color.setHSL((t * .06 + l.seed) % 1, .95, .58) }
// ---- fireworks: launchers you place as scenery; at closing time each one sends up rockets for about half a minute
CAT10.fireworks = { t: 'deco', n: 'Fireworks Launcher', ic: '🎆', w: 1, d: 1, cost: 1500, beauty: 2, lv: 3, model: 'fireworks' };
{ const d0 = decoModel10; decoModel10 = function (g, C) { if (C.model !== 'fireworks') return d0(g, C); const K = new Kit10(); K.box(2.2, .5, 2.2, 0x2b3441, 0, .25, 0).box(1.9, .1, 1.9, 0xffc233, 0, .52, 0); for (const [x, z, a] of [[-.5, -.5, .25], [.5, -.5, -.25], [-.5, .5, .2], [.5, .5, -.2], [0, 0, 0]]) K.cyl(.13, .17, 1.3, x === 0 ? 0xff3d6b : 0x6ad1ff, x, 1.15, z, 8, a, 0); for (const [geo, m, c] of K.p) { geo.applyMatrix4(m); g.add(new THREE.Mesh(geo, lmat80(c, .6))) } K.p = [] } }
{ const t0 = trayHTML10; trayHTML10 = function () { const h = t0(); return TY.ui.cat === 'deco' ? h.replace(/(data-v="fireworks"[^]*?<small>)[^<]*(<\/small>)/, '$1A show every night at closing$2') : h } }
const FWC10 = [[1, .35, .5], [1, .85, .3], [.35, .8, 1], [.6, 1, .45], [.85, .45, 1], [1, 1, 1], [1, .55, .2]];
function fwLaunch10(x, y, z) { const p = FX10.fwP.find(q => !q.on); if (!p) return; const c = FWC10[rndi10(FWC10.length)]; Object.assign(p, { on: true, x, y: y + 1.6, z, vx: (Math.random() - .5) * 4, vy: 26 + Math.random() * 9, vz: (Math.random() - .5) * 4, r: c[0], g: c[1], b: c[2], t: 0, T: 1.1 + Math.random() * .5, rocket: 1 + rndi10(3) }); try { sfx('launch', .35) } catch (e) {} }
function fwBurst10(q) {
  const n = 70 + rndi10(60), kind = q.rocket, c2 = FWC10[rndi10(FWC10.length)]; let k = 0;
  for (const p of FX10.fwP) { if (p.on) continue; if (k >= n) break; const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u), sp = kind === 3 ? 13 : 9 + Math.random() * 6, mix = kind === 2 && k % 2; Object.assign(p, { on: true, x: q.x, y: q.y, z: q.z, vx: s * Math.cos(a) * sp, vy: u * sp + 2, vz: s * Math.sin(a) * sp, r: mix ? c2[0] : q.r, g: mix ? c2[1] : q.g, b: mix ? c2[2] : q.b, t: 0, T: 1.4 + Math.random() * .9, rocket: 0 }); k++ }
  try { sfx('pop', .8) } catch (e) {}
}
function fwTick10(dt) {
  if (!FX10.fw) return; const P_ = TY.park, launchers = P_.objs.filter(o => o.k === 'fireworks');
  // the show starts when the park closes (the clock passing 21:00)
  if (FX10.prevMin >= 0 && FX10.prevMin < SIM10.close && P_.min >= SIM10.close && launchers.length) fwStart10(launchers);
  FX10.prevMin = P_.min;
  if (FX10.fwShow > 0) { FX10.fwShow -= dt; for (const q of FX10.fwQ) { q.t -= dt; if (q.t <= 0) { const o = q.o, w = o.rt && o.rt.xf || objWorld10(o); fwLaunch10(w.x, o.rt && o.rt.by || 0, w.z); q.t = .5 + Math.random() * 1.3 } } if (FX10.fwShow <= 0) FX10.fwQ = [] }
  const pos = FX10.fw.geometry.attributes.position, col = FX10.fw.geometry.attributes.color; let live = 0;
  for (let i = 0; i < FX10.fwP.length; i++) { const p = FX10.fwP[i]; if (!p.on) { if (pos.array[i * 3 + 1] !== -999) { pos.array[i * 3 + 1] = -999; col.setXYZ(i, 0, 0, 0) } continue } live++; p.t += dt;
    if (p.rocket) { p.vy -= 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.t >= p.T || p.vy < 3) { p.on = false; fwBurst10(p) } else { const tr = FX10.fwP.find(q => !q.on); if (tr && Math.random() < .7) Object.assign(tr, { on: true, x: p.x, y: p.y, z: p.z, vx: 0, vy: -1, vz: 0, r: 1, g: .8, b: .5, t: 0, T: .35, rocket: 0 }) } }
    else { const dr = Math.exp(-1.6 * dt); p.vx *= dr; p.vy = p.vy * dr - 5.5 * dt; p.vz *= dr; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.t >= p.T) p.on = false }
    const a = p.on ? (p.rocket ? 1 : clamp(1 - p.t / p.T, 0, 1) ** 1.3 * (p.t > p.T * .6 && Math.random() < .3 ? .2 : 1)) : 0; pos.setXYZ(i, p.x, p.on ? p.y : -999, p.z); col.setXYZ(i, p.r * a, p.g * a, p.b * a) }
  pos.needsUpdate = col.needsUpdate = true; FX10.fw.visible = live > 0;
}
function fwStart10(launchers) {
  const P_ = TY.park; if (FX10.fwShow > 0 || !launchers.length) return false; FX10.fwShow = 30; FX10.fwQ = launchers.slice(0, 8).map((o, k) => ({ o, t: .3 + k * .35 }));
  if (!TY.visit && P_.mode === 'career') { pay10('promo', 150 * Math.min(8, launchers.length)); P_.rep = Math.min(100, P_.rep + Math.min(3, launchers.length)) }
  for (const g of TY.guests) if (g.st !== 'gone') { g.happy = Math.min(100, g.happy + 6); if (Math.random() < .25) say10(g, '🎆') }
  toast10('🎆 Fireworks over ' + P_.name + '!', 'fw'); return true;
}
// ---- one frame
function fxTick10(dt) {
  for (let i = FX10.pops.length - 1; i >= 0; i--) { const q = FX10.pops[i]; q.t += dt; q.g.scale.setScalar(Math.max(.05, easeBack10(q.t / .45))); if (q.t >= .45) { q.g.scale.setScalar(1); FX10.pops.splice(i, 1) } }
  const M_ = FX10.dust; let n = 0; for (let i = FX10.dustP.length - 1; i >= 0; i--) { const q = FX10.dustP[i]; q.t += dt; if (q.t >= q.T) { FX10.dustP.splice(i, 1); continue } q.x += q.vx * dt; q.z += q.vz * dt; q.y += q.vy * dt; q.vx *= .93; q.vz *= .93; const k = q.t / q.T, s = q.s * (k < .3 ? .4 + 2 * k : 1 - (k - .3) / .7 * .95); M_.setMatrixAt(n++, _fm.compose(_fv.set(q.x, q.y, q.z), _fq.identity(), _fs.set(s, s, s))) } M_.count = n; M_.instanceMatrix.needsUpdate = true;
  safe10('coins', () => coinsTick10(dt)); safe10('rain fx', () => rainTick10(dt)); safe10('lights', () => ledsTick10(dt)); safe10('fireworks', () => fwTick10(dt));
}
{ const d0 = tyDraw10; tyDraw10 = function (dt) { d0(dt); if (!FX10.dust) fxInit10(); if (FX10.dust) fxTick10(dt) } }
// a new park (or the same one reopened) starts with no show, no sparks and nothing half popped
{ const r0 = tyRebuild10; tyRebuild10 = function () { r0.apply(this, arguments); FX10.pops = []; FX10.dustP = []; FX10.last.clear(); FX10.fwShow = 0; FX10.fwQ = []; FX10.prevMin = -1; FX10.pudKey = ''; for (const p of FX10.fwP) p.on = false; for (const c of FX10.coins) c.t = 0 } }
Object.assign(DBG10.ty, {
  fx: () => ({ pops: FX10.pops.length, dust: FX10.dustP.length, coins: FX10.coins.filter(c => c.t > 0).length, puddles: FX10.pud ? FX10.pud.count : 0, pudOpacity: FX10.pudM ? +FX10.pudM.opacity.toFixed(2) : 0, ripples: FX10.rip ? FX10.rip.count : 0, leds: FX10.leds.length, fwLive: FX10.fwP.filter(p => p.on).length, show: +FX10.fwShow.toFixed(1) }),
  fireworks: () => fwStart10(TY.park.objs.filter(o => o.k === 'fireworks')),
  wet: v => { try { wet72 = v; return wet72 } catch (e) { return -1 } }, dark: () => !!TY.dark,
  lights: id => { const o = TY.objById.get(id), g = o && o.rt && o.rt.g; if (!g) return null; let leds = 0, bulbs = 0, vis = 0; g.traverse(q => { if (q.name === 'leds10') { leds++; vis += q.visible } if (q.name === 'bulbs10') { bulbs++; vis += q.visible } }); return { leds, bulbs, vis } },
  run: sec => { for (let t = 0; t < sec; t += 1 / 30) fxTick10(1 / 30); return DBG10.ty.fx() },
  earned: (id, amt) => { const o = TY.objById.get(id); if (o) o.st.inc += amt; return !!o },
  scale: id => { const o = TY.objById.get(id); return o && o.rt && o.rt.g ? +o.rt.g.scale.x.toFixed(2) : null }
});
