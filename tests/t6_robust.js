// Robustness: the game must boot with 0 console errors and sane fallbacks when its saved data is damaged.
// Every boot seeds localStorage (harness `storage` option) with garbage for the 8.6 keys (coasterlab.v86.gravity,
// .disaster, .daily; .labPhys is new and not covered here yet) and, at the end, a few older keys. A control boot with valid data proves the seeding works.
const { open } = require('./harness');
const ROOT = require('path').join(__dirname, '..') + '/';
require('fs').mkdirSync(__dirname + '/shots', { recursive: true });
const F = ROOT + 'coaster_lab_v8_6.html', SH = __dirname + '/shots/';
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const K = 'coasterlab.v86.', BAD = /NaN|undefined|Infinity|\[object /;
// dates in the same local time zone the browser uses
const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const day = n => { const d = new Date(); return dk(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)) };
const TODAY = day(0);
const P = (best = 700) => ({ best, pass: true, tries: 1, res: [true, true, true], vals: ['a', 'b', 'c'] });
const J = JSON.stringify, LONG = 'x'.repeat(300000);

// what the game holds after boot
const state = page => page.evaluate(() => {
  const V = window.__coasterDebug.v80.v86, g = V.grav(), st = V.dailyState(), l = window.__coasterDebug.lab();
  return { k: g.k, g: g.PH.g, fric: g.PH.fric, drag: g.PH.drag, real: g.real, chip: g.chip, badge: g.badge, dz: V.dz().on, days: st.days, streak: V.streak(),
    lab: l && { T: l.T, gMax: l.st.gMax, gMin: l.st.gMin, flo: l.st.flo } };
});
// the 8.6 pages a player opens, checked for broken numbers
// (the Gravity Lab page re-checks every ride, which is slow on a software GPU, so only one boot opens it)
async function pages(page, name, grav) {
  const X = f => page.evaluate(f);
  if (grav) {
  await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="grav86"]'); await page.waitForTimeout(500);
  const gt = await X(() => !document.querySelector('#ov7').hidden && document.querySelector('#ov7B').textContent);
  ok(gt && gt.length > 50 && !BAD.test(gt), `${name}: Gravity Lab page opens with no NaN/undefined/Infinity` + (gt && BAD.test(gt) ? ': ' + gt.match(new RegExp('.{0,60}(' + BAD.source + ').{0,60}'))[0] : ''));
  await X(() => document.querySelector('#ov7X').click()); await page.waitForTimeout(200);
  }
  await page.click('#parkBtn'); await page.waitForTimeout(300); await page.click('[data-hub="daily86"]'); await page.waitForTimeout(500);
  const dt = await X(() => !document.querySelector('#ov7').hidden && document.querySelector('#ov7B').textContent);
  ok(dt && /Daily Challenge #\d+/.test(dt) && !BAD.test(dt), `${name}: Daily Challenge page opens with no NaN/undefined/Infinity` + (dt && BAD.test(dt) ? ': ' + dt.match(new RegExp('.{0,60}(' + BAD.source + ').{0,60}'))[0] : ''));
  return dt;
}
// common checks: gravity is finite and in range, Disaster Mode as expected, history holds only well-formed days
function sane(name, s, exp) {
  ok(s.k === exp.k && Math.abs(s.g - exp.g) < 1e-9, `${name}: gravity falls back to ${exp.k} ${exp.g} (got ${s.k} ${s.g})`);
  ok(Number.isFinite(s.g) && s.g >= 1 && s.g <= 25 && Number.isFinite(s.fric) && s.fric >= 0 && Number.isFinite(s.drag) && s.drag >= 0 && typeof s.real === 'boolean',
    `${name}: physics finite and in range (g ${s.g}, friction ${s.fric}, drag ${s.drag}, realistic ${s.real})`);
  ok(!BAD.test(s.chip + '|' + s.badge), `${name}: brand chip / HUD badge readable: "${s.chip}" "${s.badge}"`);
  ok(s.lab && [s.lab.T, s.lab.gMax, s.lab.gMin, s.lab.flo].every(Number.isFinite), `${name}: ride stats finite (T ${s.lab && s.lab.T.toFixed(1)} s, gMax ${s.lab && s.lab.gMax.toFixed(2)})`);
  ok(s.dz === exp.dz, `${name}: Disaster Mode ${exp.dz ? 'on' : 'off'} (got ${s.dz})`);
  const ks = Object.keys(s.days), good = ks.every(k => /^\d{4}-\d\d-\d\d$/.test(k)) && Object.values(s.days).every(d => Number.isFinite(d.best) && d.best >= 0 && d.best <= 1000 &&
    Number.isInteger(d.tries) && d.tries >= 1 && typeof d.pass === 'boolean' && Array.isArray(d.res) && d.res.length <= 3 && d.res.every(x => typeof x === 'boolean') &&
    Array.isArray(d.vals) && d.vals.every(v => typeof v === 'string' && v.length <= 24));
  ok(good && ks.length === exp.n, `${name}: Daily history keeps ${exp.n} well-formed day(s) (got ${ks.length}: ${ks.slice(0, 4).join(', ')}${ks.length > 4 ? '…' : ''})`);
  ok(Number.isInteger(s.streak) && s.streak === exp.streak, `${name}: streak ${exp.streak} (got ${s.streak})`);
}
async function boot(name, storage, exp, extra, vp = [390, 844]) {
  const t0 = Date.now();
  const { browser, page, errors } = await open(F, { w: vp[0], h: vp[1], storage });
  try {
    if (exp) sane(name, await state(page), exp);
    if (extra) await extra(page);
  } catch (e) { ok(false, `${name}: check crashed: ${(e.message || e).toString().slice(0, 300)}`) }
  ok(errors.length === 0, `${name}: console errors: ${errors.length} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); errors.slice(0, 5).forEach(e => console.log('   ', e.slice(0, 300)));
  await browser.close();
}

(async () => {
  // control: valid saves are read (so every fallback below is a real fallback, not a seeding problem)
  await boot('control', { [K + 'gravity']: J({ k: 'mars', g: 3.71, real: true }), [K + 'disaster']: 'true', [K + 'daily']: J({ days: { [day(-1)]: P(), [day(-2)]: P(650) } }) },
    { k: 'mars', g: 3.71, dz: true, n: 2, streak: 2 });

  // 1. invalid JSON in every key
  await boot('invalid JSON', { [K + 'gravity']: '{"k":"moon",', [K + 'disaster']: '{tru', [K + 'daily']: '{"days":{"' + TODAY + '":{"best":7' },
    { k: 'earth', g: 9.81, dz: false, n: 0, streak: 0 }, page => pages(page, 'invalid JSON', true));

  // 2. wrong types
  await boot('wrong types', { [K + 'gravity']: J({ k: 7, g: '9.81', real: 'no' }), [K + 'disaster']: '"true"', [K + 'daily']: J({ days: [P(), P()] }) },
    { k: 'earth', g: 9.81, dz: false, n: 0, streak: 0 });

  // 3. NaN / Infinity / huge numbers (1e999 parses to Infinity); bad day entries are dropped, odd numbers clamped
  const daily3 = '{"days":{' + [
    `"${day(-1)}":{"best":1e308,"pass":true,"tries":-1e308,"res":[1,0,"x",true],"vals":["${'v'.repeat(5000)}",7,null]}`, // kept: best→1000, tries→1, 3 res, vals cut
    `"${day(-2)}":{"best":1e999,"pass":true,"res":[true,true,true]}`,   // Infinity best → dropped
    `"${day(-3)}":{"best":"NaN","pass":true,"res":[true,true,true]}`,   // string best → dropped
    `"${day(-4)}":{"best":500,"pass":true,"res":"yes"}`,                 // res not a list → dropped
    `"${day(-5)}":{"best":-1e308,"pass":"no","tries":1e999,"res":[]}`,  // kept: best→0, tries→1
  ].join(',') + '}}';
  await boot('NaN/Infinity/huge', { [K + 'gravity']: '{"k":"custom","g":1e999}', [K + 'disaster']: '1e999', [K + 'daily']: daily3 },
    { k: 'earth', g: 9.81, dz: false, n: 2, streak: 1 }, async page => {
      const d = await page.evaluate(k => window.__coasterDebug.v80.v86.dailyState().days[k], day(-1));
      ok(d && d.best === 1000 && d.tries === 1 && d.res.length === 3 && d.vals.every(v => v.length <= 24), 'huge numbers clamped: ' + J(d).slice(0, 120));
      await pages(page, 'NaN/Infinity/huge');
    });
  await boot('huge custom gravity', { [K + 'gravity']: J({ k: 'custom', g: 1e308 }), [K + 'disaster']: '{}', [K + 'daily']: '[]' },
    { k: 'custom', g: 25, dz: false, n: 0, streak: 0 });
  await boot('negative gravity', { [K + 'gravity']: J({ k: 'custom', g: -1e308, real: false }), [K + 'disaster']: 'null', [K + 'daily']: 'null' },
    { k: 'custom', g: 1, dz: false, n: 0, streak: 0 });
  await boot('odd keys', { [K + 'gravity']: J({ k: '__proto__', g: 'NaN' }), [K + 'disaster']: '"TRUE"', [K + 'daily']: '{"days":{"__proto__":{"best":900,"pass":true,"res":[true,true,true]},"yesterday":' + J(P()) + ',"2026-1-1":' + J(P()) + ',"":' + J(P()) + '}}' },
    { k: 'earth', g: 9.81, dz: false, n: 0, streak: 0 });

  // 4. empty strings
  await boot('empty strings', { [K + 'gravity']: '', [K + 'disaster']: '', [K + 'daily']: '' }, { k: 'earth', g: 9.81, dz: false, n: 0, streak: 0 });

  // 5. very long strings (300k characters each: well inside the storage quota)
  await boot('very long strings', { [K + 'gravity']: J({ k: LONG, g: 5 }), [K + 'disaster']: J(LONG), [K + 'daily']: J({ days: { [LONG]: P(), [day(-1)]: { ...P(), vals: [LONG, LONG, LONG] } } }) },
    { k: 'earth', g: 9.81, dz: false, n: 1, streak: 1 }, page => pages(page, 'very long strings'));

  // 6. Daily Challenge dates from the future and the far past must not invent a streak
  const fut = {}; for (let i = 1; i <= 95; i++) fut[day(i)] = P();
  await boot('future dates', { [K + 'daily']: J({ days: { ...fut, '9999-12-31': P(), '0001-01-01': P(), '1970-01-01': P() } }) },
    { k: 'earth', g: 9.81, dz: false, n: 98, streak: 0 }, async page => {
      const X = (f, a) => page.evaluate(f, a);
      const dt = await pages(page, 'future dates');
      console.log('   Daily page with future dates:', (dt || '').replace(/\s+/g, ' ').slice(0, 200));
      // a real Submit today must be kept, even though 95+ future-dated entries are in the history (it keeps 90 days)
      await page.click('[data-dc86="build"]'); await page.waitForTimeout(900);
      await X(() => { document.querySelectorAll('#b8Tour').forEach(e => e.hidden = true) });
      await page.click('[data-dc86="submit"]'); await page.waitForTimeout(500);
      const st = await X(() => window.__coasterDebug.v80.v86.dailyState()), raw = await X(() => localStorage.getItem('coasterlab.v86.daily'));
      let saved = null; try { saved = JSON.parse(raw) } catch (e) { }
      ok(saved && saved.days && Object.keys(saved.days).length <= 90, 'saved history is valid JSON, at most 90 days (' + (saved && Object.keys(saved.days).length) + ')');
      ok(!!(st.days[TODAY] && st.days[TODAY].tries === 1), "today's Submit survives the 90-day trim when future-dated days are stored (today in memory: " + !!st.days[TODAY] + ')');
      ok(!!(saved && saved.days[TODAY]), "today's Submit is in the saved history (saved: " + !!(saved && saved.days[TODAY]) + ', oldest kept: ' + (saved && Object.keys(saved.days).sort()[0]) + ')');
    });
  await boot('past + future around a real streak', { [K + 'daily']: J({ days: { [day(-1)]: P(), [day(-2)]: P(), [day(-4)]: P(), [day(1)]: P(), [day(2)]: P(), '1999-01-01': P() } }) },
    { k: 'earth', g: 9.81, dz: false, n: 6, streak: 2 }, null, [844, 390]);

  // 7. older save keys (7.x): pixel ratio, quality preset, preferences, volume, designs list
  await boot('old keys: pixel ratio text', { 'coasterlab.v7.pr': '"abc"', 'coasterlab.prefs.v1': J({ heat: 'constructor', seat: 9, tod: 5, imp: 'x' }), 'coasterlab.v7.vol': '{"master":1e999,"ride":"x"}', 'coasterlab.designs.v2': '[{"name":' },
    null, async page => {
      const X = f => page.evaluate(f);
      const q = await X(() => ({ ...window.__coasterDebug.v7.q(), cv: (c => [c.width, c.height])(document.querySelector('canvas')) }));
      ok(Number.isFinite(q.pr) && q.pr > 0 && q.cv[0] > 0 && q.cv[1] > 0, `pixel ratio "abc": renderer pixel ratio ${q.pr}, 3D canvas ${q.cv.join('x')}`);
      await page.screenshot({ path: SH + 'robust_pr_text.png' });
      await X(() => window.__coasterDebug.select(1)); await page.waitForTimeout(600);
      await page.click('#labBtn'); await page.waitForTimeout(600); await page.click('#labClose'); await page.waitForTimeout(200);
      const kept = await X(() => localStorage.getItem('coasterlab.designs.v2.unreadable'));
      ok(kept === '[{"name":', 'unreadable designs list kept aside unchanged (coasterlab.designs.v2.unreadable)');
    });
  await boot('old keys: negative pixel ratio, odd quality', { 'coasterlab.v7.pr': '-5', 'coasterlab.v7.quality': '"constructor"' },
    null, async page => {
      const q = await page.evaluate(() => ({ ...window.__coasterDebug.v7.q(), cv: (c => [c.width, c.height])(document.querySelector('canvas')) }));
      ok(Number.isFinite(q.pr) && q.pr > 0 && q.cv[0] > 300 && q.cv[1] > 300, `pixel ratio -5: renderer pixel ratio ${q.pr}, 3D canvas ${q.cv.join('x')} (window 390x844)`);
      ok(['low', 'medium', 'high', 'ultra'].includes(q.gq), `quality "constructor" falls back to a real preset (got ${q.gq})`);
    });
})();
