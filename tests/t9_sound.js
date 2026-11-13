// Coaster Lab 10.0 sound upgrade: no audio before a tap, the Sound switch is remembered and comes back on the first tap,
// riders scream on big drops (main ride and My Park), a "Rider screams" mixer channel with its own mute, the My Park
// Sound button, crowd, rumble, ride-along wind and the music mood. Sound is played for real (headless Chromium runs
// Web Audio), so these checks follow the engine's own numbers; nobody listens to the output here.
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = ROOT + 'coaster_lab_v10_0.html';
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const ONLY = process.env.T9 || 'ABC';
const waitFor = async (page, fn, arg, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await page.waitForTimeout(400) } return false };
(async () => {
  const SN = () => window.__coasterDebug.v80.v10.snd.state();
  // ---------- A. the ride view
  if (ONLY.includes('A')) {
    const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
    const X = (f, a) => page.evaluate(f, a);
    let s = await X(SN);
    ok(!s.ctx && !s.on && s.saved === null, 'no audio is created before the player taps Sound');
    const ci = s.ch.indexOf('scream'); ok(ci > 0 && s.ch[ci + 1] === 'fx' && s.vol === .7 && !s.mute, 'the mixer has a "Rider screams" channel (70%, not muted): ' + s.ch.join(', '));
    ok(await X(() => window.__coasterDebug.v80.v10.snd.scream(1)) === false, 'nothing screams while sound is off');
    await page.click('#sound'); await page.waitForTimeout(500); s = await X(SN);
    ok(s.ctx && s.on && s.run === 'running' && s.saved === true, 'tapping 🔇 starts sound and remembers it (' + s.run + ')');
    ok(await X(() => window.__coasterDebug.v80.v10.snd.scream(1)) === true && (await X(SN)).n === 1 && (await X(SN)).voices >= 2, 'a scream is several rider voices');
    // a cap keeps phones light: never more than 6 voices at once
    await X(() => { for (let i = 0; i < 6; i++) window.__coasterDebug.v80.v10.snd.scream(1) }); s = await X(SN); ok(s.voices <= 6, 'screams stop adding voices at the cap (' + s.voices + ' playing)');
    await X(() => window.__coasterDebug.v72.mute('scream', true)); await page.waitForTimeout(200);
    ok(await X(() => window.__coasterDebug.v80.v10.snd.scream(1)) === false, 'muting "Rider screams" silences them');
    await X(() => window.__coasterDebug.v72.mute('scream', false));
    // ride Skyfall (big vertical drop) in real time until the riders scream on their own
    await page.waitForTimeout(2500); await X(() => { window.__coasterDebug.v80.v10.snd.reset(); const d = window.__coasterDebug; d.select(d.rides.indexOf('Skyfall')) });
    // headless frames are slow, so the ride is stepped forward a quarter second at a time; the sound engine still
    // only sees the train's position frame by frame, exactly like in a normal game
    let got = false; for (let k = 0; k < 280 && !got; k++) { await X(() => window.__coasterDebug.v72.ff(.25)); await page.waitForTimeout(120); got = await X(() => window.__coasterDebug.v80.v10.snd.state().n > 0) } s = await X(SN);
    ok(got && s.last && s.last.int > .1, 'riders scream by themselves on Skyfall’s drop (' + JSON.stringify(s.last) + ')');
    // the Settings mixer shows the new row
    await page.click('#setBtn'); await page.waitForTimeout(400);
    const row = await X(() => { const el = [...document.querySelectorAll('#ov7 .snd72')].find(r => /Rider screams/.test(r.textContent)); return !!el && !!el.querySelector('input[type=range][data-k=scream]') && !!el.querySelector('input[type=checkbox][data-k=scream]') });
    ok(row, '⚙ Settings → Sound has a Rider screams slider and mute switch');
    await X(() => document.querySelector('#ov7X').click());
    await page.click('#sound', { force: true }); await page.waitForTimeout(300); s = await X(SN);
    ok(!s.on && s.saved === false, 'tapping 🔊 turns sound off and remembers that too');
    ok(errors.length === 0, 'no console errors in the ride view (' + errors.length + ')' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
  // ---------- B. sound remembered between visits
  if (ONLY.includes('B')) {
    for (const [what, tapSound] of [['a tap on the 3D view', false], ['a tap on 🔇 itself', true]]) {
      const { browser, page, errors } = await open(F, { w: 390, h: 844, storage: { 'coasterlab.v10.sound': 'true', 'coasterlab.v7.vol': JSON.stringify({ master: .8, scream: .4 }) } });
      const X = (f, a) => page.evaluate(f, a); let s = await X(SN);
      if (!tapSound) { ok(!s.ctx && !s.on && s.resume, 'sound was on last visit: still silent until the first tap (browser rule)'); ok(s.vol === .4, 'the saved Rider screams volume comes back (40%)') }
      if (tapSound) await page.click('#sound'); else await page.mouse.click(195, 300);
      await page.waitForTimeout(500); s = await X(SN);
      ok(s.on && s.ctx && !s.resume && s.saved === true, what + ' turns it back on (and only once)');
      ok(errors.length === 0, 'no console errors (' + errors.length + ')');
      await browser.close();
    }
  }
  // ---------- C. My Park (phone size)
  if (ONLY.includes('C')) {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 });
    const X = (f, a) => page.evaluate(f, a), T = 'window.__coasterDebug.v80.v10.ty';
    await X(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox')); await page.waitForTimeout(800);
    let s = await X(SN);
    ok(s.btn && /🔇/.test(s.btn) && /Sound/.test(s.btn), 'My Park has a Sound button (' + s.btn + ')');
    await page.click('#tySnd'); await page.waitForTimeout(500); s = await X(SN);
    ok(s.on && /🔊/.test(s.btn) && s.saved === true, 'the My Park button turns sound on (' + s.btn + ')');
    ok(s.mood === 'bright', 'park music: bright by day (' + s.mood + ')');
    ok(s.parkNodes, 'the My Park sound layer is running');
    // a big coaster with a path, then visitors
    let co = null; for (const k of ['Looping Adventure', 'Glacier Hyperion', 'Titan']) { const r = await X(L.place, ['c:' + k, 30, 36, 8]); if (r.ok) { const pc = await X(L.connect, [r.id]); if (pc >= 0) { co = { ...r, name: k }; break } await X(id => window.__coasterDebug.v80.v10.ty.remove(id), r.id) } }
    ok(!!co, 'a big coaster is built and connected: ' + (co ? co.name : 'none fitted'));
    await X(() => { const t = window.__coasterDebug.v80.v10.ty; t.spawn(40); t.ff(30) });
    s = await X(SN); ok(s.crowd > 0, 'the crowd murmur follows the visitors (level ' + s.crowd + ')');
    if (co) {
      await X(() => window.__coasterDebug.v80.v10.ty.speed(4));
      const run = await waitFor(page, () => window.__coasterDebug.v80.v10.snd.state().prT > 0, null, 60000);
      ok(run, 'a running coaster rumbles near the camera (' + (await X(SN)).prT + ')');
      await X(() => window.__coasterDebug.v80.v10.snd.reset());
      const scr = await waitFor(page, () => window.__coasterDebug.v80.v10.snd.state().n > 0, null, 120000); s = await X(SN);
      ok(scr, 'its riders scream on the drop, heard from the park view (' + JSON.stringify(s.last) + ')');
      // ride along
      await X(id => { const t = window.__coasterDebug.v80.v10.ty; t.sel(id); t.act('pov') }, co.id); await X(() => window.__coasterDebug.v80.v10.ty.speed(1));
      const pov = await waitFor(page, () => { const q = window.__coasterDebug.v80.v10.snd.state(); return q.pwT > 0 && q.povV > 5 }, null, 90000); s = await X(SN);
      ok(pov, 'riding it: wind rises with its speed (' + s.povV + ' m/s, wind ' + s.pwT + ')');
      await X(() => window.__coasterDebug.v80.v10.ty.act('povx')).catch(() => {});
    }
    await X(() => window.__coasterDebug.v80.v10.ty.time(23 * 60)); await page.waitForTimeout(3000); s = await X(SN);
    ok(s.mood === 'space' || s.mood === 'bright', 'park music mood at night: ' + s.mood);
    await X(() => window.__coasterDebug.v80.v10.ty.exit()); await page.waitForTimeout(800); s = await X(SN);
    ok(!s.parkNodes && s.prT === 0, 'leaving My Park stops its sound layer');
    ok(errors.length === 0, 'no console errors in My Park (' + errors.length + ')' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await browser.close();
  }
  console.log(fails ? fails + ' failed' : 'all passed'); process.exit(fails ? 1 : 0);
})();
