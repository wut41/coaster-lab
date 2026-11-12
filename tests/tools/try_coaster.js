const path = require('path'), fs = require('fs');
const { open } = require('../harness'), L = require('./park_lib');
(async () => {
  const w = +process.argv[2] || 1200, h = +process.argv[3] || 800, SH = path.join(__dirname, '..', 'shots');
  const { browser, page, errors } = await open(path.join(__dirname, '..', '..', 'coaster_lab_v10_0.html'), { w, h, mobile: w < 700 });
  const T = (f, a) => page.evaluate(f, a), log = (m, x) => console.log(m, typeof x === 'string' ? x : JSON.stringify(x));
  await T(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox'));
  await T(() => window.__coasterDebug.v80.v10.ty.path(24, 46, 24, 30));
  for (const [k, i, j] of [['c:Little Dipper', 14, 30], ['c:Cheddar Chase', 34, 30], ['carousel', 20, 40], ['burger', 25, 36], ['drinks', 25, 33], ['toilet', 23, 36], ['bench', 25, 43], ['tree', 26, 44], ['flowers', 22, 45]]) {
    const r = await T(L.place, [k, i, j, 8]); log('place ' + k, r);
    if (r.ok && !r.linked) log('  path tiles', await T(L.connect, [r.id]));
  }
  log('objs', (await T(() => window.__coasterDebug.v80.v10.ty.objs())).map(o => o.k + '@' + o.x + ',' + o.z + 'r' + o.r).join(' '));
  for (let k = 0; k < 5; k++) { const s = await T(() => { const s = window.__coasterDebug.v80.v10.ty.ff(30); delete s.led; return s }); log('ff', [s.min, s.guests, 'q' + s.inQ, 'ride' + s.riding, 'rating' + s.rating, 'happy' + s.happy, 'inc' + s.inc]) }
  for (const id of [1, 2, 3, 4]) log('obj ' + id, await T(id => window.__coasterDebug.v80.v10.ty.obj(id), id));
  log('thoughts', await T(() => window.__coasterDebug.v80.v10.ty.thoughts()));
  await T(() => window.__coasterDebug.v80.v10.ty.cam(4, 20, 70, .75, 0)); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(SH, 'park_coasters.png') });
  await T(() => window.__coasterDebug.v80.v10.ty.cam(-38, 6, 26, .5, .6)); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(SH, 'park_dipper.png') });
  log('perf', await T(() => window.__coasterDebug.v80.v10.ty.perf())); log('errors', errors.slice(0, 8));
  await browser.close();
})();
