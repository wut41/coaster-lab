// Coaster Lab 10.0 — 🎯 Ride challenges: medals and rewards, no double rewards, Earth-physics rule (and the Warp Speed
// exception), your-own-coaster and Disaster Mode rules, milestones (badges, Champion skin, titles), saving and cleaning,
// real laps (built-in ride, Disaster Mode, Track Builder playtest), the Goals tab and lap card, and proof that every
// 🥇 Gold medal can really be won in this game.
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const MPH = 0.44704, R = 'window.__coasterDebug.v80.v10.rch';
// a Track Builder coaster: launch, one loop, a turn home. Measured: 63 mph, 1 inversion, $10,600 (crit 0)
const BUDGET_EL = [['station', { len: 14, brake: 12, sx: -30, sz: 20, dir0: 0, ret: 0.6 }], ['launch', { len: 30, v: 29 }], ['loop', { r: 10, dir: 'L' }], ['turn', { dir: 'R', ang: 180, r: 16, bank: 'auto', climb: 0, e: 0.6 }]];
async function lapUntilCard(page, max = 140) {
  for (let i = 0; i < max; i++) { await page.evaluate(() => window.__coasterDebug.v72.ff(1)); await page.waitForTimeout(40); if (await page.evaluate(() => !document.querySelector('#sum7').hidden)) return true }
  return false;
}
(async () => {
  // ---------- A. rules and rewards (synthetic laps through the same code path as real laps)
  let saved = null;
  {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
    const X = (f, a) => page.evaluate(f, a), L = o => X(o => window.__coasterDebug.v80.v10.rch.lap(o), o), P = () => X(() => window.__coasterDebug.v72.prog()), T = () => X(() => window.__coasterDebug.v80.v10.rch.state());
    ok(errors.length === 0, 'game boots with ride challenges and no console errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''));
    const list = await X(() => window.__coasterDebug.v80.v10.rch.list());
    ok(list.length === 12 && list.every(c => c.x.length === 3 && c.tier === 0 && c.best === null), '12 ride challenges, 3 medals each, all locked on a new save: ' + list.map(c => c.n).join(', '));
    ok(list.every(c => c.lo ? c.x[0] > c.x[1] && c.x[1] > c.x[2] : c.x[0] < c.x[1] && c.x[1] < c.x[2]), 'every challenge gets harder from 🥉 to 🥈 to 🥇');
    const rw = await X(() => window.__coasterDebug.v80.v10.rch.rewards());
    ok(JSON.stringify(rw.tiers) === JSON.stringify([['b', 80, 50], ['s', 160, 120], ['g', 320, 250]]), 'medal rewards: 🥉 80 XP + 50 coins, 🥈 160 + 120, 🥇 320 + 250');
    ok(rw.skin && !rw.skinOpen && /5 🥇 Gold/.test(rw.lockText), 'the 🏆 Champion train skin exists and is locked: “' + rw.lockText + '”');
    // one lap can win several medals at once, paid exactly once
    let p0 = await P(); let r = await L({ vmax: 85 * MPH });
    let p1 = await P();
    ok(JSON.stringify(r.got) === JSON.stringify(['speed:b', 'speed:s', 'speed:g']), '85 mph wins Speed Demon 🥉🥈🥇 in one lap: ' + r.got.join(' '));
    ok(p1.coins - p0.coins === 420 && p1.xp - p0.xp === 560, `the three medals pay 560 XP and 🪙 420 (got ${p1.xp - p0.xp} XP, 🪙 ${p1.coins - p0.coins})`);
    r = await L({ vmax: 88 * MPH }); const p2 = await P();
    ok(r.got.length === 0 && p2.coins === p1.coins && p2.xp === p1.xp, 'the same medals are never paid twice');
    ok((await T()).best.speed > 87 * MPH && (await T()).on.speed === 'Test lap', 'the best top speed and the ride it came from are remembered');
    // Earth physics rule, and the Warp Speed exception
    r = await L({ vmax: 115 * MPH, inv: 7, air: 6, std: false });
    ok(JSON.stringify(r.got) === JSON.stringify(['warp:b', 'warp:s', 'warp:g']), 'with Lab physics only 🚀 Warp Speed counts (115 mph: ' + r.got.join(' ') + '); 7 inversions and 6 s airtime do not');
    ok((await T()).t.loops == null && (await T()).t.air == null, 'Loop Survivor and Airtime Addict stay locked after the Lab-physics lap');
    r = await L({ vmax: 70 * MPH, std: true }); ok(!r.got.some(g => /^warp/.test(g)) && r.near !== 'warp', 'an Earth lap never hints at Warp Speed (it needs another planet)');
    // your own coaster
    r = await L({ vmax: 63 * MPH, inv: 1, custom: false, cost: 10600 });
    ok(!r.got.some(g => /engineer|budget/.test(g)), 'Garage Engineer and Budget Builder ignore built-in rides');
    r = await L({ vmax: 63 * MPH, inv: 0, custom: true, cost: 10600 });
    ok(r.got.join(' ') === 'engineer:b engineer:s engineer:g', 'your own 63 mph coaster wins Garage Engineer 🥉🥈🥇; Budget Builder needs an inversion: ' + r.got.join(' '));
    r = await L({ vmax: 63 * MPH, inv: 1, custom: true, cost: 22000, len: 100 });
    ok(r.got.join(' ') === '' && r.near === 'budget', 'a $22,000 coaster is over every budget, and the lap card says how close it was');
    r = await L({ vmax: 63 * MPH, inv: 1, custom: true, cost: 14000 }); ok(r.got.join(' ') === 'budget:b budget:s', '$14,000 wins Budget Builder 🥉🥈');
    r = await L({ vmax: 63 * MPH, inv: 1, custom: true, cost: 10600 }); ok(r.got.join(' ') === 'budget:g', '$10,600 wins the 🥇');
    // Disaster Mode
    r = await L({ inv: 5, dz: false }); ok(!r.got.some(g => /daredevil/.test(g)) && r.got.join(' ') === 'loops:b loops:s', '5 inversions with safety on: Loop Survivor 🥉🥈, no Daredevil');
    r = await L({ inv: 5, dz: true }); ok(r.got.join(' ') === 'daredevil:b daredevil:s daredevil:g', '5 inversions in 💥 Disaster Mode: Daredevil 🥉🥈🥇');
    // smaller-is-better: lowest G
    r = await L({ gmin: -0.7 }); ok(r.got.join(' ') === 'eject:b', '−0.7 G lifts you out of your seat for the 🥉 Ejector Seat only');
    // milestones: 5 golds (speed, warp, engineer, budget, daredevil)
    const st = await T(); ok(st.sum.golds === 5 && st.sum.tiers === 18, `medal count: ${st.sum.tiers} / 36, ${st.sum.golds} gold`);
    const rw2 = await X(() => window.__coasterDebug.v80.v10.rch.rewards());
    ok(st.mile.tiers5 && st.mile.gold5 && !st.mile.allGold, 'milestones: 🎯 Challenger and 🏆 Champion reached, 👑 Ride Royalty not yet');
    ok(rw2.skinOpen && rw2.badges.includes('rch10:tiers5') && rw2.badges.includes('rch10:gold5') && !rw2.badges.includes('rch10:allGold'), 'Champion skin unlocked and the two milestone badges are in ⭐ Level & rewards');
    ok(rw2.titles.includes('challenger') && !rw2.titles.includes('royalty'), 'the Challenger title (10 medals) is unlocked, Ride Royalty is not');
    // saving
    saved = await X(() => window.__coasterDebug.v80.v10.rch.saved());
    ok(saved && saved.t.speed === 3 && saved.t.budget === 3 && saved.t.eject === 1 && saved.laps === (await T()).laps, 'progress is saved under coasterlab.v10.rch');
    // the Goals tab
    await page.click('#parkBtn'); await page.waitForTimeout(400);
    ok(await X(() => !!document.querySelector('[data-hub="rch10"]') && /18 \/ 36 medals/.test(document.querySelector('[data-hub="rch10"]').textContent)), 'Park & tools has a 🎯 Ride challenges tile with the medal count');
    await page.click('[data-hub="rch10"]'); await page.waitForTimeout(500);
    const tab = await X(() => ({ open: !document.querySelector('#ov7').hidden, title: document.querySelector('#ov7T').textContent, cards: document.querySelectorAll('#ov7B .rch10c').length, gold: document.querySelectorAll('#ov7B .rch10c.gold').length, tabs: [...document.querySelectorAll('#ov7B .ovT72 button')].map(b => b.textContent), on: (document.querySelector('#ov7B .ovT72 button.on') || {}).textContent, mile: document.querySelectorAll('#ov7B .rch10M .on').length }));
    ok(tab.open && tab.title === '🎯 Ride challenges' && tab.cards === 12 && tab.gold === 5 && tab.mile === 2, `the tab shows 12 cards (5 gold) and 2 of 3 milestones: ${JSON.stringify(tab)}`);
    ok(tab.tabs.join('|') === '🏆 Goals|📅 Challenges|⭐ Level & rewards|🎯 Ride challenges' && tab.on === '🎯 Ride challenges', 'it is the fourth tab in the Goals window, next to Goals, Challenges and Level & rewards');
    await page.click('#ov7B .ovT72 button:nth-child(3)'); await page.waitForTimeout(300);
    ok(await X(() => document.querySelector('#ov7T').textContent === '⭐ Level & rewards' && /Ride challenges/.test(document.querySelector('#ov7B .ovT72').textContent)), 'switching to ⭐ Level & rewards still works, and its tab bar has the new tab too');
    await page.click('#ov7B .ovT72 button:nth-child(4)'); await page.waitForTimeout(300);
    ok(await X(() => document.querySelectorAll('#ov7B .rch10c').length === 12), 'and back to 🎯 Ride challenges');
    await page.screenshot({ path: SH + 't11_rch_tab_desktop.png' });
    ok(errors.length === 0, 'section A console errors: ' + errors.length + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
  // ---------- B. saved progress survives a reload, and broken saves are cleaned
  {
    const { browser, page, errors } = await open(F, { w: 390, h: 844, storage: { 'coasterlab.v10.rch': JSON.stringify(saved) } });
    const st = await page.evaluate(() => window.__coasterDebug.v80.v10.rch.state());
    ok(st.t.speed === 3 && st.t.eject === 1 && st.sum.tiers === 18 && st.mile.gold5, 'after a reload the medals and milestones are all still there');
    await browser.close();
    const junk = JSON.stringify({ t: { speed: 99, nope: 2, air: 'x' }, best: { speed: 'fast', air: 2.5 }, on: { air: 42 }, when: { speed: 'x' }, laps: -5, mile: { gold5: 'yes' } });
    const b = await open(F, { w: 390, h: 844, storage: { 'coasterlab.v10.rch': junk } });
    const j = await b.page.evaluate(() => window.__coasterDebug.v80.v10.rch.state());
    ok(j.t.speed === 3 && !('nope' in j.t) && !('air' in j.t) && j.best.air === 2.5 && !('speed' in j.best) && !('air' in j.on) && j.laps === 0 && !j.mile.gold5, 'a broken save is cleaned (values clamped, unknown keys and wrong types dropped)');
    const b2 = await open(F, { w: 390, h: 844, storage: { 'coasterlab.v10.rch': '{not json' } });
    ok((await b2.page.evaluate(() => window.__coasterDebug.v80.v10.rch.state())).sum.tiers === 0 && b2.errors.length === 0, 'an unreadable save starts fresh without errors');
    ok(errors.length === 0 && b.errors.length === 0, 'section B console errors: ' + (errors.length + b.errors.length));
    await b.browser.close(); await b2.browser.close();
  }
  // ---------- C. real laps: a built-in ride, Disaster Mode, your own coaster from the Track Builder, the lap card
  {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 });
    const X = (f, a) => page.evaluate(f, a);
    await X(() => window.__coasterDebug.select(0)); await page.waitForTimeout(3300);
    const c0 = (await X(() => window.__coasterDebug.v72.prog())).coins;
    ok(await lapUntilCard(page), 'a real lap on Looping Adventure finishes');
    const last = await X(() => window.__coasterDebug.v80.v10.rch.last());
    ok(last && last.std && last.F.len > 100 && last.F.h > 10 && last.F.gmin < 0 && last.F.cost > 0, `the lap's facts include track length, height, lowest G and price: ${last && JSON.stringify({ len: Math.round(last.F.len), h: Math.round(last.F.h), gmin: +last.F.gmin.toFixed(2), cost: last.F.cost })}`);
    ok(last.got.includes('gforce:g') && last.got.includes('eject:s'), 'Looping Adventure wins 🥇 G-Force Hero and 🥈 Ejector Seat: ' + last.got.join(' '));
    const card = await X(() => { const e = document.querySelector('#sum7 .rch10L'); return e ? e.textContent : '' });
    ok(/G-Force Hero Gold!/.test(card) && /Ride challenges/.test(card), 'the lap card lists the medals: “' + card.slice(0, 160) + '…”');
    ok((await X(() => window.__coasterDebug.v72.prog())).coins > c0, 'the coins arrive in the 🪙 wallet');
    const fit = await X(() => { const e = document.querySelector('#sum7'), r = e.getBoundingClientRect(), b = e.querySelector('.rch10L').getBoundingClientRect(); return { ok: b.right <= r.right + 1 && b.left >= r.left - 1 && r.right <= innerWidth + 1 && r.left >= -1 && document.documentElement.scrollWidth <= innerWidth, card: [r.left, r.right, r.top, r.bottom].map(Math.round), box: [b.left, b.right].map(Math.round), sw: document.documentElement.scrollWidth, w: innerWidth } });
    ok(fit.ok, 'the lap card still fits a 390 px phone screen ' + JSON.stringify(fit)); await page.screenshot({ path: SH + 't11_rch_lapcard_phone.png' });
    await X(() => document.querySelector('#sum7 [data-rch10="open"]').click()); await page.waitForTimeout(400);
    ok(await X(() => !document.querySelector('#ov7').hidden && document.querySelectorAll('#ov7B .rch10c').length === 12 && document.querySelector('#sum7').hidden), 'the lap card button opens 🎯 Ride challenges');
    ok(await X(() => document.documentElement.scrollWidth <= innerWidth), 'the Ride challenges tab has no sideways scrolling on a phone');
    await page.screenshot({ path: SH + 't11_rch_tab_phone.png' });
    await X(() => document.querySelector('#ov7Close') ? document.querySelector('#ov7Close').click() : (document.querySelector('#ov7').hidden = true));
    // Disaster Mode: The Void (5 inversions) makes it round with the safety systems off
    const vi = await X(() => window.__coasterDebug.rides.indexOf('The Void'));
    await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="dz86"]'); await page.waitForTimeout(400); await page.click('[data-dz86="on"]'); await page.waitForTimeout(300);
    await X(() => { const o = document.querySelector('#ov7'); if (o) o.hidden = true; const h = document.querySelector('#hub72'); if (h) h.hidden = true });
    await X(i => window.__coasterDebug.select(i), vi); await page.waitForTimeout(3300);
    ok(await lapUntilCard(page, 200), 'a real lap on The Void finishes in 💥 Disaster Mode');
    const dz = await X(() => window.__coasterDebug.v80.v10.rch.last());
    ok(dz && dz.F.dz && dz.got.includes('daredevil:g'), 'The Void in Disaster Mode wins 🥇 Daredevil: ' + (dz && dz.got.join(' ')));
    await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="dz86"]'); await page.waitForTimeout(400); await page.click('[data-dz86="on"]'); await page.waitForTimeout(300);
    ok(!(await X(() => window.__coasterDebug.v80.v86.dz())).on, 'Disaster Mode switched back off');
    await X(() => { const o = document.querySelector('#ov7'); if (o) o.hidden = true; const h = document.querySelector('#hub72'); if (h) h.hidden = true });
    // your own coaster: playtest the budget design in the Track Builder
    await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1200);
    await X(els => window.__coasterDebug.v80.v90.load(els), BUDGET_EL); await page.waitForTimeout(600);
    await X(() => window.__coasterDebug.v80.bld.play()); await page.waitForTimeout(3300);
    const ownLap = await lapUntilCard(page, 120), own = await X(() => window.__coasterDebug.v80.v10.rch.last());
    ok(ownLap && own && own.F.custom, 'a playtest lap on your own coaster counts as your own coaster');
    ok(own && own.got.includes('engineer:g') && own.got.includes('budget:g'), `the launched loop (${own && Math.round(own.F.vmax / MPH)} mph, ${own && own.F.inv} inversion, $${own && own.F.cost}) wins 🥇 Garage Engineer and 🥇 Budget Builder: ` + (own && own.got.join(' ')));
    ok(errors.length === 0, 'section C console errors: ' + errors.length + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
  // ---------- D. every 🥇 Gold can be won in this game
  {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
    const X = (f, a) => page.evaluate(f, a);
    const list = await X(() => window.__coasterDebug.v80.v10.rch.list()), G = k => list.find(c => c.k === k).x[2];
    const facts = async name => { const i = await X(n => window.__coasterDebug.rides.indexOf(n), name); await X(i => window.__coasterDebug.select(i), i); await page.waitForTimeout(200); return X(() => window.__coasterDebug.v80.v10.rch.facts()) };
    const proofs = [['speed', 'Thunder Comet', f => f.vmax, 'mph'], ['loops', 'Hydra', f => f.inv, ''], ['air', 'Timberwolf', f => f.air, 's'], ['gforce', 'Looping Adventure', f => f.gmax, 'G'], ['eject', 'Skyfall', f => f.gmin, 'G'], ['long', 'Nebula', f => f.len, 'm'], ['sky', 'Titan', f => f.h, 'm'], ['endure', 'Nova Giant', f => f.time, 's']];
    for (const [k, ride, v, u] of proofs) {
      const f = await facts(ride), val = v(f), x = G(k), c = list.find(q => q.k === k), pass = c.lo ? val <= x : val >= x;
      const show = n => u === 'mph' ? Math.round(n / MPH) + ' mph' : (+n).toFixed(1) + (u ? ' ' + u : '');
      ok(pass && f.std, `🥇 ${c.n} is reachable: ${ride} gives ${show(val)} (needs ${show(x)})`);
    }
    await X(() => window.__coasterDebug.v80.v86.setGrav('jupiter')); const fj = await facts('Titan');
    ok(fj.vmax >= G('warp') && !fj.std, `🥇 Warp Speed is reachable: Titan on Jupiter hits ${Math.round(fj.vmax / MPH)} mph (needs ${Math.round(G('warp') / MPH)})`);
    await X(() => window.__coasterDebug.v80.v86.setGrav('earth'));
    const m = await X(e => window.__coasterDebug.v80.v10.measure(e, 'Budget', false), BUDGET_EL), cost = await X(([a, b, c]) => window.__coasterDebug.v80.v10.rch.cost(a, b, c), [m.len, m.h, m.inv]);
    ok(m.crit === 0 && !m.stall && m.vmax >= G('engineer') && m.inv >= 1 && cost <= G('budget'), `🥇 Garage Engineer and 🥇 Budget Builder are reachable in the Track Builder: the launched loop passes the check (0 must-fix), ${Math.round(m.vmax / MPH)} mph, ${m.inv} inversion, $${cost}`);
    const pk = await X(() => window.__coasterDebug.v80.v10.ty.coasters());
    const same = [];
    for (const c of pk.slice(0, 6)) { const r2 = await X(([L_, h, inv]) => window.__coasterDebug.v80.v10.rch.cost(L_, h, inv), [c.L / c.sc, c.H / c.sc, (await facts(c.name) || {}).inv || 0]); same.push([c.name, c.cost, r2]) }
    ok(same.every(([, a, b]) => Math.abs(a - b) <= 200), 'Budget Builder prices match the My Park build price for the same coaster: ' + same.map(s => s[0] + ' ' + s[1] + '/' + s[2]).join(', '));
    ok(errors.length === 0, 'section D console errors: ' + errors.length + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
  console.log(fails ? `\n${fails} check(s) failed` : '\nall ride challenge checks passed');
})().catch(e => { console.log('FAIL suite crashed: ' + (e.stack || e).toString().slice(0, 600)); process.exit(1) });
