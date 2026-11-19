// Capture helpers for the Coaster Lab trailer.
//  - footage: Playwright fake clock + a manual requestAnimationFrame queue, so every
//    video frame is exactly one game frame (1/30 s of game time) and one WebGL draw.
//    Math.random is seeded, so every capture is reproducible.
//  - stills: the real game UI at 2x device pixels, in normal (real) time.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const GAME = path.resolve(__dirname, '../../coaster_lab_v8_6.html');
const THREE_JS = fs.readFileSync(path.join(__dirname, 'node_modules/three/build/three.module.js'));
const FPS = 30;

async function boot({ w = 1920, h = 1080, dpr = 1, fake = true, skipStart = true, seed = 7, storage = {} } = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('three@0.160.0/build/three.module.js')) return r.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS, headers: { 'access-control-allow-origin': '*' } });
    if (u.startsWith('https://coaster.test/')) return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(GAME) });
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) return r.continue(); // real fonts (Exo 2 / Nunito Sans)
    return r.abort();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // install + pause: fake time must NOT flow with real time (renders take ~1.5 s), it only moves when we step it
  if (fake) { await page.clock.install({ time: new Date('2026-11-18T15:00:00Z') }); await page.clock.pauseAt(new Date('2026-11-18T15:00:01Z')); }
  await ctx.addInitScript(([st, seed, skipStart, manualFromStart]) => {
    window.__coasterTestHarness = true;
    let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    try { localStorage.setItem('coasterlab.skipStart', skipStart ? '1' : ''); for (const k in st) localStorage.setItem(k, st[k]); } catch (e) {}
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, o) { if (t === 'webgl2' || t === 'webgl') o = Object.assign({}, o, { preserveDrawingBuffer: true }); return orig.call(this, t, o); };
    let q = []; window.__manual = false; const raf0 = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => { if (window.__manual) { q.push(cb); return q.length; } return raf0(cb); };
    window.__tick = () => { const c = q; q = []; const t = performance.now(); for (const f of c) f(t); return c.length; };
  }, [storage, seed, skipStart, fake]);
  await page.goto('https://coaster.test/coaster_lab_v8_6.html');
  for (let i = 0; i < 600; i++) {
    if (await page.evaluate(() => window.__booted === true)) break;
    if (fake) await page.clock.runFor(50); else await page.waitForTimeout(100);
  }
  if (fake) await page.clock.runFor(100); else await page.waitForTimeout(1500);
  if (!fake) await page.evaluate(() => document.fonts && document.fonts.ready);
  const X = (f, a) => page.evaluate(f, a);
  const env = { browser, page, X, errors, fake };
  // switch to manual frames: from now on, one tick = one game frame
  env.manual = async () => { await X(() => { window.__manual = true }); await page.clock.runFor(100); };
  // advance n video frames (each = clock +1/30 s, then one game frame)
  env.step = async (n = 1) => { for (let i = 0; i < n; i++) { await page.clock.runFor(1000 / FPS); await X(() => window.__tick()); } };
  return env;
}

// Hide every piece of game UI (clean plate).
async function clean(page, on = true) {
  await page.evaluate(on => {
    let s = document.getElementById('__clean');
    if (!s) { s = document.createElement('style'); s.id = '__clean'; document.head.appendChild(s); }
    s.textContent = on ? 'body > *:not(canvas){display:none !important}' : '';
  }, on);
}

async function grab(page, file) {
  const d = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', 0.94));
  fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64'));
}

// Record n frames of the clean WebGL canvas into dir.
async function record(env, dir, n, { before, after } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    if (before) await before(i);
    await env.step(1);
    await grab(env.page, path.join(dir, String(i).padStart(4, '0') + '.jpg'));
    if (after) await after(i);
    if (i % 30 === 29) console.log(path.basename(dir), i + 1, '/', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
}
module.exports = { boot, clean, record, grab, FPS };
