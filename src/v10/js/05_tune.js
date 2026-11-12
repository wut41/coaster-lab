// ---- 10.0 DESIGN TUNER: turns a rough list of track pieces into a coaster that passes the builder's full check.
// It is a seeded local search. Each step nudges one to three numbers of the design (always inside the same
// min / max / step limits the builder's own sliders use), runs the real inspection (generate → simulated lap →
// validate) and keeps the change when the coaster got better. "Better" means fewer must-fix problems first, then
// fewer warnings, then closer to the wishes in `goal`. Used by the 🎲 Surprise-me generator; the park's new coasters
// were tuned with it once and then stored as fixed designs.
const TUNE_W = { nan: 4000, outside: 30, under: 220, tall: 60, cross: 260, near: 60, kink: 900, stall: 900, nolap: 2500, noenergy: 3000, short: 900, long: 600, twist: 80, hot: 12, fast: 30, gpos: 70, gneg: 90, glat: 80 };
function tuneScore10(D_, goal) {
  const r = inspect(D_);
  let pen = 0, crit = 0, warn = 0; const hot = new Set();
  for (const i of r.issues) {
    if (i.sev !== 'crit' && i.sev !== 'warn') continue;
    if (goal && goal.noArea && i.code === 'outside') continue;// park rides have their own world: only builder coasters must fit the build area
    if (i.sev === 'crit') crit++; else warn++;
    (i.secs || []).forEach(k => hot.add(k));
    const w = TUNE_W[i.code] != null ? TUNE_W[i.code] : 100, val = isFinite(i.val) ? Math.abs(i.val) : 1;
    pen += (i.sev === 'crit' ? 1000 : 120) + w * Math.min(40, val);
  }
  let m = null;
  if (r.c && r.tr) {
    const st = statsOf(r.c, r.tr, 0), E = elementsOf(r.c, r.tr);
    m = { len: r.g.len, h: st.maxH, T: r.tr.T, vmax: r.tr.vmax, gMax: st.gMax, gMin: st.gMin, lat: st.lat, air: st.air, inv: E.inv, thrill: st.thrill, intensity: st.intensity, comfort: st.comfort };
    const g = goal || {}, over = (x, lim, w) => x > lim ? (x - lim) * w : 0, under = (x, lim, w) => x < lim ? (lim - x) * w : 0;
    pen += over(st.gMax, g.gMax != null ? g.gMax : 4.8, 60) + under(st.gMin, g.gMin != null ? g.gMin : -1.2, 80) + over(st.lat, g.lat != null ? g.lat : 1.5, 70);
    pen += over(r.g.len, g.lenMax != null ? g.lenMax : 900, .6) + under(r.g.len, g.lenMin || 0, .4);
    pen += over(r.tr.T, g.tMax != null ? g.tMax : 130, 1.2) + under(r.tr.T, g.tMin || 0, 1.2);
    if (g.h != null) pen += Math.abs(st.maxH - g.h) * (g.hW || 1.5);
    if (g.vmax != null) pen += Math.abs(r.tr.vmax - g.vmax) * (g.vW || 2);
    if (g.inv != null) pen += Math.abs(E.inv - g.inv) * 150;
    if (g.air != null) pen += under(st.air, g.air, 14);
    if (g.comfort != null) pen += under(st.comfort, g.comfort, 1.2);
    if (g.thrill != null) pen += under(st.thrill, g.thrill, 1.5);
    // keep the whole ride a little inside the park edge so the scenery has room
    if (!g.noArea) { let out = 0; for (const p of r.g.P) out = Math.max(out, Math.abs(p.x), Math.abs(p.z)); pen += over(out, g.edge != null ? g.edge : 90, 25) }
  }
  return { pen, crit, warn, hot, m };
}
// one mutation: returns a changed copy. `amt` is the step size as a share of each slider's range.
function tuneMutate10(D_, R, amt, hot, lock) {
  const C = clone(D_), els = C.els, n = 1 + Math.floor(R() * 2.6);
  for (let c = 0; c < n; c++) {
    let k;
    if (hot && hot.size && R() < .65) { const a = [...hot].filter(i => i < els.length); k = a.length ? a[Math.floor(R() * a.length)] : Math.floor(R() * els.length); if (R() < .5) k = Math.max(0, k - 1 - Math.floor(R() * 2)) }
    else k = Math.floor(R() * els.length);
    const e = els[k]; if (!e || !ET[e.t]) continue;
    const ps = ET[e.t].ps.filter(q => !q.ch && !q.bool && !(lock && lock(e, q.k, k) === true));
    if (!ps.length) continue;
    const q = ps[Math.floor(R() * ps.length)], span = q.mx - q.mn, g = (R() + R() + R() - 1.5) / 1.5, lim = lock ? lock(e, q.k, k) : null;
    let nv = clampP(q, (+e.p[q.k] || 0) + g * span * amt);
    if (Array.isArray(lim)) nv = clampP(q, clamp(nv, lim[0], lim[1]));// a wish like "keep this hill between 8 and 14 m"
    e.p[q.k] = nv;
  }
  return C;
}
// the search. opts: {iters, seed, goal, lock(e,paramKey,index)→true to keep a value fixed, budgetMs}
function tune10(D0, opts = {}) {
  const R = rng10(opts.seed != null ? opts.seed : 12345), goal = opts.goal || {}, t0 = performance.now(), budget = opts.budgetMs || 1e9;
  let best = clone(D0), bs = tuneScore10(best, goal), cur = best, cs = bs, tries = 0, since = 0;
  const iters = opts.iters || 600;
  for (let i = 0; i < iters; i++) {
    if (performance.now() - t0 > budget) break;
    if (bs.pen < .5 && !bs.crit && !bs.warn) break;
    tries++;
    const amt = (cs.crit ? .16 : .07) * (1 - .6 * i / iters) + .01;
    const C = tuneMutate10(cur, R, amt, cs.hot, opts.lock), s = tuneScore10(C, goal);
    if (s.pen <= cs.pen) { cur = C; cs = s; since = 0; if (s.pen < bs.pen) { best = C; bs = s } }
    else if (++since > 70) { cur = best; cs = bs; since = 0 }// stuck on a side branch: go back to the best so far
  }
  return { D: best, crit: bs.crit, warn: bs.warn, pen: bs.pen, m: bs.m, tries, ms: Math.round(performance.now() - t0) };
}
DBG10.tune = (els, opts = {}) => {
  const lockK = opts.lock || [], rangeK = opts.range || {};// lock: ['0.len','3.h','*.e','airtime.h'] kept as written · range: {'5.h':[8,14]}
  const lock = (e, key, k) => lockK.includes(k + '.' + key) || lockK.includes('*.' + key) || lockK.includes(e.t + '.' + key) ? true : (rangeK[k + '.' + key] || rangeK[e.t + '.' + key] || false);
  const r = tune10(mkD(opts.name || 'Tuned', els), { ...opts, lock });
  return { els: r.D.els.map(e => [e.t, e.p]), crit: r.crit, warn: r.warn, pen: +r.pen.toFixed(1), tries: r.tries, ms: r.ms, m: measure10(r.D, !!(opts.goal && opts.goal.noArea)) };
};
