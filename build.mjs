// Coaster Lab 10.0 build: takes coaster_lab_v9_0.html (never modified) and produces the single-file game
// coaster_lab_v10_0.html by (1) applying a short list of exact, asserted patches to the 9.0 code and
// (2) injecting the new styles, markup and modules from src/v10/.
//
//   node build.mjs            build
//   node build.mjs --check    build, then syntax-check the game script with node
//
// Why a build step: 10.0 adds ~10 new modules. Writing them as separate readable files keeps them reviewable,
// while the game still ships as ONE html file that opens straight from Files on an iPhone.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(ROOT, 'coaster_lab_v9_0.html');
const OUT = process.env.CL_OUT || path.join(ROOT, 'coaster_lab_v10_0.html');
const SRC = path.join(ROOT, 'src', 'v10');
const VERSION = '10.0';

let html = fs.readFileSync(BASE, 'utf8');
const count = (h, f) => h.split(f).length - 1;
// every patch must match exactly once, otherwise the build stops (the 9.0 file is the contract)
function patch(name, find, repl) {
  const n = count(html, find);
  if (n !== 1) throw new Error(`patch "${name}": expected exactly 1 match in 9.0, found ${n}`);
  html = html.replace(find, () => repl);
}
function patchAll(name, find, repl, expected) {
  const n = count(html, find);
  if (n !== expected) throw new Error(`patch "${name}": expected ${expected} matches in 9.0, found ${n}`);
  html = html.split(find).join(repl);
}
const files = (dir, ext) => {
  const d = path.join(SRC, dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith(ext)).sort().map(f => [f, fs.readFileSync(path.join(d, f), 'utf8')]);
};
const banner = (f, text) => `// ---- [${f}]\n${text.trim()}\n`;

// ---------- 1 · version
patch('brand badge', '<b>Coaster Lab<em>9.0.1</em></b>', `<b>Coaster Lab<em>${VERSION}</em></b>`);
patch('save-copy version', "var o={app:'Coaster Lab',v:'9.0.1',kind:'saves'", `var o={app:'Coaster Lab',v:'${VERSION}',kind:'saves'`);
patch('debug version', "__coasterDebug={version:'9.0.1',", `__coasterDebug={version:'${VERSION}',`);
// texts that count the rides: 12 classics + 4 signature rides + 10 new in 10.0 = 26, plus the 4 secret rides
patch('menu intro', 'Twelve coasters across ten worlds, or build your own. Psst… four secret rides are hidden somewhere 🤫', 'Twenty-six coasters, each in its own world, or build your own. Psst… four secret rides are hidden somewhere 🤫');
patch('title tagline', 'Ride twelve wild roller coasters, run your own theme park across six themed worlds, build your own rides, and grow a living park with new lands, guests, staff and events.', 'Ride 26 wild roller coasters, build and run your own park full of living visitors, design your own rides, and share your park with friends.');
patch('title rides button', '<small>12 coasters · 10 worlds</small>', '<small>26 coasters to ride</small>');
patch('hub subtitle', '<small>Coaster Lab 9.0 · Gravity Lab · Disaster Mode · Evolve · Daily Challenge</small>', '<small>Coaster Lab 10 · My Park tycoon · new coasters · park sharing</small>');

// ---------- 2 · small hooks in 9.0 code (each one is a single expression; behaviour is unchanged unless 10.0 uses it)
// wooden coasters draw their own timber structure, so the steel columns are skipped for rides flagged noSup10
patch('supports: optional', 'const sup=[];for(let i=0;i<N;i+=15)if(U[i].y>.6&&P[i].y>2)sup.push(i);', 'const sup=[];if(!def.noSup10)for(let i=0;i<N;i+=15)if(U[i].y>.6&&P[i].y>2)sup.push(i);');
patch('lattice: optional', 'function lattice(){if(!QUAL[gq].lat||!P||!U)return;', 'function lattice(){if(!QUAL[gq].lat||!P||!U||(ride(cur)||{}).noSup10)return;');
// rail gauge / tube size per ride (wooden coasters have flat running rails; default values are the 9.0 numbers)
patch('rails: per-ride gauge', 'tube(offs(.3,0),.09,railmat);tube(offs(-.3,0),.09,railmat);tube(offs(0,-.3),.13,dark);', 'tube(offs(.3,0),def.railR10||.09,railmat);tube(offs(-.3,0),def.railR10||.09,railmat);if(!def.noSpine10)tube(offs(0,-.3),.13,dark);');

// ---------- 3 · inject styles, markup, modules
const css = files('css', '.css').map(([f, t]) => `/* ---- [${f}] */\n${t.trim()}\n`).join('\n');
patch('styles', '</style>\n</head>', `/* ===== COASTER LAB 10.0 — MY PARK ===== */\n${css}</style>\n</head>`);

const markup = files('html', '.html').map(([f, t]) => t.trim()).join('\n');
patch('markup', '<div id="toast"></div>', `${markup}\n<div id="toast"></div>`);

// ---------- 3b · art made with Higgsfield (src/v10/art): inlined as data URLs so the game stays ONE file
const MIME = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const ARTDIR = path.join(SRC, 'art');
const ART = fs.existsSync(ARTDIR) ? Object.fromEntries(fs.readdirSync(ARTDIR).filter(f => MIME[path.extname(f)]).sort()
  .map(f => [path.basename(f, path.extname(f)), `data:${MIME[path.extname(f)]};base64,${fs.readFileSync(path.join(ARTDIR, f)).toString('base64')}`])) : {};
// sky + ground hooks for 31_art.js (each falls back to the 9.0 behaviour when the art module is missing)
patch('art: sky size', 'function setSky(a,b,c,fog,far,gc=\'255,244,214\'){const W=512,Hh=256,', 'function setSky(a,b,c,fog,far,gc=\'255,244,214\'){const W=window.CLART?CLART.skyW:512,Hh=W/2,');
patch('art: sky clouds', 'gl(70,.35);gl(14,.95);', 'gl(70*W/512,.35);gl(14*W/512,.95);if(window.CLART)CLART.sky(g,W,Hh,a,b,c,fc);');
patch('art: ground detail', 'function grainTex(){const c=', 'function grainTex(){if(window.CLART){const t=CLART.grain();if(t)return t}const c=');

const pre = files('js', '.js').map(([f, t]) => banner(f, t)).join('\n');
const post = files('post', '.js').map(([f, t]) => banner(f, t)).join('\n');
const HEAD = `// =====================================================================================================
// ---- COASTER LAB 10.0 — MY PARK: tycoon mode, living visitors, new coasters, dynamic world, sharing
// Everything 10.0 adds lives in this block (built from src/v10/ by build.mjs) and in a few marked hooks in
// older code (listed in build.mjs). Older systems are wrapped (call the original, then add), never rewritten.
// 10.0 data is stored under coasterlab.v10.* only.
// =====================================================================================================
const TY10={version:'${VERSION}'};
const ART10_DATA=${JSON.stringify(ART)};
{
`;
patch('modules (before boot)', "\nCI=RIDES.length;addEventListener('blur',", `\n${HEAD}${pre}\n}\n\nCI=RIDES.length;addEventListener('blur',`);
patch('modules (after boot)', '\nrequestAnimationFrame(animate);\n', `\n// ---- COASTER LAB 10.0 — after start-up\n{\n${post}\n}\nrequestAnimationFrame(animate);\n`);

fs.writeFileSync(OUT, html);
console.log(`built ${path.basename(OUT)}: ${(html.length / 1e6).toFixed(2)} MB (9.0 was ${(fs.statSync(BASE).size / 1e6).toFixed(2)} MB)`);

// ---------- 4 · optional syntax check of the game script (catches duplicate names and typos before a browser does)
if (process.argv.includes('--check')) {
  const a = html.indexOf('<script type="module">'), b = html.lastIndexOf('</script>');
  const tmp = path.join(ROOT, 'tests', '.game-check.mjs');
  fs.writeFileSync(tmp, html.slice(a + '<script type="module">'.length, b));
  try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); console.log('syntax check: ok') }
  catch (e) { console.error(String(e.stderr || e.message).split('\n').slice(0, 12).join('\n')); process.exitCode = 1 }
  finally { fs.rmSync(tmp, { force: true }) }
}
