// The first-visit trailer: plays once before the title screen, can be skipped, remembers it was seen, can be watched again,
// and never keeps anyone from the game when the video can't load. The real video is swapped for a tiny test clip.
const { open } = require('./harness');
const fs = require('fs'), path = require('path');
const F = process.env.CL_FILE || path.join(__dirname, '..', 'coaster_lab_v10_0.html');
const CLIP = fs.readFileSync(path.join(__dirname, 'fixtures', 'trailer_test.webm'));
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  // 1. first visit, video blocked (no network): the trailer opens, then gets out of the way and counts as seen
  {
    const { browser, page, errors } = await open(F, { w: 1280, h: 720, mobile: false, skipStart: false, storage: { 'coasterlab.v10.trailerSeen': '' } });
    const st = await page.evaluate(() => ({ t: window.__trailer10, el: !!document.getElementById('trailer10'), seen: localStorage.getItem('coasterlab.v10.trailerSeen'), start: !document.getElementById('start').hidden }));
    ok(!st.el && st.t && /^error/.test(st.t.how), 'a video that cannot load closes the trailer by itself (' + JSON.stringify(st.t) + ')');
    ok(st.seen === '1' && st.start, 'it counts as seen and the title screen is there underneath');
    ok(await page.evaluate(() => !!document.querySelector('#start .stCtas [data-trailer10]')), 'title screen has a Watch the trailer button');
    await page.click('[data-trailer10]'); await page.waitForSelector('#trailer10 .tr10msg a', { timeout: 30000 }).catch(() => {});
    ok(await page.evaluate(() => !!document.querySelector('#trailer10 .tr10msg a[target=_blank]')), 'asking to watch it where it cannot play shows a link to watch it in a new tab');
    await page.click('#trailer10 .tr10skip'); await page.waitForTimeout(800);
    ok(await page.evaluate(() => !document.getElementById('trailer10')), 'and Skip still closes it');
    const real = errors.filter(e => !/Failed to load resource/.test(e));   // the blocked video itself
    ok(real.length === 0, 'no page errors' + (real.length ? ': ' + real.slice(0, 2).join(' | ') : ''));
    await browser.close();
  }
  // a returning player (trailer already seen) goes straight to the title screen
  {
    const { browser, page } = await open(F, { w: 1280, h: 720, mobile: false, skipStart: false });
    ok(await page.evaluate(() => !document.getElementById('trailer10') && !document.getElementById('start').hidden), 'a second visit goes straight to the title screen');
    await browser.close();
  }
  // 2. first visit with a working video: shows, Skip closes it and remembers it; rewatch works; it can end on its own
  {
    const { browser, ctx, page, errors } = await open(F, { w: 390, h: 844, mobile: true, skipStart: false, storage: { 'coasterlab.v10.trailerSeen': '' } });
    await ctx.route('**/*cloudfront.net/**', r => r.fulfill({ status: 200, contentType: 'video/webm', body: CLIP, headers: { 'access-control-allow-origin': '*' } }));
    errors.length = 0; await page.reload(); await page.waitForFunction(() => window.__booted === true, null, { timeout: 60000 });
    await page.waitForFunction(() => { const v = document.querySelector('#trailer10 video'); return v && v.currentTime > 0 }, null, { timeout: 30000 }).catch(() => {});
    let s = await page.evaluate(() => { const o = document.getElementById('trailer10'), v = o && o.querySelector('video'), sk = o && o.querySelector('.tr10skip'); const r = sk && sk.getBoundingClientRect(); return { o: !!o, playing: v && !v.paused, muted: v && v.muted, snd: o && !o.querySelector('.tr10snd').hidden, skip: r && r.width > 30 && r.top >= 0 && r.right <= innerWidth } });
    ok(s.o && s.playing, 'first visit plays the trailer over the title screen (' + JSON.stringify(s) + ')');
    ok(s.skip, 'Skip button is on screen on a phone');
    ok(!s.muted || s.snd, 'muted autoplay always shows a Tap for sound button');
    await page.click('#trailer10 .tr10skip'); await page.waitForTimeout(900);
    s = await page.evaluate(() => ({ o: !!document.getElementById('trailer10'), seen: localStorage.getItem('coasterlab.v10.trailerSeen'), start: !document.getElementById('start').hidden }));
    ok(!s.o && s.seen === '1' && s.start, 'Skip closes it, remembers it, and the title screen is there');
    await page.click('[data-trailer10]'); await page.waitForFunction(() => { const v = document.querySelector('#trailer10 video'); return v && v.currentTime > 0 }, null, { timeout: 30000 }).catch(() => {});
    s = await page.evaluate(() => { const v = document.querySelector('#trailer10 video'); return { o: !!v, playing: v && !v.paused } });
    ok(s.o && s.playing, 'Watch the trailer plays it again');
    await page.evaluate(() => { const v = document.querySelector('#trailer10 video'); v.currentTime = Math.max(0, v.duration - .6) });
    await page.waitForFunction(() => !document.getElementById('trailer10'), null, { timeout: 60000 }).catch(() => {});
    ok(await page.evaluate(() => !document.getElementById('trailer10') && window.__trailer10.how === 'end'), 'it fades out by itself at the end');
    await page.click('[data-trailer10]'); await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.waitForTimeout(800);
    ok(await page.evaluate(() => !document.getElementById('trailer10') && !document.getElementById('start').hidden), 'Escape skips it and leaves the title screen open');
    ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''));
    await browser.close();
  }
})();
