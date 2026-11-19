// Records clean-plate gameplay clips into ../public/footage/<clip>/0000.jpg …
// usage: node footage.js <clip> [frames-override]
const path = require('path');
const { boot, clean, record } = require('./lib');
const OUT = path.join(__dirname, '../public/footage');

// fast-forward game physics (no rendering) until ride time >= t
const ffTo = (e, t) => e.X(t => { const d = window.__coasterDebug; for (let i = 0; i < 2000 && d.state().rideT < t; i++) d.v72.ff(0.025); }, t);
// the station dispatch countdown (hold7) only drains in real frames, and v72.ff skips it: drain it with one long frame
const drainHold = async (e) => { for (let i = 0; i < 5; i++) { const h = await e.X(() => window.__coasterDebug.v7.hold()); if (!(h > 0)) return; await e.page.clock.runFor(h * 1000 + 50); await e.X(() => window.__tick()); } };
const SETTLE = 15; // frames for the camera blend to settle before recording

const CLIPS = {
  // front-row POV: lift crest → first drop → vertical loop (Looping Adventure, ride time 7.0–12.6 s)
  pov: { n: 168, async setup(e) {
    await e.X(() => { const d = window.__coasterDebug; d.select(0); d.v72.useCam('ride'); });
    await e.manual(); await e.step(2); await drainHold(e); await ffTo(e, 7.0 - SETTLE / 30); await e.step(SETTLE);
  } },
  // chase camera through the vertical loop (ride time 9.6–13.0 s)
  loop: { n: 102, async setup(e) {
    await e.X(() => { const d = window.__coasterDebug; d.select(0); d.v72.useCam('chase'); });
    await e.manual(); await e.step(2); await drainHold(e); await ffTo(e, 9.6 - SETTLE / 30); await e.step(SETTLE);
  } },
  // cinematic park flyby (the game's own Cinema camera)
  cine: { n: 120, async setup(e) {
    await e.X(() => { const d = window.__coasterDebug; d.select(0); });
    await e.manual(); await e.step(2); await drainHold(e); await ffTo(e, 9);
    await e.X(() => window.__coasterDebug.v72.cineOn(true)); await e.step(45);
  } },
  // Moon gravity (realistic): chase camera over the crest and the floaty first drop
  moon: { n: 132, async setup(e) {
    await e.X(() => { const d = window.__coasterDebug; d.v80.v86.setGrav('moon', null, true); d.select(0); d.v72.useCam('chase'); });
    await e.manual(); await e.step(2); await drainHold(e);
    // start just before the crest (s ~ 29 m)
    await e.X(() => { const d = window.__coasterDebug; for (let i = 0; i < 4000 && d.state().s < 27; i++) d.v72.ff(0.025); });
    await e.step(SETTLE);
  } },
  // Disaster Mode: derail on the banked turn (s ~ 95 m), crash camera, parachuting riders
  crash: { n: 150, async setup(e) {
    await e.X(() => { const d = window.__coasterDebug; d.v80.v86.setDz(true); d.select(0); d.v72.useCam('chase'); });
    await e.manual(); await e.step(2); await drainHold(e);
    await e.X(() => { const d = window.__coasterDebug; for (let i = 0; i < 4000 && d.state().s < 84; i++) d.v72.ff(0.025); });
    await e.step(SETTLE);
  } },
};

(async () => {
  const name = process.argv[2], c = CLIPS[name];
  if (!c) throw new Error('clip? ' + Object.keys(CLIPS).join(' '));
  const n = +process.argv[3] || c.n;
  const env = await boot();
  await c.setup(env);
  console.log(name, 'recording from', JSON.stringify(await env.X(() => { const s = window.__coasterDebug.state(); return { rideT: +s.rideT.toFixed(2), s: +s.s.toFixed(1), v: +s.v.toFixed(1) }; })));
  await clean(env.page, true);
  await record(env, path.join(OUT, name), n, { before: c.before && (i => c.before(env, i)) });
  const info = await env.X(() => ({ st: window.__coasterDebug.state(), dz: window.__coasterDebug.v80.v86.dz().phase, cam: window.__coasterDebug.v72.cam().mode }));
  console.log(name, 'done', JSON.stringify(info), 'errors:', env.errors.slice(0, 3));
  await env.browser.close();
})();
