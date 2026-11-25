// Usage (from repo root): node reports/design/capture.js <group> <w> <h>
// groups: old | grav | dz | evo | daily. Saves PNG + JSON metrics into reports/design/.
const path = require('path'), fs = require('fs');
const { open } = require('../../tests/harness');
const { audit } = require('./measure');
const ROOT = path.join(__dirname, '../../'), F = ROOT + 'coaster_lab_v8_6.html', DIR = __dirname + '/';
const [group, W, H] = [process.argv[2], +process.argv[3] || 390, +process.argv[4] || 844];
const tag = `${W}x${H}`;
const wait = ms => new Promise(r => setTimeout(r, ms));

async function scrollShots(page, name, scroller, root) {
  // audit each "screen" of a scrolling panel
  const n = await page.evaluate(s => { const e = document.querySelector(s); return e ? Math.ceil(e.scrollHeight / e.clientHeight) : 1 }, scroller);
  const out = [];
  for (let i = 0; i < Math.min(n, 5); i++) {
    await page.evaluate(([s, i]) => { const e = document.querySelector(s); e.scrollTop = i * (e.clientHeight - 40) }, [scroller, i]);
    await page.waitForTimeout(250);
    out.push(await audit(page, `${name}_${tag}_p${i + 1}`, root, DIR));
  }
  await page.evaluate(s => { const e = document.querySelector(s); if (e) e.scrollTop = 0 }, scroller);
  return out;
}

(async () => {
  const t0 = Date.now();
  const storage = { 'coasterlab.tut.v2': '1' };
  const { browser, ctx, page, errors } = await open(F, { w: W, h: H, skipStart: group !== 'old', storage });
  const X = (f, a) => page.evaluate(f, a);
  const sa = await X(() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;top:env(safe-area-inset-top);'; document.body.append(d); const v = getComputedStyle(d).top; d.remove(); return v });
  try {
    if (group === 'old') {
      await page.waitForTimeout(800);
      await audit(page, `start_${tag}`, '#start', DIR);
      await scrollShots(page, 'start', '#start', '#start');
      await page.click('[data-go="ride"]'); await page.waitForTimeout(1500);
      await audit(page, `hud_${tag}`, 'body', DIR);
      await page.click('#setBtn'); await page.waitForTimeout(500);
      await scrollShots(page, 'settings', '.ov7In', '#ov7');
      await X(() => document.querySelector('#ov7X').click()); await page.waitForTimeout(300);
      await page.click('#parkBtn'); await page.waitForTimeout(500);
      const sc = await X(() => { const c = [...document.querySelectorAll('#hub72 *')].find(e => e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY)); return c ? (c.id ? '#' + c.id : '.' + c.className.split(' ')[0]) : '#hub72' });
      console.log('hub scroller', sc);
      await scrollShots(page, 'hub', '#hub72 ' + (sc === '#hub72' ? '' : sc) || '#hub72', '#hub72');
      // the 3 new tiles vs. old tiles
      const tiles = await X(() => [...document.querySelectorAll('#hub72 [data-hub]')].map(b => ({ k: b.dataset.hub, txt: b.textContent.replace(/\s+/g, ' ').trim(), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), cls: b.className })));
      fs.writeFileSync(DIR + `hub_tiles_${tag}.json`, JSON.stringify(tiles, null, 1));
    }
    if (group === 'grav') {
      await page.click('#parkBtn'); await page.waitForTimeout(400); await page.click('[data-hub="grav86"]'); await page.waitForTimeout(600);
      await page.waitForFunction(() => /All \d+ rides|run/.test((document.querySelector('#gl86') || {}).textContent || '') && !/Checking/.test(document.querySelector('#gl86').textContent), null, { timeout: 120000 }).catch(() => console.log('earth check slow'));
      await scrollShots(page, 'grav_earth', '.ov7In', '#ov7');
      await page.click('[data-g86="p"][data-v="moon"]'); await page.waitForTimeout(500);
      await page.waitForFunction(() => /All \d+ rides|run/.test((document.querySelector('#gl86') || {}).textContent || '') && !/Checking/.test(document.querySelector('#gl86').textContent), null, { timeout: 120000 }).catch(() => console.log('moon check slow'));
      await scrollShots(page, 'grav_moon', '.ov7In', '#ov7');
      await page.click('[data-g86="real"]'); await page.waitForTimeout(400);
      await audit(page, `grav_checking_${tag}`, '#ov7', DIR);
      await page.waitForFunction(() => !/Checking/.test((document.querySelector('#gl86') || {}).textContent || ''), null, { timeout: 120000 }).catch(() => {});
      await X(() => { const e = document.querySelector('#gl86'); e && e.scrollIntoView({ block: 'start' }) }); await page.waitForTimeout(300);
      await audit(page, `grav_stall_${tag}`, '#ov7', DIR);
      await X(() => document.querySelector('#ov7X').click()); await page.waitForTimeout(400);
      await audit(page, `hud_moon_${tag}`, 'body', DIR);
      await page.click('#setBtn'); await page.waitForTimeout(500);
      await audit(page, `settings_moon_${tag}`, '#ov7', DIR);
    }
    if (group === 'dz') {
      await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="dz86"]'); await page.waitForTimeout(600);
      await scrollShots(page, 'dz_off', '.ov7In', '#ov7');
      await page.click('[data-dz86="on"]'); await page.waitForTimeout(500);
      await scrollShots(page, 'dz_on', '.ov7In', '#ov7');
      await X(() => document.querySelector('#ov7X').click()); await page.waitForTimeout(400);
      await audit(page, `hud_dz_${tag}`, 'body', DIR);
      await X(() => window.__coasterDebug.select(0)); await page.waitForTimeout(3200);
      await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 40 && d.v80.v86.dz().phase === ''; i++) d.v72.ff(1) });
      await page.waitForTimeout(900); await audit(page, `crash_${tag}`, 'body', DIR);
      await page.waitForFunction(() => !document.querySelector('#ov7').hidden && document.querySelector('#ov7').dataset.k === 'inc86', null, { timeout: 180000 });
      await page.waitForTimeout(600);
      await scrollShots(page, 'report_derail', '.ov7In', '#ov7');
      await page.click('[data-dz86="again"]'); await page.waitForTimeout(600);
      await X(() => { window.__coasterDebug.v80.v86.setGrav('moon', null, false); window.__coasterDebug.select(2) }); await page.waitForTimeout(3200);
      await X(() => { const d = window.__coasterDebug; for (let i = 0; i < 400 && d.v80.v86.dz().phase !== 'report'; i++) d.v72.ff(1) });
      await page.waitForFunction(() => document.querySelector('#ov7').dataset.k === 'inc86' && !document.querySelector('#ov7').hidden, null, { timeout: 120000 });
      await page.waitForTimeout(600);
      await scrollShots(page, 'report_roll', '.ov7In', '#ov7');
    }
    if (group === 'evo') {
      await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1000);
      await X(() => { document.querySelectorAll('#b8Tour,#dlg7').forEach(e => e.hidden = true) });
      await X(() => window.__coasterDebug.v80.bld.act('add')); await page.waitForTimeout(400);
      await audit(page, `builder_lib_${tag}`, '#b8', DIR);
      await page.click('[data-b8lib="evo"]'); await page.waitForTimeout(400);
      await audit(page, `evo_tab_${tag}`, '#b8', DIR);
      const libSc = await X(() => { const l = document.querySelector('#b8Lib'); const c = [l, ...l.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY)); return c ? (c.id ? '#' + c.id : '#b8Lib .' + String(c.className).split(' ')[0]) : null });
      console.log('lib scroller', libSc);
      if (libSc) await scrollShots(page, 'evo_tab', libSc, '#b8');
      await page.fill('[data-evo86="seed"]', '4242'); await page.dispatchEvent('[data-evo86="seed"]', 'change');
      await page.click('[data-evo86="gens"][data-v="6"]');
      await page.click('[data-evo86="go"]'); await page.waitForTimeout(900);
      await audit(page, `evo_running_${tag}`, '#b8', DIR);
      await page.waitForFunction(() => !window.__coasterDebug.v80.v86.evo().run, null, { timeout: 180000 });
      await page.waitForTimeout(400);
      await audit(page, `evo_results_${tag}`, '#b8', DIR);
      if (libSc) await scrollShots(page, 'evo_results', libSc, '#b8');
      await page.click('[data-evo86="pv"][data-v="0"]'); await page.waitForTimeout(700);
      await audit(page, `evo_preview_${tag}`, '#b8', DIR);
    }
    if (group === 'daily') {
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="daily86"]'); await page.waitForTimeout(500);
      await scrollShots(page, 'daily_page', '.ov7In', '#ov7');
      await page.click('[data-dc86="build"]'); await page.waitForTimeout(1200);
      await X(() => { document.querySelectorAll('#b8Tour,#dlg7').forEach(e => e.hidden = true) });
      await audit(page, `daily_tab_${tag}`, '#b8', DIR);
      await page.click('[data-dc86="submit"]'); await page.waitForTimeout(700);
      await audit(page, `daily_submitted_${tag}`, '#b8', DIR);
      const win = await X(() => window.__coasterDebug.v80.v86.findToday());
      if (win) {
        await X(els => window.__coasterDebug.v80.v86.setD(els), win.els); await page.waitForTimeout(300);
        await page.click('[data-dc86="submit"]'); await page.waitForTimeout(900);
        await audit(page, `daily_passed_${tag}`, '#b8', DIR);
        await X(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('blocked')) });
        await page.click('.dRes86 [data-dc86="share"]'); await page.waitForTimeout(500);
        await audit(page, `daily_sharebox_${tag}`, '#b8', DIR);
      } else console.log('no winning coaster found');
      // the page version after a submit
      await X(() => window.__coasterDebug.v80.bld.act('exit')); await page.waitForTimeout(800);
      await X(() => { document.querySelectorAll('#dlg7').forEach(e => e.hidden = true) });
      await page.click('#parkBtn').catch(() => {}); await page.waitForTimeout(300); await page.click('[data-hub="daily86"]').catch(() => {}); await page.waitForTimeout(500);
      await scrollShots(page, 'daily_page_after', '.ov7In', '#ov7');
    }
  } catch (e) { console.log('ERROR', e.message); await page.screenshot({ path: DIR + `error_${group}_${tag}.png` }) }
  console.log(`${group} ${tag} done in ${((Date.now() - t0) / 1000).toFixed(0)}s, safe-area-top=${sa}, console errors ${errors.length}`); errors.slice(0, 3).forEach(e => console.log('  ', e.slice(0, 200)));
  await browser.close();
})();
