// ---- 10.0 🎲 GENERATE (a tab in the Track Builder library). Makes brand-new coasters: a style grammar writes a random
// layout from real track pieces, then the design tuner (05_tune.js) adjusts its numbers inside the builder's own limits
// until the full ✓ Check shows no must-fix problems. It runs in small slices between frames so the screen never freezes.
// Results open in the builder's normal preview (your coaster as a dashed ghost → ✓ Place it / ✕ Cancel), so Undo works.
const GEN10 = { style: 'any', size: 'm', seed: 1 + Math.floor(Math.random() * 99999), run: null, res: [], last: null };
const GSTY10 = [['family', '🧸', 'Family'], ['looper', '➰', 'Looper'], ['launch', '🚀', 'Launch'], ['hyper', '⛰', 'Hyper'], ['twister', '🌀', 'Twister'], ['woodie', '🪵', 'Woodie'], ['any', '🎲', 'Surprise me']];
const GSIZE10 = [['s', 'Small', .72], ['m', 'Medium', 1], ['l', 'Big', 1.22]];
function genEls10(style, R, k) {
  const r = (a, b) => a + (b - a) * R(), ri = (a, b) => Math.round(r(a, b)), pick = a => a[Math.floor(R() * a.length)], dir = () => R() < .5 ? 'L' : 'R', H = h => Math.round(h * k * 2) / 2;
  const st = ['station', { len: ri(12, 16), brake: ri(14, 20), sx: ri(-70, -40), sz: ri(-70, 70), dir0: pick([0, 0, 15, 345, 30, 330]), ret: +r(.7, 1).toFixed(2) }], out = [st];
  const turn = (a0 = 90, a1 = 180, r0 = 12, r1 = 20) => ['turn', { dir: dir(), ang: Math.round(r(a0, a1) / 5) * 5, r: ri(r0 * Math.sqrt(k), r1 * Math.sqrt(k)) }];
  const lift = (h0, h1, a0 = 35, a1 = 50) => { const h = H(r(h0, h1)); out.push(['lift', { h, a: ri(a0, a1), chain: 1 }], ['drop', { h: h - 1, a: ri(55, 75) }]); return h };
  if (style === 'family') { const h = lift(8, 15, 22, 32); out[out.length - 1][1].a = ri(28, 40); for (let n = ri(3, 5); n--;) out.push(pick([turn(90, 180, 9, 14), ['hill', { h: H(r(1.5, 3.5)), len: ri(22, 30) }], ['helix', { dir: dir(), turns: pick([.75, 1]), r: ri(8, 12), climb: -H(r(0, 2)) }], ['airtime', { h: H(r(2, 3.5)), len: ri(26, 34) }]])) }
  else if (style === 'looper') { lift(24, 34); out.push(['loop', { r: +r(8, 10.5).toFixed(1), dir: dir() }], turn(150, 180)); for (let n = ri(2, 4); n--;) out.push(pick([['airtime', { h: H(r(4, 8)), len: ri(38, 50) }], ['corkscrew', { dir: dir(), len: ri(26, 32) }], turn(), ['hill', { h: H(r(3, 5)), len: ri(30, 40) }]])) }
  else if (style === 'launch') { const v = +r(22, 30).toFixed(1); out.push(['launch', { len: ri(32, 45), v }]); const h = H(Math.min(v * v / 25, r(20, 34))); out.push(['lift', { h, a: ri(60, 85), chain: 0, e: .9 }], ['drop', { h: h - 1, a: ri(70, 85), e: .9 }], turn(150, 180, 16, 24)); for (let n = ri(3, 4); n--;) out.push(pick([['airtime', { h: H(r(4, 8)), len: ri(40, 54) }], ['zerog', { dir: dir(), h: H(r(4, 7)), len: ri(36, 44) }], ['corkscrew', { dir: dir(), len: ri(26, 32) }], ['overbank', { dir: dir(), ang: ri(130, 180), r: ri(14, 20), h: H(r(5, 9)), bdeg: ri(98, 108) }], turn()])) }
  else if (style === 'hyper') { const h = H(r(34, 46)); out.push(['lift', { h, a: ri(52, 62), chain: 1 }], ['drop', { h: h - 1, a: ri(72, 82), e: .5 }], ['airtime', { h: H(r(9, 14)), len: ri(56, 74) }], turn(165, 180, 18, 24), ['airtime', { h: H(r(6, 9)), len: ri(48, 62) }], ['airtime', { h: H(r(4, 6)), len: ri(40, 52) }]); if (R() < .5) out.push(turn(90, 150, 16, 22), ['airtime', { h: H(r(2.5, 4)), len: ri(34, 44) }]) }
  else if (style === 'twister') { lift(34, 42, 40, 52); const flat = () => pick([['zerog', { dir: dir(), h: H(r(5, 8)), len: ri(36, 44) }], ['corkscrew', { dir: dir(), len: ri(26, 32) }], ['barrel', { dir: dir(), rr: +r(2.5, 3.5).toFixed(2), len: ri(38, 48) }]]);
    out.push(pick([['loop', { r: +r(9, 11).toFixed(1), dir: dir() }], ['immelmann', { dir: dir(), r: +r(9, 11).toFixed(1), out: ri(12, 16) }]]), turn(150, 180, 14, 20), flat()); for (let n = ri(1, 3); n--;) { out.push(pick([turn(120, 180), ['hill', { h: H(r(2, 4)), len: ri(28, 36) }]]), flat()) } }
  else { const h = lift(22, 32, 26, 34); for (let n = ri(4, 6), hh = h * .45; n--; hh *= .78) { out.push(['airtime', { h: Math.max(2, H(hh)), len: ri(30, 56) }]); if (R() < .35) out.push(turn(150, 180, 12, 18)) } out.push(turn(90, 180)) }
  return out;
}
const GGOAL10 = { family: { inv: 0, gMax: 3, lat: 1, comfort: 80, edge: 88 }, looper: { gMax: 4.6, edge: 88 }, launch: { gMax: 4.7, edge: 88 }, hyper: { inv: 0, gMax: 4.6, air: 2.5, edge: 88 }, twister: { gMax: 4.7, edge: 88 }, woodie: { inv: 0, gMax: 4.2, air: 3, edge: 88 } };
// before tuning: turn the station in 90° steps and slide it so the whole layout sits in the middle of the build area
function genFit10(D_) {
  let best = null; const sp = ET.station.ps, SX = sp.find(q => q.k === 'sx'), SZ = sp.find(q => q.k === 'sz');
  for (const rot of [0, 90, 180, 270]) { const C = clone(D_), st = C.els[0].p; st.dir0 = ((st.dir0 || 0) + rot) % 360; const g = generate(C); if (g.bad) continue; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of g.P) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    st.sx = clampP(SX, st.sx - (x0 + x1) / 2); st.sz = clampP(SZ, st.sz - (z0 + z1) / 2); const sc = Math.max(0, x1 - x0 - 176) + Math.max(0, z1 - z0 - 176); if (!best || sc < best.sc) best = { C, sc } }
  return best ? best.C : D_;
}
// the tuner, sliced: the same search as tune10, a few inspections per frame
async function tuneAsync10(D0, opts, onStep) {
  const R = rng10(opts.seed), goal = opts.goal || {}, t0 = performance.now(), iters = opts.iters || 260; let best = clone(D0), bs = tuneScore10(best, goal), cur = best, cs = bs, since = 0, sl = performance.now();
  for (let i = 0; i < iters; i++) {
    if (GEN10.run && GEN10.run.stop) break; if (performance.now() - t0 > (opts.budgetMs || 4000)) break; if (bs.pen < .5 && !bs.crit && !bs.warn) break;
    const amt = (cs.crit ? .16 : .07) * (1 - .6 * i / iters) + .01, C = tuneMutate10(cur, R, amt, cs.hot, opts.lock), s_ = tuneScore10(C, goal);
    if (s_.pen <= cs.pen) { cur = C; cs = s_; since = 0; if (s_.pen < bs.pen) { best = C; bs = s_ } } else if (++since > 60) { cur = best; cs = bs; since = 0 }
    if (performance.now() - sl > 45) { if (onStep) onStep(i / iters); await yield86(); sl = performance.now() }
  }
  return { D: best, crit: bs.crit, warn: bs.warn, pen: bs.pen, m: bs.m };
}
async function genGo10() {
  if (GEN10.run || !editing) return; const run = GEN10.run = { stop: false, n: 0, of: 3, f: 0 }, t0 = performance.now(), base = GEN10.seed, size = (GSIZE10.find(q => q[0] === GEN10.size) || GSIZE10[1])[2]; GEN10.res = []; b8LibR();
  for (let c = 0; c < 8 && GEN10.res.length < 3 && !run.stop; c++) {
    const seed = base * 7 + c * 101, R = rng10(seed), style = GEN10.style === 'any' ? GSTY10[Math.floor(R() * 6)][0] : GEN10.style, els = genEls10(style, R, size), D0 = genFit10(mkD('Generated', els));
    if (style === 'woodie') D0.style = { mat: 'wood', train: 'woodie', rail: '#9a8f86', tie: '#8a5a33', body: '#7a1f1f' };
    run.n = c; const r = await tuneAsync10(D0, { seed, goal: GGOAL10[style] || {}, lock: (e, key, k) => k === 0 && (key === 'len' || key === 'dir0') ? true : false, iters: 360, budgetMs: 4200 }, f => { run.f = f; genUI10() });
    if (!r.crit && r.m) { r.D.style = D0.style; GEN10.res.push({ D: r.D, m: r.m, style, warn: r.warn, seed }) } genUI10();
  }
  GEN10.last = { ms: Math.round(performance.now() - t0), stopped: run.stop, found: GEN10.res.length }; GEN10.run = null; GEN10.seed = 1 + Math.floor(Math.random() * 99999); b8LibR();
}
function genUI10() { const el = document.querySelector('#b8Lib .gen10p'); if (el && GEN10.run) el.textContent = '⏳ Coaster ' + (GEN10.run.n + 1) + ' · ' + Math.round(GEN10.run.f * 100) + '% · found ' + GEN10.res.length }
function genHTML10() {
  const R = GEN10.run, chip = (a, v_, on, l) => `<button class="${on ? 'on' : ''}" data-gen10="${a}" data-v="${v_}">${l}</button>`;
  return `<p class="n8">Pick a style and a size: it writes a brand-new coaster from real track pieces, then fixes it until the ✓ Check is happy. Preview one, then ✓ Place it (Undo works).</p>
<div class="b8seg gen10s">${GSTY10.map(q => chip('style', q[0], GEN10.style === q[0], q[1] + ' ' + q[2])).join('')}</div><div class="b8seg gen10s">${GSIZE10.map(q => chip('size', q[0], GEN10.size === q[0], q[1])).join('')}</div>
${R ? `<p class="n8 gen10p">⏳ Working…</p><button class="b8b" data-gen10="stop">■ Stop</button>` : `<button class="b8b pri" data-gen10="go">🎲 Generate 3 coasters</button>`}
${GEN10.res.map((e, i) => `<div class="gen10r"><b>${(GSTY10.find(q => q[0] === e.style) || GSTY10[6])[1]} ${(GSTY10.find(q => q[0] === e.style) || GSTY10[6])[2]} #${i + 1}</b><small>${fL(e.m.len)} · ${fL(e.m.h)} tall · ${fV(e.m.vmax)} · ${e.m.inv} inversion${e.m.inv === 1 ? '' : 's'} · ${e.m.gMax.toFixed(1)} G · ${e.m.air.toFixed(1)} s airtime${e.warn ? ' · ' + e.warn + ' warning' + (e.warn > 1 ? 's' : '') : ''}</small><button class="b8b" data-gen10="pv" data-v="${i}">👁 Preview</button></div>`).join('')}
${!R && GEN10.last && !GEN10.res.length ? `<p class="n8">${GEN10.last.stopped ? 'Stopped.' : 'Nothing passed the check this time. Try again (every try is different).'}</p>` : ''}`;
}
function genPreview10(i) { const e = GEN10.res[i]; if (!e || !editing) return; const keep = D.name; if (narrow80()) B8.sheet = ''; b8Begin('🎲 Generated ' + e.style + ' #' + (i + 1), () => { const n = clone(e.D); n.name = keep; if (e.D.style) n.style = clone(e.D.style); else if (D.style) n.style = clone(D.style); D = n }, null, 1, { kind: 'evo', nofocus: 1, note: '' }); fitAll(); b8Render() }
LIB80.push(['gen10', '🎲', 'Generate', null]); LIBK80.gen10 = LIB80[LIB80.length - 1]; LIBBEG90.push('gen10'); LIBX86.gen10 = () => genHTML10();
b8.addEventListener('click', e => { const t = e.target.closest('[data-gen10]'); if (!t || t.disabled) return; const a = t.dataset.gen10, v_ = t.dataset.v; if (a === 'style') { GEN10.style = v_; b8LibR() } else if (a === 'size') { GEN10.size = v_; b8LibR() } else if (a === 'go') genGo10(); else if (a === 'stop') { if (GEN10.run) GEN10.run.stop = true } else if (a === 'pv') genPreview10(+v_) });
{ const f0 = exitEditor; exitEditor = function () { if (GEN10.run) GEN10.run.stop = true; return f0.apply(this, arguments) } }
Object.assign(DBG10, { gen: () => ({ run: !!GEN10.run, res: GEN10.res.map(e => ({ style: e.style, m: e.m, warn: e.warn })), last: GEN10.last }), genSet: o => Object.assign(GEN10, o), genGo: async () => { await genGo10(); return GEN10.res.length }, genPv: i => genPreview10(i), genEls: (style, seed, k) => genEls10(style, rng10(seed), k || 1), genFit: els => genFit10(mkD('Generated', els)).els.map(e => [e.t, e.p]), genCheck: () => GEN10.res.map(e => { const r = inspect(clone(e.D)); return { crit: crits(r), san: sanDesign(clone(e.D)).ok } }) });
