// ---- 10.0 MY PARK — the interface: top bar, message feed, build tray, placement bar, detail cards, day summary,
// first steps, and the ways in (title screen, Park & tools). One delegated click handler: every button says what it does
// with data-ty="action" and an optional data-v="value".
const TYFEED10 = { last: {} };
function toast10(msg, key, hi) {
  const now = performance.now(); if (key) { if (now - (TYFEED10.last[key] || -1e9) < 9000) return; TYFEED10.last[key] = now } if (!TY.on) return;
  const box = $ty10('tyFeed'), d = document.createElement('div'); d.className = 'tyMsg' + (hi ? ' hi' : ''); d.textContent = msg; box.appendChild(d); while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 450) }, hi ? 7000 : 4800);
}
const stars10 = r => { const n = clamp(Math.round(r / 20), 0, 5); return '★'.repeat(n) + '☆'.repeat(5 - n) };
const clock10 = P_ => 'Day ' + P_.day + ' · ' + clock72(P_.min);
let hudT10 = 0, cardT10 = 0, lastMoney10 = null;
function tyHud10(raw) {
  hudT10 -= raw; cardT10 -= raw; if (hudT10 > 0) return; hudT10 = .25; const P_ = TY.park, sb = P_.mode === 'sandbox';
  const mEl = $ty10('tyMoney'), mt = sb ? '∞' : money10(P_.money), mb = mEl.querySelector('b'); if (mb.textContent !== mt) { if (lastMoney10 != null && !sb && P_.money > lastMoney10 + 20) { mEl.classList.remove('up'); void mEl.offsetWidth; mEl.classList.add('up') } mb.textContent = mt; lastMoney10 = P_.money } mEl.classList.toggle('neg', !sb && P_.money < 0);
  setT($ty10('tyGuests').querySelector('b'), String(TY.guests.length)); setT($ty10('tyRate').querySelector('b'), String(Math.round(P_.rating))); setT($ty10('tyClock'), clock10(P_) + (parkOpen10() ? '' : ' · closed')); setT($ty10('tyWx').querySelector('i'), TY.lt && TY.lt.night > .6 ? '🌙' : WX10[P_.wx.k].ic); setT($ty10('tyName'), P_.name);
  if (cardT10 <= 0 && TY.sel && !ptrDown72 && !isTyping72()) { cardT10 = .5; cardDraw10() }
  if (TY.tool && TY.tool.k === 'place') placeBar10(); tut10();
}
// ---- the build tray (what you can build in the chosen category)
const CATS10 = { path: ['🛤', 'Paths', 'Drag on the ground to draw. Visitors only walk on paths.'], coaster: ['🎢', 'Coasters', 'Park-size versions of the game’s coasters, running their real lap.'], flat: ['🎠', 'Rides', 'Smaller rides. Each needs a path on one side.'], shop: ['🍔', 'Shops & facilities', 'Put them beside a path.'], deco: ['🌳', 'Scenery', 'Makes the park prettier: visitors are happier near it.'], land: ['🏞', 'Land', 'Tap a yellow plot next to your park to buy it.'], doze: ['🧹', 'Remove', 'Tap a path or a building to remove it (half the price comes back).'] };
function trayHTML10() {
  const T_ = TY.ui.cat, P_ = TY.park, lv = level10().lv, sb = P_.mode === 'sandbox'; if (!T_) return ''; const C = CATS10[T_]; let items = '';
  const card = (key, ic, name, sub, cost, need, wide) => { const lock = !sb && lv < need, poor = !lock && !canPay10(cost), on = TY.tool && TY.tool.key === key; return `<button class="tyIt${wide ? ' wide' : ''}${on ? ' on' : ''}${lock ? ' lock' : ''}${poor ? ' poor' : ''}" data-ty="pick" data-v="${html10(key)}"><i>${ic}</i><b>${html10(name)}</b><small>${sub}</small><em>${lock ? '🔒 Level ' + need : sb ? 'Free' : money10(cost)}</em></button>` };
  if (T_ === 'path') items = PATHS10.map((p, k) => `<button class="tyIt${TY.tool && TY.tool.k === 'path' && TY.tool.style === k ? ' on' : ''}" data-ty="pathStyle" data-v="${k}"><i><span class="tyDot" style="background:#${p.c.toString(16).padStart(6, '0')};width:22px;height:22px;border-radius:6px"></span></i><b>${p.n}</b><small>per tile</small><em>${sb ? 'Free' : money10(p.cost)}</em></button>`).join('');
  else if (T_ === 'coaster') items = coasterList10().map(c => ({ c, p: rideProf10(c.def) })).sort((a, b) => a.p.lv - b.p.lv || a.p.cost - b.p.cost).map(({ c, p }) => card(c.key, c.key[0] === 'u' ? '✏️' : '🎢', c.def.name, `${html10((c.def.type || '').replace(' · flagship', ''))}<br>😃 ${p.exc} · 💥 ${p.int} · ${p.seats} seats`, p.cost, p.lv, true)).join('') + `<button class="tyIt wide" data-ty="mine"><i>✏️</i><b>Your own designs</b><small>Bring a coaster you built in the Track Builder into the park</small><em>Choose…</em></button>`;
  else if (T_ === 'flat' || T_ === 'deco') items = Object.keys(CAT10).filter(k => CAT10[k].t === T_).map(k => { const c = CAT10[k]; return card(k, c.ic, c.n, T_ === 'flat' ? `😃 ${c.exc} · 💥 ${c.int} · ${c.cap} seats` : (c.job === 'bench' ? 'Rest for tired visitors' : c.job === 'bin' ? 'Less litter nearby' : c.job === 'lamp' ? 'Lights up at night' : 'Beauty +' + c.beauty), c.cost, c.lv) }).join('');
  else if (T_ === 'shop') items = Object.keys(CAT10).filter(k => CAT10[k].t === 'shop' || CAT10[k].t === 'fac').map(k => { const c = CAT10[k]; return card(k, c.ic, c.n, ({ food: 'For hungry visitors', drink: 'For thirsty visitors', treat: 'A happy snack', gift: 'Souvenirs', wc: 'Everyone needs one', info: 'Umbrellas and first aid' })[c.sells], c.cost, c.lv) }).join('');
  else if (T_ === 'land') items = `<div class="tyIt wide" style="cursor:default"><i>🏞</i><b>Next plot</b><small>32 × 32 m of new land</small><em>${sb ? 'You own it all' : money10(landPrice10(P_))}</em></div><div class="tyIt wide" style="cursor:default"><i>📐</i><b>${landCount10(P_)} of 36 plots</b><small>Yellow plots can be bought now. Grey ones need a neighbour first.</small></div>`;
  else items = `<div class="tyIt wide" style="cursor:default"><i>🧹</i><b>Tap to remove</b><small>Paths cost nothing to remove. Buildings give half their price back.</small></div>`;
  return `<div class="tyTrH"><b>${C[0]} ${C[1]}</b><small>${C[2]}</small><button class="tyX" data-ty="cat" data-v="" aria-label="Close">✕</button></div><div class="tyItems">${items}</div>`;
}
function placeBar10() { const el = $ty10('tyPlace'), T_ = TY.tool, G_ = TY.ghost; if (!T_ || T_.k !== 'place' || !G_) { el.hidden = true; return } el.hidden = false; const sb = TY.park.mode === 'sandbox', h = `<div class="pMsg${G_.why ? ' bad' : ''}"><b>${html10(G_.name)} · ${sb ? 'free' : money10(G_.cost)}</b><small>${G_.why ? '⚠ ' + html10(G_.why) : mobile ? 'Tap the ground to move it, then Build' : 'Click to build · R turns it'}</small></div><button class="btn" data-ty="rot" aria-label="Turn">↻</button><button class="btn primary" data-ty="build"${G_.why ? ' disabled style="opacity:.5"' : ''}>✓ Build</button><button class="btn" data-ty="cat" data-v="" aria-label="Cancel">✕</button>`; if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h } }
// ---- detail cards
const bar10 = (l, v, t) => `<span>${l}</span><u><s style="width:${clamp(Math.round(v), 0, 100)}%"></s></u><b>${t != null ? t : Math.round(v)}</b>`;
const SW10 = ['#e8503a', '#ff7a2f', '#ffc233', '#2fd18b', '#22e0ff', '#2b66d9', '#9b6bff', '#ff4fd8', '#f2f4f8', '#8a5a33', '#2a3140', '#111111'];
function cardHTML10() {
  const S = TY.sel, P_ = TY.park; if (!S) return '';
  if (S.guest) { const g = S.guest, T_ = GT10[g.ty], doing = g.st === 'queue' ? 'Queuing for ' + objName10(g.qo) : g.st === 'ride' || g.st === 'board' ? 'On ' + (g.ro ? objName10(g.ro) : 'a ride') : g.leave ? 'Heading home' : g.goal ? ({ ride: 'Walking to ' + (TY.objById.get(g.goal.id) ? objName10(TY.objById.get(g.goal.id)) : 'a ride'), food: 'Looking for food', drink: 'Looking for a drink', treat: 'Fancies a treat', gift: 'Shopping', wc: 'Needs a restroom', bench: 'Wants to sit down', info: 'Going to the info desk', stroll: 'Strolling', exit: 'Heading home' })[g.goal.k] || 'Looking around' : 'Looking around';
    return `<div class="tyCH"><i>${T_.ic}</i><div><b>${T_.n} #${g.id}</b><small>${html10(doing)}${g.th ? ' · “' + html10(g.th) + '”' : ''}</small></div><button class="tyX" data-ty="selx" aria-label="Close">✕</button></div>
<div class="tyBars">${bar10('😃 Happy', g.happy)}${bar10('🍔 Hunger', g.hunger)}${bar10('🥤 Thirst', g.thirst)}${bar10('⚡ Energy', g.energy)}${bar10('🚻 Restroom', g.bladder)}${bar10('🤢 Queasy', g.nausea)}</div>
<div class="tyKV"><span>Cash left<b>${money10(g.cash)}</b></span><span>Spent here<b>${money10(g.spent)}</b></span><span>Rides so far<b>${g.rides}</b></span><span>Likes<b>${T_.lo}–${T_.hi} intensity</b></span></div>
<div class="tyRow"><button class="btn${S.follow ? ' primary' : ''}" data-ty="follow">👣 ${S.follow ? 'Following' : 'Follow'}</button></div>` }
  const o = TY.objById.get(S.id); if (!o) return ''; const inf = objInfo10(o), R = o.rt || {}, ed = canEdit10(), tab = TY.ui.cardTab || 'main', sb = P_.mode === 'sandbox';
  const head = (sub) => `<div class="tyCH"><i>${inf.ic}</i><div><b>${html10(objName10(o))}</b><small>${sub}</small></div><button class="tyX" data-ty="selx" aria-label="Close">✕</button></div>`;
  if (inf.t === 'deco') return head('Scenery' + (inf.beauty ? ' · beauty +' + inf.beauty : '')) + (ed ? `<div class="tyRow"><button class="btn" data-ty="sell">♻ Remove (${money10(sellValue10(o))} back)</button></div>` : '');
  const status = !R.linked ? '<span class="tyChip bad">No path to it</span>' : R.broken ? '<span class="tyChip bad">Broken down</span>' : R.insp > 0 ? '<span class="tyChip warn">Inspection</span>' : o.open === false ? '<span class="tyChip warn">Closed</span>' : !parkOpen10() ? '<span class="tyChip warn">Park closed</span>' : '<span class="tyChip">Open</span>';
  if (inf.t === 'shop' || inf.t === 'fac') { const price = o.price >= 0 ? o.price : inf.price;
    return head((inf.t === 'fac' ? 'Facility' : 'Shop') + ' · ' + status) + `<div class="tyKV"><span>Sold<b>${Math.round(o.st.n)}</b></span><span>Takings<b>${money10(o.st.inc)}</b></span></div>` + (inf.sells === 'wc' ? '' : `<div class="tyStep">${ed ? '<button data-ty="price" data-v="-1" aria-label="Cheaper">−</button>' : ''}<span><b>${money10(price)}</b>${inf.sells === 'info' ? 'per umbrella (first aid is free)' : 'price · each sale costs you ' + money10(inf.unit)}</span>${ed ? '<button data-ty="price" data-v="1" aria-label="Dearer">+</button>' : ''}</div>`) + (ed ? `<div class="tyRow"><button class="btn" data-ty="open">${o.open === false ? '▶ Open' : '⏸ Close'}</button><button class="btn" data-ty="sell">♻ Sell (${money10(sellValue10(o))})</button></div>` : '') }
  // a ride
  const fare = fareOf10(o, inf), w = worth10(inf), like = o.st.rated ? o.st.like / o.st.rated : 0, waitS = R.q ? Math.round(R.q.length / Math.max(.05, inf.cap / (inf.dur + 14))) : 0;
  if (tab === 'up' && ed) return head('Upgrades') + Object.keys(UPG10).map(k => { const U_ = UPG10[k], l = o.up[k], c = upCost10(o, k); return `<div class="tyStep"><span><b>${U_[0]} ${U_[1]} ${'●'.repeat(l)}${'○'.repeat(3 - l)}</b>${l < 3 ? U_[2][l] : 'Fully upgraded'}</span>${l < 3 ? `<button data-ty="up" data-v="${k}" style="width:auto;padding:0 10px;font-size:12.5px"${canPay10(c) ? '' : ' disabled'}>${sb ? 'Free' : money10(c)}</button>` : ''}</div>` }).join('') + `<div class="tyRow"><button class="btn" data-ty="tab" data-v="main">‹ Back</button></div>`;
  if (tab === 'look' && ed) { const col = o.col || {}, sw = (k, l) => `<small style="color:var(--ink2);font-size:11px">${l}</small><div class="tySw">${SW10.map(c => `<button data-ty="col" data-v="${k}:${c}" style="background:${c}" class="${col[k] === c ? 'on' : ''}" aria-label="${l} ${c}"></button>`).join('')}</div>`, p = inf.prof;
    return head('Name and look') + `<div class="tyStep"><span><b>${html10(objName10(o))}</b>The name on the station sign</span><button data-ty="rename" style="width:auto;padding:0 10px;font-size:12.5px">✏ Rename</button></div>` + (inf.t === 'coaster' ? sw('rail', 'Track') + sw('body', 'Train') + sw('roof', 'Station roof') + `<small style="color:var(--ink2);font-size:11px">Station</small><div class="tySeg">${STN10.map((s_, k) => `<button data-ty="stn" data-v="${k}" class="${(col.stn || 0) === k ? 'on' : ''}">${s_.n}</button>`).join('')}</div><small style="color:var(--ink2);font-size:11px">Train</small><div class="tySeg">${Object.keys(SEATS10).filter(k => SEATS10[k] === SEATS10[p.style] && !!HANG10[k] === p.hang).map(k => `<button data-ty="trn" data-v="${k}" class="${(col.train || p.style) === k ? 'on' : ''}">${STY10[k] ? STY10[k].n : k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>` : sw('body', 'Colour')) + `<div class="tyRow"><button class="btn" data-ty="tab" data-v="main">‹ Back</button></div>` }
  return head(html10(inf.t === 'coaster' ? (inf.type || 'Coaster').replace(' · flagship', ' ⭐') : 'Flat ride') + ' · ' + status)
   + `<div class="tyBars">${bar10('😃 Excitement', inf.exc)}${bar10('💥 Intensity', inf.int)}${bar10('🤢 Nausea', inf.nau)}</div>`
   + `<div class="tyKV"><span>In the queue<b>${R.q ? R.q.length : 0} / ${R.qCap || 0}</b></span><span>Wait now<b>${waitS < 5 ? 'none' : '~' + waitS + ' s'}</b></span><span>Riders so far<b>${Math.round(o.st.n).toLocaleString('en-US')}</b></span><span>Visitors’ verdict<b>${o.st.rated ? '★ ' + like.toFixed(1) + ' / 5' : '—'}</b></span><span>Ticket income<b>${money10(o.st.inc)}</b></span><span>Running cost<b>${money10(o.st.run)}</b></span><span>Condition<b>${Math.round(o.rel)}%</b></span><span>${inf.t === 'coaster' ? 'Real ride' : 'Seats'}<b>${inf.t === 'coaster' ? fL(inf.prof.realH) + ' · ' + fV(inf.prof.realV) : inf.cap}</b></span></div>`
   + `<div class="tyStep">${ed ? '<button data-ty="price" data-v="-1" aria-label="Cheaper">−</button>' : ''}<span><b>${fare > 0 ? money10(fare) : 'Free'} a ride</b>${fare > w * 1.15 ? '⚠ Most visitors think that is too much' : 'Worth about ' + money10(w) + ' to most visitors'}</span>${ed ? '<button data-ty="price" data-v="1" aria-label="Dearer">+</button>' : ''}</div>`
   + `<div class="tyRow">${inf.t === 'coaster' ? '<button class="btn primary" data-ty="pov">🎥 Ride it</button>' : ''}${ed ? `<button class="btn" data-ty="open">${o.open === false ? '▶ Open' : '⏸ Close'}</button><button class="btn" data-ty="tab" data-v="up">⬆ Upgrade</button><button class="btn" data-ty="tab" data-v="look">🎨 Look</button><button class="btn" data-ty="sell">♻ Sell</button>` : ''}${inf.t === 'coaster' && inf.def && RIDES.includes(inf.def) ? '<button class="btn" data-ty="full">🎢 Full-size ride</button>' : ''}</div>`;
}
function cardDraw10() { const el = $ty10('tyCard'), h = TY.sel && !TY.tool ? cardHTML10() : ''; el.hidden = !h; if (h && el.dataset.h !== h) { const sc = el.scrollTop; el.innerHTML = h; el.dataset.h = h; el.scrollTop = sc } }
function tyUi10() {
  if (!TY.on) return; const P_ = TY.park, pov = !!TY.pov; document.body.classList.toggle('ty10pov', pov); $ty10('tyPov').hidden = !pov; if (pov) { const o = TY.objById.get(TY.pov); $ty10('tyPovN').textContent = '🎥 ' + (o ? objName10(o) : '') }
  const ed = canEdit10(); $ty10('tyBar').hidden = !ed; document.querySelectorAll('#tyBar [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === TY.ui.cat));
  document.querySelectorAll('#ty10 .tySpd button').forEach(b => b.classList.toggle('on', +b.dataset.v === P_.speed));
  const tr = $ty10('tyTray'), showTray = ed && !!TY.ui.cat && !(TY.tool && TY.tool.k === 'place'); tr.hidden = !showTray; if (showTray) { const h = trayHTML10(); if (tr.dataset.h !== h) { const sl = tr.querySelector('.tyItems'), x = sl ? sl.scrollLeft : 0; tr.innerHTML = h; tr.dataset.h = h; const s2 = tr.querySelector('.tyItems'); if (s2) s2.scrollLeft = x } }
  placeBar10(); cardDraw10();
  const bd = $ty10('tyBadge'); bd.hidden = !(TY.visit || P_.mode === 'sandbox'); bd.className = TY.visit ? 'visit' : ''; bd.textContent = TY.visit ? '👀 Visiting ' + TY.visit.name + (TY.visit.by ? ' by ' + TY.visit.by : '') : '🧪 Sandbox · everything is free';
  hudT10 = 0;
}
function tyUiOpen10() { $ty10('ty10').hidden = false; TY.ui.cat = ''; TY.ui.cardTab = 'main'; lastMoney10 = null; $ty10('tyFeed').innerHTML = ''; $ty10('tyDay').hidden = true; tyUi10() }
function tyUiClose10() { $ty10('ty10').hidden = true; document.body.classList.remove('ty10pov') }
// ---- one router for every button
async function tyAct10(a, v_) {
  const P_ = TY.park, o = TY.sel && TY.sel.id ? TY.objById.get(TY.sel.id) : null, inf = o ? objInfo10(o) : null;
  switch (a) {
    case 'hq': openPk72('ty10', v_ || undefined); return;
    case 'sp': P_.speed = +v_; tyUi10(); return;
    case 'view': camT10.yaw = 0; camT10.pitch = .9; camT10.dist = mobile ? 92 : 78; camFocus10(tX10(GATE_I10), tZ10(GATE_J10) - 18); return;
    case 'exit': tyExit10(); return;
    case 'cat': TY.ui.cat = v_ === TY.ui.cat ? '' : v_; if (!TY.ui.cat) toolSet10(null); else if (TY.ui.cat === 'path') toolSet10({ k: 'path', style: P_.look.path || 0 }); else if (TY.ui.cat === 'land') toolSet10({ k: 'land' }); else if (TY.ui.cat === 'doze') toolSet10({ k: 'doze' }); else toolSet10(null); return;
    case 'pathStyle': P_.look.path = +v_; toolSet10({ k: 'path', style: +v_ }); return;
    case 'pick': { const tmp = newObj10(v_, 0, 0, 0), i2 = objInfo10(tmp); if (!i2) return; if (P_.mode !== 'sandbox' && level10().lv < i2.lv) { toast10('🔒 ' + i2.n + ' unlocks at park level ' + i2.lv + ' (you are level ' + level10().lv + ')', 'lock'); return } toolSet10({ k: 'place', key: v_, r: 0 }); return }
    case 'rot': if (TY.tool && TY.tool.k === 'place') { TY.tool.r = (TY.tool.r + 1) % 4; if (TY.ghost) ghostSet10(TY.ghost.i, TY.ghost.j); placeBar10() } return;
    case 'build': if (TY.ghost && !TY.ghost.why) ghostBuild10(); else if (TY.ghost) toast10('⚠ ' + TY.ghost.why, 'nofit'); return;
    case 'selx': TY.sel = null; tyUi10(); return;
    case 'follow': if (TY.sel) { TY.sel.follow = !TY.sel.follow; camT10.dist = Math.min(camT10.dist, 34) } tyUi10(); return;
    case 'tab': TY.ui.cardTab = v_; tyUi10(); return;
    case 'povx': tyPov10(null); return;
    case 'dayx': $ty10('tyDay').hidden = true; return;
    case 'tutx': P_.tut = 9; $ty10('tyTut').hidden = true; return;
  }
  if (!o || !inf) return;
  switch (a) {
    case 'pov': if (o.rt && o.rt.trains) { TY.sel = null; tyPov10(o.id) } return;
    case 'full': { const i = RIDES.indexOf(inf.def); if (i >= 0) { tyExit10(); selectRide(i); setCam('ride'); say('Now riding the full-size ' + inf.def.name + ' · 🎡 Park & tools → My Park takes you back') } return }
    case 'open': if (canEdit10()) { o.open = o.open === false; if (o.open === false) rideClear10(o) } break;
    case 'price': if (canEdit10()) { const cur_ = inf.t === 'shop' || inf.t === 'fac' ? (o.price >= 0 ? o.price : inf.price) : fareOf10(o, inf); o.price = clamp(Math.round((cur_ + (+v_) * (cur_ >= 10 ? 1 : .5)) * 2) / 2, 0, 60) } break;
    case 'up': { const w = tyUpgrade10(o, v_); if (w && w !== 'x') toast10('⚠ ' + w, 'noup') } break;
    case 'sell': if (canEdit10() && await ask7('Sell ' + objName10(o) + ' for ' + money10(sellValue10(o)) + '?', 'Sell', 'Keep', true)) tyRemove10(o); break;
    case 'col': if (canEdit10()) { const [k, c] = String(v_).split(':'); o.col = o.col || {}; o.col[k] = c; tyRestyle10(o) } break;
    case 'stn': if (canEdit10()) { o.col = o.col || {}; o.col.stn = +v_; tyRestyle10(o) } break;
    case 'trn': if (canEdit10()) { o.col = o.col || {}; o.col.train = v_; tyRestyle10(o) } break;
    case 'rename': if (canEdit10()) { const n = await askText10('Name this ' + (inf.t === 'coaster' ? 'coaster' : 'ride'), objName10(o)); if (n != null) { o.name = cleanName(n).slice(0, 28); tyRestyle10(o) } } break;
  }
  tyUi10();
}
// a small text prompt (the viewer blocks window.prompt, so the park has its own)
function askText10(title, value) { return new Promise(res => { const w = document.createElement('div'); w.style.cssText = 'position:fixed;inset:0;z-index:15;display:flex;align-items:center;justify-content:center;background:rgba(3,8,20,.6);padding:16px'; w.innerHTML = `<div class="panel" style="width:min(360px,100%);padding:16px"><b style="font:800 16px var(--fD)">${html10(title)}</b><input type="text" maxlength="28" style="display:block;width:100%;box-sizing:border-box;margin:10px 0;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.3);color:#fff;font:600 16px var(--fUI)"><div style="display:flex;gap:8px"><button class="btn" style="flex:1">Cancel</button><button class="btn primary" style="flex:1">Save</button></div></div>`; document.body.appendChild(w); const inp = w.querySelector('input'), [no, yes] = w.querySelectorAll('button'), done = v_ => { w.remove(); res(v_) }; inp.value = value || ''; setTimeout(() => { try { inp.focus(); inp.select() } catch (e) {} }, 30); no.onclick = () => done(null); yes.onclick = () => done(inp.value); inp.onkeydown = e => { if (e.key === 'Enter') done(inp.value); if (e.key === 'Escape') done(null) } }) }
$ty10('ty10').addEventListener('click', e => { const b = e.target.closest('[data-ty]'); if (!b || b.disabled) return; const [a, arg] = b.dataset.ty.split(':'); tyAct10(a, arg != null ? arg : b.dataset.v) });
tyInput10();
// ---- end-of-day card: the day's books, exactly as they were booked
function dayCard10(d) {
  const el = $ty10('tyDay'), row = (l, v_, cls) => `<tr><td>${l}</td><td class="${cls || ''}">${v_}</td></tr>`, I = INC10.filter(k => d.led.inc[k[0]] > .5).map(k => row(k[1], money10(d.led.inc[k[0]]), 'pos')).join(''), E = EXP10.filter(k => d.led.exp[k[0]] > .5).map(k => row(k[1], '−' + money10(d.led.exp[k[0]]).replace('−', ''), 'neg')).join(''), profit = d.inc - d.exp;
  el.innerHTML = `<h3>🌙 Day ${d.day} is over</h3><p>${d.guests} visitors came (${d.peak} at once at the busiest) · ${d.rides} rides taken${d.turned ? ' · ' + d.turned + ' turned back at the gate price' : ''} · ${WX10[d.wx].ic} ${WX10[d.wx].n.toLowerCase()}</p><table class="tyLed">${I || row('No income today', '$0')}${E}<tr class="tot"><td>${profit >= 0 ? 'Profit' : 'Loss'}</td><td class="${profit >= 0 ? 'pos' : 'neg'}">${money10(profit)}</td></tr></table><div class="tyKV"><span>Park rating<b>${d.rating} / 100</b></span><span>Visitors went home<b>${d.happy >= 70 ? '😃 happy' : d.happy >= 50 ? '🙂 content' : '😕 unhappy'} (${d.happy})</b></span></div><div class="tyRow"><button class="btn" data-ty="hq:money">📊 The books</button><button class="btn primary" data-ty="dayx">Next day ▶</button></div>`; el.hidden = false;
}
// ---- first steps (career): one hint at a time, each goes away when you have done it
const TUT10 = [['Welcome to your park! 🎉', 'Visitors arrive at the gate at the bottom. Start with a ride: tap 🎠 Rides (or 🎢 Coasters) and pick one.', () => TY.park.objs.some(o => o.rt && o.rt.slots)], ['Connect it with a path 🛤', 'Visitors only walk on paths. Tap 🛤 Paths and drag from the entrance path to the ride. A coaster wants the path at its sandy queue yard.', () => TY.park.objs.some(o => o.rt && o.rt.slots && o.rt.linked)], ['Feed your visitors 🍔', 'Hungry or thirsty people get grumpy and go home. Put a 🍔 Burger Bar, 🥤 Drinks and 🚻 Restrooms beside a path.', () => ['food', 'drink'].every(k => TY.park.objs.some(o => CAT10[o.k] && CAT10[o.k].sells === k && o.rt && o.rt.linked))], ['You are in business 💰', 'Tap any ride to set its price, upgrade it or ride it. Tap a visitor to see what they think. 🏢 Office has the books, staff, goals and perks.', () => false]];
function tut10() { const P_ = TY.park, el = $ty10('tyTut'); if (TY.visit || P_.mode !== 'career' || P_.tut >= TUT10.length || TY.tool || TY.pov || TY.ui.cat || TY.sel || !$ty10('tyDay').hidden) { el.hidden = true; return } const T_ = TUT10[P_.tut]; let done = false; try { done = T_[2]() } catch (e) {} if (done) { P_.tut++; el.dataset.k = ''; return } if (el.dataset.k !== String(P_.tut)) { el.dataset.k = String(P_.tut); el.innerHTML = `<b>${T_[0]}</b>${T_[1]}<br><button class="btn" data-ty="tutx">${P_.tut === TUT10.length - 1 ? 'Got it' : 'Skip the tips'}</button>` } el.hidden = false }
// ---- ways in
function tyOpen10(slot) { const s_ = slot || LS10('lastSlot', 'career'), P_ = loadPark10(s_) || newPark10(s_); TY.visit = null; if (TY.on) savePark10(); TY.cam.set = false; const ok = tyEnter10(s_, P_); if (ok) { SS10('lastSlot', s_); TY.cam.set = true } return ok }
hubItem72('ty10', '🏗', 'My Park', () => { const P_ = TY.park || loadPark10(LS10('lastSlot', 'career')); return P_ ? P_.name + ' · day ' + P_.day + (P_.mode === 'sandbox' ? ' · sandbox' : ' · ' + money10(P_.money)) : 'Build and run your own park' }, () => tyOpen10(), 1);
HUBG82.unshift(['🏗 Build your own park', ['ty10']]);
{ const box = document.querySelector('#start .stCtas'); if (box) box.insertAdjacentHTML('afterbegin', '<button class="cta ty10cta" data-go="ty10"><b>🏗 My Park</b><small>Build it, fill it with visitors, run it</small></button>'); $('#start').addEventListener('click', e => { const b = e.target.closest('[data-go="ty10"]'); if (b) tyOpen10() }) }
