// ---- 10.0 TRAIN TYPES: eight new kinds of train next to sit-down / inverted / flying / spinning.
// A type supplies make(k) (builds car k of 4), an optional place() (how the car sits on the track) and an optional
// eye() (where the 👁 Ride camera sits). All of them use the train's shared materials, so the Train Studio colours,
// paint and lights apply to every type, and each car is merged into one mesh per material (a handful of draw calls).
// Riders on the wide trains are light models (4 meshes each instead of 21) so a 24-seat train stays cheap on a phone.
const STY10 = {};
const liteMats10 = new Map();
function liteMat10(c, r = .7) { const k = c + '|' + r; let m = liteMats10.get(k); if (!m) { m = mat(c, r); keep.add(m); liteMats10.set(k, m) } return m }
let LITEGEO10 = null;
function liteGeo10() {
  if (LITEGEO10) return LITEGEO10;
  const T_ = (x, y, z, rx = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), V(sx, sy, sz)), cap = (r, l) => new THREE.CapsuleGeometry(r, l, 3, 6), z0 = -.12;
  const legs = [[new THREE.BoxGeometry(.21, .09, .2), T_(0, .53, z0 + .01)]], top = [[cap(.088, .16), T_(0, .71, z0 - .01, -.08, 1.12, 1, .82)]], skin = [[new THREE.CylinderGeometry(.034, .038, .07, 8), T_(0, .855, z0)], [new THREE.SphereGeometry(.093, 10, 8), T_(0, .95, z0, 0, 1, 1.07, 1)]];
  for (const lx of [-.055, .055]) { legs.push([cap(.046, .17), T_(lx, .53, z0 + .13, PI / 2)], [cap(.041, .17), T_(lx, .41, z0 + .27, -.12)], [new THREE.BoxGeometry(.075, .05, .12), T_(lx, .29, z0 + .31)]) }
  for (const ax of [-.13, .13]) { top.push([cap(.032, .13), T_(ax, .72, z0 + .07, 1.05)]); skin.push([cap(.028, .1), T_(ax, .62, z0 + .2, 1.5)]) }
  const hair = [[new THREE.SphereGeometry(.1, 10, 8, 0, PI * 2, 0, PI * .58), T_(0, .965, z0 - .012, -.45)]];
  const mg = a => mergeGeo(a.map(([g, m]) => [g, m, false]));
  return LITEGEO10 = { legs: mg(legs), top: mg(top), skin: mg(skin), hair: mg(hair) };
}
function liteRider10(g, n) {
  const G_ = liteGeo10(), h = (n * 2654435761) >>> 0, pick = (a, o) => a[(h >>> o) % a.length];
  const add = (geo, m, sh) => { const o = new THREE.Mesh(geo, m); o.castShadow = !!sh; g.add(o) };
  add(G_.legs, liteMat10(pick(PANTS, 11), .8), 1); add(G_.top, liteMat10(pick(TOPS, 7), .7), 1); add(G_.skin, liteMat10(pick(SKINS, 3), .62)); add(G_.hair, liteMat10(pick(HAIRS, 13), .55));
}
// the shared lite-rider geometry must survive ride changes (disposeRG frees GPU buffers; three.js re-uploads them when
// they are drawn again), and its materials are in `keep`, so nothing here leaks or goes missing
function carKit10() {
  const car = new THREE.Group(), parts = { paint: [], acc: [], dark: [], seat: [], chrome: [], hl: [] }, RD = [], AR = [], one = V(1, 1, 1), eu = new THREE.Euler(), qq = new THREE.Quaternion();
  const K = {
    car, RD, AR,
    put(key, g, x, y, z, rx = 0, ry = 0, rz = 0, shared = false, sc) { qq.setFromEuler(eu.set(rx, ry, rz)); parts[key].push([g, new THREE.Matrix4().compose(V(x, y, z), qq, sc || one), shared]) },
    B: (w, h, d) => new THREE.BoxGeometry(w, h, d),
    Cx: (r, l) => new THREE.CylinderGeometry(r, r, l, 14).rotateZ(PI / 2),
    // wheel bogies and chassis: the same running gear as the sit-down cars
    bogie() { const { put, B, Cx } = K; put('dark', B(.62, .09, .84), 0, -.24, 0); for (const z of [-.36, .36]) for (const x of [-.3, .3]) { const o = Math.sign(x); put('dark', B(.06, .42, .2), x + o * .14, -.32, z); put('dark', Cx(.078, .07), x, -.13, z); put('dark', Cx(.055, .06), x, -.47, z); put('dark', new THREE.CylinderGeometry(.055, .055, .06, 12), x - o * .17, -.3, z); put('chrome', Cx(.034, .075), x, -.13, z) } },
    // one seat. kind: 'otsr' over-the-shoulder restraint, 'lap' lap bar, 'clam' clamshell bar, 'none'
    seat(x, y, z, kind) {
      const { put, B } = K; put('seat', B(.4, .1, .42), x, y + .21, z - .1); put('seat', B(.4, .5, .08), x, y + .44, z - .34, -.12); put('seat', B(.3, .17, .09), x, y + .75, z - .39, -.12);
      if (kind === 'otsr') { for (const b of [-.14, .14]) put('chrome', B(.05, .38, .05), x + b, y + .68, z - .05, .55); put('chrome', B(.33, .05, .05), x, y + .52, z + .1) }
      else if (kind === 'lap') { put('chrome', B(.3, .045, .05), x, y + .6, z + .13); put('chrome', B(.045, .34, .045), x, y + .43, z + .19) }
      else if (kind === 'clam') { put('chrome', B(.05, .3, .05), x, y + .42, z + .2); put('acc', B(.3, .11, .14), x, y + .6, z + .12) }
    },
    // a rider in a seat. hero = the detailed rider whose arms go up; otherwise the light model. The seat group is what
    // Ride Ops shows and hides while loading, so its x position tells left seats from right seats.
    rider(x, y, z, n, hero, rx = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.x = rx; car.add(g); if (hero) makeRider(g, 0, n, [], AR); else liteRider10(g, n); RD.push(g) },
    done() { const mats = { paint: bodymat, acc: red, dark: wheelmat, seat: seatmat, chrome: restMat72, hl: trHL72 }; for (const key in parts) if (parts[key].length) { const me = new THREE.Mesh(mergeGeo(parts[key]), mats[key]); me.castShadow = key !== 'hl'; me.receiveShadow = true; car.add(me) } car.userData.riders = RD; car.userData.arms = AR; rg.add(car); return car }
  };
  return K;
}
// --- wide floorless cars: one row of seats on a beam, nothing under the riders' feet (6 across = dive, 4 across = floorless)
function makeWide10(k, nA) {
  const K = carKit10(), { put, B } = K, W = nA * .52 + .16; K.bogie();
  put('paint', B(W, .14, .56), 0, -.02, -.08); put('acc', B(W + .04, .04, .6), 0, .07, -.08); put('dark', B(.5, .2, .9), 0, -.12, 0);
  for (let i = 0; i < nA; i++) { const x = (i - (nA - 1) / 2) * .52; K.seat(x, 0, 0, 'otsr'); K.rider(x, 0, 0, k * nA + i + 1, false) }
  if (k === 0) { put('paint', B(W * .94, .16, .36), 0, -.07, .43, .5); put('acc', B(W * .5, .03, .3), 0, .02, .45, .5); for (const x of [-W * .3, W * .3]) put('hl', B(.16, .06, .03), x, -.12, .61) } else put('dark', B(.08, .06, .38), 0, -.24, .66);
  return K.done();
}
STY10.dive = { n: 'Dive (6 across)', ic: '🦅', seats: 6, make: k => makeWide10(k, 6), eye(rP_, rU_, rT_, side) { eye.copy(rP_).addScaledVector(rU_, 1.24).addScaledVector(rT_, -.06).addScaledVector(side, .26) } };
STY10.floorless = { n: 'Floorless', ic: '🦶', seats: 4, make: k => makeWide10(k, 4), eye(rP_, rU_, rT_, side) { eye.copy(rP_).addScaledVector(rU_, 1.24).addScaledVector(rT_, -.06).addScaledVector(side, .26) } };
// --- wing cars: riders sit on wings either side of the track with nothing above or below them
STY10.wing = {
  n: 'Wing', ic: '🪽', seats: 4,
  make(k) {
    const K = carKit10(), { put, B } = K; K.bogie();
    put('paint', B(.5, .34, 1), 0, -.02, 0); put('acc', B(.52, .05, 1.02), 0, .17, 0); put('dark', B(3.5, .1, .3), 0, .1, -.1);
    let n = k * 4;
    for (const sg of [-1, 1]) {
      for (const x0 of [1.05, 1.6]) { K.seat(sg * x0, -.23, 0, 'otsr'); K.rider(sg * x0, -.23, 0, ++n, false) }
      put('paint', B(1.02, .08, .5), sg * 1.33, -.06, -.1); put('acc', B(.07, .36, .62), sg * 1.93, .02, -.1); put('paint', B(.5, .05, .2), sg * 1.33, .55, -.42, -.12);
    }
    if (k === 0) { put('paint', B(.46, .26, .5), 0, 0, .68, .35); put('acc', B(.3, .04, .4), 0, .14, .7, .35); for (const x of [-.14, .14]) put('hl', B(.1, .06, .03), x, -.06, .94) } else put('dark', B(.08, .06, .38), 0, -.24, .66);
    return K.done();
  },
  // the camera rides in the outer seat of the left wing
  eye(rP_, rU_, rT_, side) { eye.copy(rP_).addScaledVector(rU_, 1.01).addScaledVector(rT_, -.06).addScaledVector(side, 1.6) }
};
// --- motorbikes: two bikes side by side per car, riders lean forward over the tank
STY10.bike = {
  n: 'Motorbike', ic: '🏍', seats: 2,
  make(k) {
    const K = carKit10(), { put, B, Cx } = K; K.bogie(); put('dark', B(.94, .05, .96), 0, -.17, 0);
    [-.3, .3].forEach((sx, j) => {
      put('paint', B(.26, .3, .8), sx, .02, .02); put('paint', B(.22, .26, .3), sx, .2, .38, -.5); put('chrome', B(.2, .16, .03), sx, .4, .46, -.6); put('seat', B(.2, .07, .36), sx, .2, -.22);
      put('acc', B(.24, .1, .3), sx, .12, -.42, .3); put('dark', Cx(.2, .1), sx, -.02, .42); put('dark', Cx(.2, .12), sx, -.02, -.38); put('chrome', B(.34, .03, .03), sx, .36, .3); put('hl', B(.1, .07, .03), sx, .12, .56);
      K.rider(sx, -.3, -.2, k * 2 + j + 1, false, .5);
    });
    if (k > 0) put('dark', B(.08, .06, .38), 0, -.24, .66);
    return K.done();
  },
  eye(rP_, rU_, rT_, side) { eye.copy(rP_).addScaledVector(rU_, 1.0).addScaledVector(rT_, .2).addScaledVector(side, .3) }
};
// --- wooden-coaster cars: boxy panelled tubs with a bench seat and one lap bar
STY10.woodie = {
  n: 'Wooden coaster', ic: '🪵', seats: 2, shake: 2.6,
  make(k) {
    const K = carKit10(), { put, B, Cx } = K; K.bogie();
    put('paint', B(.94, .06, 1.02), 0, -.14, 0); for (const sx of [-.47, .47]) { put('paint', B(.05, .42, 1.02), sx, .08, 0); put('acc', B(.07, .05, 1.04), sx, .31, 0) }
    put('paint', B(.94, .42, .05), 0, .08, -.5); put('paint', B(.94, .3, .05), 0, .02, .5);
    put('seat', B(.82, .1, .42), 0, .21, -.1); put('seat', B(.82, .5, .08), 0, .44, -.34, -.12); for (const sx of [-.24, .24]) put('seat', B(.3, .17, .09), sx, .75, -.39, -.12);
    put('chrome', Cx(.025, .86), 0, .6, .13); for (const sx of [-.4, .4]) put('chrome', B(.04, .34, .04), sx, .44, .19);
    if (k === 0) { put('paint', B(.82, .3, .3), 0, 0, .66); put('paint', B(.6, .24, .22), 0, -.02, .9); put('acc', B(.62, .05, .52), 0, .16, .76); for (const x of [-.22, .22]) put('hl', B(.14, .08, .03), x, -.02, 1.02) } else put('dark', B(.08, .06, .38), 0, -.24, .66);
    for (const sx of [-.24, .24]) K.rider(sx, 0, 0, k * 2 + (sx > 0 ? 1 : 0), true);
    return K.done();
  }
};
// --- hyper-coaster cars: open cars with raised seats and clamshell lap bars, nothing beside the riders
STY10.hyper = {
  n: 'Hyper (open seats)', ic: '🌄', seats: 2,
  make(k) {
    const K = carKit10(), { put, B } = K, C = carGeo(); K.bogie();
    put('paint', B(.9, .2, 1), 0, -.1, 0); put('acc', B(.96, .04, 1.04), 0, .02, 0);
    for (const sx of [-.24, .24]) { put('dark', B(.3, .2, .3), sx, .12, -.1); K.seat(sx, .12, 0, 'clam'); K.rider(sx, .12, 0, k * 2 + (sx > 0 ? 1 : 0), true) }
    if (k === 0) { put('paint', C.nose, 0, -.04, 0, 0, 0, 0, true); for (const x of [-.26, .26]) put('hl', B(.15, .06, .03), x, -.07, .93); for (const rz of [-.6, 0, .6]) put('acc', B(.04, .36, .3), Math.sin(rz) * .22, .2 + Math.cos(rz) * .08, .5, -.5, 0, -rz) } else put('dark', B(.08, .06, .38), 0, -.24, .66);
    return K.done();
  },
  eye(rP_, rU_, rT_) { eye.copy(rP_).addScaledVector(rU_, 1.36).addScaledVector(rT_, -.06) }
};
// --- bullet cars: the sit-down car with a long nose cone, lightning fins and glowing side strips
STY10.bullet = {
  n: 'Bullet', ic: '⚡', seats: 2,
  make(k) {
    const sv = trainStyle7; trainStyle7 = 'sit'; let car; try { car = makeCar10_0(k) } finally { trainStyle7 = sv }
    const K = carKit10(), { put, B } = K;
    for (const sx of [-.5, .5]) { put('hl', B(.02, .04, .9), sx, .06, 0); put('acc', B(.03, .26, .34), sx * 1.04, .1, -.3, .5, 0, sx > 0 ? -.5 : .5) }
    if (k === 0) { const cone = new THREE.ConeGeometry(.3, .9, 14).rotateX(PI / 2); put('paint', cone, 0, -.02, 1.2); put('acc', B(.06, .2, .5), 0, .22, .8, -.4); put('chrome', B(.5, .2, .03), 0, .3, .5, -.9) }
    if (k === 3) { put('acc', B(.05, .5, .5), 0, .5, -.5, -.5); put('hl', B(.6, .05, .03), 0, 0, -.52) }
    return finishExtra10(car, K);
  }
};
// helper for types that decorate a standard car: the kit's extra parts become meshes on that car
function finishExtra10(car, K) { const built = K.done(); rg.remove(built); while (built.children.length) car.add(built.children[0]); return car }
// --- swinging suspended cars: the inverted car hung from a pivot, free to swing sideways
const _swU10 = V(), _swS10 = V();
STY10.swing = {
  n: 'Swinging', ic: '🎐', seats: 2,
  make(k) { const sv = trainStyle7; trainStyle7 = 'inverted'; try { return makeCar10_0(k) } finally { trainStyle7 = sv } },
  // the car hangs along the force the riders feel, swings further out than the track is banked, and overshoots a little
  place(cc, k, dt, c, aC) {
    const ud = cc.userData, h = Math.min(dt || .016, .05); let lat = 0, vert = 1;
    if (c && playing) { const g = gAt(c, s - k * 1.15, v, aC); vert = g[0]; lat = g[1] }
    const bank = Math.asin(clamp(pS.y, -1, 1)), target = clamp(.5 * bank - Math.atan2(lat, Math.max(.35, vert)), -1.15, 1.15);
    ud.swv = (ud.swv || 0) + ((target - (ud.sw || 0)) * 10 - (ud.swv || 0) * 1.5) * h; ud.sw = clamp((ud.sw || 0) + ud.swv * h, -1.3, 1.3);
    _swU10.copy(pU).applyAxisAngle(pT, ud.sw); _swS10.copy(pS).applyAxisAngle(pT, ud.sw);
    cc.position.copy(pP).addScaledVector(_swU10, -1.62); cc.quaternion.setFromRotationMatrix(M.makeBasis(_swS10, _swU10, pT));
  },
  // the camera swings with its car: the "up" the camera uses is turned by that car's swing angle
  eye(rP_, rU_, rT_) { const cc = cars[SEATS[seat].car], a = cc ? cc.userData.sw || 0 : 0; rU_.applyAxisAngle(rT_, a); eye.copy(rP_).addScaledVector(rU_, -.66).addScaledVector(rT_, -.06) }
};
// ---- hooks: the three places where the engine asks "what kind of train is this?"
const makeCar10_0 = makeCar, placeCar10_0 = placeCar7, eye10_0 = eye7, _eyeS10 = V();
makeCar = function (k) { const S = STY10[trainStyle7]; if (!S) return makeCar10_0(k); try { return S.make(k) } catch (e) { console.warn('10.0 train type ' + trainStyle7, e); const sv = trainStyle7; trainStyle7 = 'sit'; try { return makeCar10_0(k) } finally { trainStyle7 = sv } } };
placeCar7 = function (cc, k, dt, c, aC) {
  const S = STY10[trainStyle7]; if (!S) return placeCar10_0(cc, k, dt, c, aC);
  if (S.place) return S.place(cc, k, dt, c, aC);
  cc.position.copy(pP).addScaledVector(pU, .3); cc.quaternion.setFromRotationMatrix(M.makeBasis(pS, pU, pT));
};
eye7 = function (rP_, rU_, rT_) {
  const S = STY10[trainStyle7]; if (!S) return eye10_0(rP_, rU_, rT_);
  if (S.eye) { _eyeS10.crossVectors(rU_, rT_); S.eye(rP_, rU_, rT_, _eyeS10) } else eye.copy(rP_).addScaledVector(rU_, 1.24).addScaledVector(rT_, -.06);
  if (S.shake) { const sh = Math.min(1, v / 20) * .012 * S.shake; eye.x += Math.sin(rideT * 61) * sh; eye.y += Math.sin(rideT * 83 + 2) * sh }// wooden track rattles
};
// the new types can be picked in the Train Studio and in the Track Builder's "Track look"
for (const k in STY10) { T72OPT.style.push([k, STY10[k].ic + ' ' + STY10[k].n]); TSTY7.push([k, STY10[k].ic + ' ' + STY10[k].n]) }
DBG10.styles = () => Object.keys(STY10);
