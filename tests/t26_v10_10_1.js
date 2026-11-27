// Coaster Lab 10.10.1: the release check for the current build (builds/coaster_lab_v10_10_1.html).
// It only watches the game; it never changes it. (1) The build is 10.10.1 and starts without errors on a small phone,
// a phone and a desktop. (2) The page's security fence (Content Security Policy) is as strict as it was when 10.10.1
// shipped, and the page asks only the hosts that fence allows. (3) The owner and moderator locks still use slow,
// salted fingerprints, never the passcode itself. (4) Switching rides and coming back does not pile up 3D memory
// (10.10.1 fixed a leak there). (5) With no connection the cloud parts fail quietly.
//   node t26_v10_10_1.js                     CL_F=<other build> node t26_v10_10_1.js
const { open } = require('./harness');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'builds/coaster_lab_v10_10_1.html', SH = __dirname + '/shots/';
const WANT = process.env.CL_VERSION || '10.10.1';
fs.mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const quiet = e => e.filter(x => !/Failed to load resource|net::ERR|WebSocket/.test(x));
const HTML = fs.readFileSync(F, 'utf8');
// the hosts the 10.10.1 page may reach, and only these
const HOSTS = ['coaster.test', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'd2ol7oe51mr4n9.cloudfront.net', 'celqksoohozvqbdktapm.supabase.co'];
(async () => {
  // ---------- 1. version and a clean start on three screens
  for (const [w, h, mobile] of [[320, 568, true], [390, 844, true], [1280, 800, false]]) {
    const { browser, page, errors } = await open(F, { w, h, mobile });
    const v = await page.evaluate(() => window.__coasterDebug && window.__coasterDebug.version);
    const s = await page.evaluate(() => ({ canvas: !!document.querySelector('canvas'), wide: document.documentElement.scrollWidth - innerWidth }));
    ok(v === WANT, `${w}×${h}: the build says it is ${WANT} (it says ${v})`);
    ok(s.canvas && s.wide <= 1, `${w}×${h}: the 3D view is up and nothing is wider than the screen`);
    const e = quiet(errors); ok(e.length === 0, `${w}×${h}: starts with no errors` + (e.length ? ': ' + e.join(' | ').slice(0, 300) : ''));
    await page.screenshot({ path: SH + `v10101_start_${w}x${h}.png` });
    await browser.close();
  }

  // ---------- 2. the security fence (Content Security Policy) and the hosts the page asks
  {
    const m = HTML.match(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content=(?:"([^"]+)"|'([^']+)')/i), csp = {};
    if (m) for (const part of (m[1] || m[2]).split(';')) { const [k, ...v] = part.trim().split(/\s+/); if (k) csp[k] = v }
    ok(!!m, 'the page carries a Content Security Policy');
    const none = d => (csp[d] || []).join(' ') === "'none'";
    ok(none('default-src') && none('object-src') && none('frame-src') && none('base-uri') && none('script-src-attr'), "default, plugins, frames, base URL and inline event handlers are all 'none'");
    ok(!(csp['script-src'] || []).some(s => /unsafe-eval|\*|^https?:$/.test(s)), `scripts: no eval and no wildcard (${(csp['script-src'] || []).join(' ')})`);
    const allowed = Object.values(csp).flat().filter(s => /^(https|wss):\/\//.test(s)).map(s => s.replace(/^\w+:\/\//, '').replace(/\/.*$/, ''));
    ok(allowed.every(h => HOSTS.includes(h)), `the fence names only known hosts (${[...new Set(allowed)].join(', ')})`);
    const { browser, ctx, page } = await open(F, { w: 390, h: 844 }), asked = new Set();
    ctx.on('request', r => { try { asked.add(new URL(r.url()).hostname) } catch (e) {} });
    await page.reload(); await page.waitForFunction(() => window.__booted === true, null, { timeout: 60000 }); await page.waitForTimeout(2500);
    const odd = [...asked].filter(h => h && !HOSTS.includes(h));
    ok(odd.length === 0, `while starting, the page asks only allowed hosts (${[...asked].join(', ')})`);
    await browser.close();
  }

  // ---------- 3. owner and moderator locks: fingerprints only
  {
    const own = HTML.match(/OWNER_KDF72=\{s:'([0-9a-f]+)',i:(\d+),s2:'([0-9a-f]+)',i2:(\d+),h2:'([0-9a-f]{64})'\}/), mod = HTML.match(/MOD_KDF83=\{s:'([0-9a-f]+)',i:(\d+),h:'([0-9a-f]{64})'\}/);
    ok(own && +own[2] >= 600000 && +own[4] >= 1400000 && own[1].length >= 32 && own[3].length >= 32, `the owner lock is a salted PBKDF2 fingerprint (${own ? own[2] + ' + ' + own[4] : '?'} rounds)`);
    ok(mod && +mod[2] >= 600000 && mod[1].length >= 32, `the moderator lock is a salted PBKDF2 fingerprint (${mod ? mod[2] : '?'} rounds)`);
    ok(/PBKDF2/.test(HTML) && !/(owner|mod)[_ ]?(pass(word|code)?|pw)\s*[:=]\s*['"][^'"]{4,}['"]/i.test(HTML), 'no owner or moderator passcode is written in the page');
  }

  // ---------- 4. switching rides does not pile up 3D memory
  {
    const { browser, page, errors } = await open(F, { w: 1280, h: 800, mobile: false });
    const mem = () => page.evaluate(() => window.__coasterDebug.mem());
    const n = await page.evaluate(() => { const r = window.__coasterDebug.rides; return Array.isArray(r) ? r.length : (r && typeof r === 'object' ? Object.keys(r).length : 0) });
    const m0 = await mem(); const seen = [];
    for (let round = 0; round < 2; round++) for (const i of [1, 2, 3, 0]) { await page.evaluate(i => window.__coasterDebug.select(i), i); await page.waitForTimeout(900); seen.push(await page.evaluate(() => window.__coasterDebug.state().cur)) }
    await page.waitForTimeout(1200); const m1 = await mem();
    ok(seen.slice(-1)[0] === 0 && new Set(seen).size >= 3, `rides switch and come back to the first (${seen.join('→')}, ${n || '?'} rides)`);
    ok(m1.geometries <= m0.geometries * 1.25 + 10 && m1.textures <= m0.textures * 1.25 + 5, `after 8 ride switches, 3D memory is back near the start (geometries ${m0.geometries}→${m1.geometries}, textures ${m0.textures}→${m1.textures})`);
    const e = quiet(errors); ok(e.length === 0, 'no errors while switching rides' + (e.length ? ': ' + e.join(' | ').slice(0, 300) : ''));
    await browser.close();
  }

  // ---------- 5. no connection: the cloud parts fail quietly
  {
    const { browser, page, errors } = await open(F, { w: 390, h: 844 });// without a cloud stand-in every request to the cloud is refused
    const r = await page.evaluate(async () => { const A = window.__coasterDebug.v80.v10.acct; let s; try { s = A.state() } catch (e) { s = { err: e.message } } return { signedIn: !!(s && (s.user || s.signedIn)), err: s && s.err } });
    await page.waitForTimeout(1500);
    ok(!r.err && !r.signedIn, 'offline, nobody is signed in and the account part answers');
    const e = quiet(errors); ok(e.length === 0, 'offline: no errors' + (e.length ? ': ' + e.join(' | ').slice(0, 300) : ''));
    await browser.close();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e.stack || e).toString().slice(0, 400)); process.exit(1) });
