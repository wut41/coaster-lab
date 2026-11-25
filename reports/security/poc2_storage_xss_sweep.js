// PoC 2 — DOM-XSS sweep through saved data (localStorage) and the owner "import all saves" backup path.
// Every string field the game stores is seeded with an HTML payload, then the screens that render saved data are
// opened. A hit is recorded if the payload ever runs (__xss) or ever appears as a live element/attribute in the DOM.
// Local only (tests/harness.js). Usage: node reports/security/poc2_storage_xss_sweep.js
const path = require('path');
const { open } = require(path.join(__dirname, '../../tests/harness.js'));
const F = path.join(__dirname, 'coaster_lab_v8_6.audit-copy.html');
const log = (...a) => console.log(...a);
const P = `"><img src=x onerror=__xss('IMG')><svg onload=__xss('SVG')>'&`;
const P10 = `"onclick=x`; // 10-char variant for fields capped at 10 chars
const els = [{ t: 'station', p: {} }, { t: 'lift', p: {} }, { t: 'drop', p: {} }, { t: 'turn', p: {} }, { t: 'hill', p: {} }, { t: 'turn', p: {} }];
const day = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') })();
const J = JSON.stringify;
const SEED = {
  'coasterlab.tut.v2': '1',
  'coasterlab.designs.v2': J({ v: 2, designs: [{ id: P, name: P, t: Date.now(), design: { v: 2, name: P, els } }] }),
  'coasterlab.draft.v2': J({ design: { v: 2, name: P, els }, id: P, saved: P }),
  'coasterlab.v72.park': J({ name: P, alerts: [{ t: P, k: P10, m: P, key: P }], thoughts: { [P]: 9 } }),
  'coasterlab.v80.park': J({ staff: [{ id: P, n: P, r: 'janitor', as: P, lv: 1 }, { id: P + '2', n: P, r: 'mechanic', as: 'all', lv: 1 }] }),
  'coasterlab.v72.trains': J({ designs: { dX: { body: '#ff0000', accent: '#00ff00', seat: '#0000ff', restraint: '#111111', wheel: '#222222', light: '#333333', n: P, preset: P } }, assign: {}, all: null }),
  'coasterlab.v7.owner': J({ rides: { 0: { name: P } }, presets: { [P]: { tod: 'night' } }, edits: { [P]: [] } }),
  'coasterlab.v83.mod': J({ on: true, allow: {}, log: [{ t: 1, m: P }] }),
  'coasterlab.v86.daily': J({ days: { [day]: { best: 650, pass: true, tries: 2, res: [true, true, false], vals: [P, P, P] } } }),
  'coasterlab.v86.gravity': J({ k: P, g: P, real: P }),
  'coasterlab.v80.blueprints': J([{ id: P, name: P, t: 1, els: [{ t: 'lift', p: {} }] }]),
  'coasterlab.v72.hist': J([{ t: Date.now(), r: P, v: 20, g: 3, a: 1, d: 60, sc: 100, env: P, wx: P, tod: P, seat: P, ops: P }]),
  'coasterlab.v72.cams': J([{ p: [1, 2, 3], q: [0, 0, 0, 1], fov: 60, follow: false, ride: P }]),
};

async function sweep(page, label) {
  const X = f => page.evaluate(f).catch(e => 'ERR ' + e.message);
  const hide = () => X(() => document.querySelectorAll('#b8Tour,#dlg7,#bDlg,#cl81rec').forEach(e => e.hidden = true));
  const clickAll = async sel => { const n = await page.$$eval(sel, a => a.length).catch(() => 0); for (let i = 0; i < Math.min(n, 30); i++) { await page.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i]; if (e && e.offsetParent !== null) e.click() }, [sel, i]).catch(() => { }); await page.waitForTimeout(150) } };
  // Park & tools hub → every tile → every tab inside
  const tiles = await X(() => { document.querySelector('#parkBtn').click(); return [...document.querySelectorAll('[data-hub]')].map(e => e.dataset.hub) });
  for (const id of Array.isArray(tiles) ? tiles : []) {
    if (['photo', 'sketch', 'studio'].includes(id)) continue; // canvas tools; no saved text
    await X(() => { const p = document.querySelector('#parkBtn'); p && p.click() }); await page.waitForTimeout(150);
    await page.evaluate(id => { const t = document.querySelector(`[data-hub="${id}"]`); t && t.click() }, id).catch(() => { }); await page.waitForTimeout(350); await hide();
    await clickAll('[data-hq],[data-pktab],#ov7 [data-tab]');
    await X(() => { document.querySelectorAll('.pk72 .x72,[data-x="close"],#ov7X').forEach(b => { try { b.click() } catch (e) { } }); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) });
  }
  // Owner Control Center (opened through the harness-only debug hook) → every tab
  await X(() => window.__coasterDebug.v7.openOwner()); await page.waitForTimeout(400);
  await clickAll('#own7 [data-tab]');
  await X(() => { const b = document.querySelector('#own7 [data-a="close"]'); b && b.click() });
  // Track Builder → every library tab (includes 🧬 Evolve and 📅 Daily) and the saves sheet
  await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(900); await hide();
  await X(() => window.__coasterDebug.v80.bld.act('add')); await page.waitForTimeout(300);
  await clickAll('[data-b8lib]'); await clickAll('[data-b8tab]');
  // positive control: a deliberately unsafe sink must be caught by the same detectors
  await X(() => document.body.insertAdjacentHTML('beforeend', `<img src=x onerror="__xss('CONTROL')">`)); await page.waitForTimeout(1500);
  return X(() => ({ hits: window.__xssHits || [], live: (window.__liveEls || []).length, payloadShownAsText: window.__seen || 0 }));
}

(async () => {
  const init = () => {
    window.__xss = n => (window.__xssHits = window.__xssHits || []).push(n);
    const flag = el => { if (el.nodeType !== 1) return; const bad = (el.tagName === 'IMG' && el.getAttribute('src') === 'x') || [...el.attributes].some(a => /^on/i.test(a.name) && /__xss|^x$/.test(a.value)); if (bad) (window.__liveEls = window.__liveEls || []).push(el.outerHTML.slice(0, 160)); el.querySelectorAll && el.querySelectorAll('*').forEach(flag) };
    const txt = n => { const t = n.textContent || n.value || ''; if (/onerror=__xss|img src=x onerror/.test(t)) window.__seen = (window.__seen || 0) + 1 };
    new MutationObserver(ms => ms.forEach(m => { m.addedNodes.forEach(n => { flag(n); txt(n) }); if (m.type === 'attributes') flag(m.target) })).observe(document, { subtree: true, childList: true, attributes: true });
  };
  // Run 1: payloads planted straight into localStorage (what any script or a DevTools user could do)
  {
    const { browser, ctx, page, errors } = await open(F, { storage: SEED });
    page.setDefaultTimeout(120000); await ctx.addInitScript(init); await page.reload(); await page.waitForFunction(() => window.__booted === true, null, { timeout: 120000 }); await page.waitForTimeout(1500);
    const r = await sweep(page, 'storage');
    log('RUN 1 (seeded localStorage):', JSON.stringify(r));
    log('   page errors:', errors.length); errors.slice(0, 4).forEach(e => log('    ', e.slice(0, 200)));
    await browser.close();
  }
  // Run 2: the same payloads delivered as a crafted "backup" through Owner Control Center → import all saves
  {
    const { browser, ctx, page, errors } = await open(F, { storage: { 'coasterlab.tut.v2': '1' } });
    page.setDefaultTimeout(120000); await ctx.addInitScript(init);
    const backup = J({ app: 'Coaster Lab', v: 8, data: Object.assign({}, SEED, {
      // also shows the owner-only moderator settings and lockout counters are just ordinary importable save keys
      'coasterlab.v83.mod': J({ on: true, allow: {}, log: [{ t: 1, m: P }] }),
      'coasterlab.v72.ownLock': J({ n: 0, until: 0, lv: 0 }),
    }) });
    await page.evaluate(() => window.__coasterDebug.v7.openOwner()); await page.waitForTimeout(400);
    // find the tab holding the backup box
    const tabs = await page.$$eval('#own7 [data-tab]', a => a.map(e => e.dataset.tab));
    for (const t of tabs) { await page.click(`#own7 [data-tab="${t}"]`).catch(() => { }); await page.waitForTimeout(200); if (await page.$('#oIO72')) break }
    const ok = !!(await page.$('#oIO72'));
    if (ok) {
      await page.fill('#oIO72', backup);
      await page.evaluate(() => { const b = document.querySelector('#own7 [data-a="x72:impAll"]'); b && b.click() }); await page.waitForTimeout(500);
      await page.evaluate(() => { const y = document.querySelector('#dlg7Y'); y && y.click() });
      await page.waitForFunction(() => window.__booted === true && performance.now() > 500, null, { timeout: 120000 }).catch(() => { });
      await page.waitForTimeout(4000); await page.waitForFunction(() => window.__booted === true, null, { timeout: 120000 }); await page.waitForTimeout(1500);
      const stored = await page.evaluate(() => ({ park: localStorage.getItem('coasterlab.v72.park'), mod: localStorage.getItem('coasterlab.v83.mod') }));
      log('RUN 2 import done; stored park item now contains "<"?', /</.test(stored.park || ''), '| quote?', /\\"/.test((stored.park || '').replace(/^\{"/, '')), '| v83.mod written:', !!stored.mod);
      const r = await sweep(page, 'backup');
      log('RUN 2 (owner backup import):', JSON.stringify(r));
    } else log('RUN 2: could not find the backup box (#oIO72)');
    log('   page errors:', errors.length); errors.slice(0, 4).forEach(e => log('    ', e.slice(0, 200)));
    await browser.close();
  }
})();
