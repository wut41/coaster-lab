// ---- 10.1 MY PARK — hills and lakes. Every tile of the park has a height (whole metres, −3 … +10). Tiles below 0 are
// lake bed and fill with water. The ground is one mesh whose corners take the height of the tiles around them; paths,
// rides, shops and scenery sit on flat ground at their tile's height, coasters always start from ground level (their
// low track runs through hills in tunnels and over lakes on its supports). Visitors walk at the height of the ground.
// The heights are saved with the park as one short string (P_.hgt); a park without it is flat, exactly like 10.0.
const TER10 = { min: -3, max: 10, water: -.22, bridge: .12, cost: 15, nC: (GW10 + 1) * (GH10 + 1) };
TY.hgt = new Int8Array(GW10 * GH10);// height of every tile (m)
TY.pin = new Uint8Array(GW10 * GH10);// 0 free, 1 path, 2 something stands on it (its ground stays flat)
TY.cH = new Float32Array(TER10.nC);// height of every tile corner
TY.terra = { ver: 0, paintT: 0, paintDirty: false, any: false };
const cI10 = (ci, cj) => cj * (GW10 + 1) + ci;
// ---- the heights in the save: one letter per tile, 'a' = −3 … 'n' = +10 (absent = a flat park)
function terraEnc10() { let s = '', any = false; for (let k = 0; k < GW10 * GH10; k++) { const h = TY.hgt[k]; if (h) any = true; s += String.fromCharCode(97 + h - TER10.min) } return any ? s : null }
function terraSync10() { const P_ = TY.park; TY.hgt.fill(0); const s = P_ && P_.hgt; if (typeof s === 'string' && s.length === GW10 * GH10) for (let k = 0; k < s.length; k++) TY.hgt[k] = clamp(s.charCodeAt(k) - 97 + TER10.min, TER10.min, TER10.max); TY.terra.any = TY.hgt.some(h => h !== 0); TY.terra.lake = TY.hgt.some(h => h < 0) }
function terraStore10() { const P_ = TY.park; if (!P_) return; const s = terraEnc10(); if (s) P_.hgt = s; else delete P_.hgt; TY.terra.any = !!s; TY.terra.lake = TY.hgt.some(h => h < 0) }
{ const c0 = cleanPark10; cleanPark10 = function (o, mode) { const P_ = c0(o, mode); if (P_ && o && typeof o.hgt === 'string' && o.hgt.length === GW10 * GH10 && /^[a-n]+$/.test(o.hgt) && /[^d]/.test(o.hgt)) P_.hgt = o.hgt; return P_ } }
// ---- which tiles must stay flat: paths, everything built, and the station of each coaster (its low track may cross hills)
function stationTiles10(o) {
  const inf = objInfo10(o); if (!inf || inf.t !== 'coaster') return []; const p = inf.prof, zs = p.zs, out = new Map();
  const put = (x, z) => { const [X, Z] = rotL10(x, z, o.r), i = Math.floor(X / TS10) + o.x, j = Math.floor(Z / TS10) + o.z; out.set(i + ',' + j, [i, j]) };
  for (let a = 0; a < 2; a++) for (let b = -3; b < 0; b++) put(a * 4 + 2, (b * 4 + 2) * zs);
  for (let x = 1; x < p.SL + 1; x += 2) for (const z of [-2.5, -.5, .6]) put(x, z * zs);
  return [...out.values()];
}
function pins10() {
  const pin = TY.pin; pin.fill(0); for (let k = 0; k < GW10 * GH10; k++) if (TY.path[k] && TY.hgt[k] >= 0) pin[k] = 1;
  for (const o of TY.park.objs) { const inf = objInfo10(o); if (!inf) continue; const fp = inf.t === 'coaster' ? { solid: stationTiles10(o) } : footprint10(o); if (!fp) continue; for (const [i, j] of fp.solid) if (inG10(i, j)) pin[tI10(i, j)] = 2 }
}
// ---- corner heights: things that stand on the ground win over paths, paths win over open ground, so both stay flat
function corners10() {
  pins10(); const H = TY.hgt, pin = TY.pin;
  for (let cj = 0; cj <= GH10; cj++) for (let ci = 0; ci <= GW10; ci++) {
    let s2 = 0, n2 = 0, s1 = 0, n1 = 0, s0 = 0;
    for (let dj = -1; dj <= 0; dj++) for (let di = -1; di <= 0; di++) { const i = ci + di, j = cj + dj; if (!inG10(i, j)) continue; const k = tI10(i, j), h = H[k]; if (pin[k] === 2) { s2 += h; n2++ } else if (pin[k] === 1) { s1 += h; n1++ } s0 += h }
    TY.cH[cI10(ci, cj)] = n2 ? s2 / n2 : n1 ? s1 / n1 : s0 / 4;
  }
}
// the ground's height under any point (bilinear between the tile corners; 0 outside the park)
function terraH10(x, z) {
  const fx = x / TS10 + GW10 / 2, fz = z / TS10 + GH10 / 2; if (!(fx >= 0 && fz >= 0 && fx <= GW10 && fz <= GH10)) return 0;
  const i = Math.min(GW10 - 1, Math.floor(fx)), j = Math.min(GH10 - 1, Math.floor(fz)), u = fx - i, v = fz - j, C = TY.cH;
  const a = C[cI10(i, j)], b = C[cI10(i + 1, j)], c = C[cI10(i, j + 1)], d = C[cI10(i + 1, j + 1)];
  return u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);// the same two triangles the mesh draws
}
// where feet go: on the ground, or on the deck of a path bridge over a lake
function walkY10(x, z) { if (!TY.terra.any) return 0; const i = xT10(x), j = zT10(z); if (inG10(i, j)) { const k = tI10(i, j); if (TY.path[k] && TY.hgt[k] < 0) return TER10.bridge } return terraH10(x, z) }
const tileY10 = (i, j) => { if (!inG10(i, j)) return 0; const C = TY.cH; return (C[cI10(i, j)] + C[cI10(i + 1, j)] + C[cI10(i, j + 1)] + C[cI10(i + 1, j + 1)]) / 4 };
// the level a building's footprint is flattened to (and stands at)
function flatOf10(solid) { let s = 0, n = 0; for (const [i, j] of solid) if (inG10(i, j)) { s += TY.hgt[tI10(i, j)]; n++ } return n ? Math.max(0, Math.round(s / n)) : 0 }
function objBaseY10(o) { const inf = objInfo10(o); if (!inf || inf.t === 'coaster' || !TY.terra.any) return 0; const fp = footprint10(o); return fp ? flatOf10(fp.solid) : 0 }

// ---- the 3D ground: one mesh over the whole park, a lake surface under it, paths that follow it, the build grid on it
function terraInit10() {
  const R = TY.root; if (TY.terra.mesh || !R) return;
  // the flat 10.0 lawn is replaced; the countryside is pushed down inside the fence so lakes can be deeper than it
  R.children.forEach(m => { if (m.isMesh && m.material === TY.lawnM) m.visible = false });
  const out = R.children.find(m => m.isMesh && m.material === TY.outM); if (out) { const p = out.geometry.attributes.position; for (let i = 0; i < p.count; i++) if (Math.max(Math.abs(p.getX(i)), Math.abs(p.getZ(i))) < HALF10 - 1) p.setY(i, -6); p.needsUpdate = true; out.geometry.computeVertexNormals() }
  // the painted ground texture (16 px a tile)
  const cv = document.createElement('canvas'); cv.width = cv.height = GW10 * 16; TY.terra.cv = cv; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; TY.terra.tx = tx;
  TY.lawnM.map = tx; TY.lawnM.vertexColors = true; TY.lawnM.needsUpdate = true;
  const nV = TER10.nC, g = new THREE.BufferGeometry(), pos = new Float32Array(nV * 3), uv = new Float32Array(nV * 2), col = new Float32Array(nV * 3).fill(1), idx = [];
  for (let cj = 0; cj <= GH10; cj++) for (let ci = 0; ci <= GW10; ci++) { const v = cI10(ci, cj); pos[v * 3] = (ci - GW10 / 2) * TS10; pos[v * 3 + 2] = (cj - GH10 / 2) * TS10; uv[v * 2] = ci / GW10; uv[v * 2 + 1] = 1 - cj / GH10 }
  for (let cj = 0; cj < GH10; cj++) for (let ci = 0; ci < GW10; ci++) { const a = cI10(ci, cj), b = cI10(ci + 1, cj), c = cI10(ci, cj + 1), d = cI10(ci + 1, cj + 1); idx.push(a, c, b, b, c, d) }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, TY.lawnM); m.receiveShadow = true; m.castShadow = true; m.name = 'terrain10'; R.add(m); TY.terra.mesh = m;
  // the lake surface: one sheet just below ground level, hidden by the ground everywhere except over lake beds
  const wn = canvasTex(128, 128, (c, W, H_) => { const im = c.createImageData(W, H_); for (let y = 0; y < H_; y++) for (let x = 0; x < W; x++) { const a = x / W * 6.283, b = y / H_ * 6.283, dx = Math.cos(a * 3 + b) * .5 + Math.cos(a * 5 - b * 2) * .3 + Math.cos(a * 2 + b * 4) * .2, dy = Math.cos(b * 3 - a) * .5 + Math.cos(b * 5 + a * 2) * .3 + Math.cos(b * 2 - a * 3) * .2, o = (y * W + x) * 4; im.data[o] = 128 + dx * 60; im.data[o + 1] = 128 + dy * 60; im.data[o + 2] = 255; im.data[o + 3] = 255 } c.putImageData(im, 0, 0) });
  wn.wrapS = wn.wrapT = THREE.RepeatWrapping; wn.repeat.set(30, 30); wn.colorSpace = THREE.NoColorSpace; TY.terra.wn = wn;
  const wm = TY.terra.waterM = new THREE.MeshStandardMaterial({ color: 0x2a8fd6, roughness: .08, metalness: .25, transparent: true, opacity: .82, normalMap: wn, normalScale: new THREE.Vector2(.35, .35), envMapIntensity: 1.2, depthWrite: false });
  const w = new THREE.Mesh(new THREE.PlaneGeometry(HALF10 * 2, HALF10 * 2).rotateX(-PI / 2), wm); w.position.y = TER10.water; w.receiveShadow = true; w.renderOrder = 1; w.name = 'lake10'; R.add(w); TY.terra.water = w;
  // paths: one merged mesh with a colour per tile (the 10.0 instanced boxes cannot tilt)
  TY.terra.pathM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }); TY.pathMesh.visible = false;
  // tunnels: dark tubes where a coaster's track runs under a hill, with a stone portal at each end
  TY.terra.tunM = new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 1, side: THREE.BackSide }); TY.terra.portM = new THREE.MeshStandardMaterial({ color: 0x8c8278, roughness: .85 });
}
// ground mesh heights and colours (steep slopes show earth and rock)
const _gn = V();
function terraMesh10() {
  const m = TY.terra.mesh; if (!m) return; const g = m.geometry, p = g.attributes.position, c = g.attributes.color;
  for (let v = 0; v < TER10.nC; v++) p.setY(v, TY.cH[v]);
  p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox(); const n = g.attributes.normal;
  for (let v = 0; v < TER10.nC; v++) { const s = clamp((1 - n.getY(v)) * 3.2, 0, 1), y = p.getY(v), hi = clamp(y / 10, 0, 1) * .08; c.setXYZ(v, 1 - .22 * s + hi, 1 - .3 * s + hi * .7, 1 - .38 * s + hi * .3) }
  c.needsUpdate = true;
}
function terraPaths10() {
  const T_ = TY.terra; if (!T_.mesh) return; if (T_.pathMesh) { T_.pathMesh.geometry.dispose(); TY.root.remove(T_.pathMesh); T_.pathMesh = null }
  const pos = [], col = [], idx = [], C = TY.cH, e = .03, yk = (ci, cj) => C[cI10(ci, cj)] + .07;
  const quad = (a, b, c, d, cr) => { const n = pos.length / 3; pos.push(...a, ...b, ...c, ...d); for (let q = 0; q < 4; q++) col.push(cr.r, cr.g, cr.b); idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3) };
  const side = new THREE.Color();
  for (let k = 0; k < GW10 * GH10; k++) {
    const st = TY.path[k]; if (!st) continue; const i = k % GW10, j = (k - i) / GW10, x0 = (i - GW10 / 2) * TS10 + e, x1 = x0 + TS10 - 2 * e, z0 = (j - GH10 / 2) * TS10 + e, z1 = z0 + TS10 - 2 * e, br = TY.hgt[k] < 0;
    const y00 = br ? TER10.bridge : yk(i, j), y10 = br ? TER10.bridge : yk(i + 1, j), y01 = br ? TER10.bridge : yk(i, j + 1), y11 = br ? TER10.bridge : yk(i + 1, j + 1), cr = _tc.setHex(br ? 0x9a7248 : PATHS10[st - 1].c).clone();
    quad([x0, y00, z0], [x1, y10, z0], [x0, y01, z1], [x1, y11, z1], cr);
    // edges: a kerb down into the ground (a deck with posts over water)
    side.copy(cr).multiplyScalar(.72); const dn = br ? .55 : .3;
    quad([x0, y00, z0], [x0, y00 - dn, z0], [x1, y10, z0], [x1, y10 - dn, z0], side); quad([x1, y11, z1], [x1, y11 - dn, z1], [x0, y01, z1], [x0, y01 - dn, z1], side);
    quad([x0, y01, z1], [x0, y01 - dn, z1], [x0, y00, z0], [x0, y00 - dn, z0], side); quad([x1, y10, z0], [x1, y10 - dn, z0], [x1, y11, z1], [x1, y11 - dn, z1], side);
    if (br) for (const [px, pz] of [[x0 + .2, z0 + .2], [x1 - .2, z0 + .2], [x0 + .2, z1 - .2], [x1 - .2, z1 - .2]]) { const w = .09, y = TER10.bridge - .5, b = TER10.water - 1.6; quad([px - w, y, pz], [px - w, b, pz], [px + w, y, pz], [px + w, b, pz], side); quad([px, y, pz - w], [px, b, pz - w], [px, y, pz + w], [px, b, pz + w], side) }
  }
  if (!pos.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, T_.pathM); m.receiveShadow = true; m.frustumCulled = false; m.name = 'paths10'; TY.root.add(m); T_.pathMesh = m;
}
function terraGrid10() {
  const L_ = TY.gridL; if (!L_) return; const pts = [], C = TY.cH, y = (ci, cj) => C[cI10(ci, cj)] + .09;
  for (let cj = 0; cj <= GH10; cj++) for (let ci = 0; ci <= GW10; ci++) { const x = (ci - GW10 / 2) * TS10, z = (cj - GH10 / 2) * TS10; if (ci < GW10) pts.push(x, y(ci, cj), z, x + TS10, y(ci + 1, cj), z); if (cj < GH10) pts.push(x, y(ci, cj), z, x, y(ci, cj + 1), z + TS10) }
  L_.geometry.dispose(); L_.geometry = new THREE.BufferGeometry(); L_.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
}
// ---- painting the ground: soft grass with mowing stripes, worn edges along paths, sandy shores and lake beds
let _gBase10 = null;
function grassBase10(W) {
  if (_gBase10) return _gBase10; const n = W * W, a = new Float32Array(n), r = rng10(1234), oct = [[8, .5], [24, .3], [64, .2]];
  for (const [f, w] of oct) { const gs = f + 1, gr = new Float32Array(gs * gs); for (let k = 0; k < gr.length; k++) gr[k] = r(); for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const fx = x / W * f, fy = y / W * f, i = Math.floor(fx), j = Math.floor(fy), u = smooth10(fx - i), v = smooth10(fy - j), q = (i2, j2) => gr[(j2 % gs) * gs + (i2 % gs)]; a[y * W + x] += w * ((q(i, j) * (1 - u) + q(i + 1, j) * u) * (1 - v) + (q(i, j + 1) * (1 - u) + q(i + 1, j + 1) * u) * v) } }
  for (let k = 0; k < n; k++) a[k] += (r() - .5) * .16;// single blades
  return _gBase10 = a;
}
function terraPaint10() {
  const T_ = TY.terra; if (!T_.cv) return; T_.paintDirty = false; const W = T_.cv.width, S = W / GW10, ctx = T_.cv.getContext('2d'), im = T_.imd || (T_.imd = ctx.createImageData(W, W)), D = im.data, base = grassBase10(W), H = TY.hgt, own = TY.own, path = TY.path;
  // for every tile: how far each pixel is from a path edge or a lake edge (only the tiles next to them need it)
  for (let j = 0; j < GH10; j++) for (let i = 0; i < GW10; i++) {
    const k = tI10(i, j), h = H[k], ow = own[k], lake = h < 0, stripe = (j >> 1) % 2 ? 1.02 : .98;
    const nbP = [], nbL = []; if (!lake) for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (!inG10(a, b)) continue; const q = tI10(a, b); if (path[q] && !path[k]) nbP.push([di, dj]); if (H[q] < 0) nbL.push([di, dj]) }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = i * S + x, py = j * S + y, o = (py * W + px) * 4, n = base[py * W + px]; let r, g, b;
      if (lake) { const dp = clamp(-h / 3, 0, 1), s_ = n * .25; r = lerp10(196, 52, dp) + s_ * 40; g = lerp10(182, 96, dp) + s_ * 40; b = lerp10(138, 104, dp) + s_ * 30 }
      else {
        r = 70 + n * 34; g = 150 + n * 44; b = 72 + n * 22; if (ow) { r *= stripe; g *= stripe; b *= stripe } else { const l = (r + g + b) / 3; r = (r * .7 + l * .3) * .78; g = (g * .7 + l * .3) * .78; b = (b * .7 + l * .3) * .8 }
        if (h > 3) { const t = clamp((h - 3) / 7, 0, 1) * .25; r += t * 30; g += t * 14 }
        for (const [di, dj] of nbP) { const d = di > 0 ? S - 1 - x : di < 0 ? x : dj > 0 ? S - 1 - y : y; if (d < 3) { const t = (3 - d) / 3 * .5; r = lerp10(r, 150, t); g = lerp10(g, 138, t); b = lerp10(b, 92, t) } }
        for (const [di, dj] of nbL) { const d = di > 0 ? S - 1 - x : di < 0 ? x : dj > 0 ? S - 1 - y : y; if (d < 6) { const t = (6 - d) / 6; r = lerp10(r, 214, t); g = lerp10(g, 196, t); b = lerp10(b, 150, t) } }
      }
      D[o] = r; D[o + 1] = g; D[o + 2] = b; D[o + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0); T_.tx.needsUpdate = true;
}
// ---- tunnels: where a coaster's low track goes under the ground, a dark tube and a portal at each end
function tunnels10(o) {
  const R = o.rt; if (!R) return; if (R.tun) { R.tun.traverse(q => { if (q.geometry) q.geometry.dispose() }); if (R.tun.parent) R.tun.parent.remove(R.tun); R.tun = null } if (!TY.terra.any) return;
  const inf = objInfo10(o); if (!inf || inf.t !== 'coaster') return; const p = inf.prof, NN = N, under = new Uint8Array(NN), w = _tv, step = 2;
  for (let i = 0; i < NN; i += step) { objPt10(o, p.pts[i * 3], 0, p.pts[i * 3 + 2], w); if (p.pts[i * 3 + 1] + 2.9 < terraH10(w.x, w.z)) for (let q = 0; q < step && i + q < NN; q++) under[i + q] = 1 }
  let runs = [], s0 = -1; for (let i = 0; i <= NN; i++) { const u = i < NN && under[i]; if (u && s0 < 0) s0 = i; if (!u && s0 >= 0) { if (i - s0 >= 4) runs.push([s0, i - 1]); s0 = -1 } } if (!runs.length) return;
  const G_ = new THREE.Group(); G_.name = 'tunnels10';
  for (const [a, b] of runs) {
    const pts = []; for (let i = Math.max(0, a - 2); i <= Math.min(NN - 1, b + 2); i += 2) { objPt10(o, p.pts[i * 3], 0, p.pts[i * 3 + 2], w); pts.push(V(w.x, p.pts[i * 3 + 1] + .9, w.z)) } if (pts.length < 2) continue;
    G_.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, pts.length * 2), 1.75, 10, false), TY.terra.tunM));
    for (const [i0, i1] of [[a, a + 2], [b, b - 2]]) { const A_ = objPt10(o, p.pts[i0 * 3], 0, p.pts[i0 * 3 + 2], V()), B_ = objPt10(o, p.pts[i1 * 3], 0, p.pts[i1 * 3 + 2], V()), y = p.pts[i0 * 3 + 1] + .9, ring = new THREE.Mesh(new THREE.TorusGeometry(1.95, .4, 6, 14), TY.terra.portM); ring.position.set(A_.x, y, A_.z); ring.lookAt(B_.x, y + (p.pts[i1 * 3 + 1] - p.pts[i0 * 3 + 1]), B_.z); ring.castShadow = true; G_.add(ring) }
  }
  TY.root.add(G_); R.tun = G_;
}
// ---- everything that follows the ground, refreshed after a change
function terraRefresh10(full) {
  if (!TY.terra.mesh) return; corners10(); terraMesh10(); terraPaths10(); terraGrid10(); TY.terra.ver++;
  if (full) { for (const o of TY.park.objs) if (o.rt) tunnels10(o) } fenceLift10(); TY.terra.paintDirty = true;
}
// ---- the Terrain tool. Raise, lower, level (to the first tile you touch) or dig a lake, with a small, medium or big brush.
const TERRT10 = { raise: ['⬆️', 'Raise', 'Build hills'], lower: ['⬇️', 'Lower', 'Dig valleys (below 0 is water)'], level: ['🟰', 'Level', 'Flatten to the first tile you touch'], lake: ['🌊', 'Lake', 'Dig a lake'] };
function brush10(i, j, size) { const out = [], r = size - 1; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (r > 1 && Math.abs(di) + Math.abs(dj) > r + 1) continue; if (inG10(i + di, j + dj)) out.push([i + di, j + dj]) } return out }
function terraApply10(i, j, mode, size, stroke) {
  const P_ = TY.park; if (!canEdit10() || !inG10(i, j)) return 'x'; pins10(); const k0 = tI10(i, j);
  if (stroke && stroke.lv == null) stroke.lv = TY.hgt[k0];
  const plan = []; let steps = 0, why = '';
  for (const [a, b] of brush10(i, j, size || 1)) {
    const k = tI10(a, b), w = TY.own[k] ? (TY.pin[k] === 2 ? 'Something is built there' : TY.path[k] ? 'A path is in the way' : '') : 'That land is not yours yet'; if (w) { if (a === i && b === j) why = w; continue }
    const h = TY.hgt[k], to = clamp(mode === 'raise' ? h + 1 : mode === 'lower' ? h - 1 : mode === 'lake' ? Math.min(h, -2) : stroke && stroke.lv != null ? stroke.lv : h, TER10.min, TER10.max);
    if (to !== h) { plan.push([k, to]); steps += Math.abs(to - h) }
  }
  if (!plan.length) return why || '';
  const c = steps * TER10.cost; if (!canPay10(c)) return 'Not enough money: ' + money10(c) + ' needed';
  pay10('build', c); for (const [k, to] of plan) TY.hgt[k] = to; terraStore10(); terraRefresh10(true); beauty10();
  if (!P_.seen['t:' + mode]) { P_.seen['t:' + mode] = 1; xp10(4) } if (stroke) stroke.n = (stroke.n || 0) + 1; return '';
}

// ---- hooks into the 10.0 park (each wraps the old function and keeps its behaviour on flat ground)
{ const w0 = tyWorld10; tyWorld10 = function () { const was = TY.built; w0(); if (!was || !TY.terra.mesh) safe10('terrain init', terraInit10) } }
{ const g0 = gridSync10; gridSync10 = function () { g0(); terraSync10() } }
{ const r0 = tyRebuild10; tyRebuild10 = function () { r0(); safe10('terrain', () => { terraRefresh10(true); terraPaint10(); fenceLift10() }) } }
{ const l0 = tyLand10; tyLand10 = function () { l0(); safe10('terrain land', () => { if (TY.terra.mesh) { TY.terra.paintDirty = true; fenceLift10() } }) } }
tyPaths10 = function () { safe10('paths', () => { if (!TY.terra.mesh) return; corners10(); terraMesh10(); terraPaths10(); terraGrid10(); TY.terra.paintDirty = true }) };
// fences follow the ground
function fenceLift10() { if (!TY.terra.mesh) return; const m = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), s = V(); TY.fenceG.children.forEach(o => { if (!o.isInstancedMesh || o.userData.lift10 === TY.terra.ver) return; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); m.decompose(p, q, s); const base = o.userData.y10 ? o.userData.y10[i] : p.y; (o.userData.y10 || (o.userData.y10 = []))[i] = base; p.y = base + terraH10(p.x, p.z); o.setMatrixAt(i, m.compose(p, q, s)) } o.userData.lift10 = TY.terra.ver; o.instanceMatrix.needsUpdate = true }) }
// models stand at their ground level; points on them (queues, seats, exits) are lifted with them
{ const b0 = objBuild10; objBuild10 = function (o) { const g = b0(o); g.position.y = objBaseY10(o); return g } }
{ const a0 = objAdd3d10; objAdd3d10 = function (o) { a0(o); const inf = objInfo10(o); if (o.rt && inf) { o.rt.by = objBaseY10(o); if (TY.terra.mesh && inf.t === 'coaster') safe10('tunnels', () => tunnels10(o)) } } }
{ const r0 = objRemove3d10; objRemove3d10 = function (o) { if (o.rt && o.rt.tun) { o.rt.tun.traverse(q => { if (q.geometry) q.geometry.dispose() }); if (o.rt.tun.parent) o.rt.tun.parent.remove(o.rt.tun); o.rt.tun = null } r0(o) } }
{ const p0 = objPt10; objPt10 = function (o, lx, ly, lz, out) { const r = p0(o, lx, ly, lz, out); if (o.rt && o.rt.by) r.y += o.rt.by; return r } }
// building on a hill flattens the ground under it (earthworks are paid like the building); nothing goes into a lake
{ const f0 = fitWhy10; fitWhy10 = function (fp, o, loading) {
  const w = f0(fp, o, loading); if (w || loading || !TY.terra.any) return w; const inf = objInfo10(o);
  const tiles = inf && inf.t === 'coaster' ? stationTiles10(o) : fp.solid; for (const [i, j] of tiles) if (inG10(i, j) && TY.hgt[tI10(i, j)] < 0) return inf && inf.t === 'coaster' ? 'The station would stand in the lake' : 'That spot is in the lake: fill it in with ⛰ Terrain first';
  return '';
} }
function earthPlan10(o) { const inf = objInfo10(o); if (!inf || !TY.terra.any) return null; const isC = inf.t === 'coaster', fp = footprint10(o); if (!fp) return null; const tiles = isC ? stationTiles10(o) : fp.solid, to = isC ? 0 : flatOf10(fp.solid); let steps = 0; const plan = []; for (const [i, j] of tiles) { if (!inG10(i, j)) continue; const k = tI10(i, j), h = TY.hgt[k]; if (h !== to) { plan.push([k, to]); steps += Math.abs(h - to) } } return plan.length ? { plan, cost: steps * TER10.cost } : null }
{ const b0 = tyBuild10; tyBuild10 = function (key, i, j, r, free) {
  const ep = canEdit10() ? earthPlan10(newObj10(key, i, j, r)) : null, inf = objInfo10(newObj10(key, i, j, r));
  if (ep && inf && !free && TY.park.mode !== 'sandbox' && !canPay10(inf.cost + ep.cost)) { const fp = footprint10(newObj10(key, i, j, r)), w = fp ? fitWhy10(fp, newObj10(key, i, j, r)) : ''; if (!w) return { ok: false, why: 'Not enough money: ' + money10(inf.cost + ep.cost) + ' needed (' + money10(ep.cost) + ' of it to level the ground)' } }
  const res = b0(key, i, j, r, free); if (!res.ok || !ep) return res;
  if (!free) pay10('build', ep.cost); for (const [k, to] of ep.plan) TY.hgt[k] = to; terraStore10(); safe10('earthworks', () => { terraRefresh10(true); if (res.o.rt) res.o.rt.by = objBaseY10(res.o) }); return res;
} }
// lakes are pretty: visitors enjoy walking past water
{ const b0 = beauty10; beauty10 = function () { b0(); if (!TY.terra.any) return; for (let j = 0; j < GH10; j++) for (let i = 0; i < GW10; i++) { if (TY.hgt[tI10(i, j)] >= 0) continue; for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const a = i + di, b = j + dj; if (inG10(a, b)) TY.beauty[tI10(a, b)] += 1.2 / (1 + .6 * (Math.abs(di) + Math.abs(dj))) } } } }
// tapping and dragging aim at the ground itself, not at a flat floor
groundAt10 = function (cx, cy, out) {
  _nd.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); rc10.setFromCamera(_nd, camera); const o = rc10.ray.origin, d = rc10.ray.direction; if (d.y > -.02) return null;
  if (!TY.terra.any) { const t = -o.y / d.y; return out.set(o.x + d.x * t, 0, o.z + d.z * t) }
  let t = Math.max(0, (TER10.max + 1 - o.y) / d.y), t1 = (TER10.min - 1 - o.y) / d.y, prev = t; const st = Math.max(.6, (t1 - t) / 220);
  for (; t <= t1; t += st) { const x = o.x + d.x * t, z = o.z + d.z * t, y = o.y + d.y * t; if (y <= Math.max(terraH10(x, z), TER10.water)) { let a = prev, b = t; for (let q = 0; q < 12; q++) { const m = (a + b) / 2, xm = o.x + d.x * m, zm = o.z + d.z * m; if (o.y + d.y * m <= Math.max(terraH10(xm, zm), TER10.water)) b = m; else a = m } return out.set(o.x + d.x * b, o.y + d.y * b, o.z + d.z * b) } prev = t }
  const tt = -o.y / d.y; return out.set(o.x + d.x * tt, 0, o.z + d.z * tt);
};
// the placement preview sits on the ground; lake tiles show red for things that cannot stand in water
{ const s0 = ghostSet10; ghostSet10 = function (i, j) {
  s0(i, j); const M_ = TY.ghostM, T_ = TY.tool; if (!M_ || !T_ || T_.k !== 'place' || !TY.terra.any) return; const m = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), s = V(), isC = /^[cu]:/.test(T_.key);
  for (let n = 0; n < M_.count; n++) { M_.getMatrixAt(n, m); m.decompose(p, q, s); const a = xT10(p.x), b = zT10(p.z); p.y += Math.max(tileY10(a, b), inG10(a, b) && TY.hgt[tI10(a, b)] < 0 ? TER10.water : -9); M_.setMatrixAt(n, m.compose(p, q, s)); if (!isC && inG10(a, b) && TY.hgt[tI10(a, b)] < 0) M_.setColorAt(n, _tc.setHex(0xff4a4a)) }
  M_.instanceMatrix.needsUpdate = true; if (M_.instanceColor) M_.instanceColor.needsUpdate = true;
} }
// people, staff and litter are drawn at the height of the ground they stand on
peopleDraw10 = function (dt) {
  const M_ = TY.gm, rainy = !!WX10[TY.park.wx.k].rain, any = TY.terra.any; let n = 0, u = 0, c = 0;
  for (const g of TY.guests) {
    if (g.hide || n >= GCAP10) continue; if (any && g.st !== 'board') g.y = walkY10(g.x, g.z); else if (!any && g.st !== 'board') g.y = 0;
    const mv = g.st === 'walk' || g.st === 'out' || g.st === 'board', b = mv ? Math.abs(Math.sin(g.bob)) * .04 : 0;
    _gq.setFromAxisAngle(Yax, g.yaw); const ks = g.kid ? .68 : 1; _gs.setScalar(ks); _gv.set(g.x, g.y + b - (g.sit ? .22 * ks : 0), g.z); _gm.compose(_gv, _gq, _gs); M_.torso.setMatrixAt(n, _gm); M_.head.setMatrixAt(n, _gm);
    if (g.sit) { _gs.set(ks, .55 * ks, 1.5 * ks); _gv.y += .2 * ks; _gm.compose(_gv, _gq, _gs) } _gs.set(1, 1, 1); M_.legs.setMatrixAt(n, _gm);
    M_.torso.setColorAt(n, _gc.setHex(g.shirt)); M_.legs.setColorAt(n, _gc.setHex(g.pants)); M_.head.setColorAt(n, _gc.setHex(g.skin)); n++;
    if (rainy && g.umb && u < 200) { _gv.set(g.x, g.y, g.z); _gm.compose(_gv, _gq, _gs); M_.umb.setMatrixAt(u, _gm); M_.umb.setColorAt(u, _gc.setHex(g.shirt)); u++ }
  }
  for (const s_ of TY.staff) { if (n >= GCAP10) break; const C = STAFFC10[s_.k], b = s_.st === 'work' ? Math.abs(Math.sin(TY.t * 9)) * .05 : 0; _gq.setFromAxisAngle(Yax, s_.yaw); _gv.set(s_.x, b + walkY10(s_.x, s_.z), s_.z); _gm.compose(_gv, _gq, _gs); M_.torso.setMatrixAt(n, _gm); M_.head.setMatrixAt(n, _gm); M_.legs.setMatrixAt(n, _gm); M_.torso.setColorAt(n, _gc.setHex(C[0])); M_.legs.setColorAt(n, _gc.setHex(C[1])); M_.head.setColorAt(n, _gc.setHex(0xe0ac69)); n++; if (c < 60) { M_.cap.setMatrixAt(c, _gm); M_.cap.setColorAt(c, _gc.setHex(C[2])); c++ } }
  for (const [k, cnt] of [['torso', n], ['legs', n], ['head', n], ['umb', u], ['cap', c]]) { const o = M_[k]; o.count = cnt; o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true }
  const L_ = TY.litM; let l = 0; for (const q of TY.litter) { if (l >= 240) break; _gq.setFromAxisAngle(Yax, (q.x * 7 + q.z * 3) % 6.28); _gv.set(q.x, .13 + walkY10(q.x, q.z), q.z); _gs.set(q.v ? 1.8 : 1, 1, q.v ? 1.8 : 1); _gm.compose(_gv, _gq, _gs); L_.setMatrixAt(l, _gm); L_.setColorAt(l, _gc.setHex(q.v ? 0x9bbf3a : (l % 3 ? 0xf2f2f2 : 0xffd23f))); l++ } _gs.set(1, 1, 1); L_.count = l; L_.instanceMatrix.needsUpdate = true; if (L_.instanceColor) L_.instanceColor.needsUpdate = true;
};
// every frame: the lake ripples, wet paths follow the 10.0 wet-ground look, the selection frame sits on its building
{ const d0 = tyDraw10; tyDraw10 = function (dt) {
  d0(dt); const T_ = TY.terra; if (!T_.mesh) return;
  if (T_.wn) { T_.wn.offset.x = (T_.wn.offset.x + dt * .012) % 1; T_.wn.offset.y = (T_.wn.offset.y + dt * .007) % 1 } T_.water.visible = !!T_.lake;
  T_.pathM.roughness = TY.pathM.roughness; T_.pathM.color.copy(TY.pathM.color);
  const S = TY.sel, o = S && S.id && TY.objById.get(S.id); TY.selL.position.y = o && o.rt ? (o.rt.by || 0) : 0;
  for (const b of BUB10.pool) if (!b.g && b.sp.visible) b.sp.position.y += walkY10(b.x, b.z);
  T_.paintT -= dt; if (T_.paintDirty && T_.paintT <= 0) { T_.paintT = .25; terraPaint10() }
} }
// ---- the Terrain tool in the build bar
CATS10.terra = ['⛰', 'Terrain', 'Drag to sculpt: hills, valleys and lakes. Paths and buildings keep their ground flat.'];
{ const t0 = trayHTML10; trayHTML10 = function () {
  if (TY.ui.cat !== 'terra') return t0(); const C = CATS10.terra, T_ = TY.tool && TY.tool.k === 'terra' ? TY.tool : TY.ui.terra || { mode: 'raise', size: 2 }, sb = TY.park.mode === 'sandbox';
  const items = Object.keys(TERRT10).map(k => `<button class="tyIt${T_.mode === k ? ' on' : ''}" data-ty="terraMode" data-v="${k}"><i>${TERRT10[k][0]}</i><b>${TERRT10[k][1]}</b><small>${TERRT10[k][2]}</small><em>${sb ? 'Free' : money10(TER10.cost) + ' a step'}</em></button>`).join('')
    + [[1, 'Small', '1 tile'], [2, 'Medium', '3 × 3 tiles'], [3, 'Big', '5 × 5 tiles']].map(([s_, n, d]) => `<button class="tyIt${T_.size === s_ ? ' on' : ''}" data-ty="terraSize" data-v="${s_}"><i>${['·', '◽', '⬜'][s_ - 1]}</i><b>${n} brush</b><small>${d}</small><em>Brush</em></button>`).join('');
  return `<div class="tyTrH"><b>${C[0]} ${C[1]}</b><small>${C[2]}</small><button class="tyX" data-ty="cat" data-v="" aria-label="Close">✕</button></div><div class="tyItems">${items}</div>`;
} }
{ const a0 = tyAct10; tyAct10 = async function (a, v_) {
  const cur = TY.ui.terra || (TY.ui.terra = { mode: 'raise', size: 2 });
  if (a === 'cat' && v_ === 'terra') { TY.ui.cat = TY.ui.cat === 'terra' ? '' : 'terra'; toolSet10(TY.ui.cat ? { k: 'terra', mode: cur.mode, size: cur.size } : null); return }
  if (a === 'terraMode' && TERRT10[v_]) { cur.mode = v_; toolSet10({ k: 'terra', mode: cur.mode, size: cur.size }); return }
  if (a === 'terraSize') { cur.size = clamp(+v_ || 2, 1, 3); toolSet10({ k: 'terra', mode: cur.mode, size: cur.size }); return }
  return a0(a, v_);
} }
// a drag with the Terrain tool goes through the path painter of 10.0 (it already follows the finger tile by tile)
{ const p0 = tyPath10; tyPath10 = function (i, j, on, style) { const T_ = TY.tool; if (T_ && T_.k === 'terra' && IN10.paint) { const w = terraApply10(i, j, T_.mode, T_.size, TY.terraStroke || (TY.terraStroke = {})); return w === 'x' ? '' : w } return p0(i, j, on, style) } }
{ const t0 = tyTap10; tyTap10 = function (cx, cy, touch) { const T_ = TY.tool; if (T_ && T_.k === 'terra') { const h = groundAt10(cx, cy, _hit); if (!h) return; const w = terraApply10(xT10(h.x), zT10(h.z), T_.mode, T_.size, {}); if (w && w !== 'x') toast10('⚠ ' + w, 'noterra'); try { if (!w) sfx('click') } catch (e) {} return } return t0(cx, cy, touch) } }
function terraUiInit10() {
  const bar = document.getElementById('tyBar'), el = document.getElementById('tyIn'); if (!bar || bar.querySelector('[data-v="terra"]')) return;
  const b = document.createElement('button'); b.className = 'tyB'; b.dataset.ty = 'cat'; b.dataset.v = 'terra'; b.innerHTML = '<i>⛰</i><span>Terrain</span>'; bar.insertBefore(b, bar.querySelector('[data-v="land"]'));
  if (el) el.addEventListener('pointerdown', e => { if (TY.tool && TY.tool.k === 'terra' && e.button === 0 && IN10.ptr.size === 1) { IN10.paint = true; TY.terraStroke = {} } });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', terraUiInit10); else terraUiInit10();
// ---- test hooks
Object.assign(DBG10.ty || (DBG10.ty = {}), {
  terra: (i, j, mode, size) => terraApply10(i, j, mode, size || 1, {}), h: (i, j) => TY.hgt[tI10(i, j)], groundY: (x, z) => +terraH10(x, z).toFixed(3), walkY: (x, z) => +walkY10(x, z).toFixed(3),
  terraInfo: () => ({ any: TY.terra.any, saved: typeof TY.park.hgt === 'string', mesh: !!TY.terra.mesh, water: !!TY.terra.lake, paths: TY.terra.pathMesh ? TY.terra.pathMesh.geometry.attributes.position.count : 0, tunnels: TY.park.objs.reduce((a, o) => a + (o.rt && o.rt.tun ? o.rt.tun.children.length : 0), 0) }),
  lowTrack: id => { const o = TY.objById.get(id); if (!o) return []; const st = new Set(stationTiles10(o).map(([i, j]) => i + ',' + j)); return footprint10(o).solid.filter(([i, j]) => !st.has(i + ',' + j)) },
  objY: id => { const o = TY.objById.get(id); return o && o.rt && o.rt.g ? +o.rt.g.position.y.toFixed(2) : null }
});
