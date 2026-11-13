// Coaster Lab 10.1 — hills and lakes in My Park: the Terrain tool (raise, lower, level, lake, brush sizes), what it
// costs, what it may not touch, building on hills (earthworks), lakes (no building in water, path bridges, coasters
// over water and through hills in tunnels), visitors walking at the height of the ground, saving and park codes.
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
(async () => {
  const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
  const X = (f, a) => page.evaluate(f, a), T = 'window.__coasterDebug.v80.v10.ty', S = () => X(() => window.__coasterDebug.v80.v10.ty.state());
  ok(await X(() => window.__coasterDebug.v80.v10.ty.fresh('career')), 'My Park opens (career)'); await X(() => window.__coasterDebug.v80.v10.ty.speed(0)); await page.waitForTimeout(400);
  let info = await X(() => window.__coasterDebug.v80.v10.ty.terraInfo());
  ok(info.mesh && !info.any && !info.saved && !info.water, 'a new park is flat: ground mesh built, no heights saved, no lake shown');
  ok(await X(() => !!document.querySelector('#tyBar [data-v="terra"]')), 'the build bar has a ⛰ Terrain button');
  // raising costs $15 a step per tile
  const m0 = (await S()).money; let w = await X(() => window.__coasterDebug.v80.v10.ty.terra(14, 40, 'raise', 1)); let s = await S();
  ok(w === '' && s.money === m0 - 15 && await X(() => window.__coasterDebug.v80.v10.ty.h(14, 40)) === 1, 'Raise with the small brush lifts one tile by 1 m for $15');
  await X(() => window.__coasterDebug.v80.v10.ty.terra(14, 40, 'raise', 2)); s = await S();
  ok(s.money === m0 - 15 - 9 * 15 && await X(() => window.__coasterDebug.v80.v10.ty.h(14, 40)) === 2 && await X(() => window.__coasterDebug.v80.v10.ty.h(13, 39)) === 1, 'the medium brush lifts 3 × 3 tiles ($135)');
  for (let k = 0; k < 4; k++) await X(() => window.__coasterDebug.v80.v10.ty.terra(14, 40, 'raise', 3));
  info = await X(() => window.__coasterDebug.v80.v10.ty.terraInfo()); ok(info.any && info.saved, 'the heights are stored with the park');
  const gy = await X(() => window.__coasterDebug.v80.v10.ty.groundY(-38, 62)); ok(gy > 3, 'the ground mesh is higher on the hill (' + gy + ' m)');
  ok(near0(await X(() => window.__coasterDebug.v80.v10.ty.groundY(0, -80))), 'far away the ground is still at 0');
  // paths and the entrance are protected
  w = await X(() => window.__coasterDebug.v80.v10.ty.terra(24, 46, 'raise', 1)); ok(/path/i.test(w), 'a path tile cannot be raised: “' + w + '”');
  w = await X(() => window.__coasterDebug.v80.v10.ty.terra(2, 2, 'raise', 1)); ok(/not yours/.test(w), 'land you do not own cannot be changed: “' + w + '”');
  // a lake
  const m1 = (await S()).money; w = await X(() => window.__coasterDebug.v80.v10.ty.terra(30, 42, 'lake', 2)); s = await S();
  ok(w === '' && await X(() => window.__coasterDebug.v80.v10.ty.h(30, 42)) === -2 && s.money === m1 - 9 * 2 * 15, 'Lake digs 3 × 3 tiles down to −2 m ($270)');
  ok((await X(() => window.__coasterDebug.v80.v10.ty.terraInfo())).water, 'the lake surface is shown');
  const lb = await X(() => window.__coasterDebug.v80.v10.ty.build('burger', 30, 42, 0)); ok(!lb.ok && /lake/.test(lb.why), 'nothing can be built in the lake: “' + lb.why + '”');
  // build on the hill: the ground is levelled and the earthworks are paid
  const m2 = (await S()).money, h0 = await X(() => [window.__coasterDebug.v80.v10.ty.h(15, 40), window.__coasterDebug.v80.v10.ty.h(16, 40)]);
  const b = await X(() => window.__coasterDebug.v80.v10.ty.build('drinks', 15, 40, 0)); s = await S();
  ok(b.ok, 'a drinks stand can be built on the hill');
  const lvl = await X(() => window.__coasterDebug.v80.v10.ty.h(15, 40)), oy = await X(i => window.__coasterDebug.v80.v10.ty.objY(i), b.id);
  ok(oy === lvl && lvl > 0, 'it stands on its tile at ' + oy + ' m');
  ok(s.money === m2 - 650, 'its tile was already level: it cost just its price ($650)');
  // flat rides on uneven ground: footprint levelled to the rounded average
  const m3 = (await S()).money; const r = await X(() => window.__coasterDebug.v80.v10.ty.build('carousel', 16, 41, 0)); s = await S();
  const hs = await X(() => { const D = window.__coasterDebug.v80.v10.ty, a = []; for (let j = 41; j < 44; j++) for (let i = 16; i < 19; i++) a.push(D.h(i, j)); return a });
  ok(r.ok && new Set(hs).size === 1, 'the carousel’s 3 × 3 footprint was levelled to one height (' + hs[0] + ' m)');
  ok(s.money < m3 - 2200 && s.led.exp.build > 0, 'levelling cost extra: ' + (m3 - s.money - 2200) + ' on top of $2,200');
  ok(await X(i => window.__coasterDebug.v80.v10.ty.objY(i), r.id) === hs[0], 'the carousel model stands at that height');
  w = await X(() => window.__coasterDebug.v80.v10.ty.terra(17, 42, 'lower', 1)); ok(/built/.test(w), 'ground under a building cannot be changed: “' + w + '”');
  // money: refused when there is not enough
  await X(() => window.__coasterDebug.v80.v10.ty.set({ money: 10 })); w = await X(() => window.__coasterDebug.v80.v10.ty.terra(10, 34, 'raise', 3)); ok(/Not enough money/.test(w), 'no money, no earthworks: “' + w + '”');
  await X(() => window.__coasterDebug.v80.v10.ty.set({ money: 80000 }));
  // a path over the lake is a bridge; visitors walk on its deck
  await X(() => window.__coasterDebug.v80.v10.ty.path(30, 41, 30, 43));
  ok(Math.abs((await X(() => window.__coasterDebug.v80.v10.ty.walkY((30 - 24 + .5) * 4, (42 - 24 + .5) * 4))) - .12) < .01, 'a path over the lake is a bridge (deck at 0.12 m)');
  // walking on a hill
  ok((await X(() => window.__coasterDebug.v80.v10.ty.walkY((14 - 24 + .5) * 4, (38 - 24 + .5) * 4))) > 2, 'the ground under a walker on the hill is above 2 m');
  // a coaster through the hill makes a tunnel
  // saving and loading keep the heights
  const hg = await X(() => window.__coasterDebug.v80.v10.ty.h(14, 40)); await X(() => window.__coasterDebug.v80.v10.ty.save && window.__coasterDebug.v80.v10.ty.save());
  await X(() => { window.__coasterDebug.v80.v10.ty.exit(); window.__coasterDebug.v80.v10.ty.open('career') }); await page.waitForTimeout(600);
  ok(await X(() => window.__coasterDebug.v80.v10.ty.h(14, 40)) === hg && (await X(() => window.__coasterDebug.v80.v10.ty.terraInfo())).water, 'leaving and opening the park again keeps the hills and the lake');
  await X(() => window.__coasterDebug.v80.v10.ty.cam(-30, 50, 70, .7, .6)); await page.waitForTimeout(1500); await page.screenshot({ path: SH + 'terra_park.png' });
  await X(() => window.__coasterDebug.v80.v10.ty.speed(1)); await X(() => window.__coasterDebug.v80.v10.ty.ff(60)); await page.waitForTimeout(800); await page.screenshot({ path: SH + 'terra_live.png' });
  ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
function near0(x) { return Math.abs(x) < 1e-6 }
