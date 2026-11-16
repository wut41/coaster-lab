// Disaster OFF (and Earth gravity) must give bit-for-bit the same ride as v8.5
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
const run = async file => {
  const { browser, page, errors } = await open(file);
  const r = await page.evaluate(() => {
    const d = window.__coasterDebug, out = [];
    for (const i of [0, 1, 4, 8, 12, 18]) { d.select(i); d.v72.ff(3); const smp = []; for (let k = 0; k < 6; k++) { d.v72.ff(7); const st = d.state(); smp.push([+st.s.toFixed(6), +st.v.toFixed(6), +st.rideT.toFixed(4)]) } out.push([d.rides[i], smp]) }
    return out;
  });
  await browser.close(); return { r, errors };
};
(async () => {
  const a = await run(ROOT + 'coaster_lab_v8_5.html'), b = await run(ROOT + 'coaster_lab_v10_0.html');
  let same = true; a.r.forEach((x, i) => { const eq = JSON.stringify(x) === JSON.stringify(b.r[i]); if (!eq) same = false; console.log((eq ? 'SAME ' : 'DIFF ') + x[0] + '  v8.5 ' + JSON.stringify(x[1][5]) + '  v8.6 ' + JSON.stringify(b.r[i][1][5])) });
  console.log(same ? 'PASS rides identical with Disaster Mode off' : 'FAIL rides differ'); console.log('errors', a.errors.length, b.errors.length);
})();
