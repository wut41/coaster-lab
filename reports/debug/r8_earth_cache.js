// Gravity Lab's "🌍 Earth" comparison column is cached per ride and ignores later Lab lift / brake changes.
const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F);
  const X = (f, a) => page.evaluate(f, a);
  const r = await X(() => { const d = window.__coasterDebug, v = d.v80.v86; v.setGrav('moon'); const a = v.earth(0);
    d.setPH({ lift: 9 }); const b = v.earth(0);
    // reference: a fresh computation (cache bypassed by a different gravity round-trip is not possible, so compare with lift-free physics)
    return { T_lift_default: +a.T.toFixed(2), T_after_lift9: +b.T.toFixed(2), PH: d.v7.ph() } });
  console.log(JSON.stringify(r));
  await X(() => { const d = window.__coasterDebug; d.setPH({ lift: 3.8 }); d.v80.v86.setGrav('earth') });
  console.log('errors', errors.length);
  await browser.close();
})();
