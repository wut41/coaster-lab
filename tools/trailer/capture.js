// Records in-game footage for the Coaster Lab trailer: real rides, the real My Park, a real Disaster Mode derail.
// The page runs on a virtual clock (requestAnimationFrame + performance.now are stepped by this script), so every
// frame is exact even on a slow software-rendered machine. Frames are JPEGs read straight off the game canvas, so no
// buttons or panels are in the shot.
//   node tools/trailer/capture.js [shot names...]       env: W=1280 H=720 FPS=30 OUT=tools/trailer/frames
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { open } = require(path.join(ROOT, 'tests', 'harness'));
const L = require(path.join(ROOT, 'tests', 'tools', 'park_lib'));
const W = +process.env.W || 1280, H = +process.env.H || 720, FPS = +process.env.FPS || 30, SUB = 2;   // 2 sim steps per frame
const OUT = process.env.OUT || path.join(__dirname, 'frames');

// virtual clock, installed before the game loads; off until __vcStart()
function VCLOCK() {
  const rN = performance.now.bind(performance), rRAF = window.requestAnimationFrame.bind(window), V = { on: false, t: 0, q: [] };
  performance.now = () => V.on ? V.t : rN();
  window.requestAnimationFrame = cb => { if (V.on) { V.q.push(cb); return V.q.length } return rRAF(cb) };
  window.__vcStart = () => { if (!V.on) { V.t = rN(); V.on = true } };
  window.__vcStep = ms => { V.t += ms; const q = V.q; V.q = []; for (const f of q) { try { f(V.t) } catch (e) { console.error(e) } } };
  window.__vcFrame = (ms, n, q) => { for (let k = 0; k < n; k++) window.__vcStep(ms / n); const c = document.querySelector('#scene canvas'); return c.toDataURL('image/jpeg', q) };
}
const D = 'window.__coasterDebug';
const ride = name => `(()=>{const r=${D}.v80.v10.rides().find(r=>r.name===${JSON.stringify(name)});return r?r.i:0})()`;

// each shot: setup (real time, before the clock is frozen), pre = seconds of virtual time to run before recording,
// sec = recorded length. cam: orbit | chase | ride | side | front
const SHOTS = {
  loop:   { setup: `${D}.select(0)`, cam: 'side', lead: .5, pre: 0, sec: 8 },
  hyper:  { setup: `${D}.select(${ride('Nova Giant')})`, cam: 'ride', lead: 1.2, pre: 0, sec: 6 },
  wing:   { setup: `${D}.select(${ride('Aurora Wing')})`, cam: 'side', lead: -1, pre: 0, sec: 3 },
  manta:  { setup: `${D}.select(${ride('Sky Manta')})`, cam: 'front', lead: -1.5, pre: 0, sec: 3 },
  spin:   { setup: `${D}.select(${ride('Cheddar Chase')})`, cam: 'chase', lead: -1, pre: 0, sec: 3 },
  lift:   { setup: `${D}.select(0)`, cam: 'front', lead: 3.5, pre: 0, sec: 3.5 },
  crash:  { setup: 'crash', pre: 0, sec: 5 },
};

async function frames(page, name, sec, pre) {
  const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const ms = 1000 / FPS;
  await page.evaluate(() => window.__vcStart());
  for (let k = 0; k < Math.round(pre * FPS); k++) await page.evaluate(([ms, n]) => { for (let i = 0; i < n; i++) window.__vcStep(ms / n) }, [ms, SUB]);
  await page.evaluate(([ms, n]) => window.__vcFrame(ms, n, .5), [ms, SUB]);   // warm-up (first grab can be blank)
  const n = Math.round(sec * FPS), t0 = Date.now();
  for (let k = 0; k < n; k++) {
    if (k % 10 === 0) await page.evaluate(() => { try { window.__coasterDebug.v80.v10.gfx.auto(0) } catch (e) {} });
    const url = await page.evaluate(([ms, n]) => window.__vcFrame(ms, n, .92), [ms, SUB]);
    fs.writeFileSync(path.join(dir, String(k).padStart(4, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(`${name}: ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

(async () => {
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of want) {
    const S = SHOTS[name]; if (!S) { console.log('no shot ' + name); continue }
    const { browser, page, errors } = await open(path.join(ROOT, 'coaster_lab_v10_0.html'), { w: W, h: H, mobile: false, init: VCLOCK });
    const X = (f, a) => page.evaluate(f, a);
    if (S.setup === 'crash') {
      // Disaster Mode on (same way a player turns it on), then the classic Looping Adventure: it flies off the loop
      const tap = q => X(q => document.querySelector(q).click(), q);
      await tap('#parkBtn'); await page.waitForTimeout(300); await tap('[data-hub="dz86"]'); await page.waitForTimeout(400);
      await tap('[data-dz86="on"]'); await page.waitForTimeout(300); await X(() => document.querySelector('#ov7X').click());
      await X(() => window.__coasterDebug.select(0)); await page.waitForTimeout(3300);
      // run up to ~2.5 s before the wheels let go, then record the derail in real (virtual) time
      
      const pr = await X(() => window.__coasterDebug.v80.v86.pred()); console.log('crash prediction', JSON.stringify(pr));
      await X(ps => { const d = window.__coasterDebug; for (let i = 0; i < 3000; i++) { const z = d.v80.v86.dz(); if (z.phase !== '' || z.s >= ps - 2.4 * Math.max(z.v, 6)) break; d.v72.ff(.05) } }, (pr && pr.s) || 1e9);
      await X(() => { const b = document.querySelector('[data-cam="chase"]'); if (b) b.click() });
    } else if (S.setup === 'park') {
      await X(() => window.__coasterDebug.v80.v10.ty.fresh('sandbox')); await page.waitForTimeout(800);
      await X(() => window.__coasterDebug.v80.v10.ty.path(24, 45, 24, 30));
      for (const q of [['c:Mine Mountain', 30, 34, 12], ['burger', 25, 40, 3], ['drinks', 23, 38, 3], ['carousel', 19, 40, 4], ['teacups', 19, 34, 4], ['bench', 25, 36, 2], ['tree', 28, 44, 3], ['tree', 20, 45, 3]]) { const b = await X(L.place, q); if (b.ok && b.id != null) await X(L.connect, [b.id]) }
      await X(() => { const T = window.__coasterDebug.v80.v10.ty; T.time(14 * 60); T.spawn(40); T.ff(40); T.spawn(30); T.ff(15); T.cam(26, 36, 34, .42, .9); T.speed(1) });
      await page.waitForTimeout(1500);
    } else {
      // dry run to find when the train tips over the first crest, then restart the ride and fast-forward to just before it
      const sel = await X(S.setup + ';0') ; await page.waitForTimeout(3300);
      const tip = await X(() => { const d = window.__coasterDebug; let t = 0, lift = 0; for (let k = 0; k < 900; k++) { d.v72.ff(.1); t += .1; const v = d.v80.v86.dz().v; if (t > 2 && t < 4) lift = Math.max(lift, v); if (t > 4 && v > lift + 1.2) return t } return 8 });
      await X(S.setup); await page.waitForTimeout(3300);
      await X(c => { const b = document.querySelector('[data-cam="' + c + '"]'); if (b) b.click() }, S.cam);
      const lead = S.lead == null ? 1.2 : S.lead;
      await X(n => { if (n > 0) window.__coasterDebug.v72.ff(n) }, Math.max(0, tip - lead));
      console.log(name + ' tip at ' + tip.toFixed(1) + ' s, now', JSON.stringify(await X(() => { const z = window.__coasterDebug.v80.v86.dz(); return [z.s, z.v] })));
    }
    // nothing but the 3D view: hide the page's panels in case a canvas grab ever includes them
    await frames(page, name, S.sec, S.pre);
    if (errors.length) console.log(name + ' page errors:', errors.slice(0, 3).join(' | ').slice(0, 600));
    await browser.close();
  }
})();
