// Developer tool: select rides in the real game, let them run, report errors and save screenshots to tests/shots/.
//   node tests/tools/shot_rides.js [name-filter] [cam=orbit|chase|ride|side|front] [w] [h] [wheel-delta, e.g. -600 = zoom in] [seconds to run]
const path = require('path'), fs = require('fs');
const { open } = require('../harness');
(async () => {
  const filter = (process.argv[2] || '').toLowerCase(), cam = process.argv[3] || 'orbit', w = +process.argv[4] || 1200, h = +process.argv[5] || 800;
  const SH = path.join(__dirname, '..', 'shots'); fs.mkdirSync(SH, { recursive: true });
  const { browser, page, errors } = await open(path.join(__dirname, '..', '..', 'coaster_lab_v10_0.html'), { w, h, mobile: w < 700 });
  const rides = await page.evaluate(() => window.__coasterDebug.v80.v10.rides());
  for (const r of rides) {
    if (filter && !r.name.toLowerCase().includes(filter)) continue;
    const n0 = errors.length;
    await page.evaluate(i => window.__coasterDebug.select(i), r.i); await page.waitForTimeout(900);
    await page.evaluate(c => { const b = document.querySelector('[data-cam="' + c + '"]'); if (b) b.click() }, cam);
    if (process.argv[6]) await page.evaluate(dz => document.querySelector('#scene canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: dz, bubbles: true, cancelable: true })), +process.argv[6]);
    await page.evaluate(n => window.__coasterDebug.v72.ff(n), +process.argv[7] || 14); await page.waitForTimeout(1200);
    const st = await page.evaluate(i => window.__coasterDebug.v80.v10.rideStats(i), r.i);
    const f = path.join(SH, 'ride_' + r.key + '_' + cam + '.png'); await page.screenshot({ path: f });
    console.log(`${errors.length > n0 ? 'FAIL' : 'ok  '} ${r.name} [${r.style}] ${JSON.stringify(st)}${errors.length > n0 ? '\n     ' + errors.slice(n0).join('\n     ').slice(0, 900) : ''}`);
  }
  await browser.close();
})();
