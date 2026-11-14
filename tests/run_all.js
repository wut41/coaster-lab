// Runs every Coaster Lab test suite in order and prints a PASS / FAIL summary.
const { execFileSync } = require('child_process');
const suites = ['t0_baseline', 't1_gravity', 't2a_same', 't2b_disaster', 't3_evolve', 't4_daily', 't5_regress', 't6_v90', 't7_v10_rides', 't8_v10_park', 't9_sound', 't10_v10_gfx', 't11_v10_account', 't17_trailer', 't19_streak_logic', 't19_streak_dom', 't19_streak'];
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
