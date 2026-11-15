// ---- 10.1 DEVELOPER DIAGNOSTICS CENTER — a tab of the Owner Control Center (so it sits behind the owner passcode).
// One page that answers "is something wrong, and where?": frames per second and frame times, what the 3D engine is
// drawing and holding in memory, graphics quality, the cloud, the account, saves and storage, the most recent errors
// and a list of warnings worked out from all of those. Every number is measured on this device; nothing is sent
// anywhere. The recorders below are tiny and always on, so the page has history when it is opened after a problem.
const DIAG10 = {
  ft: new Float32Array(240), fi: 0, fn: 0, last: 0, long: 0, hitch: 0,// frame times (ms): a ring of the last 240 frames
  calls: 0, tris: 0, fr: { calls: 0, tris: 0, passes: 0 }, passes: 0,// the busiest draw of the last frame (the scene itself)
  errs: [], mem: [], memT: 0, lost: 0, slowT: 0, slowN: 0, ov: null, ovT: 0, est: null, estT: 0, t0: Date.now(), warned: {}
};
// ---- recorders
const diagTxt10 = a => { try { if (a instanceof Error) return a.stack || a.message; if (a && typeof a === 'object') { if (a.message) return String(a.stack || a.message); return JSON.stringify(a) } return String(a) } catch (e) { return '[unprintable]' } };
function diagLog10(level, args) {
  try { const txt = args.map(diagTxt10).join(' ').replace(/(eyJ[\w-]{6})[\w-]+\.[\w-]+\.[\w-]+/g, '$1…').slice(0, 500), l = DIAG10.errs[0]; if (l && l.txt === txt && l.level === level) { l.n++; l.t = Date.now(); return } DIAG10.errs.unshift({ t: Date.now(), level, txt, n: 1 }); if (DIAG10.errs.length > 60) DIAG10.errs.pop() } catch (e) {}
}
for (const lv of ['warn', 'error']) { const c0 = console[lv]; if (typeof c0 === 'function') console[lv] = function () { diagLog10(lv, [...arguments]); return c0.apply(console, arguments) } }
addEventListener('error', e => { if (e && e.message) diagLog10('error', ['Uncaught: ' + e.message + (e.filename ? ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')' : '')]) });
addEventListener('unhandledrejection', e => { const r = e && e.reason; diagLog10('error', ['Unhandled promise: ' + diagTxt10(r)]) });
try { renderer.domElement.addEventListener('webglcontextlost', () => { DIAG10.lost++; diagLog10('error', ['The graphics context was lost']) }) } catch (e) {}
// the scene is drawn first and the glow passes after it, each with its own counters: keep the biggest of the frame
{ const r0 = renderer.render.bind(renderer); renderer.render = function (s_, c_) { const out = r0(s_, c_), i = renderer.info.render, f = DIAG10.fr; f.passes++; if (i.calls > f.calls) { f.calls = i.calls; f.tris = i.triangles } return out } }
TICKS72.push(() => {
  const now = performance.now(), D_ = DIAG10; if (D_.last) { const ms = now - D_.last; if (ms < 2000 && !document.hidden) { D_.ft[D_.fi] = ms; D_.fi = (D_.fi + 1) % D_.ft.length; D_.fn = Math.min(D_.fn + 1, D_.ft.length); if (ms > 50) D_.long++; if (ms > 250) D_.hitch++ } }
  D_.last = now; D_.calls = D_.fr.calls; D_.tris = D_.fr.tris; D_.passes = D_.fr.passes; D_.fr.calls = D_.fr.tris = D_.fr.passes = 0;
  if (now - D_.memT > 5000) { D_.memT = now; const m = renderer.info.memory; D_.mem.push([Date.now(), m.geometries, m.textures]); if (D_.mem.length > 120) D_.mem.shift() }
  if (D_.ov && now - D_.ovT > 250) { D_.ovT = now; const s = diagFrames10(); D_.ov.textContent = s.fps + ' fps · ' + s.avg.toFixed(1) + ' ms (95%: ' + s.p95.toFixed(0) + ') · ' + D_.calls + ' draws · ' + (D_.tris / 1000).toFixed(0) + 'k tris' }
});
function diagFrames10() {
  const D_ = DIAG10, n = D_.fn; if (!n) return { n: 0, fps: 0, avg: 0, p95: 0, max: 0, min: 0, list: [] };
  const a = Array.from(D_.ft.subarray(0, n)), s = a.slice().sort((x, y) => x - y), sum = a.reduce((x, y) => x + y, 0), ord = n < D_.ft.length ? a : a.slice(D_.fi).concat(a.slice(0, D_.fi));
  return { n, fps: Math.round(1000 / (sum / n)), avg: sum / n, p95: s[Math.min(n - 1, Math.floor(n * .95))], max: s[n - 1], min: s[0], list: ord };
}
// ---- measurements made when the page is open
function diagGpu10() {
  const gl = renderer.getContext(), cap = renderer.capabilities, o = { api: cap.isWebGL2 ? 'WebGL 2' : 'WebGL 1', maxTex: cap.maxTextureSize, aniso: cap.getMaxAnisotropy ? cap.getMaxAnisotropy() : 1, gpu: '' };
  try { const x = gl.getExtension('WEBGL_debug_renderer_info'); o.gpu = String(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).slice(0, 90) } catch (e) {} return o;
}
// what the scene holds: an estimate from the sizes of the textures and vertex data in use (the browser gives no exact figure)
function diagMem10() {
  const tx = new Set(), ge = new Set(); let tb = 0, gb = 0, meshes = 0, vis = 0;
  scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) { meshes++; if (o.visible) vis++ } if (o.geometry) ge.add(o.geometry); const m = o.material; if (!m) return; for (const mm of (Array.isArray(m) ? m : [m])) { if (!mm) continue; for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'envMap', 'bumpMap', 'aoMap']) { const t = mm[k]; if (t && t.isTexture) tx.add(t) } } });
  if (scene.background && scene.background.isTexture) tx.add(scene.background); if (scene.environment && scene.environment.isTexture) tx.add(scene.environment);
  tx.forEach(t => { const im = t.image, w = im && (im.width || im.videoWidth) || 0, h = im && (im.height || im.videoHeight) || 0; tb += w * h * 4 * (t.generateMipmaps !== false ? 1.33 : 1) * (t.isCubeTexture ? 6 : 1) });
  ge.forEach(g => { for (const k in g.attributes) { const a = g.attributes[k]; if (a && a.array) gb += a.array.byteLength } if (g.index && g.index.array) gb += g.index.array.byteLength });
  return { tex: tx.size, texMB: tb / 1048576, geo: ge.size, geoMB: gb / 1048576, meshes, vis };
}
function diagStore10() {
  let tot = 0, n = 0; const big = [], grp = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k || k.indexOf('coasterlab') !== 0) continue; const sz = (localStorage.getItem(k) || '').length + k.length; tot += sz; n++; big.push([k, sz]); const g = /^coasterlab\.v10\.bak\./.test(k) ? 'My Park backups' : /^coasterlab\.v10\.park\./.test(k) ? 'My Park saves' : /^coasterlab-device\./.test(k) ? 'this device (private)' : /^coasterlab\.v80\.backup/.test(k) ? 'backup from before 8.0' : 'everything else'; grp[g] = (grp[g] || 0) + sz } } catch (e) {}
  big.sort((a, b) => b[1] - a[1]); return { tot, n, big: big.slice(0, 5), grp };
}
function diagEst10() { const D_ = DIAG10; if (performance.now() - D_.estT < 15000 && D_.estT) return; D_.estT = performance.now(); try { if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { D_.est = e && isFinite(e.quota) ? { usage: e.usage || 0, quota: e.quota } : null }).catch(() => {}) } catch (e) {} }
const diagKB10 = n => n > 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.max(n ? 1 : 0, Math.round(n / 1024)) + ' kB';
const diagAgo10 = t => { if (!t) return 'never'; const s = Math.max(0, (Date.now() - t) / 1000); return s < 2 ? 'just now' : s < 90 ? Math.round(s) + ' s ago' : s < 5400 ? Math.round(s / 60) + ' min ago' : Math.round(s / 3600) + ' h ago' };
const diagMask10 = e => { const m = /^(.)[^@]*(@.*)$/.exec(String(e || '')); return m ? m[1] + '•••' + m[2] : '' };
// ---- everything on the page comes from this one snapshot (the report that can be copied is the same data)
const DIAG_STORE10 = 5e6;// characters: about what a browser lets one site keep in local storage
function diagSnap10() {
  const fr = diagFrames10(), ri = renderer.info, mm = diagMem10(), st = diagStore10(), gp = diagGpu10(), D_ = DIAG10, cv = renderer.domElement, s = AUTH10.s, pm = performance.memory, G = typeof GFX10 === 'object' ? GFX10 : null;
  const m0 = D_.mem[0], m1 = D_.mem[D_.mem.length - 1];
  const o = {
    game: { version: TY10.version, upMin: Math.round((Date.now() - D_.t0) / 60000), mode: TY.on ? (TY.visit ? 'My Park (visiting)' : 'My Park (' + (TY.slot || '') + ')') : editing ? 'Track Builder' : 'Rides', ride: (() => { try { return ride(cur).name } catch (e) { return '' } })(), touch: !!mobile, screen: innerWidth + '×' + innerHeight, online: navigator.onLine !== false },
    frames: { fps: fr.fps, avgMs: +fr.avg.toFixed(2), p95Ms: +fr.p95.toFixed(1), maxMs: +fr.max.toFixed(1), n: fr.n, over50ms: D_.long, over250ms: D_.hitch },
    draw: { calls: D_.calls, triangles: D_.tris, passes: D_.passes, programs: ri.programs ? ri.programs.length : 0, objects: mm.meshes, visible: mm.vis },
    memory: { geometries: ri.memory.geometries, textures: ri.memory.textures, texturesInScene: mm.tex, textureMB: +mm.texMB.toFixed(1), geometryMB: +mm.geoMB.toFixed(1), jsHeapMB: pm && pm.usedJSHeapSize ? Math.round(pm.usedJSHeapSize / 1048576) : null, geoChange: m0 && m1 ? m1[1] - m0[1] : 0, texChange: m0 && m1 ? m1[2] - m0[2] : 0, watchedMin: m0 && m1 ? Math.round((m1[0] - m0[0]) / 60000) : 0, contextLost: D_.lost },
    graphics: { quality: QUAL[gq] ? QUAL[gq].n : gq, key: gq, pixelRatio: +renderer.getPixelRatio().toFixed(2), screenRatio: +(devicePixelRatio || 1).toFixed(2), canvas: cv.width + '×' + cv.height, shadows: !!renderer.shadowMap.enabled, effects: !!fxOn, post: G && G.last ? { on: !!G.last.post, glow: !!G.last.glow, levels: G.last.lv, sharpen: G.last.sharp || 0, auto: G.last.auto } : null, api: gp.api, gpu: gp.gpu, maxTexture: gp.maxTex, anisotropy: gp.aniso },
    cloud: { state: CLOUD10.st, why: CLOUD10.why || '', calls: NET10.n, failed: NET10.fail, retried: NET10.retry, lastMs: NET10.lastMs, lastOk: NET10.lastAt, lastCall: NET10.lastFn, lastError: NET10.lastErr, lastErrorAt: NET10.errAt, live: LIVE10.joined ? 'joined' : LIVE10.ws ? 'connecting' : LIVE10.retryT > 0 ? 'retrying' : 'off', liveOthers: LIVE10.others.size, liveRetries: LIVE10.tries, liveDropped: LIVE10.dropped, liveNote: LIVE10.err || '' },
    account: s ? { signedIn: true, name: s.name || '', email: diagMask10(s.email), tokenMin: Math.round((s.exp - Date.now()) / 60000), syncedAt: AUTH10.syncAt, syncing: !!AUTH10.syncing, syncError: AUTH10.syncErr || '', choice: !!AUTH10.ask, linkCheck: !!AUTH10.link, cloudSaves: Object.keys(AUTH10.saves || {}).length } : { signedIn: false },
    saves: { ok: SAVE10.ok && !SAVE10.stale, lastAt: SAVE10.at, count: SAVE10.n, failed: SAVE10.fails, otherTab: SAVE10.stale, backupsFailed: SAVE10.bakErr, locked: !!RESTORE80, slot: TY.slot || '', backups: TY.slot ? bakList10(TY.slot).length : 0, storeChars: st.tot, storeItems: st.n, groups: st.grp, biggest: st.big, quota: D_.est },
    park: TY.on && TY.park ? { visitors: TY.guests.length, cap: SIM10.maxG, staff: TY.staff.length, things: TY.park.objs.length, litter: TY.litter.length, simMs: +TY.perf.ms.toFixed(2), speed: TY.park.speed } : null,
    errors: D_.errs.slice(0, 20).map(e => ({ t: e.t, level: e.level, n: e.n, txt: e.txt }))
  };
  o.warnings = diagWarn10(o); return o;
}
// plain sentences for whatever looks wrong right now. Each has a level: bad (needs attention) or warn (worth a look).
function diagWarn10(o) {
  const w = [], f = o.frames, add = (lv, t, fix) => w.push({ lv, t, fix });
  if (f.n >= 30 && f.fps < 24) add('bad', 'Low frame rate: ' + f.fps + ' frames a second.', 'Lower the graphics quality in ⚙ Settings, or switch glow off.');
  else if (f.n >= 30 && f.fps < 40) add('warn', 'The frame rate is below 40 (' + f.fps + ').', 'A lower graphics quality will make it smoother.');
  if (f.n >= 60 && f.p95Ms > 60 && f.fps >= 24) add('warn', 'Uneven frames: one frame in twenty takes over ' + Math.round(f.p95Ms) + ' ms.', 'Something stalls now and then; watch the frame chart while you play.');
  if (o.draw.calls > 900) add('warn', o.draw.calls + ' draw calls in one frame.', 'A lot for a phone: fewer separate objects on screen would help.');
  if (o.draw.triangles > 1.8e6) add('warn', (o.draw.triangles / 1e6).toFixed(1) + ' million triangles in one frame.', 'A lot for a phone.');
  if (o.memory.textureMB > 380) add('warn', 'About ' + Math.round(o.memory.textureMB) + ' MB of textures.', 'Phones may reload the page when graphics memory runs out.');
  if (o.memory.watchedMin >= 3 && (o.memory.geoChange > 400 || o.memory.texChange > 60)) add('warn', 'Graphics memory keeps growing: ' + (o.memory.geoChange > 0 ? '+' : '') + o.memory.geoChange + ' geometries and ' + (o.memory.texChange > 0 ? '+' : '') + o.memory.texChange + ' textures in ' + o.memory.watchedMin + ' min.', 'If it never comes back down, something is not being freed.');
  if (o.memory.contextLost) add('bad', 'The graphics context was lost ' + o.memory.contextLost + ' time' + (o.memory.contextLost > 1 ? 's' : '') + '.', 'The device ran out of graphics memory. Reload, then use a lower quality.');
  if (o.graphics.post && o.graphics.post.auto >= 2) add('warn', 'Glow and sharpening were switched off automatically to keep the frame rate up.', '');
  if (!o.saves.ok) add('bad', o.saves.otherTab ? 'This tab is not saving: the park is open in another tab.' : 'The last save did not work.', o.saves.otherTab ? 'Close the other tab, or load the newer park here.' : 'Storage is full or blocked: download a backup file (🏢 Office → Park).');
  if (o.saves.locked) add('warn', 'Saving is locked until the page reloads (a restore or import is finishing).', '');
  if (o.saves.storeChars > DIAG_STORE10 * .8) add('bad', 'Local storage is ' + Math.round(o.saves.storeChars / DIAG_STORE10 * 100) + '% full.', 'Old backups and unused builder projects can be removed to make room.');
  else if (o.saves.storeChars > DIAG_STORE10 * .6) add('warn', 'Local storage is ' + Math.round(o.saves.storeChars / DIAG_STORE10 * 100) + '% full.', '');
  if (o.saves.backupsFailed) add('warn', o.saves.backupsFailed + ' automatic backup' + (o.saves.backupsFailed > 1 ? 's' : '') + ' did not fit in storage.', '');
  if (!o.game.online) add('warn', 'This device is offline.', 'The game works offline; the cloud and accounts wait until it is back.');
  if (o.cloud.state === 'missing') add('warn', 'The park cloud is not set up in the database.', 'Run the two SQL files in supabase/migrations (see the README).');
  if (o.cloud.failed >= 3 && o.cloud.failed > o.cloud.calls * .5) add('warn', o.cloud.failed + ' of ' + o.cloud.calls + ' cloud requests failed.', o.cloud.lastError);
  if (o.account.signedIn && o.account.syncError) add('warn', 'Cloud saves: ' + o.account.syncError, '');
  if (o.account.signedIn && o.account.choice) add('warn', 'The account and this device hold two different parks; the player has to choose.', '');
  if (o.park && o.park.visitors >= o.park.cap) add('warn', 'The park holds as many visitors as this device simulates (' + o.park.cap + ').', '');
  if (o.park && o.park.simMs > 9) add('warn', 'The park simulation takes ' + o.park.simMs.toFixed(1) + ' ms a frame.', 'Fewer visitors (a higher entrance fee) lightens it.');
  const errs = o.errors.filter(e => e.level === 'error').length; if (errs) add('bad', errs + ' error' + (errs > 1 ? 's' : '') + ' recorded since the game started.', 'See “Recent errors” below.');
  return w;
}
// ---- the page
OSEC72.push(['diag10', '🩺', 'Diagnostics', ['diag10']]); OSUBN72.diag10 = 'Diagnostics';
{ const nav = $('#own7 .ownT'); if (nav) nav.insertAdjacentHTML('beforeend', '<button data-tab="diag10" data-sec="diag10">🩺 Diagnostics</button>') }
function diagHTML10() {
  diagEst10(); const o = diagSnap10(), cell = (k, v_, cls) => `<div class="${cls || ''}"><small>${k}</small><b>${v_}</b></div>`, yes = b => b ? 'on' : 'off', f = o.frames, m = o.memory, g = o.graphics, c = o.cloud, a = o.account, sv = o.saves;
  const fcls = f.n < 30 ? '' : f.fps < 24 ? 'bad' : f.fps < 40 ? 'warn' : 'good', pct = Math.round(sv.storeChars / DIAG_STORE10 * 100);
  let h = `<h3>Health <small>${o.warnings.length ? o.warnings.length + ' thing' + (o.warnings.length > 1 ? 's' : '') + ' to look at' : 'all clear'}</small></h3>` + (o.warnings.length ? `<div class="dgW">${o.warnings.map(w => `<div class="${w.lv}"><i>${w.lv === 'bad' ? '⛔' : '⚠️'}</i><div><b>${html10(w.t)}</b>${w.fix ? `<small>${html10(w.fix)}</small>` : ''}</div></div>`).join('')}</div>` : '<div class="dgW"><div class="good"><i>✅</i><div><b>Nothing looks wrong right now</b><small>Frame rate, memory, saves and the cloud are all inside their normal ranges.</small></div></div></div>');
  h += `<h3>Frames <small>last ${f.n} frames · ${html10(o.game.mode)}${o.game.ride && !TY.on ? ' · ' + html10(o.game.ride) : ''}</small></h3><div class="ostat10">${cell('Frames / s', f.fps, fcls)}${cell('Frame time', f.avgMs.toFixed(1) + ' ms')}${cell('95% under', f.p95Ms.toFixed(0) + ' ms', f.p95Ms > 60 ? 'warn' : '')}${cell('Slowest', f.maxMs.toFixed(0) + ' ms')}${cell('Over 50 ms', f.over50ms, f.over50ms > 30 ? 'warn' : '')}${cell('Over 250 ms', f.over250ms, f.over250ms > 3 ? 'warn' : '')}</div><canvas id="dgSpark" class="dgSpark" width="600" height="72" role="img" aria-label="Frame times of the last ${f.n} frames"></canvas><p class="on7">Each bar is one frame: green is under 20 ms (50 a second or better), yellow under 34 ms, red slower. The line marks 16.7 ms (60 a second).</p>`;
  h += `<h3>3D engine <small>three.js r${THREE.REVISION}</small></h3><div class="ostat10">${cell('Draw calls', o.draw.calls, o.draw.calls > 900 ? 'warn' : '')}${cell('Triangles', o.draw.triangles.toLocaleString('en-US'), o.draw.triangles > 1.8e6 ? 'warn' : '')}${cell('Views drawn', o.draw.passes)}${cell('Shaders', o.draw.programs)}${cell('Objects', o.draw.objects.toLocaleString('en-US'))}${cell('Shown', o.draw.visible.toLocaleString('en-US'))}</div>`;
  h += `<h3>Memory <small>estimates</small></h3><div class="ostat10">${cell('Geometries', m.geometries)}${cell('Textures', m.textures)}${cell('Texture memory', '≈ ' + m.textureMB.toFixed(0) + ' MB', m.textureMB > 380 ? 'warn' : '')}${cell('Vertex memory', '≈ ' + m.geometryMB.toFixed(1) + ' MB')}${cell('Script memory', m.jsHeapMB != null ? m.jsHeapMB + ' MB' : 'not reported')}${cell('Change in ' + (m.watchedMin || 0) + ' min', (m.geoChange >= 0 ? '+' : '') + m.geoChange + ' geo · ' + (m.texChange >= 0 ? '+' : '') + m.texChange + ' tex', m.watchedMin >= 3 && (m.geoChange > 400 || m.texChange > 60) ? 'warn' : '')}</div><p class="on7">Texture and vertex memory are worked out from the sizes of what the scene uses; browsers do not report the real figure. Counts that keep climbing while you only watch are the sign of a leak.</p>`;
  h += `<h3>Graphics quality</h3><div class="ostat10">${cell('Quality', html10(g.quality))}${cell('Pixel ratio', g.pixelRatio + ' of ' + g.screenRatio)}${cell('Drawing size', g.canvas)}${cell('Shadows', yes(g.shadows))}${cell('Effects', yes(g.effects))}${cell('Glow', g.post ? (g.post.glow ? g.post.levels + ' levels' : 'off') : 'n/a')}${cell('Sharpen', g.post && g.post.sharpen ? g.post.sharpen : 'off')}${cell('Auto step-down', g.post ? ['none', 'lighter glow', 'glow off'][Math.min(2, g.post.auto || 0)] : 'n/a', g.post && g.post.auto >= 2 ? 'warn' : '')}${cell('API', g.api)}${cell('Largest texture', g.maxTexture)}</div><p class="on7">Graphics chip: ${html10(g.gpu || 'not reported')}</p>`;
  h += `<h3>Cloud <small>${o.game.online ? 'device online' : 'device offline'}</small></h3><div class="ostat10">${cell('Park cloud', c.state === 'ok' ? '✅ connected' : c.state === 'missing' ? '⚠ not set up' : c.state === 'off' ? '⚠ not reachable' : 'not checked', c.state === 'ok' ? 'good' : c.state === 'unknown' ? '' : 'warn')}${cell('Requests', c.calls + (c.failed ? ' · ' + c.failed + ' failed' : ''), c.failed >= 3 && c.failed > c.calls * .5 ? 'warn' : '')}${cell('Retried', c.retried)}${cell('Last answer', c.lastOk ? c.lastMs + ' ms · ' + diagAgo10(c.lastOk) : 'none yet')}${cell('Live presence', c.live + (c.live === 'joined' ? ' · ' + c.liveOthers + ' other' + (c.liveOthers === 1 ? '' : 's') : ''))}${cell('Live ignored', c.liveDropped)}</div>${c.lastError ? `<p class="on7">Last failed request (${html10(diagAgo10(c.lastErrorAt))}): ${html10(c.lastError)}</p>` : ''}${c.why ? `<p class="on7">⚠ ${html10(c.why)}</p>` : ''}${c.liveNote ? `<p class="on7">Live: ${html10(c.liveNote)}</p>` : ''}`;
  h += `<h3>Account</h3><div class="ostat10">${a.signedIn ? cell('Signed in', html10(a.name || 'yes'), 'good') + cell('Email', html10(a.email || '—')) + cell('Session renews', a.tokenMin > 0 ? 'in ' + a.tokenMin + ' min' : 'now') + cell('Cloud saves', a.cloudSaves) + cell('Last sync', a.syncing ? 'syncing…' : diagAgo10(a.syncedAt), a.syncError ? 'warn' : '') + cell('Waiting on', a.choice ? 'a choice' : a.linkCheck ? 'link check' : 'nothing', a.choice || a.linkCheck ? 'warn' : '') : cell('Signed in', 'no') + cell('Cloud saves', '—')}</div>${a.signedIn && a.syncError ? `<p class="on7">⚠ ${html10(a.syncError)}</p>` : ''}`;
  h += `<h3>Saves and storage</h3><div class="ostat10">${cell('Saving', sv.otherTab ? 'stopped (other tab)' : sv.ok ? '✅ working' : '⛔ failing', sv.ok ? 'good' : 'bad')}${cell('Last park save', sv.lastAt ? diagAgo10(sv.lastAt) : 'not this session')}${cell('Saves', sv.count + (sv.failed ? ' · ' + sv.failed + ' failed' : ''), sv.failed ? 'warn' : '')}${cell('Backups', sv.slot ? sv.backups + ' of ' + BAK_N10 + ' (' + html10(sv.slot) + ')' : '—')}${cell('Storage used', diagKB10(sv.storeChars) + ' · ' + pct + '%', pct > 80 ? 'bad' : pct > 60 ? 'warn' : '')}${cell('Items', sv.storeItems)}${sv.quota ? cell('Browser allows', diagKB10(sv.quota.quota) + ' in all') : ''}</div>
<div class="dgBar" role="img" aria-label="Local storage ${pct}% used"><i style="width:${Math.min(100, pct)}%" class="${pct > 80 ? 'bad' : pct > 60 ? 'warn' : ''}"></i></div>
<div class="ostat72"><table><tr><th>Largest items</th><th>Size</th></tr>${sv.biggest.map(q => `<tr><td>${html10(q[0])}</td><td>${diagKB10(q[1])}</td></tr>`).join('')}${Object.keys(sv.groups).map(k => `<tr><td><i>${html10(k)} in all</i></td><td>${diagKB10(sv.groups[k])}</td></tr>`).join('')}</table></div><p class="on7">“Storage used” counts the game’s own items against about 5 MB, which is what most browsers allow a site (Safari allows less in private windows).</p>`;
  if (o.park) h += `<h3>My Park simulation</h3><div class="ostat10">${cell('Visitors', o.park.visitors + ' of ' + o.park.cap, o.park.visitors >= o.park.cap ? 'warn' : '')}${cell('Staff', o.park.staff)}${cell('Things built', o.park.things)}${cell('Litter', o.park.litter)}${cell('Sim time', o.park.simMs.toFixed(1) + ' ms / frame', o.park.simMs > 9 ? 'warn' : '')}${cell('Speed', '×' + o.park.speed)}</div>`;
  h += `<h3>Recent errors <small>${DIAG10.errs.length ? DIAG10.errs.length + ' kept, newest first' : 'none'}</small></h3>` + (DIAG10.errs.length ? `<div class="olog83 dgLog">${DIAG10.errs.slice(0, 30).map(e => `<div class="${e.level}"><small>${html10(new Date(e.t).toLocaleTimeString())}${e.n > 1 ? ' ×' + e.n : ''}</small><span>${e.level === 'error' ? '⛔' : '⚠️'} ${html10(e.txt)}</span></div>`).join('')}</div>` : '<p class="on7">Nothing has gone wrong since the game started. Warnings and errors the game catches are listed here with the time they happened.</p>');
  h += `<h3>Tools</h3><div class="ogrid"><button class="ob" data-a="xd:copy">📋 Copy the report</button><button class="ob" data-a="xd:file">⬇ Download the report</button><button class="ob ${DIAG10.ov ? 'on' : ''}" data-a="xd:ov">${DIAG10.ov ? '📈 Frame counter: ON' : '📈 Frame counter on screen'}</button><button class="ob" data-a="xd:clear">🧹 Clear the error list</button><button class="ob" data-a="xd:cloud">🔄 Check the cloud now</button></div><textarea id="dgIO" class="dgIO" rows="4" readonly hidden aria-label="Diagnostics report"></textarea>
<p class="on7">Version ${html10(o.game.version)} · running for ${o.game.upMin} min · screen ${html10(o.game.screen)}${o.game.touch ? ' · touch' : ''}. The report holds the numbers on this page (your email is shortened, sign-in tokens are never included). It is made on this device and goes nowhere unless you send it.</p>`;
  return h;
}
function diagSpark10() {
  const cv = document.getElementById('dgSpark'); if (!cv) return; const x = cv.getContext('2d'), W = cv.width, H = cv.height, f = diagFrames10(), n = f.list.length, top = Math.max(50, Math.min(200, f.max * 1.1)), bw = W / DIAG10.ft.length;
  x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) { const v = f.list[i], hh = Math.max(1, Math.min(1, v / top) * (H - 2)); x.fillStyle = v < 20 ? '#4ade80' : v < 34 ? '#ffc233' : '#ff6b6b'; x.fillRect(i * bw, H - hh, Math.max(1, bw - .5), hh) }
  const y = H - 16.7 / top * (H - 2); x.strokeStyle = 'rgba(255,255,255,.55)'; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); x.setLineDash([]);
}
function diagReport10() { const o = diagSnap10(); return JSON.stringify({ app: 'Coaster Lab', kind: 'diagnostics', made: new Date().toISOString(), ...o }, null, 1) }
{ const f0 = renderOwn; renderOwn = function () {
  if (ownTab !== 'diag10') return f0();
  const b = $('#own7B'), y = b.scrollTop, io = document.getElementById('dgIO'), keep = io && !io.hidden ? io.value : null; clearInterval(perfTimer);
  b.innerHTML = `<div class="osub72"><b>🩺 Diagnostics</b></div>` + (safe10('diagnostics', diagHTML10) || '<p class="on7">The diagnostics page could not be drawn. The reason is in the browser console.</p>'); b.scrollTop = y; diagSpark10(); if (keep != null) { const n = document.getElementById('dgIO'); if (n) { n.hidden = false; n.value = keep } }
  document.querySelectorAll('#own7 .ownT [data-sec]').forEach(x => x.classList.toggle('on', x.dataset.sec === 'diag10'));
  perfTimer = setInterval(() => { if ($('#own7').hidden || ownTab !== 'diag10') { clearInterval(perfTimer); return } if (!document.querySelector('#own7B :focus')) renderOwn() }, 1500);
} }
$('#own7').addEventListener('click', async e => {
  const t = e.target.closest('[data-a^="xd:"]'); if (!t) return; e.stopImmediatePropagation(); const a = t.dataset.a.slice(3);
  if (a === 'copy' || a === 'file') { const txt = diagReport10(), io = document.getElementById('dgIO'); if (a === 'file') { say(fileSave10('coaster-lab-diagnostics-' + new Date().toISOString().slice(0, 10) + '.json', txt) ? '⬇ Report saved to your downloads' : 'Could not save the report'); return } if (io) { io.hidden = false; io.value = txt } try { await navigator.clipboard.writeText(txt); say('📋 Report copied') } catch (er) { if (io) { io.focus(); io.select() } say('Select the text in the box and copy it') } return }
  if (a === 'ov') { diagOverlay10(!DIAG10.ov); renderOwn(); return }
  if (a === 'clear') { DIAG10.errs.length = 0; DIAG10.long = DIAG10.hitch = 0; renderOwn(); return }
  if (a === 'cloud') { CLOUD10.checked = 0; await cloudCheck10(true); if (AUTH10.s) await syncAll10(); renderOwn(); return }
});
// a small frame counter that stays on screen while you play (this session only; switched on from this page)
function diagOverlay10(on) {
  if (!on) { if (DIAG10.ov) DIAG10.ov.remove(); DIAG10.ov = null; return } if (DIAG10.ov) return;
  const d = document.createElement('div'); d.id = 'dgOv'; d.className = 'dgOv'; d.setAttribute('aria-hidden', 'true'); d.textContent = '…'; document.body.appendChild(d); DIAG10.ov = d;
}
DBG10.diag = { snap: () => diagSnap10(), html: () => diagHTML10(), report: () => diagReport10(), open: () => { ownTab = 'diag10'; openOwner() }, log: (lv, t) => diagLog10(lv, [t]), errs: () => DIAG10.errs.map(e => ({ ...e })), overlay: on => { diagOverlay10(on); return !!DIAG10.ov }, ovText: () => DIAG10.ov ? DIAG10.ov.textContent : '', warn: o => diagWarn10(o), frames: () => { const f = diagFrames10(); return { n: f.n, fps: f.fps, avg: f.avg, p95: f.p95, max: f.max } } };
