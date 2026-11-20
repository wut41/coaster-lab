// 8.7 👑 VIP pack: locked golden coasters, VIP page, unlock (test hook), VIP colours, gold graphics, revoke.
// The real purchase path (Stripe Payment Link → Supabase webhook) is not exercised here: network calls are blocked
// by the harness; vip-status is mocked below to check that the game unlocks from a server "yes".
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
const F = ROOT + 'coaster_lab_v8_7.html', SH = __dirname + '/shots/';
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  for (const [w, h] of [[390, 844], [1280, 720]]) {
    const { browser, page, errors } = await open(F, { w, h, mobile: w < 600 });
    const X = f => page.evaluate(f), V = () => X(() => window.__coasterDebug.v87.vip());
    let v = await V();
    ok(v.rides.length === 3 && !v.on, `${w}x${h} three VIP rides registered, VIP off by default`);
    const names = await X(() => window.__coasterDebug.v87.vip().rides.map(i => document.querySelector(`#cards .card[data-i="${i}"]`)).map(c => c && c.textContent));
    ok(names.every(t => t && /Golden Crown|Midas Touch|Gilded Phoenix/.test(t) && /VIP/.test(t)), 'locked VIP cards show the coaster name + VIP badge: ' + names.map(t => (t || '').slice(0, 30)).join(' | '));
    ok(!v.sec && v.railC === 8, 'no VIP secret key and no VIP track colours before buying');
    // a locked VIP card opens the VIP page (not the "find the secret" shake)
    await X(() => { const i = window.__coasterDebug.v87.vip().rides[0]; document.querySelector(`#cards .card[data-i="${i}"]`).click(); });
    await page.waitForTimeout(300);
    ok(await X(() => !document.querySelector('#ov7').hidden && document.querySelector('#ov7').dataset.k === 'vip87'), 'tapping a locked VIP card opens the 👑 VIP page');
    const pg = await X(() => document.querySelector('#ov7B').textContent);
    ok(/Get VIP — \$2/.test(pg) && /Golden Crown/.test(pg) && /Restore/.test(pg), 'VIP page: $2 button, the three coasters, restore form');
    if (w === 1280) await page.screenshot({ path: SH + 'vip_page_locked.png' });
    // Train Studio swatches show the locked VIP teaser before buying
    ok(/VIP colours/.test(await X(() => window.__coasterDebug.v87.swatch('body', '#ffffff'))), 'Train Studio shows a locked 👑 VIP colours teaser');
    // server says yes → unlock (mock vip-status)
    await page.route('**/functions/v1/vip-status', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ vip: true, code: 'K7Q2-MX4P' }) }));
    await X(() => window.__coasterDebug.v87.grant('K7Q2-MX4P'));
    await page.waitForTimeout(400);
    v = await V();
    ok(v.on && v.sec && v.railC === 18, 'after unlock: VIP on, secret key set, 10 VIP colours added to track swatches');
    ok(await X(() => JSON.parse(localStorage.getItem('coasterlab.v87.vip')).code === 'K7Q2-MX4P'), 'purchase + restore code saved under coasterlab.v87.vip');
    ok(await X(() => /K7Q2-MX4P/.test(document.querySelector('#ov7B').textContent) && /You’re a VIP|Ride it/.test(document.querySelector('#ov7B').textContent)), 'VIP page now shows "Ride it" buttons and the restore code');
    if (w === 1280) await page.screenshot({ path: SH + 'vip_page_owned.png' });
    // ride each golden coaster: gold graphics on, dust + lamps in the scene, no errors
    for (const i of v.rides) {
      await page.evaluate(i => { document.querySelector('#ov7').hidden = true; window.__coasterDebug.select(i); }, i);
      await page.waitForTimeout(1600);
      const g = await X(() => { const d = window.__coasterDebug; return { gold: d.v87.vip().gold, name: document.querySelector('#rideName').textContent, lap: d.lab() && d.lab().T } });
      ok(g.gold && g.lap > 10, `ride ${g.name}: gold graphics on, lap ${g.lap && g.lap.toFixed(1)} s`);
      if (w === 1280) { await X(() => window.__coasterDebug.v72.look(70, .45, .8)); await page.waitForTimeout(900); await page.screenshot({ path: SH + `vip_${g.name.replace(/\W+/g, '_')}.png` }); }
    }
    // a progress reset must not take VIP away
    await X(() => { const d = window.__coasterDebug; d.v7.prg().sec = {}; });
    await X(() => window.__coasterDebug.v87.grant('K7Q2-MX4P'));
    ok((await V()).sec, 'VIP key comes back after the secrets list is cleared');
    // back to a normal ride: gold switched off
    await X(() => window.__coasterDebug.select(0)); await page.waitForTimeout(800);
    ok(!(await V()).gold, 'normal ride: gold graphics off again');
    // Train Studio swatches include the VIP palette when owned
    const studio = await X(() => { try { return window.__coasterDebug.v87.swatch('body', '#d4af37') } catch (e) { return 'ERR ' + e.message } });
    ok(/data-v="#d4af37"/.test(studio) && /👑/.test(studio), 'Train Studio swatches include the 10 VIP colours');
    // revoke (test hook) → locked again
    await X(() => window.__coasterDebug.v87.revoke()); await page.waitForTimeout(300);
    v = await V();
    ok(!v.on && !v.sec && v.railC === 8, 'revoke: locked again, VIP colours removed');
    ok(errors.length === 0, `${w}x${h} 0 console errors` + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
})();
