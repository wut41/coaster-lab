// Coaster Lab 9.0: builder levels, one-card-per-cause diagnostics, shape-preserving repairs + undo, starter blueprints,
// closed-circuit sketches, ride fares, guest speech bubbles, save compatibility with 8.6, and four screen sizes.
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v9_0.html', OLD = ROOT + 'coaster_lab_v8_6.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const until = async (page, f, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await page.evaluate(f)) return true; await page.waitForTimeout(250) } return false };
(async () => {
  // ---------- A. Track Builder 5.0 (desktop size so both side panels are open)
  {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
    const X = (f, a) => page.evaluate(f, a);
    await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1200);
    await X(() => { const t = document.querySelector('#b8Tour'); if (t) t.hidden = true });
    ok(await X(() => window.__coasterDebug.v80.bld.state().editing), 'builder opens');
    ok(await X(() => window.__coasterDebug.v80.v90.lvl()) === 'beginner', 'a new player starts in Beginner');
    const chips = () => X(() => [...document.querySelectorAll('#b8Lib .lbC8 button')].map(b => b.dataset.b8lib || 'MORE'));
    const keys = () => X(() => [...new Set([...document.querySelectorAll('#b8Ins [data-b8pk]')].map(e => e.dataset.b8pk))]);
    const sel = () => X(() => { window.__coasterDebug.v80.bld.range(1, 1) });
    const c0 = await chips(); ok(c0.includes('MORE') && !c0.includes('xtreme') && !c0.includes('launch') && c0.includes('blue') && c0.includes('hills'), 'Beginner library: essentials + a More chip (' + c0.length + ' chips)');
    await sel(); await page.waitForTimeout(300); const k0 = await keys(), n0 = await X(() => document.querySelectorAll('#b8Ins .nm8').length);
    const acts = () => X(() => [...document.querySelectorAll('#b8Dock .sel8 [data-b8]')].map(b => b.dataset.b8));
    const a0 = await acts(); ok(a0.includes('dup') && a0.includes('del') && !a0.includes('mirror') && !a0.includes('saveBp'), 'Beginner selection bar: duplicate / smooth / height / delete only');
    await X(() => document.querySelector('#b8Lib .more9').click()); await page.waitForTimeout(300);
    ok(await X(() => window.__coasterDebug.v80.v90.lvl()) === 'intermediate', 'the More chip switches to Intermediate'); await X(() => window.__coasterDebug.v80.v90.level('beginner')); await page.waitForTimeout(200);
    await X(() => document.querySelector('#b8Top .b8lv').click()); await page.waitForTimeout(200);
    ok(await X(() => document.querySelectorAll('#b8Top .mn8 .lv9').length) === 3, 'level button opens a menu with three levels');
    await X(() => document.querySelector('#b8Top .mn8 [data-v="intermediate"]').click()); await page.waitForTimeout(300);
    ok(await X(() => window.__coasterDebug.v80.v90.lvl()) === 'intermediate' && /intermediate/.test(await X(() => localStorage.getItem('coasterlab.v80.settings'))), 'Intermediate chosen from the menu and saved');
    const c1 = await chips(); await sel(); await page.waitForTimeout(300); const k1 = await keys(), n1 = await X(() => document.querySelectorAll('#b8Ins .nm8').length), a1 = await acts();
    ok(!c1.includes('MORE') && c1.includes('xtreme') && c1.includes('launch') && c1.length > c0.length, 'Intermediate library shows every category (' + c1.length + ')');
    ok(k1.length > k0.length && n1 === 0 && n0 === 0, `Intermediate shows more settings than Beginner (${k0.join(',')} → ${k1.join(',')}), still without number boxes`);
    ok(a1.includes('mirror') && a1.includes('reverse') && a1.includes('saveBp'), 'Intermediate selection bar adds copy / mirror / reverse / blueprint');
    await X(() => window.__coasterDebug.v80.v90.level('advanced')); await sel(); await page.waitForTimeout(300); const k2 = await keys(), n2 = await X(() => document.querySelectorAll('#b8Ins .nm8').length);
    ok(k2.length >= k1.length && n2 > 0, 'Advanced adds exact number boxes (' + n2 + ')');
    await X(() => window.__coasterDebug.v80.v90.level('beginner'));
    // diagnostics: one card per root cause
    await X(() => window.__coasterDebug.v80.v90.load([['station', {}]])); await page.waitForTimeout(500);
    let raw = await X(() => window.__coasterDebug.v80.bld.issues()), grp = await X(() => window.__coasterDebug.v80.bld.groups());
    ok(raw.some(i => i.code === 'stall') && raw.some(i => i.code === 'noenergy') && !grp.some(g => g.code === 'stall') && grp.find(g => g.code === 'noenergy').also.includes('stall'), 'blank coaster: "runs out of speed" is folded into its cause "nothing gets the train moving"');
    const OUT = [['station', { sx: 20 }], ['lift', {}], ['drop', {}], ['hill', {}], ['hill', {}]];
    await X(els => window.__coasterDebug.v80.v90.load(els), OUT); await page.waitForTimeout(600);
    raw = await X(() => window.__coasterDebug.v80.bld.issues()); grp = await X(() => window.__coasterDebug.v80.bld.groups());
    const rawOut = raw.filter(i => i.code === 'outside').length, gOut = grp.filter(g => g.code === 'outside');
    ok(rawOut >= 2 && gOut.length === 1 && /^Pieces? /.test(gOut[0].where) && /past the edge/.test(gOut[0].amt), `${rawOut} "outside the park" reports become 1 card: "${gOut[0] && gOut[0].where}" — ${gOut[0] && gOut[0].amt}`);
    await X(() => document.querySelector('#b8Ins [data-b8tab="check"]').click()); await page.waitForTimeout(300);
    const cards = await X(() => document.querySelectorAll('#b8Ins .is8.crit').length), badge = await X(() => +(document.querySelector('#b8Ins [data-b8tab="check"] em') || {}).textContent);
    ok(cards === grp.filter(g => g.sev === 'crit').length && badge === cards, `Check tab shows ${cards} must-fix card(s) and the badge agrees (${badge})`);
    // repair: slides the coaster back inside, changes no piece, and Undo restores it
    const before = await X(() => window.__coasterDebug.v80.v90.design());
    const t0 = Date.now(); await X(id => { window.__coasterDebug.v80.bld.act('fixOne', id) }, gOut[0].id);
    ok(await until(page, () => { const r = window.__coasterDebug.v80.bld.state().repair; return r && !r.busy }, 240000), '“Fix it for me” on the grouped card finishes with a preview (' + Math.round((Date.now() - t0) / 1000) + ' s in the test browser)');
    await X(() => window.__coasterDebug.v80.bld.act('pvApply')); await page.waitForTimeout(600);
    const after = await X(() => window.__coasterDebug.v80.v90.design()), iss2 = await X(() => window.__coasterDebug.v80.bld.issues());
    const same = JSON.stringify(before.els.slice(1).map(e => e.p)) === JSON.stringify(after.els.slice(1).map(e => e.p));
    ok(!iss2.some(i => i.code === 'outside'), 'after the repair nothing is outside the park');
    ok(same && (before.els[0].p.sx !== after.els[0].p.sx || before.els[0].p.sz !== after.els[0].p.sz || before.els[0].p.dir0 !== after.els[0].p.dir0), `the repair only moved the coaster (station ${before.els[0].p.sx},${before.els[0].p.sz} → ${after.els[0].p.sx},${after.els[0].p.sz}); every piece kept its shape`);
    await X(() => window.__coasterDebug.v80.bld.act('undo')); await page.waitForTimeout(500);
    ok(JSON.stringify((await X(() => window.__coasterDebug.v80.v90.design())).els.map(e => e.p)) === JSON.stringify(before.els.map(e => e.p)), 'Undo puts the coaster back exactly as it was before the repair');
    await X(() => window.__coasterDebug.v80.bld.act('redo')); await page.waitForTimeout(500);
    // playtest and back
    await X(() => window.__coasterDebug.v80.bld.play()); await page.waitForTimeout(900); ok(await X(() => window.__coasterDebug.v80.bld.state().mode) === 'play', 'repaired coaster can be playtested');
    await X(() => window.__coasterDebug.v80.bld.build()); await page.waitForTimeout(500);
    // starter blueprints
    const st = await X(() => window.__coasterDebug.v80.v90.starters()); ok(st.length === 3 && st.every(s => s.crit === 0 && s.warn === 0), 'three starter blueprints, each with no must-fix problems and no warnings: ' + st.map(s => s.id).join(', '));
    await X(() => document.querySelector('#b8Lib [data-b8lib="blue"]').click()); await until(page, () => { const a = [...document.querySelectorAll('#b8Lib .st9')]; return a.length > 5 && a.every(e => / long /.test(e.textContent)) }, 30000);
    const facts = await X(() => [...document.querySelectorAll('#b8Lib .st9')].map(e => e.textContent)); ok(facts.length >= 21 && facts.every(t => / long · .* tall · /.test(t)), 'every ready-made layout lists its measured length, height, speed and thrill, e.g. "' + facts[0] + '"');
    ok(/Starter/.test(await X(() => document.querySelector('#b8Lib .lb8.bp b').textContent)), 'starter layouts are listed first');
    await page.screenshot({ path: SH + 't6_builder_1200.png' });
    await X(() => window.__coasterDebug.v80.bld.act('exit')); await page.waitForTimeout(600);
    ok(errors.length === 0, 'builder: console errors ' + errors.length); errors.slice(0, 4).forEach(e => console.log('   ', e.slice(0, 300))); await browser.close();
  }
  // ---------- B. Sketch-to-Coaster: drawings that come back to where they started
  {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 });
    const res = await page.evaluate(async () => {
      const d = window.__coasterDebug.v80.v90, sk = (pts, side) => ({ v: 1, top: [{ pts, r: 6 }], side: side ? [{ pts: side }] : [], t: 1 });
      const circ = (r, f = 1) => { const o = []; for (let i = 0; i <= 90 * f; i++) { const a = i / 90 * 2 * Math.PI; o.push([r * Math.cos(a), r * Math.sin(a)]) } return o };
      const poly = (V, per = 12) => { const o = []; for (let i = 0; i < V.length; i++) { const a = V[i], b = V[(i + 1) % V.length]; for (let t = 0; t < per; t++)o.push([a[0] + (b[0] - a[0]) * t / per, a[1] + (b[1] - a[1]) * t / per]) } return o };
      const hills = [[0, 1], [.05, 2], [.18, 30], [.3, 3], [.45, 15], [.6, 3], [.75, 9], [.9, 3], [1, 3]], R = {};
      R.circle = await d.sketch(sk(circ(50))); R.overlap = await d.sketch(sk(circ(55, 1.12))); R.square = await d.sketch(sk(poly([[-50, -50], [50, -50], [50, 50], [-50, 50]])));
      R.star = await d.sketch(sk(poly([[0, 70], [15, 20], [65, 20], [25, -10], [40, -60], [0, -30], [-40, -60], [-25, -10], [-65, 20], [-15, 20]], 8)));
      R.circleHills = await d.sketch(sk(circ(55), hills)); R.open = await d.sketch(sk(circ(55, .7))); R.tiny = await d.sketch(sk(circ(4))); R.ring = await d.sketch(sk(circ(20))); return R });
    for (const k of ['circle', 'overlap', 'square', 'star', 'circleHills']) ok(res[k].ok && res[k].closed && res[k].crit === 0, `closed drawing "${k}" becomes a rideable circuit (${res[k].crit} must-fix, ${res[k].warn} warnings, ${res[k].len} m)`);
    ok(res.circle.notes.some(n => /complete circuit/.test(n)), 'the studio says it treated the drawing as a complete circuit');
    ok(res.open.ok && !res.open.closed && res.open.crit === 0, 'an open drawing is left as drawn (not trimmed) and still builds');
    ok(!res.tiny.ok && res.tiny.why.length > 20, 'a far too small drawing is refused with an explanation: "' + (res.tiny.why || '').slice(0, 60) + '…"');
    ok(!res.ring.ok && /small ring/.test(res.ring.why), 'a small ring is refused with what to draw instead: "' + (res.ring.why || '').slice(0, 70) + '…"');
    // the studio itself: example → build → preview is rideable
    await page.evaluate(() => { const s = window.__coasterDebug.v80.v85.sk; s.open(); s.ex(1) }); await page.waitForTimeout(800);
    ok(await page.evaluate(() => { const s = window.__coasterDebug.v80.v85.sk.state(); return s.open && s.int && s.int.ok }), 'Sketch Studio opens and still reads its own examples');
    await page.evaluate(() => window.__coasterDebug.v80.v85.sk.close()); await page.waitForTimeout(400);
    ok(errors.length === 0, 'sketch: console errors ' + errors.length); errors.slice(0, 4).forEach(e => console.log('   ', e.slice(0, 300))); await browser.close();
  }
  // ---------- C. Park: ride fares and guest speech bubbles
  {
    const quiet = { 'coasterlab.v72.park': JSON.stringify({ v: 1, paused: true }), 'coasterlab.v80.settings': JSON.stringify({ events: false }) };// same start in both versions: clock stopped, no random events
    const day = async (file, fare) => { const { browser, page, errors } = await open(file, { w: 390, h: 844, storage: quiet }); const r = await page.evaluate(f => { const d = window.__coasterDebug; d.v80.seed(7); d.v72.simSet({ price: { ticket: 25, ride: f } }); d.v72.simRun(1440); const h = JSON.parse(d.v80.simSnap()).hist.slice(-1)[0]; return { inc: Math.round(h.income), v: Math.round(h.visitors), th: d.v80.v90 ? Object.keys(d.v80.v90.thoughts()) : [] } }, fare); await browser.close(); return { ...r, errors } };
    const o1 = await day(OLD, 1), n1 = await day(F, 1), n7 = await day(F, 7), n20 = await day(F, 20), o20 = await day(OLD, 20);
    ok(n1.inc === o1.inc && n1.v === o1.v, `at the default $1 fare a seeded park day is identical to 8.6 (income ${o1.inc} → ${n1.inc}, visitors ${o1.v} → ${n1.v})`);
    ok(n7.inc > n1.inc * 1.2 && n20.inc < n7.inc * .8, `fares have a sweet spot: day income $1 ${n1.inc} · $7 ${n7.inc} · $20 ${n20.inc}`);
    ok(o20.inc > n20.inc * 3, `the 8.6 "always charge the maximum" exploit is gone ($20 fare: ${o20.inc} in 8.6 → ${n20.inc})`);
    ok(n20.th.some(t => /rides cost too much/.test(t)) && !n1.th.some(t => /rides cost too much/.test(t)), 'guests say "The rides cost too much" at $20, not at $1');
    const { browser, page, errors } = await open(F, { w: 844, h: 390 });
    const fw = await page.evaluate(() => { const d = window.__coasterDebug.v80.v90; return [d.fareW(0, 60, 1), d.fareW(1, 60, 1), d.fareW(6, 60, 1), d.fareW(6, 90, 1), d.fareW(20, 60, 1)] });
    ok(fw[0] === 1 && fw[1] === 1 && fw[2] < 1 && fw[3] > fw[2] && fw[4] < .1, 'willingness to pay: free/$1 everyone rides, better rides keep more riders at $6 (' + fw.map(x => x.toFixed(2)).join(' / ') + ')');
    await page.evaluate(() => { const d = window.__coasterDebug; d.v80.openPk('hq'); d.v80.hqGo('money') }); await page.waitForTimeout(700);
    ok(/worth about/.test(await page.evaluate(() => (document.querySelector('#fare90') || {}).textContent || '')), 'Park HQ → Money explains what guests think a ride is worth');
    await page.evaluate(() => { document.querySelector('#pk72 [data-x="close"]').click(); const d = window.__coasterDebug; d.v72.simSet({ min: 13 * 60 }); d.v72.simRun(60); d.v72.look(16, .5, .6) });
    const seen = await until(page, () => window.__coasterDebug.v80.bubbles().live.length > 0, 60000), b = await page.evaluate(() => window.__coasterDebug.v80.bubbles());
    ok(seen && b.parent && b.pool <= 4, 'guests show speech bubbles in the park (pool of ' + b.pool + '): ' + JSON.stringify(b.live));
    await page.screenshot({ path: SH + 't6_bubbles_844.png' });
    await page.evaluate(() => window.__coasterDebug.v80.v90.bubblesOn(false)); await page.waitForTimeout(600);
    ok(await page.evaluate(() => window.__coasterDebug.v80.bubbles().live.length) === 0, 'switching bubbles off in Settings hides them');
    ok(errors.length === 0, 'park: console errors ' + errors.length); errors.slice(0, 4).forEach(e => console.log('   ', e.slice(0, 300))); await browser.close();
  }
  // ---------- D. Saves made by 8.6 open in 9.0 untouched; 9.0 settings do not upset 8.6
  {
    const design = { v: 2, name: 'Old Faithful', els: [{ t: 'station', p: {} }, { t: 'lift', p: { h: 22, a: 45 } }, { t: 'drop', p: { h: 21, a: 55 } }, { t: 'turn', p: { dir: 'R', ang: 180, r: 16 } }, { t: 'airtime', p: { h: 6, len: 44 } }] };
    const store = { 'coasterlab.designs.v2': JSON.stringify({ v: 2, designs: [{ id: 'old1', name: 'Old Faithful', t: 1700000000000, design }] }), 'coasterlab.draft.v2': JSON.stringify({ design, id: 'old1', saved: '' }),
      'coasterlab.v80.settings': JSON.stringify({ bLevel: 'advanced', note: 'important', feel: false }), 'coasterlab.v72.park': JSON.stringify({ v: 1, name: 'My Old Park', day: 12, min: 600, balance: 123456, price: { ticket: 31, ride: 3 } }), 'coasterlab.v80.bWelcome': '1' };
    const { browser, page, errors } = await open(F, { w: 390, h: 844, storage: store });
    const s = await page.evaluate(() => ({ lvl: window.__coasterDebug.v80.v90.lvl(), sim: window.__coasterDebug.v72.sim(), designs: localStorage.getItem('coasterlab.designs.v2') }));
    ok(s.lvl === 'advanced' && Math.abs(s.sim.bal - 123456) < 2000 && s.sim.day === 12, `8.6 settings and park carried over (level ${s.lvl}, day ${s.sim.day}, balance ${s.sim.bal})`);
    await page.evaluate(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1200);
    const st = await page.evaluate(() => window.__coasterDebug.v80.bld.state()); ok(st.editing && st.name === 'Old Faithful' && st.n === 5, 'the 8.6 draft coaster opens in the 9.0 builder (' + st.name + ', ' + st.n + ' pieces)');
    await page.evaluate(() => window.__coasterDebug.v80.bld.act('exit')); await page.waitForTimeout(700);
    const kept = await page.evaluate(() => { const o = JSON.parse(localStorage.getItem('coasterlab.designs.v2')); return o && o.v === 2 && o.designs.some(x => x.id === 'old1' && x.design.els.length === 5) }); ok(kept, 'the saved 8.6 coaster is still in the saved list after using 9.0');
    await page.click('#setBtn'); await page.waitForTimeout(400);
    ok(await page.evaluate(() => { const b = [...document.querySelectorAll('#ov7B [data-o80="bLevel"]')]; const r = b.length === 3 && b.map(x => x.dataset.v).join() === 'beginner,intermediate,advanced' && b[2].classList.contains('on'); document.querySelector('#ov7X').click(); return r }), 'Settings offers the same three builder levels and shows the current one');
    ok(errors.length === 0, 'save compatibility: console errors ' + errors.length); await browser.close();
    const ret = await open(F, { w: 390, h: 844, storage: { 'coasterlab.v80.bWelcome': '1' } });
    await ret.page.evaluate(() => window.__coasterDebug.v80.v86.openBuilder()); await ret.page.waitForTimeout(1000); await ret.page.evaluate(() => window.__coasterDebug.v80.bld.act('add')); await ret.page.waitForTimeout(300);
    ok(await ret.page.evaluate(() => window.__coasterDebug.v80.v90.lvl() === 'intermediate' && !!document.querySelector('#b8Lib [data-b8lib="evo"]') && !!document.querySelector('#b8Lib [data-b8lib="xtreme"]')), 'a returning 8.6 builder lands on Intermediate once, so no library tab (Evolve, Extreme, …) disappears');
    await ret.page.evaluate(() => window.__coasterDebug.v80.v90.level('beginner')); await ret.browser.close();
    const back = await open(OLD, { w: 390, h: 844, storage: { 'coasterlab.v80.settings': JSON.stringify({ bLevel: 'intermediate', bubbles: false }) } });
    ok(back.errors.length === 0 && await back.page.evaluate(() => window.__booted === true), 'going back: 8.6 starts cleanly with settings written by 9.0'); await back.browser.close();
  }
  // ---------- F. Replay (9.0.1): the bar with pause / seek / speeds / Exit is there, chapter markers too, and Exit returns to the ride
  for (const [w, h] of [[820, 1180], [390, 844]]) {
    const { browser, page, errors } = await open(F, { w, h });
    const got = await until(page, () => !!window.__coasterDebug.v72.rec().last, 150000);   // a real lap has to finish first
    await page.evaluate(() => { const s = document.querySelector('#sum7'); if (s) s.hidden = true; window.__coasterDebug.v72.useCam('chase'); window.__coasterDebug.v72.cineOn(true); window.__coasterDebug.v72.replayStart() }); await page.waitForTimeout(1500);
    const r = await page.evaluate(() => { const q = s => document.querySelector('#rep72 ' + s), b = document.querySelector('#rep72').getBoundingClientRect(); return { on: window.__coasterDebug.v72.replay().on, name: (q('.rpN') || {}).textContent, pp: !!q('[data-rp="pp"]'), seek: !!q('[data-rp="seek"]'), exit: !!q('[data-rp="stop"]'), x2: !!q('.rpS [data-v="2"]'), ch: document.querySelectorAll('#rep72 .rpC85 button').length, fits: b.left >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1 && b.width > 100 } });
    ok(got && r.on && r.name === 'Looping Adventure' && r.pp && r.seek && r.exit && r.x2, `${w}×${h}: replay shows its bar (name, pause, seek, speeds with 2×, Exit)`);
    ok(r.ch > 0 && r.fits, `${w}×${h}: ${r.ch} chapter markers, bar fully on screen`);
    await page.evaluate(() => document.querySelector('#rep72 .rpC85 button:last-child').click()); await page.waitForTimeout(500); const t1 = await page.evaluate(() => window.__coasterDebug.v72.replay().t);
    ok(t1 > 3, `${w}×${h}: tapping a chapter jumps there (${t1.toFixed(1)} s)`);
    await page.screenshot({ path: SH + `t6_replay_${w}x${h}.png` });
    await page.evaluate(() => document.querySelector('#rep72 [data-rp="stop"]').click()); await page.waitForTimeout(600);
    ok(await page.evaluate(() => { const p = window.__coasterDebug.v72.replay(); return !p.on && document.querySelector('#rep72').hidden }), `${w}×${h}: Exit returns to the live ride`);
    await page.evaluate(() => window.__coasterDebug.v72.replayStart()); await page.waitForTimeout(900);
    ok(await page.evaluate(() => document.querySelectorAll('#rep72 .rpN').length === 1 && document.querySelectorAll('#rep72 .rpC85').length === 1), `${w}×${h}: a second replay reuses the same bar`);
    ok(errors.length === 0, `${w}×${h}: replay console errors and caught task failures: ${errors.length}`); errors.slice(0, 3).forEach(e => console.log('   ', e.slice(0, 300))); await browser.close();
  }
  // ---------- E. Four screen sizes: start, ride, builder top bar and level menu stay on screen
  for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1200, 800]]) {
    const { browser, page, errors } = await open(F, { w, h, mobile: w < 1000, storage: { 'coasterlab.v80.bWelcome': '1' } });
    const X = (f, a) => page.evaluate(f, a);
    // the ride itself: the train moves, the telemetry follows it, and every camera button gives a finite view
    const s0 = await X(() => window.__coasterDebug.v72.ops().t0[2]); await page.waitForTimeout(1500); const s1 = await X(() => window.__coasterDebug.v72.ops().t0[2]);
    const cams = []; for (const m of ['side', 'front', 'ride', 'orbit', 'chase']) { await X(m => document.querySelector(`[data-cam="${m}"]`).click(), m); await page.waitForTimeout(350); cams.push(await X(() => { const c = window.__coasterDebug.v72.cam(); return c.mode + (c.fin ? '' : '!NaN') })) }
    ok(s1 !== s0 && cams.join(',') === 'side,front,ride,orbit,chase', `${w}×${h}: train is moving and the five camera buttons switch (${cams.join(', ')})`);
    await X(() => window.__coasterDebug.select(6)); await page.waitForTimeout(500); ok(await X(() => window.__coasterDebug.state().cur) === 6, `${w}×${h}: switching to another ride works`);
    const cam = await X(() => window.__coasterDebug.v72.cam());
    await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1200);
    const lay = await X(() => { const iw = innerWidth, ih = innerHeight, bad = []; document.querySelectorAll('#b8Top > *, #b8Dock .tools8 > button').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width) return; if (r.left < -1 || r.right > iw + 1 || r.top < -1 || r.bottom > ih + 1) if (!e.closest('.tools8')) bad.push((e.dataset.b8 || e.className) + ' ' + Math.round(r.left) + '–' + Math.round(r.right)) }); return { bad, over: document.documentElement.scrollWidth - iw } });
    ok(lay.bad.length === 0 && lay.over <= 0, `${w}×${h}: builder top bar fits the screen` + (lay.bad.length ? ' — off screen: ' + lay.bad.join('; ') : ''));
    await X(() => { const b = document.querySelector('#b8Top .b8lv') || document.querySelector('#b8Top [data-b8="menu"]'); b.click() }); await page.waitForTimeout(250);
    const mn = await X(() => { const m = document.querySelector('#b8Top .mn8'); if (!m) return null; const r = m.getBoundingClientRect(); return { l: r.left, r: r.right, b: r.bottom, n: m.querySelectorAll('.lv9').length, iw: innerWidth, ih: innerHeight } });
    ok(mn && mn.n === 3 && mn.l >= -1 && mn.r <= mn.iw + 1 && mn.b <= mn.ih + 1, `${w}×${h}: the three-level menu opens fully on screen`);
    await page.screenshot({ path: SH + `t6_builder_${w}x${h}.png` });
    await X(() => window.__coasterDebug.v80.bld.act('exit')); await page.waitForTimeout(500);
    ok(cam.fin && errors.length === 0, `${w}×${h}: camera finite, console errors ${errors.length}`); errors.slice(0, 3).forEach(e => console.log('   ', e.slice(0, 300))); await browser.close();
  }
})();
