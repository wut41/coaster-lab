// ---- 10.0 MY PARK — the 3D world: ground, paths, fences, the gate, the sky and light of the day, and every model.
// The park has its own root group next to the ride world (which is hidden while My Park is open). Static things are
// merged or instanced so a busy park stays within a few hundred draw calls on a phone.
const HALF10 = GW10 * TS10 / 2;
const _tm = new THREE.Matrix4(), _tq = new THREE.Quaternion(), _tv = V(), _tv2 = V(), _tc = new THREE.Color(), _one10 = V(1, 1, 1);
function tyH10(x, z) { const d = Math.max(Math.abs(x), Math.abs(z)) - (HALF10 + 6); if (d <= 0) return 0; const f = smooth10(d / 70), n = Math.sin(x * .031) * Math.cos(z * .027) + .5 * Math.sin(x * .07 + z * .05); return f * (7 + 5 * n) + Math.max(0, d - 90) * .22 * (1 + .3 * n) }
function tyWorld10() {
  if (TY.root) return; const R = TY.root = new THREE.Group(); R.name = 'my-park'; R.visible = false; scene.add(R); const M_ = tyMats10();
  // lawn: one plane with a small painted texture (8 px per tile) that shows which land is yours
  const cv = document.createElement('canvas'); cv.width = cv.height = GW10 * 8; TY.landCv = cv; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; TY.landTx = tx;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(HALF10 * 2, HALF10 * 2), TY.lawnM = new THREE.MeshStandardMaterial({ map: tx, roughness: .95 })); lawn.rotation.x = -PI / 2; lawn.receiveShadow = true; R.add(lawn);
  // the countryside around the park: rolling hills, a ring of trees and far mountains (all static, 3 draw calls)
  const og = new THREE.PlaneGeometry(1100, 1100, 70, 70); og.rotateX(-PI / 2); const op = og.attributes.position, oc_ = new Float32Array(op.count * 3), ca = new THREE.Color(0x4f9a5a), cb = new THREE.Color(0x6fae6a);
  for (let i = 0; i < op.count; i++) { const x = op.getX(i), z = op.getZ(i), y = tyH10(x, z); op.setY(i, y - .08); _tc.lerpColors(ca, cb, clamp(.5 + .4 * Math.sin(x * .05) * Math.cos(z * .04) + y * .02, 0, 1)); oc_[i * 3] = _tc.r; oc_[i * 3 + 1] = _tc.g; oc_[i * 3 + 2] = _tc.b }
  og.setAttribute('color', new THREE.BufferAttribute(oc_, 3)); og.computeVertexNormals(); const out = new THREE.Mesh(og, TY.outM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96 })); out.receiveShadow = true; R.add(out);
  { const nT = mobile ? 170 : 300, r10 = rng10(77), tr = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 4.6, 6).translate(0, 3, 0), new THREE.MeshStandardMaterial({ color: 0x2f8f55, roughness: .9 }), nT), tk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .3, 1.4, 5).translate(0, .7, 0), new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: .9 }), nT);
    for (let i = 0; i < nT; i++) { let x, z; do { x = (r10() - .5) * 520; z = (r10() - .5) * 520 } while (Math.max(Math.abs(x), Math.abs(z)) < HALF10 + 9 || (Math.abs(x) < 9 && z > 0)); const s_ = .8 + r10() * 1.5, y = tyH10(x, z) - .1; _tm.compose(_tv.set(x, y, z), _tq.identity(), _tv2.set(s_, s_, s_)); tr.setMatrixAt(i, _tm); tk.setMatrixAt(i, _tm) } tr.castShadow = true; R.add(tr, tk);
    const nM = 22, mt = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6).translate(0, .5, 0), new THREE.MeshStandardMaterial({ color: 0x7d93a4, roughness: 1 }), nM); for (let i = 0; i < nM; i++) { const a = i / nM * 6.283 + r10() * .2, rr = 330 + r10() * 70, h = 50 + r10() * 60; _tm.compose(_tv.set(Math.cos(a) * rr, -2, Math.sin(a) * rr), _tq.identity(), _tv2.set(h * 1.1, h, h * 1.1)); mt.setMatrixAt(i, _tm) } R.add(mt) }
  // paths: one instanced mesh, coloured per tile
  TY.pathM = new THREE.MeshStandardMaterial({ roughness: .9 }); TY.pathMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(TS10 - .06, .1, TS10 - .06), TY.pathM, 1500); TY.pathMesh.count = 0; TY.pathMesh.receiveShadow = true; TY.pathMesh.frustumCulled = false; R.add(TY.pathMesh);
  // approach road outside the gate
  { const rd = new THREE.Mesh(new THREE.BoxGeometry(TS10 - .06, .1, 60), TY.pathM); rd.position.set(tX10(GATE_I10), .0, HALF10 + 30); rd.receiveShadow = true; R.add(rd) }
  TY.fenceG = new THREE.Group(); R.add(TY.fenceG); TY.gateG = new THREE.Group(); R.add(TY.gateG); TY.objG = new THREE.Group(); R.add(TY.objG); TY.decoG = new THREE.Group(); R.add(TY.decoG); TY.ghostG = new THREE.Group(); R.add(TY.ghostG);
  // grid lines shown while building
  { const pts = []; for (let i = 0; i <= GW10; i++) { const a = -HALF10 + i * TS10; pts.push(a, .07, -HALF10, a, .07, HALF10, -HALF10, .07, a, HALF10, .07, a) } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); TY.gridL = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .16, depthWrite: false })); TY.gridL.visible = false; R.add(TY.gridL) }
  // selection frame
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(24 * 3), 3)); TY.selL = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffe14a, depthTest: false, transparent: true })); TY.selL.renderOrder = 9; TY.selL.visible = false; TY.selL.frustumCulled = false; R.add(TY.selL) }
  // sky dome: a gradient that follows the time of day and the weather, with the sun's glow
  TY.skyU = { uTop: { value: new THREE.Color(0x3d8ee0) }, uHor: { value: new THREE.Color(0xcfe9ff) }, uSun: { value: new THREE.Color(0xfff0d1) }, uDir: { value: V(0, 1, 0) } };
  TY.sky = new THREE.Mesh(new THREE.SphereGeometry(385, 24, 14), new THREE.ShaderMaterial({ uniforms: TY.skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 uTop,uHor,uSun,uDir;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.,1.);vec3 c=mix(uHor,uTop,pow(h,.55));float s=max(dot(d,uDir),0.);c+=uSun*(pow(s,260.)*1.4+pow(s,10.)*.2);if(d.y<0.)c=mix(uHor,uHor*.8,clamp(-d.y*5.,0.,1.));gl_FragColor=vec4(c,1.);}' }));
  TY.sky.renderOrder = -20; TY.sky.frustumCulled = false; R.add(TY.sky);
  tyGuestMeshes10(); tyBubbles10();
  TY.built = true;
}
// ---- land: paint the lawn texture and rebuild the fence around what you own
function tyLand10() {
  const g = TY.landCv.getContext('2d'), P_ = TY.park, r10 = rng10(5);
  for (let j = 0; j < GH10; j++) for (let i = 0; i < GW10; i++) { const own = TY.own[tI10(i, j)], k = (i + j) % 2; g.fillStyle = own ? (k ? '#4fae62' : '#55b568') : (k ? '#3f7a52' : '#437f56'); g.fillRect(i * 8, j * 8, 8, 8); if (!own) { g.fillStyle = 'rgba(20,40,60,.16)'; g.fillRect(i * 8, j * 8, 8, 8) } }
  for (let k = 0; k < 2600; k++) { g.fillStyle = r10() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,40,0,.05)'; g.fillRect(r10() * GW10 * 8, r10() * GH10 * 8, 1 + r10() * 2, 1 + r10() * 2) }
  TY.landTx.needsUpdate = true;
  // fence: posts and two rails on every edge between your land and land that is not yours (the gate is left open)
  while (TY.fenceG.children.length) { const o = TY.fenceG.children[0]; o.geometry.dispose(); TY.fenceG.remove(o) }
  const edges = []; for (let j = 0; j < GH10; j++) for (let i = 0; i < GW10; i++) { if (!TY.own[tI10(i, j)]) continue; NB10.forEach(([dx, dz]) => { const a = i + dx, b = j + dz; if (inG10(a, b) && TY.own[tI10(a, b)]) return; if (i === GATE_I10 && j === GATE_J10 && dz === 1) return; edges.push([tX10(i) + dx * TS10 / 2, tZ10(j) + dz * TS10 / 2, dx !== 0]) }) }
  if (edges.length) { const fm = TY.fenceM || (TY.fenceM = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: .8 })), rail = new THREE.InstancedMesh(new THREE.BoxGeometry(TS10, .07, .07), fm, edges.length * 2), post = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, 1.05, .12), fm, edges.length), qy = new THREE.Quaternion().setFromAxisAngle(Yax, PI / 2);
    edges.forEach(([x, z, vert], k) => { for (let r = 0; r < 2; r++) rail.setMatrixAt(k * 2 + r, _tm.compose(_tv.set(x, .45 + r * .42, z), vert ? qy : _tq.identity(), _one10)); post.setMatrixAt(k, _tm.compose(_tv.set(x + (vert ? 0 : -TS10 / 2), .52, z + (vert ? -TS10 / 2 : 0)), _tq.identity(), _one10)) }); TY.fenceG.add(rail, post) }
}
// ---- the gate: arch, name board and ticket booths, in the park's colours
function tyGate10() {
  const G_ = TY.gateG, P_ = TY.park; while (G_.children.length) { const o = G_.children[0]; if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose() } G_.remove(o) }
  const K = new Kit10(), c1 = parseInt(P_.look.gate.slice(1), 16), c2 = parseInt(P_.look.sign.slice(1), 16), x0 = tX10(GATE_I10), z0 = HALF10 + .2;
  for (const s_ of [-1, 1]) { K.box(1.5, 7.4, 1.5, c1, x0 + s_ * 3.6, 3.7, z0).box(1.9, .5, 1.9, c2, x0 + s_ * 3.6, 7.6, z0).cyl(0, 1.15, 1.8, c2, x0 + s_ * 3.6, 8.75, z0, 4, 0, PI / 4).box(2.6, 2.5, 2.4, 0xf6f1e7, x0 + s_ * 6.2, 1.25, z0 + .2).box(2.9, .3, 2.7, c1, x0 + s_ * 6.2, 2.65, z0 + .2).box(1.4, .9, .1, 0x2b3441, x0 + s_ * 6.2, 1.5, z0 + 1.43) }
  K.box(8.8, 1.7, 1, c1, x0, 6.5, z0); for (const s_ of [-.9, .9]) K.box(.1, .95, 1.3, 0x8b97a6, x0 + s_, .47, z0);
  G_.add(K.mesh()); const sg = nameSign10(P_.name, P_.look.sign, 8.2, 1.35); sg.position.set(x0, 6.5, z0 + .52); G_.add(sg); const sg2 = nameSign10(P_.name, P_.look.sign, 8.2, 1.35); sg2.position.set(x0, 6.5, z0 - .52); sg2.rotation.y = PI; G_.add(sg2);
}
// ---- paths
function tyPaths10() { const m = TY.pathMesh; let n = 0; for (let k = 0; k < GW10 * GH10 && n < 1500; k++) { const st = TY.path[k]; if (!st) continue; m.setMatrixAt(n, _tm.compose(_tv.set(tX10(k % GW10), .05, tZ10(Math.floor(k / GW10))), _tq.identity(), _one10)); m.setColorAt(n, _tc.setHex(PATHS10[st - 1].c)); n++ } m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true }
// ---- object models
function objWorld10(o, fp) {// where the model's origin sits and how it is turned
  const inf = objInfo10(o); if (inf.t === 'coaster') return { x: (o.x - GW10 / 2) * TS10, z: (o.z - GH10 / 2) * TS10, ry: -o.r * PI / 2 };
  const W = o.r % 2 ? inf.d : inf.w, D = o.r % 2 ? inf.w : inf.d; return { x: (o.x - GW10 / 2 + W / 2) * TS10, z: (o.z - GH10 / 2 + D / 2) * TS10, ry: -o.r * PI / 2 };
}
function decoModel10(g, C) {
  const m = C.model; switch (m) {
    case 'tree': SCN.tree(g, 0x2c8f55); g.scale.setScalar(1.25); break; case 'pine': SCN72.pine(g); g.scale.setScalar(1.2); break; case 'palm': SCN.palm(g); break; case 'bush': SCN72.bush(g); g.scale.setScalar(1.5); break;
    case 'flowers': deco3d80(g, 'flowers'); break; case 'rock': SCN.rock(g, 0x8d8f86); break; case 'fountain': deco3d80(g, 'fountain'); g.scale.setScalar(.85); break; case 'statue': deco3d80(g, 'statue', null, 0xffd23f); break;
    case 'bench': deco3d80(g, 'benches'); break; case 'lamp': { Cy80(g, .07, .1, 3.2, lmat80(0x2b3441, .5, .5), 0, 1.6, 0, 8); const b = new THREE.Mesh(new THREE.SphereGeometry(.26, 10, 8), TY.lampM || (TY.lampM = new THREE.MeshStandardMaterial({ color: 0xfff2cc, roughness: .4, emissive: 0xffd28a, emissiveIntensity: .3 }))); b.position.y = 3.3; g.add(b); break }
    case 'bin': { Cy80(g, .32, .26, .85, lmat80(0x2f7d4a, .6), 0, .43, 0, 10); Cy80(g, .35, .35, .08, lmat80(0x23272e, .5), 0, .88, 0, 10); break }
    case 'flag': SCN.flag(g, 0xff3d6b); g.scale.setScalar(.8); break; case 'mushroom': SCN72.mushroom(g); break; case 'lolly': SCN72.lolly(g); break; case 'torch': SCN72.torch(g); break; case 'castle': SCN72.castle(g); g.scale.setScalar(.5); break;
    default: SCN.rock(g);
  }
}
function objBuild10(o) {
  const inf = objInfo10(o), w = objWorld10(o), M_ = tyMats10(); let g;
  if (inf.t === 'coaster') { g = coasterBuild10(o, inf); const nTr = 1 + (o.up && o.up.cap >= 2 ? 1 : 0); o.rt.trains = []; for (let k = 0; k < nTr; k++) { const tr = trainBuild10(o, inf, k); tr.cars.forEach(c => g.add(c)); g.add(tr.heads, tr.bodies); o.rt.trains.push(tr) } }
  else if (inf.t === 'flat') { g = new THREE.Group(); const m = new THREE.Group(), an = []; att3d80(inf.model, m, an, o.col && o.col.body ? parseInt(o.col.body.slice(1), 16) : inf.col); try { mergeAnim80(m) } catch (e) {} m.position.z = .8; g.add(m); o.rt.anim = an; o.rt.animT = 0;
    const K = new Kit10(), W = inf.w * TS10, D = inf.d * TS10; K.box(W - .3, .06, D - .3, 0xcdbfa6, 0, .03, 0); for (let x = -W / 2 + .5; x <= W / 2 - .4; x += 1.5) K.box(.05, .75, .05, 0x8b97a6, x, .38, -D / 2 + 1.9); K.box(W - 1, .05, .05, 0xe8edf3, 0, .75, -D / 2 + 1.9); for (const s_ of [-1, 1]) K.box(.2, 2.6, .2, inf.col, s_ * 1.2 - W / 2 + 2, 1.3, -D / 2 + .2); K.box(2.8, .45, .25, inf.col, -W / 2 + 2, 2.7, -D / 2 + .2); g.add(K.mesh());
    const sg = nameSign10(objName10(o), '#' + new THREE.Color(inf.col).getHexString(), 3.4, .6); sg.position.set(W / 2 - 2.4, 2.2, -D / 2 + .15); sg.rotation.y = PI; g.add(sg); g.userData.sign = sg }
  else if (inf.t === 'shop' || inf.t === 'fac') { g = new THREE.Group(); const m = new THREE.Group(); shop3d80(m, inf.model, inf.col); m.scale.setScalar(.92); m.position.z = -.3; g.add(m) }
  else { g = new THREE.Group(); decoModel10(g, inf) }
  g.position.set(w.x, 0, w.z); g.rotation.y = w.ry; g.userData.id = o.id; g.traverse(q => { if (q.isMesh && !q.userData.sign10) { q.castShadow = true } }); return g;
}
function objDispose10(g) { g.traverse(q => { if (q.geometry && !(RGEO && Object.values(RGEO).includes(q.geometry))) q.geometry.dispose(); if (q.isInstancedMesh) q.dispose();[].concat(q.material || []).forEach(m => { if (m && !keep.has(m) && !Object.values(TYM).includes(m) && m !== TY.lampM) { if (m.map) m.map.dispose(); m.dispose() } }) }); if (g.parent) g.parent.remove(g) }
// scenery is merged into a few meshes; rebuilt (a moment later) whenever a piece of scenery is added or removed
function decoRebuild10() {
  TY.decoDirty = 0; while (TY.decoG.children.length) objDispose10(TY.decoG.children[0]); const tmp = new THREE.Group();
  for (const o of TY.park.objs) { const inf = objInfo10(o); if (!inf || inf.t !== 'deco') continue; tmp.add(objBuild10(o)) }
  if (tmp.children.length) { const mg = mergeGroup7(tmp); mg.traverse(q => { if (q.isMesh) q.castShadow = true }); TY.decoG.add(mg) } tmp.traverse(q => { if (q.geometry) q.geometry.dispose() });
}
function objAdd3d10(o) { const inf = objInfo10(o); if (!inf) return; o.rt = o.rt || rideRt10(o, inf); if (inf.t === 'deco') { TY.decoDirty = .25; return } if (o.rt.g) objDispose10(o.rt.g); o.rt.g = objBuild10(o); TY.objG.add(o.rt.g); o.rt.xf = objWorld10(o) }
function objRemove3d10(o) { const inf = objInfo10(o); if (inf && inf.t === 'deco') { TY.decoDirty = .15; return } if (o.rt && o.rt.g) { objDispose10(o.rt.g); o.rt.g = null } }
// local (ride frame) → world for a placed object
function objPt10(o, lx, ly, lz, out) { const w = o.rt.xf || (o.rt.xf = objWorld10(o)), c = Math.cos(w.ry), s_ = Math.sin(w.ry); return out.set(w.x + lx * c + lz * s_, ly, w.z - lx * s_ + lz * c) }
// ---- whole-park (re)build after loading a park
function tyRebuild10() {
  tyWorld10(); gridSync10(); while (TY.objG.children.length) objDispose10(TY.objG.children[0]);
  TY.guests = []; TY.staff = []; TY.litter = []; TY.sel = null; TY.tool = null; ghostClear10();
  for (const o of TY.park.objs) { o.rt = null; objAdd3d10(o) }
  tyLand10(); tyGate10(); tyPaths10(); decoRebuild10(); beauty10(); linkAll10(); staffSync10(); TY.selL.visible = false;
}
// ---- camera: you look down at a point on the ground; drag to pan, pinch to zoom, twist to turn, two fingers up/down to tilt
const camT10 = { x: 0, z: 70, yaw: 0, pitch: .95, dist: 78 };
CAM72.park10 = { direct: true, free: true, fov: () => 48, fn(dt) {
  const c = TY.cam, k = 1 - Math.pow(.0005, dt); c.x += (camT10.x - c.x) * k; c.z += (camT10.z - c.z) * k; c.dist += (camT10.dist - c.dist) * k; c.pitch += (camT10.pitch - c.pitch) * k; let dy = camT10.yaw - c.yaw; dy -= 2 * PI * Math.round(dy / (2 * PI)); c.yaw += dy * k; camT10.yaw = c.yaw + dy * (1 - k);
  const ch = Math.cos(c.pitch) * c.dist; des.set(c.x + Math.sin(c.yaw) * ch, Math.max(2.2, Math.sin(c.pitch) * c.dist), c.z + Math.cos(c.yaw) * ch); look.set(c.x, 1, c.z); camera.up.set(0, 1, 0);
} };
// on-ride camera inside the park: sits in the front car of the chosen coaster and banks with the track
const _pv = { p: V(), u: V(), t: V(), a: V() };
CAM72.parkpov10 = { direct: true, free: true, fov: () => 74, fn(dt) {
  const o = TY.pov && TY.objById.get(TY.pov); if (!o || !o.rt || !o.rt.trains) { tyPov10(null); return } const tr = o.rt.trains[0], inf = objInfo10(o), p = inf.prof;
  trainPose10(p, tr.s, _pv.p, _pv.u, _pv.t); trainPose10(p, tr.s + 5, _pv.a, _tv, _tv2); const hang = p.hang ? -1.05 : 1.05;
  objPt10(o, _pv.p.x + _pv.u.x * hang, 0, _pv.p.z + _pv.u.z * hang, des); des.y = _pv.p.y + _pv.u.y * hang; objPt10(o, _pv.a.x + _pv.u.x * hang, 0, _pv.a.z + _pv.u.z * hang, look); look.y = _pv.a.y + _pv.u.y * hang;
  const w = o.rt.xf, c = Math.cos(w.ry), s_ = Math.sin(w.ry); camera.up.set(_pv.u.x * c + _pv.u.z * s_, _pv.u.y, -_pv.u.x * s_ + _pv.u.z * c);
} };
function tyPov10(id) { TY.pov = id || null; camMode = id ? 'parkpov10' : 'park10'; snap = true; if (!id) camera.up.set(0, 1, 0); if (typeof tyUi10 === 'function') tyUi10() }
function camFocus10(x, z, dist) { camT10.x = clamp(x, -HALF10 - 20, HALF10 + 20); camT10.z = clamp(z, -HALF10 - 20, HALF10 + 40); if (dist) camT10.dist = clamp(dist, 14, 240) }
// ---- light of the day. hour 0-24 → sun position, colours of sun / sky / fog, lamp glow; weather dims and greys it.
const SKY10 = { day: [0x3d8ee0, 0xcfe9ff, 0xb9dcf5, 0xfff0d1, 3.0, 1.35], gold: [0x33457e, 0xffb98a, 0xe6b08e, 0xffa462, 2.1, .8], night: [0x030611, 0x0f1c3a, 0x0c1528, 0x8fa8ff, .5, .34] };
const _kc = [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()], _kd = [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()], _sunD = V();
function tyLight10(dt) {
  const P_ = TY.park, h = P_.min / 60, el = Math.sin(PI * (h - 6) / 14), az = PI * (h - 6) / 14, W_ = WX10[P_.wx.k] || WX10.sunny;
  const wDay = smooth10((el - .04) / .32), wNight = (h < 6 || h > 20) ? 1 : smooth10((-el + .02) / .14), wGold = clamp(1 - wDay - wNight, 0, 1), mix = (i, o) => { o.setHex(SKY10.day[i]).multiplyScalar(wDay); _tc.setHex(SKY10.gold[i]).multiplyScalar(wGold); o.add(_tc); _tc.setHex(SKY10.night[i]).multiplyScalar(wNight); o.add(_tc); return o };
  const top = mix(0, _kc[0]), hor = mix(1, _kc[1]), fog = mix(2, _kc[2]), sunC = mix(3, _kc[3]); let sunI = SKY10.day[4] * wDay + SKY10.gold[4] * wGold + SKY10.night[4] * wNight, hemiI = SKY10.day[5] * wDay + SKY10.gold[5] * wGold + SKY10.night[5] * wNight;
  // weather: ease towards the current weather's cloud cover / dimming so changes are gradual
  const L_ = TY.lt || (TY.lt = { cover: W_.cover, dim: W_.dim, fog: 0, night: wNight }), ke = 1 - Math.exp(-dt * .35); L_.cover += (W_.cover - L_.cover) * ke; L_.dim += (W_.dim - L_.dim) * ke; L_.fog += ((W_.fog ? 1 : 0) - L_.fog) * ke; L_.night = wNight; L_.day = wDay;
  const grey = c => { const l = c.r * .3 + c.g * .5 + c.b * .2, k = clamp((L_.cover - .3) * 1.1, 0, .82); c.r += (l * .92 - c.r) * k; c.g += (l * .95 - c.g) * k; c.b += (l - c.b) * k; c.multiplyScalar(.55 + .45 * L_.dim) };
  grey(top); grey(hor); grey(fog); sunI *= L_.dim * (1 - .5 * clamp((L_.cover - .5) * 2, 0, 1) * wDay); hemiI *= .7 + .3 * L_.dim;
  // sun (or moon) direction; the shadow box follows the spot you are looking at
  if (wNight > .5) _sunD.set(-.45, .75, .35).normalize(); else _sunD.set(-Math.cos(az) * .85, Math.max(.12, el), -.42 + .2 * Math.cos(az)).normalize();
  const f = TY.cam, R = clamp(f.dist * .9, 46, 120), sc = sun.shadow.camera; sun.position.set(f.x + _sunD.x * 140, _sunD.y * 140, f.z + _sunD.z * 140); sun.target.position.set(f.x, 0, f.z); sun.target.updateMatrixWorld();
  if (Math.abs(sc.right - R) > 4) { sc.left = sc.bottom = -R; sc.right = sc.top = R; sc.near = 20; sc.far = 320; sc.updateProjectionMatrix() }
  sun.color.copy(sunC); sun.intensity = sunI; hemi.intensity = hemiI; hemiBase = hemiI; renderer.toneMappingExposure = 1.08 + .14 * wNight;
  TY.skyU.uTop.value.copy(top); TY.skyU.uHor.value.copy(hor); TY.skyU.uSun.value.copy(sunC).multiplyScalar((wNight > .5 ? .5 : 1) * clamp(1.15 - L_.cover, 0, 1)); TY.skyU.uDir.value.copy(_sunD); TY.sky.position.copy(camera.position);
  if (scene.fog) { scene.fog.color.copy(fog); const far = 380 - 255 * L_.fog - 60 * clamp(L_.cover - .85, 0, .15) / .15 * (W_.rain ? 1 : 0); scene.fog.far = far; scene.fog.near = far * (.34 - .28 * L_.fog) }
  // night: stars, lamps and station lights
  const dark = wNight > .35 || L_.dim < .5; if (dark !== TY.dark) { TY.dark = dark; TY.root.traverse(o => { if (o.userData.night10) o.visible = dark }) }
  if (TY.lampM) TY.lampM.emissiveIntensity = .25 + 2.6 * wNight; TYM.glow.color.setHex(0xffe9a8).multiplyScalar(.6 + .4 * wNight);
  if (wNight > .2 && !stars) mkStars7(); if (stars) { stars.visible = wNight > .2 && L_.cover < .7; stars.material.opacity = .85 * wNight * clamp(1 - L_.cover, 0, 1) }
  // wet ground when it rains (the 7.2 weather keeps the wetness value; rain and lightning are drawn by its systems too)
  const wr = typeof wet72 === 'number' ? wet72 : 0; TY.lawnM.roughness = .95 - .4 * wr; TY.lawnM.color.setScalar(1 - .16 * wr); TY.pathM.roughness = .9 - .6 * wr; TY.pathM.color.setScalar(1 - .22 * wr); TY.outM.color.setScalar(1 - .14 * wr);
  // tell the older systems what time it roughly is (their night lights and cloud colours follow it)
  tod = wNight > .5 ? 'night' : wGold > .5 ? 'sunset' : 'day';
}
// the 7.2 weather flags are borrowed while My Park is open and handed back unchanged when it closes
function tyWxApply10() { const W_ = WX10[TY.park.wx.k] || WX10.sunny; W7.rain = !!W_.rain && !W_.storm; W7.storm = !!W_.storm; W72.heavy = false; W72.snow = false; W72.cover = W_.cover; if (W_.storm) W7.stormT = Math.min(W7.stormT, 2) }
// ---- entering and leaving My Park
const tySv10 = {};
function tyEnter10(slot, park) {
  if (editing) return false; tyWorld10();
  if (!TY.on) { Object.assign(tySv10, { playing, camMode, tod, rain: W7.rain, storm: W7.storm, heavy: W72.heavy, snow: W72.snow, cover: W72.cover, fogMul: W7.fogMul, stormT: W7.stormT, sl: sun.shadow.camera.left, sr: sun.shadow.camera.right, sf: sun.shadow.camera.far, sn: sun.shadow.camera.near, sp: sun.position.clone(), st: sun.target.position.clone(), far: camera.far }); W7.fogMul = 1 }
  if (cine) setCine(false); if (labOpen) closeLab(); if (startOpen) closeStart(); $('#menu').hidden = true; closeHub72(); if (UI72.dk) closeDock72(); setPlay(false);
  TY.slot = slot; TY.park = park; TY.visit = slot ? null : TY.visit; tyRebuild10(); TY.on = true; rg.visible = false; TY.root.visible = true; document.body.classList.add('ty10');
  camMode = 'park10'; snap = true; camera.up.set(0, 1, 0); if (!TY.cam.set) { camT10.x = tX10(GATE_I10); camT10.z = tZ10(GATE_J10) - 18; camT10.yaw = 0; camT10.pitch = .9; camT10.dist = mobile ? 92 : 78; Object.assign(TY.cam, camT10) }
  tyWxApply10(); TY.lt = null; TY.dark = null; tyLight10(1); tyUiOpen10(); emit72('ty10', { on: true }); return true;
}
function tyExit10() {
  if (!TY.on) return; savePark10(); TY.on = false; TY.pov = null; TY.root.visible = false; rg.visible = true; document.body.classList.remove('ty10'); tyUiClose10(); camera.up.set(0, 1, 0);
  W7.rain = tySv10.rain; W7.storm = tySv10.storm; W72.heavy = tySv10.heavy; W72.snow = tySv10.snow; W72.cover = tySv10.cover; W7.fogMul = tySv10.fogMul; W7.stormT = tySv10.stormT; tod = tySv10.tod;
  const sc = sun.shadow.camera; sc.left = sc.bottom = tySv10.sl; sc.right = sc.top = tySv10.sr; sc.far = tySv10.sf; sc.near = tySv10.sn; sc.updateProjectionMatrix(); sun.position.copy(tySv10.sp); sun.target.position.copy(tySv10.st); sun.target.updateMatrixWorld();
  camMode = CAM72[tySv10.camMode] || ['chase', 'side', 'front', 'ride', 'orbit'].includes(tySv10.camMode) ? tySv10.camMode : 'chase'; if (camMode === 'park10' || camMode === 'parkpov10') camMode = 'chase'; setCam(camMode); snap = true; applyTod(); setPlay(true); emit72('ty10', { on: false });
}
// while My Park is open the ride world's own sky / light updates wait (they are applied again when you leave)
{ const f0 = applyTod; applyTod = function () { if (TY.on) return; return f0.apply(this, arguments) } }
