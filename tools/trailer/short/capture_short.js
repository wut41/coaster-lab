// Portrait (9:16) gameplay capture for the Coaster Lab YouTube Short. Based on tools/trailer/capture.js:
// same virtual clock (every frame exact on a software renderer), plus:
//  - camera switches blend over ~2 s; the blend is finished on a tiny viewport (fast frames) before recording
//  - optional Holiday Mode, latest build by default, single sim step per frame (SUB=1) for speed
//   node tools/trailer/short/capture_short.js [shot ...]     env: W=720 H=1280 FPS=30 SUB=1 OUT=<dir> BUILD=builds/coaster_lab_v10_10_1.html
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const { open } = require(path.join(ROOT, 'tests', 'harness'));
const W = +process.env.W || 720, H = +process.env.H || 1280, FPS = +process.env.FPS || 30, SUB = +process.env.SUB || 1;
const OUT = process.env.OUT || path.join(__dirname, 'frames');
const BUILD = path.join(ROOT, process.env.BUILD || 'builds/coaster_lab_v10_10_1.html');

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

// lead = seconds before the train tips over the first crest that recording starts (negative = after)
const SHOTS = {
  hyper: { sel: ride('Nova Giant'), cam: 'ride', lead: 0.95, sec: 3.4 },
  loop:  { sel: '0', cam: 'side', lead: .5, sec: 5 },
  wing:  { sel: ride('Aurora Wing'), cam: 'side', lead: -1, sec: 1.5 },
  manta: { sel: ride('Sky Manta'), cam: 'front', lead: -1.5, sec: 1.5 },
  spin:  { sel: ride('Cheddar Chase'), cam: 'chase', lead: -1, sec: 1.5 },
  snow:  { sel: ride('Thunder Comet'), cam: 'chase', lead: 0.6, sec: 2.6, hol: true },
  snow2: { sel: ride('Little Dipper'), cam: 'chase', lead: 0.4, sec: 3, hol: true },
  crash: { crash: true, sec: 4 },
};

async function frames(page, name, sec) {
  const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const ms = 1000 / FPS;
  await page.evaluate(() => window.__vcStart());
  await page.evaluate(([ms, n]) => window.__vcFrame(ms, n, .5), [ms, SUB]);   // warm-up (first grab can be blank)
  const n = Math.round(sec * FPS), t0 = Date.now();
  for (let k = 0; k < n; k++) {
    if (k % 10 === 0) await page.evaluate(() => { try { window.__coasterDebug.v80.v10.gfx.auto(0) } catch (e) {} });
    const url = await page.evaluate(([ms, n]) => window.__vcFrame(ms, n, .92), [ms, SUB]);
    fs.writeFileSync(path.join(dir, String(k).padStart(4, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
    if (k % 15 === 0) console.log(`${name}: frame ${k}/${n}`);
  }
  console.log(`${name}: ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

(async () => {
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of want) {
    const S = SHOTS[name]; if (!S) { console.log('no shot ' + name); continue }
    const { browser, page, errors } = await open(BUILD, { w: W, h: H, mobile: false, init: VCLOCK });
    const X = (f, a) => page.evaluate(f, a);
    const small = () => page.setViewportSize({ width: 90, height: 160 }), full = () => page.setViewportSize({ width: W, height: H });
    const cam = c => X(c => { const b = document.querySelector('[data-cam="' + c + '"]'); if (b) b.click() }, c);
    const xf = () => X(() => window.__coasterDebug.cine().xf);
    if (!S.crash) await small();   // crash: keep the original full-size flow (real frames stay slow, so the ride doesn't run ahead)
    if (S.hol) { await X(() => window.__coasterDebug.v80.v10.hol.set('on')); await page.waitForTimeout(4000) }
    if (S.crash) {
      // Disaster Mode on (same way a player turns it on), then the classic Looping Adventure flies off the loop
      const tap = q => X(q => document.querySelector(q).click(), q);
      await tap('#parkBtn'); await page.waitForTimeout(300); await tap('[data-hub="dz86"]'); await page.waitForTimeout(400);
      await tap('[data-dz86="on"]'); await page.waitForTimeout(300); await X(() => document.querySelector('#ov7X').click());
      await X(() => window.__coasterDebug.select(0)); await page.waitForTimeout(3300);   // chase is already the default camera: no switch, no blend
      const pr = await X(() => window.__coasterDebug.v80.v86.pred()); console.log('crash prediction', JSON.stringify(pr));
      await X(ps => { const d = window.__coasterDebug; for (let i = 0; i < 3000; i++) { const z = d.v80.v86.dz(); if (z.phase !== '' || z.s >= ps - 2.0 * Math.max(z.v, 6)) break; d.v72.ff(.05) } }, (pr && pr.s) || 1e9);
    } else {
      // dry run to find when the train tips over the first crest, then restart and fast-forward to just before it
      await X(`${D}.select(${S.sel});0`); await cam(S.cam); await page.waitForTimeout(3300); await full(); await page.waitForTimeout(800);
      const tip = await X(() => { const d = window.__coasterDebug; let t = 0, lift = 0; for (let k = 0; k < 900; k++) { d.v72.ff(.1); t += .1; const v = d.v80.v86.dz().v; if (t > 2 && t < 4) lift = Math.max(lift, v); if (t > 4 && v > lift + 1.2) return t } return 8 });
      await small(); await X(`${D}.select(${S.sel});0`); await cam(S.cam); await page.waitForTimeout(3300); await full(); await page.waitForTimeout(800);
      await X(n => { if (n > 0) window.__coasterDebug.v72.ff(n) }, Math.max(0, tip - S.lead));
      console.log(name + ' tip at ' + tip.toFixed(1) + ' s');
    }
    for (let k = 0; k < 40 && (await xf()) < 1; k++) await page.waitForTimeout(250);   // let the camera blend finish
    console.log(name + ' camera blend', (await xf()).toFixed(3), JSON.stringify(await X(() => { const q = window.__coasterDebug.cine(); return { on: q.on, mode: q.mode } })));
    if (S.hol) console.log(name + ' holiday', JSON.stringify(await X(() => { const h = window.__coasterDebug.v80.v10.hol.state(); return { on: h.on, coated: h.coated, hats: h.hatsNow, rails: h.rails, flakes: h.flakes } })));
    await frames(page, name, S.sec);
    if (errors.length) console.log(name + ' page errors:', errors.slice(0, 3).join(' | ').slice(0, 600));
    await browser.close();
  }
})();
