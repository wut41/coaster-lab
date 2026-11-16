// Coaster Lab 10.1 — saves you can rely on (My Park): the daily backups, going back to one, a save that cannot be
// read, the same park open in two tabs, backup files, the warning that stays while saving fails, and going back to
// 10.0 with a park that 10.1 saved.
// "(10.0, for comparison)" lines run the same steps on coaster_lab_v10_0.html and PASS when 10.0 shows the problem.
//   node t21_saves.js          T21=BC node t21_saves.js
const { open, tab } = require('./harness'), fs = require('fs');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_1.html', OLD = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
fs.mkdirSync(SH, { recursive: true });
const ONLY = process.env.T21 || 'ABCDEFG';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const quiet = e => e.filter(x => !/WebSocket|ERR_FAILED|net::|Failed to load resource|could not save|another tab|damaged/.test(x));
const T = (pg, expr, a) => pg.evaluate(new Function('a', 'const D = window.__coasterDebug.v80.v10, T = D.ty; return ' + expr), a);
const boot = async pg => { await pg.waitForFunction(() => window.__booted === true, null, { timeout: 60000 }); await pg.waitForTimeout(1200) };
// play one park day: add a bench so the park differs, close the park, let the night pass
const day = async (pg, k) => { await T(pg, "T.build('bench', a, 46, 0)", 14 + k); await T(pg, 'T.dayEnd()'); await pg.waitForTimeout(150); await pg.evaluate(() => { const e = document.querySelector('#tyDay'); if (e) e.hidden = true }); await T(pg, 'T.time(1439.6)'); await T(pg, 'T.ff(1)'); await T(pg, 'T.time(539)'); await T(pg, 'T.ff(1.5)') };
const KEY = 'coasterlab.v10.park.career';
// two windows side by side: both stay "visible" whatever the test browser does with its tabs
// (the test browser shows and hides its tabs as the test talks to them: only the test's own changes count here)
const pin = pg => pg.evaluate(() => { window.__vis = 'visible'; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__vis }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__vis !== 'visible' }); document.addEventListener('visibilitychange', e => { if (!e.__test) e.stopImmediatePropagation() }, true) });
const show = (pg, v) => pg.evaluate(v => { window.__vis = v; const e = new Event('visibilitychange', { bubbles: true }); e.__test = true; document.dispatchEvent(e) }, v);
(async () => {
  // ---------- A. a backup at the end of each park day (the last three), and going back to one
  if (ONLY.includes('A')) {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 });
    await T(page, "T.fresh('career', 50000)"); await page.waitForTimeout(500); ok((await T(page, 'D.saves.list()')).length === 0, 'a new park has no backups yet');
    for (let k = 0; k < 4; k++) await day(page, k);
    let l = await T(page, 'D.saves.list()'); const st = await T(page, 'T.state()');
    ok(l.length === 3 && l.every(b => b.why === 'day') && l[0].day > l[1].day && l[1].day > l[2].day, 'after four park days the last three are kept, newest first (days ' + l.map(b => b.day).join(', ') + '; now day ' + st.day + ')');
    ok(l[0].things === 4 && l[1].things === 3 && l[2].things === 2, 'each backup is the park as it was that evening (' + l.map(b => b.things + ' things').join(', ') + ')');
    await T(page, "T.act('hq', 'park')"); await page.waitForTimeout(700);
    const txt = await page.evaluate(() => document.querySelector('#pkB').textContent); ok(/Saves and backups/.test(txt) && /Saved on this device/.test(txt) && /kB/.test(txt) && (txt.match(/end of day/g) || []).length === 3, 'Office → Park shows when the park was saved, how big it is, and the three backups');
    await page.screenshot({ path: SH + 'v101_saves_390x844.png' });
    // go back two days
    const want = l[2]; await page.evaluate(i => document.querySelector('#pkB [data-x="svBak:' + i + '"]').click(), want.i); await page.waitForTimeout(400);
    const q = await page.evaluate(() => document.querySelector('#dlg7T').textContent); await page.click('#dlg7Y'); await page.waitForTimeout(900);
    const st2 = await T(page, 'T.state()'), l2 = await T(page, 'D.saves.list()');
    ok(/Go back to the backup from day/.test(q) && st2.objs === want.things && st2.day === want.day, 'Restore asks first, then the park is the one from day ' + want.day + ' again (' + st2.objs + ' things)');
    ok(l2.some(b => b.why === 'restore' && b.things === 4), 'the park that was replaced is kept as a backup (“before a restore”)');
    ok(quiet(errors).length === 0, 'no errors' + (quiet(errors).length ? ': ' + quiet(errors).slice(0, 2).join(' | ') : '')); await browser.close();
  }
  // ---------- B. a save that cannot be read
  if (ONLY.includes('B')) {
    const run = async (file, withBackup) => {
      const { browser, page, errors } = await open(file, { w: 390, h: 844 });
      await T(page, "T.fresh('career', 50000)"); await page.waitForTimeout(400); if (withBackup) { await day(page, 0); await day(page, 1) } else { await T(page, "T.build('bench', 15, 46, 0)"); await T(page, 'T.save()') }
      const before = await T(page, 'T.state()'); await T(page, 'T.save()'); await T(page, 'T.exit()'); await page.waitForTimeout(300);// (a page that is closing saves the park it has open, so leave it first)
      await page.evaluate(k => localStorage.setItem(k, '{"v":1,"name":"My Pa'), KEY);// half a save
      await page.reload(); await boot(page); await T(page, "T.open('career')"); await page.waitForTimeout(700);
      const after = await T(page, 'T.state()'), feed = await page.evaluate(() => document.querySelector('#tyFeed').textContent), kept = await page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k + '.damaged')).text } catch (e) { return null } }, KEY);
      await T(page, 'T.save()'); const raw = await page.evaluate(k => localStorage.getItem(k), KEY); await browser.close(); return { before, after, feed, kept, raw, errors: quiet(errors) };
    };
    const o = await run(OLD, true), n = await run(F, true), n2 = await run(F, false);
    ok(o.after.objs === 0 && o.after.day === 1 && !/My Pa$/.test(o.raw) && !o.kept, '(10.0, for comparison) a save that cannot be read is silently replaced by an empty new park (was day ' + o.before.day + ' with ' + o.before.objs + ' things; now day ' + o.after.day + ' with ' + o.after.objs + ')');
    ok(n.after.objs >= 1 && n.after.day >= 2 && /could not be read/.test(n.feed) && /backup from day/.test(n.feed), '10.1: the newest backup is loaded instead, and the game says so (“' + n.feed.slice(0, 96) + '…”)');
    ok(n.kept === '{"v":1,"name":"My Pa', '10.1: the damaged save is kept, not thrown away');
    ok(n2.after.objs === 0 && /no backup/.test(n2.feed) && n2.kept === '{"v":1,"name":"My Pa', '10.1: with no backup to fall back on a new park starts, the player is told, and the damaged save is still kept');
    ok(n.errors.length === 0 && n2.errors.length === 0, 'no errors' + ([...n.errors, ...n2.errors].slice(0, 2).join(' | ')));
  }
  // ---------- C. the same park open in two tabs
  if (ONLY.includes('C')) {
    // B "sees" a save of A once the browser has passed it on (tabs learn about each other's storage with a small delay)
    const seen = (A, B) => A.page.evaluate(() => window.__coasterDebug.v80.v10.saves.rv()).then(rv => B.page.waitForFunction(r => { const q = JSON.parse(localStorage.getItem('coasterlab.v10.park.career.rv') || '{}'); return q.n === r.n && q.sid === r.sid }, rv, { timeout: 15000 }).catch(() => {}));
    const run = async (file, deaf) => {
      const A = await open(file, { w: 390, h: 844 }); await pin(A.page); await T(A.page, "T.fresh('career', 50000)"); await A.page.waitForTimeout(400); await T(A.page, "T.build('bench', 15, 46, 0)"); await T(A.page, 'T.save()');
      const B = await tab(A.ctx, file); await pin(B.page); await T(B.page, "T.open('career')"); await B.page.waitForTimeout(600);
      if (deaf) await B.page.evaluate(() => addEventListener('storage', e => e.stopImmediatePropagation(), true));// a tab that was asleep
      // tab A is the one being played: it builds two more things and saves. (Both tabs save by themselves every few seconds;
      // if tab B happened to save first, A is told so and loads that park before carrying on, exactly as a player would.)
      let aSaved = false; for (let k = 0; k < 4 && !aSaved; k++) { if (file === F && (await T(A.page, 'D.saves.state()')).stale) { await A.page.evaluate(() => { const b = document.querySelector('#tyDay [data-ty="svLoad"]'); if (b) b.click() }); await A.page.waitForTimeout(600) }
        const n0 = (await T(A.page, 'T.state()')).objs; for (let i = n0; i < 3; i++) await T(A.page, "T.build('bench', a, 46, 0)", 15 + i * 2); aSaved = await T(A.page, 'T.save()'); if (file !== F) break }
      if (file === F) await seen(A, B); else await B.page.waitForTimeout(900);
      const { bSaved, stored } = await B.page.evaluate(k => ({ bSaved: window.__coasterDebug.v80.v10.ty.save(), stored: JSON.parse(localStorage.getItem(k)).objs.length }), KEY);// (in one step, so tab A cannot save in between)
      let s = null, chip = '', card = '', after = null;
      if (file === F) { await B.page.waitForFunction(() => !!document.querySelector('#tyDay [data-ty="svLoad"]'), null, { timeout: 6000 }).catch(() => {}); s = await T(B.page, 'D.saves.state()'); chip = s.chip; card = await B.page.evaluate(() => { const e = document.querySelector('#tyDay'); return e.hidden ? '' : e.textContent });
        const btn = await B.page.evaluate(() => { const b = document.querySelector('#tyDay [data-ty="svLoad"]'); if (b) b.click(); return !!b }); await B.page.waitForTimeout(1900); after = { btn, st: await T(B.page, 'T.state()'), s: await T(B.page, 'D.saves.state()'), saved: await T(B.page, 'T.save()') };
        if (!btn || bSaved) console.log('  (debug) A saved: ' + aSaved + ' · B state: ' + JSON.stringify(s) + ' · A state: ' + JSON.stringify(await T(A.page, 'D.saves.state()'))) }
      const errs = quiet([...A.errors, ...B.errors]); await A.browser.close(); return { aSaved, bSaved, stored, s, chip, card, after, errs };
    };
    const o = await run(OLD, false), n = await run(F, false), nd = await run(F, true);
    ok(o.bSaved && o.stored === 1, '(10.0, for comparison) the tab holding the older park saves over the newer one: two of the three benches are gone (' + o.stored + ' left)');
    ok(n.aSaved && !n.bSaved && n.stored === 3 && n.s.stale && /another tab/.test(n.chip) && /open somewhere else/.test(n.card), '10.1: the older tab stops saving, the newer park stays (' + n.stored + ' things), and the tab says why (“' + n.chip + '”)');
    ok(n.after.btn && n.after.st.objs === 3 && !n.after.s.stale && n.after.saved && n.after.s.chip === '', '“Carry on here with the newer park” brings that tab up to date and makes it the one that saves' + (n.after.btn && n.after.st.objs === 3 && !n.after.s.stale && n.after.saved && n.after.s.chip === '' ? '' : ' — ' + JSON.stringify({ btn: n.after.btn, objs: n.after.st.objs, stale: n.after.s.stale, saved: n.after.saved, chip: n.after.s.chip })));
    ok(!nd.bSaved && nd.stored === 3 && nd.s.stale, 'a tab that never heard about the other save still refuses to overwrite it (the saves are numbered)');
    // a tab that was in the background when the other one saved: it catches up by itself when you come back to it
    { const A = await open(F, { w: 390, h: 844 }); await pin(A.page); await T(A.page, "T.fresh('career', 50000)"); await A.page.waitForTimeout(400); await T(A.page, "T.build('bench', 15, 46, 0)"); await T(A.page, 'T.save()');
      const B = await tab(A.ctx, F); await pin(B.page); await T(B.page, "T.open('career')"); await B.page.waitForTimeout(500);
      await show(B.page, 'hidden'); await A.page.waitForTimeout(600); await T(A.page, "T.open('career')"); await A.page.waitForTimeout(300);
      await T(A.page, "T.build('bench', 17, 46, 0)"); await T(A.page, 'T.save()'); await seen(A, B); await B.page.waitForFunction(() => window.__coasterDebug.v80.v10.saves.state().stale, null, { timeout: 8000 }).catch(() => {}); const s1 = await T(B.page, 'D.saves.state()'), card1 = await B.page.evaluate(() => !document.querySelector('#tyDay').hidden);
      await show(B.page, 'visible'); await B.page.waitForTimeout(900);
      const s2 = await T(B.page, 'D.saves.state()'), st = await T(B.page, 'T.state()'), feed = await B.page.evaluate(() => document.querySelector('#tyFeed').textContent);
      ok(s1.stale && !card1 && !s2.stale && st.objs === 2 && /newer park from your other tab/.test(feed), 'a tab that was in the background loads the newer park by itself when you come back to it, and says so'); await A.browser.close() }
    ok(n.errs.length === 0 && nd.errs.length === 0, 'no errors' + ([...n.errs, ...nd.errs].slice(0, 2).join(' | ')));
  }
  // ---------- D. backup files
  if (ONLY.includes('D')) {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 });
    await T(page, "T.fresh('career', 50000)"); await page.waitForTimeout(400); for (const i of [15, 17, 19]) await T(page, "T.build('bench', a, 46, 0)", i); await T(page, 'T.save()');
    const txt = await T(page, 'D.saves.file()'), f = JSON.parse(txt);
    ok(f.app === 'Coaster Lab' && f.kind === 'park-backup' && f.slot === 'career' && typeof f.sum === 'string' && JSON.parse(f.park).objs.length === 3 && !/coasterlab-device|refresh_token|access_token/.test(txt), 'a backup file holds the whole park with a checksum, and nothing about the device or an account');
    const chk = t => T(page, 'D.saves.check(a)', t);
    ok((await chk(txt)).ok === true && (await chk(txt)).things === 3, 'the game accepts its own backup file');
    const bad = { cut: JSON.stringify({ ...f, park: f.park.slice(0, -40) }), edited: JSON.stringify({ ...f, park: f.park.replace(/"money":[\d.]+/, '"money":99999999') }), visit: JSON.stringify({ app: 'Coaster Lab', kind: 'park', v: '10.1', code: 'CL10Jabc' }), all: JSON.stringify({ app: 'Coaster Lab', kind: 'saves', data: {} }), other: JSON.stringify({ app: 'Something Else', kind: 'park-backup', park: '{}' }), noise: 'this is not json', sand: JSON.stringify({ ...f, mode: 'sandbox' }) };
    const why = {}; for (const k in bad) why[k] = (await chk(bad[k])).why || '';
    ok(/checksum/.test(why.cut) && /checksum/.test(why.edited), 'a file that was cut short or edited by hand is refused: “' + why.cut + '”');
    ok(/to visit/.test(why.visit) && /all of the game/.test(why.all) && /not made by Coaster Lab/.test(why.other) && /not readable/.test(why.noise) && /Sandbox park/.test(why.sand), 'every other wrong file gets its own plain reason (a park to visit, a full save file, another app, not a file, a Sandbox backup in a Career park)');
    // download it, change the park, then restore from the file through the Office
    await T(page, "T.act('hq', 'park')"); await page.waitForTimeout(600);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#pkB [data-x="svFile"]')]); const p = await dl.path(), got = fs.readFileSync(p, 'utf8');
    ok(/\.coasterbackup\.json$/.test(dl.suggestedFilename()) && JSON.parse(got).kind === 'park-backup', '⬇ Download a backup file saves “' + dl.suggestedFilename() + '”');
    await T(page, "T.act('hq')"); await page.evaluate(() => { const x = document.querySelector('#pk72 [data-x="close"]'); if (x) x.click() }); for (const i of [21, 23]) await T(page, "T.build('bench', a, 46, 0)", i); await T(page, 'T.save()');
    await T(page, "T.act('hq', 'park')"); await page.waitForTimeout(600);
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#pkB [data-x="svFileIn"]')]); await fc.setFiles({ name: 'my.coasterbackup.json', mimeType: 'application/json', buffer: Buffer.from(got) }); await page.waitForTimeout(500);
    const q = await page.evaluate(() => document.querySelector('#dlg7').hidden ? '' : document.querySelector('#dlg7T').textContent); await page.click('#dlg7Y'); await page.waitForTimeout(900);
    const st = await T(page, 'T.state()'), l = await T(page, 'D.saves.list()');
    ok(/Replace this park with the backup/.test(q) && st.objs === 3 && l.some(b => b.why === 'file' && b.things === 5), 'Restore from a backup file asks first, puts the 3-bench park back, and keeps the 5-bench park as a backup');
    // a damaged file through the same button says why and changes nothing
    await T(page, "T.act('hq', 'park')"); await page.waitForTimeout(500);
    const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#pkB [data-x="svFileIn"]')]); await fc2.setFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from(bad.cut) }); await page.waitForTimeout(700);
    const msg = await page.evaluate(() => (document.querySelector('#pkB [role="alert"]') || { textContent: '' }).textContent);
    ok(/checksum/.test(msg) && (await T(page, 'T.state()')).objs === 3, 'a damaged file picked there shows the reason on the page and leaves the park alone');
    ok(quiet(errors).length === 0, 'no errors' + (quiet(errors).length ? ': ' + quiet(errors).slice(0, 2).join(' | ') : '')); await browser.close();
  }
  // ---------- E. when saving does not work
  if (ONLY.includes('E')) {
    const { browser, page } = await open(F, { w: 390, h: 844 });
    await T(page, "T.fresh('career', 50000)"); await page.waitForTimeout(400); await T(page, 'T.save()');
    await page.evaluate(k => { const s0 = Storage.prototype.setItem; window.__full = true; Storage.prototype.setItem = function (key, v) { if (window.__full && key === k) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e } return s0.call(this, key, v) } }, KEY);
    const saved = await T(page, 'T.save()'), s = await T(page, 'D.saves.state()'); await T(page, "T.act('hq', 'park')"); await page.waitForTimeout(600); const txt = await page.evaluate(() => document.querySelector('#pkB').textContent);
    ok(!saved && !s.ok && /Not saved/.test(s.chip) && /The last save did not work/.test(txt) && /Download a backup file/.test(txt), 'when storage is full a warning stays on screen (“' + s.chip + '”) and the Office explains what to do');
    await page.screenshot({ path: SH + 'v101_saves_failing_390x844.png' });
    const diag = await T(page, 'D.diag.snap().warnings.filter(w => /save/i.test(w.t)).map(w => w.lv + ": " + w.t)'); ok(diag.length === 1 && /^bad/.test(diag[0]), 'the Diagnostics page lists it too (' + diag[0] + ')');
    await page.evaluate(() => { window.__full = false }); const again = await T(page, 'T.save()'), s2 = await T(page, 'D.saves.state()');
    ok(again && s2.ok && s2.chip === '', 'as soon as a save works again the warning goes away'); await browser.close();
  }
  // ---------- F. four screen sizes
  if (ONLY.includes('F')) {
    for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1200, 800]]) {
      const { browser, page, errors } = await open(F, { w, h, mobile: w < 1000 }); await T(page, "T.fresh('career', 50000)"); await page.waitForTimeout(400); await day(page, 0); await T(page, "T.act('hq', 'park')"); await page.waitForTimeout(700);
      const r = await page.evaluate(() => { const b = document.querySelector('#pkB'), row = [...b.querySelectorAll('h3')].find(x => /Saves and backups/.test(x.textContent)); if (row) row.scrollIntoView(); return { over: b.scrollWidth - b.clientWidth, has: !!row, btns: [...b.querySelectorAll('[data-x^="sv"]')].every(x => { const q = x.getBoundingClientRect(); return q.width > 0 && q.left >= 0 && q.right <= innerWidth + 1 }) } });
      ok(r.has && r.over <= 1 && r.btns && quiet(errors).length === 0, w + '×' + h + ': Saves and backups fits the Office (no sideways scrolling, every button on screen), no errors'); await page.screenshot({ path: SH + 'v101_saves_' + w + 'x' + h + '.png' }); await browser.close();
    }
  }
  // ---------- G. going back: a park saved by 10.1 opens in 10.0, and comes back to 10.1
  if (ONLY.includes('G')) {
    const L = require('./tools/park_lib'), P = (pg, expr, a) => pg.evaluate(new Function('a', 'const D = window.__coasterDebug.v80.v10, T = D.ty, P = D.pro; return ' + expr), a);
    const all = pg => pg.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k) } return o });
    // 10.1: a park with a day of books, the service policy switched on and a short line on the carousel
    let w = await open(F, { w: 1200, h: 800, mobile: false }); await P(w.page, 'T.fresh("career", 60000)'); await P(w.page, 'T.speed(0)');
    for (const [k, i, j] of [['carousel', 21, 40], ['burger', 26, 43], ['bench', 23, 44]]) { const b = await w.page.evaluate(L.place, [k, i, j, 6]); if (!b.ok) throw new Error('could not build ' + k); await w.page.evaluate(L.connect, [b.id]) }
    await P(w.page, 'T.time(600)'); await P(w.page, 'T.spawn(40)'); await P(w.page, 'T.ff(100)'); await P(w.page, 'T.dayEnd()'); await w.page.waitForTimeout(150); await w.page.evaluate(() => { const e = document.querySelector('#tyDay'); if (e) e.hidden = true }); await P(w.page, 'T.act("dayx")');
    await P(w.page, 'P.setPol(1)'); await P(w.page, 'T.act("hq", "rep")'); await w.page.waitForTimeout(500); await w.page.evaluate(() => document.querySelector('#pkB [data-x^="ql:"]').click()); await w.page.waitForTimeout(300); await P(w.page, 'T.save()');
    const a = await P(w.page, 'T.saved()'), raw = await all(w.page), e1 = quiet(w.errors); await w.browser.close();
    // 10.0 opens it, lets some park time pass and saves it its own way
    w = await open(OLD, { w: 1200, h: 800, mobile: false, storage: raw }); await T(w.page, 'T.open("career")'); await w.page.waitForTimeout(1200); const st0 = await T(w.page, 'T.state()'); await T(w.page, 'T.ff(30)'); await T(w.page, 'T.save()');
    const b = await T(w.page, 'T.saved()'), raw0 = await all(w.page), e0 = quiet(w.errors); await w.browser.close();
    ok(a.wk && a.wk.length >= 1 && !!a.pol && a.objs[0].ql === 1 && e1.length === 0 && st0.day === a.day && Math.round(st0.money) === Math.round(a.money) && st0.objs === a.objs.length && e0.length === 0, `a park saved by 10.1 (day ${a.day}, $${Math.round(a.money)}, ${a.objs.length} things, a week of books, a staff policy, a short line) opens in 10.0 with the same day, money and things, and no errors` + (e0.length ? ' — errors: ' + e0.join(' | ').slice(0, 200) : ''));
    ok(!('wk' in b) && !('pol' in b) && b.objs.every(o => o.ql === undefined) && b.objs.length === a.objs.length, 'when 10.0 saves it again, only what 10.0 does not know is gone: the week’s books, the staff policy and the short line');
    // and back in 10.1
    w = await open(F, { w: 1200, h: 800, mobile: false, storage: raw0 }); await P(w.page, 'T.open("career")'); await w.page.waitForTimeout(1200);
    const st1 = await P(w.page, 'T.state()'), sv = await P(w.page, 'D.saves.state()'), wk1 = await P(w.page, 'P.wk()'), e2 = quiet(w.errors); await w.browser.close();
    ok(st1.day === b.day && Math.round(st1.money) === Math.round(b.money) && st1.objs === b.objs.length && !sv.stale && wk1.length === 0 && e2.length === 0, `back in 10.1 the park is as 10.0 left it (day ${st1.day}, $${Math.round(st1.money)}, ${st1.objs} things): no errors, no “another tab has a newer park” warning, and the books start again` + (e2.length ? ' — errors: ' + e2.join(' | ').slice(0, 200) : ''));
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e.stack || e.message).slice(0, 600)); process.exit(1) });
