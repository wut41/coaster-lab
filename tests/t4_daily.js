const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
const F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const seen = [];
  for (const [w, h] of [[390, 844], [844, 390]]) {
    const { browser, ctx, page, errors } = await open(F, { w, h, storage: { 'coasterlab.tut.v2': '1' } });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    const X = (f, a) => page.evaluate(f, a);
    const today = await X(() => window.__coasterDebug.v80.v86.daily()); seen.push(JSON.stringify(today));
    console.log('   today:', today.k, '#' + today.n, today.theme, '·', today.rules.map(r => r.t).join(' | '));
    // the same date gives the same challenge with other units / other gravity
    const same = await X(() => { const V6 = window.__coasterDebug.v80.v86, a = JSON.stringify(V6.daily('2027-03-14').rules.map(r => [r.k, r.x])); window.__coasterDebug.setPref('imp', false); V6.setGrav('moon'); const b = JSON.stringify(V6.daily('2027-03-14').rules.map(r => [r.k, r.x])); window.__coasterDebug.setPref('imp', true); V6.setGrav('earth'); return a === b });
    ok(same, `${w}x${h} challenge depends only on the date (not units or gravity)`);
    const diff = await X(() => { const V6 = window.__coasterDebug.v80.v86; return new Set(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'].map(k => JSON.stringify(V6.daily(k).rules))).size });
    ok(diff >= 4, 'different days give different challenges (' + diff + '/5 distinct)');
    // 🎡 tile → page → Build it → builder with the 📅 tab
    await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="daily86"]'); await page.waitForTimeout(400);
    ok(await X(() => document.querySelector('#ov7T').textContent === '📅 Daily Challenge' && /Daily Challenge #\d+/.test(document.querySelector('#ov7B').textContent)), 'Daily Challenge page opens from Park & tools');
    if (w === 390) await page.screenshot({ path: SH + 'daily_page.png' });
    await page.click('[data-dc86="build"]'); await page.waitForTimeout(900);
    await X(() => { document.querySelectorAll('#b8Tour').forEach(e => e.hidden = true) });
    ok(await X(() => window.__coasterDebug.v80.bld.state().editing && window.__coasterDebug.v80.bld.state().lib === 'daily') && await page.$('[data-dc86="submit"]') != null, 'Build it opens the builder on the 📅 Daily tab with Submit');
    // 1st submit: the starter coaster (probably fails some rules)
    await page.click('[data-dc86="submit"]'); await page.waitForTimeout(400);
    let st = await X(() => window.__coasterDebug.v80.v86.dailyState()); let d = st.days[today.k];
    ok(d && d.tries === 1 && d.res.length === 3, 'submit recorded: best ' + (d && d.best) + ', rules ' + (d && d.res.map(x => x ? '✓' : '✗').join('')));
    // a coaster that passes today's rules (found by the test helper from the built-in layouts)
    const win = await X(() => window.__coasterDebug.v80.v86.findToday());
    ok(!!win, 'test helper found a passing coaster for today: ' + (win && win.by));
    if (win) {
      // pretend the last two days were passed, so today makes a 3-day streak
      await X(k => { const p = d => { const [y, m, dd] = d.split('-').map(Number); const x = new Date(y, m - 1, dd - 1); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0') }; const st = window.__coasterDebug.v80.v86.dailyState(); st.days[p(k)] = { best: 700, pass: true, tries: 1, res: [true, true, true], vals: [] }; st.days[p(p(k))] = { best: 650, pass: true, tries: 2, res: [true, true, true], vals: [] }; window.__coasterDebug.v80.v86.setDays(st.days) }, today.k);
      // Moon gravity on: Submit must still use Earth physics
      await X(() => window.__coasterDebug.v80.v86.setGrav('moon'));
      await X(els => window.__coasterDebug.v80.v86.setD(els), win.els); await page.waitForTimeout(300);
      const mMoon = await X(() => window.__coasterDebug.v80.v86.metrics());
      await X(() => window.__coasterDebug.v80.v86.setGrav('earth')); const mEarth = await X(() => window.__coasterDebug.v80.v86.metrics());
      ok(JSON.stringify(mMoon) === JSON.stringify(mEarth), 'Submit measures with Earth physics even while Moon gravity is on');
      await X(() => window.__coasterDebug.v80.v86.setGrav('moon'));
      await page.click('[data-dc86="submit"]'); await page.waitForTimeout(500);
      st = await X(() => window.__coasterDebug.v80.v86.dailyState()); d = st.days[today.k];
      ok(d.pass && d.best >= 600 && d.tries === 2, 'passing coaster: ✅ ' + d.best + ' pts, ' + d.tries + ' tries');
      ok(await X(() => window.__coasterDebug.v80.v86.streak()) === 3, 'streak is 3 days');
      const ach = await X(() => Object.keys(window.__coasterDebug.v7.prg().ach)); ok(ach.includes('day86') && ach.includes('streak86'), 'achievements Daily challenger + On a roll unlocked');
      await X(() => window.__coasterDebug.v80.v86.setGrav('earth'));
      if (w === 390) await page.screenshot({ path: SH + 'daily_passed.png' });
      // share: no navigator.share here → clipboard
      await page.click('.dRes86 [data-dc86="share"]'); await page.waitForTimeout(400);
      const clip = await X(() => navigator.clipboard.readText()), txt = await X(() => window.__coasterDebug.v80.v86.shareText());
      ok(clip === txt && /Coaster Lab Daily #\d+/.test(clip) && /🟩/.test(clip) && /🔥 Streak 3/.test(clip), 'share copied the emoji result:\n' + clip.split('\n').map(l => '      ' + l).join('\n'));
      // last resort when even the clipboard is blocked: a text box to copy from
      await X(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('blocked')) });
      await page.click('.dRes86 [data-dc86="share"]'); await page.waitForTimeout(300);
      ok(await X(() => { const b = document.querySelector('.shareBox86'); return b && !b.hidden && b.querySelector('textarea').value.startsWith('🎢 Coaster Lab Daily') }), 'fallback text box appears when copying is blocked');
      // navigator.share is used when it exists
      const used = await X(async () => { let got = null; navigator.share = async o => { got = o.text }; document.querySelector('.dRes86 [data-dc86="share"]').click(); await new Promise(r => setTimeout(r, 200)); delete navigator.share; return got && got.startsWith('🎢 Coaster Lab Daily') });
      ok(used, 'navigator.share is used when the phone has it');
    }
    // saved across a reload
    console.log('   stored before reload:', (await X(() => localStorage.getItem('coasterlab.v86.daily')) || 'null').slice(0, 90));
    await page.waitForTimeout(2500); console.log('   stored after wait:', (await X(() => localStorage.getItem('coasterlab.v86.daily')) || 'null').slice(0, 90)); await page.reload(); await page.waitForFunction(() => window.__booted === true); await page.waitForTimeout(600);
    console.log('   stored after reload:', (await X(() => localStorage.getItem('coasterlab.v86.daily')) || 'null').slice(0, 90));
    st = await X(() => window.__coasterDebug.v80.v86.dailyState()); ok(st.days[today.k] && st.days[today.k].tries >= 1, 'history survives reload (streak ' + (await X(() => window.__coasterDebug.v80.v86.streak())) + ')');
    ok(errors.length === 0, `${w}x${h} console errors: ${errors.length}`); errors.slice(0, 5).forEach(e => console.log('   ', e.slice(0, 300)));
    await browser.close();
  }
  ok(seen[0] === seen[1], 'both browser sessions got the exact same challenge today');
})();
