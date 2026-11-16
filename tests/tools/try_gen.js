const path = require('path');
const { open } = require('../harness');
(async () => {
  const { browser, page, errors } = await open(path.join(__dirname, '..', '..', 'coaster_lab_v10_0.html'), { w: 1200, h: 800, mobile: false, storage: { 'coasterlab.v80.bWelcome': '1', 'coasterlab.tut.v2': '1' } });
  const T = (f, a) => page.evaluate(f, a);
  await T(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1200);
  await T(() => { const t = document.querySelector('#b8Tour'); if (t) t.hidden = true });
  console.log('tab button', await T(() => !!document.querySelector('#b8Lib [data-b8lib="gen10"]')));
  await T(() => document.querySelector('#b8Lib [data-b8lib="gen10"]').click()); await page.waitForTimeout(400);
  console.log('tab body', await T(() => document.querySelector('#b8Lib').innerText.slice(0, 200).replace(/\n/g, ' | ')));
  for (const st of ['family', 'looper', 'launch', 'hyper', 'twister', 'woodie']) {
    const t0 = Date.now(); await T(s => window.__coasterDebug.v80.v10.genSet({ style: s, seed: 4242 }), st);
    const n = await T(() => window.__coasterDebug.v80.v10.genGo());
    const g = await T(() => window.__coasterDebug.v80.v10.gen()), chk = await T(() => window.__coasterDebug.v80.v10.genCheck());
    console.log(st, 'found', n, 'in', ((Date.now() - t0) / 1000).toFixed(1) + ' s', JSON.stringify(g.res.map(r => [r.style, r.m.len, r.m.h, r.m.inv, r.m.gMax, r.m.air, r.warn])), 'recheck', JSON.stringify(chk));
  }
  await T(() => window.__coasterDebug.v80.v10.genPv(0)); await page.waitForTimeout(800);
  console.log('preview bar', await T(() => !document.querySelector('#b8Pv').hidden && document.querySelector('#b8Pv').innerText.slice(0, 120).replace(/\n/g, ' | ')));
  await page.screenshot({ path: path.join(__dirname, '..', 'shots', 'gen_preview.png') });
  console.log('errors', errors.slice(0, 6));
  await browser.close();
})();
