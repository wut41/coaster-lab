// Usage: node reports/design/hudcheck.js <w> <h>
// Measures whether the 8.6 brand badges (gravity chip, 💥 Disaster chip) push the HUD into the camera / side panels.
const path = require('path');
const { open } = require('../../tests/harness');
const ROOT = path.join(__dirname, '../../'), DIR = __dirname + '/';
const W = +process.argv[2] || 390, H = +process.argv[3] || 844, tag = `${W}x${H}`;
(async () => {
  const { browser, page } = await open(ROOT + 'coaster_lab_v8_6.html', { w: W, h: H, storage: { 'coasterlab.tut.v2': '1' } });
  const X = (f, a) => page.evaluate(f, a);
  const m = () => X(() => {
    const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), r: Math.round(b.right), h: Math.round(b.height) } };
    const o = { brand: r('.brand'), stats: r('.stats'), camera: r('.camera'), side: r('.side'), modChip: r('#modChip'), dzChip: r('#dzChip'), gp: r('#gp86'), rideName: r('#rideName') };
    const ov = (a, b) => a && b && a.t < b.b && b.t < a.b && a.l < b.r && b.l < a.r ? Math.min(a.b, b.b) - Math.max(a.t, b.t) : 0;
    o.overlapStatsCamera = ov(o.stats, o.camera); o.overlapStatsSide = ov(o.stats, o.side);
    const c = document.querySelector('#modChip'); o.chipTxt = c && !c.hidden ? c.textContent : ''; const g = document.querySelector('#gp86'); o.gpTxt = g ? g.textContent : '';
    return o;
  });
  const out = {};
  await page.waitForTimeout(500); out.earth = await m(); await page.screenshot({ path: DIR + `hudc_earth_${tag}.png` });
  await X(() => window.__coasterDebug.v80.v86.setGrav('moon')); await page.waitForTimeout(600); out.moon = await m(); await page.screenshot({ path: DIR + `hudc_moon_${tag}.png` });
  await X(() => window.__coasterDebug.v80.v86.setDz(true)); await page.waitForTimeout(600); out.moonDz = await m(); await page.screenshot({ path: DIR + `hudc_moon_dz_${tag}.png` });
  await X(() => window.__coasterDebug.v80.v86.setGrav('earth')); await page.waitForTimeout(600); out.dz = await m(); await page.screenshot({ path: DIR + `hudc_dz_${tag}.png` });
  // disabled "Back to Earth" button styling on the Gravity Lab page while on Earth
  await X(() => window.__coasterDebug.v80.v86.setDz(false));
  await page.click('#parkBtn'); await page.waitForTimeout(400); await page.click('[data-hub="grav86"]'); await page.waitForTimeout(600);
  out.backToEarth = await X(() => { const b = document.querySelector('#ov7B .btn.primary[data-v="earth"]'); const s = getComputedStyle(b); return { disabled: b.disabled, opacity: s.opacity, bg: s.backgroundImage.slice(0, 80), cursor: s.cursor } });
  out.closeBtn = await X(() => { const b = document.querySelector('#ov7X'); const s = getComputedStyle(b); const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, pad: s.padding, fs: s.fontSize } });
  require('fs').writeFileSync(DIR + `hudcheck_${tag}.json`, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
