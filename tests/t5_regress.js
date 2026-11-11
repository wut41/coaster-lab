const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const probe = async (file, w, h) => {
  const { browser, page, errors } = await open(file, { w, h, skipStart: false, storage: { 'coasterlab.tut.v2': '1' } });
  const X = f => page.evaluate(f), r = {};
  r.start = await X(() => window.__coasterDebug.start().open);
  await page.click('[data-go="ride"]'); await page.waitForTimeout(700); r.startClosed = !(await X(() => window.__coasterDebug.start().open));
  await page.click('#parkBtn'); await page.waitForTimeout(400);
  r.hub = await X(() => [...document.querySelectorAll('#hub72 [data-hub]')].map(b => b.dataset.hub)); r.groups = await X(() => [...document.querySelectorAll('#hub72 .hubS82')].map(e => e.textContent));
  await page.click('#hub72 [data-hx="close"]'); await page.waitForTimeout(200);
  await page.click('#labBtn'); await page.waitForTimeout(600); r.lab = await X(() => !document.querySelector('#lab').hidden && document.querySelector('#labSec').textContent.length > 100); await page.click('#labClose'); await page.waitForTimeout(200);
  await page.click('#goalBtn'); await page.waitForTimeout(300); r.goals = await X(() => document.querySelector('#ov7B .n7').textContent); await X(() => document.querySelector('#ov7X').click());
  await page.click('#setBtn'); await page.waitForTimeout(300); r.settings = await X(() => [...document.querySelectorAll('#ov7B .h7')].map(e => e.textContent)); await X(() => document.querySelector('#ov7X').click());
  await X(() => window.__coasterDebug.v80.openPk('hq')); await page.waitForTimeout(500); r.hq = await X(() => window.__coasterDebug.v80.hq().open); await X(() => document.querySelector('#pk72 [data-x="close"]').click());
  await page.click('#layout'); await page.waitForTimeout(400); r.menu = await X(() => !document.querySelector('#menu').hidden && document.querySelectorAll('#cards [data-i]').length); await page.click('#menuClose');
  await X(() => window.__coasterDebug.select(5)); await page.waitForTimeout(300); r.ride5 = await X(() => window.__coasterDebug.state().cur);
  // owner lock: five quick taps on Rides opens the password box (we never type a password)
  await X(() => { const b = document.querySelector('#layout'); for (let i = 0; i < 5; i++) b.click() }); await page.waitForTimeout(400); r.owner = await X(() => window.__coasterDebug.v7.owner().pw);
  await X(() => { document.querySelector('#pw7X').click(); document.querySelector('#menuClose').click() });
  // builder: open, playtest, back, exit
  await page.click('#brandBtn'); await page.waitForTimeout(400); await page.click('[data-go="build"]'); await page.waitForTimeout(1200); await X(() => { document.querySelectorAll('#b8Tour').forEach(e => e.hidden = true) });
  r.builder = await X(() => window.__coasterDebug.v80.bld.state().editing);
  await X(() => window.__coasterDebug.v80.bld.play()); await page.waitForTimeout(800); r.play = await X(() => window.__coasterDebug.v80.bld.state().mode);
  await X(() => window.__coasterDebug.v80.bld.build()); await page.waitForTimeout(400); await X(() => window.__coasterDebug.v80.bld.act('exit')); await page.waitForTimeout(600);
  r.exited = !(await X(() => window.__coasterDebug.v80.bld.state().editing));
  // sketch studio opens and closes
  r.sketch = await X(() => { const b = document.querySelector('[data-go="sketch85"]'); if (!b) return 'no button'; document.querySelector('#brandBtn').click(); return 'ok' }); await page.waitForTimeout(400);
  await page.click('[data-go="sketch85"]'); await page.waitForTimeout(900); r.sketchOpen = await X(() => !document.querySelector('#sk85').hidden); await X(() => document.querySelector('[data-sk="close"]').click()); await page.waitForTimeout(400);
  r.errors = errors.slice(); await browser.close(); return r;
};
(async () => {
  for (const [w, h] of [[390, 844], [844, 390]]) {
    const a = await probe(ROOT + 'coaster_lab_v8_5.html', w, h), b = await probe(ROOT + 'coaster_lab_v9_0.html', w, h);
    ok(a.start && b.start && b.startClosed, `${w}x${h} start screen shows and Ride now closes it`);
    ok(JSON.stringify(b.hub) === JSON.stringify(a.hub.slice(0, a.hub.length - 3).concat(['grav86', 'dz86', 'daily86'], a.hub.slice(-3))) || (a.hub.every(x => b.hub.includes(x)) && b.hub.length === a.hub.length + 3), 'Park & tools keeps all ' + a.hub.length + ' old tiles and adds 3: ' + b.groups.join(' / '));
    ok(b.lab && a.lab, 'Research Lab opens');
    const na = +a.goals.match(/of (\d+)/)[1], nb = +b.goals.match(/of (\d+)/)[1]; ok(nb === na + 8, `Goals lists ${nb} achievements (8.5 had ${na}, +8 new)`);
    ok(a.settings.every(s => b.settings.includes(s)) && b.settings[0].includes('Experiments'), 'Settings keeps every 8.5 section and adds 🧪 Experiments on top');
    ok(a.hq && b.hq, 'Park HQ opens'); ok(a.menu === b.menu && b.menu > 0, 'ride menu shows the same ' + b.menu + ' cards'); ok(b.ride5 === 5, 'switching rides works');
    ok(a.owner && b.owner, 'owner password prompt still appears (5 taps on Rides) — untouched');
    ok(b.builder && b.play === 'play' && b.exited, 'builder opens, playtests and exits'); ok(b.sketchOpen && a.sketchOpen, 'Sketch-to-Coaster studio opens');
    ok(b.errors.length === 0 && a.errors.length === 0, `console errors v8.5: ${a.errors.length}, v8.6: ${b.errors.length}`); b.errors.slice(0, 4).forEach(e => console.log('   ', e.slice(0, 300)));
  }
  // a whole lap on the Moon: the lap card names the gravity and the Moonwalker achievement unlocks
  const { browser, page, errors } = await open(ROOT + 'coaster_lab_v9_0.html');
  await page.evaluate(() => { const d = window.__coasterDebug; d.v80.v86.setGrav('moon'); d.select(0) }); await page.waitForTimeout(3300);
  for (let i = 0; i < 80; i++) { await page.evaluate(() => window.__coasterDebug.v72.ff(1)); await page.waitForTimeout(60); if (await page.evaluate(() => !document.querySelector('#sum7').hidden)) break }
  await page.waitForTimeout(300);
  const card = await page.evaluate(() => !document.querySelector('#sum7').hidden && document.querySelector('#sum7').textContent);
  ok(card && /Moon gravity/.test(card), 'lap card says "🌙 Moon gravity · G-forces in Earth G"');
  ok((await page.evaluate(() => Object.keys(window.__coasterDebug.v7.prg().ach))).includes('moon86'), 'Moonwalker achievement unlocked after a Moon lap');
  ok(errors.length === 0, 'moon lap console errors: ' + errors.length); await browser.close();
})();
