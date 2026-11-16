// Coaster Lab 10.1 — security hardening. Each check attacks the game the way the audit describes and proves the 10.1
// build holds. Where it says "(10.0, for comparison)" the same attack is run against coaster_lab_v10_0.html to show
// that the problem was real there: those lines PASS when 10.0 is still affected, which is what the audit claims.
//   node t20_security.js          every section          T20=AB node t20_security.js    some sections only
// The cloud is the stand-in (tools/cloud_mock.js): hostile rows are put straight into it, the way a hand-made request
// to the real database functions could before the 10.1 migration.
const { open, tab } = require('./harness'), makeCloud = require('./tools/cloud_mock');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_1.html', OLD = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
const ONLY = process.env.T20 || 'ABCDEFGHI';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const until = async (pg, f, a, ms = 12000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await pg.evaluate(f, a)) return true; await pg.waitForTimeout(150) } return false };
const idle = pg => until(pg, () => { const s = window.__coasterDebug.v80.v10.acct.state(); return !s.busy && !s.syncing });
const PW = 'correct-horse-9', PARK = { v: 1, name: 'Nice park', mode: 'career', objs: [{ id: 1, k: 'carousel', x: 20, z: 40, r: 0 }], paths: {} };
const quiet = e => e.filter(x => !/WebSocket|ERR_FAILED|net::|Failed to load resource|Content Security Policy|Refused to/.test(x));
const code = o => 'CL10J' + Buffer.from(JSON.stringify(o)).toString('base64url');
(async () => {
  // ---------- A. what another player's browser can put on the leaderboard
  if (ONLY.includes('A')) {
    const run = async file => {
      const { cloud, db } = makeCloud();
      db.parks.push({ code: 'XSS234', owner: 'o'.repeat(48), uid: null, key: 'park0001', name: 'Nice park', author: 'Zoe', data: PARK, visits: 3, updated: new Date().toISOString(),
        stats: { rating: '<img src="nope.png" onerror="window.__xss=1" id="xss1">', coasters: '<b id="xss2">9</b>', day: 3 } });
      db.parks.push({ code: '"><img id="xss3" src=x onerror=window.__xss=3>', owner: 'p'.repeat(48), uid: null, key: 'park0002', name: 'Second', author: 'Sam', data: PARK, stats: { rating: 55 }, visits: '<i id="xss4">7</i>', updated: 'x' });
      const { browser, page, errors } = await open(file, { w: 390, h: 844, cloud }), X = (f, a) => page.evaluate(f, a);
      await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await page.waitForTimeout(700); await X(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await page.waitForTimeout(500);
      await X(() => window.__coasterDebug.v80.v10.ty.act('hq', 'share')); await page.waitForTimeout(1200);
      const r = await X(() => ({ ran: window.__xss || 0, els: ['xss1', 'xss2', 'xss3', 'xss4'].filter(i => document.getElementById(i)), rows: document.querySelectorAll('#pkB .tyLb tr').length, text: (document.querySelector('#pkB .tyLb') || { textContent: '' }).textContent.replace(/\s+/g, ' ').slice(0, 260) }));
      await page.screenshot({ path: SH + 'v101_sec_leaderboard_' + (file === OLD ? 'old' : 'new') + '.png' }); await browser.close(); return { ...r, errors };
    };
    const o = await run(OLD), n = await run(F);
    ok(o.els.includes('xss1') && o.ran === 1, '(10.0, for comparison) a park published with HTML as its “rating” puts that HTML into every player’s leaderboard and its script runs (elements: ' + o.els.join(', ') + '; ran: ' + o.ran + ')');
    ok(n.els.length === 0 && n.ran === 0, '10.1: the same hostile park adds no element to the page and runs nothing');
    ok(n.rows === 1 && /Nice park/.test(n.text) && /rating —/.test(n.text) && !/coasters/.test(n.text) && !/[<>]/.test(n.text), '10.1: the park is still listed, with its text “rating” shown as —, and the row with a made-up code is dropped: “' + n.text.slice(0, 90) + '…”');
    ok(quiet(n.errors).length === 0, 'no errors' + (quiet(n.errors).length ? ': ' + quiet(n.errors).slice(0, 2).join(' | ') : ''));
    // visiting that park by its code
    const { cloud, db } = makeCloud(); db.parks.push({ code: 'XSS234', owner: 'o'.repeat(48), uid: null, key: 'park0001', name: 'Fun <img id=xssN src=x onerror=window.__xss=5> park', author: '<svg onload=window.__xss=6>', data: { ...PARK, name: '<i id=xssD>x</i>' }, stats: {}, visits: 'many', updated: 1 });
    const V = await open(F, { w: 390, h: 844, cloud }), XV = (f, a) => V.page.evaluate(f, a);
    const w = await XV(() => window.__coasterDebug.v80.v10.ty.visitCode('XSS234')); await V.page.waitForTimeout(900); const vis = await XV(() => ({ v: window.__coasterDebug.v80.v10.ty.visiting(), ran: window.__xss || 0, el: !!document.querySelector('#xssN,#xssD'), name: document.querySelector('#tyName').textContent }));
    ok(w === '' && vis.v && vis.ran === 0 && !vis.el && !/[<>]/.test(vis.name + vis.v.by) && vis.v.visits === 0, '10.1: visiting a park whose name and author carry markup shows plain text (“' + vis.name + '”) and a non-number visit count becomes 0');
    await V.browser.close();
  }
  // ---------- B. the second line of defence: an injected event handler does nothing
  if (ONLY.includes('B')) {
    const run = async file => { const { browser, page } = await open(file, { w: 390, h: 844 }); const r = await page.evaluate(async () => { document.body.insertAdjacentHTML('beforeend', '<img src="not-there.png" onerror="window.__xss2=1" style="position:fixed;left:-99px">'); await new Promise(r => setTimeout(r, 900)); return { ran: window.__xss2 || 0, csp: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]') } }); await browser.close(); return r };
    const o = await run(OLD), n = await run(F);
    ok(o.ran === 1 && !o.csp, '(10.0, for comparison) HTML that reaches the page with an onerror handler runs its script (no content security policy)');
    ok(n.csp && n.ran === 0, '10.1: the page has a Content-Security-Policy and the same injected handler does not run');
  }
  // ---------- C. park data from outside: names of built-in properties used as keys
  if (ONLY.includes('C')) {
    const evil = { v: 1, name: 'Evil <b>park</b>', mode: 'career', paths: {}, wx: { k: 'constructor' }, hist: [{ day: 1, inc: 5, exp: 3, guests: 2, wx: 'constructor' }], seen: { cloud: 'ABCDEF' },
      objs: [{ id: 1, k: 'constructor', x: 20, z: 40, r: 0 }, { id: 2, k: 'toString', x: 23, z: 40, r: 0 }, { id: 3, k: 'hasOwnProperty', x: 26, z: 40, r: 0 }, { id: 4, k: 'carousel', x: 20, z: 36, r: 0, col: { train: 'constructor' } }, { id: 5, k: 'u:constructor', x: 30, z: 30, r: 0 }] };
    const run = async file => {
      const { browser, page, errors } = await open(file, { w: 390, h: 844 }), X = (f, a) => page.evaluate(f, a);
      let w = null, st = null, tabs = ''; try { w = await X(c => window.__coasterDebug.v80.v10.ty.visitCode(c), code(evil)); await page.waitForTimeout(900); st = await X(() => { const T = window.__coasterDebug.v80.v10.ty; return { vis: T.visiting(), objs: T.objs().map(o => o.k), wx: T.state() && T.state().wx } });
        for (const t of ['home', 'rides', 'guests']) { await X(t => window.__coasterDebug.v80.v10.ty.act('hq', t), t); await page.waitForTimeout(350); tabs += await X(() => document.querySelector('#pkB').textContent.length > 20 ? '✓' : '✗') } await X(() => window.__coasterDebug.v80.v10.ty.ff(8)) } catch (e) { errors.push('SCRIPT ' + e.message.slice(0, 160)) }
      await browser.close(); return { w, st, tabs, errors: quiet(errors) };
    };
    const o = await run(OLD), n = await run(F);
    ok(o.errors.length > 0 || !o.st || o.st.objs.some(k => k !== 'carousel') || o.st.wx !== 'sunny', '(10.0, for comparison) a park code using “constructor”, “toString”… as thing and weather names gets them past the checks (things kept: ' + (o.st ? o.st.objs.join(', ') : 'none') + '; weather: ' + (o.st && o.st.wx) + '; errors: ' + o.errors.length + (o.errors[0] ? ' — ' + o.errors[0].slice(0, 110) : '') + ')');
    ok(n.w === '' && n.st && n.st.vis && n.st.objs.join() === 'carousel' && n.st.wx === 'sunny' && n.tabs === '✓✓✓' && n.errors.length === 0, '10.1: the same park opens with only its real carousel, sunny weather, working Office tabs and no errors (' + (n.st ? n.st.objs.join(', ') : '') + (n.errors[0] ? ' — ' + n.errors[0].slice(0, 160) : '') + ')');
    ok(n.st && n.st.vis && !/[<>]/.test(n.st.vis.name), 'its name is shown without markup: “' + (n.st && n.st.vis && n.st.vis.name) + '”');
  }
  // ---------- D. the published code survives a reload, and never travels with a shared copy
  if (ONLY.includes('D')) {
    const run = async file => {
      const { cloud } = makeCloud(), { browser, page } = await open(file, { w: 390, h: 844, cloud }), X = (f, a) => page.evaluate(f, a);
      await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await page.waitForTimeout(600); await X(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await page.waitForTimeout(400); await X(() => window.__coasterDebug.v80.v10.ty.publish());
      await until(page, () => !!window.__coasterDebug.v80.v10.ty.state().cloud, null, 8000); const c0 = await X(() => window.__coasterDebug.v80.v10.ty.state().cloud); await X(() => window.__coasterDebug.v80.v10.ty.save());
      const packed = await X(async () => { const c = await window.__coasterDebug.v80.v10.ty.pack(); return c });
      await page.reload(); await page.waitForFunction(() => window.__booted === true, null, { timeout: 60000 }); await page.waitForTimeout(1200); await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await page.waitForTimeout(600);
      const c1 = await X(() => window.__coasterDebug.v80.v10.ty.state().cloud); await browser.close(); return { c0, c1, packed };
    };
    const o = await run(OLD), n = await run(F);
    ok(!!o.c0 && !o.c1, '(10.0, for comparison) after a reload the game has forgotten that the park was published (' + o.c0 + ' → ' + o.c1 + ')');
    ok(!!n.c0 && n.c1 === n.c0, '10.1: the published code is still known after a reload (' + n.c0 + ')');
    const R = await open(F, { w: 390, h: 844 }); const inner = await R.page.evaluate(async c => { const u = c.slice(5).replace(/-/g, '+').replace(/_/g, '/'), b = Uint8Array.from(atob(u + '='.repeat((4 - u.length % 4) % 4)), x => x.charCodeAt(0)); const t = c.startsWith('CL10Z') ? await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text() : new TextDecoder().decode(b); return JSON.parse(t).seen }, n.packed); await R.browser.close();
    ok(inner && inner.cloud === undefined, '10.1: a park code made for sharing does not carry the publisher’s cloud code');
  }
  // ---------- E. a "compressed" park code that unpacks into something enormous
  if (ONLY.includes('E')) {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 });
    const r = await page.evaluate(async () => {
      const big = JSON.stringify({ v: 1, name: 'Bomb', mode: 'career', objs: [], paths: {}, pad: ' '.repeat(12e6) }), raw = new Uint8Array(await new Response(new Blob([big]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
      let s = ''; for (let i = 0; i < raw.length; i += 8192) s += String.fromCharCode.apply(null, raw.subarray(i, i + 8192)); const c = 'CL10Z' + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const t0 = performance.now(), w = await window.__coasterDebug.v80.v10.ty.visitCode(c); return { len: c.length, w, ms: Math.round(performance.now() - t0), vis: !!window.__coasterDebug.v80.v10.ty.visiting() } });
    ok(r.len < 40000 && /could not be read/.test(r.w) && !r.vis, 'a ' + Math.round(r.len / 1000) + ' kB park code that unpacks to 12 MB is refused (“' + String(r.w).slice(0, 44) + '…”, ' + r.ms + ' ms) instead of being unpacked in full');
    ok(quiet(errors).length === 0, 'no errors'); await browser.close();
  }
  // ---------- F. the live channel: other browsers can send anything
  if (ONLY.includes('F')) {
    const { cloud } = makeCloud();
    const sock = `window.__ws=[];window.WebSocket=class{constructor(u){this.url=u;this.readyState=0;this.sent=[];window.__ws.push(this);setTimeout(()=>{this.readyState=1;this.onopen&&this.onopen()},30)}
      send(t){const m=JSON.parse(t);this.sent.push(m);if(m.event==='phx_join'){this.topic=m.topic;setTimeout(()=>this.emit({topic:m.topic,event:'phx_reply',ref:m.ref,payload:{status:'ok',response:{}}}),20)}}
      emit(m){this.onmessage&&this.onmessage({data:typeof m==='string'?m:JSON.stringify(m)})}close(){this.readyState=3;this.onclose&&this.onclose()}};`;
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false, cloud, init: sock }), X = (f, a) => page.evaluate(f, a);
    await X(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox')); await page.waitForTimeout(500); await X(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await page.waitForTimeout(400); await X(() => window.__coasterDebug.v80.v10.ty.publish());
    await until(page, () => window.__coasterDebug.v80.v10.ty.live().joined, null, 8000); const live = () => X(() => window.__coasterDebug.v80.v10.ty.live());
    await X(() => { const w = window.__ws[window.__ws.length - 1], st = {}; for (let i = 0; i < 300; i++) st['peer' + i] = { metas: [{ name: i === 0 ? '<img src=x onerror=window.__xss=9>' : 'P' + i, col: i === 1 ? 'red;background:url(x)' : '#22e0ff', x: i === 2 ? 1e300 : 10, z: i === 3 ? 'far' : 60, owner: i === 4 ? 'yes' : false }] }; w.emit({ topic: w.topic, event: 'presence_state', payload: st }) }); await page.waitForTimeout(600);
    let l = await live(); ok(l.others.length === 40 && l.marks <= 40, 'a flood of 300 “visitors” is cut to 40 (' + l.others.length + ' kept, ' + l.marks + ' pins drawn)');
    ok(!/[<>]/.test(l.others[0].name) && l.others.every(o => Math.abs(o.x) <= 120 && Math.abs(o.z) <= 120) && l.others.every(o => o.owner === false), 'names lose their markup (“' + l.others[0].name + '”), positions stay inside the park, and “owner” must be exactly true');
    const said = await X(async () => { const w = window.__ws[window.__ws.length - 1], send = (ev, pl) => w.emit({ topic: w.topic, event: 'broadcast', payload: { type: 'broadcast', event: ev, payload: pl } }), D = window.__coasterDebug.v80.v10;
      send('pos', { id: 'peer5', x: 9e15, z: -9e15 }); send('emo', { id: 'peer5', e: '<b>' }); send('emo', { id: 'peer5', e: '💣' }); send('emo', { id: 'peer6', e: '👋' }); for (let i = 0; i < 30; i++) send('emo', { id: 'peer6', e: '🎉' }); send('emo', { id: 'nobody', e: '👋' }); w.emit('not json at all'); w.emit({ topic: w.topic, event: 'broadcast', payload: 7 }); w.emit({ topic: w.topic, event: 'presence_diff', payload: { joins: 5, leaves: 'x' } });
      await new Promise(r => setTimeout(r, 400)); return { diag: D.diag.snap().cloud.liveDropped } });
    l = await live(); const p5 = l.others.find(o => o.k === 'peer5');
    ok(p5 && Math.abs(p5.x) <= 120 && Math.abs(p5.z) <= 120 && said.diag >= 289, 'a position of 9e15 is clamped, unknown reactions and malformed messages are ignored, and 30 reactions in a row count once (' + said.diag + ' things ignored in all)');
    // the line drops: it comes back by itself
    const n0 = await X(() => window.__ws.length); await X(() => window.__ws[window.__ws.length - 1].close()); await page.waitForTimeout(600); const mid = await live();
    await until(page, () => window.__coasterDebug.v80.v10.ty.live().joined, null, 9000); const n1 = await X(() => window.__ws.length); l = await live();
    ok(!mid.joined && /Reconnecting/.test(mid.err) && l.joined && n1 === n0 + 1, 'when the connection drops the game says “Reconnecting…” and joins again by itself after a moment');
    ok(await X(() => !window.__xss) && quiet(errors).length === 0, 'nothing injected ran, no errors' + (quiet(errors).length ? ': ' + quiet(errors).slice(0, 2).join(' | ') : '')); await browser.close();
  }
  // ---------- G. the owner lock and the test flag
  if (ONLY.includes('G')) {
    // the page starts as it does for a player (no test hooks); the flag is then set the way someone could from the console,
    // and the owner panel is asked for through the game's own buttons: My Park → 🏢 Office → Park → ♛ Owner controls
    const run = async file => { const { browser, page } = await open(file, { w: 390, h: 844, skipStart: false, init: 'window.__coasterTestHarness = false;' });
      const hooks = await page.evaluate(() => { const h = !!window.__coasterDebug; window.__coasterTestHarness = true; return h });
      await page.click('[data-go="ty10"]'); await page.waitForTimeout(1200); await page.click('#tyMenuB'); await page.waitForTimeout(600); await page.click('#pkTabs [data-pktab="park"]'); await page.waitForTimeout(400); await page.click('#pkB [data-x="owner"]'); await page.waitForTimeout(600);
      const r = await page.evaluate(() => ({ own: !document.querySelector('#own7').hidden, pw: !document.querySelector('#pw7').hidden })); await browser.close(); return { hooks, ...r } };
    const o = await run(OLD), n = await run(F);
    ok(!o.hooks && o.own && !o.pw, '(10.0, for comparison) with the test flag typed into the console, “♛ Owner controls” opens the Owner Control Center without the passcode');
    ok(!n.hooks && !n.own && n.pw, '10.1: the same steps only bring up the passcode prompt (the flag is read once, when the page starts)');
  }
  // ---------- H. a pasted design that names a built-in property as a section type
  if (ONLY.includes('H')) {
    const run = async file => { const { browser, page, errors } = await open(file, { w: 1200, h: 800, mobile: false, storage: { 'coasterlab.v80.bWelcome': '1' } }), X = (f, a) => page.evaluate(f, a);
      await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1200); await X(() => document.querySelector('#b8Top [data-b8="files"]').click()); await page.waitForTimeout(500);
      const r = await X(async () => { const io = document.querySelector('#b8IO'); if (!io) return { io: false }; io.value = JSON.stringify({ v: 2, name: 'x', els: [{ t: 'constructor', p: {} }] }); const b = document.querySelector('[data-b8pj="imp"]'); if (b) b.click(); await new Promise(r => setTimeout(r, 500)); return { io: true, btn: !!b, toast: document.querySelector('#toast').textContent } });
      await browser.close(); return { ...r, errors: errors.filter(e => /TypeError|not iterable|PAGEERROR/.test(e)) } };
    const o = await run(OLD), n = await run(F);
    ok(o.io && o.errors.length > 0, '(10.0, for comparison) importing a design with the section type “constructor” stops with an error and tells the player nothing (' + (o.errors[0] || '').slice(0, 90) + ')');
    ok(n.io && n.errors.length === 0 && /unknown type/.test(n.toast), '10.1: the same text is refused with a message: “' + n.toast + '”');
  }
  // ---------- I. accounts: two tabs, and links from emails
  if (ONLY.includes('I')) {
    const two = async file => {
      const { cloud, db } = makeCloud(), A = await open(file, { w: 390, h: 844, cloud }), XA = (f, a) => A.page.evaluate(f, a);
      await XA(([p]) => window.__coasterDebug.v80.v10.acct.signUp('sam@example.test', p, 'Sam'), [PW]); await idle(A.page);
      const B = await tab(A.ctx, file), XB = (f, a) => B.page.evaluate(f, a); const in0 = (await XB(() => window.__coasterDebug.v80.v10.acct.state())).in;
      // tab B is a tab that was asleep and heard nothing (a phone does this to tabs in the background)
      await XB(() => { window.__deaf = true; addEventListener('storage', e => { if (window.__deaf) e.stopImmediatePropagation() }, true) });
      // tab A renews the session; tab B still holds the old one in memory and needs a token later
      await XA(() => window.__coasterDebug.v80.v10.acct.expire()); const ta = await XA(() => window.__coasterDebug.v80.v10.acct.token()); await A.page.waitForTimeout(300);
      await XB(() => window.__coasterDebug.v80.v10.acct.expire()); const n0 = db.calls.filter(c => c === 'auth/token').length, tb = await XB(() => window.__coasterDebug.v80.v10.acct.token()); await B.page.waitForTimeout(300);
      const sb = await XB(() => window.__coasterDebug.v80.v10.acct.state()), n1 = db.calls.filter(c => c === 'auth/token').length;
      // from here tab B hears the other tab again: B renews, A follows, and both can still talk to the cloud
      await XB(() => { window.__deaf = false }); let both = false, sa = { in: false };
      if (sb.in) { await XB(() => window.__coasterDebug.v80.v10.acct.expire()); await XB(() => window.__coasterDebug.v80.v10.acct.token(true)); await A.page.waitForTimeout(400); await XA(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(A.page); await XB(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(B.page);
        sa = await XA(() => window.__coasterDebug.v80.v10.acct.state()); const sb3 = await XB(() => window.__coasterDebug.v80.v10.acct.state()); both = sa.in && sb3.in && !sa.syncErr && !sb3.syncErr }
      // signing out in one tab. The other tab hears of it through the browser's storage event, which only arrives when that
      // tab's main thread is next free (most of a second under software rendering): wait for it, not for a fixed time.
      // Then look once more a little later: nothing may have signed either tab back in
      await XA(() => window.__coasterDebug.v80.v10.acct.signOut()); await idle(A.page); await until(B.page, () => !window.__coasterDebug.v80.v10.acct.state().in, null, 8000); await B.page.waitForTimeout(600);
      const sb2 = await XB(() => window.__coasterDebug.v80.v10.acct.state()), sa2 = await XA(() => ({ in: window.__coasterDebug.v80.v10.acct.state().in, kept: Object.keys(localStorage).some(k => /\.auth$/.test(k)) }));
      await A.browser.close(); return { in0, ta, tb, b: sb.in, renewals: n1 - n0, both, bAfterOut: sb2.in, aAfterOut: sa2.in || sa2.kept, bMsg: sb2.msg, msg: sb.msg };
    };
    const o = await two(OLD), n = await two(F);
    ok(o.in0 && o.ta && !o.b, '(10.0, for comparison) with the game open in two tabs, the second tab to renew the session is signed out (“' + o.msg + '”)');
    ok(n.in0 && n.ta && n.tb && n.b && n.renewals === 0, '10.1: a tab that missed the news takes the renewed session from storage instead of spending the used one (no second renewal, nobody is signed out)');
    ok(n.both, '10.1: when either tab renews, the other follows, and both keep syncing with the account');
    ok(!n.bAfterOut && !n.aAfterOut, '10.1: signing out in one tab signs the other tab out too (“' + n.bMsg + '”), and no session is left on the device');
    // two things that can happen while a renewal is on its way. The account server's answer is held back here so that the
    // moment lasts long enough to do something in the other tab
    const gated = async () => {
      const { cloud } = makeCloud(), A = await open(F, { w: 390, h: 844, cloud }), XA = (f, a) => A.page.evaluate(f, a);
      await XA(([p]) => window.__coasterDebug.v80.v10.acct.signUp('sam@example.test', p, 'Sam'), [PW]); await idle(A.page);
      const B = await tab(A.ctx, F), held = [];
      await A.ctx.route(u => /\/auth\/v1\/token/.test(u.href) && /refresh_token/.test(u.href), async route => { if (route.request().method() === 'OPTIONS') return route.fallback(); let go; const p = new Promise(r => go = r); held.push({ pg: route.request().frame().page(), go }); await p; return route.fallback() });
      const renew = pg => pg.evaluate(() => { const a = window.__coasterDebug.v80.v10.acct; a.expire(); window.__tk = undefined; a.token(true).then(t => window.__tk = t ? 'yes' : 'none'); return 0 });
      const inFlight = async k => { const t = Date.now(); while (held.length < k && Date.now() - t < 15000) await A.page.waitForTimeout(100); return held.length >= k };
      const st = pg => pg.evaluate(() => { const q = window.__coasterDebug.v80.v10.acct.state(); return { in: q.in, syncErr: q.syncErr, tk: window.__tk, kept: Object.keys(localStorage).some(k => /\.auth$/.test(k)) } });
      const answered = pg => until(pg, () => !!window.__tk, null, 10000);
      return { A, B, XA, held, renew, inFlight, st, answered } };
    { // 1. tab B is renewing, tab A signs out, and only then does tab B's answer (a brand-new session) arrive
      const g = await gated(); await g.renew(g.B.page); const fl = await g.inFlight(1);
      await g.XA(() => window.__coasterDebug.v80.v10.acct.signOut()); await idle(g.A.page); const heard = await until(g.B.page, () => !window.__coasterDebug.v80.v10.acct.state().in, null, 10000);
      if (g.held[0]) g.held[0].go(); await g.answered(g.B.page); await g.B.page.waitForTimeout(2000); const a = await g.st(g.A.page), b = await g.st(g.B.page); await g.A.browser.close();
      ok(fl && heard && !a.in && !b.in && !a.kept, '10.1: a sign-out is final: a renewal that was on its way in the other tab signs nobody back in when its answer arrives'); }
    { // 2. both tabs renew with the same single-use token. Tab A is answered first and tab B hears of it; then tab B is refused
      const g = await gated(); await g.renew(g.A.page); await g.renew(g.B.page); const fl = await g.inFlight(2), hA = g.held.find(h => h.pg === g.A.page), hB = g.held.find(h => h.pg === g.B.page);
      if (hA) hA.go(); await g.answered(g.A.page); const heard = await until(g.B.page, () => window.__coasterDebug.v80.v10.acct.state().exp > Date.now() + 60000, null, 10000);
      if (hB) hB.go(); await g.answered(g.B.page); await g.B.page.waitForTimeout(2000);
      for (const pg of [g.A.page, g.B.page]) { await pg.evaluate(() => window.__coasterDebug.v80.v10.acct.sync()); await idle(pg) }
      const a = await g.st(g.A.page), b = await g.st(g.B.page); await g.A.browser.close();
      ok(fl && !!hA && !!hB && heard && a.in && b.in && b.tk === 'yes' && !a.syncErr && !b.syncErr, '10.1: two tabs renewing at the same moment: the one that is refused uses the other’s new session, nobody is signed out and both keep syncing'); }
    // a link from an email signs in to the LINK's account: nothing is synced until the player has confirmed it
    const { cloud, db } = makeCloud(); cloud('auth/signup', { email: 'mallory@example.test', password: PW, data: { username: 'Mallory' } }, { query: {} });
    const sess = cloud('auth/token', { email: 'mallory@example.test', password: PW }, { query: { grant_type: 'password' } }).json;
    const park = JSON.stringify({ v: 1, id: 'Pvictim01', name: 'Victim Park', mode: 'career', day: 9, money: 31000, objs: [{ id: 1, k: 'carousel', x: 20, z: 40, r: 0 }], paths: {}, tot: { exp: 900 } });
    const L = await open(F, { w: 390, h: 844, cloud, storage: { 'coasterlab.v10.park.career': park }, hash: '#access_token=' + sess.access_token + '&expires_in=3600&refresh_token=' + sess.refresh_token + '&token_type=bearer&type=magiclink' }), XL = (f, a) => L.page.evaluate(f, a);
    await until(L.page, () => window.__coasterDebug.v80.v10.acct.state().in, null, 8000); await L.page.waitForTimeout(700); let s = await XL(() => window.__coasterDebug.v80.v10.acct.state());
    const page1 = await XL(() => document.querySelector('#acB').textContent); await XL(() => window.__coasterDebug.v80.v10.acct.sync()); await L.page.waitForTimeout(600);
    ok(s.in && s.open && /Is this your account/.test(page1) && /mallory@example\.test/.test(page1) && db.saves.length === 0 && !db.calls.includes('cl_save_put') && !db.calls.includes('cl_me'), 'a sign-in link opens “Is this your account?” with the account’s email, and nothing from this device is sent before the answer');
    await L.page.screenshot({ path: SH + 'v101_sec_link_390x844.png' });
    await L.page.click('#acB [data-ac="linkno"]'); await idle(L.page); await L.page.waitForTimeout(400); s = await XL(() => window.__coasterDebug.v80.v10.acct.state());
    ok(!s.in && db.saves.length === 0 && !db.calls.includes('cl_save_put') && await XL(() => !/access_token/.test(location.href)), '“Not me” signs out without sending the park anywhere, and the link’s secret part is gone from the address bar');
    await L.browser.close();
    const s2 = cloud('auth/token', { email: 'mallory@example.test', password: PW }, { query: { grant_type: 'password' } }).json;
    const Y = await open(F, { w: 390, h: 844, cloud, storage: { 'coasterlab.v10.park.career': park }, hash: '#access_token=' + s2.access_token + '&expires_in=3600&refresh_token=' + s2.refresh_token + '&token_type=bearer&type=magiclink' });
    await until(Y.page, () => window.__coasterDebug.v80.v10.acct.state().in, null, 8000); await Y.page.waitForTimeout(500); await Y.page.click('#acB [data-ac="linkyes"]'); await idle(Y.page); await until(Y.page, () => window.__coasterDebug.v80.v10.acct.state().synced, null, 8000);
    ok(db.saves.length === 1 && db.saves[0].data.name === 'Victim Park', '“Yes, keep me signed in” carries on as before: the park is saved to the account'); await Y.browser.close();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e.stack || e.message).slice(0, 600)); process.exit(1) });
