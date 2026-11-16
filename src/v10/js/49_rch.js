// ---- 10.0 🎯 RIDE CHALLENGES: permanent feats with 🥉 Bronze / 🥈 Silver / 🥇 Gold medals, checked on every completed
// test-ride lap (top speed, inversions survived, airtime, G-forces, track length, height, Disaster Mode, budget builds …).
// Rewards go into the existing 7.2 wallet (XP + 🪙 coins through award72), plus badges, titles and a Champion train skin.
// Self-contained: progress is saved under coasterlab.v10.rch only; the 7.2 systems are extended (pushed to / wrapped),
// never rewritten. Laps count only with standard Earth physics (no Gravity Lab planet, no Lab slider changes), so a
// Jupiter lap can't hand out an Earth speed medal. The one exception is 🚀 Warp Speed, which is MEANT for the Gravity Lab.
// Every Gold was checked against this game (tests/t12_rch.js proves each one is reachable):
//   built-in rides: ⚡ 80 mph Thunder Comet · 🌀 7 Hydra · 🪂 5 s Timberwolf · 💥 8 G Looping Adventure · 🧲 −1.5 G Skyfall ·
//   📏 3,000 ft Nebula · 🏔 200 ft Titan · ⏱ 100 s Nova Giant · 💀 5 inversions The Void (survives Disaster Mode) ·
//   🚀 110 mph Titan on Jupiter; Track Builder: 🏗 60 mph and 💰 $11,000 with a launched loop (design in the test).
// The Track Builder limits (80 m tall, 950 m long, 190 m square) rule out 100 mph on Earth, so "hit 100 mph" is Warp Speed.
const MPH10 = 0.44704;// 1 mph in m/s
const RTIER10 = [
  { k: 'b', ic: '🥉', n: 'Bronze', xp: 80, coins: 50 },
  { k: 's', ic: '🥈', n: 'Silver', xp: 160, coins: 120 },
  { k: 'g', ic: '🥇', n: 'Gold', xp: 320, coins: 250 }];
// x: thresholds for the three medals. v(F): the lap's value. lo: true when smaller is better (cost, negative G).
// ok(F): extra condition for the lap to count at all. only: 'custom' = your own Track Builder coasters only.
// any: counts with any physics (Gravity Lab planets, Lab sliders).
const RCH10 = [
  { k: 'speed', ic: '⚡', n: 'Speed Demon', x: [50 * MPH10, 65 * MPH10, 80 * MPH10], v: F => F.vmax, t: x => `Hit ${fV(x)} in one lap`, f: v => fV(v) },
  { k: 'warp', ic: '🚀', n: 'Warp Speed', any: true, x: [90 * MPH10, 100 * MPH10, 110 * MPH10], v: F => F.vmax, t: x => `Hit ${fV(x)} on any planet (🧪 Gravity Lab allowed)`, f: v => fV(v) },
  { k: 'loops', ic: '🌀', n: 'Loop Survivor', x: [3, 5, 7], v: F => F.inv, t: x => `Survive ${x} inversions in one lap`, f: v => v + ' inversion' + (v === 1 ? '' : 's') },
  { k: 'air', ic: '🪂', n: 'Airtime Addict', x: [1, 3, 5], v: F => F.air, t: x => `Get ${x} s of airtime in one lap`, f: v => v.toFixed(1) + ' s' },
  { k: 'gforce', ic: '💥', n: 'G-Force Hero', x: [4.5, 6, 8], v: F => F.gmax, t: x => `Feel ${x.toFixed(1)} G in one lap`, f: v => v.toFixed(1) + ' G' },
  { k: 'eject', ic: '🧲', n: 'Ejector Seat', x: [-0.5, -1, -1.5], lo: true, v: F => F.gmin, t: x => `Get lifted out of your seat at ${fG(x)}`, f: v => fG(v) },
  { k: 'long', ic: '📏', n: 'Marathon Track', x: [1000 / 3.28084, 2000 / 3.28084, 3000 / 3.28084], v: F => F.len, t: x => `Ride a track ${fL(x)} long`, f: v => fL(v) },
  { k: 'sky', ic: '🏔', n: 'Sky Scraper', x: [100 / 3.28084, 150 / 3.28084, 200 / 3.28084], v: F => F.h, t: x => `Ride a coaster ${fL(x)} tall`, f: v => fL(v) },
  { k: 'endure', ic: '⏱', n: 'Endurance Run', x: [45, 70, 100], v: F => F.time, t: x => `Stay on for ${x} s in one lap`, f: v => Math.round(v) + ' s' },
  { k: 'daredevil', ic: '💀', n: 'Daredevil', x: [0, 3, 5], v: F => F.inv, ok: F => F.dz, t: x => x ? `Survive ${x} inversions with 💥 Disaster Mode on` : 'Finish a lap with 💥 Disaster Mode on', f: v => v + ' inversion' + (v === 1 ? '' : 's') + ' in Disaster Mode' },
  { k: 'engineer', ic: '🏗', n: 'Garage Engineer', only: 'custom', x: [40 * MPH10, 50 * MPH10, 60 * MPH10], v: F => F.vmax, t: x => `Build your own coaster that hits ${fV(x)}`, f: v => fV(v) },
  { k: 'budget', ic: '💰', n: 'Budget Builder', only: 'custom', x: [20000, 15000, 11000], lo: true, v: F => F.cost, ok: F => F.vmax >= 50 * MPH10 - 1e-9 && F.inv >= 1, t: x => `Build a coaster that hits ${fV(50 * MPH10)} with 1+ inversion for ${money10(x)} or less`, f: v => money10(v) }];
// milestone rewards on top of the per-tier XP and coins
const RMILE10 = [
  { k: 'tiers5', ic: '🎯', n: 'Challenger', d: 'Earn 5 challenge medals', ok: S => S.tiers >= 5 },
  { k: 'gold5', ic: '🏆', n: 'Champion', d: 'Earn 5 🥇 Gold medals: unlocks the 🏆 Champion train skin', ok: S => S.golds >= 5 },
  { k: 'allGold', ic: '👑', n: 'Ride Royalty', d: 'Earn every 🥇 Gold medal: unlocks the 👑 Ride Royalty title', ok: S => S.golds >= RCH10.length }];
const RSKIN10 = 'skin:champ10';

// ---- saved progress: {v, t:{key:tier 0..3}, best:{key:value}, on:{key:ride}, when:{key:[ms…]}, laps, mile:{key:ms}}
function cleanRch10(o) {
  const r = { v: 1, t: {}, best: {}, on: {}, when: {}, laps: 0, mile: {} }, ob = x => !!x && typeof x === 'object' && !Array.isArray(x), fin = x => typeof x === 'number' && isFinite(x);
  if (!ob(o)) return r;
  if (fin(o.laps)) r.laps = Math.max(0, Math.round(o.laps));
  RCH10.forEach(c => {
    if (ob(o.t) && fin(o.t[c.k])) r.t[c.k] = Math.max(0, Math.min(3, Math.round(o.t[c.k])));
    if (ob(o.best) && fin(o.best[c.k])) r.best[c.k] = o.best[c.k];
    if (ob(o.on) && typeof o.on[c.k] === 'string') r.on[c.k] = o.on[c.k].slice(0, 60);
    if (ob(o.when) && Array.isArray(o.when[c.k])) r.when[c.k] = o.when[c.k].filter(fin).slice(0, 3);
  });
  if (ob(o.mile)) RMILE10.forEach(m => { if (fin(o.mile[m.k])) r.mile[m.k] = o.mile[m.k] });
  return r;
}
const RCH = cleanRch10(LS10('rch', null));
const saveRch10 = () => SS10('rch', RCH);
const rchTier10 = k => RCH.t[k] || 0;
function rchSum10() { let tiers = 0, golds = 0; RCH10.forEach(c => { const t = rchTier10(c.k); tiers += t; if (t >= 3) golds++ }); return { tiers, golds, max: RCH10.length * 3 } }
// does value v reach threshold x (in the challenge's direction)?
const rchMeets10 = (c, v, x) => typeof v === 'number' && isFinite(v) && (c.lo ? v <= x + 1e-9 : v >= x - 1e-9);
// how close a value is to a threshold, 0…1 (for "so close!" hints and progress bars)
function rchNear10(c, v, x) {
  if (typeof v !== 'number' || !isFinite(v)) return 0;
  if (c.lo) { if (x < 0) return sat10(v / x); return v <= x ? 1 : sat10(x / v) }
  if (x <= 0) return v >= x ? 1 : 0; return sat10(v / x);
}
// the My Park build price formula (21_ty_rides.js rideProf10), so a "budget" means the same in both places
const rchCost10 = (L, h, inv) => Math.round((4200 + L * 9 + h * 150 + inv * 1100) / 100) * 100;

// ---- the facts of a finished lap: the 7.2 lap event plus length, height, lowest G and cost of the current ride
function rchFacts10(d) {
  const F = { name: d.name || '?', custom: !!d.custom, vmax: +d.vmax || 0, gmax: +d.gmax || 0, air: +d.air || 0, inv: Math.round(+d.inv || 0), time: +d.time || 0, rank: d.rank || '', dz: d.dz != null ? !!d.dz : !!DZ86.on, std: d.std != null ? !!d.std : !phMod() };
  const c = safe10('ride challenges facts', () => curCtx());
  if (c) safe10('ride challenges stats', () => { const tr = traceOf(c), st = statsOf(c, tr, SEATS[seat].off), s0 = statsOf(c, tr, 0); F.len = c.L; F.h = s0.maxH; F.gmin = st.gMin });
  ['len', 'h', 'gmin'].forEach(k => { if (d[k] != null) F[k] = +d[k] });
  F.cost = d.cost != null ? +d.cost : (F.len != null && F.h != null ? rchCost10(F.len, F.h, F.inv) : null);
  return F;
}
// ---- check a lap against every challenge; returns {got:[{c,tier}], near, std}
function rchLap10(F) {
  const out = { got: [], near: null, std: F.std, miles: [] };
  RCH.laps++;
  let bestNear = 0;
  RCH10.forEach(c => {
    if (!F.std && !c.any) return;
    if (c.only === 'custom' && !F.custom) return;
    if (c.ok && !c.ok(F)) return;
    const v = c.v(F); if (typeof v !== 'number' || !isFinite(v)) return;
    const b = RCH.best[c.k];
    if (b == null || (c.lo ? v < b : v > b)) { RCH.best[c.k] = v; RCH.on[c.k] = F.name }
    const t0 = rchTier10(c.k); let t = t0;
    while (t < 3 && rchMeets10(c, v, c.x[t])) t++;
    if (t > t0) {
      RCH.t[c.k] = t; RCH.when[c.k] = (RCH.when[c.k] || []).slice(0, t0);
      for (let i = t0; i < t; i++) { RCH.when[c.k][i] = Date.now(); out.got.push({ c, tier: i }) }
    }
    if (t < 3 && !(c.any && F.std)) { const n = rchNear10(c, v, c.x[t]); if (n > bestNear && n >= .5) { bestNear = n; out.near = { c, tier: t, v, n } } }
  });
  const S = rchSum10();
  RMILE10.forEach(m => { if (!RCH.mile[m.k] && m.ok(S)) { RCH.mile[m.k] = Date.now(); out.miles.push(m) } });
  saveRch10();
  return out;
}
// rewards: XP and coins per tier (into the 7.2 wallet), the Champion skin and Ride Royalty title for milestones
function rchReward10(res) {
  res.got.forEach(({ c, tier }) => { const T = RTIER10[tier]; safe10('ride challenge reward', () => award72(T.xp, T.coins, 'Ride challenge: ' + c.n + ' ' + T.n)) });
  if (RCH.mile.gold5 && !PROG72.unlock[RSKIN10]) { PROG72.unlock[RSKIN10] = Date.now(); saveProg72(true) }
  safe10('ride challenge badges', () => checkBadges72());
}
// what a challenge needs next, as words
const rchNext10 = c => { const t = rchTier10(c.k); return t >= 3 ? null : RTIER10[t].ic + ' ' + c.t(c.x[t]) };
// "so close" text: how far the lap was from the next tier
function rchGap10(c, v, x) {
  if (c.k === 'speed' || c.k === 'warp' || c.k === 'engineer') return fV(Math.max(0, x - v)) + ' short of';
  if (c.k === 'budget') return money10(Math.max(0, v - x)) + ' over budget for';
  if (c.k === 'long' || c.k === 'sky') return fL(Math.max(0, x - v)) + ' short of';
  if (c.k === 'eject') return fG(v) + ', need ' + fG(x) + ' for';
  if (c.k === 'gforce') return (x - v).toFixed(1) + ' G short of';
  if (c.k === 'air') return (x - v).toFixed(1) + ' s short of';
  if (c.k === 'endure') return Math.ceil(x - v) + ' s short of';
  const n = Math.ceil(x - v); return n + ' more inversion' + (n === 1 ? '' : 's') + ' for';
}
// a short block in the lap card: medals won, or the closest next medal
function rchCard10(res) {
  const e = $('#sum7'); if (!e || e.hidden) return;
  const old = e.querySelector('.rch10L'); if (old) old.remove();
  let h = '';
  {
    // one line per challenge with its best new medal (gold first) and everything that challenge paid this lap
    const by = new Map(); res.got.forEach(({ c, tier }) => { const o = by.get(c.k) || { c, top: -1, xp: 0, coins: 0, n: 0 }; o.top = Math.max(o.top, tier); o.xp += RTIER10[tier].xp; o.coins += RTIER10[tier].coins; o.n++; by.set(c.k, o) });
    const rows = [...by.values()].sort((a, b) => b.top - a.top);
    rows.slice(0, 3).forEach(o => { const T = RTIER10[o.top]; h += `<p class="got">${T.ic} <b>${esc(o.c.n)} ${T.n}!</b> <small>+${o.xp} XP · 🪙 ${o.coins}</small></p>` });
    if (rows.length > 3) h += `<p class="got">…and ${rows.length - 3} more challenge${rows.length - 3 > 1 ? 's' : ''}!</p>`;
    res.miles.forEach(m => { h += `<p class="got">${m.ic} <b>${esc(m.n)}</b> <small>${esc(m.d)}</small></p>` });
    if (!res.got.length && res.near) { const { c, tier, v } = res.near; h += `<p>${c.ic} So close: ${esc(rchGap10(c, v, c.x[tier]))} ${RTIER10[tier].ic} ${esc(c.n)}</p>` }
    if (!res.std) h += '<p>🧪 Only 🚀 Warp Speed counts with Lab physics: the other ride challenges need standard Earth physics</p>';
  }
  if (!h) return;
  const div = document.createElement('div'); div.className = 'rch10L'; div.innerHTML = h + '<button class="btn" data-rch10="open">🎯 Ride challenges</button>';
  const b = e.querySelector('.sBtns'); b ? e.insertBefore(div, b) : e.appendChild(div);
}
function rchAnnounce10(res) {
  if (!res.got.length && !res.miles.length) return;
  const top = res.got.length ? res.got[res.got.length - 1] : null;
  if (top) { const T = RTIER10[top.tier]; pop7(T.ic + ' ' + top.c.n + ' ' + T.n + '!', 'x2'); say(T.ic + ' Ride challenge: ' + top.c.n + ' ' + T.n + (res.got.length > 1 ? ' (+' + (res.got.length - 1) + ' more)' : '') + ' · see 🎯 Ride challenges') }
  safe10('ride challenge sound', () => sfx(top && top.tier === 2 ? 'unlock' : 'chime'));
  if (top && top.tier === 2) safe10('ride challenge confetti', () => { if (fxOn) confettiSmall() });
  res.miles.forEach((m, i) => setTimeout(() => pop7(m.ic + ' ' + m.n + '!', 'x2'), 1200 + i * 1300));
}
let rchLast10 = null;
function rchOnLap10(d) {
  const F = rchFacts10(d), res = rchLap10(F);
  rchReward10(res); rchCard10(res); rchAnnounce10(res);
  rchLast10 = { F, got: res.got.map(g => g.c.k + ':' + RTIER10[g.tier].k), near: res.near && res.near.c.k, std: res.std, miles: res.miles.map(m => m.k) };
  return res;
}
on72('lap', d => safe10('ride challenges lap', () => rchOnLap10(d)));

// ---- rewards wired into the 7.2 systems: badges, titles, the Champion train skin and its lock text
RMILE10.forEach(m => BADGES72.push(['rch10:' + m.k, m.ic, m.n, () => !!RCH.mile[m.k]]));
TITLES72.challenger = { n: 'Challenger', ok: () => rchSum10().tiers >= 10, how: 'Earn 10 ride challenge medals' };
TITLES72.royalty = { n: 'Ride Royalty', ok: () => !!RCH.mile.allGold, how: 'Earn every 🥇 Gold ride challenge' };
SKIN72.champ10 = { n: 'Champion', ic: '🏆', body: '#f2c230', accent: '#151515', seat: '#1b1b1b', restraint: '#ffffff', wheel: '#1a1a1a', light: '#fff2c8', paint: 'metallic', seatFin: 'leather', trim: 'racing', nose: 'spoiler', glow: 'steady', trail: 'sparkle', style: 'ride', lock: RSKIN10 };
LOCKS72[RSKIN10] = { rch10: 5 };
{ const f0 = lockText72; lockText72 = function (id) { return id === RSKIN10 && !PROG72.unlock[id] ? 'Unlock: earn 5 🥇 Gold ride challenges (' + rchSum10().golds + ' / 5)' : f0(id) } }

// ---- the 🎯 Ride challenges screen: a tab in the Goals window, a tile in 🎡 Park & tools
function rchCardHTML10(c) {
  const t = rchTier10(c.k), b = RCH.best[c.k], nx = t < 3 ? c.x[t] : c.x[2], p = b == null ? 0 : t >= 3 ? 1 : rchNear10(c, b, nx);
  const medals = RTIER10.map((T, i) => `<span class="${i < t ? 'on' : ''}" title="${T.n}: ${esc(c.t(c.x[i]))}">${T.ic}</span>`).join('');
  return `<div class="rch10c ${t >= 3 ? 'gold' : ''}" data-k="${c.k}"><span class="ic">${c.ic}</span><div><b>${esc(c.n)}</b><small class="nx">${t >= 3 ? '✓ All three medals' : esc(rchNext10(c))}</small><div class="pb72"><i style="width:${(p * 100).toFixed(0)}%"></i></div><small>${b == null ? 'Not tried yet' : 'Best: ' + esc(c.f(b)) + (RCH.on[c.k] ? ' · ' + esc(RCH.on[c.k]) : '')}${c.only === 'custom' ? ' · 🏗 your own coasters' : ''}</small></div><div class="md">${medals}</div></div>`;
}
function rchRender10(b) {
  const S = rchSum10(), mile = RMILE10.map(m => `<div class="${RCH.mile[m.k] ? 'on' : ''}"><span>${RCH.mile[m.k] ? m.ic : '🔒'}</span><b>${esc(m.n)}</b><small>${esc(m.d)}</small></div>`).join('');
  b.innerHTML = `<div class="rch10H"><b>🎯 ${S.tiers} / ${S.max} medals</b><small>🥇 ${S.golds} gold · every medal pays XP and 🪙 coins</small></div>
  <div class="rch10G">${RCH10.map(rchCardHTML10).join('')}</div>
  <h4 class="h7">🏆 Milestones</h4><div class="rch10M">${mile}</div>
  <p class="n7">Medals: 🥉 +${RTIER10[0].xp} XP · 🪙 ${RTIER10[0].coins} · 🥈 +${RTIER10[1].xp} XP · 🪙 ${RTIER10[1].coins} · 🥇 +${RTIER10[2].xp} XP · 🪙 ${RTIER10[2].coins}. Every finished lap is checked automatically, so just ride. Challenges count with standard Earth physics (switch the 🧪 Gravity Lab back to 🌍 Earth), except 🚀 Warp Speed, which is made for other planets. 🏗 challenges need a coaster you built in the Track Builder; 💰 budgets use the My Park build price.</p>`;
}
GOALTABS72.push(['rch10', '🎯 Ride challenges']);
{ const f0 = renderOv7; renderOv7 = function () { const o = $('#ov7'); if (o.dataset.k !== 'rch10') return f0(); $('#ov7T').textContent = '🎯 Ride challenges'; const b = $('#ov7B'); rchRender10(b); b.insertAdjacentHTML('afterbegin', `<div class="ovT72">${GOALTABS72.map(([t, l]) => `<button class="${t === 'rch10' ? 'on' : ''}" data-o72="tab" data-v="${t}">${l}</button>`).join('')}</div>`) } }
hubItem72('rch10', '🎯', 'Ride challenges', () => { const S = rchSum10(); return S.tiers + ' / ' + S.max + ' medals · 🥇 ' + S.golds }, () => openOv7('rch10'), 21);
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-rch10="open"]'); if (!b) return; e.stopPropagation(); const s7 = $('#sum7'); if (s7) s7.hidden = true; openOv7('rch10') }, true);

// ---- test hooks (reachable only inside the automated test harness, like every DEBUG80 hook)
DBG10.rch = {
  list: () => RCH10.map(c => ({ k: c.k, n: c.n, x: c.x.slice(), lo: !!c.lo, only: c.only || '', tier: rchTier10(c.k), best: RCH.best[c.k] == null ? null : RCH.best[c.k], next: rchNext10(c) })),
  state: () => JSON.parse(JSON.stringify(Object.assign({}, RCH, { sum: rchSum10() }))),
  saved: () => { try { return JSON.parse(localStorage.getItem(K10 + 'rch')) } catch (e) { return null } },
  lap: o => { const r = rchOnLap10(Object.assign({ name: 'Test lap', vmax: 0, gmax: 1, air: 0, inv: 0, time: 10, len: 300, h: 10, gmin: .5, std: true, dz: false, custom: false }, o || {})); return rchLast10 },
  last: () => rchLast10,
  // the facts a lap on the current ride would give (top speed, G, airtime, inversions and time from the Lab trace)
  facts: () => { const c = curCtx(); if (!c) return null; const tr = traceOf(c), st = statsOf(c, tr, SEATS[seat].off); return rchFacts10({ name: cur === CI ? '★ ' + curName : (ride(cur) || {}).name, custom: cur === CI, vmax: tr.vmax, gmax: st.gMax, air: st.air, inv: elementsOf(c, tr).inv, time: tr.T }) },
  cost: (L, h, inv) => rchCost10(L, h, inv), reset: () => { Object.assign(RCH, cleanRch10(null)); saveRch10(); return true },
  rewards: () => ({ tiers: RTIER10.map(T => [T.k, T.xp, T.coins]), skin: !!SKIN72.champ10, skinOpen: isUnlocked72(RSKIN10), lockText: lockText72(RSKIN10), titles: ['challenger', 'royalty'].filter(k => TITLES72[k].ok()), badges: Object.keys(PROG72.badges).filter(k => /^rch10:/.test(k)) })
};
