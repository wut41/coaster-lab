// Coaster Lab 10.1 — the Developer Diagnostics Center (a tab of the Owner Control Center): what it measures, the
// error recorder, the warnings it works out, what the report may and may not contain, the on-screen frame counter,
// and that none of it is reachable without the owner lock.
//   node t22_diag.js          T22=AB node t22_diag.js
const { open } = require('./harness'), makeCloud = require('./tools/cloud_mock');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_1.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
const ONLY = process.env.T22 || 'ABCDEF';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const D = (pg, expr, a) => pg.evaluate(new Function('a', 'const D = window.__coasterDebug.v80.v10; return ' + expr), a);
const quiet = e => e.filter(x => !/WebSocket|ERR_FAILED|net::|Failed to load resource|test-|boom-/.test(x));
(async () => {
  // ---------- A. the page and what it measures
  if (ONLY.includes('A')) {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 }); await page.waitForTimeout(2500);
    await D(page, 'D.diag.open()'); await page.waitForTimeout(900);
    const txt = await page.evaluate(() => document.querySelector('#own7B').innerText), heads = ['HEALTH', 'FRAMES', '3D ENGINE', 'MEMORY', 'GRAPHICS QUALITY', 'CLOUD', 'ACCOUNT', 'SAVES AND STORAGE', 'RECENT ERRORS', 'TOOLS'];
    ok(heads.every(h => txt.toUpperCase().includes(h)) && await page.evaluate(() => document.querySelector('#own7 .ownT [data-tab="diag10"]').classList.contains('on')), 'the Diagnostics tab opens inside the Owner Control Center with all ten sections');
    const s = await D(page, 'D.diag.snap()');
    ok(s.frames.n > 0 && s.frames.fps > 0 && s.frames.avgMs > 0 && s.frames.p95Ms >= s.frames.avgMs * .5 && s.frames.maxMs >= s.frames.p95Ms, 'frames: ' + s.frames.fps + ' a second, ' + s.frames.avgMs + ' ms on average, 95% under ' + s.frames.p95Ms + ' ms (software graphics in this test)');
    ok(s.draw.calls > 20 && s.draw.triangles > 10000 && s.draw.programs > 3 && s.draw.objects >= s.draw.visible && s.draw.visible > 20, '3D engine: ' + s.draw.calls + ' draw calls, ' + s.draw.triangles.toLocaleString('en-US') + ' triangles, ' + s.draw.programs + ' shaders, ' + s.draw.objects + ' objects');
    ok(s.memory.geometries > 20 && s.memory.textures > 3 && s.memory.textureMB > 1 && s.memory.geometryMB > .2, 'memory: ' + s.memory.geometries + ' geometries, ' + s.memory.textures + ' textures, about ' + s.memory.textureMB + ' MB of textures and ' + s.memory.geometryMB + ' MB of vertex data');
    ok(/Low|Medium|High|Ultra/.test(s.graphics.quality) && s.graphics.pixelRatio > 0 && /^\d+×\d+$/.test(s.graphics.canvas) && /WebGL/.test(s.graphics.api) && s.graphics.maxTexture >= 2048, 'graphics: ' + s.graphics.quality + ', pixel ratio ' + s.graphics.pixelRatio + ', drawing ' + s.graphics.canvas + ', ' + s.graphics.api);
    ok(s.cloud.state === 'unknown' && s.account.signedIn === false && s.saves.ok === true && s.saves.storeChars > 0 && s.saves.storeItems > 0 && Array.isArray(s.saves.biggest), 'cloud, account and saves are reported (signed out, saving works, ' + s.saves.storeItems + ' stored items)');
    ok(await page.evaluate(() => { const c = document.getElementById('dgSpark'); if (!c) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n > 200 }), 'the frame chart is drawn');
    await page.screenshot({ path: SH + 'v101_diag_390x844.png' });
    // it refreshes by itself
    const f0 = (await D(page, 'D.diag.snap()')).frames.n; await page.waitForTimeout(2600); const t2 = await page.evaluate(() => document.querySelector('#own7B').innerText);
    ok(t2 !== txt && (await D(page, 'D.diag.snap()')).frames.n >= f0, 'the page keeps itself up to date while it is open');
    // in My Park it also reports the simulation
    await page.evaluate(() => { document.querySelector('#own7').hidden = true }); await D(page, "D.ty.fresh('sandbox')"); await page.waitForTimeout(600); const sp = await D(page, 'D.diag.snap()');
    ok(sp.park && sp.park.cap > 0 && sp.game.mode === 'My Park (sandbox)' && /MY PARK SIMULATION/i.test(await D(page, 'D.diag.html()')), 'inside My Park it adds the simulation (visitors, staff, time per frame)');
    ok(quiet(errors).length === 0, 'no errors' + (quiet(errors).length ? ': ' + quiet(errors).slice(0, 2).join(' | ') : '')); await browser.close();
  }
  // ---------- B. recent errors
  if (ONLY.includes('B')) {
    const { browser, page } = await open(F, { w: 390, h: 844 });
    await page.evaluate(() => { console.warn('test-warning one', { a: 1 }); console.warn('test-warning one', { a: 1 }); console.error('test-error two'); setTimeout(() => { throw new Error('boom-uncaught') }, 0); Promise.reject(new Error('boom-promise')); console.warn('test-token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c') }); await page.waitForTimeout(500);
    const e = await D(page, 'D.diag.errs()'), all = e.map(x => x.txt).join('\n');
    ok(e.some(x => /test-warning one/.test(x.txt) && x.n === 2 && x.level === 'warn') && e.some(x => /test-error two/.test(x.txt) && x.level === 'error'), 'warnings and errors written to the console are recorded, and a repeat is counted instead of listed twice');
    ok(/boom-uncaught/.test(all) && /boom-promise/.test(all), 'errors nothing caught, and promises nothing handled, are recorded too');
    ok(/test-token eyJhbGciO…/.test(all) && !/SflKxwRJ/.test(all) && !/eyJzdWIi/.test(all), 'something that looks like a sign-in token is cut short before it is kept');
    const w = await D(page, 'D.diag.snap().warnings.filter(x => /error/.test(x.t)).map(x => x.lv + ": " + x.t)'); ok(w.length === 1 && /^bad: \d+ errors? recorded/.test(w[0]), 'Health counts them (' + w[0] + ')');
    await D(page, 'D.diag.open()'); await page.waitForTimeout(600); const shown = await page.evaluate(() => document.querySelector('#own7B .dgLog').textContent);
    await page.evaluate(() => document.querySelector('#own7B [data-a="xd:clear"]').click()); await page.waitForTimeout(400);
    ok(/boom-uncaught/.test(shown) && (await D(page, 'D.diag.errs()')).length === 0, 'the page lists them with the time, and 🧹 clears the list'); await browser.close();
  }
  // ---------- C. the warnings, from made-up measurements
  if (ONLY.includes('C')) {
    const { browser, page } = await open(F, { w: 390, h: 844 }); await page.waitForTimeout(1500);
    const r = await page.evaluate(() => { const Dg = window.__coasterDebug.v80.v10.diag, base = () => { const o = JSON.parse(JSON.stringify(Dg.snap())); o.frames = { fps: 60, avgMs: 16.7, p95Ms: 18, maxMs: 30, n: 240, over50ms: 0, over250ms: 0 }; o.errors = []; o.saves.storeChars = 1e5; o.memory.contextLost = 0; o.game.online = true; o.cloud.state = 'ok'; o.cloud.failed = 0; return o }, run = f => { const o = base(); f(o); return Dg.warn(o).map(w => w.lv + ':' + w.t) };
      return { clean: run(() => {}), slow: run(o => { o.frames.fps = 12 }), mid: run(o => { o.frames.fps = 33 }), jank: run(o => { o.frames.p95Ms = 120 }), draws: run(o => { o.draw.calls = 2000 }), tex: run(o => { o.memory.textureMB = 600 }), leak: run(o => { o.memory.watchedMin = 5; o.memory.geoChange = 900 }), lost: run(o => { o.memory.contextLost = 1 }),
        save: run(o => { o.saves.ok = false }), tab: run(o => { o.saves.ok = false; o.saves.otherTab = true }), store: run(o => { o.saves.storeChars = 4.6e6 }), store2: run(o => { o.saves.storeChars = 3.3e6 }), off: run(o => { o.game.online = false }), nodb: run(o => { o.cloud.state = 'missing' }), net: run(o => { o.cloud.calls = 6; o.cloud.failed = 5; o.cloud.lastError = 'cl_list_parks: HTTP 503' }),
        sync: run(o => { o.account = { signedIn: true, syncError: 'Cloud save did not work: x' } }), cap: run(o => { o.park = { visitors: 260, cap: 260, simMs: 2 } }), sim: run(o => { o.park = { visitors: 100, cap: 260, simMs: 14 } }), few: run(o => { o.frames.fps = 5; o.frames.n = 10 }) } });
    ok(r.clean.length === 0 && r.few.length === 0, 'healthy numbers give no warnings (and five slow frames are not enough to judge by)');
    ok(/^bad:Low frame rate: 12/.test(r.slow[0]) && /^warn:The frame rate is below 40/.test(r.mid[0]) && /^warn:Uneven frames/.test(r.jank[0]), 'frame rate: bad under 24, a warning under 40, and a warning for uneven frames');
    ok(/draw calls/.test(r.draws[0]) && /MB of textures/.test(r.tex[0]) && /keeps growing/.test(r.leak[0]) && /^bad:The graphics context was lost/.test(r.lost[0]), 'engine and memory: too many draw calls, too much texture memory, memory that keeps growing, a lost graphics context');
    ok(/^bad:The last save did not work/.test(r.save[0]) && /^bad:This tab is not saving/.test(r.tab[0]) && /^bad:Local storage is 92% full/.test(r.store[0]) && /^warn:Local storage is 66% full/.test(r.store2[0]), 'saves: a failed save, a tab that stopped saving, storage 92% full (bad) and 66% full (warning)');
    ok(/offline/.test(r.off[0]) && /not set up in the database/.test(r.nodb[0]) && /5 of 6 cloud requests failed/.test(r.net[0]) && /Cloud saves:/.test(r.sync[0]), 'cloud: offline, database not set up, most requests failing, a sync error');
    ok(/as many visitors as this device simulates/.test(r.cap[0]) && /simulation takes 14\.0 ms/.test(r.sim[0]), 'My Park: at the visitor limit, and a slow simulation'); await browser.close();
  }
  // ---------- D. the report: useful, and nothing private in it
  if (ONLY.includes('D')) {
    const { cloud } = makeCloud(), { browser, page } = await open(F, { w: 390, h: 844, cloud });
    await D(page, "D.acct.signUp('sam.sample@example.test', 'correct-horse-9', 'Sam')"); await page.waitForFunction(() => { const s = window.__coasterDebug.v80.v10.acct.state(); return s.in && !s.busy && !s.syncing }, null, { timeout: 12000 }); await page.waitForTimeout(400);
    const rep = await D(page, 'D.diag.report()'), auth = await page.evaluate(() => JSON.parse(localStorage.getItem('coasterlab-device.v10.auth'))), dev = await page.evaluate(() => JSON.parse(localStorage.getItem('coasterlab-device.v10.dev') || '{}')), o = JSON.parse(rep);
    ok(o.app === 'Coaster Lab' && o.kind === 'diagnostics' && o.game.version === '10.1' && o.frames && o.draw && o.memory && o.graphics && o.cloud && o.account && o.saves && Array.isArray(o.warnings) && Array.isArray(o.errors), 'the report is one JSON document with every section of the page');
    ok(o.account.signedIn && o.account.name === 'Sam' && o.account.email === 's•••@example.test' && !rep.includes('sam.sample@example.test'), 'the account is named, the email is shortened to ' + o.account.email);
    ok(auth && !rep.includes(auth.at) && !rep.includes(auth.rt) && !(dev.key && rep.includes(dev.key)), 'neither the session tokens nor this device’s secret key are in it');
    await D(page, 'D.diag.open()'); await page.waitForTimeout(600); const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => document.querySelector('#own7B [data-a="xd:file"]').click())]);// (the page redraws itself, so the button is pressed in one step)
    ok(/^coaster-lab-diagnostics-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), '⬇ Download the report saves “' + dl.suggestedFilename() + '”');
    await page.evaluate(() => document.querySelector('#own7B [data-a="xd:copy"]').click()); await page.waitForTimeout(500); const box = await page.evaluate(() => { const t = document.getElementById('dgIO'); return t && !t.hidden ? t.value.length : 0 });
    ok(box > 500, '📋 Copy the report also shows the text in a box (for browsers that do not allow copying)'); await browser.close();
  }
  // ---------- E. the frame counter, and who can reach any of this
  if (ONLY.includes('E')) {
    const { browser, page } = await open(F, { w: 390, h: 844 }); await D(page, 'D.diag.open()'); await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelector('#own7B [data-a="xd:ov"]').click()); await page.waitForTimeout(1200); const t = await D(page, 'D.diag.ovText()');
    ok(/\d+ fps · [\d.]+ ms \(95%: \d+\) · \d+ draws · \d+k tris/.test(t), 'the frame counter can be put on screen: “' + t + '”');
    await page.evaluate(() => document.querySelector('#own7B [data-a="xd:ov"]').click()); await page.waitForTimeout(300); ok(await page.evaluate(() => !document.getElementById('dgOv')), 'and taken off again'); await browser.close();
    const P = await open(F, { w: 390, h: 844, init: 'window.__coasterTestHarness = false;' });
    const r = await P.page.evaluate(() => ({ hooks: !!window.__coasterDebug, own: document.querySelector('#own7').hidden, ov: !document.getElementById('dgOv'), tab: !!document.querySelector('#own7 .ownT [data-tab="diag10"]') }));
    ok(!r.hooks && r.own && r.ov && r.tab, 'for a player the page exists only as a tab inside the locked Owner Control Center: nothing of it is on screen and there are no test hooks'); await P.browser.close();
  }
  // ---------- F. four screen sizes
  if (ONLY.includes('F')) {
    for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1200, 800]]) {
      const { browser, page, errors } = await open(F, { w, h, mobile: w < 1000 }); await page.waitForTimeout(1200); await D(page, 'D.diag.open()'); await page.waitForTimeout(700);
      const r = await page.evaluate(() => { const b = document.querySelector('#own7B'); return { over: b.scrollWidth - b.clientWidth, cells: document.querySelectorAll('#own7B .ostat10 > div').length, clipped: [...document.querySelectorAll('#own7B .ob')].filter(x => { const q = x.getBoundingClientRect(); return q.right > innerWidth + 1 || q.left < -1 }).length } });
      ok(r.over <= 1 && r.cells > 30 && r.clipped === 0 && quiet(errors).length === 0, w + '×' + h + ': the page fits (no sideways scrolling, ' + r.cells + ' readings, every button on screen), no errors'); await page.screenshot({ path: SH + 'v101_diag_' + w + 'x' + h + '.png' }); await browser.close();
    }
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e.stack || e.message).slice(0, 600)); process.exit(1) });
