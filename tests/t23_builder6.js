// Coaster Lab 10.1 — Track Builder 6: the live numbers and what a change does to them, the status chip, good next
// pieces, History, Test from here, the ten new ready-made layouts, the closest layouts in the Sketch Studio, and
// the rows that scroll sideways.
//   node t23_builder6.js          T23=AB node t23_builder6.js
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_1.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
const ONLY = process.env.T23 || 'ABCDEFG';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const B = (pg, expr, a) => pg.evaluate(new Function('a', 'const G = window.__coasterDebug, D = G.v80.v10, T = D.builder, V = G.v80.v86; return ' + expr), a);
const click = (pg, sel) => pg.evaluate(s => { const b = document.querySelector(s); if (b) b.click(); return !!b }, sel);
const builder = async (o = {}) => { const r = await open(F, { w: 1200, h: 800, mobile: false, storage: { 'coasterlab.v80.bWelcome': '1' }, ...o }); await r.page.evaluate(() => window.__coasterDebug.v80.v86.openBuilder()); await r.page.waitForTimeout(1500); return r };
const els = a => a.map(([t, p]) => ({ t, p: p || {} }));
(async () => {
  // ---------- A. the numbers, and what a change does to them
  if (ONLY.includes('A')) {
    const { browser, page, errors } = await builder(); let s = await B(page, 'T.strip()'); const st = await B(page, 'T.stats()'), x = await B(page, '(() => { const m = G.v80.v85.metrics(); return m })()').catch(() => null);
    ok(s && s.where === 'b8Top' && s.chips === 7 && /good/.test(s.status) && /Ready to ride/.test(s.text), 'on a computer the numbers sit in the top bar: “' + s.text + '”');
    ok(st && st.v > 5 && st.h > 5 && st.len > 100 && st.T > 10 && s.text.includes(Math.round(st.v * 2.23694) + ' mph') && s.text.includes(Math.round(st.h * 3.28084) + ' ft') && s.text.includes(st.g.toFixed(1) + ' G'), 'they are the builder’s own lap simulation (top speed ' + st.v.toFixed(1) + ' m/s, height ' + st.h.toFixed(1) + ' m, ' + st.g.toFixed(2) + ' G)');
    ok(await page.evaluate(() => { const n = document.querySelector('#b8Top .b8nm'), r = n.getBoundingClientRect(); return r.width >= 100 && n.textContent.includes('My Coaster') }), 'the coaster’s name keeps its place beside them');
    // preview a piece: the change it WOULD make
    await click(page, '#b8Dock [data-b8="add"]'); await page.waitForTimeout(600); const sg = await B(page, 'T.suggest()');
    ok(sg && sg.items.length >= 2 && /mph/.test(sg.note) && await page.evaluate(() => document.querySelectorAll('#b8Lib .sg10 .sgI10').length >= 2), 'the piece library opens with “Good next pieces” (' + sg.items.join(', ') + ' — ' + sg.note + ')');
    await page.screenshot({ path: SH + 'v101_builder_suggest_1200x800.png' });
    const n0 = (await B(page, 'T.els()')).length; await click(page, '#b8Lib .sg10 .sgI10'); await page.waitForTimeout(900); s = await B(page, 'T.strip()');
    const live = await page.evaluate(() => [...document.querySelectorAll('#bst10 .bs10 em')].map(e => e.className));
    ok((await B(page, 'T.els()')).length === n0 + 1 && (await B(page, 'T.els()'))[n0] === sg.items[0] && s.deltas.length >= 1 && s.deltas.some(d => /^len▲/.test(d)) && live.every(c => /lv/.test(c)), 'tapping the first one previews it, and the numbers show what it would change (' + s.deltas.join(' ') + ')');
    await page.evaluate(() => { const b = [...document.querySelectorAll('#b8Pv button')].find(b => /Place it/.test(b.textContent)); if (b) b.click() }); await page.waitForTimeout(900); s = await B(page, 'T.strip()');
    const after = await page.evaluate(() => [...document.querySelectorAll('#bst10 .bs10 em')].map(e => e.className));
    ok(s.deltas.length >= 1 && after.every(c => !/lv/.test(c)), 'after placing it they show the change since the last step (' + s.deltas.join(' ') + ')');
    await page.waitForTimeout(9800); s = await B(page, 'T.strip()'); ok(s.deltas.length === 0, 'and go back to plain numbers after a few seconds');
    // the status chip
    await B(page, 'T.setP(1, "h", 3)'); await page.evaluate(() => window.__coasterDebug.v80.v86.openBuilder && 0); await B(page, 'T.sel(1)'); await page.waitForTimeout(900); s = await B(page, 'T.strip()');
    const bad = /bad|warn/.test(s.status); ok(bad && /must-fix|to check|not finished/.test(s.text), 'a lift hill only 10 ft tall turns the status chip from ✓ to “' + s.text.split(' ⚡')[0] + '”');
    await click(page, '#bst10 .bsS10'); await page.waitForTimeout(600); ok(await page.evaluate(() => { const t = document.querySelector('#b8Ins'); const on = t && t.querySelector('.inT8 button.on'); return !!on && on.dataset.b8tab === 'check' && !t.classList.contains('shut') && t.getBoundingClientRect().width > 100 }), 'tapping the chip opens ✓ Check');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- B. good next pieces, by where the train is
  if (ONLY.includes('B')) {
    const { browser, page, errors } = await builder(); const sug = async e => { await B(page, 'V.setD(a)', els(e)); await page.waitForTimeout(500); await B(page, 'T.desel()'); return B(page, 'T.suggest()') };
    let s = await sug([['station']]); ok(s && s.items[0] === 'lift' && /get it going/.test(s.note), 'a station on its own: a lift hill first (“' + s.note + '”)');
    s = await sug([['station'], ['lift', { h: 30 }]]); ok(s && s.items[0] === 'drop' && /top/.test(s.note), 'at the top of the lift: a drop (' + s.items.join(', ') + ')');
    s = await sug([['station'], ['lift', { h: 55 }], ['drop', { h: 54, a: 70 }]]); ok(s && s.items.includes('loop') && /fast/.test(s.note), 'after a 180 ft drop the train is fast: a loop, a big hill, a tilted turn (' + s.items.join(', ') + ' — ' + s.note + ')');
    s = await sug([['station'], ['lift', { h: 12 }], ['drop', { h: 11, a: 40 }]]); ok(s && !s.items.includes('loop') && s.items.length >= 2, 'after a small drop: gentler pieces, no loop (' + s.items.join(', ') + ' — ' + s.note + ')');
    const why = s.why.join(' '); ok(!/undefined|NaN/.test(why + s.note) && s.why.every(w => w.length > 12), 'every suggestion says why in plain words');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- C. History, Undo that says what it undoes, Test from here
  if (ONLY.includes('C')) {
    const { browser, page, errors } = await builder();
    await B(page, 'V.setD(a)', els([['station'], ['lift', { h: 30 }], ['drop', { h: 28 }], ['turn', { dir: 'R', ang: 180, r: 18 }], ['airtime', { h: 8, len: 50 }], ['turn', { dir: 'R', ang: 90, r: 16 }]])); await page.waitForTimeout(500);
    await B(page, 'T.sel(4)'); await page.waitForTimeout(500); await click(page, '#b8Dock [data-b8="dup"]'); await page.waitForTimeout(700); await page.evaluate(() => { const b = [...document.querySelectorAll('#b8Pv button')].find(b => /Place it/.test(b.textContent)); if (b) b.click() }); await page.waitForTimeout(700);
    let h = await B(page, 'T.hist()'); const n1 = (await B(page, 'T.els()')).length;
    ok(h.n >= 3 && h.at === h.n - 1 && /Test design/.test(h.labels.join()) && await page.evaluate(() => /^Undo: .+\(Ctrl\+Z\)$/.test(document.querySelector('#b8Top [data-b8="undo"]').title)), 'Undo names the step it will undo: “' + await page.evaluate(() => document.querySelector('#b8Top [data-b8="undo"]').title) + '”');
    await click(page, '#b8Top [data-b8="hist10"]'); await page.waitForTimeout(400); const list = await page.evaluate(() => [...document.querySelectorAll('#b8Top .hs10 button')].map(b => b.textContent));
    ok(list.length === h.n && /you are here/.test(list[0]), '🕘 History lists every step, newest first (' + list.length + ' steps)'); await page.screenshot({ path: SH + 'v101_builder_history_1200x800.png' });
    await page.evaluate(() => { const b = document.querySelectorAll('#b8Top .hs10 button'); b[b.length - 2 >= 0 ? 1 : 0].click() }); await page.waitForTimeout(800); h = await B(page, 'T.hist()');
    ok(h.at === h.n - 2 && (await B(page, 'T.els()')).length === n1 - 1 && !h.open, 'tapping the step before goes back to it in one move (' + n1 + ' → ' + (n1 - 1) + ' pieces)');
    await click(page, '#b8Top [data-b8="hist10"]'); await page.waitForTimeout(300); ok(await page.evaluate(() => document.querySelectorAll('#b8Top .hs10 button.fut').length === 1 && /Redo: /.test(document.querySelector('#b8Top [data-b8="redo"]').title)), 'the step that was undone is still there to go forward to, and Redo names it');
    await page.mouse.click(600, 420); await page.waitForTimeout(300); ok(!(await B(page, 'T.hist()')).open, 'tapping anywhere else closes the list');
    // test from here
    await B(page, 'T.sel(4)'); await page.waitForTimeout(500); ok(await page.evaluate(() => !!document.querySelector('#b8Dock [data-b8="playFrom10"]')), 'a selected piece has ▶ Test from here');
    await click(page, '#b8Dock [data-b8="playFrom10"]'); await page.waitForTimeout(1500); const pos = await B(page, '({ s: T.trainS(), mode: document.querySelector("#b8").dataset.mode, st: G.state() })');
    ok(pos.mode === 'play' && pos.s > 60 && pos.s < pos.st.L * .8, 'it starts the playtest just before that piece (the train is ' + Math.round(pos.s) + ' m into a ' + Math.round(pos.st.L) + ' m lap) instead of at the station');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- D. ten more ready-made layouts
  if (ONLY.includes('D')) {
    const { browser, page, errors } = await builder(); const bp = await B(page, 'T.blueprints()');
    ok(bp.length === 10 && bp.every(b => / \(park ride\)$/.test(b.name) && b.n >= 8), 'ten park coasters are offered as ready-made layouts (' + bp.map(b => b.name.replace(' (park ride)', '')).join(', ') + ')');
    const m = await page.evaluate(() => { const D = window.__coasterDebug.v80.v10; return D.builder.blueprints().map(b => { const r = D.measure(D.builder.tplEls(b.id), b.name, false); return { id: b.id, ok: r.ok, crit: r.crit, warn: r.warn, len: r.len, h: r.h, inv: r.inv, iss: (r.issues || []).join(';') } }) });
    const badOnes = m.filter(q => !q.ok || q.crit || q.warn);
    ok(badOnes.length === 0, 'every one passes the builder’s full check with no must-fix problems and no warnings' + (badOnes.length ? ' — NOT: ' + badOnes.map(q => q.id + ' ' + q.iss).join(' | ').slice(0, 300) : ' (lengths ' + Math.min(...m.map(q => q.len)) + '–' + Math.max(...m.map(q => q.len)) + ' m, up to ' + Math.max(...m.map(q => q.inv)) + ' inversions)'));
    ok(new Set(m.map(q => q.len + ':' + q.h)).size === 10 && bp.filter(b => b.style && b.style.rail).length === 10 && !bp.some(b => /Thunder Comet|Nova Giant/.test(b.name)), 'they are ten different coasters, each with its own colours (the two flagship rides are too big for the build area and are left out)');
    await click(page, '#b8Dock [data-b8="add"]'); await page.waitForTimeout(500); await click(page, '#b8Lib [data-pick10="ideas"]'); await page.waitForTimeout(400); await click(page, '#b8Lib [data-b8lib="blue"]'); await page.waitForTimeout(900);
    const cards = await page.evaluate(() => [...document.querySelectorAll('#b8Lib .lb8.bp b')].map(b => b.textContent)); ok(cards.filter(c => /park ride/.test(c)).length >= 10, 'they appear under 💡 Ideas → Blueprints with the older layouts (' + cards.length + ' ready-made layouts in all)');
    await page.evaluate(() => { const c = [...document.querySelectorAll('#b8Lib .lb8.bp')].find(c => /Hydra/.test(c.textContent)); c.querySelector('[data-b8bp="new"]').click() }); await page.waitForTimeout(600); if (await page.evaluate(() => !document.querySelector('#dlg7').hidden)) { await page.click('#dlg7Y') } await page.waitForTimeout(1500);
    const e2 = await B(page, 'T.els()'), s = await B(page, 'T.strip()'); ok(e2.length === 12 && e2.includes('diveloop') && /🌀 7/.test(s.text) && /good/.test(s.status), '“Start new” on Hydra loads it: ' + s.text);
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- E. Sketch Studio: the closest ready-made layouts
  if (ONLY.includes('E')) {
    const { browser, page, errors } = await builder();
    const self = await page.evaluate(() => { const T = window.__coasterDebug.v80.v10.builder; return ['looper', 't10_Hydra', 't10_Dipper', 't10_Timberwolf', 'hyper'].map(id => [id, T.matchSelf(id)]) });
    ok(self.every(([id, r]) => r && r[0] && r[0].id === id && r[0].pct >= 80), 'a drawing that follows a layout’s own plan (moved, and stopped where the return track starts) finds that layout first: ' + self.map(([id, r]) => id.replace('t10_', '') + ' ' + (r && r[0] ? r[0].pct + '%' : '—')).join(', '));
    const line = await B(page, 'T.match([{ pts: Array.from({ length: 40 }, (_, i) => [i * 4, 0]) }])'), tiny = await B(page, 'T.match([{ pts: [[0, 0], [2, 1], [3, 3]] }])');
    const wob = await B(page, 'T.match([{ pts: Array.from({ length: 60 }, (_, i) => [i * 3, Math.sin(i / 5) * 1.5]) }])'), oval = await B(page, 'T.match([{ pts: Array.from({ length: 50 }, (_, i) => [Math.cos(i / 8) * 60, Math.sin(i / 8) * 28]) }])');
    ok(line.length === 0 && wob.length === 0 && tiny.length === 0, 'a straight line (even a slightly wobbly one) is not the plan of a coaster, so nothing is suggested for it; a scribble of three points is ignored');
    ok(oval.length >= 1 && oval[0].pct >= 50, 'an oval still finds layouts with a plan like it (' + oval.map(q => q.name.replace(' (park ride)', '') + ' ' + q.pct + '%').join(', ') + ')');
    // in the studio itself
    await page.evaluate(() => { const G = window.__coasterDebug, T = G.v80.v10.builder, sk = G.v80.v85.sk; sk.open(); const e = T.tplEls('twister') });
    await page.waitForTimeout(700); const drawn = await page.evaluate(() => { const G = window.__coasterDebug, sk = G.v80.v85.sk; sk.ex(0); return sk.state() }); await page.waitForTimeout(1200);
    const panel = await page.evaluate(() => { const s = document.querySelector('#skSide'); return { has: !!s.querySelector('.skM10'), rows: [...s.querySelectorAll('.skM10 > div')].map(d => d.textContent.replace(/\s+/g, ' ').trim()), go: !!s.querySelector('[data-sk="build"]') } });
    ok(drawn.top > 0 && panel.go && (panel.has ? panel.rows.length >= 1 && panel.rows.every(r => /\d+% alike/.test(r) && /Start from it/.test(r)) : true), 'with a blueprint drawn, the studio ' + (panel.has ? 'lists the closest ready-made layouts (' + panel.rows.map(r => r.replace('Start from it', '').trim()).join(' · ') + ')' : 'has no layout close enough to suggest for this example') + ', and “Build my coaster” still builds the drawing');
    await page.screenshot({ path: SH + 'v101_sketch_match_1200x800.png' });
    if (panel.has) { await click(page, '#skSide [data-skm10]'); await page.waitForTimeout(700); if (await page.evaluate(() => !document.querySelector('#dlg7').hidden)) await page.click('#dlg7Y'); await page.waitForTimeout(1500); const st = await page.evaluate(() => ({ sk: window.__coasterDebug.v80.v85.sk.state().open, n: window.__coasterDebug.v80.v10.builder.els().length })); ok(!st.sk && st.n >= 5, '“Start from it” closes the studio and loads that layout in the builder (' + st.n + ' pieces)') }
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- F. a phone: the numbers above the timeline, rows that scroll, the welcome card
  if (ONLY.includes('F')) {
    const { browser, page, errors } = await builder({ w: 390, h: 844, mobile: true, storage: {} }); let s = await B(page, 'T.strip()');
    ok(s && s.where === 'b8Dock' && s.chips === 5 && /Ready to ride/.test(s.text), 'on a phone the numbers are a row above the timeline: “' + s.text + '”');
    ok(await page.evaluate(() => { const t = document.querySelector('#b8Tour'); return !t.hidden && /Welcome/.test(t.textContent) }), 'a first visit shows the welcome card');
    const rows = await page.evaluate(() => ['.tl8', '.tools8'].map(q => { const e = document.querySelector('#b8Dock ' + q); return { q, more: e.scrollWidth > e.clientWidth + 6, fade: e.classList.contains('ovR10'), left: e.classList.contains('ovL10') } }));
    ok(rows.every(r => !r.more || (r.fade && !r.left)), 'a row with more to the right fades at its right edge (' + rows.map(r => r.q + (r.more ? ' scrolls' : ' fits')).join(', ') + ')');
    await page.evaluate(() => { const e = document.querySelector('#b8Dock .tools8'); e.scrollLeft = 9999; e.dispatchEvent(new Event('scroll')) }); await page.waitForTimeout(200); const sl = await page.evaluate(() => document.querySelector('#b8Dock .tools8').scrollLeft);
    await B(page, 'T.sel(2)'); await page.waitForTimeout(700); const sl2 = await page.evaluate(() => ({ x: document.querySelector('#b8Dock .tools8').scrollLeft, left: document.querySelector('#b8Dock .tools8').classList.contains('ovL10') }));
    ok(sl > 20 ? sl2.x === sl && sl2.left : true, 'the tools row stays where you scrolled it when the screen redraws (' + sl + ' → ' + sl2.x + ' px), and fades on the left once scrolled');
    await B(page, 'T.desel()'); await click(page, '#b8Dock [data-b8="add"]'); await page.waitForTimeout(600); await click(page, '#b8Lib .lbB8 [data-b8it]'); await page.waitForTimeout(800);
    ok(await page.evaluate(() => document.querySelector('#b8Tour').hidden), 'the welcome card steps aside as soon as a piece is added'); await page.screenshot({ path: SH + 'v101_builder_390x844.png' });
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- G. four screen sizes
  if (ONLY.includes('G')) {
    for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1200, 800]]) {
      const { browser, page, errors } = await builder({ w, h, mobile: w < 1000 }); const s = await B(page, 'T.strip()');
      const t0 = await page.evaluate(() => { const d = document.querySelector('#b8Dock').getBoundingClientRect(); return d.width });
      const r = await page.evaluate(() => { const e = document.querySelector('#bst10'), q = e.getBoundingClientRect(), top = document.querySelector('#b8Top').getBoundingClientRect(), dock = document.querySelector('#b8Dock').getBoundingClientRect(); return { in: q.left >= -1 && q.right <= innerWidth + 1 && q.height > 10, over: document.documentElement.scrollWidth - innerWidth, topIn: top.right <= innerWidth + 1, dockIn: dock.bottom <= innerHeight + 1 && dock.height < innerHeight * .62 } });
      ok(s && s.chips >= 5 && r.in && r.over <= 1 && r.topIn && r.dockIn && t0 > w * .4 && errors.length === 0, w + '×' + h + ': the numbers are on screen (' + (s.where === 'b8Dock' ? 'above the timeline' : 'in the top bar') + '), nothing spills off the side, no errors' + (errors.length ? ': ' + errors[0].slice(0, 200) : '')); await page.screenshot({ path: SH + 'v101_builder_' + w + 'x' + h + '.png' }); await browser.close();
    }
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e.stack || e.message).slice(0, 600)); process.exit(1) });
