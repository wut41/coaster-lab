// Repro: change the environment (or Park life) while a Disaster Mode crash/report is showing.
const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F);
  const X = (f, a) => page.evaluate(f, a), dz = () => X(() => window.__coasterDebug.v80.v86.dz());
  await X(() => { window.__coasterDebug.v80.v86.setDz(true); window.__coasterDebug.select(0) }); await page.waitForTimeout(3200);
  await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 40 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) });
  let d = await dz(); console.log('after ff: phase', d.phase, 's', d.s, 'v', d.v);
  // wait for the report, then close it and switch the world (as a player would from the environment menu)
  if (process.env.WAITREP) { await page.waitForFunction(() => !document.querySelector('#ov7').hidden && document.querySelector('#ov7').dataset.k === 'inc86', null, { timeout: 180000 }); await X(() => document.querySelector('#ov7X').click()); }
  else await page.waitForTimeout(1500);
  console.log('phase before env switch', (await dz()).phase);
  const achBefore = await X(() => !!window.__coasterDebug.v7.prg().ach.dzroll86);
  await X(() => window.__coasterDebug.v80.v85.env('industrial'));
  await page.waitForTimeout(2500); // dissolve72 takes ~1.4 s
  d = await dz(); console.log('after env switch: phase', JSON.stringify(d.phase), 's', d.s, 'v', d.v, 'cam', d.cam);
  await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 60 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) }); await page.waitForTimeout(300);
  d = await dz(); console.log('up to 60 s later: phase', JSON.stringify(d.phase), 'rep', d.rep && d.rep.kind, 's', d.s, 'v', d.v);
  const achAfter = await X(() => !!window.__coasterDebug.v7.prg().ach.dzroll86);
  console.log('Rollback! achievement before', achBefore, 'after', achAfter);
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
