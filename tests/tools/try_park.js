// Developer tool: open My Park, build a small park, run it and report state, errors and a screenshot.
const path = require('path'), fs = require('fs');
const { open } = require('../harness');
(async () => {
  const w = +process.argv[2] || 1200, h = +process.argv[3] || 800, SH = path.join(__dirname, '..', 'shots'); fs.mkdirSync(SH, { recursive: true });
  const { browser, page, errors, warns } = await open(path.join(__dirname, '..', '..', 'coaster_lab_v10_0.html'), { w, h, mobile: w < 700 });
  const T = (f, a) => page.evaluate(f, a), log = (m, x) => console.log(m, typeof x === 'string' ? x : JSON.stringify(x));
  log('fresh', await T(() => window.__coasterDebug.v80.v10.ty.fresh('career', 60000)));
  await page.waitForTimeout(1500); log('errors after open', errors.slice(0, 5));
  await page.screenshot({ path: path.join(SH, 'park_empty.png') });
  const ty = 'window.__coasterDebug.v80.v10.ty';
  log('carousel', await T(() => window.__coasterDebug.v80.v10.ty.build('carousel', 21, 40, 0)));
  log('path', await T(() => window.__coasterDebug.v80.v10.ty.path(24, 45, 24, 38)));
  log('path2', await T(() => window.__coasterDebug.v80.v10.ty.path(24, 39, 20, 39)));
  log('burger', await T(() => window.__coasterDebug.v80.v10.ty.build('burger', 25, 42, 0)));
  log('drinks', await T(() => window.__coasterDebug.v80.v10.ty.build('drinks', 25, 40, 0)));
  log('toilet', await T(() => window.__coasterDebug.v80.v10.ty.build('toilet', 23, 44, 0)));
  log('objs', await T(() => window.__coasterDebug.v80.v10.ty.objs()));
  log('errors', errors.slice(0, 8));
  for (let k = 0; k < 4; k++) { log('ff', await T(() => { const s = window.__coasterDebug.v80.v10.ty.ff(30); delete s.led; return s })); }
  log('carousel obj', await T(() => window.__coasterDebug.v80.v10.ty.obj(1)));
  log('guests', (await T(() => window.__coasterDebug.v80.v10.ty.guests())).slice(0, 8));
  log('thoughts', await T(() => window.__coasterDebug.v80.v10.ty.thoughts()));
  await T(() => window.__coasterDebug.v80.v10.ty.cam(-4, 70, 40, .8, 0)); await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SH, 'park_small.png') });
  log('perf', await T(() => window.__coasterDebug.v80.v10.ty.perf()));
  log('errors final', errors.slice(0, 10)); log('warns', warns.filter(x => !/GPU stall|GL Driver/.test(x)).slice(0, 10));
  await browser.close();
})();
