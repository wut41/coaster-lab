// Disaster Mode state when modes change mid-incident.
const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F);
  const X = (f, a) => page.evaluate(f, a), dz = () => X(() => window.__coasterDebug.v80.v86.dz());
  const P = async (tag) => { const d = await dz(); console.log(tag.padEnd(42), 'phase=' + JSON.stringify(d.phase), 'live=' + d.live, 's=' + d.s, 'v=' + d.v, 'cam=' + d.cam, 'hud=' + await X(() => (document.querySelector('#eR') || {}).textContent)); return d };
  // A) roll phase, then Ride Ops -> realistic
  await X(() => { const v = window.__coasterDebug.v80.v86; v.setDz(true); v.setGrav('moon', null, false); window.__coasterDebug.select(2) }); await page.waitForTimeout(3200);
  await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 200 && d.v80.v86.dz().phase !== 'roll'; i++) d.v72.ff(.5) });
  await P('A roll started');
  await X(() => window.__coasterDebug.v72.setOps({ mode: 'realistic' })); await X(() => window.__coasterDebug.v72.ff(40)); await page.waitForTimeout(400);
  await P('A ops realistic + 40 s');
  await X(() => window.__coasterDebug.v72.setOps({ mode: 'classic', trains: 1 })); await X(() => window.__coasterDebug.v72.ff(2)); await page.waitForTimeout(300);
  await P('A ops classic again + 2 s');
  await X(() => window.__coasterDebug.v80.v86.setDz(false)); await page.waitForTimeout(300);
  await P('A disaster off');
  // B) crash, then gravity change mid-crash, then select another ride
  await X(() => { const v = window.__coasterDebug.v80.v86; v.setGrav('earth'); v.setDz(true); window.__coasterDebug.select(0) }); await page.waitForTimeout(3200);
  await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 40 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) });
  await P('B crashed');
  await X(() => window.__coasterDebug.v80.v86.setGrav('jupiter')); await page.waitForTimeout(800);
  await P('B jupiter mid-crash');
  await X(() => window.__coasterDebug.select(1)); await page.waitForTimeout(3000);
  await P('B selected ride 1');
  await X(() => window.__coasterDebug.v80.v86.setGrav('earth'));
  // C) crash then open builder then exit
  await X(() => window.__coasterDebug.select(0)); await page.waitForTimeout(3200);
  await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 40 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) });
  await P('C crashed again');
  await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1500);
  await P('C in builder');
  await X(() => document.querySelector('[data-b8="exit"]').click()); await page.waitForTimeout(2500);
  await P('C back from builder');
  // D) replay while crashed is refused; cinematic toggle
  await X(() => window.__coasterDebug.select(0)); await page.waitForTimeout(3200);
  await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 40 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) });
  await P('D crashed');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})();
