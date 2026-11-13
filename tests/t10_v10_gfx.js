// Coaster Lab 10.0 graphics extras: glow (bloom), the sun disc, shinier metal, speed effects on drops, the Graphics
// quality ladder, the two Settings switches, the frame-rate watch that turns the extras down, and 0 console errors.
// Saves before/after pictures in tests/shots/gfx_*.png (glow on vs off, a fast drop with motion blur, a phone).
const { open } = require('./harness');
const fs = require('fs');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
fs.mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const G = () => window.__coasterDebug.v80.v10.gfx;
(async () => {
  // ---------- A. computer (starts on High)
  {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
    const X = (f, a) => page.evaluate(f, a), st = () => X(() => window.__coasterDebug.v80.v10.gfx.state()), wait = ms => page.waitForTimeout(ms);
    await page.waitForFunction(() => window.__coasterDebug.v80.v10.gfx.state().frames > 10, null, { timeout: 60000 });
    let s = await st();
    ok(s.ok === true, 'this browser can draw the extras (WebGL2 + half-float pictures): ' + s.ok);
    ok(s.q === 'high' && s.post && s.glow && s.lv === 5 && s.blurN === 8, `High: glow with 5 levels and 8 motion blur samples (${s.q}, post ${s.post}, levels ${s.lv}, blur ${s.blurN})`);
    ok(s.frames > 10 && s.w === 1200 && s.h === 800, `frames go through the glow picture at full size (${s.frames} frames, ${s.w}×${s.h}, MSAA ${s.samples})`);
    ok(s.sun === true, 'the sun disc shows in the daytime sky');
    // sharpness (10.0.1): sharpen on, no motion blur or shake while cruising, steeper texture filtering, sharper pixel ratios
    ok(s.sharp > 0 && s.blur === 0, `High is sharpened and has no motion blur at rest (sharp ${s.sharp}, blur ${s.blur})`);
    ok(await X(() => { let n = 0, lo = 0; window.__coasterDebug.v80.v10.gfx.textures().forEach(a => { n++; if (a < 4) lo++ }); return n > 0 && lo === 0 }), 'textures seen at an angle use steep filtering');
    ok(await X(() => window.__coasterDebug.v80.v10.gfx.ladderPr()) === 'low:1 medium:1.5 high:2 ultra:2.5', 'pixel ratios per quality are sharper than before (Low 1, Medium 1.5, High 2, Ultra 2.5)');
    const m = await X(() => window.__coasterDebug.v80.v10.gfx.metal());
    ok(m.metal > 0 && m.boosted === m.metal, `every metal material reflects more of the sky on High (${m.boosted} of ${m.metal})`);
    const on = await page.screenshot({ path: SH + 'gfx_high_glow_on.png' });
    await X(() => window.__coasterDebug.v80.v10.gfx.set({ glow: false })); await wait(500); s = await st();
    ok(!s.post && !s.sun, 'Glow off: plain drawing again, no sun disc');
    const off = await page.screenshot({ path: SH + 'gfx_high_glow_off.png' });
    ok(!on.equals(off), 'the picture with glow differs from the one without');
    await X(() => window.__coasterDebug.v80.v10.gfx.set({ glow: true })); await wait(300);

    // quality ladder through ⚙ Settings, and the two switches in it
    await page.click('#setBtn'); await wait(300);
    ok(await X(() => ['glow', 'speed', 'blur'].every(k => !!document.querySelector(`#gfx10 [data-gfx10="${k}"]`))), 'Settings shows the Glow, Camera shake and Motion blur switches');
    const lad = [];
    for (const q of ['low', 'medium', 'ultra', 'high']) { await X(q => document.querySelector(`#ov7B [data-o7="q"][data-v="${q}"]`).click(), q); await wait(400); const t = await st(); lad.push(`${q}:${t.post ? t.lv : 'off'}/${t.blurN}/${t.shine}`) }
    ok(lad.join(' ') === 'low:off/0/1 medium:3/4/1.2 ultra:6/10/1.6 high:5/8/1.45', 'quality ladder (levels/blur samples/shine): ' + lad.join(' '));
    await X(() => document.querySelector('#gfx10 [data-gfx10="glow"]').click()); await wait(300); s = await st();
    const saved = await X(() => localStorage.getItem('coasterlab.v10.gfx'));
    ok(!s.set.glow && !s.post && /"glow":false/.test(saved || ''), 'unticking Glow turns it off and remembers it: ' + saved);
    ok(await X(() => !!document.querySelector('#gfx10 [data-gfx10="glow"]') && !document.querySelector('#gfx10 [data-gfx10="glow"]').checked), 'the switch stays shown and unticked after Settings redraws');
    await X(() => document.querySelector('#gfx10 [data-gfx10="glow"]').click()); await wait(300);
    ok((await st()).post, 'ticking Glow again turns it back on');
    await X(() => document.querySelector('#gfx10 [data-gfx10="blur"]').click()); await wait(300); s = await st();
    ok(!s.set.blur && s.blurN === 0 && s.set.speed && /"blur":false/.test(await X(() => localStorage.getItem('coasterlab.v10.gfx')) || ''), 'Motion blur has its own switch, and turning it off keeps the shake');
    await X(() => document.querySelector('#gfx10 [data-gfx10="blur"]').click()); await wait(300);
    ok((await st()).blurN === 8, 'ticking Motion blur again brings it back');
    await X(() => document.querySelector('#ov7X').click()); await wait(200);

    // a fast drop in the front seat: shake + motion blur, and the camera is put back after every frame
    await X(() => document.querySelector('[data-cam="ride"]').click()); await wait(600);
    await X(() => window.__coasterDebug.v80.v10.gfx.motion(1, .06)); await wait(300);
    s = await st(); ok(s.shake === 1 && s.blur === .06, 'speed effects can be shown at full strength');
    await page.screenshot({ path: SH + 'gfx_drop_motion_blur.png' });
    const c1 = await X(() => window.__coasterDebug.v72.cam()); ok(c1 && c1.fin !== false, 'camera stays valid with the shake on');
    await X(() => window.__coasterDebug.v80.v10.gfx.motion(null)); await wait(800);
    s = await st(); ok(s.shake < .5, 'without a drop the shake settles back down: ' + s.shake);

    // the frame-rate watch: a device that stays slow gets lighter glow first, then no glow
    await X(() => window.__coasterDebug.v80.v10.gfx.slow(true)); await wait(5500); const a1 = (await st()).auto;
    await wait(9500); s = await st(); await X(() => window.__coasterDebug.v80.v10.gfx.slow(false));
    ok(a1 === 1 && s.auto === 2 && !s.post, `slow device: lighter first, then glow off (${a1} then ${s.auto}, post ${s.post})`);
    await X(() => window.__coasterDebug.v80.v10.gfx.set({ glow: true })); await wait(300);
    ok((await st()).post, 'turning Glow on again retries the full look');

    ok(errors.length === 0, 'computer: 0 console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ').slice(0, 400) : ''));
    await browser.close();
  }
  // ---------- B. phone (starts on Medium)
  {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 });
    await page.waitForFunction(() => window.__coasterDebug.v80.v10.gfx.state().frames > 3, null, { timeout: 60000 });
    const s = await page.evaluate(() => window.__coasterDebug.v80.v10.gfx.state());
    ok(s.q === 'medium' && s.post && s.lv === 3 && s.blurN === 4, `phone: Medium with 3 glow levels and light motion blur (${s.q}, ${s.post}, ${s.lv}, ${s.blurN})`);
    const dpr = await page.evaluate(() => devicePixelRatio);
    ok(s.pr === Math.min(dpr, 1.5), `phone: Medium draws at ${s.pr} pixels per point (screen ${dpr})`);
    await page.screenshot({ path: SH + 'gfx_phone_medium.png' });
    ok(errors.length === 0, 'phone: 0 console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ').slice(0, 400) : ''));
    await browser.close();
  }
  console.log(fails ? `${fails} failed` : 'all passed');
})().catch(e => { console.log('FAIL suite crashed: ' + (e && e.stack || e)); process.exit(1) });
