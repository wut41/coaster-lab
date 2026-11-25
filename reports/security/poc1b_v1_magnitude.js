// PoC 1b — how bad is the classic-design (v1) point bypass? Opens .coaster.json files whose classic points are
// 1e3 … 1e6 m away (sanDesign's own limit for v2 points is |x| < 300) and measures time, errors and heap.
// Then checks whether a reload brings the bad state back. Local only. Usage: node reports/security/poc1b_v1_magnitude.js
const path = require('path');
const { open } = require(path.join(__dirname, '../../tests/harness.js'));
const F = path.join(__dirname, 'coaster_lab_v8_6.audit-copy.html');
const mk = M => JSON.stringify({ name: 'far ' + M, pts: [[0, 0, 0], [20, 0, 0], [M, 40, M], [-M, 30, M], [60, 10, 80], [10, 2, 60]] });
(async () => {
  for (const M of [1e3, 1e4, 1e5, 1e6]) {
    const { browser, page, errors } = await open(F, { storage: { 'coasterlab.tut.v2': '1' } });
    page.setDefaultTimeout(180000);
    await page.evaluate(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelectorAll('#b8Tour,#dlg7,#bDlg').forEach(e => e.hidden = true));
    const t0 = Date.now(); let state = 'ok';
    try {
      const inp = await page.$('input[type=file][accept=".json,application/json"]');
      await inp.setInputFiles({ name: 'x.coaster.json', mimeType: 'application/json', buffer: Buffer.from(mk(M)) });
      await page.waitForTimeout(2000);
      await Promise.race([page.evaluate(() => 1), new Promise((_, r) => setTimeout(() => r(new Error('main thread blocked > 120 s')), 120000))]);
    } catch (e) { state = e.message }
    const ms = Date.now() - t0;
    let info = {};
    if (state === 'ok') {
      await page.waitForTimeout(3000);
      info = await page.evaluate(() => { const D = window.__coasterDebug.bld.D(); return { name: D.name, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, toast: document.querySelector('#toast').textContent } }).catch(e => ({ err: e.message }));
      const e1 = errors.length; await page.waitForTimeout(3000); info.errorsStillGrowing = errors.length > e1;
      await page.reload().catch(() => { }); await page.waitForFunction(() => window.__booted === true, null, { timeout: 180000 }).catch(() => { }); await page.waitForTimeout(1500);
      info.afterReload = await page.evaluate(() => { try { return localStorage.getItem('coasterlab.draft.v2').slice(0, 60) } catch (e) { return null } }).catch(e => e.message);
    }
    console.log(`M=${M}: ${state} after ${ms} ms`, JSON.stringify(info), '| page errors:', errors.length, errors[0] ? '| first: ' + errors[0].slice(0, 120).replace(/\n/g, ' ') : '');
    await browser.close().catch(() => { });
  }
})();
