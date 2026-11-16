// Baseline: does the file boot with 0 errors, and what do the built-in rides measure (for picking Disaster limits)?
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
(async () => {
  const file = process.argv[2] || ROOT + 'coaster_lab_v10_0.html';
  for (const vp of [[390, 844], [844, 390]]) {
    const { browser, page, errors, warns } = await open(file, { w: vp[0], h: vp[1] });
    const r = await page.evaluate(() => {
      const d = window.__coasterDebug, out = [];
      for (let i = 0; i < d.rides.length; i++) { d.select(i); const l = d.lab(); if (!l) continue; out.push([d.rides[i], +l.st.lat.toFixed(2), +l.st.gMax.toFixed(2), +l.st.gMin.toFixed(2), +l.T.toFixed(0), l.stall]); }
      d.select(0); return out;
    });
    console.log('viewport', vp.join('x'), 'errors:', errors.length, 'warnings:', warns.length);
    errors.slice(0, 8).forEach(e => console.log('  ERR', e.slice(0, 300)));
    warns.slice(0, 5).forEach(e => console.log('  WARN', e.slice(0, 200)));
    if (vp[0] === 390) r.forEach(x => console.log('  ', JSON.stringify(x)));
    await browser.close();
  }
})();
