// Repro: the 📅 Daily tab is open before midnight; the player taps Submit just after midnight.
const { open } = require('../../tests/harness.js');
const F = process.argv[2] || __dirname + '/game.html';
(async () => {
  const { browser, page, errors } = await open(F, { storage: { 'coasterlab.tut.v2': '1' } });
  const X = (f, a) => page.evaluate(f, a);
  // freeze the clock at 23:59:30 local time on 2026-11-25
  await X(() => { const R = Date, base = new R(2026, 10, 25, 23, 59, 30).getTime(), t0 = R.now(); window.__off = 0;
    class FD extends R { constructor(...a) { if (a.length) super(...a); else super(base + (R.now() - t0) + window.__off) } static now() { return base + (R.now() - t0) + window.__off } }
    window.Date = FD });
  await X(() => window.__coasterDebug.v80.v86.openDailyBuilder()); await page.waitForTimeout(1200);
  await X(() => { document.querySelectorAll('#b8Tour').forEach(e => e.hidden = true) });
  const shown = await X(() => ({ head: document.querySelector('#b8Lib .dly86 small').textContent, rules: [...document.querySelectorAll('#b8Lib .rl86 li span')].map(e => e.firstChild.textContent) }));
  console.log('card shown before midnight:', shown.head, '|', shown.rules.join(' | '));
  await X(() => { window.__off = 60 * 1000 }); // one minute later: 00:00:30 on the 26th
  const today = await X(() => window.__coasterDebug.v80.v86.daily());
  console.log('challenge86() now:', today.k, today.rules.map(r => r.t).join(' | '));
  await page.click('[data-dc86="submit"]'); await page.waitForTimeout(600);
  const st = await X(() => window.__coasterDebug.v80.v86.dailyState());
  console.log('days recorded:', Object.keys(st.days), 'last:', st.last && st.last.k, st.last && st.last.res.map(r => r.ok));
  const after = await X(() => ({ head: document.querySelector('#b8Lib .dly86 small').textContent, rules: [...document.querySelectorAll('#b8Lib .rl86 li span')].map(e => e.firstChild.textContent) }));
  console.log('card after submit:', after.head, '|', after.rules.join(' | '));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
