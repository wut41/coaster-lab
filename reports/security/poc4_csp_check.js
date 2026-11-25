// PoC 4 — checks that the Content-Security-Policy proposed in reports/security-audit.md does not break the game.
// Makes a temporary copy of the audit copy with the <meta> CSP inserted, boots it through tests/harness.js and
// records every securitypolicyviolation event while a few screens are opened. Local only.
// Usage: node reports/security/poc4_csp_check.js
const path = require('path'), fs = require('fs');
const { open } = require(path.join(__dirname, '../../tests/harness.js'));
const SRC = path.join(__dirname, 'coaster_lab_v8_6.audit-copy.html');
const OUT = path.join(__dirname, 'coaster_lab_v8_6.csp-test.html');
const CSP = "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src data: blob:; media-src data: blob:; connect-src data: blob:; worker-src 'none'; " +
  "object-src 'none'; base-uri 'none'; form-action 'none'";
const html = fs.readFileSync(SRC, 'utf8').replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
fs.writeFileSync(OUT, html);
(async () => {
  const { browser, ctx, page, errors } = await open(OUT, { storage: { 'coasterlab.tut.v2': '1' } });
  page.setDefaultTimeout(120000);
  await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || '') + ' ' + (e.sourceFile || '').split('/').pop() + ':' + e.lineNumber)) });
  await page.reload(); await page.waitForFunction(() => window.__booted === true, null, { timeout: 120000 }); await page.waitForTimeout(2000);
  const has = await page.evaluate(() => !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'));
  // exercise a few features: Park hub tiles, Owner panel, builder, a lap photo, Daily share
  await page.evaluate(() => { document.querySelector('#parkBtn').click() }); await page.waitForTimeout(300);
  for (const id of ['grav86', 'dz86', 'daily86', 'prog', 'lab']) { await page.evaluate(id => { document.querySelector('#parkBtn').click(); const t = document.querySelector(`[data-hub="${id}"]`); t && t.click() }, id).catch(() => { }); await page.waitForTimeout(500) }
  await page.evaluate(() => window.__coasterDebug.v7.openOwner()); await page.waitForTimeout(500);
  await page.evaluate(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1200);
  const v = await page.evaluate(() => window.__csp);
  console.log('CSP meta present:', has, '| booted:', await page.evaluate(() => window.__booted === true));
  console.log('violations:', v.length); v.slice(0, 20).forEach(x => console.log('  ', x));
  console.log('console errors:', errors.length); errors.slice(0, 6).forEach(e => console.log('  ', e.slice(0, 200)));
  await browser.close(); fs.unlinkSync(OUT);
})();
