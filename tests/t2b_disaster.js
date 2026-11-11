const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
const F = ROOT + 'coaster_lab_v9_0.html', SH = __dirname + '/shots/';
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  for (const [w, h] of [[390, 844], [844, 390]]) {
    const { browser, page, errors } = await open(F, { w, h });
    const X = f => page.evaluate(f), dz = () => X(() => window.__coasterDebug.v80.v86.dz());
    if (w === 390) { const all = await X(() => window.__coasterDebug.v80.v86.predAll()); console.log('   Earth predictions:', all.map(a => a[0].split(' ')[0] + ':' + a[1]).join(' ')); }
    // turn it on from the Park & tools tile
    await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="dz86"]'); await page.waitForTimeout(400);
    await page.click('[data-dz86="on"]'); await page.waitForTimeout(300);
    let d = await dz(); ok(d.on && d.live, `${w}x${h} Disaster Mode on (live in classic ops)`);
    ok(await X(() => !document.querySelector('#dzChip').hidden), 'red 💥 Disaster badge shows');
    const page1 = await X(() => document.querySelector('#ov7B').textContent); ok(/will fly off the track/.test(page1), 'page predicts the derail: ' + (page1.match(/Looping Adventure will fly[^.]*\./) || [''])[0]);
    await X(() => document.querySelector('#ov7X').click());
    // ride: let the dispatch countdown pass, then fast-forward until the wheels let go
    await X(() => { window.__coasterDebug.select(0) }); await page.waitForTimeout(3200);
    await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 40 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) });
    d = await dz(); ok(d.phase === 'crash' && d.cam === 'crash', 'derailed, crash camera on: phase=' + d.phase + ' s=' + d.s);
    await page.waitForTimeout(900); await page.screenshot({ path: SH + `crash_${w}x${h}.png` });
    d = await dz(); ok(d.riders === 8, 'cartoon riders popped out: ' + d.riders);
    await page.waitForFunction(() => !document.querySelector('#ov7').hidden && document.querySelector('#ov7').dataset.k === 'inc86', null, { timeout: 30000 });
    d = await dz(); ok(d.rep && d.rep.kind === 'derail' && d.rep.fly > 0 && d.rep.v > 5, `Incident Report: flew ${d.rep && d.rep.fly.toFixed(1)} m, ${d.rep && d.rep.v.toFixed(1)} m/s at failure, ${d.rep && d.rep.why} in ${d.rep && d.rep.el}`);
    const rep = await X(() => document.querySelector('#ov7B').textContent);
    ok(/DERAILED/.test(rep) && /Cause of failure/.test(rep) && /Distance flown/.test(rep) && /Speed when it failed/.test(rep), 'report has stamp, cause, distance, speed');
    await page.screenshot({ path: SH + `report_${w}x${h}.png` });
    const ach = await X(() => Object.keys(window.__coasterDebug.v7.prg().ach)); ok(ach.includes('dz86'), 'achievement Off the rails! unlocked');
    // reset from the report: the train is back on the track, riders back in their seats
    await page.click('[data-dz86="again"]'); await page.waitForTimeout(600);
    d = await dz(); ok(d.phase === '' && d.riders === 0 && d.cam !== 'crash' && d.s < 3, 'reset puts the train back: cam=' + d.cam + ' s=' + d.s);
    const vis = await X(() => { const c = window.__coasterDebug; return true }); 
    // rollback: gravity-only Moon makes Sky Serpent stall
    await X(() => { window.__coasterDebug.v80.v86.setGrav('moon', null, false); window.__coasterDebug.select(2) }); await page.waitForTimeout(3200);
    const pr = await X(() => window.__coasterDebug.v80.v86.pred()); ok(pr.kind === 'roll', 'Moon (gravity only) predicts a rollback on Sky Serpent at ' + pr.s + ' m (' + pr.el + ')');
    await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 400 && d.v80.v86.dz().phase !== 'report'; i++) d.v72.ff(1) });
    d = await dz(); ok(d.phase === 'report' && d.rep.kind === 'roll' && d.rep.back > 1, `rolled back ${d.rep && d.rep.back.toFixed(1)} m, fastest backwards ${d.rep && d.rep.vmin.toFixed(1)} m/s`);
    await page.waitForFunction(() => document.querySelector('#ov7').dataset.k === 'inc86' && !document.querySelector('#ov7').hidden, null, { timeout: 10000 });
    ok(/ROLLED BACK/.test(await X(() => document.querySelector('#ov7B').textContent)), 'rollback report shown');
    if (w === 390) await page.screenshot({ path: SH + `rollback_${w}x${h}.png` });
    ok((await X(() => Object.keys(window.__coasterDebug.v7.prg().ach))).includes('dzroll86'), 'achievement Rollback! unlocked');
    // safety back on: mode off, train reset, physics back to Earth for the next viewport
    await page.click('[data-dz86="off"]'); await page.waitForTimeout(400);
    d = await dz(); ok(!d.on && d.phase === '' && await X(() => document.querySelector('#dzChip').hidden), 'Safety back on: mode off, badge gone');
    await X(() => window.__coasterDebug.v80.v86.setGrav('earth'));
    ok(errors.length === 0, `${w}x${h} console errors: ${errors.length}`); errors.slice(0, 5).forEach(e => console.log('   ', e.slice(0, 300)));
    await browser.close();
  }
})();
