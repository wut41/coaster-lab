// Runs every Coaster Lab test suite in order and prints a PASS / FAIL summary.
const { execFileSync } = require('child_process');
// (t4_corners is a helper used by t4_daily, not a suite. The SQL tests for the cloud run separately on a local
//  PostgreSQL: supabase/tests/run.sh)
const suites = ['t0_baseline', 't1_gravity', 't2a_same', 't2b_disaster', 't3_evolve', 't4_daily', 't5_regress', 't6_v90', 't7_v10_rides', 't8_v10_park', 't9_sound', 't10_v10_gfx', 't11_v10_account',
  't13_terra', 't14_fx', 't15_parksim', 't16_builder',// 10.1 park and builder suites (they existed but were not in this list)
  't20_security', 't21_saves', 't22_diag', 't23_builder6', 't24_parkpro'];// the 10.1 engineering upgrade
let pass = 0, fail = 0; const rows = [];
for (const s of suites) {
  console.log('=== ' + s);
  let out = '';
  try { out = execFileSync('node', [__dirname + '/' + s + '.js'], { encoding: 'utf8', timeout: 25 * 60 * 1000 }) } catch (e) { out = (e.stdout || '') + '\nFAIL suite crashed: ' + (e.message || e).toString().slice(0, 300) }
  process.stdout.write(out);
  const p = (out.match(/^PASS/gm) || []).length, f = (out.match(/^FAIL/gm) || []).length; pass += p; fail += f; rows.push(s.padEnd(18) + String(p).padStart(4) + ' passed' + (f ? String(f).padStart(4) + ' FAILED' : ''));
}
console.log('\n' + rows.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
