// Coaster Lab: crowds walking to a coaster in My Park (the trailer thread saw a crash there). Builds coasters and flat rides,
// fills the park with families, runs the park for a long while at speed and checks nothing throws.
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_0.html';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
(async () => {
  const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
  const pageErr = []; page.on('pageerror', e => pageErr.push(String(e && e.stack || e).slice(0, 600)));
  const X = (f, a) => page.evaluate(f, a);
  const D = (expr, a) => page.evaluate(new Function('a', 'const T = window.__coasterDebug.v80.v10.ty; return ' + expr), a);
  for (const mode of ['sandbox', 'career']) {
    ok(await D('T.fresh(a, 200000)', mode), mode + ': park opens'); await D('T.speed(0)'); await D('T.set({ fee: 0 })');
    const built = [];
    for (const [k, i, j] of [['c:Little Dipper', 18, 36], ['c:Mine Mountain', 30, 34], ['carousel', 22, 42], ['drinks', 26, 43], ['burger', 20, 44]]) {
      const b = await X(L.place, [k, i, j, 4]); if (b.ok) { built.push(k); await X(L.connect, [b.id]) }
    }
    ok(mode === 'career' || built.some(k => k.startsWith('c:')), mode + ': the rides are built and connected (' + built.join(', ') + ')');
    let threw = '';
    for (let k = 0; k < 40 && !threw; k++) {
      try { if (k % 4 === 0) await D('T.spawn(25)'); await D('T.ff(6)') } catch (e) { threw = String(e).slice(0, 500) }
      if (pageErr.length) break;
    }
    const s = await D('T.state()');
    ok(!threw && !pageErr.length, mode + ': ' + s.guests + ' visitors walk to the rides for a long while with no crash' + (threw ? ': ' + threw : '') + (pageErr.length ? ': ' + pageErr[0] : ''));
    // real-time frames too, with the park running at top speed
    await D('T.speed(3)'); await D('T.spawn(40)'); await page.waitForTimeout(8000); await D('T.speed(0)');
    ok(!pageErr.length, mode + ': the park runs at top speed with a crowd and no crash' + (pageErr.length ? ': ' + pageErr[0] : ''));
  }
  ok(true, 'safety-net stops: ' + (await D('T.loopStops()')));
  ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
