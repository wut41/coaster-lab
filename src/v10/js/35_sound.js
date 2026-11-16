// ---- 10.0 SOUND UPGRADE: rider screams on big drops, a My Park soundscape and a sound switch that remembers.
// Built on the 7.x Web Audio engine (everything is synthesized in code: no sound files, nothing to download).
//  · riders scream on steep fast drops and on launches (main ride, every park coaster, and the one you ride in My Park)
//  · My Park: rumble of the coasters near the camera, wind + lift-hill clicks when you ride one, a crowd that grows with
//    the visitors, background music that turns calm at night
//  · a 🔊 Sound button in My Park, a "Rider screams" slider + mute in ⚙ Settings → Sound
//  · "sound on" is remembered; browsers only allow audio after a tap, so it comes back on the first tap of the next visit
// Self-contained: older functions are wrapped (call the original, then add), never rewritten. Data: coasterlab.v10.sound.
const SND10 = { n: 0, last: null, voices: [], t: 0, gate: 0, clk: 0, tr: new WeakMap(), D: 55, prT: 0, pwT: 0, povV: 0,
  main: { p: null, r: 0, armed: true, cd: 0, zk: '' }, resume: false, x: null };
const V10s = new THREE.Vector3(), V10r = new THREE.Vector3();

// a mixer channel of its own for the riders (volume and mute are saved with the other channels)
if (!CH72.some(c => c[0] === 'scream')) { const i = CH72.findIndex(c => c[0] === 'fx'); CH72.splice(i < 0 ? CH72.length : i, 0, ['scream', 'Rider screams']) }
VOL7.scream = .7; { const sv = LS7('vol', {}); if (sv && typeof sv === 'object' && isN7(sv.scream)) VOL7.scream = clamp(sv.scream, 0, 1); const m = LS72('mute', {}); if (obj72(m) && m.scream === true) MUTE72.scream = true }

// lazy nodes: the scream bus always (cheap: one gain), the My Park rumble + wind only while My Park is open
function sndBus10() { if (!au) return null; if (!au.x10) au.x10 = { scream: au.G(0, au.out), pk: null }; return au.x10 }
function sndParkOn10(x) { if (x.pk) return x.pk; const k = {}; k.r = au.G(0, au.ride); k.rLP = au.F('lowpass', 160, .8, k.r); k.rs = au.S(au.brown); k.rs.connect(k.rLP); k.rs.start(0, 1.1);
  k.w = au.G(0, au.wind); k.wBP = au.F('bandpass', 600, .6, k.w); k.ws = au.S(au.white); k.ws.connect(k.wBP); k.ws.start(0, 2.3); x.pk = k; return k }
function sndParkOff10(x) { if (!x || !x.pk) return; const k = x.pk; x.pk = null; [k.rs, k.ws].forEach(s_ => { try { s_.stop() } catch (e) {} }); [k.r, k.w].forEach(g => { try { g.disconnect() } catch (e) {} }) }

// ---- one scream: a few rider voices (sawtooth through "aah" formants, pitch swoop + vibrato, a breath of noise)
// int 0..1 = how loud, pan -1..1 = left/right, far 0..1 = distance (far screams lose their top end)
function scream10(int, pan, far) {
  const x = sndBus10(); if (!x || !auOn || vol72('scream') <= 0 || !(int > .03)) return false;
  const c = au.c, now = c.currentTime; SND10.voices = SND10.voices.filter(t => t > now);
  const low = gq === 'low', k = Math.min(low ? 2 : 3, (low ? 3 : 6) - SND10.voices.length); if (k <= 0) return false;
  let out = au.G(1, null), tail = out;
  if (far > .05) { const lp = au.F('lowpass', 6500 - clamp(far, 0, 1) * 5000, .7, null); tail.connect(lp); tail = lp }
  if (c.createStereoPanner && Math.abs(pan) > .05) { const pn = c.createStereoPanner(); pn.pan.value = clamp(pan, -1, 1); tail.connect(pn); tail = pn }
  tail.connect(x.scream); let end = now;
  for (let i = 0; i < k; i++) {
    const at = now + (i ? rnd7(.03, .22) : 0), dur = rnd7(1.1, 1.9) * (.75 + .25 * int), f0 = i === 2 ? rnd7(300, 420) : rnd7(470, 820);
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * .8, at); o.frequency.exponentialRampToValueAtTime(f0 * 1.25, at + .18);
    o.frequency.linearRampToValueAtTime(f0 * 1.1, at + dur * .7); o.frequency.exponentialRampToValueAtTime(f0 * .72, at + dur);
    const lf = c.createOscillator(), lg = au.G(f0 * .035); lf.frequency.value = rnd7(5.5, 7.5); lf.connect(lg); lg.connect(o.frequency);
    const vg = au.G(0, out), pk = .4 * int; [[rnd7(760, 950), 6, 1], [rnd7(1150, 1500), 8, .8], [rnd7(2500, 2900), 10, .35]].forEach(([f, q, a]) => { const bp = au.F('bandpass', f, q, null), ag = au.G(a, vg); o.connect(bp); bp.connect(ag) });
    vg.gain.setValueAtTime(0, at); vg.gain.linearRampToValueAtTime(pk, at + .08); vg.gain.setValueAtTime(pk, at + dur * .55); vg.gain.exponentialRampToValueAtTime(.001, at + dur);
    o.start(at); lf.start(at); o.stop(at + dur + .05); lf.stop(at + dur + .05); SND10.voices.push(at + dur); end = Math.max(end, at + dur);
  }
  burst(.5, 'highpass', 2200, .04 * int, out);
  SND10.n++; SND10.last = { int: +int.toFixed(2), pan: +pan.toFixed(2), far: +far.toFixed(2), voices: k }; return true;
}

// descent of a moving point: >0 going down (1 = straight down), <0 climbing. Smoothed so one bump is not a drop.
function sndSlope10(st, p, step) { let ok = false; if (st.p) { const dx = p.x - st.p.x, dy = p.y - st.p.y, dz = p.z - st.p.z, d = Math.hypot(dx, dy, dz);
  if (d > 1e-4 && d < 400 * step) { st.r = st.r * .5 + (-dy / d) * .5; ok = true } else if (d >= 400 * step) st.r = 0 } st.p = { x: p.x, y: p.y, z: p.z }; return ok }
// a drop starts when the train points steeply down at speed; it re-arms once the train levels out again
function sndDrop10(st, vReal, step) { st.cd -= step; if (st.armed && st.r > .5 && vReal > 11) { st.armed = false; st.cd = 1.5; return true } if (!st.armed && st.r < .12 && st.cd <= 0) st.armed = true; return false }

// ---- the main ride (the normal ride view)
function sndMain10(step) {
  const M = SND10.main; if (!playing || editing || labOpen || !P || !cars[0] || TY.on) { M.p = null; M.r = 0; M.zk = ''; return }
  sndSlope10(M, cars[0].position, step); const zk = zoneAt7(s);
  if (sndDrop10(M, v, step)) scream10(clamp((v - 8) / 22, .3, 1) * clamp((M.r - .3) / .45, .5, 1), 0, 0);
  else if (zk === 'launch' && M.zk !== 'launch' && v < 12) scream10(.75, 0, 0);
  M.zk = zk;
}

// ---- My Park: every coaster train that is running (sound falls off with distance from the camera)
function sndPark10(step) {
  const x = sndBus10(); if (!x) return; if (!TY.on || !TY.park) { sndParkOff10(x); SND10.prT = SND10.pwT = 0; return }
  const k = sndParkOn10(x), c = au.c, t = c.currentTime, cam = camera.position, pov = TY.pov ? TY.objById.get(TY.pov) : null;
  V10r.set(1, 0, 0).applyQuaternion(camera.quaternion);
  let rum = 0, wnd = 0, povV = 0, climb = false;
  for (const o of TY.park.objs) {
    const R = o.rt; if (!R || !R.trains) continue; let p = null; try { p = objInfo10(o).prof } catch (e) {} if (!p || !p.lapT) continue;
    for (const tr of R.trains) {
      let st = SND10.tr.get(tr); if (!st) { st = { p: null, r: 0, armed: true, cd: 0 }; SND10.tr.set(tr, st) }
      if (tr.ph !== 'run' || !tr.cars || !tr.cars[0] || !(TY.park.speed > 0)) { st.p = null; st.r = 0; continue }
      tr.cars[0].getWorldPosition(V10s); sndSlope10(st, V10s, step);
      const vR = Math.max(0, (lapS10(p, tr.tau + .05) - lapS10(p, tr.tau)) / .05), me = pov === o && tr === R.trains[0];
      const d = me ? 0 : V10s.distanceTo(cam), att = me ? 1 : 1 / (1 + (d / SND10.D) ** 2);
      rum += att * clamp(vR / 25, 0, 1) * (tr.riders.length ? 1 : .6);
      if (me) { povV = vR; wnd = clamp((vR / 30) ** 2, 0, 1); climb = st.r < -.25 && vR < 7 }
      if (sndDrop10(st, vR, step) && tr.riders.length && t >= SND10.gate) {
        const full = clamp(tr.riders.length / Math.max(1, p.seats || 8) + .35, .35, 1), int = clamp((vR - 8) / 22, .3, 1) * full * att;
        if (int > .04) { V10s.sub(cam); const pan = me ? 0 : clamp(V10s.normalize().dot(V10r), -1, 1) * .8; if (scream10(int, pan, me ? 0 : clamp(d / (SND10.D * 3), 0, 1))) SND10.gate = t + .5 }
      }
    }
  }
  const on = auOn && !document.hidden; SND10.prT = on ? clamp(rum, 0, 1) * .3 : 0; SND10.pwT = on ? wnd * .6 : 0; SND10.povV = povV;
  k.r.gain.setTargetAtTime(SND10.prT, t, .15); k.rLP.frequency.setTargetAtTime(120 + clamp(rum, 0, 1) * 500 + povV * 20, t, .15);
  k.w.gain.setTargetAtTime(SND10.pwT, t, .12); k.wBP.frequency.setTargetAtTime(450 + povV * 45, t, .12);
  if (on && climb) { SND10.clk -= step; if (SND10.clk <= 0) { SND10.clk = .42; click7(.5) } } else SND10.clk = 0;
  if (au.mG) au.mG.gain.setTargetAtTime(0, t, .3);// the ride-view station murmur stays quiet in My Park (the park crowd takes over)
}

function snd10(dt) { if (!au) return; SND10.t -= dt; if (SND10.t > 0) return; const step = .05 - Math.min(0, SND10.t); SND10.t = .05;
  const x = sndBus10(); x.scream.gain.setTargetAtTime(vol72('scream'), au.c.currentTime, .12); sndMain10(step); sndPark10(step) }

// ---- wrap the 7.x engine: tick, crowd (follows My Park's visitors), music mood (My Park: bright by day, calm at night)
{ const f0 = audioTick; audioTick = function (dt) { f0(dt); try { snd10(dt) } catch (e) { console.warn('10.0 sound', e) } } }
{ const f0 = crowdLevel72; crowdLevel72 = function () { if (TY.on && TY.park) { const n = TY.guests.length; if (!n) return 0; return clamp(n / 80, .06, 1) * clamp(1.25 - camera.position.y / 160, .15, 1) } return f0() } }
{ const f0 = moodKey72; moodKey72 = function () { if (TY.on) return TY.lt && TY.lt.night > .6 ? 'space' : W7.storm ? 'haunted' : 'bright'; return f0() } }

// ---- the Sound switch: remembered, mirrored on a My Park button
function sndSync10() { const b = document.getElementById('tySnd'); if (!b) return; b.querySelector('i').textContent = auOn ? '🔊' : '🔇'; b.setAttribute('aria-pressed', auOn ? 'true' : 'false'); b.disabled = !!auBad }
{ const f0 = soundToggle; soundToggle = function (force) { f0(force); if (!auBad) SS10('sound', !!auOn); sndSync10() } }
function sndBtn10() { const side = document.getElementById('tySide'); if (!side || document.getElementById('tySnd')) return;
  const b = document.createElement('button'); b.className = 'tyB'; b.id = 'tySnd'; b.type = 'button'; b.title = 'Sound on or off'; b.setAttribute('aria-label', 'Sound on or off'); b.innerHTML = '<i>🔇</i><span>Sound</span>';
  b.addEventListener('click', e => { e.stopPropagation(); soundToggle() }); side.insertBefore(b, side.querySelector('[data-ty="exit"]')); sndSync10() }
sndBtn10();
// sound was on last time: browsers need a tap before audio can start, so the first tap (or key) turns it back on
if (LS10('sound', false) === true) { SND10.resume = true; const EV = ['pointerup', 'touchend', 'keydown'], off = () => EV.forEach(n => removeEventListener(n, go, true));
  function go(e) { off(); SND10.resume = false; if (e && e.target && e.target.closest && e.target.closest('#sound,#tySnd')) return;// that tap toggles it already
    if (!auOn && !auBad) try { soundToggle(true) } catch (er) {} }
  EV.forEach(n => addEventListener(n, go, true)) }

// test hooks
DBG10.snd = {
  state: () => { const x = au && au.x10; return { ctx: !!au, run: au ? au.c.state : null, on: auOn, bad: auBad, saved: LS10('sound', null), resume: SND10.resume, n: SND10.n, last: SND10.last, voices: SND10.voices.length,
    ch: CH72.map(c => c[0]), vol: VOL7.scream, mute: !!MUTE72.scream, parkNodes: !!(x && x.pk), prT: +SND10.prT.toFixed(3), pwT: +SND10.pwT.toFixed(3), povV: +SND10.povV.toFixed(1),
    crowd: +crowdLevel72().toFixed(3), mood: moodKey72(), btn: (document.getElementById('tySnd') || {}).textContent || null, main: { r: +SND10.main.r.toFixed(2), armed: SND10.main.armed } } },
  scream: (i, pan, far) => scream10(i == null ? 1 : i, pan || 0, far || 0), reset: () => { SND10.n = 0; SND10.last = null }
};
