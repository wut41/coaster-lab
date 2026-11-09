// Shared Playwright harness for Coaster Lab: serves three.js from the npm package instead of the CDN,
// stubs Google Fonts, turns on the game's test hooks and collects every console error / page error.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SP = __dirname;
const THREE_JS = fs.readFileSync(path.join(SP, 'node_modules/three/build/three.module.js'));

async function open(file, { w = 390, h = 844, mobile = true, skipStart = true, storage = {} } = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const errors = [], warns = [];
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.includes('cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS, headers: { 'access-control-allow-origin': '*' } });
    if (u.includes('fonts.googleapis.com')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (u.includes('fonts.gstatic.com')) return route.fulfill({ status: 204, body: '' });
    if (u.startsWith('https://coaster.test/')) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.resolve(file)) });
    return route.abort();
  });
  await ctx.addInitScript(([st]) => {
    window.__coasterTestHarness = true;
    try { for (const k in st) localStorage.setItem(k, st[k]); } catch (e) {}
  }, [Object.assign(skipStart ? { 'coasterlab.skipStart': '1' } : {}, storage)]);
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warns.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + (e.stack || e.message)));
  await page.goto('https://coaster.test/' + path.basename(file));
  await page.waitForFunction(() => window.__booted === true, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  return { browser, ctx, page, errors, warns };
}
module.exports = { open };
