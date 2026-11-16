const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
const F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  for (const [w, h] of [[390, 844], [844, 390]]) {
    const { browser, ctx, page, errors } = await open(F, { w, h });
    const D = () => page.evaluate(() => window.__coasterDebug.v80.v86.grav());
    let g = await D();
    ok(g.k === 'earth' && g.PH.g === 9.81 && g.PH.fric === .14 && g.PH.drag === .0016 && !g.chipOn && g.badge === '', `${w}x${h} default is untouched Earth physics`);
    await page.evaluate(() => window.__coasterDebug.v80.v86.setGrav('moon'));
    g = await D();
    ok(g.PH.g === 1.62 && Math.abs(g.PH.fric - .14 * 1.62 / 9.81) < 1e-4 && g.PH.drag === 0, 'Moon sets g=1.62, scaled friction, no air');
    ok(g.chipOn && g.chip === '🌙 Moon gravity' && g.badge === '🌙', 'brand chip + HUD badge name the planet: ' + g.chip);
    const lab = await page.evaluate(() => window.__coasterDebug.lab());
    ok(lab.st.flo > 20, 'Looping Adventure floats on the Moon: ' + lab.st.flo.toFixed(1) + ' s under 0.5 G');
    // open the page from the Park & tools hub
    await page.click('#parkBtn'); await page.waitForTimeout(400);
    const tile = await page.$('[data-hub="grav86"]'); ok(!!tile, 'Gravity Lab tile is in Park & tools');
    await tile.click(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => !document.querySelector('#ov7').hidden && document.querySelector('#ov7T').textContent === '🪐 Gravity Lab'), 'Gravity Lab page opens');
    await page.waitForFunction(() => /All \d+ rides|run/.test((document.querySelector('#gl86') || {}).textContent || ''), null, { timeout: 60000 });
    const list = await page.evaluate(() => document.querySelector('#gl86').textContent);
    ok(/All \d+ rides make it round/.test(list), 'all-ride check finishes (Moon, realistic): ' + list.slice(0, 80));
    ok(!/Golden Dragon|Rainbow Road|Lunar Leap|The Void/.test(list), 'locked secret rides are not named');
    await page.screenshot({ path: SH + `grav_moon_${w}x${h}.png` });
    // realistic off -> Lab-style gravity only -> some rides stall, stall warning appears
    await page.click('[data-g86="real"]'); await page.waitForTimeout(300);
    g = await D(); ok(g.PH.fric === .14 && g.PH.drag === .0016 && g.real === false, 'realistic off = gravity only');
    await page.waitForFunction(() => /run out of speed|All \d+ rides/.test((document.querySelector('#gl86') || {}).textContent || '') && !/Checking/.test(document.querySelector('#gl86').textContent), null, { timeout: 90000 });
    const list2 = await page.evaluate(() => document.querySelector('#gl86').textContent);
    ok(/run.? out of speed/.test(list2), 'stall list (gravity only): ' + list2.slice(0, 120));
    // custom slider
    await page.evaluate(() => { const s = document.querySelector('[data-g86="slider"]'); s.value = 5; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })) });
    g = await D(); ok(g.k === 'custom' && g.PH.g === 5 && /0\.51× Earth/.test(g.chip), 'custom slider: ' + g.chip);
    await page.evaluate(() => window.__coasterDebug.v80.v86.setGrav('jupiter', null, true));
    // persistence across reload
    console.log('   stored before reload:', await page.evaluate(() => localStorage.getItem('coasterlab.v86.gravity')));
    await page.waitForTimeout(2500); console.log('   stored after wait:', await page.evaluate(() => localStorage.getItem('coasterlab.v86.gravity'))); await page.reload(); await page.waitForFunction(() => window.__booted === true); await page.waitForTimeout(800);
    console.log('   stored after reload:', await page.evaluate(() => localStorage.getItem('coasterlab.v86.gravity')));
    g = await D(); ok(g.k === 'jupiter' && g.PH.g === 24.79 && g.chip === '🪐 Jupiter gravity', 'saved choice survives reload');
    // Settings has the Experiments section and the one-tap Earth reset
    await page.evaluate(() => document.querySelector('#setBtn').click()); await page.waitForTimeout(300);
    ok(await page.$('#ov7B .x86 [data-g86="p"][data-v="earth"]') != null, 'Settings → Experiments shows 🌍 Earth button');
    await page.click('#ov7B .x86 [data-g86="p"][data-v="earth"]'); await page.waitForTimeout(300);
    g = await D(); ok(g.k === 'earth' && g.PH.g === 9.81 && g.PH.fric === .14 && !g.chipOn, 'one tap back to Earth');
    // Lab "Restore default physics" after Moon also means Earth for the Gravity Lab
    await page.evaluate(() => window.__coasterDebug.v80.v86.setGrav('moon'));
    await page.evaluate(() => window.__coasterDebug.setPH({ g: 9.81, fric: .14, drag: .0016, lift: 3.8, brake: 14, launch: 1 })); await page.waitForTimeout(200);
    g = await D(); ok(g.k === 'earth' && !g.chipOn, 'Lab restore default physics -> Gravity Lab back to Earth');
    ok(errors.length === 0, `${w}x${h} console errors: ${errors.length}`); errors.slice(0, 5).forEach(e => console.log('   ', e.slice(0, 300)));
    await browser.close();
  }
})();
