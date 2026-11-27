// Release check for the CURRENT build (10.10.1): the 10.10.1 suite, then the older suites whose checks still describe
// how 10.10.1 behaves, all pointed at builds/coaster_lab_v10_10_1.html. This is the regression job that guards
// pull requests into main. The full history (every suite against the 10.1 source build) is `npm test`.
//   node run_release.js                  CL_F=<build> CL_VERSION=<x.y.z> node run_release.js   (a later build)
const { execFileSync } = require('child_process');
const path = require('path');
const BUILD = process.env.CL_F || path.join(__dirname, '..', 'builds', 'coaster_lab_v10_10_1.html');
// Each entry was run against 10.10.1 on 2026-11-27 and passed in full; a suite (or section) joins only after it does.
// Not here yet, waiting for the game team (see docs/security/HARDENING-2026-11-27.md, "Behaviour differences"):
//   t20 section I (accounts: one check)  and  t21_saves (two-tab saving: one check).
const suites = [
  ['t26_v10_10_1', {}],                   // 10.10.1 itself: start-up on 3 screens, Content Security Policy, hosts, owner locks, ride memory, offline
  ['t20_security', { T20: 'ABCDEFGH' }],  // XSS from other players' parks and names, hostile park data, live channel, owner lock + test flag
  ['t22_diag', {}],                       // the diagnostics panel exists only behind the owner lock
];
let pass = 0, fail = 0; const rows = [];
for (const [s, env] of suites) {
  console.log('=== ' + s + '  (' + path.basename(BUILD) + ')');
  let out = '';
  try { out = execFileSync('node', [path.join(__dirname, s + '.js')], { encoding: 'utf8', timeout: 25 * 60 * 1000, env: { ...process.env, CL_F: BUILD, ...env } }) }
  catch (e) { out = (e.stdout || '') + '\nFAIL suite crashed: ' + (e.message || e).toString().slice(0, 300) }
  process.stdout.write(out);
  const p = (out.match(/^PASS/gm) || []).length, f = (out.match(/^FAIL/gm) || []).length; pass += p; fail += f;
  rows.push(s.padEnd(16) + String(p).padStart(4) + ' passed' + (f ? String(f).padStart(4) + ' FAILED' : ''));
}
console.log('\n' + rows.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
