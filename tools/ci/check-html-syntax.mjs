#!/usr/bin/env node
// Syntax-checks every inline <script> in one or more single-file HTML builds.
// Classic scripts are compiled with vm.Script; module scripts are written to a temp .mjs and run through `node --check`.
// Nothing is executed. Exit code 1 if any script fails to parse.
//
//   node tools/ci/check-html-syntax.mjs coaster_lab_v10_1.html builds/*.html
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: check-html-syntax.mjs FILE.html [...]'); process.exit(2); }

const tmp = mkdtempSync(join(tmpdir(), 'cl-syntax-'));
let failures = 0;

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m, n = 0, checked = 0, bad = 0;
  while ((m = re.exec(html))) {
    n++;
    const attrs = m[1], code = m[2];
    if (/\bsrc\s*=/.test(attrs) || !code.trim()) continue;            // external or empty
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || 'text/javascript';
    if (/importmap|json|template|x-shader|text\/plain/i.test(type)) continue; // not JavaScript
    checked++;
    const line = html.slice(0, m.index).split('\n').length;
    if (/module/i.test(type)) {
      const p = join(tmp, `s${n}.mjs`);
      writeFileSync(p, code);
      const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
      if (r.status !== 0) { bad++; console.error(`✗ ${file}: module script #${n} (line ${line})\n${(r.stderr || '').split('\n').slice(0, 6).join('\n')}`); }
    } else {
      try { new vm.Script(code, { filename: `${file}#script${n}` }); }
      catch (e) { bad++; console.error(`✗ ${file}: script #${n} (line ${line}): ${e.message}`); }
    }
  }
  failures += bad;
  console.log(`${bad ? '✗' : '✓'} ${file}: ${checked} script block(s) checked${bad ? `, ${bad} failed` : ''}`);
}
rmSync(tmp, { recursive: true, force: true });
process.exit(failures ? 1 : 0);
