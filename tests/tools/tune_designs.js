// Developer tool: tune rough coaster concepts into designs that pass the builder's full check, using the game's own
// tuner (src/v10/js/05_tune.js).
//   node tests/tools/tune_designs.js <concepts.js> [name-filter] [--out result.json]
// <concepts.js> exports { Name: { els:[[type,params],...], goal:{...}, lock:['3.a','*.v'], iters:900, seeds:[1,2,3] } }
const path = require('path'), fs = require('fs');
const { open } = require('../harness');
(async () => {
  const args = process.argv.slice(2), oi = args.indexOf('--out'), outFile = oi >= 0 ? args.splice(oi, 2)[1] : null;
  const concepts = require(path.resolve(args[0])), filter = args[1];
  const { browser, page, errors } = await open(path.join(__dirname, '..', '..', 'coaster_lab_v10_0.html'), { w: 800, h: 600, mobile: false });
  const out = outFile && fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  for (const [name, c] of Object.entries(concepts)) {
    if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;
    let best = null;
    for (const seed of c.seeds || [1, 2, 3]) {
      const r = await page.evaluate(([n, c, seed]) => window.__coasterDebug.v80.v10.tune(c.els, { name: n, goal: c.goal || {}, lock: c.lock || [], range: c.range || {}, iters: c.iters || 700, seed }), [name, c, seed]);
      if (!best || r.pen < best.pen) best = r;
      if (!r.crit && !r.warn && r.pen < 30) break;
    }
    const m = best.m;
    console.log(`${best.crit ? '✗' : best.warn ? '△' : '✓'} ${name}: pen ${best.pen} · ${m.len} m · ${m.h} m tall · ${m.T} s · vmax ${m.vmax} · G ${m.gMin}…${m.gMax} · lat ${m.lat} · air ${m.air} s · inv ${m.inv} · thrill ${m.thrill} · int ${m.intensity} · comfort ${m.comfort} · bb ${m.bb && m.bb.join(',')} (${best.tries} tries, ${best.ms} ms)`);
    if (m.issues && m.issues.length) console.log('    ' + m.issues.join(' | '));
    console.log('    ' + JSON.stringify(best.els));
    out[name] = { els: best.els, m };
  }
  if (outFile) fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await browser.close();
})();
