// Coaster Lab 10.2 — building, round two: ✥ Move (keeps everything, costs nothing, cancel puts it back), ↶ Undo (builds,
// removals, a whole path drag, moves), entertainers in mascot suits, Swan Boats on a lake, the new stalls (pizza, cotton
// candy, balloons that visitors carry, an ATM) and the Weekly Park Awards on the day card.
const { open } = require('./harness'), L = require('./tools/park_lib');
const ROOT = require('path').join(__dirname, '..') + '/', F = process.env.CL_F || ROOT + 'coaster_lab_v10_0.html', SH = __dirname + '/shots/';
require('fs').mkdirSync(SH, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m) };
(async () => {
  const { browser, page, errors } = await open(F, { w: 1200, h: 800, mobile: false });
  const X = (f, a) => page.evaluate(f, a), S = () => X(() => window.__coasterDebug.v80.v10.ty.state());
  const D = (expr, a) => page.evaluate(new Function('a', 'const T = window.__coasterDebug.v80.v10.ty; return ' + expr), a);
  // ---- the new things are in the trays
  ok(await D('T.fresh("career", 60000)'), 'a Career park opens'); await D('T.speed(0)');
  await D('T.act("cat", "shop")'); await page.waitForTimeout(250); let tray = await X(() => document.querySelector('#tyTray').innerHTML);
  ok(/Pizza Slice/.test(tray) && /Cotton Candy/.test(tray) && /Balloon Stand/.test(tray) && /ATM/.test(tray) && /Cash for visitors who run low/.test(tray) && !/undefined/.test(tray), 'Shops & facilities lists Pizza Slice, Cotton Candy, Balloon Stand and the ATM');
  await D('T.act("cat", "flat")'); await page.waitForTimeout(250); tray = await X(() => document.querySelector('#tyTray').innerHTML);
  ok(/Swan Boats/.test(tray) && /Floats on a lake/.test(tray), 'Rides lists Swan Boats (floats on a lake)'); await D('T.act("cat", "")');
  ok(await X(() => !!document.querySelector('#tyBar [data-ty="undo"]') && document.querySelector('#tyBar [data-ty="undo"]').disabled), 'the build bar has an ↶ Undo button, greyed out while there is nothing to undo');
  // ---- undo a build: full refund
  let s0 = await S(); const bb = await X(L.place, ['burger', 26, 43, 3]); let s1 = await S();
  ok(bb.ok && s1.money === s0.money - 900, 'a Burger Bar is built for $900');
  ok(await X(() => !document.querySelector('#tyBar [data-ty="undo"]').disabled), 'Undo lights up');
  await D('T.undo()'); let s2 = await S(); ok(!(await D('T.obj(a)', bb.id)) && s2.money === s0.money, 'Undo takes the Burger Bar back and refunds all $900');
  // ---- move: keeps name, price, takings; free; Escape puts it back
  const shop = await X(L.place, ['drinks', 26, 43, 3]); ok(shop.ok, 'a Drinks Stand is built'); await X(L.connect, [shop.id]);
  await D('T.sel(a)', shop.id); await D('T.act("price", 1)');
  await D('T.sel(a)', shop.id); await page.waitForTimeout(200);
  ok(await X(() => /data-ty="move"/.test(document.getElementById('tyCard').innerHTML)), 'the selected stall’s card has a ✥ Move button');
  const before = await D('T.obj(a)', shop.id), p0 = await D('T.objs().find(o => o.id === a)', shop.id), m0 = (await S()).money;
  const mv = await D('T.move(a, 20, 44, 1)', shop.id); const after = await D('T.obj(a)', shop.id), pr = await D('T.saved ? 1 : 1'), p1 = await D('T.objs().find(o => o.id === a)', shop.id);
  ok(mv && mv.x != null && (p1.x !== p0.x || p1.z !== p0.z) && p1.r === 1, 'Move puts it in a new spot, turned (' + p0.x + ',' + p0.z + ' → ' + p1.x + ',' + p1.z + ')');
  ok(after && after.name === before.name && (await S()).money === m0, 'it keeps its name and price, and moving cost nothing');
  ok(await D('T.objs().length') === 1 && (await D('T.undoList()')).slice(-1)[0].t === 'move', 'there is still one stall, and the move is on the undo list');
  await D('T.undo()'); const p2 = await D('T.objs().find(o => o.id === a)', shop.id); ok(p2.x === p0.x && p2.z === p0.z && p2.r === p0.r, 'Undo moves it back');
  await D('T.sel(a)', shop.id); await X(() => dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }))); await page.waitForTimeout(150);
  let mvg = await D('T.moving()'); ok(mvg && mvg.id === shop.id && (await D('T.ui()')).tool === 'place', 'pressing G picks the selected stall up');
  ok(await X(() => !/^\d/.test(document.getElementById('tyPlace').innerText) && /Put it here/.test(document.getElementById('tyPlace').innerText)), 'the bar says ✥ Put it here');
  await X(() => dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))); await page.waitForTimeout(150); mvg = await D('T.moving()'); const p3 = await D('T.objs().find(o => o.id === a)', shop.id), o3 = await D('T.obj(a)', shop.id);
  ok(!mvg && p3.x === p0.x && p3.z === p0.z && o3.linked, 'Escape puts it back where it was, still connected');
  const bad = await D('T.move(a, 24, 45, 0)', shop.id); ok(typeof bad === 'string' && /path|built|way/i.test(bad), 'it cannot be moved onto a path: “' + bad + '”');
  ok(!(await D('T.moving()')), 'a failed move leaves nothing half-moved');
  // ---- undo a removal and a path drag
  const m4 = (await S()).money; await D('T.remove(a)', shop.id); const m5 = (await S()).money; ok(!(await D('T.obj(a)', shop.id)) && m5 > m4, 'the stall is sold');
  await D('T.undo()'); const back = await D('T.obj(a)', shop.id); ok(back && back.name === before.name && (await S()).money === m4, 'Undo puts it back as it was (and the sale money goes back)');
  const pBefore = (await S()).money; await D('T.path(10, 40, 18, 40, 0)'); const pAfter = (await S()).money;
  ok(pAfter === pBefore - 9 * 12, 'a path of 9 tiles is drawn ($108)');
  const ul = await D('T.undoList()'); ok(ul.slice(-1)[0].t === 'path' && ul.slice(-1)[0].tiles === 9, 'the whole drag is one undo step');
  await D('T.undo()'); ok((await S()).money === pBefore, 'Undo removes all 9 tiles and refunds them');
  // ---- Swan Boats: only on a lake
  ok(await D('T.fresh("sandbox")'), 'Sandbox opens'); await D('T.speed(0)');
  let sw = await D('T.build("swans", 14, 40, 0)'); ok(!sw.ok && /float/i.test(sw.why), 'Swan Boats cannot go on dry land: “' + sw.why + '”');
  await D('T.terra(30, 38, "lake", 3)'); ok(await D('T.lake(29, 37)') && await D('T.lake(31, 39)'), 'a 5 × 5 lake is dug');
  sw = await D('T.build("swans", 29, 37, 0)'); ok(sw.ok, 'Swan Boats float on the lake');
  ok(await D('T.lake(30, 38)'), 'building them did not fill the lake in'); let lk = await X(L.connect, [sw.id]); ok(lk > 0 && (await D('T.obj(a)', sw.id)).linked, 'a path (bridge) reaches their dock');
  // ---- new stalls, balloons, the ATM
  const car = await X(L.place, ['carousel', 21, 40, 3]); await X(L.connect, [car.id]);
  const bal = await X(L.place, ['balloons', 26, 44, 3]); await X(L.connect, [bal.id]); const atm = await X(L.place, ['atm', 22, 44, 3]); await X(L.connect, [atm.id]);
  const cc = await X(L.place, ['candy', 26, 41, 3]); await X(L.connect, [cc.id]);
  ok(bal.ok && atm.ok && cc.ok && (await D('T.obj(a)', bal.id)).linked && (await D('T.obj(a)', atm.id)).linked, 'a Balloon Stand, an ATM and Cotton Candy are built and connected');
  await D('T.set({ min: 600, fee: 0 })'); for (let k = 0; k < 5 && !(await S()).guests; k++) await D('T.spawn(3)');
  let went = await D('T.guestTo("gift")'); for (let k = 0; k < 20; k++) { await D('T.ff(3)'); if ((await D('T.balloons()')).carry) break }
  ok(went && (await D('T.balloons()')).carry >= 1, 'a visitor buys a balloon and carries it');
  const atm0 = (await D('T.obj(a)', atm.id)).n; went = await D('T.guestTo("cash", 3)'); for (let k = 0; k < 20; k++) { await D('T.ff(3)'); if ((await D('T.obj(a)', atm.id)).n > atm0) break }
  ok(went && (await D('T.obj(a)', atm.id)).n > atm0, 'a visitor who is low on cash uses the ATM');
  // ---- entertainers
  await D('T.act("hq", "staff")'); await page.waitForTimeout(400);
  ok(await X(() => /entertainer/.test(document.body.innerText)), 'the Office Staff tab has entertainers');
  await X(() => { const b = document.querySelector('[data-x="ent:1"]'); if (b) b.click() }); await page.waitForTimeout(300);
  ok((await D('T.ents()')).length === 1, 'hiring one puts a mascot in the park'); await X(() => { const b = document.querySelector('#pk72 [data-x="close"]'); if (b) b.click() }); await page.waitForTimeout(600);
  await D('T.staffSet("ent", 2)'); await D('T.spawn(80)'); let job = 0;
  for (let k = 0; k < 16 && !job; k++) { await D('T.ff(4)'); job = (await D('T.ents()')).filter(e => e.job).length }
  ok(job > 0, 'an entertainer heads for a busy queue');
  await D('T.speed(1)'); await D('T.cam((21 - 24) * 4, (40 - 24) * 4 + 6, 30, .62)'); await page.waitForTimeout(2200);
  const dr = await D('T.balloons()'); ok(dr.mascots >= 2, 'mascots are drawn (' + dr.mascots + ')');
  await page.screenshot({ path: SH + 'build2_mascots.png' });
  await D('T.cam((30 - 24) * 4, (38 - 24) * 4, 30, .7)'); await page.waitForTimeout(1500); await page.screenshot({ path: SH + 'build2_swans.png' }); await D('T.speed(0)');
  // ---- the Weekly Park Awards
  await D('T.set({ day: 7 })'); const e7 = await D('T.endDay()'); await page.waitForTimeout(200);
  const card = await X(() => document.getElementById('tyDay').innerText);
  ok(/Weekly Park Awards/.test(card), 'the 7th evening’s day card opens with the Weekly Park Awards');
  await page.screenshot({ path: SH + 'build2_awards.png' });
  const aw = await D('T.aw()'); ok(aw && aw.n === 1, 'the trophy cabinet counts the week');
  await D('T.act("dayx")'); await D('T.set({ day: 8 })'); await D('T.endDay()'); ok(!/Weekly Park Awards/.test(await X(() => document.getElementById('tyDay').innerText)), 'day 8 has no awards'); await D('T.act("dayx")');
  // ---- saving
  await D('T.save()'); await D('T.exit()'); await D('T.open("sandbox")');
  ok((await D('T.ents()')).length === 2 && (await D('T.aw()')).n === 1, 'entertainers and the trophy cabinet are saved');
  ok((await D('T.objs()')).some(o => o.k === 'swans'), 'the Swan Boats are still on the lake after reloading');
  ok((await D('T.undoList()')).length === 0, 'the undo list starts empty when the park is opened');
  ok(errors.length === 0, 'no errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
