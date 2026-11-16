// ---- 10.1 TRACK BUILDER 6 — see what every change does, and get to things faster.
//  · Live numbers: top speed, height, strongest G, airtime, length, ride time and inversions stay on screen while you
//    build (in the top bar; above the timeline on a phone). After each change the numbers that moved show by how
//    much, and while you are previewing or dragging you see what the change WOULD do before you place it.
//  · One status chip: ✓ ready to ride, ⚠ things to check or 🚫 must-fix problems. Tap it to go straight to them.
//  · Good next pieces: the piece library suggests what fits here, from the train's real speed and height at the end
//    of your track (or after the piece you selected), with the reason in plain words.
//  · History: every step by name, newest first. Tap one to go back (or forward) to it in a single move.
//    Undo and Redo say what they will undo or redo.
//  · ▶ Test from here: playtest starting just before the selected piece instead of riding the whole lap again.
//  · Twelve more ready-made layouts: the tuned 10.0 park coasters, as blueprints you can start from or insert.
//  · Sketch Studio: next to "what I see", the ready-made layouts whose shape is closest to your drawing.
//  · Fixes: rows that scroll sideways (timeline, tools, piece actions) fade at the edge that has more, keep their
//    place when the screen redraws, and the Delete button is no longer hidden under ✕. The welcome card steps aside
//    as soon as you start building.
// Everything here reads the builder's own check and lap simulation (BR_): nothing is estimated a second way.
// ---------------------------------------------------------------------------------------------------------------------
const BP10 = { src: null, cur: null, done: null, ref: null, sig: '', until: 0, hist: false, tIdx: null, tLvl: -1, sug: null, sugSrc: null, sugAt: -1 };
// ---- the numbers of the track as it is now (null while it cannot be simulated)
function bpStats10() { const r = BR_; if (!r || !r.g || r.g.bad || !r.c || !r.tr) return null; try { const st = statsOf(r.c, r.tr, 0), E = elementsOf(r.c, r.tr); return { v: r.tr.vmax, h: st.maxH, g: st.gMax, gn: st.gMin, lat: st.lat, air: st.air, len: r.g.len, T: r.tr.T, inv: E.inv } } catch (e) { return null } }
// called on every redraw; does work only when the track was rebuilt. "done" is the last finished step, "ref" the one before
function bpTrack10() {
  const sig = bHi + ':' + bHist.length + ':' + (bHist[bHi] ? bHist[bHi].t : 0);
  if (BP10.src !== BR_) { BP10.src = BR_; BP10.cur = bpStats10() }// the track was rebuilt
  if (sig !== BP10.sig) { BP10.sig = sig; if (BP10.done && BP10.cur && BP10.done !== BP10.cur) { BP10.ref = BP10.done; BP10.until = performance.now() + 9000 } BP10.done = BP10.cur }// a step was finished (or undone)
}
// [key, icon, name, value → text, change → text, smallest change worth showing]
const BP_CH10 = [
  ['v', '⚡', 'Top speed', x => fV(x), d => fV(Math.abs(d), 0), .3], ['h', '⛰', 'Highest point', x => fL(x), d => fL(Math.abs(d), 0), .4],
  ['g', '💥', 'Strongest G-force', x => x.toFixed(1) + ' G', d => Math.abs(d).toFixed(1), .1], ['air', '🪂', 'Airtime', x => x.toFixed(1) + ' s', d => Math.abs(d).toFixed(1), .1],
  ['len', '📏', 'Track length', x => fL(x), d => fL(Math.abs(d), 0), 2], ['T', '⏱', 'Ride time', x => fmtT(x), d => Math.round(Math.abs(d)) + ' s', 1], ['inv', '🌀', 'Times upside down', x => String(x), d => String(Math.abs(d)), 1]];
const bpForce10 = c => c.g >= FORCE10.red[0] || c.gn <= FORCE10.red[1] || c.lat >= FORCE10.red[2] ? 'bad' : c.g >= FORCE10.yel[0] || c.gn <= FORCE10.yel[1] || c.lat >= FORCE10.yel[2] ? 'warn' : '';
function bpStatus10() {
  if (!BR_ || !BR_.g || BR_.g.bad) return ['bad', '🚧', 'Track not finished', 'The track cannot be built yet. Open ✓ Check to see why.'];
  const c = b8Counts80(); if (c.crit) return ['bad', '🚫', c.crit + ' must-fix', 'Problems that would stop the ride. Tap to see them.'];
  if (c.warn) return ['warn', '⚠', c.warn + ' to check', 'The ride works; these are worth a look. Tap to see them.']; return ['good', '✓', 'Ready to ride', 'The safety check found nothing that must be fixed.'];
}
function bpStripHTML10(small) {
  bpTrack10(); const c = BP10.cur, st = bpStatus10(), live = !!c && !!BP10.done && c !== BP10.done, base = live ? BP10.done : performance.now() < BP10.until ? BP10.ref : null, list = small ? BP_CH10.filter(q => q[0] !== 'len' && q[0] !== 'inv') : BP_CH10;
  let h = `<button class="bsS10 ${st[0]}" data-b8="check10" title="${esc(st[3])}"><i>${st[1]}</i><span>${esc(st[2])}</span></button>`;
  if (c) h += list.map(([k, ic, n, f, fd, eps]) => { const d = base ? c[k] - base[k] : 0, show = base && Math.abs(d) >= eps, cls = k === 'g' ? bpForce10(c) : '';
    const tip = n + ': ' + f(c[k]) + (k === 'g' ? ' (lightest ' + c.gn.toFixed(1) + ' G, sideways ' + c.lat.toFixed(1) + ' G)' : '') + (show ? ' · ' + (d > 0 ? 'up ' : 'down ') + fd(d) + (live ? ' if you place this' : ' since the last step') : '');
    return `<button class="bs10 ${cls}" data-b8="stat10" data-v="${k}" title="${esc(tip)}" aria-label="${esc(tip)}"><i>${ic}</i><b>${esc(f(c[k]))}</b>${show ? `<em class="${d > 0 ? 'up' : 'dn'}${live ? ' lv' : ''}">${d > 0 ? '▲' : '▼'}${esc(fd(d))}</em>` : ''}</button>` }).join('');
  else h += `<span class="bsN10">Numbers appear when the track is complete</span>`;
  return h;
}
// the strip lives in the top bar; on a phone held upright, above the timeline
function bpStripPlace10() {
  const top = $('#b8Top'), dock = $('#b8Dock'), nar = narrow80() && innerWidth <= 560, build = B8.mode === 'build' && editing; let el = $('#bst10');
  if (!build) { if (el) el.remove(); return } const host = nar ? dock : top; if (!host) return;
  if (!el || el.parentNode !== host) { if (el) el.remove(); el = document.createElement('div'); el.id = 'bst10'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Your coaster in numbers') }
  el.className = 'bst10' + (nar ? ' dk' : '');
  if (nar) { if (dock.firstChild !== el) dock.insertBefore(el, dock.firstChild) } else { const sp = top.querySelector('.b8sp'); if (sp) { if (sp.nextSibling !== el) top.insertBefore(el, sp.nextSibling) } else if (el.parentNode !== top) top.appendChild(el) }
  const sl = el.scrollLeft; el.innerHTML = bpStripHTML10(nar || innerWidth < 1040); el.scrollLeft = sl; bpFade10(el);
}
// while a change is fresh the strip shows by how much; clear it when the time is up
TICKS72.push(() => { if (BP10.until && performance.now() > BP10.until) { BP10.until = 0; if (B8.on && editing && B8.mode === 'build') bpStripPlace10() } });
// ---- rows that scroll sideways: fade at the edge that has more, and keep their place across redraws
function bpFade10(el) { if (!el) return; const up = () => { const m = el.scrollWidth - el.clientWidth; el.classList.toggle('ovL10', el.scrollLeft > 6); el.classList.toggle('ovR10', m - el.scrollLeft > 6) }; el.onscroll = up; up() }
const bpRows10 = () => ['.tl8', '.tools8', '.sel8 .acR8'].map(q => $('#b8Dock ' + q));
{ const f0 = b8DockR; b8DockR = function () {
  const before = bpRows10().map(e => e ? e.scrollLeft : 0), sel0 = B8.scrollTl; f0.apply(this, arguments);
  safe10('builder rows', () => { const rows = bpRows10(), jumped = B8.scrollTl !== sel0; rows.forEach((e, k) => { if (!e) return; if (!(k === 0 && jumped) && before[k]) e.scrollLeft = before[k]; bpFade10(e) }); bpStripPlace10() });
} }
// ---- the top bar: Undo and Redo say what they do, and a History list
const bpAgo10 = t => { const s = Math.max(0, (Date.now() - t) / 1000); return s < 50 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : Math.round(s / 3600) + ' h ago' };
function bpHistHTML10() {
  const n = bHist.length, from = Math.max(0, n - 16); let h = '';
  for (let i = n - 1; i >= from; i--) { const e = bHist[i]; h += `<button role="menuitem" class="${i === bHi ? 'on' : i > bHi ? 'fut' : ''}" data-b8="histGo10" data-v="${i}"${i === bHi ? ' aria-current="step"' : ''}><b>${esc(e.label || 'Change')}</b><small>${i === bHi ? 'you are here' : esc(bpAgo10(e.t)) + (i > bHi ? ' · undone' : '')}</small></button>` }
  return `<div class="mn8 b8p hs10" role="menu" aria-label="History"><b class="hsT10">🕘 History <small>tap a step to go to it</small></b>${h}${from > 0 ? `<small class="hsM10">${from} older step${from > 1 ? 's' : ''} can still be reached with Undo</small>` : ''}</div>`;
}
{ const f0 = b8TopR; b8TopR = function () {
  f0.apply(this, arguments);
  safe10('builder top bar', () => {
    const t = $('#b8Top'), u = t.querySelector('[data-b8="undo"]'), r = t.querySelector('[data-b8="redo"]');
    if (u) { const l = B8.pv ? 'cancel “' + (B8.pv.label || 'this change') + '”' : bHi > 0 && bHist[bHi] ? bHist[bHi].label : ''; u.title = l ? 'Undo: ' + l + ' (Ctrl+Z)' : 'Nothing to undo'; u.setAttribute('aria-label', u.title) }
    if (r) { const nx = bHist[bHi + 1]; r.title = nx ? 'Redo: ' + nx.label + ' (Ctrl+Y)' : 'Nothing to redo'; r.setAttribute('aria-label', r.title) }
    if (B8.mode === 'build' && bHist.length > 1) {
      const mn = t.querySelector('.mn8:not(.hs10)');
      if (innerWidth <= 520) { if (mn && B8.menu === true && !mn.querySelector('[data-b8="hist10"]')) mn.insertAdjacentHTML('beforeend', '<button class="b8b" data-b8="hist10">🕘 History</button>') }
      else if (r && !t.querySelector('.hsB10')) r.insertAdjacentHTML('afterend', `<button class="b8i hsB10" data-b8="hist10" title="History: every step you can go back to" aria-haspopup="menu" aria-expanded="${BP10.hist}"><i>🕘</i><span>History</span></button>`);
      if (BP10.hist) t.insertAdjacentHTML('beforeend', bpHistHTML10());
    } else BP10.hist = false;
    bpStripPlace10();
  });
} }
addEventListener('pointerdown', e => { if (BP10.hist && !(e.target.closest && e.target.closest('.hs10,[data-b8="hist10"]'))) { BP10.hist = false; if (B8.on) b8TopR() } }, true);
// ---- good next pieces: what fits at the end of the track (or after the selection), from the train's speed and height there
function bpTypes10() {// piece type → where it is in the library, for the level the builder is on
  if (BP10.tIdx && BP10.tLvl === lvl80()) return BP10.tIdx; const T = {};
  for (const k in LIBK80) { const c = LIBK80[k]; if (!c || !Array.isArray(c[3]) || !catVis10(k)) continue; c[3].forEach((it, i) => { let els = null; try { els = itemEls80(it) } catch (e) {} if (!els || els.length !== 1 || !has10(ET, els[0][0])) return; const t = els[0][0], own = String(it.n || '').toLowerCase() === String(ET[t].n || '').toLowerCase(); if (!T[t] || own && !T[t][2]) T[t] = [k, i, own] }) }
  BP10.tIdx = T; BP10.tLvl = lvl80(); return T;
}
function bpSuggest10() {
  const r = BR_; if (!r || !r.g || r.g.bad || B8.pv || bPv || bPend) return null; const at = insAt80(); if (BP10.sugSrc === r && BP10.sugAt === at) return BP10.sug;
  const prev = D.els[at - 1], pt = prev ? prev.t : 'station', v = vEnd80(at - 1), sr = r.g.secR[at - 1], y = sr ? r.g.P[sr[1]].y + .7 : 0, T = bpTypes10(), out = [], used = new Set([pt]);
  const add = (t, why) => { if (out.length < 3 && T[t] && !used.has(t)) { used.add(t); out.push({ t, cat: T[t][0], i: T[t][1], why }) } };
  const going = D.els.slice(0, at).some(e => e.t === 'lift' || e.t === 'launch'), sp = fV(v); let note;
  if (!going) { note = 'The train needs something to get it going'; add('lift', 'A chain lift pulls the train up, so it has height to spend'); add('launch', 'Fires the train out of the station instead'); add('drop', 'A drop straight out of the station (only if the station is high up)') }
  else if (pt === 'lift') { note = 'The train is at the top, ' + fL(y) + ' up'; add('drop', 'Spend the height: the first drop sets the top speed'); add('twistdrop', 'A drop that turns while it falls'); add('turn', 'A slow turn at the top, then drop') }
  else if (v < 7) { note = 'The train is slow here: ' + sp; if (y > 9) add('drop', 'There is ' + fL(y) + ' of height left to turn into speed'); add('launch', 'A launch gets it moving again'); add('lift', 'Or a second lift hill'); add('turn', 'A gentle turn costs little speed') }
  else if (v >= 23) { note = 'The train is fast here: ' + sp; add('loop', sp + ' is plenty for a loop'); add('airtime', 'A tall hill here throws riders out of their seats'); add('overbank', 'Carry the speed through a tilted turn'); add('immelmann', 'Half a loop that turns the train round'); add('turn', 'A wide banked turn keeps the speed') }
  else if (v >= 14) { note = 'The train is doing ' + sp + ' here'; add('airtime', 'A hill at this speed gives floaty airtime'); add('corkscrew', 'Fast enough for a corkscrew'); add('turn', 'A banked turn points it somewhere new'); add('zerog', 'A weightless roll'); add('hill', 'A small hill keeps things moving') }
  else { note = 'The train is doing ' + sp + ' here'; add('hill', 'A low hill suits this speed'); add('turn', 'A turn costs little speed'); if (y > 8) add('drop', 'Use the ' + fL(y) + ' of height that is left'); add('helix', 'A spiral down gains a little speed'); add('airtime', 'A gentle airtime hill') }
  BP10.sugSrc = r; BP10.sugAt = at; return BP10.sug = out.length ? { note, items: out, home: going && D.els.length >= 9 && at === D.els.length } : null;
}
function bpSugHTML10() {
  const s = bpSuggest10(); if (!s) return '';
  return `<div class="sg10"><b class="sgT10">💡 Good next pieces <small>${esc(s.note)}</small></b><div class="sgR10">${s.items.map(q => { const it = LIBK80[q.cat][3][q.i]; return `<button class="sgI10" data-b8it="${q.i}" data-cat10="${q.cat}" title="${esc(q.why)}"><i>${ET[q.t].ic}</i><span><b>${esc(it.n)}</b><small>${esc(q.why)}</small></span></button>` }).join('')}${s.home && LIBK80.quick && catVis10('quick') ? `<button class="sgI10" data-b8q="home" title="Turns the track towards the station so it finishes neatly"><i>🏠</i><span><b>Head back home</b><small>The track is long enough to start heading for the station</small></span></button>` : ''}</div></div>`;
}
{ const f0 = b8LibR; b8LibR = function () {
  const r = f0.apply(this, arguments);
  safe10('builder suggestions', () => { const body = $('#b8Lib .lbB8'); if (!body || B8.mode !== 'build' || !['recent', 'track', 'thrill'].includes(B8.pick10) || body.querySelector('.sg10')) return; const h = bpSugHTML10(); if (!h) return; const w = body.querySelector('.lbW8'); if (w) w.insertAdjacentHTML('afterend', h); else body.insertAdjacentHTML('afterbegin', h) });
  return r;
} }
// ---- ▶ Test from here, in the actions of a selected piece
{ const f0 = b8SelActs80; b8SelActs80 = function (big) { const h = f0.apply(this, arguments); if (!h) return h; const cut = h.lastIndexOf('<button class="b8b dng" data-b8="del"'); if (cut < 0) return h; return h.slice(0, cut) + `<button class="b8b" data-b8="playFrom10" title="Playtest starting just before this piece">▶<span>Test from here</span></button>` + h.slice(cut) } }
function bpPlayFrom10() {
  const r = userRange80(), g = BR_ && BR_.g; if (!r || !g || g.bad || !g.secR[r[0]] || !BR_.c) { b8Play(); return } const s0 = g.cum[g.secR[r[0]][0]] * BR_.c.L / g.len, nm = secName(D, r[0]);
  b8Play(); if (B8.mode !== 'play') return;
  safe10('test from here', () => { const c = curCtx(); if (!c) return; const tr = traceOf(c); seekK(tr, trIdx(tr.s, Math.max(0, s0 - 8))); if (!playing) setPlay(true); say('▶ Testing from just before ' + nm) });
}
// ---- the new buttons
{ const f0 = b8Act; b8Act = async function (a, t, e) {
  if (a === 'hist10') { BP10.hist = !BP10.hist; if (B8.menu) B8.menu = false; b8TopR(); return }
  if (a === 'histGo10') { const i = +t.dataset.v; BP10.hist = false; if (Number.isInteger(i) && i >= 0 && i < bHist.length && i !== bHi) { if (B8.pv) b8Cancel(); if (bPv) { b8TopR(); return } const fwd = i > bHi, l = bHist[fwd ? i : Math.min(bHist.length - 1, i + 1)].label; histGo(i); say((fwd ? '↷ Forward to: ' : '↶ Back to before: ') + l) } b8Render(); return }
  if (BP10.hist) { BP10.hist = false; b8TopR() }
  if (a === 'check10') { B8.insTab = 'check'; b8OpenIns(); b8Render(); return }
  if (a === 'stat10') { B8.insTab = 'info'; b8OpenIns(); b8Render(); return }
  if (a === 'playFrom10') return bpPlayFrom10();
  return f0.apply(this, arguments);
} }
// the welcome card steps aside as soon as you start building
b8.addEventListener('click', e => { const t = $('#b8Tour'); if (!t || t.hidden || !t.classList.contains('wel8')) return; if (e.target.closest('[data-b8it],[data-b8tool],[data-b8sec],[data-b8q],[data-b8bp]')) t.hidden = true }, true);
// ---- ten more ready-made layouts: the tuned 10.0 park coasters that fit the builder's 190 m build area. Each passes
// the builder's full check with no must-fix problems and no warnings (tests/t23 section D measures every one). The two
// flagship rides, Thunder Comet and Nova Giant, are about 270 m across and cannot fit, so they are not offered here.
const BPX10 = [
  ['Dipper', '🧸', 'Little Dipper', 'A first coaster: a small lift, a gentle drop and a spiral.', 'Little Dipper', 1],
  ['Cheddar', '🧀', 'Cheddar Chase', 'A wild mouse: tight flat turns one after another, then a sudden drop.', 'Cheddar Chase', 1],
  ['Pendulum', '🎐', 'Pendulum Pass', 'A suspended coaster of long sweeping turns and a spiral finish.', 'Pendulum Pass', 0],
  ['Timberwolf', '🪵', 'Timberwolf', 'A wooden coaster: one airtime hill after another.', 'Timberwolf', 0],
  ['Turbo', '🏍', 'Turbo Circuit', 'Two launches and fast, low turns like a race track.', 'Turbo Circuit', 0],
  ['Manta', '🌊', 'Sky Manta', 'A twisting first drop, a tilted turn, a corkscrew and a spiral.', 'Sky Manta', 0],
  ['Talon', '🦅', 'Talon Strike', 'A dive coaster: a straight-down drop, an Immelmann and a second dive.', 'Talon Strike', 0],
  ['Nightshade', '🦇', 'Nightshade', 'Hanging below the track through two loops, a weightless roll and two corkscrews.', 'Nightshade', 0],
  ['Aurora', '🌌', 'Aurora Wing', 'Launched into an Immelmann, then a weightless roll, a corkscrew and a barrel roll.', 'Aurora Wing', 0],
  ['Hydra', '🐉', 'Hydra', 'Seven times upside down: Immelmann, dive loop, loop, weightless roll and three corkscrews.', 'Hydra', 0]];
safe10('blueprints', () => {
  const hx = n => typeof n === 'number' ? '#' + (n & 0xffffff).toString(16).padStart(6, '0') : undefined;
  for (const [key, ic, name, desc, ride, beg] of BPX10) {
    if (!has10(DSN10, key) || TEMPLATES.some(t => t.id === 't10_' + key)) continue; const R_ = RIDES.find(q => (q.baseName || q.name) === ride), st = {};
    if (R_) { for (const k of ['rail', 'tie', 'body', 'accent']) { const c = hx(R_[k]); if (c) st[k] = c } if (TSTY7.some(m => m[0] === R_.trainStyle)) st.train = R_.trainStyle }
    TEMPLATES.push({ id: 't10_' + key, ic, name: name + ' (park ride)', desc, els: DSN10[key].map(e => [e[0], { ...e[1] }]), style: Object.keys(st).length ? st : undefined, park10: 1, easy10: beg ? 1 : 0 });
  }
});
// ---- Sketch Studio: which ready-made layouts look most like the drawing?
// Both shapes are walked at 48 evenly spaced steps from the station, moved to their middle and scaled to the same size.
// The drawing is then compared with each layout turned in 15° steps, mirrored and run the other way round; the score
// is how far apart the two lines stay on average (0 = the same shape). Nothing leaves the device.
const SKM10 = { N: 48, tpl: new Map(), key: '', res: [] };
function skmNorm10(pts) {// [[x, z], …] → N points along the line, centred, average distance from the middle = 1
  if (!pts || pts.length < 2) return null; const N = SKM10.N, cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L_ = cum[cum.length - 1]; if (!(L_ > 1e-6)) return null; const out = []; let j = 0;
  for (let k = 0; k < N; k++) { const d = L_ * k / (N - 1); while (j < pts.length - 2 && cum[j + 1] < d) j++; const a = (d - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]); out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * a, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * a]) }
  let cx = 0, cz = 0; for (const p of out) { cx += p[0]; cz += p[1] } cx /= N; cz /= N; let rr = 0; for (const p of out) { p[0] -= cx; p[1] -= cz; rr += Math.hypot(p[0], p[1]) } rr = rr / N || 1; for (const p of out) { p[0] /= rr; p[1] /= rr } return out;
}
// how "wide" a shape is next to how long it is (0 = a straight line, 1 = as wide as it is long). A line that does not
// turn is not the plan of a coaster, so it is never compared: without this a straight stroke scored 83% against the
// first stretch of an out-and-back layout.
function skmWide10(n) { let xx = 0, zz = 0, xz = 0; for (const p of n) { xx += p[0] * p[0]; zz += p[1] * p[1]; xz += p[0] * p[1] } const tr = xx + zz, det = xx * zz - xz * xz, q = Math.sqrt(Math.max(0, tr * tr / 4 - det)), hi = tr / 2 + q, lo = tr / 2 - q; return hi > 1e-9 ? Math.sqrt(Math.max(0, lo) / hi) : 0 }
const SKM_WIDE10 = .08;
function skmDist10(a, b) {// smallest average gap over turning, mirroring and direction
  const N = a.length; let best = 1e9;
  for (const mir of [1, -1]) for (const rev of [0, 1]) for (let r = 0; r < 24; r++) { const c = Math.cos(r * PI / 12), s_ = Math.sin(r * PI / 12); let d = 0; for (let i = 0; i < N && d < best * N; i++) { const q = b[rev ? N - 1 - i : i], x = q[0] * mir, z = q[1]; d += Math.hypot(a[i][0] - (x * c - z * s_), a[i][1] - (x * s_ + z * c)) } d /= N; if (d < best) best = d }
  return best;
}
const SKM_CUT10 = [1, .9, .8, .7, .6];// a drawing usually stops where the return track would begin: each layout is also tried cut short
function skmTpl10(t) { const k = t.id; if (SKM10.tpl.has(k)) return SKM10.tpl.get(k); let n = null; try { const g = generate(mkD(t.name, t.els)); if (!g.bad && g.P && g.P.length > 8) { const all = g.P.map(p => [p.x, p.z]); n = SKM_CUT10.map(f => skmNorm10(all.slice(0, Math.max(4, Math.round(all.length * f))))).filter((q, k) => q && (k === 0 || skmWide10(q) >= SKM_WIDE10)) } } catch (e) {} SKM10.tpl.set(k, n && n.length ? n : null); return SKM10.tpl.get(k) }
function skmMatch10(strokes) {
  const pts = []; for (const s_ of (strokes || [])) if (s_ && Array.isArray(s_.pts)) for (const p of s_.pts) if (Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])) pts.push([p[0], p[1]]);
  if (pts.length < 6) return []; let L_ = 0; for (let i = 1; i < pts.length; i++) L_ += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (L_ < 30) return [];
  const key = pts.length + ':' + Math.round(L_) + ':' + Math.round(pts[0][0] + pts[pts.length - 1][1]) + ':' + TEMPLATES.length; if (key === SKM10.key) return SKM10.res;
  const a = skmNorm10(pts), res = []; if (!a) return []; if (skmWide10(a) < SKM_WIDE10) { SKM10.key = key; return SKM10.res = [] }
  TEMPLATES.forEach((t, i) => { if (t.id === 'blank' || t.id === 't9starter') return; const bs = skmTpl10(t); if (!bs) return; let d = 1e9; for (const b of bs) d = Math.min(d, skmDist10(a, b)); res.push({ i, id: t.id, name: t.name, ic: t.ic, d, pct: Math.round(clamp(1 - d / .9, 0, 1) * 100) }) });
  res.sort((p, q) => p.d - q.d); SKM10.key = key; return SKM10.res = res.slice(0, 3).filter(q => q.pct >= 35);
}
SK85.extra = function (h, S_, I) {
  if (!S_ || !S_.sk || SK85.pv) return h; const m = skmMatch10(S_.sk.top); if (!m.length) return h;
  const sec = `<h4 class="h80">📐 Closest ready-made layouts <small>by the shape of your blueprint</small></h4><div class="skM10">${m.map(q => `<div><i>${q.ic}</i><span><b>${esc(q.name)}</b><small>${q.pct}% alike</small></span><button class="b8b sm" data-skm10="${q.i}">Start from it</button></div>`).join('')}</div><p class="n8">“Build my coaster” still builds what you drew. These are finished coasters with a similar plan, if you would rather start from one.</p>`;
  const cut = h.lastIndexOf('<details class="skSet"'); return cut < 0 ? h + sec : h.slice(0, cut) + sec + h.slice(cut);
};
{ const sk = $('#sk85'); if (sk) sk.addEventListener('click', e => { const b = e.target.closest('[data-skm10]'); if (!b) return; e.stopPropagation(); const i = +b.dataset.skm10, t = TEMPLATES[i]; if (!t) return; safe10('sketch match', () => { if (typeof DBG85 === 'object' && DBG85.sk && DBG85.sk.close) DBG85.sk.close(); else { const x = sk.querySelector('[data-sk="close"]'); if (x) x.click() } b8BpAct('new', { dataset: { v: String(i) } }) }) }, true) }
// ---- test hooks
Object.assign(DBG10.builder, {
  stats: () => { bpTrack10(); return BP10.cur ? { ...BP10.cur } : null }, strip: () => { const e = $('#bst10'); return e ? { where: e.parentNode && e.parentNode.id, text: e.innerText.replace(/\s+/g, ' ').trim(), chips: e.querySelectorAll('.bs10').length, deltas: [...e.querySelectorAll('.bs10 em')].map(x => x.parentNode.dataset.v + x.textContent), status: (e.querySelector('.bsS10') || {}).className || '' } : null },
  suggest: () => { BP10.sugSrc = null; const s = bpSuggest10(); return s ? { note: s.note, items: s.items.map(q => q.t), why: s.items.map(q => q.why), home: s.home } : null },
  hist: () => ({ open: BP10.hist, n: bHist.length, at: bHi, labels: bHist.map(h => h.label) }), histGo: i => b8Act('histGo10', { dataset: { v: String(i) } }),
  blueprints: () => TEMPLATES.filter(t => t.park10).map(t => ({ id: t.id, name: t.name, n: t.els.length, style: t.style || null })), tplEls: id => { const t = TEMPLATES.find(q => q.id === id); return t ? JSON.parse(JSON.stringify(t.els)) : null },
  match: strokes => skmMatch10(strokes).map(q => ({ id: q.id, name: q.name, pct: q.pct })), matchSelf: id => { const t = TEMPLATES.find(q => q.id === id); if (!t) return null; const g = generate(mkD(t.name, t.els)), P_ = g.P, n = Math.floor(P_.length * .8), pts = []; for (let i = 0; i < n; i += 3) pts.push([P_[i].x + 14, P_[i].z - 9]); SKM10.key = ''; return skmMatch10([{ pts }]).map(q => ({ id: q.id, pct: q.pct })) },
  playFrom: () => bpPlayFrom10(), trainS: () => s
});
