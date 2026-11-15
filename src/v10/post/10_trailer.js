// ---- 10.0 trailer: a short movie trailer plays the first time someone opens Coaster Lab, before the title screen.
// It is never inlined (the video streams from a CDN only when it is shown), it can always be skipped, it remembers that
// it was seen, and the title screen has a "Watch the trailer" button to see it again.
const TRAILER10 = {
  src: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3Lz6MFbYPt74PTm03KGYRkETRCQ/7e4ef797-5ce6-4a11-959e-75283e1165db.mp4',
  poster: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3Lz6MFbYPt74PTm03KGYRkETRCQ/c65bf688-d603-4900-bb70-19bc4b324285.jpg',
  key: 'coasterlab.v10.trailerSeen', el: null, v: null, timer: 0
};
{
  const seen = () => { try { return !!localStorage.getItem(TRAILER10.key) } catch (e) { return true } };
  const mark = () => { try { localStorage.setItem(TRAILER10.key, '1') } catch (e) {} };
  const close = (how) => {
    const o = TRAILER10.el; if (!o) return; TRAILER10.el = null; clearTimeout(TRAILER10.timer); mark();
    o.classList.add('out'); const v = TRAILER10.v; TRAILER10.v = null;
    setTimeout(() => { try { v && v.pause(); v && v.removeAttribute('src'); v && v.load() } catch (e) {} o.remove() }, how === 'error' ? 0 : 650);
    window.__trailer10 = { open: false, how };
    const b = document.querySelector('.cta.go'); if (b && typeof startOpen !== 'undefined' && startOpen) setTimeout(() => b.focus({ preventScroll: true }), 700);
  };
  const open = (why) => {
    if (TRAILER10.el) return;
    const o = document.createElement('div'); o.id = 'trailer10'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Coaster Lab trailer');
    o.innerHTML = '<video playsinline preload="auto" poster="' + TRAILER10.poster + '"></video>' +
      '<button class="tr10skip" type="button">Skip <span aria-hidden="true">›</span></button>' +
      '<button class="tr10snd" type="button" hidden>🔊 Tap for sound</button>' +
      '<div class="tr10bar" aria-hidden="true"><i></i></div>';
    document.body.appendChild(o); TRAILER10.el = o;
    const v = o.querySelector('video'), snd = o.querySelector('.tr10snd'), bar = o.querySelector('.tr10bar i'); TRAILER10.v = v;
    v.src = TRAILER10.src;
    o.querySelector('.tr10skip').onclick = () => close('skip');
    const unmute = () => { v.muted = false; snd.hidden = true; if (v.paused) v.play().catch(() => {}) };
    snd.onclick = e => { e.stopPropagation(); unmute() };
    v.onclick = () => { if (v.muted) unmute() };
    v.onended = () => close('end');
    // first visit: a video that can't load just gets out of the way. Asked for on purpose: say so, with a link to watch it elsewhere
    const fail = (how) => { if (why !== 'rewatch' || TRAILER10.el !== o) return close(how); clearTimeout(TRAILER10.timer); try { v.pause() } catch (e) {}
      o.classList.add('tr10err'); v.remove(); snd.hidden = true;
      o.insertAdjacentHTML('beforeend', '<div class="tr10msg"><b>The trailer can\'t play here</b><span>This page isn\'t allowed to stream video.</span><a href="' + TRAILER10.src + '" target="_blank" rel="noopener">Watch it in a new tab</a></div>');
      window.__trailer10 = { open: true, why, how } };
    v.onerror = () => fail('error:' + (v.error && v.error.code));
    v.ontimeupdate = () => { if (v.duration) bar.style.transform = 'scaleX(' + (v.currentTime / v.duration).toFixed(4) + ')' };
    v.onplaying = () => { clearTimeout(TRAILER10.timer); mark() };
    // a slow or blocked connection never keeps anyone from the game: Skip is always there, a load error closes it at once,
    // and if nothing has started after 25 s it closes by itself (while it waits, it keeps nudging a video that is ready)
    const watch = (k) => { TRAILER10.timer = setTimeout(() => { if (TRAILER10.v !== v || v.currentTime > .05) return; if (k >= 4) return fail('timeout'); if (v.readyState >= 2) v.play().catch(() => {}); watch(k + 1) }, 5000) }; watch(0);
    // sound on when the browser allows it (a tap on "Watch the trailer" counts); otherwise start muted with a sound button
    v.muted = false; v.play().catch(() => { v.muted = true; snd.hidden = false; v.play().catch(err => fail('blocked:' + (err && err.name))) });
    setTimeout(() => { const s = o.querySelector('.tr10skip'); s && s.focus({ preventScroll: true }) }, 50);
    window.__trailer10 = { open: true, why };
  };
  addEventListener('keydown', e => { if (TRAILER10.el && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close('skip') } }, true);
  TRAILER10.open = open; TRAILER10.close = close;
  // first visit: play it over the title screen, which is already there underneath when the trailer ends
  let reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) {}
  let off = false; try { off = /[?&]notrailer\b/.test(location.search) } catch (e) {}
  if (!seen() && !reduce && !off) open('first');
  // rewatch: a button on the title screen
  const box = document.querySelector('#start .stCtas');
  if (box) { box.insertAdjacentHTML('beforeend', '<button class="cta tr10cta" type="button" data-trailer10="1"><b>🎬 Watch the trailer</b><small>90 seconds of pure drama (it is 40)</small></button>'); box.querySelector('[data-trailer10]').addEventListener('click', e => { e.stopPropagation(); open('rewatch') }) }
}
