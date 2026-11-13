// Coaster Lab 10.1 — the deeper park sim: upkeep and going broke, themed scenery and themed rides, on-ride photos,
// families walking together, and the four scenarios (start, progress badge, win, run out of time, saving).
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
(async () => {
  const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
  const X = (f, a) => page.evaluate(f, a), S = () => X(() => window.__coasterDebug.v80.v10.ty.state());
  const T = 'window.__coasterDebug.v80.v10.ty';
  const D = (expr, a) => page.evaluate(new Function('a', 'const T = ' + T + '; return ' + expr), a);
  // ---- themes in the sandbox
  ok(await D('T.fresh("sandbox")'), 'Sandbox opens'); await D('T.speed(0)');
  await D('T.act("cat", "deco")'); await page.waitForTimeout(300);
  let tray = await X(() => document.querySelector('#tyTray').innerHTML);
  ok(/Saloon/.test(tray) && /Rocket/.test(tray) && /Temple Ruins/.test(tray) && /tyThemes/.test(tray), 'the Scenery tray has Western, Space and Jungle pieces and theme chips');
  await D('T.act("theme", "space")'); await page.waitForTimeout(300); tray = await X(() => document.querySelector('#tyTray').innerHTML);
  ok(/Rocket/.test(tray) && !/Saloon/.test(tray) && !/Lamp Post/.test(tray), 'the 🚀 Space chip shows only space scenery');
  await page.screenshot({ path: SH + 'sim_theme_tray.png' }); await D('T.act("theme", "all")'); await D('T.act("cat", "")');
  const car = await X(L.place, ['carousel', 21, 40, 3]); ok(car.ok, 'a carousel is built'); await X(L.connect, [car.id]);
  ok(await D('T.theme(a)', car.id) === null, 'with no scenery round it, it has no theme');
  for (const [k, i, j] of [['cactus', car.i - 2, car.j], ['wagon', car.i - 2, car.j + 2], ['wtower', car.i + 5, car.j]]) await X(L.place, [k, i, j, 2]);
  ok(await D('T.theme(a)', car.id) === 'western', 'three pieces of Western scenery next to it make it a Western-themed ride');
  for (const [k, i, j] of [['saloon', car.i - 4, car.j - 4], ['cactus', car.i + 5, car.j + 3], ['cactus', car.i + 1, car.j - 2], ['wagon', car.i + 3, car.j - 2]]) await X(L.place, [k, i, j, 3]);
  await D('T.cam(' + '(' + car.i + ' - 24) * 4, (' + car.j + ' - 24) * 4 + 4, 34, .7)'); await page.waitForTimeout(2500); await page.screenshot({ path: SH + 'sim_western.png' });
  // ---- photos
  await D('T.sel(a)', car.id); await D('T.set({})');
  await D('T.act("up", "photo")'); await page.waitForTimeout(200);
  let r = await D('T.rated(a, 80)', car.id); ok(r && r.bought > 4 && r.inc >= r.bought * 5, 'with the photo upgrade, visitors buy their photo after the ride (' + r.bought + ' of 80, ' + '$' + r.inc + ')');
  // ---- career: upkeep, the red, going broke
  ok(await D('T.fresh("career")'), 'a Career park opens'); await D('T.speed(0)');
  const c2 = await X(L.place, ['carousel', 21, 41, 3]); await X(L.place, ['burger', 26, 43, 3]); await X(L.place, ['bench', 23, 44, 2]);
  const up = await D('T.upkeep()'); ok(up > 0 && up < 200, 'the park’s upkeep is a small daily cost ($' + up + ')');
  let s0 = await S(); let e = await D('T.endDay()');
  ok(Math.abs(e.money - (s0.money - up)) <= 2 && /Upkeep/.test(e.card), 'closing time pays the upkeep and the day card lists it');
  await D('T.act("dayx")'); await D('T.set({ money: -4000 })'); e = await D('T.endDay()');
  ok(e.red === 1 && /in the red \(1 of 3/i.test(e.card), 'a day that ends in the red is counted and the day card warns (1 of 3)');
  await D('T.act("dayx")'); e = await D('T.endDay()'); ok(e.red === 2, 'two days in the red');
  await D('T.act("dayx")'); e = await D('T.endDay()'); ok(e.red === 3 && /gone broke/.test(e.card) && e.speed === 0, 'the third day in a row: the park has gone broke and stops');
  const loan0 = e.loan; await X(() => document.querySelector('#tyDay [data-v="rescue"]').click()); await page.waitForTimeout(300); s0 = await S();
  ok(await X(() => window.__coasterDebug.v80.v10.ty.set({}) && document.getElementById('tyDay').hidden) && (await D('T.endDay()')).red === 0, 'the rescue loan gets the park going again');
  ok(await X(() => window.__coasterDebug.v80.v10.ty.state().money) > -4000 + 19000 - 1000, 'the loan money is in the bank');
  // ---- families
  await D('T.set({ min: 600 })'); await X(L.connect, [c2.id]); await D('T.speed(3)');
  let fam = null; for (let k = 0; k < 8; k++) { await D('T.spawn(30)'); fam = await D('T.families()'); if (fam.leaders > 1) break }
  ok(fam.leaders > 0 && fam.followers >= fam.leaders, 'families arrive together (' + fam.leaders + ' families, ' + fam.followers + ' following them, ' + fam.kids + ' kids)');
  await page.waitForTimeout(6000); fam = await D('T.families()');
  ok(fam.followers > 0 && fam.together >= fam.followers * .6, 'and stay close to their grown-up while they walk round (' + fam.together + ' of ' + fam.followers + ')');
  await D('T.speed(0)');
  // ---- scenarios
  await D('T.act("hq", "scn")'); await page.waitForTimeout(400);
  ok(await X(() => /Save Rusty Acres/.test(document.body.innerText) && /Lakeside Lodge/.test(document.body.innerText)), 'the Park Office has a Scenarios tab with the four scenarios');
  await X(() => { const b = document.querySelector('[data-x="scn:rusty"]'); if (b) b.click() }); await page.waitForTimeout(1200);
  let si = await D('T.scnInfo()'); ok(si && si.id === 'rusty' && si.objs >= 5, 'Save Rusty Acres starts with an old park already built (' + (si && si.objs) + ' things)');
  ok(await X(() => /Save Rusty Acres/.test(document.getElementById('tyDay').innerText)), 'a card explains the goal');
  await D('T.act("dayx")'); await page.waitForTimeout(400);
  ok(await X(() => /day 1 of 12/.test(document.getElementById('tyBadge').textContent)), 'the badge shows the day and the progress: “' + await X(() => document.getElementById('tyBadge').textContent) + '”');
  await page.screenshot({ path: SH + 'sim_rusty.png' });
  await D('T.save()'); await D('T.exit()'); await D('T.open("scn")'); si = await D('T.scnInfo()'); ok(si && si.id === 'rusty', 'the scenario is kept when you leave and come back');
  ok(await D('T.scn("lake")'), 'Lakeside Lodge starts'); si = await D('T.scnInfo()'); ok(si.lake, 'it has a lake'); await D('T.act("dayx")');
  await D('T.cam(0, 30, 120, .8)'); await page.waitForTimeout(2500); await page.screenshot({ path: SH + 'sim_lake.png' });
  ok(await D('T.scn("crowd")'), '1,000 by day 10 starts'); await D('T.act("dayx")'); await D('T.speed(1)');
  await X(() => { window.__coasterDebug.v80.v10.ty.set({}); }); await page.evaluate(() => { const T = window.__coasterDebug.v80.v10.ty; T.set({ tot: Object.assign({}, T.state ? {} : {}, { inc: 0, exp: 0, guests: 1000, rides: 0, turned: 0, sales: 0 }) }) });
  let won = false; for (let k = 0; k < 12 && !won; k++) { await page.waitForTimeout(400); won = (await D('T.scnInfo()')).end === 'won' }
  ok(won && await X(() => /done!/.test(document.getElementById('tyDay').innerText)), 'reaching 1,000 visitors wins the scenario and a card says so');
  ok(await D('T.scn("kingdom")'), 'Coaster Kingdom starts'); await D('T.act("dayx")'); await D('T.speed(0)'); await D('T.set({ day: 14 })'); e = await D('T.endDay()');
  si = await D('T.scnInfo()'); ok(si.end === 'lost' && /out of time/.test(e.card), 'when day 14 ends without the goal, it is out of time');
  ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
