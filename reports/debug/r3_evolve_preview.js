// Repro: start 🧬 Evolve, then add a piece from another library tab while it runs.
const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F, { w: 844, h: 390, storage: { 'coasterlab.tut.v2': '1' } });
  const X = (f, a) => page.evaluate(f, a), V6 = 'window.__coasterDebug.v80.v86';
  await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1500);
  await X(() => { document.querySelectorAll('#b8Tour').forEach(e => e.hidden = true) });
  await X(() => { const v = window.__coasterDebug.v80.v86; v.evoSet({ gens: 16, cap: 25000 }); window.__evoP = v.evoGo() });
  await page.waitForTimeout(1500);
  // pick the first ordinary piece tab and add its first piece -> builder preview (✓ Place it / ✕ Cancel)
  const tab = await X(() => { const b = [...document.querySelectorAll('#b8Lib [data-b8lib]')].find(b => !['evo', 'daily'].includes(b.dataset.b8lib)); b.click(); return b.dataset.b8lib });
  await page.waitForTimeout(400);
  await X(() => document.querySelector('#b8Lib [data-b8it]').click());
  await page.waitForTimeout(200);
  const st0 = await X(() => ({ pv: !!document.querySelector('#b8Pv [data-b8="pvPlace"]'), evoBar: /Evolving/.test(document.querySelector('#b8Pv').textContent), run: !!window.__coasterDebug.v80.v86.evo().run }));
  console.log('tab', tab, 'right after adding a piece:', JSON.stringify(st0));
  await page.waitForTimeout(1500);
  const st1 = await X(() => ({ pv: !!document.querySelector('#b8Pv [data-b8="pvPlace"]'), evoBar: /Evolving/.test(document.querySelector('#b8Pv').textContent), run: !!window.__coasterDebug.v80.v86.evo().run, txt: document.querySelector('#b8Pv').textContent.slice(0, 80) }));
  console.log('1.5 s later (preview pending, Evolve still running):', JSON.stringify(st1));
  await X(() => window.__evoP);
  const st2 = await X(() => ({ pv: !!document.querySelector('#b8Pv [data-b8="pvPlace"]'), txt: document.querySelector('#b8Pv').textContent.slice(0, 80) }));
  console.log('after Evolve finished:', JSON.stringify(st2));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
