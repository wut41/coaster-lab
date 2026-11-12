// ---- 10.0 MY PARK — drawing the living things: visitors and staff (4 instanced meshes for everyone), speech bubbles
// (a small pool of sprites), litter, trains with their riders, and the flat rides' moving parts.
const GCAP10 = SIM10.maxG + 60, _gm = new THREE.Matrix4(), _gq = new THREE.Quaternion(), _gv = V(), _gs = V(1, 1, 1), _gc = new THREE.Color();
function tyGuestMeshes10() {
  const R = TY.root, mk = (geo, cap, sh) => { const o = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: .75 }), cap); o.count = 0; o.castShadow = !!sh; o.frustumCulled = false; R.add(o); return o };
  const torso = mergeGeo([[new THREE.CapsuleGeometry(.12, .24, 3, 8), new THREE.Matrix4().makeTranslation(0, .63, 0), false], [new THREE.BoxGeometry(.06, .3, .07), new THREE.Matrix4().makeTranslation(-.165, .62, 0), false], [new THREE.BoxGeometry(.06, .3, .07), new THREE.Matrix4().makeTranslation(.165, .62, 0), false]]);
  const legs = mergeGeo([[new THREE.BoxGeometry(.085, .42, .1), new THREE.Matrix4().makeTranslation(-.055, .21, 0), false], [new THREE.BoxGeometry(.085, .42, .1), new THREE.Matrix4().makeTranslation(.055, .21, 0), false]]);
  TY.gm = { torso: mk(torso, GCAP10, 1), legs: mk(legs, GCAP10, 1), head: mk(new THREE.SphereGeometry(.105, 10, 8).translate(0, .95, 0), GCAP10, 0), umb: mk(new THREE.ConeGeometry(.55, .28, 8, 1, true).translate(0, 1.42, 0), 200, 0), cap: mk(new THREE.CylinderGeometry(.115, .115, .07, 8).translate(0, 1.06, 0), 60, 0) };
  TY.gm.umb.material.side = THREE.DoubleSide;
  TY.litM = new THREE.InstancedMesh(new THREE.BoxGeometry(.3, .05, .22), new THREE.MeshStandardMaterial({ roughness: .9 }), 240); TY.litM.count = 0; TY.litM.frustumCulled = false; R.add(TY.litM);
}
// ---- speech bubbles: emoji on a white bubble, drawn once per emoji and shared
const BUB10 = { tex: new Map(), pool: [], free: [] };
function bubbleTex10(e) { let t = BUB10.tex.get(e); if (t) return t; t = canvasTex(96, 96, (c, W, H_) => { c.clearRect(0, 0, W, H_); c.fillStyle = 'rgba(255,255,255,.96)'; c.strokeStyle = 'rgba(20,40,70,.35)'; c.lineWidth = 3; c.beginPath(); c.arc(48, 42, 36, 0, 6.3); c.fill(); c.stroke(); c.beginPath(); c.moveTo(36, 72); c.lineTo(48, 94); c.lineTo(60, 72); c.closePath(); c.fill(); c.font = '44px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#111'; c.fillText(e, 48, 45) }); BUB10.tex.set(e, t); return t }
function tyBubbles10() { const n = mobile ? 14 : 26; for (let i = 0; i < n; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false })); sp.scale.set(1.5, 1.5, 1); sp.visible = false; sp.renderOrder = 8; TY.root.add(sp); BUB10.pool.push({ sp, g: null, t: 0, e: '' }) } }
function bubbleAt10(x, z, e) { const b = BUB10.pool.find(q => !q.g && q.t <= 0); if (!b) return; b.t = 2.2; b.e = e; b.x = x; b.z = z; b.sp.material.map = bubbleTex10(e); b.sp.material.needsUpdate = true }
function bubblesDraw10(dt) {
  const pool = BUB10.pool; let k = 0;
  for (const b of pool) { if (b.g) { if (b.g.sayT <= 0 || b.g.hide || b.g.st === 'gone') b.g = null } else if (b.t > 0) { b.t -= dt } }
  // visitors with something to say take a free bubble (those nearest the camera focus first when there are too many)
  const want = []; for (const g of TY.guests) if (g.sayT > 0 && !g.hide && !pool.some(b => b.g === g)) want.push(g);
  if (want.length) { const f = TY.cam; want.sort((a, b) => ((a.x - f.x) ** 2 + (a.z - f.z) ** 2) - ((b.x - f.x) ** 2 + (b.z - f.z) ** 2)); for (const g of want) { const b = pool.find(q => !q.g && q.t <= 0); if (!b) break; b.g = g; b.e = g.say; b.sp.material.map = bubbleTex10(g.say); b.sp.material.needsUpdate = true } }
  const sc = clamp(TY.cam.dist / 45, .9, 3.2);
  for (const b of pool) { const on = !!b.g || b.t > 0; b.sp.visible = on; if (!on) continue; if (b.g) { if (b.e !== b.g.say) { b.e = b.g.say; b.sp.material.map = bubbleTex10(b.e); b.sp.material.needsUpdate = true } b.sp.position.set(b.g.x, b.g.y + 1.7 + sc * .55, b.g.z); b.sp.material.opacity = clamp(b.g.sayT * 2.5, 0, 1) } else { b.sp.position.set(b.x, 1.7 + sc * .55 + (2.2 - b.t) * .5, b.z); b.sp.material.opacity = clamp(b.t * 1.5, 0, 1) } b.sp.scale.set(1.5 * sc, 1.5 * sc, 1) }
}
const STAFFC10 = { jan: [0x18b8a0, 0x0f6b5e, 0xf2f2f2], mech: [0xff7a1f, 0x2b3441, 0xffd23f] };
function peopleDraw10(dt) {
  const M_ = TY.gm, rainy = !!WX10[TY.park.wx.k].rain; let n = 0, u = 0, c = 0;
  for (const g of TY.guests) {
    if (g.hide || n >= GCAP10) continue; const mv = g.st === 'walk' || g.st === 'out' || g.st === 'board', b = mv ? Math.abs(Math.sin(g.bob)) * .04 : 0;
    _gq.setFromAxisAngle(Yax, g.yaw); _gv.set(g.x, g.y + b - (g.sit ? .22 : 0), g.z); _gm.compose(_gv, _gq, _gs); M_.torso.setMatrixAt(n, _gm); M_.head.setMatrixAt(n, _gm);
    if (g.sit) { _gs.set(1, .55, 1.5); _gv.y += .2; _gm.compose(_gv, _gq, _gs); _gs.set(1, 1, 1) } M_.legs.setMatrixAt(n, _gm);
    M_.torso.setColorAt(n, _gc.setHex(g.shirt)); M_.legs.setColorAt(n, _gc.setHex(g.pants)); M_.head.setColorAt(n, _gc.setHex(g.skin)); n++;
    if (rainy && g.umb && u < 200) { _gv.set(g.x, g.y, g.z); _gm.compose(_gv, _gq, _gs); M_.umb.setMatrixAt(u, _gm); M_.umb.setColorAt(u, _gc.setHex(g.shirt)); u++ }
  }
  for (const s_ of TY.staff) { if (n >= GCAP10) break; const C = STAFFC10[s_.k], b = s_.st === 'work' ? Math.abs(Math.sin(TY.t * 9)) * .05 : 0; _gq.setFromAxisAngle(Yax, s_.yaw); _gv.set(s_.x, b, s_.z); _gm.compose(_gv, _gq, _gs); M_.torso.setMatrixAt(n, _gm); M_.head.setMatrixAt(n, _gm); M_.legs.setMatrixAt(n, _gm); M_.torso.setColorAt(n, _gc.setHex(C[0])); M_.legs.setColorAt(n, _gc.setHex(C[1])); M_.head.setColorAt(n, _gc.setHex(0xe0ac69)); n++; if (c < 60) { M_.cap.setMatrixAt(c, _gm); M_.cap.setColorAt(c, _gc.setHex(C[2])); c++ } }
  for (const [k, cnt] of [['torso', n], ['legs', n], ['head', n], ['umb', u], ['cap', c]]) { const o = M_[k]; o.count = cnt; o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true }
  const L_ = TY.litM; let l = 0; for (const q of TY.litter) { if (l >= 240) break; _gq.setFromAxisAngle(Yax, (q.x * 7 + q.z * 3) % 6.28); _gv.set(q.x, .13, q.z); _gs.set(q.v ? 1.8 : 1, 1, q.v ? 1.8 : 1); _gm.compose(_gv, _gq, _gs); L_.setMatrixAt(l, _gm); L_.setColorAt(l, _gc.setHex(q.v ? 0x9bbf3a : (l % 3 ? 0xf2f2f2 : 0xffd23f))); l++ } _gs.set(1, 1, 1); L_.count = l; L_.instanceMatrix.needsUpdate = true; if (L_.instanceColor) L_.instanceColor.needsUpdate = true;
}
// ---- trains: every car follows the replica's centre line; riders are drawn in the seats that are taken
const _cp = V(), _cu = V(), _ct = V(), _cs = V(), _cm = new THREE.Matrix4(), _cq = new THREE.Quaternion();
function trainsDraw10(dt) {
  for (const o of TY.park.objs) {
    const R = o.rt; if (!R) continue;
    if (R.anim && R.anim.length) { const t = R.animT; for (let i = 0; i < R.anim.length; i++) R.anim[i](t, dt) }
    if (!R.trains) continue; const p = objInfo10(o).prof, hang = p.hang, spc = p.seats / p.nCars;
    for (const tr of R.trains) {
      let nr = 0; const seated = tr.riders.filter(g => g.st === 'ride');
      for (let c = 0; c < p.nCars; c++) {
        trainPose10(p, tr.s - c * 1.15, _cp, _cu, _ct); _cs.crossVectors(_cu, _ct); const car = tr.cars[c]; car.position.copy(_cp).addScaledVector(_cu, hang ? -1.25 : .3); car.quaternion.setFromRotationMatrix(_cm.makeBasis(_cs, _cu, _ct));
        for (let k = 0; k < spc; k++) { const g = seated[c * spc + k]; if (!g) continue; const st = tr.seats[k]; _gv.copy(car.position).addScaledVector(_cs, st[0]).addScaledVector(_cu, st[1] + .2).addScaledVector(_ct, st[2]); _cm.compose(_gv, car.quaternion, _one10); tr.bodies.setMatrixAt(nr, _cm); tr.bodies.setColorAt(nr, _gc.setHex(g.shirt)); _gv.addScaledVector(_cu, .32); _cm.compose(_gv, car.quaternion, _one10); tr.heads.setMatrixAt(nr, _cm); tr.heads.setColorAt(nr, _gc.setHex(g.skin)); nr++ }
      }
      tr.heads.count = tr.bodies.count = nr; tr.heads.instanceMatrix.needsUpdate = tr.bodies.instanceMatrix.needsUpdate = true; if (tr.heads.instanceColor) { tr.heads.instanceColor.needsUpdate = true; tr.bodies.instanceColor.needsUpdate = true }
    }
  }
}
// ---- selection frame around the chosen thing
function selDraw10() {
  const L_ = TY.selL, S = TY.sel; if (!S || S.guest) { L_.visible = false; if (S && S.guest && (S.guest.st === 'gone' || !TY.guests.includes(S.guest))) { TY.sel = null; tyUi10() } return }
  const o = TY.objById.get(S.id); if (!o) { L_.visible = false; return } if (S.drawn === o.id + '|' + o.x + '|' + o.z + '|' + o.r) { L_.visible = true; L_.material.opacity = .6 + .4 * Math.sin(TY.t * 5); return }
  const fp = footprint10(o); let i0 = 1e9, i1 = -1e9, j0 = 1e9, j1 = -1e9; for (const [i, j] of fp.solid) { i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j) }
  const x0 = tX10(i0) - 2, x1 = tX10(i1) + 2, z0 = tZ10(j0) - 2, z1 = tZ10(j1) + 2, a = L_.geometry.attributes.position.array, P_ = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; let k = 0;
  for (let y = 0; y < 2; y++) for (let e = 0; e < 4; e++) { const p = P_[e], q = P_[(e + 1) % 4], yy = .15 + y * 1.1; a[k++] = p[0]; a[k++] = yy; a[k++] = p[1]; a[k++] = q[0]; a[k++] = yy; a[k++] = q[1] }
  for (let e = 0; e < 4; e++) { const p = P_[e]; a[k++] = p[0]; a[k++] = .15; a[k++] = p[1]; a[k++] = p[0]; a[k++] = 1.25; a[k++] = p[1] }
  L_.geometry.attributes.position.needsUpdate = true; L_.visible = true; S.drawn = o.id + '|' + o.x + '|' + o.z + '|' + o.r;
}
function tyDraw10(dt) { TY.t += dt; peopleDraw10(dt); trainsDraw10(dt); bubblesDraw10(dt); selDraw10(); if (TY.sel && TY.sel.guest && TY.sel.follow) { const g = TY.sel.guest; camT10.x = g.x; camT10.z = g.z } }
