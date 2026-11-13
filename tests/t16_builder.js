// Coaster Lab 10.1 — the roomier Track Builder: panels that slide in only when needed, the five-tab piece picker with
// Recent pieces, extra drag handles with a hint, and live force colours (green, yellow, red) with a toolbar switch.
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
const cutOff = () => [...document.querySelectorAll('#b8Lib .lbC8 button span')].filter(s => s.scrollWidth > s.clientWidth + 1).map(s => s.textContent);
(async () => {
  let { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
  const X = (f, a) => page.evaluate(f, a), B = 'window.__coasterDebug.v80.v10.builder';
  const D = (expr, a) => page.evaluate(new Function('a', 'const T = ' + B + '; return ' + expr), a);
  const click = sel => X(s => { const b = document.querySelector(s); if (b) b.click(); return !!b }, sel);
  ok(await X(() => window.__coasterDebug.v80.v86.openBuilder()), 'the Track Builder opens'); await page.waitForTimeout(1200);
  let p = await D('T.panels()'); ok(!p.lib && !p.ins, 'on a computer both side panels start closed, so the track gets the whole screen');
  await page.screenshot({ path: SH + 'b10_view.png' });
  // the picker
  await D('T.clearRecent()'); ok(await click('#b8Dock [data-b8="add"]'), '＋ Add is in the toolbar'); await page.waitForTimeout(500);
  p = await D('T.panels()'); let k = await D('T.pick()');
  ok(p.lib && k.tab === 'track', '＋ Add slides the piece library in, on the Track tab');
  ok(k.tabs.join() === 'recent,track,thrill,ideas', 'a beginner sees four tabs instead of a wall of categories: ' + k.tabs.join(', '));
  ok(/Basic/.test(k.heads.join()) && /Turns/.test(k.heads.join()) && /Hills/.test(k.heads.join()) && k.items > 12, 'Track lists basic pieces, turns and hills together (' + k.items + ' pieces)');
  ok((await X(cutOff)).length === 0, 'no tab label is cut off');
  await page.screenshot({ path: SH + 'b10_picker.png' });
  await click('#b8Lib [data-pick10="thrill"]'); await page.waitForTimeout(300); k = await D('T.pick()'); ok(k.tab === 'thrill' && /Inversions/.test(k.heads.join()), 'Thrills shows the inversions');
  const n0 = (await D('T.els()')).length; await click('#b8Lib .lbB8 [data-b8it="1"]'); await page.waitForTimeout(800);
  const els = await D('T.els()'); ok(els.length > n0 && els.includes('corkscrew'), 'tapping Corkscrew adds it to the track (' + n0 + ' → ' + els.length + ' pieces)');
  await click('#b8Lib [data-pick10="recent"]'); await page.waitForTimeout(300); k = await D('T.pick()'); ok(k.tab === 'recent' && k.items === 1, 'Recent now has the corkscrew in it');
  await click('#b8Lib .lbB8 [data-b8it]'); await page.waitForTimeout(600); ok((await D('T.els()')).length === els.length + 1 && (await D('T.pick()')).tab === 'recent', 'tapping it there adds another one and stays on Recent');
  await click('#b8Lib [data-pick10="ideas"]'); await page.waitForTimeout(400); k = await D('T.pick()');
  ok(k.tab === 'ideas' && await X(() => document.querySelectorAll('#b8Lib .lbSub10 [data-b8lib]').length >= 3), 'Ideas has blueprints, Quick build and the rest as chips');
  await click('#b8Lib .lbSub10 [data-b8lib="quick"]'); await page.waitForTimeout(400); k = await D('T.pick()');
  ok(k.tab === 'ideas' && k.lib === 'quick' && await X(() => /Quick build|whole coaster/i.test(document.querySelector('#b8Lib .lbB8').innerText)), 'the ⚡ Quick build chip shows Quick build, label in full');
  await click('#b8Lib [data-b8="libClose"]'); await page.waitForTimeout(400); ok(!(await D('T.panels()')).lib, 'the library slides away again');
  // selection: the piece panel follows it
  const hill = (await D('T.els()')).findIndex(t => t === 'hill' || t === 'airtime');
  await D('T.sel(a)', hill); await page.waitForTimeout(600); p = await D('T.panels()');
  ok(p.ins && p.auto, 'selecting a piece slides the piece panel in');
  const hs = await D('T.handles()'); ok(hs.some(h => h.key === 'h') && hs.some(h => h.key === 'len'), 'a hill can be shaped by dragging its height and its length (' + hs.map(h => h.lab).join(', ') + ')');
  ok(await X(() => /glowing dots/.test(document.getElementById('b8Hint').textContent)), 'a hint says to drag the glowing dots');
  await page.screenshot({ path: SH + 'b10_select.png' });
  await D('T.desel()'); await page.waitForTimeout(500); p = await D('T.panels()'); ok(!p.ins, 'deselecting slides it away again');
  // force colours
  let f = await D('T.forces()'); ok(f && f.mode === 'force' && f.green > 0, 'force colours are on: ' + JSON.stringify(f));
  ok(await X(() => !document.getElementById('frc10').hidden && /Comfy/.test(document.getElementById('frc10').textContent)), 'a legend explains green, yellow and red');
  ok(['#3ddc84', '#ffc233', '#ff4d4d'].includes(await D('T.colorAt(5)')), 'the track ribbon uses the force colours');
  const r0 = f.red; await D('T.setP(a, "h", 40)', hill); await D('T.setP(a, "len", 14)', hill); await page.waitForTimeout(300); f = await D('T.forces()');
  ok(f.red > r0, 'a much taller, shorter hill throws riders out of their seats: the track there turns red (' + r0 + ' → ' + f.red + ')');
  await page.screenshot({ path: SH + 'b10_forces.png' });
  await click('#b8Dock [data-b8="force10"]'); await page.waitForTimeout(300); f = await D('T.forces()');
  ok(f.mode === 'sec' && !['#3ddc84', '#ffc233', '#ff4d4d'].includes(await D('T.colorAt(5)')) && await X(() => document.getElementById('frc10').hidden), '🚦 Forces turns it off');
  await click('#b8Dock [data-b8="force10"]'); ok((await D('T.forces()')).mode === 'force', 'and on again (and it is remembered)');
  ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : '')); await browser.close();
  // phone
  ({ browser, page, errors } = await open(F, { w: 390, h: 844, mobile: true }));
  ok(await X(() => window.__coasterDebug.v80.v86.openBuilder()), 'on a phone the builder opens'); await page.waitForTimeout(1200);
  await click('#b8Dock [data-b8="add"]'); await page.waitForTimeout(600); k = await D('T.pick()');
  ok(k.tabs.length === 4 && (await X(cutOff)).length === 0, 'the piece sheet shows the tabs with nothing cut off');
  await page.screenshot({ path: SH + 'b10_phone.png' });
  ok(errors.length === 0, 'no errors on the phone' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
