const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F);
  const r = await page.evaluate(() => { const d = window.__coasterDebug, v = d.v80.v86; v.setGrav('moon'); d.setPH({ lift: 9 }); return +v.earth(0).T.toFixed(2) });
  console.log('fresh Earth lap time with lift 9:', r, 'errors', errors.length);
  await browser.close();
})();
