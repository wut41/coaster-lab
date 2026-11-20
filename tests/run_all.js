// Runs every Coaster Lab test suite in order and prints a PASS / FAIL summary.
// t0–t5 test coaster_lab_v8_6.html (the 8.6 features); t6_vip tests coaster_lab_v8_7.html (the 👑 VIP pack).
const { execFileSync } = require('child_process');
const suites = ['t0_baseline', 't1_gravity', 't2a_same', 't2b_disaster', 't3_evolve', 't4_daily', 't5_regress', 't6_vip'];
let pass = 0, fail = 0;
for (const s of suites) {
  console.log('=== ' + s);
  let out = '';
  try { out = execFileSync('node', [__dirname + '/' + s + '.js'], { encoding: 'utf8', timeout: 25 * 60 * 1000 }) } catch (e) { out = (e.stdout || '') + '\nFAIL suite crashed: ' + (e.message || e).toString().slice(0, 300) }
  process.stdout.write(out);
  pass += (out.match(/^PASS/gm) || []).length; fail += (out.match(/^FAIL/gm) || []).length;
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
