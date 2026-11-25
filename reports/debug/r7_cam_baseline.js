const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F);
  const X = (f, a) => page.evaluate(f, a), cam = () => X(() => window.__coasterDebug.cine().mode);
  console.log('start cam', await cam());
  await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1500);
  console.log('in builder', await cam());
  await X(() => document.querySelector('[data-b8="exit"]').click()); await page.waitForTimeout(2500);
  console.log('after exit (Disaster off)', await cam());
  console.log('errors', errors.length);
  await browser.close();
})();
