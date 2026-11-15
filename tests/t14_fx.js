// Coaster Lab 10.1 — polish in My Park: things pop in with dust, coins float up from rides that earn, rain puddles and
// ripples, coaster track lights and ride bulbs at night, the Fireworks Launcher and its show at closing time.
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
(async () => {
  const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
  const X = (f, a) => page.evaluate(f, a), XA = (f, a) => page.evaluate(f, a), S = () => X(() => window.__coasterDebug.v80.v10.ty.state()), FX = () => X(() => window.__coasterDebug.v80.v10.ty.fx());
  ok(await X(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox')), 'My Park opens (sandbox)');
  await X(() => window.__coasterDebug.v80.v10.ty.set({ min: 720 })); await X(() => window.__coasterDebug.v80.v10.ty.wx('sunny')); await X(() => window.__coasterDebug.v80.v10.ty.cam(-10, 70, 60));
  await page.waitForTimeout(800);
  // building: the model springs up out of a puff of dust
  const b = await XA(L.place, ['carousel', 21, 41, 3]); ok(b.ok, 'a carousel is built');
  let f = await FX(); const sc0 = await X(i => window.__coasterDebug.v80.v10.ty.scale(i), b.id);
  ok(f.dust >= 8 && f.pops === 1 && sc0 !== 1, 'it pops in (scale ' + sc0 + ') with ' + f.dust + ' bits of dust');
  f = await X(() => window.__coasterDebug.v80.v10.ty.run(1.5));
  ok(await X(i => window.__coasterDebug.v80.v10.ty.scale(i), b.id) === 1 && f.pops === 0 && f.dust === 0, 'a moment later it is full size and the dust has settled');
  // coins: a ride that earns shows what it made
  await X(() => window.__coasterDebug.v80.v10.ty.run(1)); let coins = 0;
  for (let k = 0; k < 12 && !coins; k++) { await X(i => window.__coasterDebug.v80.v10.ty.earned(i, 3), b.id); coins = (await X(() => window.__coasterDebug.v80.v10.ty.run(1))).coins }
  ok(coins > 0, 'coins float up from the carousel once it takes money (' + coins + ')');
  f = await X(() => window.__coasterDebug.v80.v10.ty.run(2)); ok(f.coins === 0, 'and fade away');
  // rain: ripples at once, puddles once the ground is wet
  await X(() => window.__coasterDebug.v80.v10.ty.wx('rain')); await X(() => window.__coasterDebug.v80.v10.ty.wet(.9)); await page.waitForTimeout(1200); f = await FX();
  ok(f.ripples > 20, 'raindrops make rings on the ground (' + f.ripples + ')');
  ok(f.puddles >= 1 && f.pudOpacity > .5, 'wet paths get puddles (' + f.puddles + ', opacity ' + f.pudOpacity + ')');
  await page.screenshot({ path: SH + 'fx_rain.png' });
  await X(() => window.__coasterDebug.v80.v10.ty.wx('sunny')); await X(() => window.__coasterDebug.v80.v10.ty.wet(0)); await page.waitForTimeout(700); f = await FX();
  ok(f.ripples === 0 && f.pudOpacity < .05, 'when it stops and dries, the rings and puddles go');
  // night lights: a coaster outlines its track, a flat ride gets a ring of bulbs, both only after dark
  const c = await XA(L.place, ['c:Little Dipper', 30, 36, 6]); ok(c.ok, 'a Little Dipper is built');
  let lc = await X(i => window.__coasterDebug.v80.v10.ty.lights(i), c.id), lb = await X(i => window.__coasterDebug.v80.v10.ty.lights(i), b.id);
  ok(lc && lc.leds === 1 && lb && lb.bulbs === 1, 'the coaster has track lights and the carousel has bulbs');
  ok(lc.vis === 0 && lb.vis === 0, 'by day they are off');
  await X(() => window.__coasterDebug.v80.v10.ty.set({ min: 1350 })); await page.waitForTimeout(1500);
  ok(await X(() => window.__coasterDebug.v80.v10.ty.dark()), 'at 22:30 it is dark');
  lc = await X(i => window.__coasterDebug.v80.v10.ty.lights(i), c.id); lb = await X(i => window.__coasterDebug.v80.v10.ty.lights(i), b.id);
  ok(lc.vis === 1 && lb.vis === 1, 'after dark the track lights and bulbs are on');
  // fireworks
  ok(await X(() => /Fireworks Launcher/.test(document.body.innerHTML) || (window.__coasterDebug.v80.v10.ty.act('cat', 'deco'), /Fireworks Launcher/.test(document.querySelector('#tyTray') ? document.querySelector('#tyTray').innerHTML : document.body.innerHTML))), 'the Scenery tray sells a Fireworks Launcher');
  const fl = await XA(L.place, ['fireworks', 24, 38, 4]); ok(fl.ok, 'a Fireworks Launcher is placed');
  ok(await X(() => window.__coasterDebug.v80.v10.ty.fireworks()) === true, 'a show can start');
  let live = 0; for (let k = 0; k < 8; k++) live = Math.max(live, (await X(() => window.__coasterDebug.v80.v10.ty.run(.5))).fwLive);
  ok(live > 40, 'rockets go up and burst (' + live + ' sparks at the busiest)');
  await X(() => window.__coasterDebug.v80.v10.ty.cam(-14, 50, 90, .45)); await page.waitForTimeout(1500); await page.screenshot({ path: SH + 'fx_fireworks.png' });
  // closing time in career: the show starts by itself and is paid under Marketing
  ok(await X(() => window.__coasterDebug.v80.v10.ty.fresh('career')), 'a career park opens'); ok((await FX()).show === 0 && (await FX()).fwLive === 0, 'a new park starts with no show running');
  await X(() => window.__coasterDebug.v80.v10.ty.set({ xp: 5000 }));
  const fc = await XA(L.place, ['fireworks', 24, 42, 4]); ok(fc.ok, 'a launcher is placed in career (' + (fc.why || 'ok') + ')');
  await X(() => window.__coasterDebug.v80.v10.ty.set({ min: 1259.2 })); const s0 = await S();
  let show = 0; for (let k = 0; k < 16 && !show; k++) { await page.waitForTimeout(400); show = (await FX()).show }
  const s1 = await S(); ok(show > 0, 'when the park closes at 21:00 the show starts by itself');
  ok(s1.money <= s0.money - 150, 'the show costs $150 per launcher (' + (s0.money - s1.money) + ' spent)');
  ok(await X(() => /Fireworks over/.test(document.body.innerText)), 'a toast says the fireworks are on');
  ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
