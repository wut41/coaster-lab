// Daily streak in the real game (headless Chromium): the popup on a returning visit, claiming (coins + XP reach the
// game's own progress), the Inferno skin in the Train Studio list, the HUD chip and the title-screen card, and the popup
// fitting on screen at four sizes. The streak rules themselves are in t19_streak_logic.js (plain node).
const { open } = require('./harness');
const path = require('path');
const F = process.env.CL_FILE || path.join(__dirname, '..', 'coaster_lab_v10_0.html');
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const yesterday = () => { const y = new Date(); y.setDate(y.getDate() - 1); const p = n => (n < 10 ? '0' : '') + n; return y.getFullYear() + '-' + p(y.getMonth() + 1) + '-' + p(y.getDate()) };
const fits = () => { const i = document.querySelector('#stk10 .stk10In'), g = document.querySelector('#stk10 .stk10Go'), r = i.getBoundingClientRect(), b = g.getBoundingClientRect(), li = [...document.querySelectorAll('#stk10 .stk10Row li')].map(e => e.getBoundingClientRect());
  return { card: r.left >= 0 && r.right <= innerWidth + .5 && r.top >= 0 && r.bottom <= innerHeight + .5, btn: b.height >= 40 && b.width > 150, row: li.length === 7 && li.every(x => x.width >= 28 && Math.abs(x.top - li[0].top) < 1) && li[6].right <= r.right, scroll: i.scrollHeight <= i.clientHeight + 1 || getComputedStyle(i).overflowY === 'auto' } };
(async () => {
  for (const [w, h, mobile] of [[390, 844, true], [844, 390, true], [320, 568, true], [1280, 720, false]]) {
    const { browser, page, errors } = await open(F, { w, h, mobile, skipStart: true, storage: { 'coasterlab.v10.streak': JSON.stringify({ last: yesterday(), n: 6, best: 6, total: 6, frz: 1, auto: true }) } });
    await page.waitForFunction(() => window.__streak10 && window.__streak10.isOpen(), null, { timeout: 8000 }).catch(() => {});
    const opened = await page.evaluate(() => window.__streak10.isOpen());
    ok(opened, `${w}×${h}: a returning player gets the popup by itself`);
    if (opened) {
      await page.waitForTimeout(700);
      const f = await page.evaluate(fits);
      ok(f.card && f.btn && f.row, `${w}×${h}: the card, the 7 tiles and the Claim button fit on screen (${JSON.stringify(f)})`);
      await page.screenshot({ path: path.join(__dirname, 'shots', `streak_${w}x${h}.png`) });
      if (w === 390) {
        const before = await page.evaluate(() => { const g = window.__streak10.game(); return { c: g.coins, x: g.xp } });
        await page.click('#stk10 .stk10Go'); await page.waitForTimeout(900);
        const after = await page.evaluate(() => { const g = window.__streak10.game(); return { c: g.coins, x: g.xp, inf: g.inferno, st: JSON.parse(localStorage.getItem('coasterlab.v10.streak')) } });
        ok(after.st.n === 7 && after.inf, 'day 7 claimed: streak 7 and the Inferno skin unlocked');
        ok(after.c - before.c === 250 && after.x - before.x === 300, 'day 7 pays 🪙250 + 300 XP into the game (' + JSON.stringify([before, after]) + ')');
        await page.screenshot({ path: path.join(__dirname, 'shots', 'streak_claimed.png') });
        ok(await page.evaluate(() => { const g = window.__streak10.game(); return g.skin && g.usable }), 'the Inferno skin is usable in the Train Studio');
        ok(await page.evaluate(() => window.__streak10.game().onfire), 'the "On Fire" title is earned');
        await page.keyboard.press('Escape'); await page.waitForTimeout(500);
        const chip = await page.evaluate(() => { const c = document.getElementById('stk10chip'); if (!c) return null; const r = c.getBoundingClientRect(); return { t: c.textContent, vis: r.width > 20 && r.right <= innerWidth && r.top >= 0, ready: c.classList.contains('ready') } });
        ok(chip && /7/.test(chip.t) && chip.vis && !chip.ready, 'the HUD chip shows 🔥 7 on screen (' + JSON.stringify(chip) + ')');
        await page.click('#stk10chip'); await page.waitForTimeout(500);
        ok(await page.evaluate(() => window.__streak10.isOpen() && document.getElementById('start').hidden), 'the chip opens the popup again (and does not go Home)');
        await page.click('#stk10 .stk10X'); await page.waitForTimeout(500);
      }
    }
    ok(errors.length === 0, `${w}×${h}: no console errors` + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''));
    await browser.close();
  }
  // the title screen card, and a first visit (trailer seen, title screen open): no popup over the title screen
  {
    const { browser, page, errors } = await open(F, { w: 390, h: 844, mobile: true, skipStart: false, storage: { 'coasterlab.v10.streak': '' } });
    await page.waitForTimeout(2500);
    ok(await page.evaluate(() => !window.__streak10.isOpen() && !document.getElementById('start').hidden), 'first visit: no popup over the title screen');
    const card = await page.evaluate(() => { const c = document.querySelector('#start [data-stk10]'); return c && { t: c.textContent, after: c.previousElementSibling && c.previousElementSibling.matches('.cta.go') } });
    ok(card && card.after && /Daily reward ready/.test(card.t), 'the title screen has a Daily reward card after Ride now (' + JSON.stringify(card) + ')');
    await page.click('#start [data-stk10]'); await page.waitForTimeout(600);
    ok(await page.evaluate(() => window.__streak10.isOpen()), 'the card opens the popup');
    await page.screenshot({ path: path.join(__dirname, 'shots', 'streak_first.png') });
    ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''));
    await browser.close();
  }
})().catch(e => { console.log('FAIL crashed: ' + (e.stack || e)); process.exit(1) });
