// Coaster Lab 10.0 — player accounts: the sign-in page, creating an account with an email and a password, signing in
// and out, parks tied to the account (cloud saves on several devices, never overwritten without asking), published
// parks owned by the account, and everything still working signed out, offline and before the database is set up.
// The account server and the database are played by tests/tools/cloud_mock.js (same rules as the SQL migration).
const { open } = require('./harness'), L = require('./tools/park_lib'), makeCloud = require('./tools/cloud_mock');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const ONLY = process.env.T11 || 'ABCDEFG';// run some sections only: T11=BC node t11_v10_account.js
const D = 'window.__coasterDebug.v80.v10', PW = 'correct-horse-9', quiet = e => e.filter(x => !/Failed to load resource|ERR_FAILED|WebSocket connection/.test(x));// refused requests are part of these tests; the live-presence socket has no stand-in here
const until = async (pg, f, a, ms = 12000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await pg.evaluate(f, a)) return true; await pg.waitForTimeout(150) } return false };
const idle = pg => until(pg, () => { const s = window.__coasterDebug.v80.v10.acct.state(); return !s.busy && !s.syncing });
const st = pg => pg.evaluate(() => window.__coasterDebug.v80.v10.acct.state());
const park = pg => pg.evaluate(() => { const s = window.__coasterDebug.v80.v10.ty.state(); return s && { name: s.name, day: s.day, money: s.money, objs: s.objs, mode: s.mode } });
(async () => {
  // ---------- A. signed out: nothing changes, nothing is sent
  if (ONLY.includes('A')) {
    const { cloud, db } = makeCloud(), { browser, page, errors } = await open(F, { w: 390, h: 844, cloud, skipStart: false }), X = (f, a) => page.evaluate(f, a);
    ok(await X(() => { const c = document.querySelector('#start .acChip'); return !!c && /Sign in/.test(c.textContent) && c.getBoundingClientRect().height >= 40 }), 'the title screen has a 👤 Sign in button');
    ok(await X(() => document.querySelector('#acct10').hidden), 'the sign-in page is not shown until you ask for it');
    await page.click('#start [data-go="ty10"]'); await page.waitForTimeout(900); await X(() => window.__coasterDebug.v80.v10.ty.build('carousel', 21, 41, 0)); await X(() => window.__coasterDebug.v80.v10.ty.ff(20));
    const p = await park(page); ok(p && p.objs >= 1 && !(await st(page)).in, 'signed out, My Park works as before (built a Carousel; ' + p.objs + ' things)');
    await X(() => window.__coasterDebug.v80.v10.ty.save()); ok(await X(() => !!localStorage.getItem('coasterlab.v10.park.career') && !localStorage.getItem('coasterlab-device.v10.auth')), 'the park is saved on this device; no account data is stored');
    ok(!db.calls.some(c => c.startsWith('auth/') || /^cl_(me|save)/.test(c)), 'signed out, nothing is sent to the account server (' + db.calls.length + ' cloud calls in all)');
    ok(quiet(errors).length === 0, 'no errors signed out' + (quiet(errors).length ? ': ' + quiet(errors).slice(0, 3).join(' | ') : '')); await browser.close();
  }
  // ---------- B. the sign-in page: create an account, checks, signing out and in
  if (ONLY.includes('B')) {
    const { cloud, db } = makeCloud(), { browser, page, errors } = await open(F, { w: 390, h: 844, cloud, skipStart: false }), X = (f, a) => page.evaluate(f, a);
    await page.click('#start .acChip'); await page.waitForTimeout(300);
    ok(await X(() => !document.querySelector('#acct10').hidden && document.querySelector('#acct10').getAttribute('role') === 'dialog'), 'tapping it opens the sign-in page');
    ok(await X(() => { const e = document.querySelector('#acEmail'), p = document.querySelector('#acPw'), f = document.querySelector('#acF'); return f.tagName === 'FORM' && e.type === 'email' && e.autocomplete === 'username' && p.type === 'password' && p.autocomplete === 'current-password' && !!document.querySelector('label[for="acEmail"]') && !!document.querySelector('label[for="acPw"]') }), 'a real form: labelled email and password fields that password managers understand');
    ok(await X(() => [...document.querySelectorAll('#acB input')].every(i => parseFloat(getComputedStyle(i).fontSize) >= 16 && i.getBoundingClientRect().height >= 44)), 'fields are 16 px text and at least 44 px tall (no zoom-in on iPhone, easy to tap)');
    ok(await X(() => /Play without an account/.test(document.querySelector('#acB').textContent) && /works without an account/.test(document.querySelector('#acB').textContent)), 'it says the game works without an account and offers “Play without an account”');
    await page.screenshot({ path: SH + 'v10_account_signin_phone.png' });
    await page.click('#acB [data-ac="mode:up"]'); await page.waitForTimeout(200);
    ok(await X(() => !!document.querySelector('#acName') && document.querySelector('#acPw').autocomplete === 'new-password' && /Create my account/.test(document.querySelector('.acGo').textContent)), '“Create account” adds a player name and asks for a new password');
    // checks before anything is sent
    const n0 = db.calls.length;
    await page.fill('#acName', 'Al'); await page.fill('#acEmail', 'robin@example.test'); await page.fill('#acPw', PW); await page.click('.acGo'); await page.waitForTimeout(250); const e1 = (await st(page)).err;
    await page.fill('#acName', 'Robin'); await page.fill('#acEmail', 'not-an-email'); await page.click('.acGo'); await page.waitForTimeout(250); const e2 = (await st(page)).err;
    await page.fill('#acEmail', 'robin@example.test'); await page.fill('#acPw', 'short'); await page.click('.acGo'); await page.waitForTimeout(250); const e3 = (await st(page)).err;
    ok(/3 to 24/.test(e1) && /email/.test(e2) && /8 characters/.test(e3) && db.calls.length === n0 && db.users.length === 0, 'a too-short name, a wrong email and a short password are explained on the page; nothing is sent');
    ok(await X(() => { const m = document.querySelector('#acB .acMsg.bad'); return !!m && m.getAttribute('role') === 'alert' && document.querySelector('#acName').value === 'Robin' && document.querySelector('#acEmail').value === 'robin@example.test' }), 'the message is announced (role=alert) and what you typed stays in the fields');
    await page.click('#acB .acEye'); await page.waitForTimeout(150); ok(await X(() => document.querySelector('#acPw').type === 'text' && document.querySelector('#acPw').value === 'short'), '👁 shows the password you typed');
    await page.click('#acB .acEye'); await page.fill('#acPw', PW); await page.click('.acGo'); await idle(page); await page.waitForTimeout(300);
    let s = await st(page); const u = db.users[0];
    ok(s.in && s.name === 'Robin' && s.email === 'robin@example.test' && u && u.email === 'robin@example.test' && u.name === 'Robin', 'Create my account: the account exists and you are signed in at once as Robin');
    ok(db.mails === 0, 'no email was needed or sent to create the account');
    ok(await X(pw => { const all = JSON.stringify(Object.fromEntries(Object.entries(localStorage))); return !all.includes(pw) && /"at":"at\./.test(localStorage.getItem('coasterlab-device.v10.auth')) }, PW), 'this device keeps the session, never the password');
    ok(await X(() => { const saves = Object.keys(localStorage).filter(k => k.startsWith('coasterlab.')), tok = JSON.parse(localStorage.getItem('coasterlab-device.v10.auth')).at, dev = JSON.parse(localStorage.getItem('coasterlab-device.v10.dev') || '{"key":"-none-"}').key; return saves.length > 0 && !saves.some(k => /\.(auth|dev|sync)$/.test(k)) && !saves.some(k => { const v = localStorage.getItem(k) || ''; return v.includes(tok) || v.includes(dev) }) }), 'the session and the device secret are stored apart from the saves, so “Save a copy” and backups (every coasterlab.* key) never contain them');
    ok(await X(() => /Robin/.test(document.querySelector('#acB .acWho').textContent) && /Sign out/.test(document.querySelector('#acB').textContent) && /Career park/.test(document.querySelector('#acB').textContent)), 'the page now shows your account: name, email, your parks, Sign out');
    await page.screenshot({ path: SH + 'v10_account_signed_in_phone.png' });
    await page.click('#acB [data-ac="close"], #acct10 .acX'); await page.waitForTimeout(200); ok(await X(() => /Robin/.test(document.querySelector('#start .acChip').textContent)), 'the title screen button now shows your player name');
    // sign out, wrong password, sign in
    await X(() => window.__coasterDebug.v80.v10.acct.open()); await page.waitForTimeout(200); await page.click('#acB [data-ac="out"]'); await idle(page); await page.waitForTimeout(300); s = await st(page);
    ok(!s.in && await X(() => !localStorage.getItem('coasterlab-device.v10.auth')) && /still on this device/.test(s.msg), 'Sign out removes the session from this device and says the parks stay here');
    await page.fill('#acEmail', 'robin@example.test'); await page.fill('#acPw', 'wrong-password'); await page.click('.acGo'); await idle(page); s = await st(page);
    ok(!s.in && s.err === 'Wrong email or password.', 'a wrong password: “' + s.err + '”');
    await page.fill('#acPw', PW); await page.keyboard.press('Enter'); await idle(page); s = await st(page); ok(s.in && s.name === 'Robin', 'the right password (Enter key) signs you in');
    // names and emails that are taken
    await X(() => window.__coasterDebug.v80.v10.acct.signOut()); await idle(page);
    await X(([p]) => window.__coasterDebug.v80.v10.acct.signUp('other@example.test', p, 'robin'), [PW]); await idle(page); const t1 = (await st(page)).err;
    await X(([p]) => window.__coasterDebug.v80.v10.acct.signUp('robin@example.test', p, 'Robin Two'), [PW]); await idle(page); const t2 = (await st(page)).err;
    ok(/name is taken/.test(t1) && /already an account/.test(t2) && db.users.length === 1, 'a taken player name and a taken email are refused with a clear reason');
    // changing the player name and the password while signed in
    await X(([p]) => window.__coasterDebug.v80.v10.acct.signIn('robin@example.test', p), [PW]); await idle(page);
    await X(() => window.__coasterDebug.v80.v10.acct.newName('Robin the Builder')); await idle(page); ok((await st(page)).name === 'Robin the Builder' && db.users[0].name === 'Robin the Builder', 'the player name can be changed in Account settings');
    await X(() => window.__coasterDebug.v80.v10.acct.newPw('a-brand-new-pass-1')); await idle(page); ok(db.users[0].password === 'a-brand-new-pass-1' && /changed/.test((await st(page)).msg), 'the password can be changed while signed in (no email involved)');
    // the session renews itself; when it cannot, you are signed out kindly and the game goes on
    await X(() => window.__coasterDebug.v80.v10.acct.expire()); const c0 = db.calls.filter(c => c === 'auth/token').length; await X(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(page);
    ok(db.calls.filter(c => c === 'auth/token').length === c0 + 1 && (await st(page)).in && !(await st(page)).syncErr, 'when the session is about to run out it is renewed quietly');
    Object.keys(db.refresh).forEach(k => delete db.refresh[k]); await X(() => window.__coasterDebug.v80.v10.acct.expire()); await X(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(page); s = await st(page);
    ok(!s.in && /sign in again/i.test(s.msg + s.syncErr), 'a session that can no longer be renewed signs you out with “please sign in again”');
    await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await page.waitForTimeout(700); ok((await park(page)) != null, 'and the game carries on: My Park opens');
    ok(quiet(errors).length === 0, 'no errors on the sign-in page' + (quiet(errors).length ? ': ' + quiet(errors).slice(0, 3).join(' | ') : '')); await browser.close();
  }
  // ---------- C. parks tied to the account: two devices, never overwritten without asking
  if (ONLY.includes('C')) {
    const { cloud, db } = makeCloud();
    const A = await open(F, { w: 1200, h: 800, mobile: false, cloud }), XA = (f, a) => A.page.evaluate(f, a);
    // device A: play signed out first, then create the account → the park goes with it
    await XA(() => window.__coasterDebug.v80.v10.ty.fresh('career', 40000)); await A.page.waitForTimeout(400); await XA(() => window.__coasterDebug.v80.v10.ty.path(24, 45, 24, 40));
    for (const q of [['carousel', 21, 41, 3], ['burger', 26, 43, 2], ['bench', 23, 44, 2]]) { const b = await XA(L.place, q); if (b.ok && q[0] === 'carousel') await XA(L.connect, [b.id]) }
    await XA(() => window.__coasterDebug.v80.v10.ty.ff(30)); await XA(() => window.__coasterDebug.v80.v10.ty.speed(0)); const pA = await park(A.page);
    await XA(([p]) => window.__coasterDebug.v80.v10.acct.signUp('sam@example.test', p, 'Sam'), [PW]); await idle(A.page); await A.page.waitForTimeout(300);
    let sv = db.saves.find(q => q.slot === 'career');
    ok(sv && sv.uid === db.users[0].id && sv.data.objs.length === pA.objs && sv.meta.day === pA.day && sv.meta.things === pA.objs && sv.rev === 1, 'creating an account sends the park you already built to your account (' + pA.objs + ' things, day ' + pA.day + ')');
    ok(sv && !JSON.stringify(sv.data).includes('"rt"') && /\w/.test(sv.device), 'the cloud save is the saved park (no runtime data) and notes which device sent it (“' + (sv && sv.device) + '”)');
    ok(!db.saves.some(q => q.slot === 'sandbox'), 'a park you never started is not uploaded');
    await XA(() => window.__coasterDebug.v80.v10.ty.exit()); await idle(A.page);
    // device B: a new device signs in → the park arrives
    const B = await open(F, { w: 390, h: 844, cloud }), XB = (f, a) => B.page.evaluate(f, a);
    ok(await XB(() => !localStorage.getItem('coasterlab.v10.park.career')), 'a second device starts with no park');
    await XB(([p]) => window.__coasterDebug.v80.v10.acct.signIn('sam@example.test', p), [PW]); await idle(B.page); await B.page.waitForTimeout(300);
    await XB(() => window.__coasterDebug.v80.v10.ty.open('career')); await B.page.waitForTimeout(900); await XB(() => window.__coasterDebug.v80.v10.ty.speed(0)); const pB = await park(B.page);
    ok(pB && pB.objs === pA.objs && pB.money === pA.money && pB.day === pA.day && pB.name === pA.name, 'signing in on another device brings the same park: ' + pB.objs + ' things, $' + pB.money + ', day ' + pB.day);
    // Devices take turns here like a player would: sync, open the park, play, save, leave. (A park that is open keeps
    // changing as its clock runs, so two devices with the same park open at once really are two different parks.)
    const turnStart = async pg => { await pg.evaluate(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(pg); await pg.evaluate(() => window.__coasterDebug.v80.v10.ty.open('career')); await pg.waitForTimeout(700); await pg.evaluate(() => window.__coasterDebug.v80.v10.ty.speed(0)); await pg.waitForTimeout(2800); await idle(pg); await pg.evaluate(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(pg) };
    const turnEnd = async pg => { await pg.evaluate(() => window.__coasterDebug.v80.v10.ty.save()); await pg.evaluate(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(pg); await pg.evaluate(() => window.__coasterDebug.v80.v10.ty.exit()); await pg.waitForTimeout(1400); await idle(pg) };
    // B plays on → saved to the account; A picks the newer park up by itself
    await XB(L.place, ['flowers', 22, 43, 3]); await XB(L.place, ['tree', 27, 41, 3]); const pB2 = await park(B.page); await turnEnd(B.page); sv = db.saves.find(q => q.slot === 'career');
    ok(sv.rev >= 2 && sv.data.objs.length === pB2.objs && pB2.objs === pA.objs + 2, 'playing on the second device saves the newer park to the account (revision ' + sv.rev + ', ' + pB2.objs + ' things)');
    await turnStart(A.page);
    ok((await park(A.page)).objs === pB2.objs && !(await st(A.page)).ask, 'back on the first device the newer park loads by itself (it had not changed there)');
    // both devices change the park → the player is asked, nothing is overwritten
    await XA(L.place, ['rock', 21, 45, 3]); await XA(() => window.__coasterDebug.v80.v10.ty.save()); const pA3 = await park(A.page);// not sent yet
    await turnStart(B.page); await XB(L.place, ['bench', 27, 45, 3]); await XB(L.place, ['lamp', 28, 46, 3]); const pB3 = await park(B.page); await turnEnd(B.page);
    await XA(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(A.page); let s = await st(A.page); sv = db.saves.find(q => q.slot === 'career');
    ok(s.ask && s.ask.slot === 'career' && s.ask.cloud.things === pB3.objs && s.ask.local.things === pA3.objs && sv.data.objs.length === pB3.objs && (await park(A.page)).objs === pA3.objs, 'when both devices changed the park, nothing is overwritten: the player is asked which one to keep (cloud ' + pB3.objs + ' things, this device ' + pA3.objs + ')');
    await XA(() => window.__coasterDebug.v80.v10.acct.open()); await A.page.waitForTimeout(300);
    ok(await XA(() => document.querySelectorAll('#acB .acPick button').length === 2 && /Two different Career parks/.test(document.querySelector('#acB').textContent) && /kept as a backup/.test(document.querySelector('#acB').textContent)), 'the account page shows both parks side by side and says the other one is kept as a backup');
    await A.page.screenshot({ path: SH + 'v10_account_choose_park.png' });
    await A.page.click('#acB [data-ac="keep:cloud"]'); await until(A.page, () => !window.__coasterDebug.v80.v10.acct.state().ask); await idle(A.page); await A.page.waitForTimeout(500);
    ok((await park(A.page)).objs === pB3.objs && await XA(() => window.__coasterDebug.v80.v10.acct.hasBak('career')), '“Use the park in my account” loads it; the other park is kept as a backup on this device');
    ok(await XA(() => window.__coasterDebug.v80.v10.acct.bak('career')) && (await park(A.page)).objs === pA3.objs, '↩ Backup swaps the two parks back');
    await XA(() => window.__coasterDebug.v80.v10.acct.bak('career')); await XA(() => window.__coasterDebug.v80.v10.acct.close()); await XA(() => window.__coasterDebug.v80.v10.ty.speed(0)); await A.page.waitForTimeout(3800); await idle(A.page); await XA(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(A.page);
    // the other choice: keep this device's park
    await XA(L.place, ['bush', 20, 46, 3]); await XA(L.place, ['pine', 19, 44, 3]); await XA(L.place, ['bin', 20, 43, 3]); await XA(() => window.__coasterDebug.v80.v10.ty.save()); const pA4 = await park(A.page);
    await turnStart(B.page); await XB(L.place, ['bush', 28, 44, 3]); await turnEnd(B.page);
    await XA(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(A.page); const asked = !!(await st(A.page)).ask; await XA(() => window.__coasterDebug.v80.v10.acct.keep('local')); await until(A.page, () => !window.__coasterDebug.v80.v10.acct.state().ask); await idle(A.page); sv = db.saves.find(q => q.slot === 'career');
    ok(asked && sv.data.objs.length === pA4.objs && (await park(A.page)).objs === pA4.objs, '“Keep this device’s park” makes it the park in the account (' + pA4.objs + ' things)');
    // only your own rows
    await XB(() => window.__coasterDebug.v80.v10.acct.signOut()); await idle(B.page); await XB(([p]) => window.__coasterDebug.v80.v10.acct.signUp('kim@example.test', p, 'Kim'), [PW]); await idle(B.page); s = await st(B.page);
    ok(s.in && s.name === 'Kim' && db.saves.filter(q => q.uid === db.users[1].id).every(q => q.uid !== db.users[0].id) && db.saves.find(q => q.uid === db.users[0].id && q.slot === 'career').data.objs.length === pA4.objs, 'another account on the same device has its own saves; Sam’s park in the cloud is untouched');
    // published parks belong to the account
    await XA(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await A.page.waitForTimeout(400); await XA(() => window.__coasterDebug.v80.v10.ty.publish()); await until(A.page, () => !!window.__coasterDebug.v80.v10.ty.state().cloud, null, 8000); const pub = db.parks[0];
    ok(pub && pub.uid === db.users[0].id && pub.author === 'Sam', 'a park published while signed in belongs to the account and carries the player name (“' + (pub && pub.author) + '”)');
    await XA(() => { window.__coasterDebug.v80.v10.ty.act('hq', 'share') }); await A.page.waitForTimeout(700);
    ok(await XA(() => { const t = document.querySelector('#pkB').textContent; return /Sam/.test(t) && /saved to your account/.test(t) && /in your account/.test(t) && !document.querySelector('#tyNickI') }), 'Park Office → Share shows the account, the published park “in your account”, and the name comes from the account');
    await A.page.screenshot({ path: SH + 'v10_account_share_tab.png' });
    const devA = await XA(() => localStorage.getItem('coasterlab-device.v10.dev')), rawA = await XA(() => localStorage.getItem('coasterlab.v10.park.career'));
    const C = await open(F, { w: 390, h: 844, cloud, storage: { 'coasterlab-device.v10.dev': devA, 'coasterlab.v10.park.career': rawA } }), XC = (f, a) => C.page.evaluate(f, a);
    await XC(() => window.__coasterDebug.v80.v10.ty.open('career')); await C.page.waitForTimeout(800); await XC(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await C.page.waitForTimeout(400); await XC(() => window.__coasterDebug.v80.v10.ty.publish()); await C.page.waitForTimeout(900);
    ok(db.parks.length === 1 && /belongs to an account/.test((await XC(() => window.__coasterDebug.v80.v10.ty.cloud())).why), 'signed out, even the same device cannot change a park that belongs to an account');
    ok(quiet(A.errors).length === 0 && quiet(B.errors).length === 0 && quiet(C.errors).length === 0, 'no errors on any device' + ([...quiet(A.errors), ...quiet(B.errors), ...quiet(C.errors)].slice(0, 3).join(' | ')));
    await A.browser.close(); await B.browser.close(); await C.browser.close();
  }
  // ---------- D. a project where "Confirm email" is still switched on
  if (ONLY.includes('D')) {
    const { cloud, db } = makeCloud({ confirm: true }), { browser, page, errors } = await open(F, { w: 390, h: 844, cloud }), X = (f, a) => page.evaluate(f, a);
    await X(() => window.__coasterDebug.v80.v10.acct.open('up')); await X(([p]) => window.__coasterDebug.v80.v10.acct.signUp('lee@example.test', p, 'Lee'), [PW]); await idle(page); let s = await st(page);
    ok(!s.in && db.users.length === 1 && /confirmed by email/.test(s.msg) && s.mode === 'in', 'if the project still asks for email confirmation, sign-up says so plainly instead of pretending: “' + s.msg.slice(0, 70) + '…”');
    await X(([p]) => window.__coasterDebug.v80.v10.acct.signIn('lee@example.test', p), [PW]); await idle(page); s = await st(page); ok(!s.in && /confirmed by email/.test(s.err), 'signing in before confirming explains what to do');
    db.users[0].confirmed = true; await X(([p]) => window.__coasterDebug.v80.v10.acct.signIn('lee@example.test', p), [PW]); await idle(page); ok((await st(page)).in, 'once confirmed, the same sign-in works');
    ok(quiet(errors).length === 0, 'no errors' + (quiet(errors).length ? ': ' + quiet(errors).slice(0, 3).join(' | ') : '')); await browser.close();
  }
  // ---------- E. forgot password (email-limited for now) and the link that comes back
  if (ONLY.includes('E')) {
    const { cloud, db } = makeCloud(), { browser, page, errors } = await open(F, { w: 390, h: 844, cloud }), X = (f, a) => page.evaluate(f, a);
    await X(([p]) => window.__coasterDebug.v80.v10.acct.signUp('ana@example.test', p, 'Ana'), [PW]); await idle(page); await X(() => window.__coasterDebug.v80.v10.acct.signOut()); await idle(page);
    await X(() => window.__coasterDebug.v80.v10.acct.open('in')); await page.waitForTimeout(200); await page.click('#acB [data-ac="forgot"]'); await page.waitForTimeout(250); ok(/email address first/.test((await st(page)).err), 'Forgot password? asks for the email address first');
    await page.fill('#acEmail', 'ana@example.test'); await page.click('#acB [data-ac="forgot"]'); await idle(page); let s = await st(page);
    ok(db.mails === 1 && /reset link is on its way/.test(s.msg) && /couple of emails an hour/.test(s.msg), 'it asks the account server for a reset email and is honest that emails are limited for now');
    await X(() => window.__coasterDebug.v80.v10.acct.recover('ana@example.test')); await idle(page); await X(() => window.__coasterDebug.v80.v10.acct.recover('ana@example.test')); await idle(page); s = await st(page);
    ok(db.mails === 3 && /couple of emails an hour/.test(s.err) && /Try again later/.test(s.err), 'when the email limit is reached: “' + s.err + '”');
    // the link in the email opens the game signed in, asking for a new password
    const sess = cloud('auth/token', { email: 'ana@example.test', password: PW }, { query: { grant_type: 'password' } }).json; await browser.close();
    const R = await open(F, { w: 390, h: 844, cloud, hash: '#access_token=' + sess.access_token + '&expires_in=3600&refresh_token=' + sess.refresh_token + '&token_type=bearer&type=recovery' }), XR = (f, a) => R.page.evaluate(f, a);
    await until(R.page, () => window.__coasterDebug.v80.v10.acct.state().recover); s = await st(R.page);
    ok(s.in && s.recover && s.open && s.email === 'ana@example.test' && await XR(() => !/access_token/.test(location.href) && /Choose a new password/.test(document.querySelector('#acB').textContent)), 'a reset link signs you in, asks for a new password, and the secret part of the link is removed from the address bar');
    await R.page.fill('#acPw2', 'my-new-password-7'); await R.page.click('#acB .acGo'); await idle(R.page); s = await st(R.page);
    ok(db.users[0].password === 'my-new-password-7' && !s.recover && /changed/.test(s.msg), 'the new password is saved');
    ok(quiet(errors).length === 0 && quiet(R.errors).length === 0, 'no errors' + ([...quiet(errors), ...quiet(R.errors)].slice(0, 3).join(' | '))); await R.browser.close();
  }
  // ---------- F. no connection, and a database that is not set up yet
  if (ONLY.includes('F')) {
    const O = await open(F, { w: 390, h: 844 }), XO = (f, a) => O.page.evaluate(f, a);// every cloud request is refused
    await XO(([p]) => window.__coasterDebug.v80.v10.acct.signIn('x@example.test', p), [PW]); await idle(O.page); let s = await st(O.page);
    ok(!s.in && /cannot be reached/.test(s.err) && /keep playing without an account/.test(s.err), 'offline: “' + s.err.slice(0, 80) + '…”');
    await XO(() => window.__coasterDebug.v80.v10.ty.open('career')); await O.page.waitForTimeout(700); ok((await park(O.page)) != null, 'offline, the game still plays'); await O.browser.close();
    const { cloud, db } = makeCloud({ noDb: true }), N = await open(F, { w: 390, h: 844, cloud }), XN = (f, a) => N.page.evaluate(f, a);
    await XN(() => window.__coasterDebug.v80.v10.ty.fresh('career', 30000)); await N.page.waitForTimeout(300); await XN(() => window.__coasterDebug.v80.v10.ty.build('carousel', 21, 41, 0)); await XN(() => window.__coasterDebug.v80.v10.ty.save());
    await XN(([p]) => window.__coasterDebug.v80.v10.acct.signUp('pat@example.test', p, 'Pat'), [PW]); await idle(N.page); s = await st(N.page);
    ok(s.in && s.name === 'Pat' && /not switched on for this game yet/.test(s.syncErr) && db.saves.length === 0, 'before the database is set up: accounts work, and the page says cloud saves are not switched on yet (parks stay on the device)');
    ok((await park(N.page)).objs === 1 && await XN(() => !!localStorage.getItem('coasterlab.v10.park.career')), 'the park on the device is untouched');
    await XN(() => window.__coasterDebug.v80.v10.acct.open()); await N.page.waitForTimeout(300); await N.page.screenshot({ path: SH + 'v10_account_no_cloud_saves_yet.png' });
    ok(quiet(N.errors).length === 0, 'no errors' + (quiet(N.errors).length ? ': ' + quiet(N.errors).slice(0, 3).join(' | ') : '')); await N.browser.close();
  }
  // ---------- G. four screen sizes
  if (ONLY.includes('G')) for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1200, 800]]) {
    const { cloud } = makeCloud(), { browser, page, errors } = await open(F, { w, h, mobile: w < 1000, cloud, skipStart: false }), X = (f, a) => page.evaluate(f, a);
    const chip = await X(() => { const c = document.querySelector('#start .acChip').getBoundingClientRect(), l = document.querySelector('#start .stLogo').getBoundingClientRect(); return { in: c.left >= 0 && c.right <= innerWidth && c.top >= 0, clear: c.left >= l.right - 2 || c.bottom <= l.top + 2 || c.top >= l.bottom - 2, h: c.height } });
    ok(chip.in && chip.clear && chip.h >= 40, `${w}×${h}: the Sign in button is on screen and clear of the logo`);
    await page.click('#start .acChip'); await page.waitForTimeout(300); await page.click('#acB [data-ac="mode:up"]'); await page.waitForTimeout(250);
    const lay = await X(() => { const b = document.querySelector('.acBox').getBoundingClientRect(), el = document.querySelector('#acct10'), bad = [...document.querySelectorAll('#acct10 button, #acct10 input')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1 || r.height < 36) }).map(e => e.id || e.dataset.ac || e.className); return { fitW: b.left >= 0 && b.right <= innerWidth + 1, scrollX: el.scrollWidth > el.clientWidth + 1, canReach: b.height <= innerHeight || el.scrollHeight > el.clientHeight, bad } });
    ok(lay.fitW && !lay.scrollX && lay.canReach && lay.bad.length === 0, `${w}×${h}: the create-account page fits the width, scrolls if it is taller than the screen, and every control is at least 36 px` + (lay.bad.length ? ' — ' + lay.bad.join(', ') : ''));
    await X(() => document.querySelector('.acGo').scrollIntoView()); await page.waitForTimeout(150); ok(await X(() => { const r = document.querySelector('.acGo').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1 }), `${w}×${h}: the Create my account button can be reached`);
    await page.screenshot({ path: SH + `v10_account_${w}x${h}.png` });
    await page.keyboard.press('Escape'); await page.waitForTimeout(150); ok(await X(() => document.querySelector('#acct10').hidden), `${w}×${h}: Esc closes the page`);
    ok(quiet(errors).length === 0, `${w}×${h}: no errors` + (quiet(errors).length ? ': ' + quiet(errors).slice(0, 3).join(' | ') : '')); await browser.close();
  }
  console.log(fails ? fails + ' check(s) failed' : 'all checks passed');
})();
