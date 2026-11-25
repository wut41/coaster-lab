// Repro: leave the Track Builder while 🧬 Evolve runs; also Stop and come back.
const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F, { storage: { 'coasterlab.tut.v2': '1' } });
  const X = (f, a) => page.evaluate(f, a);
  const toasts = [];
  await page.exposeFunction('__toast', t => toasts.push(t));
  await X(() => { const o = document.querySelector('#toast') || document.body; new MutationObserver(() => { const t = document.querySelector('#toast'); if (t) window.__toast(t.textContent) }).observe(o, { childList: true, subtree: true, characterData: true }) });
  await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1500);
  await X(() => { document.querySelectorAll('#b8Tour').forEach(e => e.hidden = true) });
  await X(() => { const v = window.__coasterDebug.v80.v86; v.evoSet({ gens: 16 }); window.__evoP = v.evoGo() });
  await page.waitForTimeout(1200);
  const left = await X(() => { const b = document.querySelector('[data-b8="exit"]'); if (b) b.click(); return !!b });
  console.log('clicked exit', left);
  await X(() => window.__evoP);
  await page.waitForTimeout(800);
  const st = await X(() => ({ editing: window.__coasterDebug.v80.bld.state().editing, lib: window.__coasterDebug.v80.bld.state().lib, last: window.__coasterDebug.v80.v86.evo().last, nres: window.__coasterDebug.v80.v86.evo().res.length }));
  console.log('after exit:', JSON.stringify(st));
  console.log('toasts:', [...new Set(toasts)].slice(-4));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
