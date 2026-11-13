// ---- 10.0 graphics pack: glow (bloom), a real sun disc, shinier metal, speed effects on big drops.
// Everything here is drawn with code (no images, no extra downloads). It follows ⚙ Settings → Graphics quality:
//   Low     plain drawing, as before (only the camera shake, if Speed effects is on)
//   Medium  glow with 3 blur levels, light motion blur, a little extra shine on metal
//   High    glow with 5 levels, full motion blur, shinier metal
//   Ultra   glow with 6 levels, the most motion blur samples, the shiniest metal
// A frame-rate watch turns the extras down by itself when a device struggles (lighter first, then glow off).
// How it hooks in: renderer.render is wrapped (the original still draws the scene, into an off-screen picture that
// is tone-mapped exactly like the screen), then the glow and blur passes run and the result is drawn to the screen.
// If anything goes wrong the pack switches itself off and the game draws the plain way again.
// Settings live in coasterlab.v10.gfx. Test hooks: DBG10.gfx (test harness only).
const GFX10 = {
  set: Object.assign({ glow: true, speed: !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) }, LS10('gfx', {})),
  auto: 0,        // 0 full · 1 lighter (no motion blur, fewer glow levels) · 2 glow off; set by the frame-rate watch
  ok: null,       // null not checked yet · true this device can draw the extras · false plain drawing only
  busy: false, rt: null, down: [], up: [], w: 0, h: 0, lv: -1, samples: 0, mats: null, quad: null, qcam: null,
  shake: 0, blur: 0, hold: false, tPrev: 0, slowT: 0, warm: 3, frames: 0, shineT: 0, shineK: null, sun: null, last: null, forceSlow: 0
};
// per-quality amounts: glow levels, motion blur samples, metal shine multiplier, sun disc
const GFXQ10 = {
  low: { glow: 0, lv: 0, blurN: 0, shine: 1, sun: 0 },
  medium: { glow: 1, lv: 3, blurN: 4, shine: 1.2, sun: 1 },
  high: { glow: 1, lv: 5, blurN: 8, shine: 1.45, sun: 1 },
  ultra: { glow: 1, lv: 6, blurN: 10, shine: 1.6, sun: 1 }
};
function gfxProfile10() {
  const Q = GFXQ10[gq] || GFXQ10.medium, s = GFX10.set, a = GFX10.auto, can = GFX10.ok !== false;
  const glow = !!(s.glow && Q.glow && a < 2 && can);
  // motion blur rides on the glow picture, so it needs Glow on (switching the off-screen picture on mid-drop would stutter)
  return { glow, lv: a >= 1 ? Math.max(2, Q.lv - 2) : Q.lv, blurN: glow && s.speed && a < 1 ? Q.blurN : 0, shake: !!s.speed, shine: Q.shine, sun: !!(Q.sun && s.glow) };
}
function gfxCheck10() {
  if (GFX10.ok !== null) return GFX10.ok;
  const c = renderer.capabilities, ex = renderer.extensions;
  GFX10.ok = !!(c.isWebGL2 && (ex.has('EXT_color_buffer_float') || ex.has('EXT_color_buffer_half_float')));
  GFX10.samples = GFX10.ok ? Math.min(4, c.maxSamples || 0) : 0;
  return GFX10.ok;
}
function gfxFree10() {
  if (GFX10.rt) GFX10.rt.dispose(); GFX10.down.forEach(r => r.dispose()); GFX10.up.forEach(r => r.dispose());
  GFX10.rt = null; GFX10.down = []; GFX10.up = []; GFX10.w = GFX10.h = 0; GFX10.lv = -1;
}
function gfxTargets10(w, h, lv) {
  if (GFX10.rt && GFX10.w === w && GFX10.h === h && GFX10.lv === lv) return;
  gfxFree10();
  const T = THREE, o = { type: T.HalfFloatType, depthBuffer: false, stencilBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter, generateMipmaps: false };
  const rt = new T.WebGLRenderTarget(w, h, { type: T.HalfFloatType, samples: GFX10.samples, depthBuffer: true, stencilBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter, generateMipmaps: false });
  rt.texture.colorSpace = T.LinearSRGBColorSpace;
  // three.js 0.160 applies the renderer's tone mapping only to the screen and to targets flagged like this one, so the
  // off-screen picture comes out exactly as the screen would show it (same ACES curve, same exposure, same sky)
  rt.isXRRenderTarget = true;
  let dw = w, dh = h;
  for (let i = 0; i < lv; i++) { dw = Math.max(1, dw >> 1); dh = Math.max(1, dh >> 1); GFX10.down.push(new T.WebGLRenderTarget(dw, dh, o)); if (i < lv - 1) GFX10.up.push(new T.WebGLRenderTarget(dw, dh, o)) }
  Object.assign(GFX10, { rt, w, h, lv });
}
const GFX_VS10 = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
function gfxMats10(blurN) {
  if (GFX10.mats && GFX10.mats.blurN === blurN) return GFX10.mats;
  if (GFX10.mats) Object.values(GFX10.mats).forEach(m => m && m.dispose && m.dispose());
  const T = THREE, M = (defs, u, fs) => new T.ShaderMaterial({ defines: defs, uniforms: u, vertexShader: GFX_VS10, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false });
  // 4 bilinear taps at ±1 source texel = a 4×4 average; the first level also keeps only the bright parts (soft knee)
  const DOWN = `uniform sampler2D tSrc;uniform vec2 uTexel;uniform float uThr,uKnee;varying vec2 vUv;
vec3 s(vec2 o){return texture2D(tSrc,vUv+o*uTexel).rgb;}
void main(){vec3 c=(s(vec2(-1.,-1.))+s(vec2(1.,-1.))+s(vec2(-1.,1.))+s(vec2(1.,1.)))*.25;
#ifdef BRIGHT
float l=max(c.r,max(c.g,c.b));float k=clamp(l-uThr+uKnee,0.,2.*uKnee);k=k*k/(4.*uKnee+1e-4);c*=max(k,l-uThr)/max(l,1e-4);
#endif
gl_FragColor=vec4(c,1.);}`;
  // 3×3 tent blur of the smaller level, added onto the next bigger one
  const UP = `uniform sampler2D tLow,tHigh;uniform vec2 uTexel;varying vec2 vUv;
vec3 s(vec2 o){return texture2D(tLow,vUv+o*uTexel).rgb;}
void main(){vec3 c=s(vec2(0.))*4.+(s(vec2(-1.,0.))+s(vec2(1.,0.))+s(vec2(0.,-1.))+s(vec2(0.,1.)))*2.+s(vec2(-1.,-1.))+s(vec2(1.,-1.))+s(vec2(-1.,1.))+s(vec2(1.,1.));
gl_FragColor=vec4(texture2D(tHigh,vUv).rgb+c/16.,1.);}`;
  // final picture: zoom blur toward the middle (edges only), screen-blended glow, a gentle grade, then sRGB for the screen
  const OUT = `uniform sampler2D tScene,tBloom;uniform float uBloom,uBlur,uVig,uSat;uniform vec2 uCenter;varying vec2 vUv;
vec3 enc(vec3 c){c=clamp(c,0.,1.);return mix(pow(c,vec3(.41666))*1.055-vec3(.055),c*12.92,vec3(lessThanEqual(c,vec3(.0031308))));}
void main(){vec3 c=texture2D(tScene,vUv).rgb;
#if BLUR_N > 0
if(uBlur>.0005){vec2 d=vUv-uCenter;float m=smoothstep(.1,.7,length(d*vec2(1.,.85)));vec3 a=c;
for(int i=1;i<=BLUR_N;i++){a+=texture2D(tScene,vUv-d*(uBlur*m*float(i)/float(BLUR_N))).rgb;}c=a/float(BLUR_N+1);}
#endif
if(uBloom>0.){vec3 b=min(texture2D(tBloom,vUv).rgb*uBloom,vec3(1.));c=1.-(1.-c)*(1.-b);}
float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,uSat);
c*=1.-uVig*smoothstep(.55,1.25,length((vUv-.5)*vec2(1.7,1.35)));
gl_FragColor=vec4(enc(c),1.);}`;
  const tx = () => ({ value: null }), v2 = () => ({ value: new T.Vector2() });
  GFX10.mats = {
    blurN,
    bright: M({ BRIGHT: 1 }, { tSrc: tx(), uTexel: v2(), uThr: { value: .75 }, uKnee: { value: .2 } }, DOWN),
    down: M({}, { tSrc: tx(), uTexel: v2(), uThr: { value: 0 }, uKnee: { value: 0 } }, DOWN),
    up: M({}, { tLow: tx(), tHigh: tx(), uTexel: v2() }, UP),
    out: M({ BLUR_N: blurN }, { tScene: tx(), tBloom: tx(), uBloom: { value: 0 }, uBlur: { value: 0 }, uVig: { value: 0 }, uSat: { value: 1 }, uCenter: { value: new T.Vector2(.5, .5) } }, OUT)
  };
  if (!GFX10.quad) {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)); g.setAttribute('uv', new T.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
    GFX10.quad = new T.Mesh(g); GFX10.quad.frustumCulled = false; GFX10.qcam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  return GFX10.mats;
}
// glow amounts by time of day: night lights and sunsets glow more than a bright noon
function gfxLook10() {
  if (tod === 'night') return { thr: .42, str: 1.9, vig: .22, sat: 1.04 };
  if (tod === 'sunset') return { thr: .6, str: 1.5, vig: .18, sat: 1.07 };
  return { thr: .72, str: 1.15, vig: .14, sat: 1.06 };
}
// the sun as a bright disc where the sky already paints its glow (the same direction the shadows come from)
function gfxSun10() {
  if (GFX10.sun) return GFX10.sun;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), q = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(.16, 'rgba(255,255,255,1)'); q.addColorStop(.22, 'rgba(255,240,200,.55)'); q.addColorStop(.5, 'rgba(255,220,160,.12)'); q.addColorStop(1, 'rgba(255,200,140,0)');
  g.fillStyle = q; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  s.name = 'gfx10Sun'; s.frustumCulled = false; s.renderOrder = -5; s.raycast = () => {}; s.visible = false; scene.add(s);
  return GFX10.sun = s;
}
function gfxSunTick10(pf, cam) {
  const show = pf.sun && tod !== 'night' && !(W7 && W7.storm) && !(TY && TY.on) && sun.intensity > .4;
  if (!show) { if (GFX10.sun) GFX10.sun.visible = false; return }
  const s = gfxSun10(), d = Math.min(cam.far * .85, 330), k = sat10(sun.intensity / 2.6) * (1 - .85 * sat10((W72 && W72.cover) || 0));
  s.visible = k > .03; s.position.copy(cam.position).addScaledVector(SUN, d); s.scale.setScalar(d * .17);
  s.material.color.copy(sun.color).multiplyScalar(k);
}
// metal (rails, supports, lap bars, chrome trains) reflects more of the sky on higher quality settings
function gfxShine10(pf, now) {
  if (pf.shine === GFX10.shineK && now < GFX10.shineT) return;
  GFX10.shineT = now + 2000; GFX10.shineK = pf.shine; const k = pf.shine;
  scene.traverse(o => {
    const m = o.material; if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach(mm => {
      if (!mm || !mm.isMeshStandardMaterial || mm.metalness < .5) return;
      let u = mm.userData.gfx10;
      // someone else changed the material since we last touched it (a paint job, a clone): start from its new values
      if (!u || mm.roughness !== u.ar || mm.envMapIntensity !== u.ae) u = mm.userData.gfx10 = { r: mm.roughness, e: mm.envMapIntensity, k: 1, ar: mm.roughness, ae: mm.envMapIntensity };
      if (u.k === k) return;
      mm.envMapIntensity = u.e * k; mm.roughness = Math.max(.06, u.r * (k > 1 ? .8 : 1)); u.k = k; u.ar = mm.roughness; u.ae = mm.envMapIntensity;
    });
  });
}
// how hard the camera shakes and the edges blur: speed, steep drops and launches, mostly in the front-seat view
function gfxMotion10(pf, dt) {
  let ts = 0, tb = 0;
  if (pf.shake && playing && !editing && !startOpen && (camMode === 'ride' || camMode === 'chase' || camMode === 'front')) {
    const spd = sat10((v - 12) / 28), drop = sat10(-pT.y * 1.4) * sat10((v - 6) / 14), pov = camMode === 'ride' ? 1 : .5;
    ts = pov * Math.min(1, spd * .35 + drop * .85 + launchKick * .5);
    tb = pov * Math.min(.06, spd * .022 + drop * spd * .032 + launchKick * .02);
  }
  const k = Math.min(1, dt * 6); GFX10.shake += (ts - GFX10.shake) * k; GFX10.blur += (tb - GFX10.blur) * k;
}
const gfxE10 = new THREE.Euler(), gfxQ10 = new THREE.Quaternion(), gfxV10 = new THREE.Vector3(), gfxP10 = new THREE.Vector3(), gfxR10 = new THREE.Quaternion(), gfxS10 = new THREE.Vector2();
function gfxShakeOn10(cam) {
  const t = performance.now() / 1000, a = GFX10.shake;
  const n1 = Math.sin(t * 37.1) + .6 * Math.sin(t * 61.7 + 1.3), n2 = Math.sin(t * 43.3 + 2.1) + .6 * Math.sin(t * 71.9 + .4), n3 = Math.sin(t * 29.7 + 4.2);
  gfxP10.copy(cam.position); gfxR10.copy(cam.quaternion);
  cam.quaternion.multiply(gfxQ10.setFromEuler(gfxE10.set(n1 * a * .006, n2 * a * .006, n3 * a * .004)));
  cam.position.add(gfxV10.set(n2, n1, 0).multiplyScalar(a * .025).applyQuaternion(cam.quaternion)); cam.updateMatrixWorld();
}
function gfxShakeOff10(cam) { cam.position.copy(gfxP10); cam.quaternion.copy(gfxR10); cam.updateMatrixWorld() }
// frame-rate watch: below ~30 frames a second for 4 s with the extras on, step down once (and tell the player once)
function gfxWatch10(raw, post) {
  if (window.__coasterTestHarness === true && !GFX10.forceSlow) return;
  if (raw > .5 || document.hidden) return;
  if (GFX10.warm > 0) { GFX10.warm -= raw; return }
  const slow = GFX10.forceSlow ? 1 : raw > 1 / 30 ? 1 : 0;
  GFX10.slowT = post && slow ? GFX10.slowT + raw : Math.max(0, GFX10.slowT - raw * .5);
  if (GFX10.slowT > 4 && GFX10.auto < 2) {
    GFX10.auto++; GFX10.slowT = 0; GFX10.warm = 4;
    say(GFX10.auto === 1 ? '✨ Lighter glow and no motion blur, to keep things smooth' : '✨ Glow turned off to keep things smooth (Settings to turn it back on)');
  }
}
function gfxDraw10(orig, cam) {
  const now = performance.now(), raw = GFX10.tPrev ? (now - GFX10.tPrev) / 1000 : 0, dt = Math.min(.1, raw); GFX10.tPrev = now;
  const pf = gfxProfile10(); GFX10.frames++;
  gfxSunTick10(pf, cam); gfxShine10(pf, now); if (cam === camera && !GFX10.hold) gfxMotion10(pf, dt);
  const shake = cam === camera && GFX10.shake > .002;
  const post = pf.glow && gfxCheck10();
  gfxWatch10(raw, post);
  GFX10.last = { post, glow: pf.glow && post, lv: pf.lv, blurN: pf.blurN, blur: +GFX10.blur.toFixed(4), shake: +GFX10.shake.toFixed(3), sun: !!(GFX10.sun && GFX10.sun.visible), shine: pf.shine, auto: GFX10.auto };
  if (shake) gfxShakeOn10(cam);
  try {
    if (!post) { orig.call(renderer, scene, cam); return }
    renderer.getDrawingBufferSize(gfxS10); const W = gfxS10.x | 0, H = gfxS10.y | 0, lv = pf.glow ? Math.max(2, pf.lv) : 0;
    gfxTargets10(W, H, lv); const M = gfxMats10(pf.blurN), info = renderer.info, ar = info.autoReset, q = GFX10.quad, qc = GFX10.qcam;
    const pass = (mat, target) => { q.material = mat; renderer.setRenderTarget(target); orig.call(renderer, q, qc) };
    info.reset(); info.autoReset = false;
    try {
      renderer.setRenderTarget(GFX10.rt); orig.call(renderer, scene, cam);
      const L = gfxLook10();
      if (lv) {
        const D = GFX10.down, U = GFX10.up;
        M.bright.uniforms.tSrc.value = GFX10.rt.texture; M.bright.uniforms.uTexel.value.set(1 / W, 1 / H); M.bright.uniforms.uThr.value = L.thr; pass(M.bright, D[0]);
        for (let i = 1; i < lv; i++) { M.down.uniforms.tSrc.value = D[i - 1].texture; M.down.uniforms.uTexel.value.set(1 / D[i - 1].width, 1 / D[i - 1].height); pass(M.down, D[i]) }
        for (let i = lv - 2; i >= 0; i--) { const low = i === lv - 2 ? D[lv - 1] : U[i + 1]; M.up.uniforms.tLow.value = low.texture; M.up.uniforms.tHigh.value = D[i].texture; M.up.uniforms.uTexel.value.set(1 / low.width, 1 / low.height); pass(M.up, U[i]) }
      }
      const o = M.out.uniforms; o.tScene.value = GFX10.rt.texture; o.tBloom.value = lv ? GFX10.up[0].texture : GFX10.rt.texture;
      o.uBloom.value = lv ? L.str / lv : 0; o.uBlur.value = pf.blurN ? GFX10.blur : 0; o.uVig.value = pf.glow ? L.vig : 0; o.uSat.value = pf.glow ? L.sat : 1;
      pass(M.out, null);
      // a shader this device cannot compile only logs and draws black: check each one once, and fall back if needed
      if (!M.checked) { M.checked = true; [M.bright, M.down, M.up, M.out].forEach(m => { const p = renderer.properties.get(m).currentProgram; if (p && p.diagnostics && p.diagnostics.runnable === false) throw new Error('graphics extras: a shader did not compile') }) }
    } finally { info.autoReset = ar; renderer.setRenderTarget(null) }
  } finally { if (shake) gfxShakeOff10(cam) }
}
{
  const orig = renderer.render;
  renderer.render = function (sc, cam) {
    if (sc !== scene || GFX10.busy || this.getRenderTarget() !== null || GFX10.ok === false && !GFX10.set.speed) return orig.call(this, sc, cam);
    GFX10.busy = true;
    try { gfxDraw10(orig, cam) }
    catch (e) {
      // never let the extras stop the game: switch them off for this visit and draw the plain way
      console.warn('10.0 gfx', e); GFX10.ok = false; GFX10.shake = 0; try { gfxFree10(); renderer.setRenderTarget(null) } catch (e2) {}
      orig.call(this, sc, cam);
    } finally { GFX10.busy = false }
  };
  renderer.domElement.addEventListener('webglcontextrestored', () => { gfxFree10(); GFX10.mats = null; GFX10.quad = null });
}
// ⚙ Settings: two switches under the graphics settings
function gfxSettingsHTML10() {
  const pf = gfxProfile10(), s = GFX10.set;
  const note = GFX10.ok === false ? 'This device cannot draw the glow, so only the camera shake is used.'
    : gq === 'low' ? 'Glow and motion blur are off on Low. Pick Medium or higher to see them.'
    : GFX10.auto >= 2 ? 'Glow was turned off to keep this device smooth. Turn it on again to retry.'
    : GFX10.auto === 1 ? 'Turned down a little to keep this device smooth.'
    : `${GFXQ10[gq] ? QUAL[gq].n : ''}: ${pf.glow ? pf.lv + ' glow levels' : 'no glow'}${pf.blurN ? ', motion blur' : ''}${pf.shine > 1 ? ', extra shine on metal' : ''}.`;
  return `<div id="gfx10"><h4 class="h7">✨ Graphics extras</h4>
<label class="tg7"><input type="checkbox" data-gfx10="glow" ${s.glow ? 'checked' : ''}> Glow and sun (lights, sunsets and the sun glow)</label>
<label class="tg7"><input type="checkbox" data-gfx10="speed" ${s.speed ? 'checked' : ''}> Speed effects (shake and motion blur on big drops)</label>
<p class="n7">${html10(note)}</p></div>`;
}
{
  const f0 = renderOv7;
  renderOv7 = function () {
    f0.apply(this, arguments);
    safe10('gfx settings', () => {
      const o = $('#ov7'); if (!o || o.dataset.k !== 'set' || $('#gfx10')) return;
      const pr = $('#ov7B [data-o7="pr"]'), at = pr && pr.closest('label');
      if (at) at.insertAdjacentHTML('afterend', gfxSettingsHTML10());
    });
  };
  document.addEventListener('change', e => {
    const t = e.target, k = t && t.dataset && t.dataset.gfx10; if (!k) return;
    GFX10.set[k] = !!t.checked; if (k === 'glow' && t.checked) { GFX10.auto = 0; GFX10.warm = 4 } if (k === 'speed' && !t.checked) { GFX10.shake = GFX10.blur = 0 }
    SS10('gfx', GFX10.set); GFX10.shineK = null;
    say(k === 'glow' ? (t.checked ? '✨ Glow on' : 'Glow off') : (t.checked ? '💨 Speed effects on' : 'Speed effects off'));
    safe10('gfx settings', () => { if (!$('#ov7').hidden) renderOv7() });
  });
}
DBG10.gfx = {
  state: () => Object.assign({ ok: GFX10.ok, set: Object.assign({}, GFX10.set), q: gq, frames: GFX10.frames, w: GFX10.w, h: GFX10.h, samples: GFX10.samples }, GFX10.last || {}),
  set: o => { Object.assign(GFX10.set, o || {}); GFX10.shineK = null; if (o && o.glow) GFX10.auto = 0; return DBG10.gfx.state() },
  auto: n => { GFX10.auto = n | 0; return GFX10.auto },
  slow: on => { GFX10.forceSlow = on ? 1 : 0; GFX10.warm = 0; GFX10.slowT = 0 },
  // pretend to be on a fast drop so the speed effects show (for screenshots)
  motion: (sh, bl) => { GFX10.hold = sh != null; GFX10.shake = sh || 0; GFX10.blur = bl || 0; return [GFX10.shake, GFX10.blur] },
  metal: () => { let n = 0, b = 0; scene.traverse(o => { const m = o.material; (Array.isArray(m) ? m : [m]).forEach(mm => { if (mm && mm.isMeshStandardMaterial && mm.metalness >= .5) { n++; if (mm.userData.gfx10 && mm.userData.gfx10.k > 1) b++ } }) }); return { metal: n, boosted: b } }
};
