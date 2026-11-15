// Coaster Lab 10.0 — My Park: building rules, the ledger (every dollar accounted for), simulated visitors, queues and
// ride cycles, shops, staff, breakdowns, weather and the clock, goals and levels, saving, Career / Sandbox, park codes,
// the park cloud (played by a stand-in server), live presence (played by a stand-in socket) and four screen sizes.
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const ONLY = process.env.T8 || 'ABCDE';// run some sections only: T8=C node t8_v10_park.js
const near = (a, b, e = 1.5) => Math.abs(a - b) <= e, INCSUM = st => Object.values(st.led.inc).reduce((a, b) => a + b, 0);
(async () => {
  // ---------- A. building, money, visitors (career)
  if (ONLY.includes('A')) {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
    const X = (f, a) => page.evaluate(f, a), S = () => X(() => window.__coasterDebug.v80.v10.ty.state()), FF = s => X(s => { window.__coasterDebug.v80.v10.ty.ff(s) }, s);
    const sum = st => { let a = 0, b = 0; for (const k in st.led.inc) a += st.led.inc[k]; for (const k in st.led.exp) b += st.led.exp[k]; return [a, b] };
    ok(await X(() => window.__coasterDebug.v80.v10.ty.fresh('career')), 'My Park opens (career)'); await X(() => window.__coasterDebug.v80.v10.ty.speed(0)); await page.waitForTimeout(600);// paused: the test steps the park itself
    let s = await S(); ok(s.money === 25000 && s.mode === 'career' && s.objs === 0 && s.day === 1, 'a new career park starts with $25,000, day 1, nothing built');
    ok(await X(() => window.__coasterDebug.v80.v10.ty.hudHidden()) && await X(() => !document.querySelector('#ty10').hidden) && await X(() => window.__coasterDebug.v80.v10.ty.camMode()) === 'park10', 'the ride HUD steps aside and the park view takes over');
    // rules
    const b1 = await X(() => window.__coasterDebug.v80.v10.ty.build('carousel', 20, 40, 0)); s = await S();
    ok(b1.ok && s.money === 25000 - 2200 && s.led.exp.build === 2200, 'building a Carousel costs exactly its price ($2,200), booked under Building');
    ok(!b1.linked, 'a ride without a path is not connected');
    const r1 = await X(() => [window.__coasterDebug.v80.v10.ty.build('teacups', 21, 41, 0), window.__coasterDebug.v80.v10.ty.build('teacups', 24, 44, 0), window.__coasterDebug.v80.v10.ty.build('teacups', 2, 2, 0), window.__coasterDebug.v80.v10.ty.build('drop', 30, 40, 0), window.__coasterDebug.v80.v10.ty.build('c:Hydra', 20, 36, 0)]);
    ok(!r1[0].ok && /already built/.test(r1[0].why), 'cannot build on top of another ride: “' + r1[0].why + '”');
    ok(!r1[1].ok && /path/.test(r1[1].why), 'cannot build on a path: “' + r1[1].why + '”');
    ok(!r1[2].ok && /not own/.test(r1[2].why), 'cannot build on land you do not own: “' + r1[2].why + '”');
    ok(!r1[3].ok && /level 6/.test(r1[3].why), 'locked things say which level unlocks them: “' + r1[3].why + '”');
    ok(!r1[4].ok, 'a big coaster is refused too (level / money / room): “' + r1[4].why + '”');
    ok((await S()).money === 25000 - 2200, 'refused builds cost nothing');
    const m0 = (await S()).money; const pw = await X(() => window.__coasterDebug.v80.v10.ty.path(24, 45, 24, 41)); s = await S();
    ok(pw.length === 0 && s.money === m0 - 12, 'paths cost $12 a tile; tiles that already have a path are free (5 tiles asked, 1 new = $12)');
    await X(() => window.__coasterDebug.v80.v10.ty.path(23, 41, 23, 41)); ok((await X(() => window.__coasterDebug.v80.v10.ty.obj(1))).linked, 'a path beside the ride connects it to the gate');
    await FF(1.1); ok((await S()).goals.includes('g1') && near((await S()).led.inc.prize, 500, .01), 'goal “Open your first ride” pays its $500 prize into the books');
    ok(/entrance path/.test(await X(() => window.__coasterDebug.v80.v10.ty.unpath(24, 47))), 'the entrance path cannot be removed');
    // land
    const lp = await X(() => [window.__coasterDebug.v80.v10.ty.land(0, 0), window.__coasterDebug.v80.v10.ty.state().money]); ok(/next to your park/.test(lp[0]), 'land must touch the park: “' + lp[0] + '”');
    const mb = (await S()).money; const l2 = await X(() => window.__coasterDebug.v80.v10.ty.land(3, 3)); s = await S(); ok(l2 === '' && s.money === mb - 1800 && s.led.exp.land === 1800, 'a neighbouring plot costs $1,800 and is booked under Land');
    ok((await X(() => window.__coasterDebug.v80.v10.ty.build('bench', 24, 30, 0))).ok, 'the new plot can be built on');
    // shops and a coaster, connected with the game's own path rules
    for (const [k, i, j] of [['burger', 25, 43], ['drinks', 25, 44], ['toilet', 23, 44], ['bin', 25, 42]]) await X(L.place, [k, i, j, 2]);
    { const q = await S(); ok(near(q.money, 25000 + q.tot.inc - q.tot.exp, 1), 'so far: balance = $25,000 + everything booked in − everything booked out ($' + q.money + ')') }
    await X(() => window.__coasterDebug.v80.v10.ty.set({ money: 60000 })); const base = await S();
    const co = await X(L.place, ['c:Little Dipper', 30, 36, 8]); const pc = co.ok ? await X(L.connect, [co.id]) : -1;
    ok(co.ok && pc >= 0 && (await X(i => window.__coasterDebug.v80.v10.ty.obj(i), co.id)).linked, 'Little Dipper is built and a path reaches its queue yard (' + pc + ' tiles)');
    // visitors
    await FF(40); s = await S(); const g = await X(() => window.__coasterDebug.v80.v10.ty.guests());
    ok(s.guests > 0 && g.every(q => q.spent >= 10), s.guests + ' visitors came in through the gate; each paid the $10 entrance fee');
    ok(near(s.led.inc.gate, s.tot.guests * 10, .01), 'gate income = visitors × fee exactly (' + s.tot.guests + ' × $10 = $' + s.led.inc.gate + ')');
    ok(new Set(g.map(q => q.ty)).size >= 2, 'visitors are of different types: ' + [...new Set(g.map(q => q.ty))].join(', '));
    await FF(150); s = await S(); const o1 = await X(() => window.__coasterDebug.v80.v10.ty.obj(1)), o2 = await X(i => window.__coasterDebug.v80.v10.ty.obj(i), co.id);
    ok(o1.n + o2.n > 0 && near(s.led.inc.rides, o1.inc + o2.inc, 1), `rides ran with real riders (Carousel ${o1.n}, Little Dipper ${o2.n}); ride income = the tickets they paid ($${s.led.inc.rides})`);
    ok(near(o1.inc, o1.n * 2, .01), 'Carousel income = riders × its $2 ticket');
    ok(s.tot.rides === o1.n + o2.n, 'the park’s ride counter equals the riders counted on each ride');
    ok(o2.like != null && o2.like > 0, 'riders gave Little Dipper a verdict (★ ' + o2.like + ' of 5)');
    const tr = await X(i => window.__coasterDebug.v80.v10.ty.trains(i), co.id); ok(tr && tr.length === 1 && tr[0].cars === 6, 'the coaster has one six-car train');
    await FF(120); s = await S(); const [inc, exp] = sum(s);
    ok(s.tot.sales > 0 && s.led.inc.food > 0 && s.led.exp.stock > 0, s.tot.sales + ' things were bought at the stalls ($' + Math.round(s.led.inc.food) + ' in, $' + Math.round(s.led.exp.stock) + ' of stock out)');
    ok(near(s.money - base.money, (s.tot.inc - base.tot.inc) - (s.tot.exp - base.tot.exp), 1.5), 'after five more minutes of play: the balance moved by exactly income − costs (' + Math.round(s.tot.inc - base.tot.inc) + ' − ' + Math.round(s.tot.exp - base.tot.exp) + ' = ' + (s.money - base.money) + ')');
    ok(near(inc, INCSUM(s), .01), 'the ledger categories add up');
    ok(s.led.exp.wages > 0 && s.led.exp.run > 0, 'wages and running costs are charged while the park is open');
    // prices matter
    const before = (await X(() => window.__coasterDebug.v80.v10.ty.obj(1))).n; await X(() => { window.__coasterDebug.v80.v10.ty.sel(1); for (let k = 0; k < 40; k++) window.__coasterDebug.v80.v10.ty.act('price', 1) }); await page.waitForTimeout(200);
    ok((await X(() => window.__coasterDebug.v80.v10.ty.obj(1))).price >= 20, 'the ride card’s + button raises the ticket price'); await FF(80);
    const th = await X(() => window.__coasterDebug.v80.v10.ty.thoughts()); ok((await X(() => window.__coasterDebug.v80.v10.ty.obj(1))).n - before <= 14 && Object.keys(th).some(k => /cost too much/.test(k)), 'at $20+ a ride almost nobody rides the Carousel and visitors say the rides cost too much');
    await X(() => { for (let k = 0; k < 60; k++) window.__coasterDebug.v80.v10.ty.act('price', -1) }); ok((await X(() => window.__coasterDebug.v80.v10.ty.obj(1))).price === 0, 'the price can go down to free');
    await X(() => { for (let k = 0; k < 4; k++) window.__coasterDebug.v80.v10.ty.act('price', 1) });
    // upgrades
    const mu = (await S()).money, up = await X(i => window.__coasterDebug.v80.v10.ty.up(i, 'cap'), co.id), up2 = await X(i => window.__coasterDebug.v80.v10.ty.up(i, 'cap'), co.id); s = await S();
    ok(up === '' && up2 === '' && s.money < mu && (await X(i => window.__coasterDebug.v80.v10.ty.trains(i), co.id)).length === 2, 'two capacity upgrades cost money and add a second train to the coaster');
    await FF(60); const tr2 = await X(i => window.__coasterDebug.v80.v10.ty.trains(i), co.id); ok(tr2.length === 2 && tr2.some(q => q.ph !== 'hold'), 'both trains take turns at the station: ' + tr2.map(q => q.ph).join(' / '));
    // breakdown and repair
    await X(i => window.__coasterDebug.v80.v10.ty.breakIt(i), co.id); const rep0 = (await S()).led.exp.repair; await FF(4); ok((await X(i => window.__coasterDebug.v80.v10.ty.obj(i), co.id)).broken, 'a broken ride stays closed until a mechanic reaches it');
    await FF(90); const ob = await X(i => window.__coasterDebug.v80.v10.ty.obj(i), co.id); ok(!ob.broken && (await S()).led.exp.repair > rep0, 'the mechanic walked there and repaired it; the repair was paid for');
    // litter and janitors
    const lt0 = await X(() => window.__coasterDebug.v80.v10.ty.litterAdd(8)); await FF(60); ok((await S()).litter < lt0, 'the janitor sweeps litter (' + lt0 + ' → ' + (await S()).litter + ')');
    // weather and time
    await X(() => window.__coasterDebug.v80.v10.ty.wx('sunny'));// compare with a sunny moment (the weather changes by itself during the minutes played above)
    const a0 = await X(() => window.__coasterDebug.v80.v10.ty.arrival()); await X(() => window.__coasterDebug.v80.v10.ty.wx('storm')); const a1 = await X(() => window.__coasterDebug.v80.v10.ty.arrival()); await page.waitForTimeout(900);
    const wf = await X(() => window.__coasterDebug.v80.v10.ty.weatherFlags()); ok(a1 < a0 * .45 && wf.storm, 'a thunderstorm cuts arrivals to about a quarter and switches on rain and lightning' + (a1 < a0 * .45 && wf.storm ? '' : ' — arrivals ' + a0.toFixed(3) + ' → ' + a1.toFixed(3) + ', flags ' + JSON.stringify(wf)));
    await page.screenshot({ path: SH + 'v10_park_storm.png' }); await X(() => window.__coasterDebug.v80.v10.ty.wx('sunny'));
    await X(() => window.__coasterDebug.v80.v10.ty.time(1290)); await page.waitForTimeout(1200); const wn = await X(() => window.__coasterDebug.v80.v10.ty.weatherFlags()); ok(wn.night > .9 && wn.sunI < 1 && wn.dark, 'at 21:30 it is night: dim blue light, lamps and station lights on');
    await page.screenshot({ path: SH + 'v10_park_night.png' }); await X(() => window.__coasterDebug.v80.v10.ty.time(720)); await page.waitForTimeout(700); const wd = await X(() => window.__coasterDebug.v80.v10.ty.weatherFlags()); ok(wd.night < .05 && wd.sunI > 2, 'at noon it is bright day');
    // end of day
    const upk = await X(() => window.__coasterDebug.v80.v10.ty.upkeep ? window.__coasterDebug.v80.v10.ty.upkeep() : 0), dBefore = await S(), d = await X(() => window.__coasterDebug.v80.v10.ty.dayEnd()); s = await S();
    ok(d && d.day === dBefore.day && near(d.inc - d.exp, sum(dBefore)[0] - sum(dBefore)[1] - upk, 60), 'closing time: the day card shows the day’s own books, upkeep included (profit ' + Math.round(d.inc - d.exp) + ', upkeep ' + upk + ')');
    ok(sum(s)[0] < 1 && s.open === false, 'a new ledger starts for the next day; the park is closed for the night');
    ok(await X(() => !document.querySelector('#tyDay').hidden && /Day \d+ is over/.test(document.querySelector('#tyDay').textContent)), 'the end-of-day card is shown');
    await page.screenshot({ path: SH + 'v10_park_daycard.png' }); await X(() => window.__coasterDebug.v80.v10.ty.act('dayx'));
    let empty = false, secs = 0; for (let k = 0; k < 20; k++) { await FF(10); secs += 10; s = await S(); if (s.guests === 0 && !s.open) empty = true; if (s.day === dBefore.day + 1 && s.open) break }
    ok(empty && s.day === dBefore.day + 1 && s.open, 'everyone goes home, the night passes quickly and day ' + s.day + ' opens at 09:00 (' + secs + ' s after closing at normal speed)');
    if (!empty) console.log('  still in the park: ' + JSON.stringify(await X(() => window.__coasterDebug.v80.v10.ty.stuck())).slice(0, 900));
    // selling
    const ms = (await S()).money; await X(() => window.__coasterDebug.v80.v10.ty.remove(1)); s = await S(); ok(near(s.money, ms + 1100, .01) && near(s.led.inc.sale, 1100, .01), 'removing the Carousel gives half its price back, booked as a sale');
    // saving
    await X(() => window.__coasterDebug.v80.v10.ty.save()); const sv = await X(() => window.__coasterDebug.v80.v10.ty.saved('career')), cur = await S();
    ok(sv && sv.objs.length === cur.objs && Math.round(sv.money) === cur.money && sv.objs.every(o => !('rt' in o)), 'the park is saved (objects, paths, money) without any runtime state');
    await page.screenshot({ path: SH + 'v10_park_career.png' });
    ok(errors.length === 0, 'no errors in the career section' + (errors.length ? ': ' + errors.slice(0, 4).join(' | ') : ''));
    // reload: the same park comes back
    await page.reload(); await page.waitForFunction(() => window.__booted === true); await page.waitForTimeout(1200);
    await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await page.waitForTimeout(800); const s2 = await S();
    ok(s2.objs === cur.objs && s2.money === cur.money && s2.day === cur.day && s2.lv === cur.lv, 'after reloading the page the career park is exactly as it was left');
    // leaving restores the ride
    await X(() => window.__coasterDebug.v80.v10.ty.exit()); await page.waitForTimeout(600);
    ok(!(await X(() => window.__coasterDebug.v80.v10.ty.on())) && !(await X(() => window.__coasterDebug.v80.v10.ty.hudHidden())) && await X(() => window.__coasterDebug.v80.v10.ty.camMode()) !== 'park10', 'leaving My Park brings the ride and its HUD back');
    const st0 = await X(() => window.__coasterDebug.state().s); await X(() => window.__coasterDebug.v72.ff(3)); ok((await X(() => window.__coasterDebug.state().s)) !== st0, 'the ride runs again after leaving the park');
    await browser.close();
  }
  // ---------- B. Sandbox, customising, on-ride camera, your own coaster, the interface
  if (ONLY.includes('B')) {
    const { browser, page, errors } = await open(F, { w: 390, h: 844, storage: { 'coasterlab.v10.park.career': JSON.stringify({ v: 1, id: 'Pkeep1', name: 'Keep Me', mode: 'career', money: 31337, day: 4, land: '000000000000000000000000011110011110', paths: {}, objs: [] }) } });
    const X = (f, a) => page.evaluate(f, a), S = () => X(() => window.__coasterDebug.v80.v10.ty.state());
    await X(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox')); await page.waitForTimeout(600); let s = await S();
    ok(s.mode === 'sandbox' && s.lv === 30, 'the Sandbox opens with everything unlocked');
    const big = await X(L.place, ['c:Hydra', 24, 20, 14]); s = await S(); ok(big.ok && s.money === 0 && s.led.exp.build > 0, 'in the Sandbox a $26,000 coaster is free (the balance never moves; the books still record what it would cost)');
    ok(await X(L.connect, [big.id]) >= 0, 'paths can be laid anywhere in the Sandbox (all land is yours)');
    ok(await X(() => !document.querySelector('#tyBadge').hidden && /Sandbox/.test(document.querySelector('#tyBadge').textContent)), 'a badge says you are in the Sandbox');
    const own = await X(() => window.__coasterDebug.v80.v10.ty.custom([['station', {}], ['lift', { h: 22, a: 45 }], ['drop', { h: 21, a: 55 }], ['turn', { dir: 'R', ang: 180, r: 16 }], ['airtime', { h: 6, len: 44 }], ['hill', { h: 4, len: 32 }]], 'Test Flyer'));
    const mine = own ? await X(L.place, [own, 8, 8, 10]) : { ok: false }; ok(mine.ok, 'a coaster made of Track Builder pieces can be placed in the park as “' + own + '”');
    let oh; for (let k = 0; k < 6; k++) { await X(() => window.__coasterDebug.v80.v10.ty.ff(50)); oh = await X(i => window.__coasterDebug.v80.v10.ty.obj(i), big.id); if (oh.n > 0) break }// the first visitors need a while to walk to a coaster far from the gate
    ok(oh.n > 0 && /16|:/.test(String(oh.ph)), 'Hydra runs with riders in the Sandbox (' + oh.n + ' so far)');
    // look: name, colours, station, train
    await X(i => { const T = window.__coasterDebug.v80.v10.ty; T.sel(i); T.act('col', 'rail:#ff4fd8'); T.act('stn', 2) }, big.id); const oc = await X(i => window.__coasterDebug.v80.v10.ty.obj(i), big.id);
    ok(oc.col && oc.col.rail === '#ff4fd8' && oc.col.stn === 2, 'track colour and station style are stored with the ride and rebuilt in 3D');
    // on-ride camera
    await X(() => window.__coasterDebug.v80.v10.ty.act('pov')); await page.waitForTimeout(700); const c1 = await X(() => window.__coasterDebug.v72.cam()); ok(c1.mode === 'parkpov10' && await X(() => document.body.classList.contains('ty10pov')), 'Ride it: the camera sits in the front car and the park HUD hides');
    await page.screenshot({ path: SH + 'v10_park_pov.png' }); await X(() => window.__coasterDebug.v80.v10.ty.act('povx')); await page.waitForTimeout(300); ok((await X(() => window.__coasterDebug.v72.cam())).mode === 'park10', 'Leave the ride returns to the park view');
    // world controls (sandbox)
    await page.click('#tyMenuB'); await page.waitForTimeout(400); await page.click('#pkTabs [data-pktab="world"]'); await page.waitForTimeout(300);
    ok(await X(() => document.querySelectorAll('#pkB [data-x^="wx:"]').length) === 5 && await X(() => !!document.querySelector('#pkB input[data-x="hour"]')), 'Office → World: five kinds of weather and a time slider (Sandbox)');
    await page.click('#pkB [data-x="wx:fog"]'); await page.waitForTimeout(300); await page.click('#pkB [data-x="hourset:1170"]'); await page.waitForTimeout(300); await page.click('#pkB [data-x="clock:0"]'); await page.waitForTimeout(200);
    s = await S(); ok(s.wx === 'fog' && Math.abs(s.min - 1170) <= 3, 'weather and time follow the buttons (fog at sunset): ' + s.wx + ' at ' + s.min + ' min');
    await page.click('#pk72 [data-x="close"]'); await page.waitForTimeout(1500); const m1 = (await S()).min; await X(() => window.__coasterDebug.v80.v10.ty.ff(5)); ok((await S()).min === m1, 'with “Hold this time” the clock stays put');
    await page.screenshot({ path: SH + 'v10_park_sandbox_fog_sunset_phone.png' });
    // switching parks keeps both
    await X(() => window.__coasterDebug.v80.v10.ty.open('career')); await page.waitForTimeout(700); s = await S(); ok(s.name === 'Keep Me' && near(s.money, 31337, 8) && s.day === 4, 'switching to Career opens the career park as it was ($31,337, day 4): ' + s.name + ' $' + s.money + ' day ' + s.day);
    await X(() => window.__coasterDebug.v80.v10.ty.open('sandbox')); await page.waitForTimeout(700); s = await S(); ok(s.mode === 'sandbox' && s.objs >= 2, 'switching back: the Sandbox park is still there with its coasters');
    ok(errors.filter(e => !/ERR_FAILED/.test(e)).length === 0, 'no errors in the sandbox section' + (errors.length ? ': ' + errors.filter(e => !/ERR_FAILED/.test(e)).slice(0, 4).join(' | ') : ''));
    await browser.close();
  }
  // ---------- C. park codes, the park cloud and live presence
  if (ONLY.includes('C')) {
    const { cloud, db } = require('./tools/cloud_mock')();// a stand-in for the park cloud, with the same rules as the database functions
    // a stand-in for the realtime socket: it answers the join, reports one other person in the park and moves them
    const sock = `window.__ws=[];window.WebSocket=class{constructor(u){this.url=u;this.readyState=0;this.sent=[];window.__ws.push(this);setTimeout(()=>{this.readyState=1;this.onopen&&this.onopen()},30)}
      send(t){const m=JSON.parse(t);this.sent.push(m);if(m.event==='phx_join'){this.topic=m.topic;setTimeout(()=>{this.emit({topic:m.topic,event:'phx_reply',ref:m.ref,payload:{status:'ok',response:{}}});this.emit({topic:m.topic,event:'presence_state',payload:{peer1:{metas:[{name:'Robin',col:'#22e0ff',x:10,z:60,owner:false}]}}})},20)}}
      emit(m){this.onmessage&&this.onmessage({data:JSON.stringify(m)})}close(){this.readyState=3;this.onclose&&this.onclose()}};`;
    const A = await open(F, { w: 1200, h: 800, mobile: false, cloud, init: sock }), XA = (f, a) => A.page.evaluate(f, a);
    await XA(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox')); await A.page.waitForTimeout(500);
    await XA(() => window.__coasterDebug.v80.v10.ty.path(24, 45, 24, 36)); for (const q of [['carousel', 20, 40, 3], ['c:Mine Mountain', 30, 30, 12]]) { const b = await XA(L.place, q); if (b.ok) await XA(L.connect, [b.id]) } await XA(() => { window.__coasterDebug.v80.v10.ty.ff(20) });
    const code = await XA(() => window.__coasterDebug.v80.v10.ty.pack()), nObj = (await XA(() => window.__coasterDebug.v80.v10.ty.state())).objs;
    ok(/^CL10[ZJ][A-Za-z0-9_-]{200,}$/.test(code), 'a park code is plain text starting with CL10 (' + code.length + ' letters for this park)');
    // publish to the cloud
    await XA(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await A.page.waitForTimeout(500); ok((await XA(() => window.__coasterDebug.v80.v10.ty.cloud())).st === 'ok', 'the park cloud answers');
    await XA(() => window.__coasterDebug.v80.v10.ty.publish()); await A.page.waitForTimeout(800); const pub = db.parks[0];
    ok(pub && /^[2-9A-HJ-NP-Z]{6}$/.test(pub.code) && pub.data.objs.length === nObj && !JSON.stringify(pub.data).includes('"rt"'), 'Publish stores the park in the cloud under a 6-letter code (' + (pub && pub.code) + ')');
    ok(pub && pub.stats.coasters === 1 && pub.stats.mode === 'sandbox' && typeof pub.stats.rating === 'number', 'the published summary has the park’s own numbers (rating ' + (pub && pub.stats.rating) + ', 1 coaster)');
    ok(pub && !/sb_secret|service_role/.test(JSON.stringify(pub)) && pub.owner.length === 48, 'only the publishable key and a device secret are used (no account, no private key in the page)');
    const until = async (pg, f, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await pg.evaluate(f)) return true; await pg.waitForTimeout(200) } return false };
    await until(A.page, () => window.__coasterDebug.v80.v10.ty.live().others.length > 0); const lv = await XA(() => window.__coasterDebug.v80.v10.ty.live());
    ok(lv.joined && lv.topic === 'realtime:clpark-' + pub.code && lv.others.length === 1 && lv.others[0].name === 'Robin', 'live presence: joined the park’s channel and sees “Robin”');
    await until(A.page, () => window.__coasterDebug.v80.v10.ty.live().marks === 1); ok((await XA(() => window.__coasterDebug.v80.v10.ty.live())).marks === 1, 'Robin is drawn in the park as a pin with a name');
    await XA(() => { const w = window.__ws[window.__ws.length - 1]; w.emit({ topic: w.topic, event: 'broadcast', payload: { type: 'broadcast', event: 'pos', payload: { id: 'peer1', x: -30, z: 20 } } }) }); await A.page.waitForTimeout(1500);
    const lv2 = await XA(() => window.__coasterDebug.v80.v10.ty.live()); ok(lv2.others[0].x < 0 && lv2.others[0].z < 50, 'when Robin looks somewhere else the pin glides there (' + lv2.others[0].x + ', ' + lv2.others[0].z + ')');
    const sentPos = await XA(() => { window.__coasterDebug.v80.v10.ty.cam(40, 40, 60); return 1 }); await A.page.waitForTimeout(1500);
    const sent = await XA(() => window.__ws[window.__ws.length - 1].sent.map(m => m.event + ':' + (m.payload && m.payload.event || ''))); ok(sent.some(q => q === 'presence:track') && sent.some(q => q === 'broadcast:pos'), 'this device announces itself and sends where it is looking');
    await A.page.screenshot({ path: SH + 'v10_park_live.png' });
    await XA(() => { const w = window.__ws[window.__ws.length - 1]; w.emit({ topic: w.topic, event: 'presence_diff', payload: { joins: {}, leaves: { peer1: { metas: [{}] } } } }) }); await A.page.waitForTimeout(500); ok((await XA(() => window.__coasterDebug.v80.v10.ty.live())).others.length === 0, 'when Robin leaves, the pin goes');
    ok(A.errors.length === 0, 'no errors while publishing' + (A.errors.length ? ': ' + A.errors.slice(0, 3).join(' | ') : '')); await A.browser.close();
    // a second device visits by cloud code, rates it, and cannot change it
    const B = await open(F, { w: 390, h: 844, cloud, init: sock }), XB = (f, a) => B.page.evaluate(f, a);
    const w1 = await XB(c => window.__coasterDebug.v80.v10.ty.visitCode(c), pub.code); await B.page.waitForTimeout(900); const v = await XB(() => window.__coasterDebug.v80.v10.ty.visiting()), sb = await XB(() => window.__coasterDebug.v80.v10.ty.state());
    ok(w1 === '' && v && v.cloud && v.code === pub.code && sb.objs === nObj, 'another device opens the park by its cloud code: same ' + nObj + ' things, read only');
    ok(pub.visits === 1, 'the visit is counted');
    const tryB = await XB(() => window.__coasterDebug.v80.v10.ty.build('tree', 24, 30, 0)); ok(!tryB.ok && /visiting/.test(tryB.why) && await XB(() => document.querySelector('#tyBar').hidden), 'a visitor cannot build or remove anything (no build bar)');
    await XB(() => { window.__coasterDebug.v80.v10.ty.ff(60) }); ok((await XB(() => window.__coasterDebug.v80.v10.ty.state())).guests > 0, 'the visited park comes alive with its own visitors');
    await B.page.click('#tyMenuB'); await B.page.waitForTimeout(400); await B.page.click('#pkTabs [data-pktab="share"]'); await B.page.waitForTimeout(500); await B.page.click('#pkB [data-x="rate:4"]'); await B.page.waitForTimeout(600);
    ok(db.ratings.length === 1 && db.ratings[0].stars === 4, 'the visitor rates the park ★★★★ and the cloud stores one vote');
    await B.page.screenshot({ path: SH + 'v10_park_visit_share_phone.png' });
    if (!await until(B.page, () => document.querySelectorAll('#pkB .tyLb tr').length === 1)) console.log('  share tab: ' + JSON.stringify(await XB(() => [window.__coasterDebug.v80.v10.ty.cloud(), document.querySelector('#pkB').textContent.slice(-600)])).slice(0, 1200)); ok(await XB(() => /Leaderboards/.test(document.querySelector('#pkB').textContent) && document.querySelectorAll('#pkB .tyLb tr').length === 1), 'the leaderboard lists the published park');
    await B.page.click('#pkB [data-x="home"]'); await B.page.waitForTimeout(900); ok(!(await XB(() => window.__coasterDebug.v80.v10.ty.visiting())) && (await XB(() => window.__coasterDebug.v80.v10.ty.state())).mode === 'career', '“Back to my park” returns to your own park');
    // park code (no cloud needed) and a damaged code
    const w2 = await XB(c => window.__coasterDebug.v80.v10.ty.visitCode(c), code); await B.page.waitForTimeout(800); ok(w2 === '' && (await XB(() => window.__coasterDebug.v80.v10.ty.state())).objs === nObj, 'the long park code opens the same park without the cloud');
    const w3 = await XB(c => window.__coasterDebug.v80.v10.ty.visitCode(c), code.slice(0, 120)); ok(/could not be read/.test(w3), 'a cut-off code is refused with a clear message');
    const w4 = await XB(() => window.__coasterDebug.v80.v10.ty.visitCode('CL10J' + btoa(JSON.stringify({ name: '<img src=x onerror=alert(1)>', objs: [{ k: 'evil', x: 1, z: 1 }, { k: 'tree', x: 9999, z: 5 }], paths: { '-5': 3, 99999: 1 }, money: 'lots', land: 'xyz' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''))); await B.page.waitForTimeout(600);
    const sx = await XB(() => window.__coasterDebug.v80.v10.ty.state()); ok(w4 === '' && sx.objs === 0 && !/[<>]/.test(sx.name), 'a hostile park code is cleaned: unknown things dropped, name stripped of markup (“' + sx.name + '”)');
    ok(B.errors.length === 0, 'no errors while visiting' + (B.errors.length ? ': ' + B.errors.slice(0, 3).join(' | ') : '')); await B.browser.close();
    // no connection: the cloud says so and codes still work; the cloud functions missing: it says that instead
    const C = await open(F, { w: 390, h: 844 }), XC = (f, a) => C.page.evaluate(f, a); await XC(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox')); await XC(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await C.page.waitForTimeout(700);
    const cc = await XC(() => window.__coasterDebug.v80.v10.ty.cloud()); ok(cc.st === 'off' && /cannot be reached/.test(cc.why), 'with no connection the Share tab says the cloud cannot be reached'); ok((await XC(c => window.__coasterDebug.v80.v10.ty.visitCode(c), code)) === '', '…and park codes still work offline'); await C.browser.close();
    const Dn = await open(F, { w: 390, h: 844, cloud: () => null }), XD = (f, a) => Dn.page.evaluate(f, a); await XD(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox')); await XD(() => window.__coasterDebug.v80.v10.ty.cloudCheck()); await Dn.page.waitForTimeout(700);
    const cd = await XD(() => window.__coasterDebug.v80.v10.ty.cloud()); ok(cd.st === 'missing' && /not switched on/.test(cd.why), 'if the database functions are not installed the Share tab says the cloud is not switched on yet'); await Dn.browser.close();
    // a link with #park=CODE opens that park
    const E = await open(F, { w: 390, h: 844, cloud, init: sock, hash: '#park=' + pub.code }); await E.page.waitForTimeout(2500); const ve = await E.page.evaluate(() => window.__coasterDebug.v80.v10.ty.visiting()); ok(ve && ve.code === pub.code, 'opening the game with #park=' + pub.code + ' goes straight to that park'); await E.browser.close();
  }
  // ---------- E. Owner Control Center → My Park 10.0: real numbers and testing controls
  if (ONLY.includes('E')) {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false }); const X = (f, a) => page.evaluate(f, a), S = () => X(() => window.__coasterDebug.v80.v10.ty.state()), O = (a, v) => X(([a, v]) => window.__coasterDebug.v80.v10.owner.act(a, v), [a, v]);
    await X(() => window.__coasterDebug.v80.v10.owner.open()); await page.waitForTimeout(400);
    ok(await X(() => !document.querySelector('#own7').hidden && !!document.querySelector('#own7 .ownT [data-tab="own10"].on') && /My Park is not open/.test(document.querySelector('#own7B').textContent)), 'the Owner Control Center has a “My Park 10.0” tab; with no park open it says so');
    await O('open', 'career'); await page.waitForTimeout(900); await X(() => window.__coasterDebug.v80.v10.ty.speed(0)); await X(L.place, ['carousel', 21, 41, 3]).then(b => X(L.connect, [b.id])); await X(() => window.__coasterDebug.v80.v10.owner.open()); await page.waitForTimeout(300);
    let s = await S(); const txt = () => X(() => document.querySelector('#own7B').textContent);
    ok(await X(() => !document.querySelector('#own7').hidden && document.body.classList.contains('ty10')), 'it opens on top of My Park');
    ok((await txt()).includes('$' + s.money.toLocaleString('en-US')) && /Things built1\b/.test(await txt()) && /Carousel/.test(await txt()), 'it shows the park’s real numbers (balance $' + s.money.toLocaleString('en-US') + ', 1 thing built, the Carousel in the ride table)');
    const m0 = s.money, inc0 = s.tot.inc; await O('cash', 10000); s = await S();
    ok(s.money === m0 + 10000 && s.led.inc.grant === 10000 && near(s.tot.inc, inc0 + 10000, .01), '+$10,000 raises the balance by exactly $10,000 and is booked as “Owner grant”');
    const g0 = s.guests, gate0 = s.led.inc.gate; await O('spawn', 10); s = await S(); ok(s.guests === g0 + 10 && near(s.led.inc.gate - gate0, 100, .01), '+10 visitors: ten real visitors walk in and each pays the $10 entrance fee');
    await O('time', 1290); await page.waitForTimeout(300); ok(Math.abs((await S()).min - 1290) <= 1, 'time can be set (21:30)'); await O('time', 720);
    await O('wx', 'fog'); ok((await S()).wx === 'fog', 'weather can be set (fog)'); await O('wx', 'sunny');
    await O('break'); ok((await X(() => window.__coasterDebug.v80.v10.ty.obj(1))).broken, 'a ride can be broken for testing'); await O('fix'); ok(!(await X(() => window.__coasterDebug.v80.v10.ty.obj(1))).broken, 'and repaired');
    const lv0 = (await S()).lv; await O('level'); ok((await S()).lv === lv0 + 1, '+1 park level (level ' + lv0 + ' → ' + (lv0 + 1) + ')');
    const ids = (await X(() => window.__coasterDebug.v80.v10.ty.guests())).map(g => g.id); await O('home'); await X(() => window.__coasterDebug.v80.v10.ty.speed(1)); await X(() => window.__coasterDebug.v80.v10.ty.ff(90)); const left = (await X(() => window.__coasterDebug.v80.v10.ty.guests())).filter(g => ids.includes(g.id)).length;
    ok(ids.length >= 10 && left === 0, 'Send everyone home: all ' + ids.length + ' visitors who were in the park walk out (new ones keep arriving while it is open)');
    s = await S(); ok(near(s.money, 25000 + s.tot.inc - s.tot.exp, 1.5), 'after all of that the books still add up: balance = $25,000 + everything in − everything out');
    await page.screenshot({ path: SH + 'v10_owner_tab.png' });
    ok(errors.length === 0, 'no errors in the Owner tab' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : '')); await browser.close();
  }
  // ---------- D. four screen sizes: nothing off screen, the main controls reachable
  for (const [w, h] of ONLY.includes('D') ? [[320, 568], [390, 844], [844, 390], [1200, 800]] : []) {
    const { browser, page, errors } = await open(F, { w, h, mobile: w < 1000, skipStart: false }); const X = (f, a) => page.evaluate(f, a);
    ok(await X(() => !!document.querySelector('#start [data-go="ty10"]') && document.querySelector('#start [data-go="ty10"]').getBoundingClientRect().width > 60), `${w}×${h}: the title screen has a My Park button`);
    await page.click('#start [data-go="ty10"]'); await page.waitForTimeout(1200);
    const inView = sel => X(([sel, w, h]) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null).every(e => { const r = e.getBoundingClientRect(); return r.left >= -1 && r.top >= -1 && r.right <= w + 1 && r.bottom <= h + 1 && r.width >= 28 && r.height >= 28 }), [sel, w, h]);
    ok(await inView('#tyBar .tyB') && await inView('#tyTop .tyStat, #tyTop .tySpd button, #tyMenuB') && await inView('#tySide .tyB'), `${w}×${h}: build bar, top bar and side buttons are on screen and big enough to tap`);
    await page.click('#tyBar [data-v="coaster"]'); await page.waitForTimeout(700); ok(await X(([w, h]) => { const r = document.querySelector('#tyTray').getBoundingClientRect(); return r.left >= 0 && r.right <= w && r.bottom <= h && r.top >= 0 && document.querySelectorAll('#tyTray .tyIt').length >= 26 }, [w, h]), `${w}×${h}: the coaster tray fits and lists every coaster`);
    await page.click('#tyBar [data-v="flat"]'); await page.waitForTimeout(300); await page.click('#tyTray [data-v="carousel"]'); await page.waitForTimeout(400);
    ok(await X(([w, h]) => { const r = document.querySelector('#tyPlace').getBoundingClientRect(); return !document.querySelector('#tyPlace').hidden && r.left >= 0 && r.right <= w && r.bottom <= h }, [w, h]), `${w}×${h}: the placement bar (turn / build / cancel) fits`);
    await X(() => window.__coasterDebug.v80.v10.ty.act('cat', '')); await X(() => { const T = window.__coasterDebug.v80.v10.ty; const b = T.build('carousel', 20, 40, 0); T.sel(b.id) }); await page.waitForTimeout(400);
    ok(await X(([w, h]) => { const r = document.querySelector('#tyCard').getBoundingClientRect(); return !document.querySelector('#tyCard').hidden && r.left >= 0 && r.right <= w + 1 && r.bottom <= h + 1 && r.top >= 0 }, [w, h]), `${w}×${h}: the ride card fits on screen`);
    await page.click('#tyMenuB'); await page.waitForTimeout(400); let over = [];
    for (const t of await X(() => [...document.querySelectorAll('#pkTabs [data-pktab]')].map(b => b.dataset.pktab))) { await X(t => document.querySelector('#pkTabs [data-pktab="' + t + '"]').click(), t); await page.waitForTimeout(150); if (await X(w => [...document.querySelectorAll('#pkB *')].some(e => e.offsetParent !== null && e.getBoundingClientRect().right > w + 2), w)) over.push(t) }
    ok(over.length === 0 && await X(() => document.documentElement.scrollWidth <= innerWidth + 1), `${w}×${h}: all ten Office tabs fit the width` + (over.length ? ' (too wide: ' + over.join(', ') + ')' : ''));
    await page.screenshot({ path: SH + `v10_size_${w}x${h}.png` });
    ok(errors.filter(e => !/ERR_FAILED/.test(e)).length === 0, `${w}×${h}: no errors` + (errors.filter(e => !/ERR_FAILED/.test(e)).length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
  console.log(fails ? fails + ' check(s) failed' : 'all checks passed');
})();
