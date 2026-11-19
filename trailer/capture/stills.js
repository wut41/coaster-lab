// Real game UI stills at 2x device pixels → ../public/ui/*.png (+ panel crops and a layout.json of bboxes)
// usage: node stills.js [name ...]   (default: all)
const fs = require('fs'), path = require('path');
const { boot } = require('./lib');
const OUT = path.join(__dirname, '../public/ui');
fs.mkdirSync(OUT, { recursive: true });
const LAYOUT = path.join(OUT, 'layout.json');
const layout = fs.existsSync(LAYOUT) ? JSON.parse(fs.readFileSync(LAYOUT, 'utf8')) : {};

async function wait(env, ms) { for (let t = 0; t < ms; t += 200) { await env.page.clock.runFor(200); await env.X(() => window.__tick()); } }
async function until(env, fn, maxMs = 240000) { for (let t = 0; t < maxMs; t += 200) { if (await env.page.evaluate(fn)) return; await wait(env, 200); } throw new Error('timeout waiting'); }

async function shoot(env, name, panelSel) {
  const { page } = env;
  await page.evaluate(() => document.fonts.ready);
  await wait(env, 600);
  await page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 180000 });
  if (panelSel) {
    const el = await page.$(panelSel);
    if (el) {
      const bb = await el.boundingBox();
      await el.screenshot({ path: path.join(OUT, name + '-panel.png'), omitBackground: true, timeout: 180000 });
      layout[name] = { panel: panelSel, ...bb };
    }
  }
  console.log('shot', name);
}

const STILLS = {
  start: { opts: { skipStart: false }, async run(env) { await wait(env, 4000); await shoot(env, 'start', '.stIn'); } },

  gravity: { async run(env) {
    const { page, X } = env;
    await X(() => { const d = window.__coasterDebug; d.v80.v86.setGrav('moon', null, true); d.select(0); });
    await wait(env, 1500);
    await page.click('#parkBtn'); await wait(env, 600);
    await page.click('[data-hub="grav86"]');
    await until(env, () => /All \d+ rides|run out/.test((document.querySelector('#gl86') || {}).textContent || ''));
    await shoot(env, 'gravity', '#ov7 .ov7In, #ov7 > div');
  } },

  report: { async run(env) {
    const { page, X } = env;
    await X(() => { const d = window.__coasterDebug; d.v80.v86.setDz(true); d.select(0); });
    await wait(env, 3500);
    await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 60 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1); });
    await until(env, () => !document.querySelector('#ov7').hidden && document.querySelector('#ov7').dataset.k === 'inc86');
    await wait(env, 1200);
    layout.reportData = await X(() => window.__coasterDebug.v80.v86.dz().rep);
    await shoot(env, 'report', '#ov7 .ov7In, #ov7 > div');
  } },

  evolve: { async run(env) {
    const { page, X } = env;
    await X(() => window.__coasterDebug.v80.v86.openBuilder());
    await wait(env, 1500);
    await X(() => { document.querySelectorAll('#b8Tour,#dlg7').forEach(e => e.hidden = true) });
    await X(() => window.__coasterDebug.v80.bld.act('add')); await wait(env, 500);
    await page.click('[data-b8lib="evo"]'); await wait(env, 500);
    await page.fill('[data-evo86="seed"]', '4242'); await page.dispatchEvent('[data-evo86="seed"]', 'change');
    await page.click('[data-evo86="gens"][data-v="6"]');
    await page.click('[data-evo86="go"]');
    await until(env, () => !window.__coasterDebug.v80.v86.evo().run);
    await wait(env, 800);
    layout.evolveData = await X(() => window.__coasterDebug.v80.v86.evo().res.map(r => ({ sc: r.sc, st: r.st })));
    const sel = await X(() => { const g = document.querySelector('[data-evo86="go"]'); let e = g; for (let i = 0; i < 8 && e && e.parentElement; i++) { e = e.parentElement; if (e.offsetHeight > 300) break; } if (e) e.id = e.id || '__evoPanel'; return e ? '#' + e.id : null; });
    await shoot(env, 'evolve', sel);
  } },

  daily: { async run(env) {
    const { page } = env;
    await page.click('#parkBtn'); await wait(env, 600);
    await page.click('[data-hub="daily86"]'); await wait(env, 1500);
    await shoot(env, 'daily', '#ov7 .ov7In, #ov7 > div');
  } },
};

(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(STILLS);
  for (const n of names) {
    const s = STILLS[n];
    const env = await boot({ fake: true, dpr: 2, ...(s.opts || {}) });
    await env.manual(); await wait(env, 400);
    try { await s.run(env); } catch (e) { console.log('FAIL', n, e.message.split('\n')[0]); await env.page.screenshot({ path: path.join(OUT, n + '-fail.png'), timeout: 180000 }).catch(() => {}); }
    if (env.errors.length) console.log(n, 'page errors:', env.errors.slice(0, 3));
    await env.browser.close();
    fs.writeFileSync(LAYOUT, JSON.stringify(layout, null, 2));
  }
})();
