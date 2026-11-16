// 10.1 after the park-build-2, trailer and daily-streak branches were merged in: the things those branches' own tests do not
// cover. (1) The merged park controls on phone-sized screens. (2) A park that uses the merged features opens in 10.0, and
// comes back. (3) The trailer's video host is the only outside host the page may load pictures and video from.
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_1.html', OLD = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const quiet = errs => errs.filter(e => !/Failed to load resource|net::ERR/.test(e));
const D = (pg, expr, a) => pg.evaluate(new Function('a', 'const T = window.__coasterDebug.v80.v10.ty; return ' + expr), a);
const all = pg => pg.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k) } return o });
(async () => {
  // ---------- 1. phone sizes: Undo (in the build bar, or with the side buttons when the screen is under 520 px wide), entertainers in the Staff tab, the Weekly Park Awards on the day card
  for (const [w, h] of [[320, 568], [390, 844], [844, 390]]) {
    const { browser, page, errors } = await open(F, { w, h, mobile: true });
    await D(page, 'T.fresh("career", 60000)'); await D(page, 'T.speed(0)');
    const b = await page.evaluate(L.place, ['candy', 26, 43, 3]); await page.waitForTimeout(300);
    const u = await page.evaluate(() => { const e = document.querySelector('#ty10 [data-ty="undo"]'); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height, off: e.disabled, W: innerWidth, H: innerHeight } });
    ok(b.ok && u && !u.off && u.x >= 0 && u.r <= u.W + .5 && u.t >= 0 && u.b <= u.H + .5 && u.w >= 30 && u.h >= 30, `${w}×${h}: Cotton Candy is built and ↶ Undo is on screen and big enough to tap (in the build bar, or with the side buttons on an upright phone: ${u ? Math.round(u.w) + '×' + Math.round(u.h) + ' px' : 'missing'})`);
    await D(page, 'T.act("hq", "staff")'); await page.waitForTimeout(500);
    const st = await page.evaluate(() => { const B = document.querySelector('#pkB'), t = B ? B.innerText : ''; return { has: /entertainer/i.test(t), bad: /undefined|NaN/.test(t), over: B ? B.scrollWidth - B.clientWidth : 99, doc: document.documentElement.scrollWidth - innerWidth } });
    ok(st.has && !st.bad && st.over <= 1 && st.doc <= 1, `${w}×${h}: the Staff tab lists entertainers and nothing is wider than the screen`);
    await page.screenshot({ path: SH + `v101_merged_staff_${w}x${h}.png` });
    await page.evaluate(() => { const x = document.querySelector('#pk [data-x="close"], #pk .pkX, #pkX'); if (x) x.click() }); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await D(page, 'T.set({ day: 7 })'); await D(page, 'T.endDay()'); await page.waitForTimeout(400);
    const aw = await page.evaluate(() => { const c = document.getElementById('tyDay'), a = c && c.querySelector('.tyAw10'); if (!a || c.hidden) return null; const r = a.getBoundingClientRect(); return { x: r.left, r: r.right, W: innerWidth, over: a.scrollWidth - a.clientWidth, txt: a.innerText.slice(0, 60) } });
    ok(aw && aw.x >= -.5 && aw.r <= aw.W + .5 && aw.over <= 1 && /Weekly Park Awards/.test(aw.txt), `${w}×${h}: the 7th evening's day card shows the Weekly Park Awards inside the screen`);
    await page.screenshot({ path: SH + `v101_merged_awards_${w}x${h}.png` });
    const e = quiet(errors); ok(e.length === 0, `${w}×${h}: no errors` + (e.length ? ': ' + e.join(' | ').slice(0, 200) : ''));
    await browser.close();
  }
  // ---------- 2. going back: a 10.1 park with a merged stall (Cotton Candy: the one a new Career park may build), entertainers and a trophy opens in 10.0 and comes back
  {
    let w = await open(F, { w: 1200, h: 800, mobile: false }); await D(w.page, 'T.fresh("career", 60000)'); await D(w.page, 'T.speed(0)');
    for (const [k, i, j] of [['carousel', 21, 40], ['candy', 26, 43]]) { const b = await w.page.evaluate(L.place, [k, i, j, 6]); if (!b.ok) throw new Error('could not build ' + k); await w.page.evaluate(L.connect, [b.id]) }
    await D(w.page, 'T.staffSet("ent", 2)'); await D(w.page, 'T.set({ day: 7 })'); await D(w.page, 'T.endDay()'); await w.page.waitForTimeout(200); await D(w.page, 'T.act("dayx")'); await D(w.page, 'T.save()');
    const a = await D(w.page, 'T.saved()'), raw = await all(w.page), e1 = quiet(w.errors); await w.browser.close();
    const kinds = o => o.objs.map(x => x.k).sort().join(',');
    ok(/candy/.test(kinds(a)) && a.staff.ent === 2 && a.aw10 && a.aw10.n === 1 && e1.length === 0, `10.1 saves a park with the merged things (${kinds(a)}; 2 entertainers; ${a.aw10 ? a.aw10.n : 0} awards evening)`);
    w = await open(OLD, { w: 1200, h: 800, mobile: false, storage: raw }); await D(w.page, 'T.open("career")'); await w.page.waitForTimeout(1200);
    const s0 = await D(w.page, 'T.state()'); await D(w.page, 'T.ff(20)'); await D(w.page, 'T.save()');
    const b = await D(w.page, 'T.saved()'), raw0 = await all(w.page), e0 = quiet(w.errors); await w.browser.close();
    ok(e0.length === 0 && s0.day === a.day && kinds(b) === 'carousel', `10.0 opens it without an error and keeps what it knows (${kinds(b)}): Cotton Candy is not in 10.0 and is dropped` + (e0.length ? ' — errors: ' + e0.join(' | ').slice(0, 200) : ''));
    ok(!('aw10' in b) && !('wk10' in b) && !(b.staff && b.staff.ent), 'when 10.0 saves it again the entertainers and the trophy cabinet are gone too');
    w = await open(F, { w: 1200, h: 800, mobile: false, storage: raw0 }); await D(w.page, 'T.open("career")'); await w.page.waitForTimeout(1200);
    const s1 = await D(w.page, 'T.state()'), e2 = quiet(w.errors); await w.browser.close();
    ok(e2.length === 0 && s1.day === b.day && s1.objs === b.objs.length, `back in 10.1 the park opens as 10.0 left it (day ${s1.day}, ${s1.objs} thing): no errors`);
  }
  // ---------- 3. the content security policy: the trailer's host may serve pictures and video, and nothing else
  {
    const { browser, page } = await open(F, { w: 1200, h: 800, mobile: false });
    const r = await page.evaluate(() => { const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]'), d = {}; for (const p of (m ? m.content : '').split(';')) { const [k, ...v] = p.trim().split(/\s+/); if (k) d[k] = v } const tr = (d['media-src'] || []).filter(x => /^https:/.test(x)); return { tr, img: (d['img-src'] || []).filter(x => /^https:/.test(x)), other: Object.keys(d).filter(k => k !== 'media-src' && k !== 'img-src' && d[k].some(x => tr.includes(x))), src: typeof TRAILER10 !== 'undefined' ? null : null } });
    ok(r.tr.length === 1 && r.img.length === 1 && r.img[0] === r.tr[0] && r.other.length === 0, `the policy allows one outside host for video and pictures (${r.tr.join(' ')}) and that host appears under no other heading (script, styles, connections)`);
    await browser.close();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL the suite stopped: ' + (e && e.stack || e)); process.exit(1) });
