// Repro variant: toggle 🌦 World → Park life while a Disaster Mode crash is playing.
const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F);
  const X = (f, a) => page.evaluate(f, a), dz = () => X(() => window.__coasterDebug.v80.v86.dz());
  await X(() => { window.__coasterDebug.v80.v86.setDz(true); window.__coasterDebug.select(0) }); await page.waitForTimeout(3200);
  await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 40 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) });
  console.log('phase', (await dz()).phase);
  await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="world"]'); await page.waitForTimeout(600);
  const sel = await X(() => { const i = [...document.querySelectorAll('input')].find(e => Object.values(e.dataset).includes('parkOn')); if (!i) return null; i.click(); return Object.keys(i.dataset).join() });
  console.log('toggled park life via', sel); await page.waitForTimeout(2500);
  let d = await dz(); console.log('after rebuild: phase', JSON.stringify(d.phase), 's', d.s, 'v', d.v);
  await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 60 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) });
  d = await dz(); console.log('later: phase', JSON.stringify(d.phase), 's', d.s, 'rollback ach', await X(() => !!window.__coasterDebug.v7.prg().ach.dzroll86));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
