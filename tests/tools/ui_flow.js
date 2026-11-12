// Developer tool: drive My Park through its real buttons and gestures at one screen size, with screenshots.
const path = require('path'), fs = require('fs');
const { open } = require('../harness');
(async () => {
  const w = +process.argv[2] || 390, h = +process.argv[3] || 844, tag = w + 'x' + h, SH = path.join(__dirname, '..', 'shots');
  const { browser, page, errors } = await open(path.join(__dirname, '..', '..', 'coaster_lab_v10_0.html'), { w, h, mobile: w < 1000, skipStart: false });
  const T = (f, a) => page.evaluate(f, a), log = (m, x) => console.log(m, typeof x === 'string' ? x : JSON.stringify(x)), shot = n => page.screenshot({ path: path.join(SH, 'ui_' + tag + '_' + n + '.png') });
  await page.waitForTimeout(800); await shot('0title');
  await page.click('[data-go="ty10"]'); await page.waitForTimeout(1500); log('open', await T(() => window.__coasterDebug.v80.v10.ty.state()).then(s => s && [s.name, s.mode, s.money]));
  await shot('1open');
  const tapAt = async (x, y) => { if (w < 1000) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y) };
  await page.click('#tyBar [data-v="flat"]'); await page.waitForTimeout(400); await shot('2tray');
  await page.click('#tyTray [data-v="carousel"]'); await page.waitForTimeout(500);
  for (const [fx, fy] of [[.25, .42], [.2, .5], [.75, .42], [.3, .35], [.7, .5]]) { await tapAt(w * fx, h * fy); await page.waitForTimeout(250); const ok = await T(() => { const b = document.querySelector('#tyPlace [data-ty="build"]'); return window.__coasterDebug.v80.v10.ty.objs().length > 0 || (!!b && !b.disabled) }); if (ok) break }
  await shot('3ghost'); log('ghost', await T(() => document.querySelector('#tyPlace').innerText.replace(/\n/g, ' | ')));
  if (!(await T(() => window.__coasterDebug.v80.v10.ty.objs().length))) { const bb = await page.$('#tyPlace [data-ty="build"]:not([disabled])'); if (bb) await bb.click() } await page.waitForTimeout(500);
  log('after build', await T(() => window.__coasterDebug.v80.v10.ty.objs())); await shot('4built');
  // path: drag from the entrance path towards the ride
  await page.click('#tyBar [data-v="path"]'); await page.waitForTimeout(300);
  const objs = await T(() => window.__coasterDebug.v80.v10.ty.objs());
  await page.mouse.move(w / 2, h * .62); await page.mouse.down(); for (let k = 1; k <= 12; k++) await page.mouse.move(w / 2, h * .62 - k * 18); await page.mouse.up(); await page.waitForTimeout(300);
  log('paths', await T(() => { window.__coasterDebug.v80.v10.ty.save(); const p = window.__coasterDebug.v80.v10.ty.saved(); return p ? Object.keys(p.paths).length : -1 }));
  await shot('5path');
  await page.click('#tyBar [data-v="path"]'); await page.waitForTimeout(200);
  // the office: every tab
  await page.click('#tyMenuB'); await page.waitForTimeout(500); await shot('6office');
  const tabs = await T(() => [...document.querySelectorAll('#pkTabs [data-pktab]')].map(b => b.dataset.pktab));
  for (const t of tabs) { await page.click('#pkTabs [data-pktab="' + t + '"]'); await page.waitForTimeout(250); const ov = await T(() => document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll('#pkB *')].some(e => e.getBoundingClientRect().right > innerWidth + 2)); if (ov) log('overflow in tab', t); if (['money', 'share', 'world'].includes(t)) await shot('7office_' + t) }
  await page.click('#pk72 [data-x="close"]'); await page.waitForTimeout(300);
  // select the ride and open its card
  const id = (await T(() => window.__coasterDebug.v80.v10.ty.objs()))[0]; if (id) { log('card', await T(i => window.__coasterDebug.v80.v10.ty.sel(i), id.id)); await page.waitForTimeout(300); await shot('8card') }
  log('overflow page', await T(() => document.documentElement.scrollWidth - innerWidth));
  log('errors', errors.slice(0, 8));
  await browser.close();
})();
