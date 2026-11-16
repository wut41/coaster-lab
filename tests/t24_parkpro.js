// Coaster Lab 10.1 — My Park: the books (📊 Reports), why visitors went home, the 🧭 Park Advisor, queues and the
// short line, mechanics and the service policy, 🔔 recent events, the Visitors tab, the CSV download, a long busy day,
// four screen sizes, and the starter park that stopped 10.0 with "Maximum call stack size exceeded".
//   node t24_parkpro.js          T24=AB node t24_parkpro.js
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_1.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
const ONLY = process.env.T24 || 'ABCDEFGHIJ';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const near = (a, b, e) => Math.abs(a - b) <= (e == null ? 1.01 : e), sum = o => Object.values(o).reduce((a, b) => a + b, 0);
// the week's books as text, whatever order the keys are in; a reason nobody had (0) is the same as no entry
const books = wk => JSON.stringify(wk.map(q => { const o = {}; for (const k of Object.keys(q).sort()) { const v = q[k]; o[k] = v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([, x]) => k !== 'why' || x).sort()) : v } return o }));
const mk = async (o = {}) => {
  const r = await open(F, { w: 1200, h: 800, mobile: false, ...o }), page = r.page;
  r.X = (f, a) => page.evaluate(f, a); r.D = (expr, a) => page.evaluate(new Function('a', 'const D = window.__coasterDebug.v80.v10, T = D.ty, P = D.pro; return ' + expr), a);
  // a small Career park: a carousel, a burger bar, a drinks stand and a bench, all joined to the entrance path
  r.park = async (extra = [], money = 60000) => { await r.D('T.fresh("career", a)', money); await r.D('T.speed(0)'); await r.D('T.set({ xp: 999999 })'); const ids = {};
    for (const [k, i, j] of [['carousel', 21, 40], ['burger', 26, 43], ['drinks', 24, 44], ['bench', 23, 44], ...extra]) { const b = await r.X(L.place, [k, i, j, 6]); if (!b.ok) throw new Error('could not build ' + k); ids[k] = b.id; await r.X(L.connect, [b.id]) }
    await r.D('T.time(600)'); return ids };
  // close the park for the night and open it again next morning
  // (walk = park seconds for the last visitors to walk out before midnight)
  r.night = async (walk = 0) => { const ld = await r.D('T.dayEnd()'); await page.waitForTimeout(120); await r.X(() => { const e = document.querySelector('#tyDay'); if (e) e.hidden = true }); await r.D('T.act("dayx")'); if (walk) await r.D('T.ff(a)', walk); await r.D('T.time(1439.6)'); await r.D('T.ff(1)'); await r.D('T.time(539)'); await r.D('T.ff(1.5)'); await r.D('T.time(600)'); return ld };
  r.office = async tab => { await r.D('T.act("hq", a)', tab); await page.waitForTimeout(600); return r.X(() => document.querySelector('#pkB').innerText) };
  return r;
};
(async () => {
  // ---------- A. the books: today, yesterday, the week, and what is saved
  if (ONLY.includes('A')) {
    const { browser, page, errors, X, D, park, night, office } = await mk(); const ids = await park();
    const tabs = await (async () => { await D('T.act("hq", "home")'); await page.waitForTimeout(500); return X(() => [...document.querySelectorAll('#pkTabs [data-pktab]')].map(b => b.dataset.pktab)) })();
    ok(tabs.includes('rep') && tabs.indexOf('rep') === tabs.indexOf('money') + 1, 'the Park Office has a 📊 Reports tab next to Money (' + tabs.join(', ') + ')');
    let txt = await office('rep'); ok(/first report appears when the park closes tonight/.test(txt) && /Rides and stalls/.test(txt) && /Carousel/.test(txt) && /Burger Bar/.test(txt), 'before the first closing time it says the report comes tonight, and lists what is built');
    await D('T.spawn(60)'); await D('T.ff(120)');
    let st = await D('T.state()'), th = await D('a.map(id => ({ id, ...P.thing(id) }))', Object.values(ids)), rows = await D('P.rides()');
    const led = st.led.inc, sold = led.rides + led.food + led.shops + (led.photo || 0), mine = th.reduce((a, q) => a + q.inc, 0);
    ok(sold > 50 && near(mine, sold), 'what the rides and stalls took today adds up to the park’s own ledger ($' + Math.round(mine) + ' against tickets + food + shops $' + sold + ')');
    ok(rows.length === 3 && rows.every(q => { const t = th.find(z => z.id === q.id); return near(q.today, t.inc - t.run) && q.n === t.n && q.yn === null }) && rows[0].today >= rows[1].today, 'each row is that thing’s takings minus its running costs, best earner first (' + rows.map(q => q.name + ' $' + q.today).join(', ') + ')');
    const ld = await D('T.dayEnd()'); await page.waitForTimeout(150); await X(() => { const e = document.querySelector('#tyDay'); if (e) e.hidden = true }); await D('T.act("dayx")'); let wk = await D('P.wk()');
    ok(wk.length === 1 && wk[0].day === ld.day && wk[0].guests === ld.guests && Object.keys(wk[0].inc).every(k => near(wk[0].inc[k], ld.led.inc[k] || 0, .51)) && Object.keys(wk[0].exp).every(k => near(wk[0].exp[k], ld.led.exp[k] || 0, .51)) && wk[0].exp.upkeep > 0, 'closing time writes the day into the week’s books exactly as the day card shows it (in $' + sum(wk[0].inc) + ', out $' + sum(wk[0].exp) + ', upkeep $' + wk[0].exp.upkeep + ')');
    const left0 = wk[0].left, here0 = (await D('T.state()')).guests; await D('T.ff(60)'); wk = await D('P.wk()');
    ok(here0 > 10 && wk[0].left > left0 && sum(wk[0].why) === wk[0].left && (wk[0].why.closing || 0) >= (wk[0].left - left0) * .8, 'the ' + here0 + ' people still in the park at closing time are added to that day as they walk out (' + left0 + ' → ' + wk[0].left + ' went home, ' + (wk[0].why.closing || 0) + ' because the park closed)');
    await D('T.time(1439.6)'); await D('T.ff(1)'); await D('T.time(539)'); await D('T.ff(1.5)'); await D('T.time(600)');
    rows = await D('P.rides()'); const car = rows.find(q => q.id === ids.carousel), t0 = th.find(z => z.id === ids.carousel);
    ok(car.n === 0 && car.today <= 0 && car.today > -5 && car.yn >= t0.n && car.yp < Math.round(t0.inc - t0.run) && car.yp > 0 && car.back > 0, 'next morning “today” starts again and “yesterday” is the day just ended, with upkeep taken off (Carousel: ' + car.yn + ' riders, $' + car.yp + ', pays for itself in ≈ ' + car.back + ' days)');
    txt = await office('rep'); ok(/Yesterday/.test(txt) && /Profit|Loss/.test(txt) && /The last day/.test(txt) && /Entrance tickets/.test(txt) && /Upkeep|upkeep/.test(txt) && /Why visitors went home/.test(txt) && /Staff/.test(txt), 'the Reports tab shows yesterday, the week’s money in and out, each ride, queues, why people left, and staff');
    await page.screenshot({ path: SH + 'v101_reports_1200x800.png' });
    for (let k = 0; k < 8; k++) await night(); wk = await D('P.wk()'); st = await D('T.state()');
    ok(wk.length === 7 && wk.every((q, i) => i === 0 || q.day === wk[i - 1].day + 1) && wk[6].day === st.day - 1, 'the books keep the last seven days (days ' + wk[0].day + ' to ' + wk[6].day + '; today is day ' + st.day + ')');
    // saved with the park
    await D('P.setPol(1)'); await X(() => document.querySelector('#pkB [data-x^="ql:"]').click()); await page.waitForTimeout(300); await D('T.save()');
    const sv = await D('T.saved()'); ok(sv.wk.length === 7 && sv.pol.insp === 1 && sv.objs.find(o => o.id === ids.carousel).ql === 1 && Array.isArray(sv.objs.find(o => o.id === ids.carousel).st.y), 'the week’s books, the service policy and the short line are saved with the park');
    await D('T.exit()'); await page.waitForTimeout(300); await D('T.open("career")'); await page.waitForTimeout(800);
    const wk2 = await D('P.wk()'), back = [books(wk2) === books(wk), (await D('P.thing(a).ql', ids.carousel)) === 1, await D('P.queue(a).short', ids.carousel), (await D('T.saved()')).pol.insp === 1];
    ok(back.every(Boolean), 'and are all there when the park is opened again' + (back.every(Boolean) ? '' : ' — NOT: books ' + back[0] + ', short line ' + back[1] + '/' + back[2] + ', policy ' + back[3] + ' | ' + JSON.stringify(wk2).slice(0, 200) + ' | ' + JSON.stringify(wk).slice(0, 200)));
    // a save that was edited by hand
    await D('T.exit()'); await X(() => { const k = 'coasterlab.v10.park.career', p = JSON.parse(localStorage.getItem(k)); p.wk = ['junk', null, { day: '<img src=x onerror=alert(1)>', inc: { gate: 'lots', rides: 1e99, evil: 5 }, exp: { run: -50, __proto__: { x: 1 } }, guests: 'many', left: -4, spend: 1e12, rides: 'x', happy: 900, why: { unhappy: 3.7, bogus: 9 } }, { day: 3 }]; p.pol = { insp: 'yes', extra: 1 }; p.objs[0].ql = 'short'; p.objs[0].st.y = ['a', 2, 3]; localStorage.setItem(k, JSON.stringify(p)) });
    await D('T.open("career")'); await page.waitForTimeout(800); const w3 = await D('P.wk()'), sv3 = await D('(() => { T.save(); return T.saved() })()');
    ok(w3.length === 1 && w3[0].day === 1 && w3[0].inc.gate === 0 && w3[0].inc.rides === 1e12 && !('evil' in w3[0].inc) && w3[0].exp.run === 0 && w3[0].guests === 0 && w3[0].left === 0 && w3[0].happy === 100 && w3[0].why.unhappy === 4 && !('bogus' in w3[0].why) && sv3.pol.insp === 0 && !('extra' in sv3.pol) && sv3.objs[0].ql === undefined && sv3.objs[0].st.y === undefined, 'a save edited by hand is cleaned on the way in: numbers are kept in range, anything else is dropped');
    txt = await office('rep'); ok(!/<img|onerror|NaN|undefined/.test(await X(() => document.querySelector('#pkB').innerHTML)), 'and the report still draws from it');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- B. why visitors went home
  if (ONLY.includes('B')) {
    const { browser, page, errors, X, D, park, night, office } = await mk(); await park();
    await D('T.spawn(30)'); await D('T.ff(6)'); const n1 = await D('P.each({ happy: 4 })'); await D('T.ff(90)'); let d = await D('P.day()');
    ok(n1 >= 25 && d.left >= 20 && (d.why.unhappy || 0) >= d.left - 2, 'visitors who are miserable go home, and are counted as “Left unhappy” (' + (d.why.unhappy || 0) + ' of ' + d.left + ')');
    await D('T.spawn(30)'); await D('T.ff(6)'); await D('P.each({ cash: 0 })'); await D('T.ff(90)'); d = await D('P.day()');
    ok((d.why.broke || 0) >= 20, 'visitors with empty pockets are “Ran out of money” (' + (d.why.broke || 0) + ')');
    await D('T.spawn(30)'); await D('T.ff(6)'); await D('P.each({ energy: 2 })'); await D('T.ff(90)'); d = await D('P.day()');
    ok((d.why.tired || 0) >= 15, 'worn-out visitors are “Too tired” (' + (d.why.tired || 0) + ')');
    const keys = await D('P.why()'); ok(Object.keys(d.why).every(k => keys.includes(k)) && sum(d.why) === d.left, 'every visitor who left has exactly one reason (' + JSON.stringify(d.why) + ' = ' + d.left + ')');
    await D('T.spawn(40)'); await D('T.ff(20)'); const before = d.left; const ld = await night(70); const wk = await D('P.wk()');
    ok(wk[0].left > before && (wk[0].why.closing || 0) >= 20 && sum(wk[0].why) === wk[0].left, 'the people sent home at closing time are “The park closed” (' + (wk[0].why.closing || 0) + ' of ' + wk[0].left + ')');
    const txt = await office('rep'); ok(/Why visitors went home/.test(txt) && /Yesterday: \d+ left/.test(txt) && /Left unhappy/.test(txt) && /Ran out of money/.test(txt) && /The park closed/.test(txt), 'the Reports tab shows the reasons as bars, most common first');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- C. the Park Advisor
  if (ONLY.includes('C')) {
    const { browser, page, errors, X, D, park, night, office } = await mk(); const ids = await park();
    let a = await D('P.advice()'); ok(Array.isArray(a) && a.length === 0, 'a new park with nothing wrong gets no advice');
    let txt = await office('home'); ok(/Park Advisor/.test(txt) && /The numbers look healthy/.test(txt) && /Recent events/.test(txt), 'Overview shows the 🧭 Park Advisor (“The numbers look healthy”) and 🔔 Recent events');
    // a ride priced far too high
    const fare0 = (await D('P.thing(a)', ids.carousel)).fare; await D('P.thing(a, { price: 14 })', ids.carousel); await D('T.spawn(70)'); await D('T.ff(60)');
    let q = await D('P.queue(a)', ids.carousel); a = await D('P.advice()'); const dear = a.find(z => /priced too high/.test(z.t));
    const upTo = dear && +(/pay up to \$([\d.]+)/.exec(dear.why) || [])[1];
    ok(q.exp >= 12 && dear && dear.act === 'go:' + ids.carousel && upTo >= fare0 && upTo < 14 && new RegExp('^' + q.exp + ' visitors').test(dear.why), 'a carousel at $14 (it was $' + fare0 + '): “' + (dear ? dear.t + ' — ' + dear.why : 'no advice') + '”');
    ok(q.exp <= (await D('T.state()')).guests + (await D('P.day()')).left, 'each visitor is counted once, however often they look at the ride (' + q.exp + ' people)');
    await D('P.thing(a, { price: -1 })', ids.carousel);
    // hungry visitors
    await D('P.each({ hunger: 90 })'); a = await D('P.advice()'); ok(a.some(z => /hungry/.test(z.t) && z.act === 'cat:shop'), 'hungry visitors with a burger bar in the park: “' + (a.find(z => /hungry/.test(z.t)) || {}).why + '”');
    await D('P.each({ hunger: 10, energy: 12 })'); a = await D('P.advice()'); ok(a.some(z => /tired/.test(z.t)), 'tired visitors: “' + (a.find(z => /tired/.test(z.t)) || {}).why + '”'); await D('P.each({ energy: 80 })');
    // money
    await D('T.set({ loan: 5000, money: 60000 })'); a = await D('P.advice()'); ok(a.some(z => /Repay your loan/.test(z.t) && /\$60 a day/.test(z.why) && z.act === 'tab:money'), 'a loan with plenty in the bank: “' + (a.find(z => /loan/.test(z.t)) || {}).why + '”');
    await D('T.set({ loan: 0 })'); await night(); await D('T.set({ money: 120 })'); a = await D('P.advice()'); const tight = a.find(z => /Money is tight/.test(z.t));
    ok(tight && tight.act === 'tab:rep' && /\$120/.test(tight.why), 'nearly out of money: “' + (tight ? tight.why : '—') + '”'); await D('T.set({ money: 60000 })');
    // a worn-out ride and no mechanic
    await D('P.hire("mech", 0)'); await D('P.thing(a, { rel: 30 })', ids.carousel); a = await D('P.advice()'); ok(a.some(z => /worn out \(30%\)/.test(z.t) && z.act === 'tab:staff'), 'a ride at 30% with no mechanic: “' + (a.find(z => /worn out/.test(z.t)) || {}).t + '”');
    ok(a.length <= 5 && a.every((z, i) => i === 0 || a[i - 1].pri >= z.pri) && a.every(z => z.t && z.why && /^(go|tab|cat):/.test(z.act) && !/undefined|NaN/.test(z.t + z.why)), 'at most five suggestions, the most useful first, each with a reason and a place to go');
    // on screen
    await D('P.thing(a, { price: 14 })', ids.carousel); await D('T.spawn(40)'); await D('T.ff(40)'); txt = await office('home'); const items = await X(() => [...document.querySelectorAll('#pkB .adv10')].map(b => ({ x: b.dataset.x, t: b.textContent.trim().slice(0, 70) })));
    ok(items.length >= 1 && items.length <= 5 && items.some(z => /^go:/.test(z.x)), 'they are buttons on the Overview (' + items.map(z => z.t.slice(0, 34)).join(' · ') + ')'); await page.screenshot({ path: SH + 'v101_advisor_1200x800.png' });
    const go = items.find(z => /^go:/.test(z.x)); await X(x => document.querySelector('#pkB .adv10[data-x="' + x + '"]').click(), go.x); await page.waitForTimeout(500);
    ok((await D('T.ui()')).sel === +go.x.slice(3) && await X(() => { const p = document.querySelector('#pk72'); return !p || p.hidden || !p.classList.contains('on') || getComputedStyle(p).display === 'none' }), 'tapping one about a ride closes the Office and selects that ride');
    await office('home'); const tb = await X(() => { const b = [...document.querySelectorAll('#pkB .adv10')].find(b => /^tab:/.test(b.dataset.x)); if (!b) return null; const x = b.dataset.x; b.click(); return x }); await page.waitForTimeout(500);
    ok(!tb || await X(x => (document.querySelector('#pkTabs .on') || {}).dataset.pktab === x.slice(4), tb), 'tapping one about staff or money opens that tab' + (tb ? ' (' + tb + ')' : ' (none on the list this time)'));
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- D. queues and the short line
  if (ONLY.includes('D')) {
    const { browser, page, errors, X, D, park, night, office } = await mk(); const ids = await park(); const id = ids.carousel;
    const cap0 = (await D('P.queue(a)', id)).cap; let txt = await office('rep');
    ok(/Queues/.test(txt) && /In line/i.test(txt) && /Gave up/i.test(txt) && await X(i => { const b = document.querySelector('#pkB [data-x="ql:' + i + '"]'); return b && b.textContent === 'Full' && b.getAttribute('aria-pressed') === 'false' }, id), 'Reports lists each ride’s line: how many are in it, the wait, who skipped it, who gave up, who found it too dear (line holds ' + cap0 + ')');
    await X(i => document.querySelector('#pkB [data-x="ql:' + i + '"]').click(), id); await page.waitForTimeout(400); let q = await D('P.queue(a)', id);
    ok(q.cap === Math.max(4, Math.ceil(cap0 / 2)) && q.short && await X(i => { const b = document.querySelector('#pkB [data-x="ql:' + i + '"]'); return b.textContent === 'Short' && b.getAttribute('aria-pressed') === 'true' }, id) && (await D('T.saved()')).objs.find(o => o.id === id).ql === 1, 'tapping “Full” makes it a short line: it holds half as many (' + cap0 + ' → ' + q.cap + '), the button says so, and it is saved');
    await D('T.spawn(80)'); await D('T.ff(90)'); q = await D('P.queue(a)', id); ok(q.n <= q.cap && q.long >= 5, 'on a busy day the short line never holds more than ' + q.cap + ' (' + q.n + ' in it), and more people walk past (' + q.long + ' skipped it)');
    await office('rep'); await X(i => document.querySelector('#pkB [data-x="ql:' + i + '"]').click(), id); await page.waitForTimeout(400); q = await D('P.queue(a)', id);
    ok(q.cap === cap0 && !q.short && (await D('T.saved()')).objs.find(o => o.id === id).ql === undefined, 'tapping again makes it a full line (' + q.cap + ')');
    // a breakdown sends the line away: that is not "gave up"
    // (no mechanic, so nobody services the worn ride first; the clock is put back so the park stays open)
    await D('P.hire("mech", 0)'); await D('T.time(700)'); await D('T.spawn(30)'); await D('T.ff(30)'); const up0 = (await D('P.queue(a)', id)).up; let broke = false, inQ = 0;
    for (let k = 0; k < 60 && !broke; k++) { await D('T.time(700)'); await D('P.thing(a, { rel: 0 })', id); inQ = Math.max(inQ, (await D('P.queue(a)', id)).n); await D('T.ff(6)'); broke = (await D('P.thing(a)', id)).broken > 0 }
    q = await D('P.queue(a)', id); ok(broke && inQ > 0 && q.n === 0 && q.up === up0, 'a breakdown sends the line away (' + inQ + ' were waiting), and those people are not counted as having given up (' + q.up + ')');
    ok((await D('P.log()')).some(m => /Carousel has broken down/.test(m)), 'the breakdown is kept in 🔔 Recent events');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- E. mechanics: the ride that matters most first, and the service policy
  if (ONLY.includes('E')) {
    const { browser, page, errors, X, D, park, night, office } = await mk(); const ids = await park([['c:Mine Mountain', 30, 30]], 90000); const car = ids.carousel, coa = ids['c:Mine Mountain'];
    await D('P.hire("mech", 1)'); const v = await D('a.map(id => P.thing(id).value)', [car, coa]); await D('P.thing(a, { broken: 1 })', car); await D('P.thing(a, { broken: 1 })', coa);
    await D('T.speed(1)'); let j, b, first = null; for (let k = 0; k < 40 && first == null; k++) { await D('T.ff(1)'); j = await D('P.jobs()'); first = j.find(s => s.k === 'mech').job } b = await D('a.map(id => P.thing(id).broken)', [car, coa]);
    ok(v[1] > v[0] && first === coa && b[1] === 2 && b[0] === 1, 'two rides broken and one mechanic: they go to the coaster first (it is worth ' + v[1] + ' against the carousel’s ' + v[0] + ')');
    let done = false; for (let k = 0; k < 60 && !done; k++) { await D('T.ff(5)'); await D('P.tick()'); b = await D('a.map(id => P.thing(id).broken)', [car, coa]); done = b[0] === 0 && b[1] === 0 }
    const sf = await D('P.staff()'); ok(done && sf.fix.n === 2 && sf.fix.sum > 0 && sf.now && sf.now.mech.busy > 0, 'then the carousel; both repairs are timed for the report (' + sf.fix.n + ' repairs, ' + Math.round(sf.fix.sum / sf.fix.n) + ' park minutes each; the mechanic was busy ' + Math.round(sf.now.mech.busy / sf.now.mech.n * 100) + '% of the time)');
    let txt = await office('rep'); ok(/Mechanics busy\s*\d+%/.test(txt.replace(/\n/g, ' ')) && /A repair takes\s*\d+ park min/.test(txt.replace(/\n/g, ' ')), 'the Reports tab shows how busy the staff are and how long a repair takes');
    // the service policy
    ok(/Service rides when they are quiet/.test(txt) && /below 55%/.test(txt), 'the usual rule: a worn ride is serviced only when nobody is waiting');
    await D('P.thing(a, { rel: 65 })', car); await D('T.ff(30)'); let t = await D('P.thing(a)', car); ok(!(t.insp > 0), 'a ride at 65% is left running under the usual rule');
    await X(() => document.querySelector('#pkB [data-x="polInsp:1"]').click()); await page.waitForTimeout(400); txt = await X(() => document.querySelector('#pkB').innerText);
    ok(/below 72%/.test(txt) && (await D('T.saved()')).pol.insp === 1, 'choosing “🛡 Service rides before they break” is saved, and the note explains the trade (short closures, fewer breakdowns)');
    let insp = false; for (let k = 0; k < 40 && !insp; k++) { await D('T.ff(3)'); insp = (await D('P.thing(a)', car)).insp > 0 }
    ok(insp, 'now the same ride is closed for a short service as soon as it is empty');
    for (let k = 0; k < 30 && insp; k++) { await D('T.ff(5)'); insp = (await D('P.thing(a)', car)).insp > 0 } t = await D('P.thing(a)', car);
    ok(!insp && t.rel > 80 && !t.broken, 'and comes back in good shape (' + Math.round(t.rel) + '%)');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- F. recent events and the Visitors tab
  if (ONLY.includes('F')) {
    const { browser, page, errors, X, D, park, night, office } = await mk(); const ids = await park();
    await D('T.time(754)'); await D('P.toast("🔧 Test ride <b>has</b> broken down", "t1", true)'); await D('P.toast("just a passing note", "t2", false)'); await D('P.toast("🔧 Test ride <b>has</b> broken down", "t1", true)');
    const log = await D('P.log()'); ok(log.filter(m => /Test ride/.test(m)).length === 1 && !log.some(m => /passing note/.test(m)), 'important messages are kept once each; passing ones are not');
    const h = await X(() => { window.__coasterDebug.v80.v10.ty.act('hq', 'home'); return new Promise(r => setTimeout(() => r(document.querySelector('#pkB .ev10') ? document.querySelector('#pkB .ev10').innerHTML : ''), 600)) });
    ok(/Test ride &lt;b&gt;has&lt;\/b&gt; broken down/.test(h) && /day 1 · 12:34/.test(h.replace(/\s+/g, ' ')), 'Overview lists them with the park day and time, as plain text (“day 1 · 12:34”)');
    for (let k = 0; k < 50; k++) await D('P.toast("event " + a, "e" + a, true)', k); ok((await D('P.log()')).length === 40, 'only the newest forty are kept');
    // Visitors
    await D('T.spawn(60)'); await D('T.ff(20)'); const n = await D('P.each({ hunger: 90, thirst: 10, bladder: 10, energy: 80, nausea: 0, cash: 50, happy: 70 })'); let txt = await office('guests');
    ok(/Mood by visitor type/.test(txt) && /What is bothering them/.test(txt) && new RegExp('Hungry\\s*' + n + ' · 100%').test(txt.replace(/\n/g, ' ')) && /Thirsty\s*0 · 0%/.test(txt.replace(/\n/g, ' ')), 'the Visitors tab shows the mood of each kind of visitor and what is bothering them right now (all ' + n + ' hungry)');
    await page.screenshot({ path: SH + 'v101_visitors_1200x800.png' });
    // what visitors notice
    const says = await D('(() => { const g = P.guests()[0]; const out = {}; const P_ = g; const save = { ...g }; g.umb = 0; g.energy = 20; g.cash = 50; g.happy = 60; g.rides = 0; g.t = 10; out.tired = P.notice(g); g.energy = 80; g.cash = 3; g.t = 5; out.poor = P.notice(g); g.cash = 50; g.happy = 95; g.rides = 4; out.happy = P.notice(g); Object.assign(g, save); return out })()');
    ok((says.poor && /out of money/.test(says.poor[1])) && (says.happy === null || Array.isArray(says.happy)), 'visitors remark on what they notice (“' + (says.poor || [])[1] + '”' + (says.happy ? ', “' + says.happy[1] + '”' : '') + ')');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- G. the CSV download
  if (ONLY.includes('G')) {
    const { browser, page, errors, X, D, park, night, office } = await mk(); const ids = await park(); await D('T.spawn(40)'); await D('T.ff(60)'); await night(); await D('T.spawn(20)'); await D('T.ff(30)');
    await D('P.thing(a, { name: "=SUM(A1:A9)" })', ids.carousel); await D('P.thing(a, { name: "Bob\'s Best, Burgers" })', ids.burger); await D('P.thing(a, { name: "@cmd" })', ids.drinks);
    const csv = await D('P.csv()'), lines = csv.split('\n'), things = lines.filter(l => /^thing,/.test(l)), days = lines.filter(l => /^day,/.test(l));
    ok(/^# Coaster Lab 10\.1 park report: /.test(lines[0]) && /game money/.test(lines[0]) && things.length === 3 && days.length === 1, 'the report has a title line, one row for each ride and stall and one for each day (' + things.length + ' + ' + days.length + ')');
    ok(things.some(l => l.includes('"\'=SUM(A1:A9)"')) && things.some(l => l.includes('"\'@cmd"')) && !things.some(l => /^thing,"[=+\-@]/.test(l)), 'a name that starts like a spreadsheet formula is written as text (\'=SUM(A1:A9))');
    ok(things.some(l => l.includes('"Bob\'s Best, Burgers"')) && things.every(l => { const rest = l.replace(/"(?:[^"]|"")*"/, 'x').split(','); return rest.length === 8 && rest.slice(2).every(v => v === '' || /^-?\d+$/.test(v)) }), 'a comma in a name stays inside its cell, and every other cell is a whole number');
    const hd = lines.find(l => /^section,day,visitors/.test(l)); ok(hd && /in_gate/.test(hd) && /out_upkeep/.test(hd) && days[0].split(',').length === hd.split(',').length, 'the day rows have a column for each kind of money in and out');
    await office('rep'); const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await X(() => document.querySelector('#pkB [data-x="repCsv"]').click()); const file = await dl;
    ok(file && /-report-day-2\.csv$/.test(file.suggestedFilename()), 'the button downloads it (' + (file ? file.suggestedFilename() : 'nothing') + ')');
    ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ').slice(0, 300) : '')); await browser.close();
  }
  // ---------- H. a long busy day with coasters: nobody gets stuck in a loop
  if (ONLY.includes('H')) {
    const { browser, page, errors, X, D, park, night, office } = await mk(); const ids = await park([['c:Mine Mountain', 30, 30], ['c:Looping Adventure', 12, 28], ['ferris', 30, 42]], 200000);
    await D('T.spawn(220)'); const t0 = Date.now(); let st; for (let k = 0; k < 6; k++) st = await D('T.ff(45)');
    const fam = await D('T.families()'), rows = await D('P.rides()'), why = (await D('P.day()')).why;
    ok(errors.length === 0 && st.guests > 150 && st.day === 1, 'nine busy park hours with ' + st.guests + ' visitors (far more than the park has room for), two coasters and families (' + fam.followers + ' people following a family leader): no errors' + (errors.length ? ': ' + errors[0].slice(0, 200) : ''));
    ok(rows.filter(q => q.n > 20).length >= 5 && st.riding + st.inQ > 30, 'every ride and stall is in use (' + rows.map(q => q.name + ' ' + q.n).join(', ') + '; ' + st.inQ + ' in line, ' + st.riding + ' riding)');
    for (let k = 0; k < 6; k++) st = await D('T.ff(45)'); const wk = await D('P.wk()'), loops = await D('P.loopStops()');
    ok(errors.length === 0 && st.day === 2 && wk.length === 1 && wk[0].left > 150 && sum(wk[0].why) === wk[0].left, 'on through closing time, the night and the next morning: still no errors, and all ' + wk[0].left + ' who went home are in the day’s report with a reason (' + Object.entries(wk[0].why).filter(([, v]) => v).map(([k, v]) => k + ' ' + v).join(', ') + '; ' + Math.round((Date.now() - t0) / 1000) + ' s)' + (errors.length ? ': ' + errors[0].slice(0, 200) : ''));
    console.log('INFO the safety net stopped a visitor going round in circles ' + loops + ' time' + (loops === 1 ? '' : 's') + ' in this run');
    const a = await D('P.advice()'); ok(a.length <= 5 && a.every(z => !/undefined|NaN|Infinity/.test(z.t + z.why)), 'the Advisor has something sensible to say about it (' + a.map(z => z.t).join(' · ').slice(0, 160) + ')');
    await browser.close();
  }
  // ---------- I. four screen sizes
  if (ONLY.includes('I')) {
    for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1200, 800]]) {
      const { browser, page, errors, X, D, park, night, office } = await mk({ w, h, mobile: w < 1000 }); const ids = await park(); await D('T.spawn(50)'); await D('T.ff(60)'); await night(); await D('T.spawn(30)'); await D('T.ff(40)'); await D('P.thing(a, { price: 14 })', ids.carousel); await D('T.ff(30)');
      const res = {}; for (const tab of ['rep', 'home', 'guests']) { await office(tab); res[tab] = await X(() => { const b = document.querySelector('#pkB'), r = b.getBoundingClientRect(), wide = [...b.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && (q.right > r.right + 1.5 || q.left < r.left - 1.5) && !e.closest('.rpS10') }); const off = [...b.querySelectorAll('*')].filter(e => e.offsetParent !== null && e.getBoundingClientRect().right > innerWidth + 2), clip = [...b.querySelectorAll('.rp10 td, .rp10 th')].filter(c => c.offsetParent && c.scrollWidth > c.clientWidth + 1);
        return { over: b.scrollWidth - b.clientWidth, doc: document.documentElement.scrollWidth - innerWidth, wide: wide.concat(off).slice(0, 3).map(e => e.tagName + '.' + e.className), tbl: [...b.querySelectorAll('.rpS10')].every(s => s.getBoundingClientRect().right <= r.right + 1.5 && (innerWidth > 560 || s.scrollWidth - s.clientWidth <= 1)) && clip.length === 0, small: [...b.querySelectorAll('button')].filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height < 30 }).length } }); if (tab === 'rep') await page.screenshot({ path: SH + 'v101_reports_' + w + 'x' + h + '.png' }) }
      const bad = Object.entries(res).filter(([, q]) => q.over > 1 || q.doc > 1 || q.wide.length || !q.tbl);
      ok(bad.length === 0 && errors.length === 0, w + '×' + h + ': Reports, Overview and Visitors fit the screen: nothing is wider than it, no table needs sideways scrolling on a phone, no number is cut off, no errors' + (bad.length ? ' — NOT: ' + JSON.stringify(bad).slice(0, 300) : '') + (errors.length ? ': ' + errors[0].slice(0, 200) : '')); await browser.close();
    }
  }
  // ---------- J. the crash 10.0 had in an ordinary starter park
  if (ONLY.includes('J')) {
    // two flat rides, food, drinks, restrooms, bins and benches on the entrance path, played at full speed for three park
    // days. In 10.0 a visitor following a family leader could be sent back and forth between two choices without end.
    const starter = async file => {
      const { browser, page, errors } = await open(file, { w: 1200, h: 800, mobile: false }), X = (f, a) => page.evaluate(f, a);
      await X(() => window.__coasterDebug.v80.v10.ty.fresh('career')); await page.waitForTimeout(400); await X(() => window.__coasterDebug.v80.v10.ty.path(24, 45, 24, 38));
      for (const q of [['carousel', 20, 42, 3], ['teacups', 28, 42, 3], ['burger', 26, 45, 2], ['drinks', 22, 45, 2], ['toilet', 26, 39, 2], ['bin', 25, 43, 1], ['bin', 23, 40, 1], ['bench', 25, 41, 1], ['bench', 23, 44, 1]]) { const b = await X(L.place, q); if (!b.ok) throw new Error('could not build ' + q[0]); if (!/^(bench|bin)$/.test(q[0])) await X(L.connect, [b.id]) }
      await X(() => window.__coasterDebug.v80.v10.ty.speed(1)); const d0 = (await X(() => window.__coasterDebug.v80.v10.ty.state())).day; let crash = '', day = d0;
      try { for (let k = 0; k < 260; k++) { await X(() => window.__coasterDebug.v80.v10.ty.ff(20)); const st = await X(() => { const q = window.__coasterDebug.v80.v10.ty.state(); return { day: q.day, open: q.open } }); day = st.day; if (st.day >= d0 + 3 && st.open) break } }
      catch (e) { crash = /Maximum call stack/.test(e.message) ? 'Maximum call stack size exceeded' : 'something else: ' + e.message.slice(0, 120) }
      // 10.1 keeps a count of visitors its safety net had to stop (it should have nothing to do: the cause itself is fixed)
      const net = crash ? null : await X(() => { const P = window.__coasterDebug.v80.v10.pro; return P && P.loopStops ? P.loopStops() : null });
      await browser.close(); return { crash, day, played: day - d0, errors, net } };
    // (which visitors turn up is chance: when this was written 10.0 stopped within two days in 8 runs of 8; one more try is allowed)
    let o = await starter(ROOT + 'coaster_lab_v10_0.html'); if (!o.crash) o = await starter(ROOT + 'coaster_lab_v10_0.html');
    ok(/Maximum call stack/.test(o.crash), '(10.0, for comparison) a starter park with two flat rides stops with “' + o.crash + '” on park day ' + o.day);
    const n = await starter(F);
    ok(!n.crash && n.played >= 3 && n.errors.length === 0 && n.net === 0, '10.1: the same park plays three whole days: no crash, no errors, and the safety net behind the fix was never needed (stopped ' + n.net + ' visitors)' + (n.crash ? ' — NOT: ' + n.crash : '') + (n.errors.length ? ' — errors: ' + n.errors.join(' | ').slice(0, 300) : ''));
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e.stack || e.message).slice(0, 600)); process.exit(1) });
