// Economy check for My Park: plays whole days at full speed in three parks and prints each day's books.
//   node tools/balance.js
//  · "sensible": a starter park the tutorial leads to (two flat rides, food, drinks, restrooms, a small coaster)
//  · "neglected": one overpriced ride, no food, no staff
//  · "grown": the sensible park after reinvesting (more rides, a second coaster, more land)
// A sensible park should make a modest profit from day 2 or 3; a neglected one should lose money and reputation.
const { open } = require('../harness'), L = require('./park_lib');
const F = require('path').join(__dirname, '..', '..') + '/coaster_lab_v10_0.html';
(async () => {
  const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
  const X = (f, a) => page.evaluate(f, a), T = 'window.__coasterDebug.v80.v10.ty';
  const day = async () => { const d0 = (await X(() => window.__coasterDebug.v80.v10.ty.state())).day; for (let k = 0; k < 80; k++) { await X(() => window.__coasterDebug.v80.v10.ty.ff(20)); const s = await X(() => window.__coasterDebug.v80.v10.ty.state()); if (s.day > d0 && s.open) break } return X(() => { const T = window.__coasterDebug.v80.v10.ty; T.act('dayx'); return T.lastDay() }) };
  const row = (tag, d, s) => console.log(`${tag} day ${d.day}: in ${String(d.inc).padStart(6)}  out ${String(d.exp).padStart(6)}  profit ${String(d.inc - d.exp).padStart(6)}  visitors ${String(d.guests).padStart(3)} (peak ${d.peak})  rating ${d.rating}  happy ${d.happy}  money ${d.money}  | gate ${Math.round(d.led.inc.gate)} rides ${Math.round(d.led.inc.rides)} food ${Math.round(d.led.inc.food)} shops ${Math.round(d.led.inc.shops)} | build ${Math.round(d.led.exp.build)} run ${Math.round(d.led.exp.run)} wages ${Math.round(d.led.exp.wages)} repair ${Math.round(d.led.exp.repair)} stock ${Math.round(d.led.exp.stock)}`);
  const put = async list => { for (const q of list) { const b = await X(L.place, q); if (!b.ok) { console.log('   could not place', q[0]); continue } if (!/^(tree|bush|flowers|bench|bin|lamp|rock|pine)$/.test(q[0])) { const n = await X(L.connect, [b.id]); if (n < 0) console.log('   could not connect', q[0]) } } };
  // ---- sensible
  await X(() => window.__coasterDebug.v80.v10.ty.fresh('career')); await page.waitForTimeout(400); await X(() => window.__coasterDebug.v80.v10.ty.path(24, 45, 24, 38));
  await put([['carousel', 20, 42, 3], ['teacups', 28, 42, 3], ['burger', 26, 45, 2], ['drinks', 22, 45, 2], ['toilet', 26, 39, 2], ['bin', 25, 43, 1], ['bin', 23, 40, 1], ['bench', 25, 41, 1], ['bench', 23, 44, 1], ['c:Little Dipper', 30, 35, 8]]);
  let s = await X(() => window.__coasterDebug.v80.v10.ty.state()); console.log('sensible park built: $' + s.money + ' left of $25,000, ' + s.objs + ' things');
  await X(() => window.__coasterDebug.v80.v10.ty.speed(1)); const sens = []; for (let k = 0; k < 4; k++) { const d = await day(); sens.push(d); row('sensible ', d) }
  // ---- grown: reinvest what was earned
  await X(() => { const T = window.__coasterDebug.v80.v10.ty; T.land(3, 3); T.land(2, 3) }); await put([['bumper', 18, 38, 4], ['ferris', 30, 44, 4], ['icecream', 22, 39, 3], ['flowers', 25, 44, 1], ['flowers', 23, 42, 1], ['lamp', 25, 40, 1], ['tree', 22, 46, 2], ['tree', 27, 46, 2]]);
  s = await X(() => window.__coasterDebug.v80.v10.ty.state()); console.log('grown park: $' + s.money + ', level ' + s.lv + ', ' + s.objs + ' things'); for (let k = 0; k < 3; k++) row('grown    ', await day());
  s = await X(() => window.__coasterDebug.v80.v10.ty.state()); console.log('after 7 days: $' + s.money + ', level ' + s.lv + ', rating ' + s.rating + ', reputation ' + s.rep + ', goals ' + s.goals.length + '/14');
  // ---- neglected
  await X(() => window.__coasterDebug.v80.v10.ty.fresh('career')); await page.waitForTimeout(400); await X(() => window.__coasterDebug.v80.v10.ty.path(24, 45, 24, 40)); await put([['carousel', 20, 42, 3]]);
  await X(() => { const T = window.__coasterDebug.v80.v10.ty; T.sel(1); for (let k = 0; k < 26; k++) T.act('price', 1); T.set({ staff: { jan: 0, mech: 0 } }) });
  await X(() => window.__coasterDebug.v80.v10.ty.speed(1)); for (let k = 0; k < 3; k++) row('neglected', await day());
  s = await X(() => window.__coasterDebug.v80.v10.ty.state()); console.log('neglected after 3 days: $' + s.money + ', rating ' + s.rating + ', reputation ' + s.rep);
  console.log('simulation step cost: ' + JSON.stringify(await X(() => window.__coasterDebug.v80.v10.ty.perf && window.__coasterDebug.v80.v10.ty.perf())));
  console.log('errors: ' + errors.length + (errors.length ? ' ' + errors.slice(0, 3).join(' | ') : '')); await browser.close();
})();
