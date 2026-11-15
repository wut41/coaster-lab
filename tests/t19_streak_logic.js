// Daily streak rules (src/v10/post/20_streak.js, the <core> part) checked in plain node: no browser needed.
// Days in a row, the one-day freeze, a broken streak, the clock going backwards, daylight saving, the reward ladder,
// the week bonus, the day-5 mystery item, the day-7 Inferno skin, and cleaning a damaged save.
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'v10', 'post', '20_streak.js'), 'utf8');
const a = src.indexOf('// <core>'), b = src.indexOf('// </core>');
const C = vm.runInNewContext(src.slice(a, b) + '\nSTKC10', {});
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++ };
const none = () => false;

// a player claiming on the given days, in order; returns the state and every result
function play(days, owned = none, st = C.clean(null)) { const out = []; for (const d of days) { const r = C.claim(st, d, owned); out.push(r); if (r) st = r.st } return { st, out } }

// 1. new player
{ const st = C.clean(null), s = C.status(st, '2026-11-14');
  ok(s.fresh && !s.claimed && s.n === 1 && s.live === 0, 'a new player has day 1 waiting and a streak of 0');
  ok(st.frz === 1 && st.auto === true, 'a new player starts with one streak freeze and the popup on') }
// 2. one claim per day
{ const { st, out } = play(['2026-11-14', '2026-11-14']);
  ok(out[0] && out[0].r.day === 1 && out[0].r.coins === 30 && out[0].r.xp === 50, 'day 1 pays 🪙30 + 50 XP');
  ok(out[1] === null && st.n === 1 && st.total === 1, 'a second claim the same day gives nothing');
  ok(C.status(st, '2026-11-14').claimed, 'and today then shows as claimed') }
// 3. seven days in a row: the ladder grows, day 7 gives the Inferno skin and refills the freeze
{ const days = ['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'];
  const { st, out } = play(days);
  const coins = out.map(o => o.r.coins);
  ok(JSON.stringify(coins.slice(0, 4)) === '[30,40,60,80]' && coins[5] === 120, 'week 1 coins grow day by day (' + coins + ')');
  ok(coins.every((c, i) => i === 0 || c > coins[i - 1] || out[i].r.item), 'every day pays more than the day before');
  ok(out[4].r.item && C.BOX.includes(out[4].r.item), 'day 5 has a mystery cosmetic (' + out[4].r.item + ')');
  ok(out[6].r.big && out[6].r.item === 'skin:inferno' && out[6].r.freeze, 'day 7 is the big one: the Inferno train skin + a freeze');
  ok(st.n === 7 && st.best === 7 && st.total === 7, 'streak 7, best 7') }
// 4. week 2: the week bonus, and day 7 gives another item once Inferno is owned
{ const days = []; for (let i = 0; i < 14; i++) days.push(C.dayKey(new Date(2026, 10, 1 + i)));
  const own = new Set(); const owned = id => own.has(id);
  let st = C.clean(null), res = [];
  for (const d of days) { const r = C.claim(st, d, owned); res.push(r); st = r.st; if (r.r.item) own.add(r.r.item) }
  ok(res[7].r.day === 1 && res[7].r.mult > 1.09 && res[7].r.coins === 35, 'week 2 day 1 has a +10% bonus (🪙' + res[7].r.coins + ')');
  ok(res[13].r.item && res[13].r.item !== 'skin:inferno' && C.BIG.includes(res[13].r.item), 'week 2 day 7 gives another cosmetic (' + res[13].r.item + ')');
  ok(C.mult(7 * 20 + 1) === 1.5, 'the week bonus stops at +50%') }
// 5. everything owned: coins instead of items
{ const all = () => true;
  const r5 = C.reward(5, all, 1), r7 = C.reward(7, all, 1);
  ok(!r5.item && r5.coins === 160, 'day 5 with nothing left to win pays extra coins instead (🪙' + r5.coins + ')');
  ok(!r7.item && r7.coins === 400 && r7.freeze, 'day 7 with nothing left to win pays extra coins and still a freeze') }
// 6. missing one day: the freeze saves the streak, once
{ let { st } = play(['2026-11-14', '2026-11-15', '2026-11-16']);
  const s = C.status(st, '2026-11-18');
  ok(!s.claimed && s.freeze && s.n === 4 && !s.lost, 'one missed day: the freeze keeps the streak going (day 4 waits)');
  let r = C.claim(st, '2026-11-18', none); st = r.st;
  ok(st.n === 4 && st.frz === 0 && st.saves === 1, 'claiming uses the freeze up');
  const s2 = C.status(st, '2026-11-20');
  ok(!s2.freeze && s2.n === 1 && s2.lost === 4 && s2.missed === 1, 'another missed day without a freeze: the streak starts over (lost 4)');
  r = C.claim(st, '2026-11-20', none);
  ok(r.st.n === 1 && r.st.best === 4, 'the new streak is 1, best stays 4') }
// 7. missing two days is too many even with a freeze
{ const { st } = play(['2026-11-14', '2026-11-15']); const s = C.status(st, '2026-11-18');
  ok(!s.freeze && s.n === 1 && s.lost === 2 && s.missed === 2, 'two missed days: the freeze can\'t save it') }
// 8. the clock going backwards never resets the streak or pays twice
{ const { st } = play(['2026-11-14', '2026-11-15', '2026-11-16']); const s = C.status(st, '2026-11-10');
  ok(s.claimed && s.live === 3, 'a clock set back counts as already claimed and keeps the streak');
  ok(C.claim(st, '2026-11-10', none) === null, 'and pays nothing') }
// 9. daylight saving and month/year edges are still one day apart
ok(C.gap('2026-03-07', '2026-03-08') === 1 && C.gap('2026-10-31', '2026-11-01') === 1 && C.gap('2026-12-31', '2027-01-01') === 1 && C.gap('2028-02-28', '2028-02-29') === 1, 'day gaps across DST, months, years and Feb 29 are 1');
{ const d = new Date(2026, 10, 1, 23, 59); ok(C.dayKey(d) === '2026-11-01', 'the day key uses the local date (' + C.dayKey(d) + ')') }
// 10. damaged or hand-edited saves
{ const c = C.clean({ last: 'yesterday', n: 99, best: -5, frz: 7, auto: 'no', log: ['x', '2026-11-01'] });
  ok(c.last === null && c.n === 0 && c.frz === 1 && c.auto === true && c.log.length === 1, 'a broken save is cleaned (no day → streak 0, freeze capped at 1)');
  const c2 = C.clean({ last: '2026-11-13', n: 12, best: 3, total: 2, auto: false });
  ok(c2.best === 12 && c2.total === 12 && c2.auto === false, 'best and total are never below the streak; the popup switch is kept');
  ok(C.clean('junk').n === 0 && C.clean([1, 2]).n === 0, 'junk saves start fresh') }
// 11. the same day always rolls the same mystery item (reloading can't re-roll it)
{ const h = C.hash('2026-11-18'); ok(C.reward(5, none, h).item === C.reward(5, none, h).item, 'the day-5 item is fixed for a given day') }

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
