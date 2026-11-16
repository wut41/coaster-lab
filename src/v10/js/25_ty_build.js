// ---- 10.0 MY PARK — building: placing and removing things, paths, land, upgrades, the placement preview and the
// touch / mouse / keyboard controls of the park view.
const newObj10 = (key, i, j, r) => ({ id: 0, k: key, x: i, z: j, r: r || 0, open: true, rel: 100, age: 0, price: -1, up: { cap: 0, rel: 0, fx: 0 }, st: { n: 0, inc: 0, run: 0, like: 0, rated: 0, down: 0 } });
const canEdit10 = () => !!TY.park && !TY.visit;
function tyBuild10(key, i, j, r, free) {
  const P_ = TY.park; if (!canEdit10()) return { ok: false, why: 'You are visiting: this park cannot be changed' }; const o = newObj10(key, i, j, r), inf = objInfo10(o); if (!inf) return { ok: false, why: 'That cannot be built' };
  if (P_.mode !== 'sandbox' && level10().lv < inf.lv) return { ok: false, why: 'Unlocks at park level ' + inf.lv };
  const fp = footprint10(o), why = fitWhy10(fp, o); if (why) return { ok: false, why }; if (!free && !canPay10(inf.cost)) return { ok: false, why: 'Not enough money: ' + money10(inf.cost) + ' needed' };
  if (P_.objs.length >= 880) return { ok: false, why: 'The park is full (880 things)' };
  o.id = P_.nextId++; if (!free) pay10('build', inf.cost); P_.objs.push(o); stamp10(o, fp, o.id); TY.objById.set(o.id, o); TY.pathVer++; objAdd3d10(o); linkAll10(); if (inf.t === 'deco') beauty10();
  if (!P_.seen['b:' + key]) { P_.seen['b:' + key] = 1; xp10(inf.t === 'deco' ? 3 : 14) } try { sfx('chime') } catch (e) {} goals10(); return { ok: true, o };
}
// everyone waiting for or riding a thing is put safely back on the path (used before it is rebuilt or removed)
function rideClear10(o) {
  const R = o.rt; if (!R) return; R.q.slice().forEach(g => gLeaveQ10(g, false)); const out = (R.riders || []).slice(); (R.trains || []).forEach(t => { out.push(...t.riders); t.riders.length = 0 }); if (R.riders) R.riders.length = 0;
  out.forEach(g => { g.hide = false; g.y = 0; g.ro = null; g.qo = null; gRescue10(g) }); TY.guests.forEach(g => { if (g.uo === o) { g.uo = null; g.sit = 0; g.st = 'idle'; g.useT = .1 } }); R.used = 0;
  TY.staff.forEach(s_ => { if (s_.job === o) { s_.job = null; s_.st = 'idle'; s_.t = .5 } });
}
function tyRemove10(o, quiet) {
  const P_ = TY.park, inf = objInfo10(o), fp = footprint10(o); if (!canEdit10()) return false; rideClear10(o); if (fp) stamp10(o, fp, 0); TY.objById.delete(o.id); const k = P_.objs.indexOf(o); if (k >= 0) P_.objs.splice(k, 1); objRemove3d10(o); o.rt = null;
  if (TY.sel && TY.sel.id === o.id) TY.sel = null; if (TY.pov === o.id) tyPov10(null); TY.pathVer++; linkAll10(); if (inf && inf.t === 'deco') beauty10(); if (inf) earn10('sale', Math.round(inf.cost * .5)); return true;
}
const sellValue10 = o => { const inf = objInfo10(o); return inf ? Math.round(inf.cost * .5) : 0 };
function tyPath10(i, j, on, style) {
  const P_ = TY.park; if (!canEdit10() || !inG10(i, j)) return 'x'; const k = tI10(i, j); if (!TY.own[k]) return 'That land is not yours yet';
  if (on) { if (TY.path[k] === style + 1) return ''; if (TY.occ[k]) return 'Something is built there'; const c = PATHS10[style].cost; if (!TY.path[k]) { if (!canPay10(c)) return 'Not enough money'; pay10('build', c) } P_.paths[k] = style; TY.path[k] = style + 1 }
  else { if (!TY.path[k]) return ''; if (i === GATE_I10 && j >= GATE_J10 - 1) return 'The entrance path has to stay'; delete P_.paths[k]; TY.path[k] = 0 }
  TY.pathVer++; TY.pathDirty = true; return '';
}
function tyBuyLand10(px, pz) {
  const P_ = TY.park; if (!canEdit10() || landOwned10(P_, px, pz) || px < 0 || pz < 0 || px >= NPL10 || pz >= NPL10) return 'x';
  if (!NB10.some(([a, b]) => landOwned10(P_, px + a, pz + b))) return 'Buy a plot next to your park first'; const c = landPrice10(P_); if (!canPay10(c)) return 'Not enough money: ' + money10(c) + ' needed';
  pay10('land', c); const k = pz * NPL10 + px; P_.land = P_.land.slice(0, k) + '1' + P_.land.slice(k + 1); for (let j = 0; j < PLOT10; j++) for (let i = 0; i < PLOT10; i++) TY.own[tI10(px * PLOT10 + i, pz * PLOT10 + j)] = 1; tyLand10(); xp10(18); try { sfx('unlock') } catch (e) {} goals10(); return '';
}
const UPG10 = { cap: ['👥', 'Capacity', ['Bigger queue yard and faster loading', 'A second train (coasters) / more seats per cycle', 'Even faster loading and a longer queue']], rel: ['🛡', 'Reliability', ['Wears out more slowly', 'Wears slower still, quicker repairs', 'Rarely breaks down']], fx: ['✨', 'Theming & effects', ['Visitors enjoy the ride more', 'More again', 'A real crowd-pleaser']] };
const upCost10 = (o, kind) => { const inf = objInfo10(o), l = o.up[kind]; return l >= 3 ? 0 : Math.round(inf.cost * [.12, .2, .3][l] / 50) * 50 };
function tyUpgrade10(o, kind) {
  if (!canEdit10() || !o.up || o.up[kind] >= 3) return 'x'; const c = upCost10(o, kind); if (!canPay10(c)) return 'Not enough money: ' + money10(c) + ' needed'; pay10('build', c); o.up[kind]++;
  if (kind === 'cap') { rideClear10(o); objAdd3d10(o); linkObj10(o) } try { sfx('unlock') } catch (e) {} xp10(8); return '';
}
function tyRestyle10(o) { rideClear10(o); objAdd3d10(o); linkObj10(o); if (TY.sel) TY.sel.drawn = '' }
// ---- the placement preview ("ghost"): coloured tiles show where the thing would stand and what is in the way
function ghostClear10() { if (TY.ghostM) TY.ghostM.count = 0; if (TY.ghostLine) TY.ghostLine.visible = false; TY.ghost = null; if (TY.plotM) TY.plotM.count = 0 }
function ghostInit10() {
  if (TY.ghostM) return; TY.ghostM = new THREE.InstancedMesh(new THREE.PlaneGeometry(TS10 - .14, TS10 - .14).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: .5, depthWrite: false }), 1200); TY.ghostM.count = 0; TY.ghostM.frustumCulled = false; TY.ghostM.renderOrder = 5; TY.ghostG.add(TY.ghostM);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(302 * 3), 3)); TY.ghostLine = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: .9 })); TY.ghostLine.visible = false; TY.ghostLine.frustumCulled = false; TY.ghostLine.renderOrder = 6; TY.ghostG.add(TY.ghostLine);
  TY.plotM = new THREE.InstancedMesh(new THREE.PlaneGeometry(PLOT10 * TS10 - .8, PLOT10 * TS10 - .8).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: .3, depthWrite: false }), 36); TY.plotM.count = 0; TY.plotM.frustumCulled = false; TY.plotM.renderOrder = 4; TY.ghostG.add(TY.plotM);
}
// where the anchor goes so that the thing sits centred under the finger
function ghostAnchor10(key, r, i, j) { const o = newObj10(key, 0, 0, r), fp = footprint10(o); if (!fp) return [i, j]; let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, z] of fp.solid) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, z); d = Math.max(d, z) } return [i - Math.round((a + b) / 2), j - Math.round((c + d) / 2)] }
function ghostSet10(i, j) {
  const T_ = TY.tool; if (!T_ || T_.k !== 'place') return; ghostInit10(); const [ax, az] = ghostAnchor10(T_.key, T_.r, i, j), o = newObj10(T_.key, ax, az, T_.r), inf = objInfo10(o), fp = footprint10(o); if (!fp) return;
  const M_ = TY.ghostM, small = inf.t === 'deco'; let n = 0, bad = 0; const put = (ci, cj, col, y) => { if (n >= 1200) return; M_.setMatrixAt(n, _tm.compose(_tv.set(tX10(ci), y, tZ10(cj)), _tq.identity(), _one10)); M_.setColorAt(n, _tc.setHex(col)); n++ };
  for (const [ci, cj] of fp.solid) { let ok = inG10(ci, cj); if (ok) { const k = tI10(ci, cj); ok = !!TY.own[k] && !TY.occ[k] && !TY.path[k] && (small || !TY.air[k]) } if (!ok) bad++; put(ci, cj, ok ? 0x2fe38a : 0xff4a4a, .2) }
  if (fp.air) for (const [ci, cj] of fp.air) { let ok = inG10(ci, cj); if (ok) { const k = tI10(ci, cj), q = TY.occ[k], b = q && TY.objById.get(q), bi = b && objInfo10(b); ok = !!TY.own[k] && (!q || (bi && bi.t === 'deco')) && !TY.air[k] } if (!ok) bad++; put(ci, cj, ok ? 0x5ab8ff : 0xff4a4a, .16) }
  M_.count = n; M_.instanceMatrix.needsUpdate = true; if (M_.instanceColor) M_.instanceColor.needsUpdate = true;
  const why = bad ? fitWhy10(fp, o) || 'It does not fit there' : (TY.park.mode !== 'sandbox' && level10().lv < inf.lv ? 'Unlocks at park level ' + inf.lv : !canPay10(inf.cost) ? 'Not enough money' : '');
  // coasters also show the track as a white line
  if (inf.t === 'coaster') { const p = inf.prof, a = TY.ghostLine.geometry.attributes.position.array, w = objWorld10(o), c = Math.cos(w.ry), s_ = Math.sin(w.ry); let k = 0; for (let q = 0; q <= 300; q++) { const ii = Math.floor(q / 300 * N) % N, lx = p.pts[ii * 3], lz = p.pts[ii * 3 + 2]; a[k++] = w.x + lx * c + lz * s_; a[k++] = p.pts[ii * 3 + 1] + .2; a[k++] = w.z - lx * s_ + lz * c } TY.ghostLine.geometry.attributes.position.needsUpdate = true; TY.ghostLine.geometry.setDrawRange(0, 301); TY.ghostLine.visible = true } else TY.ghostLine.visible = false;
  TY.ghost = { i, j, ax, az, why, cost: inf.cost, name: inf.n };
}
function plotsShow10() { ghostInit10(); const P_ = TY.park, M_ = TY.plotM; let n = 0; for (let pz = 0; pz < NPL10; pz++) for (let px = 0; px < NPL10; px++) { if (landOwned10(P_, px, pz)) continue; const adj = NB10.some(([a, b]) => landOwned10(P_, px + a, pz + b)); M_.setMatrixAt(n, _tm.compose(_tv.set((px * PLOT10 + PLOT10 / 2 - GW10 / 2) * TS10, .18, (pz * PLOT10 + PLOT10 / 2 - GH10 / 2) * TS10), _tq.identity(), _one10)); M_.setColorAt(n, _tc.setHex(adj ? 0xffd23f : 0x8894a8)); n++ } M_.count = n; M_.instanceMatrix.needsUpdate = true; if (M_.instanceColor) M_.instanceColor.needsUpdate = true }
function toolSet10(t) { TY.tool = t; ghostClear10(); TY.gridL.visible = !!t; $ty10('tyIn').classList.toggle('build', !!t); if (t && t.k === 'land') plotsShow10(); if (t && t.k === 'place') { const f = TY.cam; ghostSet10(clamp(xT10(f.x), 0, GW10 - 1), clamp(zT10(f.z), 0, GH10 - 1)) } if (t) TY.sel = null; tyUi10() }
function ghostBuild10() { const T_ = TY.tool, G_ = TY.ghost; if (!T_ || !G_) return; const r = tyBuild10(T_.key, G_.ax, G_.az, T_.r); if (!r.ok) { toast10('⚠ ' + r.why, 'nofit'); return } const inf = objInfo10(r.o); if (inf.t === 'deco') ghostSet10(G_.i, G_.j); else { toolSet10(null); TY.sel = { id: r.o.id }; if (!r.o.rt.linked) toast10('🛤 ' + inf.n + ' needs a path: draw one from the entrance path to ' + (inf.t === 'coaster' ? 'its queue yard' : 'any side of it'), 'needpath', true) } tyUi10() }
// ---- controls
const $ty10 = id => document.getElementById(id);
const IN10 = { ptr: new Map(), moved: 0, t0: 0, sx: 0, sy: 0, pinch: 0, ang: 0, my: 0, paint: false, last: -1, btn: 0, keys: {} }, rc10 = new THREE.Raycaster(), _nd = new THREE.Vector2();
function groundAt10(cx, cy, out) { _nd.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); rc10.setFromCamera(_nd, camera); const o = rc10.ray.origin, d = rc10.ray.direction; if (d.y > -.02) return null; const t = -o.y / d.y; return out.set(o.x + d.x * t, 0, o.z + d.z * t) }
const _hit = V();
function tyTap10(cx, cy, touch) {
  const h = groundAt10(cx, cy, _hit); if (!h) return; const i = xT10(h.x), j = zT10(h.z), T_ = TY.tool;
  if (T_ && T_.k === 'place') { const same = TY.ghost && TY.ghost.i === i && TY.ghost.j === j; ghostSet10(i, j); if (!touch || same || objInfo10(newObj10(T_.key, 0, 0, 0)).t === 'deco') { if (TY.ghost && !TY.ghost.why) ghostBuild10(); else if (TY.ghost) toast10('⚠ ' + TY.ghost.why, 'nofit') } tyUi10(); return }
  if (T_ && T_.k === 'path') { const k = inG10(i, j) ? tI10(i, j) : -1, w = tyPath10(i, j, !(k >= 0 && TY.path[k] === T_.style + 1), T_.style); if (w && w !== 'x') toast10('⚠ ' + w, 'nopath'); return }
  if (T_ && T_.k === 'doze') { if (!inG10(i, j)) return; const k = tI10(i, j), id = TY.occ[k] || 0, o = id && TY.objById.get(id); if (o) { const inf = objInfo10(o); if (inf.cost >= 600) { ask7('Remove ' + objName10(o) + '? You get ' + money10(sellValue10(o)) + ' back.', 'Remove', 'Keep', true).then(y => { if (y) { tyRemove10(o); tyUi10() } }) } else tyRemove10(o) } else if (TY.path[k]) { const w = tyPath10(i, j, false); if (w && w !== 'x') toast10('⚠ ' + w, 'nopath') } return }
  if (T_ && T_.k === 'land') { const px = Math.floor(i / PLOT10), pz = Math.floor(j / PLOT10), P_ = TY.park; if (!inG10(i, j) || landOwned10(P_, px, pz)) return; const c = landPrice10(P_); (P_.mode === 'sandbox' ? Promise.resolve(true) : ask7('Buy this plot of land for ' + money10(c) + '?', 'Buy land', 'Not now')).then(y => { if (!y) return; const w = tyBuyLand10(px, pz); if (w) toast10('⚠ ' + w, 'noland'); else { plotsShow10(); toast10('🏞 New land bought — the fence has moved', 'land') } tyUi10() }); return }
  // nothing in hand: select a visitor, a ride, a shop…
  let bg = null, bd = clamp(TY.cam.dist * .028, 1.1, 3.2); for (const g of TY.guests) { if (g.hide) continue; const d = Math.hypot(g.x - h.x, g.z - h.z); if (d < bd) { bd = d; bg = g } }
  if (bg) { TY.sel = { guest: bg }; TY.ui.cardTab = 'main'; tyUi10(); return }
  if (inG10(i, j)) { const k = tI10(i, j), id = TY.occ[k] || TY.air[k]; if (id && TY.objById.get(id)) { TY.sel = { id }; TY.ui.cardTab = 'main'; tyUi10(); return } }
  if (TY.sel) { TY.sel = null; tyUi10() }
}
function tyInput10() {
  const el = $ty10('tyIn'), two = () => { const a = [...IN10.ptr.values()]; return { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), a: Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x), y: (a[0].y + a[1].y) / 2 } };
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('pointerdown', e => { IN10.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { el.setPointerCapture(e.pointerId) } catch (_) {} IN10.btn = e.button; if (IN10.ptr.size === 1) { IN10.moved = 0; IN10.t0 = performance.now(); IN10.sx = e.clientX; IN10.sy = e.clientY; IN10.paint = !!(TY.tool && TY.tool.k === 'path' && e.button === 0); IN10.last = -1; IN10.pOn = null; if (TY.sel && TY.sel.follow) TY.sel.follow = false } else if (IN10.ptr.size === 2) { const t = two(); IN10.pinch = t.d; IN10.ang = t.a; IN10.my = t.y; IN10.paint = false; IN10.moved = 99 } });
  el.addEventListener('pointermove', e => {
    const q = IN10.ptr.get(e.pointerId);
    if (!q) { if (e.pointerType === 'mouse' && TY.tool && TY.tool.k === 'place') { const h = groundAt10(e.clientX, e.clientY, _hit); if (h) { const i = xT10(h.x), j = zT10(h.z); if (!TY.ghost || TY.ghost.i !== i || TY.ghost.j !== j) { ghostSet10(i, j); placeBar10() } } } return }
    const dx = e.clientX - q.x, dy = e.clientY - q.y; q.x = e.clientX; q.y = e.clientY;
    if (IN10.ptr.size === 2) { const t = two(); if (IN10.pinch > 0 && t.d > 0) camT10.dist = clamp(camT10.dist * IN10.pinch / t.d, 14, 240); let da = t.a - IN10.ang; da -= 2 * PI * Math.round(da / (2 * PI)); camT10.yaw -= da; camT10.pitch = clamp(camT10.pitch + (t.y - IN10.my) * .004, .32, 1.45); IN10.pinch = t.d; IN10.ang = t.a; IN10.my = t.y; return }
    IN10.moved += Math.abs(dx) + Math.abs(dy);
    if (IN10.paint) { const h = groundAt10(e.clientX, e.clientY, _hit); if (h) { const i = xT10(h.x), j = zT10(h.z), k = inG10(i, j) ? tI10(i, j) : -1; if (k >= 0 && k !== IN10.last && IN10.moved > 6) { IN10.last = k; if (IN10.pOn == null) IN10.pOn = true; const w = tyPath10(i, j, true, TY.tool.style); if (w && w !== 'x') toast10('⚠ ' + w, 'nopath') } } return }
    if (IN10.btn === 2 || IN10.btn === 1 || e.ctrlKey || e.shiftKey) { camT10.yaw -= dx * .006; camT10.pitch = clamp(camT10.pitch + dy * .005, .32, 1.45); return }
    const c = TY.cam, sc = c.dist * .9 / innerHeight, fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw), fs = sc / Math.max(.35, Math.sin(c.pitch)); camFocus10(camT10.x - rx * dx * sc + fx * dy * fs, camT10.z - rz * dx * sc + fz * dy * fs);
  });
  const up = e => { if (!IN10.ptr.delete(e.pointerId)) return; try { el.releasePointerCapture(e.pointerId) } catch (_) {} if (IN10.ptr.size === 0) { const tap = IN10.moved < 9 && performance.now() - IN10.t0 < 450; if (tap && e.type === 'pointerup') tyTap10(e.clientX, e.clientY, e.pointerType !== 'mouse'); IN10.paint = false } else IN10.pinch = 0 };
  ['pointerup', 'pointercancel'].forEach(t => el.addEventListener(t, up));
  el.addEventListener('wheel', e => { e.preventDefault(); camT10.dist = clamp(camT10.dist * (1 + clamp(e.deltaY, -200, 200) * .0012), 14, 240) }, { passive: false });
  addEventListener('keydown', e => { if (!TY.on || isTyping72() || UI72.pk || !$('#dlg7').hidden) return; const k = e.key.toLowerCase(); IN10.keys[k] = 1; if (k === 'escape') { if (TY.pov) tyPov10(null); else if (TY.tool) toolSet10(null); else if (TY.sel) { TY.sel = null; tyUi10() } } else if (k === 'r' && TY.tool && TY.tool.k === 'place') tyAct10('rot'); else if (k === ' ') { e.preventDefault(); tyAct10('sp', TY.park.speed ? 0 : 1) } else if (k === 'enter' && TY.tool && TY.tool.k === 'place') tyAct10('build') });
  addEventListener('keyup', e => { delete IN10.keys[e.key.toLowerCase()] }); addEventListener('blur', () => { IN10.keys = {} });
}
function tyInputTick10(dt) {
  const K = IN10.keys, c = TY.cam; if (!UI72.pk && !isTyping72()) { const mv = c.dist * .9 * dt, fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw); let ax = 0, az = 0; if (K.w || K.arrowup) az += 1; if (K.s || K.arrowdown) az -= 1; if (K.d || K.arrowright) ax += 1; if (K.a || K.arrowleft) ax -= 1; if (ax || az) camFocus10(camT10.x + (rx * ax + fx * az) * mv, camT10.z + (rz * ax + fz * az) * mv); if (K.q) camT10.yaw += dt * 1.4; if (K.e) camT10.yaw -= dt * 1.4; if (K['+'] || K['=']) camT10.dist = clamp(camT10.dist * (1 - dt), 14, 240); if (K['-']) camT10.dist = clamp(camT10.dist * (1 + dt), 14, 240) }
  if (TY.pathDirty) { TY.pathDirty = false; tyPaths10(); linkAll10() }
}
