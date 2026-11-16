// Developer tool: measure coaster designs with the game's own engine (generate → validate → simulated lap).
//   node tests/tools/probe_designs.js <designs.js> [name-filter]
// <designs.js> exports { Name: [[type, params], ...], ... }. Prints must-fix problems, warnings and ride stats for each,
// so a layout can be tuned before it is added to src/v10. Uses coaster_lab_v10_0.html (run `node build.mjs` first).
const path = require('path');
const { open } = require('../harness');
(async () => {
  const file = path.resolve(process.argv[2]), filter = process.argv[3];
  const designs = require(file);
  const { browser, page, errors } = await open(path.join(__dirname, '..', '..', 'coaster_lab_v10_0.html'), { w: 800, h: 600, mobile: false });
  for (const [name, els] of Object.entries(designs)) {
    if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;
    const m = await page.evaluate(([n, e]) => window.__coasterDebug.v80.v10.measure(e, n), [name, els]);
    if (!m.len) { console.log(`✗ ${name}: does not generate → ${m.issues.join(' | ')}`); continue }
    console.log(`${m.crit ? '✗' : m.warn ? '△' : '✓'} ${name}: ${m.len} m · ${m.h} m tall · ${m.T} s · vmax ${m.vmax} m/s · G ${m.gMin}…${m.gMax} · lat ${m.lat} · air ${m.air} s · inv ${m.inv} · thrill ${m.thrill} · intensity ${m.intensity} · comfort ${m.comfort} · bb ${m.bb.join(',')}`);
    if (m.issues.length) console.log('    ' + m.issues.join(' | '));
  }
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await browser.close();
})();
