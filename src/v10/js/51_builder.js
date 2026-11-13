// ---- 10.1 TRACK BUILDER — a roomier, simpler builder:
//  · Bigger view: on a computer both side panels start closed. The piece panel slides in when you select a piece and
//    slides away again when you deselect it (unless you opened it yourself). "＋ Add" still opens the piece library.
//  · Simpler picker: the 14 category buttons become five tabs: 🕘 Recent, 🛤 Track, 🌀 Thrills, 🛠 Tools, 💡 Ideas.
//    A tab shows all its pieces in one list with small headings; Ideas keeps blueprints, Quick build, Generate,
//    Evolve and Daily as chips. Recent remembers the last pieces you added.
//  · Drag to shape: more pieces get drag handles (hill length, ramp height), the handles gently pulse, and a hint
//    says what to do the first few times you select a piece.
//  · Live force colours: the track is green where the ride feels comfy, yellow where the forces are strong and red
//    where they are too much, updated as you build and drag. 🚦 Forces in the toolbar turns it on or off.
// ---------------------------------------------------------------------------------------------------------------------
const PICK10 = [['recent', '🕘', 'Recent'], ['track', '🛤', 'Track', ['basic', 'turns', 'hills']], ['thrill', '🌀', 'Thrills', ['inv', 'launch', 'xtreme']],
  ['tools', '🛠', 'Tools', ['brakes', 'station', 'special']], ['ideas', '💡', 'Ideas', ['blue', 'quick', 'gen10', 'evo', 'daily']]];
const PICKK10 = Object.fromEntries(PICK10.map(p => [p[0], p])), RECENT_K10 = 'coasterlab.v10.recentPieces', FORCE_K10 = 'coasterlab.v10.forceColours';
const ls10 = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch (e) { return d } }, lsSet10 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };
const catVis10 = k => !!LIBK80[k] && (lvl80() > 0 || LIBBEG90.includes(k));
const tabCats10 = t => ((PICKK10[t] || [])[3] || []).filter(catVis10);
const tabOf10 = lib => { for (const p of PICK10) if (p[3] && p[3].includes(lib)) return p[0]; return LIBK80[lib] && !LIBK80[lib][3] ? 'ideas' : 'track' };
function recentList10() { const r = ls10(RECENT_K10, []); return Array.isArray(r) ? r.filter(x => Array.isArray(x) && LIBK80[x[0]] && LIBK80[x[0]][3] && LIBK80[x[0]][3][x[1]] && catVis10(x[0])) : [] }
function recentAdd10(cat, i) { const r = recentList10().filter(x => !(x[0] === cat && x[1] === i)); r.unshift([cat, i]); lsSet10(RECENT_K10, r.slice(0, 8)) }
function item10(cat, i) { const c = LIBK80[cat], it = c[3][i], sv = geoSvg80(itemEls80(it)); return `<button class="lb8" data-b8it="${i}" data-cat10="${cat}" title="${esc(it.d || '')}"><span class="pv8">${sv || '<i>' + c[1] + '</i>'}</span><b>${esc(it.n)}</b><small>${esc(it.d || '')}</small></button>` }
// which tab shows, and make sure the open category belongs to it
function pickTab10() {
  if (B8.lib !== B8.lastLib10) { B8.lastLib10 = B8.lib; if (B8.pick10 !== 'recent' || !B8.keepRecent10) B8.pick10 = tabOf10(B8.lib) } B8.keepRecent10 = false;
  let t = B8.pick10 || tabOf10(B8.lib); if (t !== 'recent' && !tabCats10(t).length) t = 'track';
  if (t !== 'recent') { const cats = tabCats10(t); if (!cats.includes(B8.lib)) { B8.lib = t === 'ideas' && cats.includes(B8.lastIdea10) ? B8.lastIdea10 : cats[0]; B8.lastLib10 = B8.lib } }
  else if (!LIBK80[B8.lib] || !LIBK80[B8.lib][3]) { B8.lib = 'basic'; B8.lastLib10 = 'basic' }
  if (t === 'ideas') B8.lastIdea10 = B8.lib; return B8.pick10 = t
}
function pickDecorate10(t) {
  const L_ = $('#b8Lib'), nav = L_ && L_.querySelector('.lbC8'), body = L_ && L_.querySelector('.lbB8'); if (!nav || !body) return;
  nav.classList.add('pk10'); nav.setAttribute('aria-label', 'Piece groups');
  nav.innerHTML = PICK10.filter(p => p[0] === 'recent' || tabCats10(p[0]).length).map(([k, ic, n]) => `<button class="${k === t ? 'on' : ''}" data-pick10="${k}"><i>${ic}</i><span>${n}</span></button>`).join('');
  const more = lvl80() > 0 ? '' : `<p class="lbMore10">Launches, brakes, stations and more come with <button class="lnk8" data-b8="level" data-v="intermediate">Intermediate mode</button></p>`;
  if (t === 'ideas') { body.insertAdjacentHTML('afterbegin', `<div class="lbSub10">${tabCats10('ideas').map(k => `<button class="${k === B8.lib ? 'on' : ''}" data-b8lib="${k}"><i>${LIBK80[k][1]}</i>${esc(LIBK80[k][2])}</button>`).join('')}</div>`); return }
  const w = body.querySelector('.lbW8'), where = w ? w.outerHTML : '';
  if (t === 'recent') { const r = recentList10(); body.innerHTML = where + (r.length ? `<div class="lbG8">${r.map(([c, i]) => item10(c, i)).join('')}</div>` : `<div class="emp8 lbEmpty10"><b>Nothing here yet</b><p>The pieces you add show up here, so your favourites are always one tap away.</p><button class="b8b" data-pick10="track">🛤 Browse track pieces</button></div>`) + more; return }
  body.innerHTML = where + tabCats10(t).map(k => { const c = LIBK80[k]; return `<h4 class="lbS10" id="lbS10_${k}"><i>${c[1]}</i>${esc(c[2])}</h4><div class="lbG8">${c[3].map((_, i) => item10(k, i)).join('')}</div>` }).join('') + more
}
{ const f0 = b8LibR; b8LibR = function () { let t = 'track'; try { t = pickTab10() } catch (e) { console.warn('10.1 picker', e) } const r = f0.apply(this, arguments); try { pickDecorate10(t) } catch (e) { console.warn('10.1 picker', e) } return r } }
function pickSet10(t) { B8.pick10 = t; if (t !== 'recent') { const cats = tabCats10(t); if (cats.length && !cats.includes(B8.lib)) B8.lib = t === 'ideas' && cats.includes(B8.lastIdea10) ? B8.lastIdea10 : cats[0] } else B8.keepRecent10 = true; B8.lastLib10 = B8.lib; b8LibR(); const lb = $('#b8Lib .lbB8'); if (lb) lb.scrollTop = 0 }
// runs before the builder's own click handler: tabs, recent pieces, and the category of a piece in a merged list
b8.addEventListener('click', e => {
  const t = e.target.closest('[data-pick10],[data-b8it],[data-b8lib],[data-b8="insOpen"],[data-b8="insClose"],[data-b8="force10"]'); if (!t || t.disabled) return; const d = t.dataset;
  if (d.pick10) { e.stopPropagation(); pickSet10(d.pick10); return }
  if (d.b8 === 'force10') { e.stopPropagation(); forceSet10(bView.color !== 'force'); return }
  if (d.b8 === 'insOpen' || d.b8 === 'insClose') { B8.autoIns10 = false; return }
  if (d.b8it != null) { const cat = d.cat10 || B8.lib; if (d.cat10) { if (B8.pick10 === 'recent') B8.keepRecent10 = true; B8.lib = cat; B8.lastLib10 = cat } if (LIBK80[cat] && LIBK80[cat][3] && LIBK80[cat][3][+d.b8it]) recentAdd10(cat, +d.b8it); return }
  if (d.b8lib) { B8.pick10 = tabOf10(d.b8lib) }
}, true);
// ---------------------------------------------------------------------------------------------------------------------
// bigger view: panels start closed on a computer; the piece panel follows the selection
if (!narrow80()) { B8.libOpen = false; B8.insOpen = false }
{ const f0 = selectSec; selectSec = function (k, focus) {
  const was = B8.insOpen; f0.apply(this, arguments); if (!B8.on || narrow80()) return;
  if (k >= 0 && !was && B8.insOpen) B8.autoIns10 = true;
  if (k < 0 && B8.autoIns10 && B8.insOpen && !B8.pv) { B8.autoIns10 = false; B8.insOpen = false; b8Render() }
  if (k > 0 && k < D.els.length) shapeHint10()
} }
// ---------------------------------------------------------------------------------------------------------------------
// drag to shape: a few more handles, a gentle pulse and a hint
{ const f0 = handlesFor; handlesFor = function (k) {
  const hs = f0(k); try {
    const g = BR_ && BR_.g, el = D.els[k]; if (!g || g.bad || !el || k === 0 || k >= D.els.length || !g.secR[k]) return hs;
    const [a, b] = g.secR[k], end = g.P[b], start = g.secStart[k], fwd = hvec(g.secPsi[k]), p = el.p, has = key => hs.some(h => h.key === key);
    if (['hill', 'airtime', 'zerog'].includes(el.t) && specOf(el.t, 'len') && !has('len')) hs.push({ pos: end.clone(), ax: 'xz', kind: 'len', key: 'len', start: start.clone(), dir: fwd, lab: 'Length' });
    if (['straight', 'launch', 'brakes'].includes(el.t) && specOf(el.t, 'climb') && !has('climb') && p.climb != null) hs.push({ pos: end.clone().add(V(0, 2.6, 0)), ax: 'y', key: 'climb', ref: end.y + 2.6, base: p.climb, sgn: 1, lab: 'Height change' });
  } catch (e) { } return hs
} }
let hint10T = 0;
function shapeHint10() {
  const n = ls10('coasterlab.v10.shapeHints', 0); if (n >= 4 || !H80.length || B8.tool !== 'select') return; lsSet10('coasterlab.v10.shapeHints', n + 1);
  const t = (mobile ? 'Drag' : 'Drag') + ' the glowing dots on the track to shape this piece'; uiHint8(t); clearTimeout(hint10T); hint10T = setTimeout(() => { const h = $('#b8Hint'); if (h && h.textContent === t && !B8.drag) uiHint8('') }, 4500)
}
let pulse10 = 0;
TICKS72.push((dt, raw) => {
  if (!B8.on || !editing || !h8G.children.length) return; pulse10 += Math.min(raw || .016, .1); const s = 1 + .14 * Math.sin(pulse10 * 4.2);
  for (const o of h8G.children) { if (!o.isMesh || o.geometry !== h8Geo.s) continue; if (o.userData.s10 == null) o.userData.s10 = o.scale.x; o.scale.setScalar(o.userData.s10 * (B8.drag ? 1.15 : s)) }
});
// ---------------------------------------------------------------------------------------------------------------------
// live force colours
const FORCE10 = { red: [5.5, -1.5, 2], yel: [4.5, -.8, 1.2] }, FCOL10 = ['#3ddc84', '#ffc233', '#ff4d4d'];
function forceLevels10(g) {
  const c = BR_ && BR_.c, tr = BR_ && BR_.tr; if (!BR_ || BR_.g !== g || !c || !tr || !tr.n) return null;
  if (g.fz10 && g.fz10.tr === tr) return g.fz10.lv;
  const gg = seatG(c, tr, 0), n = g.P.length, lv = new Int8Array(n), sMax = tr.s[tr.n - 1], lvAt = j => { const v = gg.v[j], l = Math.abs(gg.l[j]); return v > FORCE10.red[0] || v < FORCE10.red[1] || l > FORCE10.red[2] ? 2 : v > FORCE10.yel[0] || v < FORCE10.yel[1] || l > FORCE10.yel[2] ? 1 : 0 };
  for (let i = 0; i < n; i++) { const s = g.cum[i] / g.len * c.L; if (!tr.done && s > sMax + 1) { lv[i] = -1; continue } const j = trIdx(tr.s, s); lv[i] = Math.max(lvAt(j), lvAt(Math.min(tr.n - 1, j + 1))) }
  g.fz10 = { tr, lv }; return lv
}
const fc10 = new THREE.Color();
{ const f0 = ribColor; ribColor = function (i, k, g) {
  if (bView.color !== 'force' || !B8.on || !editing) return f0(i, k, g);
  const hi = bHiIssue && bHiIssue.secs.includes(k), r = selRange80(); if (hi || (B8.pv && B8.pv.ks.includes(k)) || (bPend && k === bPend.k) || (r && r[0] !== r[1])) return f0(i, k, g);
  const lv = forceLevels10(g); if (!lv) { const sv = bView.color; bView.color = 'sec'; try { return f0(i, k, g) } finally { bView.color = sv } }
  const L_ = lv[i]; cTmp.set(L_ < 0 ? '#8b98ab' : FCOL10[L_]); if (bSel >= 0) { if (k === bSel) cTmp.lerp(fc10.set('#ffffff'), .25); else cTmp.multiplyScalar(.55) } return cTmp
} }
function forceSet10(on) { bView.color = on ? 'force' : 'sec'; lsSet10(FORCE_K10, !!on); recolor(); b8Render() }
if (ls10(FORCE_K10, true)) bView.color = 'force';
// the 🚦 Forces button in the toolbar and a small legend over the view
{ const f0 = b8DockR; b8DockR = function () {
  f0(); try {
    const fit = $('#b8Dock .tools8 [data-b8="fit"]'), on = bView.color === 'force';
    if (fit && !$('#b8Dock [data-b8="force10"]')) fit.insertAdjacentHTML('beforebegin', `<button class="b8t ${on ? 'on' : ''}" data-b8="force10" title="Colour the track by how strong the forces are"><i>🚦</i><span>Forces</span></button>`);
    let lg = $('#frc10'); if (!lg) { b8.insertAdjacentHTML('beforeend', '<div id="frc10" aria-hidden="true"><span><u style="background:#3ddc84"></u>Comfy</span><span><u style="background:#ffc233"></u>Strong</span><span><u style="background:#ff4d4d"></u>Too much</span></div>'); lg = $('#frc10') }
    lg.hidden = !on || B8.mode !== 'build' || !!B8.pv; const dk = $('#b8Dock'); lg.style.bottom = ((dk && dk.offsetHeight) || 120) + 14 + 'px'
  } catch (e) { console.warn('10.1 forces', e) }
} }
// ---------------------------------------------------------------------------------------------------------------------
DBG10.builder = {
  pick: () => ({ tab: B8.pick10, lib: B8.lib, tabs: [...document.querySelectorAll('#b8Lib .lbC8 [data-pick10]')].map(b => b.dataset.pick10), items: document.querySelectorAll('#b8Lib .lbB8 [data-b8it]').length, heads: [...document.querySelectorAll('#b8Lib .lbS10')].map(h => h.textContent) }),
  panels: () => ({ lib: B8.libOpen, ins: B8.insOpen, auto: !!B8.autoIns10, narrow: narrow80() }),
  cats: () => PICK10.flatMap(p => p[0] === 'recent' ? [] : tabCats10(p[0])), tab: t => { pickSet10(t); return B8.pick10 },
  recent: () => recentList10(), clearRecent: () => lsSet10(RECENT_K10, []),
  forces: () => { const g = BR_ && BR_.g, lv = g && forceLevels10(g); if (!lv) return null; const n = [0, 0, 0, 0]; for (const x of lv) n[x + 1]++; return { mode: bView.color, unreached: n[0], green: n[1], yellow: n[2], red: n[3] } },
  setForces: on => forceSet10(on), handles: () => H80.map(h => ({ lab: h.lab, key: h.key || h.kind, ax: h.ax })),
  els: () => D.els.map(e => e.t), sel: k => { selectSec(k); return bSel }, desel: () => { selectSec(-1); return bSel },
  setP: (k, key, v) => { D.els[k].p[key] = v; rebuild(true); return BR_.g.bad ? 'bad' : 'ok' },
  colorAt: (i) => { const g = BR_.g, c = ribColor(i, g.sec[i], g); return '#' + c.getHexString() }
};
