// Coaster Lab 10.10.1 - hostile answers from the park cloud (release security check, 2026-11-27).
// The database accepts any JSON up to 400 kB inside a published park, nested up to about 10,000 levels deep
// (measured on PostgreSQL 16: 10,000 levels are stored, 50,000 hit its stack limit). Every player who opens that
// park receives it. These checks send such answers to the real 10.10.1 page and prove it neither crashes nor
// freezes, and keeps treating what it got as plain text.
//   CL_F=../builds/coaster_lab_v10_10_1.html node t27_hostile_cloud.js
// Answers are written as raw text (Node itself cannot JSON.stringify 10,000 levels), through a page route that takes
// precedence over the harness's own cloud stand-in.
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'builds/coaster_lab_v10_10_1.html';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const info = m => console.log('INFO ' + m);
const quiet = e => e.filter(x => !/WebSocket|ERR_FAILED|net::|Failed to load resource|Content Security Policy|Refused to/.test(x));
const deep = n => '['.repeat(n) + ']'.repeat(n);
const PARK = '{"v":1,"name":"Deep park","mode":"career","objs":[{"id":1,"k":"carousel","x":20,"z":40,"r":0}],"paths":{}}';
const parkWith = (extra) => PARK.replace(/}$/, ',' + extra + '}');
const row = (code, name, author) => ({ code, name, author, stats: { rating: 50 }, visits: 1, updated: new Date().toISOString(), stars: 0, votes: 0, member: false });

// answer: (fn, body) => raw JSON text, or null for "no such function"
async function page(answer) {
  const o = await open(F, { w: 390, h: 844 });
  await o.page.route('**/rest/v1/rpc/**', async route => {
    const rq = route.request(), cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors, body: '' });
    const fn = rq.url().split('/rpc/')[1].split('?')[0]; let body = null; try { body = JSON.parse(rq.postData() || 'null') } catch (e) {}
    const txt = answer(fn, body);
    return txt == null ? route.fulfill({ status: 404, headers: cors, contentType: 'application/json', body: '{"code":"PGRST202","message":"not found"}' })
      : route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: txt });
  });
  return o;
}
// the game is alive: the park simulation advances and the page still answers
const alive = async pg => { try { return await Promise.race([pg.evaluate(async () => { const T = window.__coasterDebug.v80.v10.ty; T.ff(2); await new Promise(r => requestAnimationFrame(() => r())); return window.__booted === true }), new Promise(r => setTimeout(() => r(false), 15000))]) } catch (e) { return false } };

(async () => {
  // ---------- 1. a published park with JSON nested 10,000 levels deep, in three places
  for (const [where, data] of [
    ['nothing (an ordinary park, for comparison)', PARK],
    ['an unknown top-level field', parkWith('"zz":' + deep(10000))],
    ['a field of one of its things', PARK.replace('"r":0}', '"r":0,"col":' + deep(10000) + '}')],
    ['its paths', PARK.replace('"paths":{}', '"paths":{"a":' + deep(10000) + '}')],
  ]) {
    const { browser, page: pg, errors } = await page(fn => fn === 'cl_get_park' ? '{"code":"DEEP23","name":"Deep park","author":"Zoe","data":' + data + ',"stats":{},"visits":1,"stars":0,"votes":0,"updated":"2026-11-27","member":false}' : fn === 'cl_list_parks' || fn === 'cl_my_parks' ? '[]' : null);
    const X = (f, a) => pg.evaluate(f, a);
    await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await pg.waitForTimeout(600);
    const t0 = Date.now(); let w = 'not run';
    try { w = await Promise.race([X(() => window.__coasterDebug.v80.v10.ty.visitCode('DEEP23')), new Promise(r => setTimeout(() => r('TIMEOUT'), 20000))]) } catch (e) { w = 'THREW ' + e.message.slice(0, 120) }
    await pg.waitForTimeout(700);
    const ms = Date.now() - t0, live = await alive(pg), v = live ? await X(() => { const T = window.__coasterDebug.v80.v10.ty; return { vis: !!T.visiting(), objs: T.objs().map(o => o.k).join() } }) : null;
    ok(live && w !== 'TIMEOUT' && !/^THREW/.test(String(w)) && quiet(errors).length === 0, '1 a park with ' + (data === PARK ? 'no' : '10,000 levels of') + ' nesting in ' + where + ' does not crash or freeze the visitor\'s game (answer: ' + JSON.stringify(w).slice(0, 80) + ', ' + ms + ' ms' + (quiet(errors).length ? ', errors: ' + quiet(errors).slice(0, 2).join(' | ').slice(0, 200) : '') + ')');
    if (v) info('  opened: ' + v.vis + ', things kept: ' + (v.objs || 'none'));
    await browser.close();
  }
  // ---------- 2. leaderboards with 10,000 rows and a two-megabyte name
  {
    const big = 'N'.repeat(2e6), rows = [row('BIG234', big, big)]; for (let i = 0; i < 9999; i++) rows.push(row('ABC' + String(i % 1000).padStart(3, '2').replace(/[01]/g, '2'), 'Park ' + i, 'P' + i));
    const txt = JSON.stringify(rows);
    const { browser, page: pg, errors } = await page(fn => fn === 'cl_list_parks' ? txt : fn === 'cl_my_parks' ? txt : null), X = (f, a) => pg.evaluate(f, a);
    await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await pg.waitForTimeout(600);
    const t0 = Date.now(); await X(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await X(() => window.__coasterDebug.v80.v10.ty.act('hq', 'share')); await pg.waitForTimeout(1200);
    const r = await X(() => { const rows = [...document.querySelectorAll('#pkB .tyLb tr')]; return { n: rows.length, longest: Math.max(0, ...rows.map(t => t.textContent.length)) } });
    ok(r.n > 0 && r.n <= 50 && r.longest < 400 && Date.now() - t0 < 15000 && quiet(errors).length === 0 && await alive(pg), '2 a 10,000-row leaderboard with a two-megabyte park name is cut to at most 50 short rows (' + r.n + ' rows, longest ' + r.longest + ' characters, ' + (Date.now() - t0) + ' ms)');
    await browser.close();
  }
  // ---------- 3. text that displays differently than it reads (now removed by the database, see 20_attacks N4)
  {
    const { browser, page: pg } = await page(fn => fn === 'cl_list_parks' ? JSON.stringify([row('RTL234', '\u202Enimda', '\u202Enimda')]) : fn === 'cl_my_parks' ? '[]' : null), X = (f, a) => pg.evaluate(f, a);
    await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await pg.waitForTimeout(600); await X(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await X(() => window.__coasterDebug.v80.v10.ty.act('hq', 'share')); await pg.waitForTimeout(1000);
    const kept = await X(() => (document.querySelector('#pkB .tyLb') || { textContent: '' }).textContent.includes('\u202E'));
    info('3 the 10.10.1 page itself ' + (kept ? 'keeps' : 'removes') + ' a right-to-left override in a cloud park name; with the 10.10.1 migration the database removes it before it is stored' + (kept ? ' (client-side clean-up is a suggestion for the game team)' : ''));
    await browser.close();
  }
  console.log(fails ? fails + ' FAILED' : 'all passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e.stack || e).toString().slice(0, 400)); process.exit(1) });
