// ---- 10.0 art: neon Coaster Lab logo on the title screen, photo clouds in every sky, a real sunset sky and a grass
// detail map for the ground. The pictures were made with Higgsfield and live in src/v10/art; build.mjs inlines them
// as ART10_DATA and adds three small hooks (setSky size + clouds, grainTex). If a picture fails to load, the 9.0 look
// stays exactly as it was.
{
  const pic = src => { if (!src) return null; const i = new Image(); i.decoding = 'async'; i.src = src; return i };
  const ok = i => !!(i && i.complete && i.naturalWidth > 0);
  const IMG = { clouds: pic(ART10_DATA.clouds), sunset: pic(ART10_DATA.sunset), grass: pic(ART10_DATA.grass) };
  const hex = s => { s = String(s).replace('#', ''); if (s.length === 3) s = s.replace(/./g, ch => ch + ch); const n = parseInt(s, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255] };
  const lum = s => { const [r, g, b] = hex(s); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 };
  const mix = (p, q, t) => p.map((v, i) => Math.round(v + (q[i] - v) * t));
  const SUNSET = ['#24346e', '#e9805a'];          // the colours applyTod uses for the sunset time of day
  let last = null;                                 // the sky canvas drawn most recently, so late pictures can be added

  // clouds: one 1024x576 photo layer, tinted to the sky (white at noon, warm at dusk, dim at night)
  function clouds(L) {
    const im = IMG.clouds; if (!ok(im)) return false;
    const { g, W, Hh, b, c } = L, lb = lum(b), al = Math.min(.92, Math.max(.1, lb * 1.25));
    const tint = mix(mix([255, 255, 255], hex(c), .25), [0, 0, 0], 1 - Math.min(1, .3 + lb * .9));
    const oc = document.createElement('canvas'); oc.width = im.naturalWidth; oc.height = im.naturalHeight;
    const x = oc.getContext('2d'); x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(' + tint + ')'; x.fillRect(0, 0, oc.width, oc.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0);
    // four copies round the horizon (about 90 degrees each, close to the photo's own field of view), every other one
    // mirrored so neighbours meet without a seam
    const h = Hh * .42, w = W / 4, y0 = Hh * .49 - h;
    for (let k = 0; k < 4; k++) { g.save(); g.globalAlpha = al; if (k % 2) { g.translate((k + 1) * w, 0); g.scale(-1, 1); g.drawImage(oc, 0, y0, w, h) } else g.drawImage(oc, k * w, y0, w, h); g.restore() }
    return true;
  }
  // sunset: the real sunset photo replaces the painted gradient above the horizon and fades into the fog colour
  function sunset(L) {
    const im = IMG.sunset; if (!ok(im)) return false;
    const { g, W, Hh, fc } = L, w = W / 2, h = Hh * .5;
    g.save(); g.drawImage(im, 0, 0, w, h); g.translate(W, 0); g.scale(-1, 1); g.drawImage(im, 0, 0, w, h); g.restore();
    const f = g.createLinearGradient(0, Hh * .4, 0, Hh * .52); f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, fc);
    g.fillStyle = f; g.fillRect(0, Hh * .4, W, Hh * .12);
    return true;
  }
  function paint(L) {
    if (L.done) return;
    const isSunset = String(L.a).toLowerCase() === SUNSET[0] && String(L.b).toLowerCase() === SUNSET[1];
    L.done = isSunset ? sunset(L) : clouds(L);
  }
  // pictures that finish decoding after the first sky was drawn are added to that sky in place
  function late() {
    if (!last || last.done) return;
    paint(last);
    const bg = scene.background;
    if (last.done && bg && bg.image === last.g.canvas) { bg.needsUpdate = true; if (envRT) { envRT.dispose(); envRT = pmrem.fromEquirectangular(bg); scene.environment = envRT.texture } }
  }

  // ground: a seamless grey grass pattern (the game tints it per world, so it suits snow and sand as well as grass)
  const GC = document.createElement('canvas'); GC.width = GC.height = 512;
  { const x = GC.getContext('2d'); x.fillStyle = 'rgb(219,219,219)'; x.fillRect(0, 0, 512, 512) }
  const grainList = [];
  let grassDrawn = false;
  function grassReady() {
    if (!grassDrawn) { if (!ok(IMG.grass)) return; GC.getContext('2d').drawImage(IMG.grass, 0, 0, 512, 512); grassDrawn = true }
    grainList.forEach(t => { t.needsUpdate = true }); grainList.length = 0;
  }

  window.CLART = {
    skyW: 2048,
    sky(g, W, Hh, a, b, c, fc) { last = { g, W, Hh, a, b, c, fc, done: false }; safe10('art sky', () => paint(last)) },
    grain() {
      if (!IMG.grass) return null;
      const t = new THREE.CanvasTexture(GC); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 70); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      if (!grassDrawn) { grainList.push(t); grassReady() }
      return t;
    }
  };
  if (IMG.clouds) IMG.clouds.addEventListener('load', () => safe10('art clouds', late));
  if (IMG.sunset) IMG.sunset.addEventListener('load', () => safe10('art sunset', late));
  if (IMG.grass) { if (ok(IMG.grass)) grassReady(); else IMG.grass.addEventListener('load', () => safe10('art grass', grassReady)) }

  // the neon logo at the top of the title screen (the old mark and title stay in the page for screen readers)
  safe10('art logo', () => {
    const st = document.querySelector('#start .stLogo'); if (!st || !ART10_DATA.logo) return;
    st.insertAdjacentHTML('afterbegin', '<img class="artLogo10" alt="Coaster Lab" draggable="false">');
    const im = st.querySelector('.artLogo10'); im.src = ART10_DATA.logo;
    im.addEventListener('error', () => { st.classList.remove('art10'); im.remove() });
    st.classList.add('art10');
  });
  DBG10.art = () => ({ logo: !!document.querySelector('#start .artLogo10'), clouds: ok(IMG.clouds), sunset: ok(IMG.sunset), grass: ok(IMG.grass), skyDone: !!(last && last.done) });
}
