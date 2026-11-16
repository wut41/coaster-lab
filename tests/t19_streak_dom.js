// Daily streak popup, HUD chip and title-screen card, run against a small stand-in of the game page in jsdom (no WebGL,
// no layout): opening by itself, claiming, rewards reaching the 7.2 progress system, the Inferno skin, titles, the freeze,
// the "show this when I open the game" switch, and staying out of the way of the trailer and a first visit's title screen.
// The real page (layout, phone sizes, animation) is checked in a browser by t19_streak.js.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'v10', 'post', '20_streak.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++ };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function page({ storage = {}, startOpen = false, trailer = false } = {}) {
  const dom = new JSDOM(`<!doctype html><body><div class="top"><div class="panel brand" id="brandBtn" role="button"><span class="brandT"><b>Coaster Lab</b></span></div></div>
    <div id="start" ${startOpen ? '' : 'hidden'}><div class="stCtas"><button class="cta go" data-go="ride"><b>Ride now</b></button><button class="cta" data-go="rides"><b>All rides</b></button></div></div>
    <div id="ov7" hidden></div><div id="sec7" hidden></div><div id="pw7" hidden></div><div id="own7" hidden></div>${trailer ? '<div id="trailer10"></div>' : ''}</body>`,
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://coaster.test/' });
  const w = dom.window;
  for (const k in storage) w.localStorage.setItem(k, storage[k]);
  w.matchMedia = () => ({ matches: false });
  const log = { award: [], sfx: [], pops: [], home: 0 };
  w.document.getElementById('brandBtn').addEventListener('click', () => log.home++);
  w.__log = log;
  w.eval(`
    window.__coasterTestHarness = true; window.__booted = true;
    var startOpen = ${startOpen ? 'true' : 'false'};
    const PROG72 = { xp: 0, coins: 0, unlock: {} };
    const SHOP72 = [['skin:neon','🌈','Neon train skin'],['pal:pastel','🎨','Pastel colour scheme'],['pal:sunset','🌅','Sunset colour scheme'],['fx:sparkle','✨','Sparkle trail effect'],['deco:balloons','🎈','Balloon arch (park)'],['deco:topiary','🌳','Topiary animals (park)'],['fx:rainbow','🌈','Rainbow under-glow']];
    const SKIN72 = { classic: { n: 'Classic Steel', lock: null } };
    const LOCKS72 = { 'skin:neon': { lvl: 3, coins: 300 } };
    function lockText72(id) { return 'Unlock: buy it' }
    const TITLES72 = { rookie: { n: 'Rookie Rider', ok: () => true } };
    function award72(xp, coins, why) { PROG72.xp += xp; PROG72.coins += coins; __log.award.push([xp, coins, why]) }
    function saveProg72() {}
    function sfx(n) { __log.sfx.push(n) }
    function pop7(t) { __log.pops.push(t) }
    function esc(s) { return String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';') }
    var fxOn = false;
    window.__g = () => ({ PROG72, SKIN72, LOCKS72, TITLES72, lockText72 });
    window.__setStart = v => { startOpen = v; document.getElementById('start').hidden = !v };
  ` + SRC);
  return { dom, w, d: w.document, log, S: w.__streak10 };
}

(async () => {
  // 1. a returning player (has a streak from yesterday) gets the popup by itself, shortly after opening
  {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const pad = n => (n < 10 ? '0' : '') + n, yk = y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate());
    const { w, d, log, S } = page({ storage: { 'coasterlab.v10.streak': JSON.stringify({ last: yk, n: 3, best: 3, total: 3, frz: 1 }) } });
    await sleep(2400);
    ok(S.isOpen(), 'a returning player gets the daily reward popup by itself');
    const o = d.getElementById('stk10');
    ok(o && o.getAttribute('role') === 'dialog' && o.getAttribute('aria-modal') === 'true', 'it is a modal dialog');
    ok(d.getElementById('stk10T').textContent === 'Day 4 is ready!', 'title: "' + d.getElementById('stk10T').textContent + '"');
    ok(o.querySelector('.stk10N').textContent === '3', 'the flame shows the current streak (3)');
    const tiles = [...o.querySelectorAll('.stk10Row li')];
    ok(tiles.length === 7 && tiles.filter(t => t.classList.contains('done')).length === 3 && tiles[3].classList.contains('today') && tiles[6].classList.contains('big'), 'seven tiles: 3 done, day 4 glowing, day 7 big');
    const go = o.querySelector('.stk10Go');
    ok(/Claim 🪙 80 \+ 100 XP/.test(go.textContent), 'the button says what you get: "' + go.textContent + '"');
    ok(log.sfx.includes('chime'), 'it opens with a chime');
    go.click(); await sleep(50);
    const st = S.load();
    ok(st.n === 4 && st.total === 4 && st.best === 4, 'claiming makes the streak 4');
    ok(log.award.length === 1 && log.award[0][0] === 100 && log.award[0][1] === 80 && log.award[0][2] === 'Daily streak', 'coins and XP go through award72 (' + JSON.stringify(log.award) + ')');
    ok(log.sfx.includes('coin') && log.pops.some(p => /4-day streak/.test(p)), 'coin sound and a "4-day streak!" pop');
    ok(go.disabled && /Claimed today/.test(go.textContent), 'the button turns into "Claimed today"');
    ok(!o.querySelector('.stk10Got').hidden && /\+🪙 80/.test(o.querySelector('.stk10Got').textContent), 'the reward is shown under the tiles');
    ok(o.classList.contains('claimed') && o.querySelectorAll('.stk10Fly i').length > 0, 'the flame bursts and coins fly');
    go.click(); await sleep(20);
    ok(log.award.length === 1, 'tapping again pays nothing more');
    const chip = d.getElementById('stk10chip');
    ok(chip && chip.textContent.includes('4') && !chip.classList.contains('ready'), 'the HUD chip shows 🔥 4 without the red dot');
    w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' })); await sleep(400);
    ok(!S.isOpen() && !d.getElementById('stk10'), 'Escape closes it');
    chip.click(); await sleep(30);
    ok(S.isOpen() && log.home === 0, 'the chip opens it again without going Home');
    d.querySelector('.stk10X').click(); await sleep(400);
    ok(!S.isOpen(), 'the ✕ closes it');
    await sleep(1200); ok(!S.isOpen(), 'it does not pop up again in the same visit');
  }
  // 2. a first visit: nothing over the trailer or the title screen; after both are gone, a few seconds later, day 1
  {
    const { w, d, S } = page({ startOpen: true, trailer: true });
    await sleep(1500);
    ok(!S.isOpen(), 'first visit: no popup while the trailer plays');
    d.getElementById('trailer10').remove(); await sleep(1500);
    ok(!S.isOpen(), 'first visit: no popup over the title screen');
    const card = d.querySelector('#start [data-stk10]');
    ok(card && card.previousElementSibling && card.previousElementSibling.matches('.cta.go') && /Daily reward ready/.test(card.textContent), 'the title screen has a "Daily reward ready" card right after Ride now');
    w.__setStart(false); await sleep(3000);
    ok(!S.isOpen(), 'and not straight away after the title screen');
    await sleep(4600);
    ok(S.isOpen() && d.getElementById('stk10T').textContent === 'Your first daily reward', 'a few seconds into the game: "Your first daily reward"');
    S.close(); await sleep(350);
  }
  // 3. the whole first week, with the clock moved one day at a time
  {
    const { d, S, w } = page({ storage: { 'coasterlab.v10.streak': '{"auto":false}' } });
    await sleep(1600);
    ok(!S.isOpen(), 'with the switch off it never pops up by itself');
    const chip = d.getElementById('stk10chip');
    ok(chip && chip.classList.contains('ready') && chip.classList.contains('cold'), 'the chip still shows a red dot (🔥 0, reward ready)');
    const g = w.__g();
    for (let i = 0; i < 7; i++) { S.setToday('2026-11-' + (10 + i)); S.open('test'); d.querySelector('.stk10Go').click(); await sleep(20); S.close(); await sleep(420) }
    const st = S.load();
    ok(st.n === 7 && g.PROG72.unlock['skin:inferno'], 'seven days in a row unlock the Inferno skin');
    ok(Object.keys(g.PROG72.unlock).length === 2, 'plus the day-5 mystery item (' + Object.keys(g.PROG72.unlock).join(', ') + ')');
    ok(g.SKIN72.inferno && g.SKIN72.inferno.lock === 'skin:inferno' && g.LOCKS72['skin:inferno'] && !g.LOCKS72['skin:inferno'].coins, 'Inferno is a train skin that can\'t be bought');
    ok(/day-7 daily streak/.test(g.lockText72('skin:inferno')) && g.lockText72('skin:neon') === 'Unlock: buy it', 'its lock text explains the streak; other lock texts are unchanged');
    ok(g.TITLES72.onfire.ok() && !g.TITLES72.unstop.ok(), 'title "On Fire" is earned, "Unstoppable" (30 days) not yet');
    await sleep(100); S.setToday('2026-11-18'); S.open('test');
    ok(d.getElementById('stk10T').textContent === 'Your freeze saved the streak 🧊', 'after one missed day the freeze saves it');
    d.querySelector('.stk10Go').click(); await sleep(20);
    ok(S.load().n === 8 && S.load().frz === 0, 'day 8 claimed, the freeze is used up');
    S.close(); await sleep(450);
    S.setToday('2026-11-21'); S.open('test');
    ok(d.getElementById('stk10T').textContent === 'Your streak burned out 😢' && /after 8 in a row/.test(d.querySelector('.stk10Sub').textContent), 'two missed days without a freeze: "Your streak burned out"');
    const box = d.querySelector('.stk10Auto input'); box.checked = true; box.dispatchEvent(new w.Event('change'));
    ok(S.load().auto === true, 'the "Show this when I open the game" switch is saved');
    S.close(); await sleep(340);
  }
  // 4. never over another dialog
  {
    const { d, S } = page({ storage: { 'coasterlab.v10.streak': JSON.stringify({ last: '2020-01-01', n: 2 }) } });
    d.getElementById('ov7').hidden = false; await sleep(2200);
    ok(!S.isOpen(), 'not over Settings / Goals');
    d.getElementById('ov7').hidden = true; await sleep(1300);
    ok(S.isOpen(), 'opens once Settings is closed');
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL crashed: ' + (e.stack || e)); process.exit(1) });
