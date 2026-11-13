// Coaster Lab 10.0: the ten new coasters, the two rebuilt flagships, the eight new train types and the 🎲 Generate tab.
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  // ---------- A. every 10.0 ride: registered, passes the builder's full check, completes a lap, loads without errors
  {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
    const X = (f, a) => page.evaluate(f, a), D = 'window.__coasterDebug.v80.v10';
    const rides = await X(() => window.__coasterDebug.v80.v10.rides());
    ok(rides.length === 12, '12 rides come from 10.0 (10 new + 2 rebuilt flagships): ' + rides.map(r => r.name).join(', '));
    ok(await X(() => window.__coasterDebug.rides.length) === 30, 'the game now has 30 rides (20 from 9.0 keep their numbers)');
    ok(JSON.stringify(await X(() => window.__coasterDebug.rides.slice(0, 20))) === JSON.stringify(['Looping Adventure', 'Canyon Rush', 'Sky Serpent', 'Mine Mountain', 'Inferno Vortex', 'Glacier Hyperion', 'Jungle Viper', 'Nebula', 'Titan', 'Phantom', 'Velocity', 'Tidal Breaker', 'Golden Dragon', 'Rainbow Road', 'Lunar Leap', 'The Void', 'Thunder Comet', 'Nova Giant', 'Void Runner', 'Skyfall']), 'the first 20 rides are in the same order as 9.0');
    const styles = await X(() => window.__coasterDebug.v80.v10.styles());
    ok(['dive', 'floorless', 'wing', 'bike', 'woodie', 'hyper', 'bullet', 'swing'].every(s => styles.includes(s)), 'eight new train types: ' + styles.join(', '));
    const used = new Set(rides.map(r => r.style)); ok(used.size >= 10, 'the 12 rides use ' + used.size + ' different train types');
    const sig = new Set();
    for (const r of rides) {
      const els = await X(k => window.__coasterDebug.v80.v10.design(k), r.key), free = r.key === 'Comet2' || r.key === 'Nova2';
      const m = await X(([e, n, f]) => window.__coasterDebug.v80.v10.measure(e, n, f), [els, r.name, free]);
      ok(m.crit === 0 && m.warn === 0 && !m.stall, `${r.name}: full check clean (${m.len} m, ${m.h} m tall, ${m.T} s, ${m.vmax} m/s, ${m.inv} inversions, G ${m.gMin}…${m.gMax})` + (m.issues.length ? ' ' + m.issues.join(' ') : ''));
      sig.add([Math.round(m.len / 20), Math.round(m.h / 3), m.inv, Math.round(m.vmax / 2)].join('|'));
    }
    ok(sig.size === 12, 'no two of the 12 rides share the same length / height / inversions / top speed');
    const n0 = errors.length;
    for (const r of rides) { await X(i => window.__coasterDebug.select(i), r.i); await page.waitForTimeout(350); await X(() => window.__coasterDebug.v72.ff(6)) }
    ok(errors.length === n0, 'selecting and running all 12 rides gives no errors' + (errors.length > n0 ? ': ' + errors.slice(n0, n0 + 3).join(' | ') : ''));
    // the 👁 Ride camera works with the new train types (it moves with the train and stays above ground)
    for (const name of ['Aurora Wing', 'Pendulum Pass', 'Talon Strike', 'Turbo Circuit']) {
      const r = rides.find(q => q.name === name); await X(i => window.__coasterDebug.select(i), r.i); await page.waitForTimeout(300);
      await X(() => document.querySelector('[data-cam="ride"]').click()); await X(() => window.__coasterDebug.v72.ff(8)); await page.waitForTimeout(400);
      const a = await X(() => window.__coasterDebug.v72.cam()); await X(() => window.__coasterDebug.v72.ff(4)); await page.waitForTimeout(400); const b = await X(() => window.__coasterDebug.v72.cam());
      ok(a && b && Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]) > 2 && isFinite(b.pos[1]), name + ': the ride camera follows the ' + r.style + ' train');
    }
    await X(() => document.querySelector('[data-cam="chase"]').click());
    // the Train Studio and the builder's Track look offer the new types
    // flagships: rebuilt on their old numbers
    const fl = await X(() => [16, 17].map(i => window.__coasterDebug.v80.v10.rideStats(i)));
    ok(fl[0].name === 'Thunder Comet' && fl[0].v > 36 && fl[0].h > 44 && fl[0].inv === 2, `Thunder Comet flagship: ${fl[0].v} m/s launch, ${fl[0].h} m top hat, ${fl[0].inv} inversions`);
    ok(fl[1].name === 'Nova Giant' && fl[1].h > 60 && fl[1].inv === 2, `Nova Giant flagship: ${fl[1].h} m tall, ${fl[1].inv} inversions (giant loop + zero-G hill)`);
    await X(() => window.__coasterDebug.select(17)); await page.waitForTimeout(600); await X(() => document.querySelector('[data-cam="orbit"]').click()); await X(() => window.__coasterDebug.v72.ff(20)); await page.waitForTimeout(800);
    await page.screenshot({ path: SH + 'v10_nova_giant.png' });
    ok(errors.length === 0, 'no errors in the rides section' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
  // ---------- B. 🎲 Generate in the Track Builder
  {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false, storage: { 'coasterlab.v80.bWelcome': '1', 'coasterlab.tut.v2': '1' } });
    const X = (f, a) => page.evaluate(f, a);
    await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1200); await X(() => { const t = document.querySelector('#b8Tour'); if (t) t.hidden = true });
    await X(() => window.__coasterDebug.v80.v10.builder.tab('ideas')); ok(await X(() => !!document.querySelector('#b8Lib [data-b8lib="gen10"]')), 'the builder library has a 🎲 Generate tab (also in Beginner)');
    await X(() => document.querySelector('#b8Lib [data-b8lib="gen10"]').click()); await page.waitForTimeout(300);
    ok(await X(() => document.querySelectorAll('#b8Lib [data-gen10="style"]').length) === 7, 'seven styles to choose from');
    const before = await X(() => JSON.stringify(window.__coasterDebug.v80.v90.design().els.map(e => [e.t, e.p])));
    for (const st of ['family', 'hyper']) {
      await X(s => window.__coasterDebug.v80.v10.genSet({ style: s, seed: 777 }), st); const t0 = Date.now(), n = await X(() => window.__coasterDebug.v80.v10.genGo()), chk = await X(() => window.__coasterDebug.v80.v10.genCheck());
      ok(n >= 1 && chk.every(c => c.crit === 0 && c.san), `Generate ${st}: ${n} coaster(s) in ${((Date.now() - t0) / 1000).toFixed(0)} s, all pass the full check and the import check`);
    }
    ok(await X(() => JSON.stringify(window.__coasterDebug.v80.v90.design().els.map(e => [e.t, e.p]))) === before, 'generating does not change your coaster');
    await X(() => window.__coasterDebug.v80.v10.genPv(0)); await page.waitForTimeout(700);
    ok(await X(() => !document.querySelector('#b8Pv').hidden), 'Preview opens the builder’s own preview bar (Place it / Cancel)');
    await page.screenshot({ path: SH + 'v10_generate.png' });
    await X(() => document.querySelector('#b8Pv [data-b8="pvPlace"], #b8Pv [data-b8="pvApply"]').click()); await page.waitForTimeout(700);
    const after = await X(() => JSON.stringify(window.__coasterDebug.v80.v90.design().els.map(e => [e.t, e.p])));
    ok(after !== before, 'Place it replaces the coaster with the generated one');
    await X(() => { const b = document.querySelector('#b8 [data-b8="undo"]'); if (b) b.click() }); await page.waitForTimeout(700);
    ok(await X(() => JSON.stringify(window.__coasterDebug.v80.v90.design().els.map(e => [e.t, e.p]))) === before, 'Undo brings the old coaster back exactly');
    ok(errors.length === 0, 'no errors in the generator section' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
})();
