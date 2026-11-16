const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
const F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  for (const [w, h] of [[390, 844], [844, 390]]) {
    const { browser, page, errors } = await open(F, { w, h, storage: { 'coasterlab.tut.v2': '1', 'coasterlab.v80.bWelcome': '1' } });// a returning builder (9.0: Intermediate, so the 🧬 Evolve tab is in the library)
    const X = (f, a) => page.evaluate(f, a), V6 = 'window.__coasterDebug.v80.v86';
    ok(await X(() => window.__coasterDebug.v80.v86.openBuilder()), `${w}x${h} builder open`);
    await page.waitForTimeout(800);
    await X(() => { document.querySelectorAll('#b8Tour,#dlg7').forEach(e => e.hidden = true) });
    const ms = await X(() => window.__coasterDebug.v80.v86.time(4)); console.log('   one full check (inspect) takes', ms.toFixed(1), 'ms here (headless, software GPU)');
    const baseKey = await X(() => window.__coasterDebug.v80.v86.key());
    // open the 🧬 Evolve tab like a player
    await X(() => window.__coasterDebug.v80.bld.act('add')); await page.waitForTimeout(300);
    await page.click('[data-pick10="ideas"]'); await page.waitForTimeout(200); await page.click('[data-b8lib="evo"]'); await page.waitForTimeout(300);
    ok(await page.$('[data-evo86="go"]') != null, 'Evolve tab shows the Evolve button');
    await page.fill('[data-evo86="seed"]', '4242'); await page.dispatchEvent('[data-evo86="seed"]', 'change');
    await page.click('[data-evo86="gens"][data-v="6"]');
    // count frames while it runs: the screen must keep drawing
    await X(() => { window.__fr = { n: 0, max: 0, last: performance.now(), on: true }; const f = t => { const F = window.__fr; if (!F.on) return; F.max = Math.max(F.max, t - F.last); F.last = t; F.n++; requestAnimationFrame(f) }; requestAnimationFrame(f) });
    await page.click('[data-evo86="go"]'); await page.waitForTimeout(700);
    if (w === 390) await page.screenshot({ path: SH + 'evo_running.png' });
    const mid = await X(() => window.__coasterDebug.v80.v86.evo()); ok(mid.run && mid.run.tried > 0, 'running: ' + JSON.stringify(mid.run));
    ok(await X(() => /Evolving/.test(document.querySelector('#b8Pv').textContent) && !document.querySelector('#b8Pv').hidden), 'progress bar shown in the preview bar');
    await page.waitForFunction(() => !window.__coasterDebug.v80.v86.evo().run, null, { timeout: 120000 });
    const fr = await X(() => { window.__fr.on = false; return window.__fr });
    const E1 = await X(() => window.__coasterDebug.v80.v86.evo());
    console.log('   run:', JSON.stringify(E1.last), 'frames drawn:', fr.n, 'longest frame gap:', fr.max.toFixed(0), 'ms');
    ok(E1.res.length >= 1 && E1.res.length <= 3, 'best ' + E1.res.length + ' results: ' + E1.res.map(r => r.sc.toFixed(1) + ' thrill ' + r.st.thrill + ' ' + r.st.g + 'G').join(' | '));
    ok(E1.res.every(r => r.sc >= E1.res[E1.res.length - 1].sc) && (E1.last.base == null || E1.res[0].sc >= E1.last.base), 'sorted, and #1 beats the starting coaster (' + E1.last.base + ' → ' + (E1.res[0] && E1.res[0].sc) + ')');
    const chk = await X(() => window.__coasterDebug.v80.v86.evoCheck()); ok(chk.every(c => c.crit === 0 && c.san), 'every result passes sanDesign + the full check (0 must-fix problems)');
    ok(fr.n > 20, 'screen kept drawing while evolving (' + fr.n + ' frames)');
    if (w === 390) await page.screenshot({ path: SH + 'evo_results.png' }); else await page.screenshot({ path: SH + 'evo_results_land.png' });
    // same seed again → same results
    await page.click('[data-evo86="go"]'); await page.waitForFunction(() => !window.__coasterDebug.v80.v86.evo().run, null, { timeout: 120000 });
    const E2 = await X(() => window.__coasterDebug.v80.v86.evo());
    ok(JSON.stringify(E2.res.map(r => [r.key, r.sc])) === JSON.stringify(E1.res.map(r => [r.key, r.sc])), 'same seed → identical results (repeatable)');
    // preview #1 → Place it → Undo
    const h0 = await X(() => window.__coasterDebug.bld.hist().i);
    await page.click('[data-evo86="pv"][data-v="0"]'); await page.waitForTimeout(500);
    let st = await X(() => window.__coasterDebug.v80.bld.state()); ok(st.pv && /Evolved/.test(st.pv.label), 'preview opened: ' + (st.pv && st.pv.label));
    ok(await X(() => /Place it/.test(document.querySelector('#b8Pv').textContent)), 'Place it / Cancel bar shown');
    if (w === 390) await page.screenshot({ path: SH + 'evo_preview.png' });
    await page.click('[data-b8="pvPlace"]'); await page.waitForTimeout(400);
    const k1 = await X(() => window.__coasterDebug.v80.v86.key()); ok(k1 === E1.res[0].key && (await X(() => window.__coasterDebug.bld.hist().i)) === h0 + 1, 'Place it applied the evolved design as one history step');
    ok((await X(() => Object.keys(window.__coasterDebug.v7.prg().ach))).includes('evo86'), 'achievement Mad scientist unlocked');
    await X(() => window.__coasterDebug.v80.bld.act('undo')); await page.waitForTimeout(400);
    ok((await X(() => window.__coasterDebug.v80.v86.key())) === baseKey, 'Undo brings the original coaster back');
    // preview #2 → Cancel
    await X(() => window.__coasterDebug.v80.v86.evoPv(1)); await page.waitForTimeout(300); await X(() => window.__coasterDebug.v80.bld.act('pvCancel')); await page.waitForTimeout(300);
    ok((await X(() => window.__coasterDebug.v80.v86.key())) === baseKey && !(await X(() => window.__coasterDebug.v80.bld.state())).pv, 'Cancel leaves the coaster unchanged');
    // different seed + family goal, and the time cap
    await X(() => window.__coasterDebug.v80.v86.evoSet({ goal: 'family', seed: 777, gens: 6 })); await X(() => window.__coasterDebug.v80.v86.evoGo());
    const E3 = await X(() => window.__coasterDebug.v80.v86.evo()); ok(E3.res.length > 0 && JSON.stringify(E3.res.map(r => r.key)) !== JSON.stringify(E1.res.map(r => r.key)), 'family goal / other seed gives other designs: comfort ' + E3.res.map(r => r.st.comfort).join(','));
    await X(() => window.__coasterDebug.v80.v86.evoSet({ goal: 'air', seed: 99, gens: 16, cap: 1500 })); await X(() => window.__coasterDebug.v80.v86.evoGo());
    const E4 = await X(() => window.__coasterDebug.v80.v86.evo()); ok(E4.last.capped && E4.last.ms < 4000, 'time cap stops a long run: ' + E4.last.ms + ' ms, capped=' + E4.last.capped);
    await X(() => window.__coasterDebug.v80.v86.evoSet({ cap: 25000 }));
    ok(errors.length === 0, `${w}x${h} console errors: ${errors.length}`); errors.slice(0, 5).forEach(e => console.log('   ', e.slice(0, 300)));
    await browser.close();
  }
})();
