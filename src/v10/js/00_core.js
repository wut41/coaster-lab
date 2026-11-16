// ---- 10.0 core: storage (coasterlab.v10.*), small helpers, test hooks
const K10 = 'coasterlab.v10.';
const LS10 = (k, d) => { try { const r = localStorage.getItem(K10 + k); return r == null ? d : JSON.parse(r) } catch (e) { return d } };
const SS10 = (k, val) => { if (RESTORE80) return false; try { localStorage.setItem(K10 + k, JSON.stringify(val)); return true } catch (e) { saveFail81('v10.' + k, e); return false } };
const DEL10 = k => { try { localStorage.removeItem(K10 + k) } catch (e) {} };
// PRIVATE storage. What identifies this device (its secret for the parks it published) and the signed-in session are
// kept under another key prefix than the saves. The game's "Save a copy", backup and restore features handle every
// key that starts with "coasterlab.", so they never contain these: a save file can be shared without giving the
// account or the device's parks away, and restoring someone's file never signs you in as them.
const KP10 = 'coasterlab-device.v10.';
const LSP10 = (k, d) => { try { const r = localStorage.getItem(KP10 + k); return r == null ? d : JSON.parse(r) } catch (e) { return d } };
const SSP10 = (k, val) => { try { localStorage.setItem(KP10 + k, JSON.stringify(val)); return true } catch (e) { return false } };
const DELP10 = k => { try { localStorage.removeItem(KP10 + k) } catch (e) {} };
try { for (const k of ['auth', 'dev', 'sync']) localStorage.removeItem(K10 + k) } catch (e) {}// early 10.0 test builds kept them with the saves
const DBG10 = {}; DEBUG80.v10 = DBG10;
const lerp10 = (a, b, t) => a + (b - a) * t;
const sat10 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const smooth10 = t => { t = sat10(t); return t * t * (3 - 2 * t) };
const rndi10 = n => Math.floor(Math.random() * n);
const pickR10 = a => a[rndi10(a.length)];
// small seeded generator (mulberry32) for anything that must be repeatable (generated coasters, guest looks)
function rng10(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
const hash10 = str => { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } return h };
const html10 = t => esc(t == null ? '' : t);
const money10 = x => (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('en-US');
// a guarded call: an optional 10.0 system must never be able to stop the simulator
const safe10 = (label, f) => { try { return f() } catch (e) { console.warn('10.0 ' + label, e); return undefined } };

// measured facts about a design (used by the ride catalogue, the generator and the tests)
function measure10(D_, noArea) {
  const r = inspect(D_);
  if (noArea) r.issues = r.issues.filter(i => i.code !== 'outside');
  if (!r.c || !r.tr) return { ok: false, crit: crits(r), warn: warns(r), issues: r.issues.map(i => i.sev + ':' + i.code + ':' + (i.secs || []).join(',')) };
  const st = statsOf(r.c, r.tr, 0), E = elementsOf(r.c, r.tr);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; r.g.P.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) });
  return {
    ok: crits(r) === 0, crit: crits(r), warn: warns(r), issues: r.issues.filter(i => i.sev === 'crit' || i.sev === 'warn').map(i => i.sev + ':' + i.code + ':' + (i.secs || []).join(',') + (i.val != null ? '=' + (+i.val).toFixed(2) : '')),
    len: Math.round(r.g.len), h: +st.maxH.toFixed(1), T: +r.tr.T.toFixed(1), vmax: +r.tr.vmax.toFixed(1), gMax: +st.gMax.toFixed(2), gMin: +st.gMin.toFixed(2), lat: +st.lat.toFixed(2),
    air: +st.air.toFixed(1), flo: +st.flo.toFixed(1), inv: E.inv, thrill: Math.round(st.thrill), intensity: Math.round(st.intensity), comfort: Math.round(st.comfort), stall: r.tr.stall >= 0, bb: [x0, x1, z0, z1].map(Math.round)
  };
}
DBG10.measure = (els, name, noArea) => measure10(mkD(name || 'Test', els), noArea);
