// ---- 10.0 OWNER CONTROL CENTER: a "My Park" tab. Real numbers read from the running park (nothing made up), and
// testing controls. Everything here only changes this browser; money given by the owner is booked in the park's
// ledger as "Owner grant" so the books still add up.
OSEC72.push(['v10', '🏗', 'My Park 10.0', ['own10']]); OSUBN72.own10 = 'My Park';
{ const nav = $('#own7 .ownT'); if (nav) nav.insertAdjacentHTML('beforeend', '<button data-tab="own10" data-sec="v10">🏗 My Park 10.0</button>') }
function own10HTML() {
  const P_ = TY.park, on = TY.on && !!P_, mine = on && !TY.visit, ob = (a, l, o = {}) => `<button class="ob ${o.cls || ''}" data-a="x10:${a}" ${o.v != null ? `data-v="${esc(String(o.v))}"` : ''}${o.off ? ' disabled' : ''}>${l}</button>`;
  const cell = (k, v_) => `<div><small>${k}</small><b>${v_}</b></div>`, tbl = (head, rows) => `<div class="ostat72"><table><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
  let h = `<h3>Mode</h3><div class="ogrid">${ob('open', '🏆 Open Career park', { v: 'career', cls: on && TY.slot === 'career' && !TY.visit ? 'on' : '' })}${ob('open', '🧪 Open Sandbox park', { v: 'sandbox', cls: on && TY.slot === 'sandbox' && !TY.visit ? 'on' : '' })}${ob('acct', AUTH10.s ? '👤 ' + html10(AUTH10.s.name || 'Account') : '👤 Account page')}${on ? ob('exit', '🎢 Back to the rides') : ''}</div>`;
  if (!on) { const sv = ['career', 'sandbox'].map(s_ => [s_, loadPark10(s_)]).filter(q => q[1]);
    return h + `<p class="on7">My Park is not open. Open it to see live numbers and use the testing controls.</p>` + (sv.length ? `<h3>Saved on this device</h3>` + tbl(['Park', 'Mode', 'Day', 'Money', 'Things', 'Rating'], sv.map(([s_, p]) => [html10(p.name), s_, p.day, p.mode === 'sandbox' ? '—' : money10(p.money), p.objs.length, Math.round(p.rating)])) : '') + own10Cloud() }
  const L = ledSum10(P_.led), lv = level10(), G_ = TY.guests, n = G_.length, avg = k => n ? Math.round(G_.reduce((a, g) => a + g[k], 0) / n) : 0, rides = P_.objs.filter(o => { const i = objInfo10(o); return i && (i.t === 'coaster' || i.t === 'flat') });
  h += `<h3>${html10(P_.name)} <small>${TY.visit ? 'visiting · read only' : P_.mode} · day ${P_.day} · ${clock72(P_.min)} · ${WX10[P_.wx.k].ic} ${WX10[P_.wx.k].n}</small></h3>
<div class="ostat10">${cell('Money', P_.mode === 'sandbox' ? '∞' : money10(P_.money))}${cell('Today in', money10(L.inc))}${cell('Today out', money10(L.exp))}${cell('Today profit', money10(L.inc - L.exp))}${cell('All-time in', money10(P_.tot.inc))}${cell('All-time out', money10(P_.tot.exp))}${cell('Loan', money10(P_.loan || 0))}${cell('Rating', Math.round(P_.rating))}${cell('Reputation', Math.round(P_.rep))}${cell('Level', lv.lv + (P_.mode === 'sandbox' ? '' : ' · ' + Math.round(lv.into) + '/' + lv.need + ' xp'))}${cell('Land plots', landCount10(P_) + ' / ' + NPL10 * NPL10)}${cell('Things built', P_.objs.length)}</div>
<h3>Visitors <small>${n} in the park now · ${Math.round(P_.tot.guests)} in all</small></h3>
<div class="ostat10">${cell('Walking', G_.filter(g => g.st === 'walk').length)}${cell('Queueing', G_.filter(g => g.st === 'queue').length)}${cell('Riding', G_.filter(g => g.st === 'ride' || g.st === 'board').length)}${cell('Leaving', G_.filter(g => g.leave).length)}${cell('Happiness', n ? avg('happy') + '%' : '—')}${cell('Hunger', n ? avg('hunger') + '%' : '—')}${cell('Thirst', n ? avg('thirst') + '%' : '—')}${cell('Energy', n ? avg('energy') + '%' : '—')}${GT10.map((T_, i) => cell(T_.ic + ' ' + T_.n, G_.filter(g => g.ty === i).length)).join('')}${cell('Litter', TY.litter.length)}${cell('Cleanliness', Math.round(TY.clean) + '%')}${cell('Staff', TY.staff.length)}</div>`;
  const th = Object.entries(TY.thoughts).filter(q => q[1] >= 1 && q[0].length > 2).sort((a, b) => b[1] - a[1]).slice(0, 5); if (th.length) h += `<p class="on7">Said most right now: ${th.map(q => '“' + html10(q[0]) + '” ×' + Math.round(q[1])).join(' · ')}</p>`;
  h += `<h3>Rides <small>${rides.length}</small></h3>` + (rides.length ? tbl(['Ride', 'State', 'Queue', 'Riders', 'Tickets', 'Running cost', 'Reliability', 'Verdict'], rides.map(o => { const R = o.rt || {}, i = objInfo10(o), stt = !R.linked ? '⚠ no path' : R.broken ? '🔧 broken' : R.insp > 0 ? '🛠 inspection' : o.open === false ? '⛔ closed' : '✅ open'; return [html10(objName10(o)), stt, R.q ? R.q.length : 0, o.st.n, money10(o.st.inc), money10(o.st.run), Math.round(o.rel) + '%', o.st.rated ? '★ ' + (o.st.like / o.st.rated).toFixed(1) : '—'] })) : '<p class="on7">No rides yet.</p>');
  const ri = renderer.info; h += `<h3>Performance <small>this device, right now</small></h3><div class="ostat10">${cell('Frames / s', Math.round(fps7))}${cell('Draw calls', ri.render.calls)}${cell('Triangles', ri.render.triangles.toLocaleString('en-US'))}${cell('Geometries', ri.memory.geometries)}${cell('Textures', ri.memory.textures)}${cell('Visitors drawn', n)}</div>`;
  if (mine) h += `<h3>Testing controls <small>this browser only</small></h3>
<div class="ogrid">${ob('cash', '💰 +$10,000', { v: 1e4, cls: 'gold', off: P_.mode === 'sandbox' })}${ob('cash', '💰 +$100,000', { v: 1e5, cls: 'gold', off: P_.mode === 'sandbox' })}${ob('level', '⭐ +1 park level', { off: P_.mode === 'sandbox' || lv.lv >= 30 })}${ob('spawn', '👥 +10 visitors', { v: 10 })}${ob('spawn', '👥 +50 visitors', { v: 50 })}${ob('cheer', '😃 Cheer everyone up')}${ob('home', '🚪 Send everyone home', { cls: 'dang' })}${ob('sweep', '🧹 Clear all litter')}</div>
<h3>Time <small>${clock72(P_.min)}</small></h3><div class="ogrid">${[[540, '🌅 09:00 opening'], [720, '☀️ 12:00 noon'], [1080, '🌇 18:00 evening'], [1245, '🌆 20:45 last rides'], [1290, '🌙 21:30 night']].map(q => ob('time', q[1], { v: q[0] })).join('')}${ob('endDay', '⏭ End the day now', { cls: 'gold' })}${[1, 2, 4, 8].map(v_ => ob('speed', '×' + v_ + ' speed', { v: v_, cls: P_.speed === v_ ? 'on' : '' })).join('')}</div>
<h3>Weather</h3><div class="ogrid">${Object.keys(WX10).map(k => ob('wx', WX10[k].ic + ' ' + WX10[k].n, { v: k, cls: P_.wx.k === k ? 'on' : '' })).join('')}${ob('wxAuto', P_.wx.auto === false ? '⏸ Weather is held' : '🔄 Weather changes by itself', { cls: P_.wx.auto === false ? '' : 'on' })}</div>
<h3>Rides</h3><div class="ogrid">${ob('break', '🔧 Break a random ride', { off: !rides.some(o => o.rt && o.rt.linked && !o.rt.broken), cls: 'dang' })}${ob('fix', '✅ Repair and service every ride')}${ob('wear', '📉 Wear every ride to 40%')}${ob('tut', '🎓 Show the tutorial again')}</div>
<p class="on7">Money given here is booked in today’s books as “Owner grant”, so income, costs and the balance still add up. Extra visitors pay the entrance fee like everyone else.</p>`;
  else h += `<p class="on7">You are visiting someone else’s park: testing controls are off here.</p>`;
  return h + own10Cloud();
}
function own10Cloud() {
  const st = CLOUD10.st, sv = Object.values(AUTH10.saves || {});
  return `<h3>Accounts &amp; cloud</h3><div class="ostat10">${[['Account', AUTH10.s ? html10(AUTH10.s.name || 'signed in') : 'signed out'], ['Cloud saves', AUTH10.s ? (AUTH10.syncErr ? '⚠ see below' : sv.length + ' in the account') : '—'], ['Park cloud', st === 'ok' ? '✅ connected' : st === 'missing' ? '⚠ database not set up' : st === 'off' ? '⚠ not reachable' : 'not checked yet'], ['Live presence', LIVE10.joined ? LIVE10.others.size + ' other(s) here' : 'off'], ['Published code', TY.park && TY.park.seen && TY.park.seen.cloud || '—'], ['Game version', TY10.version]].map(q => `<div><small>${q[0]}</small><b>${q[1]}</b></div>`).join('')}</div>${AUTH10.syncErr ? `<p class="on7">⚠ ${html10(AUTH10.syncErr)}</p>` : ''}${CLOUD10.why ? `<p class="on7">⚠ ${html10(CLOUD10.why)}</p>` : ''}
<div class="ogrid"><button class="ob" data-a="x10:cloud">🔄 Check the cloud now</button></div><p class="on7">The park cloud and accounts use the game’s Supabase project. Set-up steps are in the README (“Cloud &amp; accounts”).</p>`;
}
{ const f0 = renderOwn; renderOwn = function () { if (ownTab !== 'own10') return f0(); const b = $('#own7B'), y = b.scrollTop; clearInterval(perfTimer); b.innerHTML = `<div class="osub72"><b>🏗 My Park 10.0</b></div>` + own10HTML(); b.scrollTop = y; document.querySelectorAll('#own7 .ownT [data-sec]').forEach(x => x.classList.toggle('on', x.dataset.sec === 'v10')); perfTimer = setInterval(() => { if ($('#own7').hidden || ownTab !== 'own10') { clearInterval(perfTimer); return } if (!document.querySelector('#own7B :focus') && TY.on) renderOwn() }, 2500) } }
$('#own7').addEventListener('click', async e => {
  const t = e.target.closest('[data-a^="x10:"]'); if (!t) return; e.stopImmediatePropagation(); if (t.disabled) return; const a = t.dataset.a.slice(4), v_ = t.dataset.v, P_ = TY.park, mine = TY.on && P_ && !TY.visit;
  if (a === 'open') { closeOwner(); tyOpen10(v_ === 'sandbox' ? 'sandbox' : 'career'); ownTab = 'own10'; openOwner(); return }
  if (a === 'acct') { acctOpen10(); return } if (a === 'exit') { tyExit10(); renderOwn(); return } if (a === 'cloud') { CLOUD10.checked = 0; await cloudCheck10(true); if (AUTH10.s) await syncAll10(); renderOwn(); return }
  if (!mine) return;
  switch (a) {
    case 'cash': earn10('grant', +v_ || 0); sfx('coin'); break;
    case 'level': { const l = level10(); xp10(l.need - l.into + .01); break }
    case 'spawn': { const k = Math.min(+v_ || 0, SIM10.maxG - TY.guests.length); for (let i = 0; i < k; i++) guestSpawn10(true); break }// one by one: no families tagging along, so +10 is ten people
    case 'cheer': TY.guests.forEach(g => { g.happy = Math.max(g.happy, 92); g.hunger = Math.min(g.hunger, 20); g.thirst = Math.min(g.thirst, 20); g.energy = Math.max(g.energy, 80); g.nausea = 0 }); break;
    case 'home': TY.guests.forEach(g => { g.leave = true }); break;
    case 'sweep': TY.litter.length = 0; break;
    case 'time': P_.min = +v_ || 540; break;
    case 'endDay': P_.min = Math.max(P_.min, SIM10.close - .05); break;
    case 'speed': P_.speed = +v_ || 1; tyUi10(); break;
    case 'wx': setWx10(v_, true); P_.wx.auto = false; break;
    case 'wxAuto': P_.wx.auto = P_.wx.auto === false; break;
    case 'break': { const c = P_.objs.filter(o => { const i = objInfo10(o); return i && (i.t === 'coaster' || i.t === 'flat') && o.rt && o.rt.linked && !o.rt.broken }); if (c.length) { const o = pickR10(c); o.rt.broken = 1; o.rt.fix = 0; toast10('🔧 ' + objName10(o) + ' has broken down (owner test)', 'brk' + o.id, true) } break }
    case 'fix': P_.objs.forEach(o => { if (o.rt) { o.rt.broken = 0; o.rt.insp = 0 } if (o.rel != null) o.rel = 100 }); TY.staff.forEach(s_ => { if (s_.k === 'mech') { s_.job = null; s_.st = 'idle' } }); break;
    case 'wear': P_.objs.forEach(o => { if (o.rel != null) o.rel = Math.min(o.rel, 40) }); break;
    case 'tut': P_.tut = 0; tut10(); break;
  }
  savePark10(); renderOwn();
});
DBG10.owner = { html: () => own10HTML(), open: () => { ownTab = 'own10'; openOwner() }, act: (a, v_) => { const b = document.createElement('button'); b.dataset.a = 'x10:' + a; if (v_ != null) b.dataset.v = v_; $('#own7B').appendChild(b); b.click(); b.remove() } };
