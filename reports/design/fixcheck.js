// Usage: node reports/design/fixcheck.js hud|lib
// Injects the CSS fixes proposed in reports/design-review.md into the live page and measures before/after.
const path = require('path'), fs = require('fs');
const { open } = require('../../tests/harness');
const ROOT = path.join(__dirname, '../../'), DIR = __dirname + '/';
const which = process.argv[2];
const HUD_FIX = `@media(max-width:650px){.brandT{display:flex;flex-wrap:wrap;align-items:center;column-gap:6px;row-gap:2px}.brandT>b{flex:0 0 100%}#rideName{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#modChip,#dzChip{margin-left:0;flex:none}}`;
const LIB_FIX = `@media(max-height:500px){#b8Lib .lbC8{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(64px,auto);overflow-x:auto;overscroll-behavior-x:contain}}.evoR86>.evoSt86{display:flex}`;
(async () => {
  if (which === 'hud') {
    const { browser, page } = await open(ROOT + 'coaster_lab_v8_6.html', { w: 390, h: 844, storage: { 'coasterlab.tut.v2': '1' } });
    const X = f => page.evaluate(f);
    await X(() => { window.__coasterDebug.v80.v86.setGrav('moon'); window.__coasterDebug.v80.v86.setDz(true) }); await page.waitForTimeout(600);
    const m = () => X(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const b = r('.brand'), st = r('.stats'), c = r('.camera'); return { brandH: Math.round(b.height), statsBottom: Math.round(st.bottom), cameraTop: Math.round(c.top), overlap: Math.max(0, Math.round(st.bottom - c.top)) } });
    const before = await m();
    await page.addStyleTag({ content: HUD_FIX }); await page.waitForTimeout(300);
    const after = await m(); await page.screenshot({ path: DIR + 'fix_hud_moon_dz_390x844.png' });
    // longest ride name too
    await X(() => window.__coasterDebug.select(5)); await page.waitForTimeout(800); const after5 = await m();
    console.log(JSON.stringify({ before, after, afterGlacier: after5 })); fs.writeFileSync(DIR + 'fixcheck_hud.json', JSON.stringify({ css: HUD_FIX, before, after, afterGlacier: after5 }, null, 1));
    await browser.close();
  } else {
    const { browser, page } = await open(ROOT + 'coaster_lab_v8_6.html', { w: 844, h: 390, storage: { 'coasterlab.tut.v2': '1' } });
    const X = f => page.evaluate(f);
    await X(() => window.__coasterDebug.v80.v86.openBuilder()); await page.waitForTimeout(1000);
    await X(() => { document.querySelectorAll('#b8Tour,#dlg7').forEach(e => e.hidden = true) });
    await X(() => window.__coasterDebug.v80.bld.act('add')); await page.waitForTimeout(400);
    await page.click('[data-b8lib="evo"]'); await page.waitForTimeout(400);
    const m = () => X(() => { const b = document.querySelector('#b8Lib .lbB8'), c = document.querySelector('#b8Lib .lbC8'); return { contentVisibleH: b.clientHeight, tabsH: c.offsetHeight } });
    const before = await m();
    await page.addStyleTag({ content: LIB_FIX }); await page.waitForTimeout(300);
    const after = await m(); await page.screenshot({ path: DIR + 'fix_lib_evo_844x390.png' });
    console.log(JSON.stringify({ before, after })); fs.writeFileSync(DIR + 'fixcheck_lib.json', JSON.stringify({ css: LIB_FIX, before, after }, null, 1));
    await browser.close();
  }
})();
