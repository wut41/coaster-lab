// Shared Playwright harness for Coaster Lab: serves three.js from the npm package instead of the CDN,
// stubs Google Fonts, turns on the game's test hooks and collects every console error / page error.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SP = __dirname;
const THREE_JS = fs.readFileSync(path.join(SP, 'node_modules/three/build/three.module.js'));

// cloud: optional (url, postBody) => {status, json} that plays the part of the park cloud (Supabase RPC) for the page;
// without it every request to the cloud is refused, like on a device with no connection. init: extra script run before the game.
async function open(file, { w = 390, h = 844, mobile = true, skipStart = true, storage = {}, cloud = null, init = null, hash = '' } = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const errors = [], warns = [];
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.includes('cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS, headers: { 'access-control-allow-origin': '*' } });
    if (u.includes('fonts.googleapis.com')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (u.includes('fonts.gstatic.com')) return route.fulfill({ status: 204, body: '' });
    if (cloud && (u.includes('.supabase.co/rest/v1/rpc/') || u.includes('.supabase.co/auth/v1/'))) { const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, rq = route.request(); if (rq.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors, body: '' }); let body = null; try { body = JSON.parse(rq.postData() || 'null') } catch (e) {}
      // the stand-in is told who is calling (the session token, if any) and, for account calls, the method and query
      const isAuth = u.includes('/auth/v1/'), tail = isAuth ? u.split('/auth/v1/')[1] : u.split('/rpc/')[1], info = { token: ((rq.headers().authorization || '').match(/^Bearer (.+)$/) || [])[1] || null, method: rq.method(), query: Object.fromEntries(new URLSearchParams(tail.split('?')[1] || '')), apikey: rq.headers().apikey || null };
      const r = cloud((isAuth ? 'auth/' : '') + tail.split('?')[0], body, info) || { status: 404, json: { code: 'PGRST202', message: 'not found' } }; return route.fulfill({ status: r.status || 200, contentType: 'application/json', body: JSON.stringify(r.json === undefined ? null : r.json), headers: cors }) }
    if (u.startsWith('https://coaster.test/')) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.resolve(file)) });
    return route.abort();
  });
  await ctx.addInitScript(([st]) => {
    window.__coasterTestHarness = true;
    try { for (const k in st) localStorage.setItem(k, st[k]); } catch (e) {}
  }, [Object.assign({ 'coasterlab.v10.trailerSeen': '1', 'coasterlab.v10.streak': '{"auto":false}' }, skipStart ? { 'coasterlab.skipStart': '1' } : {}, storage)]);
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  // The game catches a failing background task and only warns ("Coaster Lab: "background task 6" failed (1×); …"), so the rest keeps
  // running; other modules catch their own errors and warn with a version tag ("8.0 inspector TypeError …"). For the tests both
  // are still failures: they are counted with the console errors.
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') { warns.push(m.text()); if (/^Coaster Lab: "[^"]*" failed/.test(m.text()) || /^\d+\.\d [a-zA-Z].*(Error|JSHandle@error)/.test(m.text())) errors.push('CAUGHT ' + m.text()) } });
  page.on('pageerror', e => errors.push('PAGEERROR ' + (e.stack || e.message)));
  await page.goto('https://coaster.test/' + path.basename(file) + hash);
  await page.waitForFunction(() => window.__booted === true, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  return { browser, ctx, page, errors, warns };
}
module.exports = { open };
