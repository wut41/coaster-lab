// ---- 10.0 daily streak + daily rewards: come back every day, the rewards grow all week and day 7 is a big one.
//  · one claim per calendar day (the player's own clock, local midnight), a 🔥 streak that counts the days in a row
//  · a 7-day reward ladder (coins + XP), a 🎁 mystery cosmetic on day 5, the 🔥 Inferno train skin on the first day 7
//    (later weeks: another shop item you don't own yet), plus a week bonus that grows +10% per full week (max +50%)
//  · one 🧊 streak freeze: covers a single missed day by itself, refilled on every day 7
//  · two titles for the title picker: "On Fire" (7 days in a row) and "Unstoppable" (30 days in a row)
//  · a claim popup with an animated flame, the week's tiles, flying coins and the unlock chime; a 🔥 chip on the HUD and a
//    card on the title screen open it again. First visit: the popup waits until the trailer and the title screen are done.
// Stored on this device only (coasterlab.v10.streak). Rewards go through the 7.2 progress system (award72 / PROG72.unlock).
const STK10 = { key: 'coasterlab.v10.streak', el: null, shown: false, fake: null, bootT: Date.now(), startClosedT: 0, busy: false };

// <core> — pure streak rules (no DOM, no game state): tests/t19_streak_logic.js runs this part on its own in node
const STKC10 = (() => {
  const LADDER = [
    { c: 30, x: 50 }, { c: 40, x: 60 }, { c: 60, x: 80 }, { c: 80, x: 100 },
    { c: 100, x: 120, box: true }, { c: 120, x: 150 }, { c: 250, x: 300, big: true }
  ];
  const BOX = ['pal:pastel', 'pal:sunset', 'fx:sparkle', 'deco:balloons', 'deco:topiary', 'fx:rainbow', 'skin:neon'];
  const BIG = ['skin:luxury', 'pal:galaxy', 'fx:streak', 'deco:neon', 'deco:statue', 'skin:neon', 'fx:rainbow', 'pal:sunset', 'pal:pastel', 'fx:sparkle', 'deco:balloons', 'deco:topiary'];
  const pad = n => (n < 10 ? '0' : '') + n;
  const dayKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const isKey = k => typeof k === 'string' && /^\d{4}-\d\d-\d\d$/.test(k);
  // whole calendar days from a to b (both 'YYYY-MM-DD'); counted in UTC so a daylight-saving change is never a missed day
  const gap = (a, b) => { const p = k => k.split('-').map(Number), A = p(a), B = p(b); return Math.round((Date.UTC(B[0], B[1] - 1, B[2]) - Date.UTC(A[0], A[1] - 1, A[2])) / 864e5) };
  const num = (v, d, lo, hi) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d);
  function clean(o) {
    const r = { v: 1, last: null, n: 0, best: 0, total: 0, frz: 1, saves: 0, auto: true, log: [] };
    if (!o || typeof o !== 'object' || Array.isArray(o)) return r;
    if (isKey(o.last)) r.last = o.last;
    r.n = num(o.n, 0, 0, 1e5); r.best = Math.max(r.n, num(o.best, 0, 0, 1e5)); r.total = Math.max(r.n, num(o.total, 0, 0, 1e6));
    r.frz = num(o.frz, 1, 0, 1); r.saves = num(o.saves, 0, 0, 1e5); r.auto = o.auto !== false;
    if (Array.isArray(o.log)) r.log = o.log.filter(isKey).slice(-14);
    if (!r.last) r.n = 0;
    return r;
  }
  const dayOf = n => ((Math.max(1, n) - 1) % 7) + 1;              // 1..7: the tile on the week's ladder
  const weekOf = n => Math.floor((Math.max(1, n) - 1) / 7) + 1;   // 1 = first week
  const mult = n => 1 + 0.1 * Math.min(5, weekOf(n) - 1);        // +10% per full week already done, at most +50%
  // where today stands, before claiming
  function status(st, today) {
    if (!st.last) return { claimed: false, n: 1, day: 1, live: 0, fresh: true, lost: 0, freeze: false };
    const g = gap(st.last, today);
    // already claimed today, or the clock went backwards: nothing to claim (and nothing is lost)
    if (g <= 0) return { claimed: true, n: st.n, day: dayOf(st.n), live: st.n, fresh: false, lost: 0, freeze: false };
    if (g === 1) return { claimed: false, n: st.n + 1, day: dayOf(st.n + 1), live: st.n, fresh: false, lost: 0, freeze: false };
    if (g === 2 && st.frz > 0) return { claimed: false, n: st.n + 1, day: dayOf(st.n + 1), live: st.n, fresh: false, lost: 0, freeze: true };
    return { claimed: false, n: 1, day: 1, live: 0, fresh: false, lost: st.n > 1 ? st.n : 0, freeze: false, missed: g - 1 };
  }
  // what a given streak day pays (rounded to 5s); owned(id) says whether a cosmetic is already the player's
  function reward(n, owned, seed) {
    const L = LADDER[dayOf(n) - 1], m = mult(n), r = { day: dayOf(n), week: weekOf(n), mult: m, coins: Math.round(L.c * m / 5) * 5, xp: Math.round(L.x * m / 5) * 5, item: null, freeze: false, big: !!L.big };
    const pick = list => { const free = list.filter(id => !owned(id)); return free.length ? free[(seed >>> 0) % free.length] : null };
    if (L.box) { r.item = pick(BOX); if (!r.item) r.coins += 60 }
    if (L.big) { r.item = owned('skin:inferno') ? pick(BIG) : 'skin:inferno'; if (!r.item) r.coins += 150; r.freeze = true }
    return r;
  }
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 };
  // claim today: returns the new state and what was won (or null when today is already claimed)
  function claim(st, today, owned) {
    const s = status(st, today); if (s.claimed) return null;
    const r = reward(s.n, owned, hash(today));
    const o = clean(st);
    o.n = s.n; o.last = today; o.total += 1; o.best = Math.max(o.best, o.n);
    if (s.freeze) { o.frz = 0; o.saves += 1 }
    if (r.freeze) o.frz = 1;
    o.log = o.log.concat(today).slice(-14);
    return { st: o, r, s };
  }
  return { LADDER, BOX, BIG, dayKey, gap, clean, status, reward, claim, dayOf, weekOf, mult, hash };
})();
// </core>

{
  const today = () => (STK10.fake && window.__coasterTestHarness === true ? STK10.fake : STKC10.dayKey(new Date()));
  const load = () => { try { return STKC10.clean(JSON.parse(localStorage.getItem(STK10.key) || 'null')) } catch (e) { return STKC10.clean(null) } };
  const save = st => { try { localStorage.setItem(STK10.key, JSON.stringify(st)) } catch (e) {} };
  const owned = id => { try { return typeof PROG72 !== 'undefined' && !!PROG72.unlock[id] } catch (e) { return false } };
  const itemName = id => id === 'skin:inferno' ? 'Inferno train skin' : ((typeof SHOP72 !== 'undefined' && SHOP72.find(s_ => s_[0] === id)) || [0, 0, id])[2];
  const itemIcon = id => id === 'skin:inferno' ? '🔥' : ((typeof SHOP72 !== 'undefined' && SHOP72.find(s_ => s_[0] === id)) || [0, '🎁'])[1];
  const H = s => (typeof esc === 'function' ? esc(String(s)) : String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'));

  // ---- the Inferno train skin (only from a day-7 streak reward) and two streak titles
  try {
    if (typeof SKIN72 !== 'undefined' && !SKIN72.inferno) SKIN72.inferno = { n: 'Inferno', ic: '🔥', body: '#1c0905', accent: '#ff5a1f', seat: '#2a0c06', restraint: '#ffb300', wheel: '#140705', light: '#ffb347', paint: 'metallic', seatFin: 'leather', trim: 'stripes', nose: 'fins', glow: 'pulse', trail: 'sparkle', style: 'ride', lock: 'skin:inferno' };
    if (typeof LOCKS72 !== 'undefined' && !LOCKS72['skin:inferno']) LOCKS72['skin:inferno'] = { streak: 7 };   // never bought, never by level: only PROG72.unlock
    if (typeof lockText72 === 'function') { const f0 = lockText72; lockText72 = function (id) { return id === 'skin:inferno' ? 'Unlock: claim a day-7 daily streak reward 🔥' : f0(id) } }
    if (typeof TITLES72 !== 'undefined') {
      if (!TITLES72.onfire) TITLES72.onfire = { n: 'On Fire', ok: () => load().best >= 7, how: 'Keep a 7-day daily streak' };
      if (!TITLES72.unstop) TITLES72.unstop = { n: 'Unstoppable', ok: () => load().best >= 30, how: 'Keep a 30-day daily streak' };
    }
  } catch (e) { console.warn('10.0 streak setup', e) }

  const FLAME = '<svg viewBox="0 0 64 80" aria-hidden="true"><defs><radialGradient id="stk10g1" cx="50%" cy="78%" r="70%"><stop offset="0" stop-color="#fff6c2"/><stop offset=".35" stop-color="#ffc933"/><stop offset=".7" stop-color="#ff6a1f"/><stop offset="1" stop-color="#e0182d"/></radialGradient><radialGradient id="stk10g2" cx="50%" cy="80%" r="60%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".6" stop-color="#ffe066"/><stop offset="1" stop-color="#ff9a2e"/></radialGradient></defs>' +
    '<path class="o" fill="url(#stk10g1)" d="M32 2C36 16 50 22 54 40c4 18-6 36-22 38C14 80 4 64 8 48c3-12 12-16 12-28 6 6 7 12 6 18 6-10 8-22 6-36z"/>' +
    '<path class="i" fill="url(#stk10g2)" d="M32 34c3 8 11 12 12 23 1 10-5 17-12 17s-14-6-12-15c1-7 6-9 7-16 3 3 4 6 4 9 2-5 2-12 1-18z"/></svg>';

  const nextReward = (st, s) => STKC10.reward(s.n, owned, STKC10.hash(today()));
  const countdown = () => { const d = new Date(), m = new Date(d); m.setHours(24, 0, 0, 0); const t = Math.max(0, m - d), h = Math.floor(t / 36e5), mi = Math.floor(t % 36e5 / 6e4); return h ? h + 'h ' + mi + 'm' : mi + 'm' };

  // ---- the 7 tiles of the current week
  function tiles(st, s, justClaimed) {
    const nNow = s.claimed ? s.n : s.n;            // the streak day that today stands for
    const wk0 = nNow - STKC10.dayOf(nNow);           // streak count before this week's day 1
    let h = '';
    for (let d = 1; d <= 7; d++) {
      const n = wk0 + d, r = STKC10.reward(n, owned, STKC10.hash(today())), isToday = d === STKC10.dayOf(nNow);
      const done = d < STKC10.dayOf(nNow) || (isToday && s.claimed);
      const ic = r.big ? (r.item ? itemIcon(r.item) : '💰') : (STKC10.LADDER[d - 1].box ? '🎁' : '🪙');
      h += `<li class="${done ? 'done' : ''} ${isToday ? 'today' : ''} ${r.big ? 'big' : ''} ${isToday && justClaimed ? 'pop' : ''}" style="--i:${d}"><small>Day ${d}</small><i aria-hidden="true">${done && !isToday ? '✓' : ic}</i><b>${r.coins}</b></li>`;
    }
    return h;
  }

  function render(justGot) {
    const o = STK10.el; if (!o) return;
    const st = load(), s = STKC10.status(st, today()), r = nextReward(st, s);
    const shownN = s.claimed ? st.n : s.live;
    const title = s.claimed ? (st.n === 1 ? 'Streak started!' : st.n + ' days in a row!') : s.fresh ? 'Your first daily reward' : s.lost ? 'Your streak burned out 😢' : s.freeze ? 'Your freeze saved the streak 🧊' : 'Day ' + s.n + ' is ready!';
    const sub = s.claimed ? 'Next reward in ' + countdown() + '. Come back tomorrow to keep the fire going.'
      : s.fresh ? 'Come back every day. Rewards grow all week and day 7 is huge.'
      : s.lost ? 'You missed ' + (s.missed || 1) + ' day' + ((s.missed || 1) === 1 ? '' : 's') + ' after ' + s.lost + ' in a row. A new streak starts today.'
      : s.freeze ? 'You missed a day, so your 🧊 freeze kicked in. Claim to keep going.'
      : 'Claim it to make it ' + s.n + ' days in a row.';
    const wk = STKC10.weekOf(s.claimed ? st.n : s.n), bonus = Math.round((STKC10.mult(s.claimed ? st.n : s.n) - 1) * 100);
    o.querySelector('.stk10N').textContent = shownN;
    o.querySelector('#stk10T').textContent = title;
    o.querySelector('.stk10Sub').textContent = sub;
    o.querySelector('.stk10Row').innerHTML = tiles(st, s, !!justGot);
    o.querySelector('.stk10Meta').innerHTML = `<span title="Covers one missed day by itself">🧊 ${st.frz && !s.freeze ? '1 freeze' : 'No freeze'}</span><span>🏆 Best ${Math.max(st.best, shownN)}</span><span>${bonus ? '📈 Week ' + wk + ' bonus +' + bonus + '%' : '📅 Week ' + wk}</span>`;
    const go = o.querySelector('.stk10Go');
    if (s.claimed) { go.disabled = true; go.innerHTML = '✓ Claimed today' }
    else { go.disabled = false; go.innerHTML = `Claim 🪙 ${r.coins} + ${r.xp} XP${r.item ? ' + ' + itemIcon(r.item) : ''}` }
    const got = o.querySelector('.stk10Got');
    if (justGot) {
      const g = justGot;
      got.hidden = false;
      got.innerHTML = `<b>+🪙 ${g.coins}</b><b>+${g.xp} XP</b>${g.item ? `<b class="it">${itemIcon(g.item)} ${H(itemName(g.item))}</b>` : ''}${g.freeze && !g.freezeWas ? '<b>+🧊 freeze</b>' : ''}` +
        (g.item === 'skin:inferno' ? '<small>Pick it in the Train Studio to set your coaster on fire 🔥</small>' : g.item ? '<small>It\'s yours now, find it in the shop and studio.</small>' : '');
    } else got.hidden = true;
    o.querySelector('.stk10Auto input').checked = st.auto;
  }

  function chip() {
    const st = load(), s = STKC10.status(st, today()), n = s.claimed ? st.n : s.live, ready = !s.claimed;
    let c = document.getElementById('stk10chip');
    const brand = document.getElementById('brandBtn');
    if (!c && brand) {
      c = document.createElement('span'); c.id = 'stk10chip'; c.className = 'stk10chip'; c.setAttribute('role', 'button'); c.tabIndex = 0;
      brand.appendChild(c);
      const act = e => { e.stopPropagation(); e.preventDefault(); open('chip') };
      c.addEventListener('click', act, true); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') act(e) });
    }
    if (c) { c.innerHTML = `<i aria-hidden="true">🔥</i><b>${n}</b>`; c.classList.toggle('ready', ready); c.classList.toggle('cold', n === 0); c.setAttribute('aria-label', 'Daily streak: ' + n + ' day' + (n === 1 ? '' : 's') + (ready ? ', reward ready to claim' : '')) }
    // the title screen card
    const box = document.querySelector('#start .stCtas'); let t = box && box.querySelector('[data-stk10]');
    if (box && !t) {
      box.insertAdjacentHTML('afterbegin', '<button class="cta stk10cta" type="button" data-stk10="1"><b></b><small></small></button>');
      t = box.querySelector('[data-stk10]'); t.addEventListener('click', e => { e.stopPropagation(); open('title') });
      const go = box.querySelector('.cta.go'); if (go) go.after(t);    // right after "Ride now"
    }
    if (t) {
      t.classList.toggle('ready', ready);
      t.querySelector('b').textContent = ready ? '🎁 Daily reward ready' : '🔥 ' + n + '-day streak';
      t.querySelector('small').textContent = ready ? (s.freeze ? 'Your freeze saved the streak!' : s.lost ? 'Start a new streak today' : 'Day ' + s.n + ' · claim it now') : 'Next reward in ' + countdown();
    }
  }

  function build() {
    const o = document.createElement('div'); o.id = 'stk10'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'stk10T');
    o.innerHTML = `<div class="stk10In"><button class="stk10X" type="button" aria-label="Close">✕</button>` +
      `<div class="stk10Flame"><div class="fl">${FLAME}</div><b class="stk10N">0</b><span class="ring" aria-hidden="true"></span></div>` +
      `<small class="stk10Kick">DAILY STREAK</small><h2 id="stk10T"></h2><p class="stk10Sub"></p>` +
      `<ol class="stk10Row"></ol><div class="stk10Meta"></div><div class="stk10Got" hidden aria-live="polite"></div>` +
      `<button class="stk10Go" type="button"></button>` +
      `<label class="stk10Auto"><input type="checkbox"> Show this when I open the game</label><div class="stk10Fly" aria-hidden="true"></div></div>`;
    o.addEventListener('click', e => { if (e.target === o || e.target.closest('.stk10X')) close() });
    o.querySelector('.stk10Go').addEventListener('click', doClaim);
    o.querySelector('.stk10Auto input').addEventListener('change', e => { const st = load(); st.auto = !!e.target.checked; save(st) });
    return o;
  }
  function open(why) {
    if (STK10.el) return; STK10.shown = true;
    const o = build(); document.body.appendChild(o); STK10.el = o; render(null);
    requestAnimationFrame(() => o.classList.add('in'));
    const b = o.querySelector('.stk10Go'); setTimeout(() => { try { (b.disabled ? o.querySelector('.stk10X') : b).focus({ preventScroll: true }) } catch (e) {} }, 60);
    try { sfx('chime', .6) } catch (e) {}
    window.__streak10 && (window.__streak10.lastOpen = why);
  }
  function close() {
    const o = STK10.el; if (!o) return; STK10.el = null; o.classList.remove('in'); o.classList.add('out');
    setTimeout(() => o.remove(), 320); chip();
  }
  function flyCoins(o) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fly = o.querySelector('.stk10Fly'), b = o.querySelector('.stk10Go').getBoundingClientRect(), f = o.querySelector('.stk10Flame').getBoundingClientRect(), box = o.querySelector('.stk10In').getBoundingClientRect();
    const sx = b.left + b.width / 2 - box.left, sy = b.top - box.top, ex = f.left + f.width / 2 - box.left, ey = f.top + f.height / 2 - box.top;
    for (let i = 0; i < 12; i++) {
      const c = document.createElement('i'); c.textContent = i % 4 === 3 ? '⭐' : '🪙';
      c.style.cssText = `left:${sx + (Math.random() - .5) * b.width * .7}px;top:${sy}px;--dx:${ex - sx + (Math.random() - .5) * 30}px;--dy:${ey - sy}px;--mx:${(Math.random() - .5) * 120}px;animation-delay:${i * 45}ms`;
      fly.appendChild(c); setTimeout(() => c.remove(), 1400 + i * 45);
    }
  }
  function doClaim() {
    if (STK10.busy) return; const st = load(), res = STKC10.claim(st, today(), owned); if (!res) { render(null); return }
    STK10.busy = true; const freezeWas = st.frz > 0 && !res.s.freeze;
    save(res.st);
    try {
      if (res.r.item && typeof PROG72 !== 'undefined') { PROG72.unlock[res.r.item] = Date.now(); if (/^deco:/.test(res.r.item) && typeof rebuildPark72 === 'function') rebuildPark72() }
      if (typeof award72 === 'function') award72(res.r.xp, res.r.coins, 'Daily streak'); else if (typeof saveProg72 === 'function') saveProg72(true);
    } catch (e) { console.warn('10.0 streak reward', e) }
    const o = STK10.el;
    if (o) {
      flyCoins(o);
      o.classList.remove('claimed'); void o.offsetWidth; o.classList.add('claimed');
      render(Object.assign({}, res.r, { freezeWas }));
    }
    try { sfx('coin'); setTimeout(() => { try { sfx(res.r.big ? 'gold' : 'unlock') } catch (e) {} }, 380) } catch (e) {}
    try { if (typeof fxOn !== 'undefined' && fxOn && typeof confettiSmall === 'function' && !(typeof TY !== 'undefined' && TY.on)) (res.r.big && typeof confetti === 'function' ? confetti : confettiSmall)() } catch (e) {}
    try { if (typeof pop7 === 'function') pop7('🔥 ' + res.st.n + '-day streak!', res.r.big ? 'x2' : '') } catch (e) {}
    chip(); setTimeout(() => { STK10.busy = false }, 400);
    if (window.__streak10) window.__streak10.last = res;
  }

  // ---- when to pop up by itself: once per visit, never over the trailer, the title screen of a first visit, a dialog,
  // the builder or a text box. A player who unticked "Show this when I open the game" only gets the chip and the card.
  const busyUI = () => {
    if (typeof TRAILER10 !== 'undefined' && TRAILER10.el) return 'trailer';
    if (document.getElementById('trailer10')) return 'trailer';
    for (const id of ['ov7', 'sec7', 'pw7', 'own7']) { const e = document.getElementById(id); if (e && !e.hidden) return id }
    const b = document.body.classList; if (b.contains('editing') || b.contains('b8play') || b.contains('owner')) return 'mode';
    const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return 'typing';
    if (document.visibilityState === 'hidden') return 'hidden';
    return '';
  };
  let lastStart = null;
  function tick() {
    try {
      chip();
      const so = typeof startOpen !== 'undefined' && startOpen;
      if (lastStart === true && !so) STK10.startClosedT = Date.now(); lastStart = so;
      if (STK10.shown || STK10.el || !window.__booted) return;
      const st = load(), s = STKC10.status(st, today());
      if (s.claimed || !st.auto || busyUI()) return;
      // a brand-new player first gets the trailer and the title screen, then a few seconds of the game, then the reward
      if (s.fresh) { if (so || Date.now() - Math.max(STK10.bootT, STK10.startClosedT) < 6000) return }
      else if (Date.now() - STK10.bootT < 1200) return;
      open('auto');
    } catch (e) { console.warn('10.0 streak', e) }
  }
  addEventListener('keydown', e => { if (STK10.el && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close() } }, true);
  setInterval(tick, 1000); setTimeout(tick, 50);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick() });

  if (window.__coasterTestHarness === true) window.__streak10 = {
    core: STKC10, load, save, open, close, claim: doClaim, tick, chip, owned,
    setToday: k => { STK10.fake = k; chip(); if (STK10.el) render(null) }, reset: () => { STK10.shown = false },
    isOpen: () => !!STK10.el,
    game: () => ({ coins: PROG72.coins, xp: PROG72.xp, inferno: !!PROG72.unlock['skin:inferno'], skin: !!(typeof SKIN72 !== 'undefined' && SKIN72.inferno),
      usable: typeof isUnlocked72 === 'function' && isUnlocked72('skin:inferno') && (typeof designRef72 !== 'function' || !!designRef72('skin:inferno')), onfire: !!(TITLES72.onfire && TITLES72.onfire.ok()) })
  };
}
