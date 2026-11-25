# Coaster Lab 8.6 — security audit

**Scope:** `coaster_lab_v8_6.html`, with extra depth on the 8.6 block (Gravity Lab, Disaster Mode, Evolve, Daily
Challenge and its share text, `coasterlab.v86.*` saves) and on every path where a coaster design or save data comes
in from outside (paste box, `.coaster.json` file, owner configuration paste, owner backup import).

**Audited copy:** the developer was editing the game while this ran, so everything was audited on a frozen copy,
`reports/security/coaster_lab_v8_6.audit-copy.html` (sha256 `ff028b29…7628865`). **All line numbers below refer to that
copy.** (The copy is a byte-for-byte copy of the game, so it holds the same lock data as the game itself.
It is git-ignored by `reports/.gitignore` (`*.html`) and was never committed; delete it once this audit is closed.) The live file has since gained one block (8.6 Lab physics save, live lines 7171–7189, reviewed: numbers only,
`isN7` + clamped to slider ranges, `textContent` only — fine). Lines after 7170 are therefore 19 higher in the live file;
everything before 7170 is unchanged.

**Method:** grep for every sink and source, ranged reads of each, an automated scan of every `${…}` interpolation on or
next to an HTML sink that is not wrapped in `esc()` or a number formatter (then a manual read of each hit), and five
local proofs of concept in headless Chromium through `tests/harness.js` (no network; three.js from the npm package).

**Threat model (how severities are calibrated):** Coaster Lab is a single HTML file with no server, no accounts and no
network calls of its own. Everything it stores is the player's own progress in their own browser. So:
*critical/high* = code runs in someone else's game without them doing anything unusual; *medium* = it needs a likely
action (opening a shared file/text) and does real damage; *low* = needs a shared file/text and the damage is a frozen
tab, wrong data or a spreadsheet warning; *info* = hardening, or only reachable by someone who already controls the
browser (DevTools, editing localStorage), which is not an attack on anyone else.

**Bottom line:** no XSS or code-execution path was found. All 97 HTML sinks were traced; saved and imported text is
cleaned on the way in (`cleanName`, `sid82`, `scrub82`, per-field validators) and escaped on the way out (`esc`). The 8.6
block is clean. The real findings are robustness issues in design import (one can freeze the tab), CSV formula
injection, and hardening items (no CSP, import-map integrity not enforced on older Safari).

---

## Findings

| # | Title | Severity |
|---|---|---|
| 1 | Classic (v1) designs skip the point checks in `sanDesign` → a shared file can freeze the tab | **Low** (upper end) |
| 2 | Section type `constructor` / `__proto__` / `toString` crashes import with no message | Low |
| 3 | Spreadsheet formula injection in the three CSV exports (coaster name from a shared design) | Low |
| 4 | No Content-Security-Policy | Low |
| 5 | Third-party code: import-map integrity is correct but not enforced everywhere; Google Fonts | Low |
| 6 | Owner / moderator locks: client-side by design; owner-only settings live in ordinary save keys | Info |
| 7 | Escaping defence-in-depth gaps (values that are only safe because they were cleaned when stored) | Info |
| 8 | Object-key lookups from saved/pasted data accept `Object.prototype` names | Info |

---

### 1. Classic (v1) designs skip the point checks in `sanDesign` — a shared file can freeze the tab

* **Severity: Low (upper end).** Needs a player to open a shared `.coaster.json` or paste a code; the result is a
  frozen tab or a ~1 GB memory spike, with no persistence (a reload recovers) and no code execution.
* **Location:** `sanDesign` `coaster_lab_v8_6.html:1908` returns the result of `migrateV1` (`:1903–1904`) as is.
  The v2 path filters free-form points to finite numbers with `|x| < 300` (`:1911`), but the v1 path never reaches
  that filter: `migrateV1` spreads `p[0]`, `p[1]` into `V(...)` without checks and copies every other point (minus the
  station) straight into a `free` section through `mkEl` (`:1731`). Reachable from all three import paths: 6.1 builder
  paste `:2179`, builder 📁 Files paste `:4844`, 📂 Open a coaster file `:6998–6999`. The `inspect(c.D).g.bad` gate
  after `sanDesign` does not catch it.
* **Exploit scenario:** someone shares "my coaster" as a file or text code in the classic format
  `{"name":"…","pts":[[0,0,0],[20,0,0],[1e6,40,1e6],…]}`. The player opens it; the builder tries to build a track
  millions of metres long and the page stops responding (iPhone Safari would show "a problem repeatedly occurred").
  Non-number points (`"a"`, `null`) also get in as `null` coordinates.
* **Proof (verified, `reports/security/poc1_design_import.js`, `poc1b_v1_magnitude.js`; outputs in
  `poc1_output.txt`, `poc1b_output.txt`):**

  | classic point distance | result after opening the file |
  |---|---|
  | 1 000 m / 10 000 m | accepted (`maxAbs` 1020 / 10020; v2 limit is 300) |
  | 100 000 m | accepted, 37 s, JS heap **1078 MB** |
  | 1 000 000 m | **main thread blocked > 120 s** (518 s before the harness gave up) |
  | 1e15 m | accepted; `RangeError: Invalid typed array length` from `InstancedMesh` in the builder overlays |
  | `"a"`, `null` points | accepted; design holds `null` coordinates |

  After a reload the bad design is gone (the draft no longer passes `sanDesign`), so it is not persistent.
* **Fix:** run the migrated design back through the normal v2 checks, and check the raw points in `migrateV1`.

  ```diff
  -function sanDesign(o){if(!o||typeof o!=='object')return{ok:0,why:'it is not a coaster design'};if(Array.isArray(o.pts)&&!o.els){const m=migrateV1(o);return m?{ok:1,D:m,note:'Converted from an older Coaster Lab design.'}:{ok:0,why:'the older design has too few points'}}
  +function sanDesign(o){if(!o||typeof o!=='object')return{ok:0,why:'it is not a coaster design'};if(Array.isArray(o.pts)&&!o.els){const m=migrateV1({name:o.name,pts:o.pts.filter(a=>Array.isArray(a)&&a.length===3&&a.every(x=>typeof x==='number'&&isFinite(x)&&Math.abs(x)<300))});if(!m)return{ok:0,why:'the older design has too few points'};const r=sanDesign(m);if(r.ok)r.note='Converted from an older Coaster Lab design.';return r}
  ```
  (The recursive call goes through the 8.5 wrappers too, which is what you want; `m` has `els`, so it cannot loop.)
  The same fix covers the 🎢 Owner "⧉ Copy" of classic park rides (`:2580`), which also uses `migrateV1`.

### 2. Section type `constructor` / `__proto__` / `toString` crashes import with no message

* **Severity: Low.** A shared design makes the Import / Open button silently do nothing and logs an uncaught error;
  nothing else breaks and nothing is stored.
* **Location:** `coaster_lab_v8_6.html:1910` checks `!ET[e.t]`. `ET` is a plain object, so `ET['constructor']`,
  `ET['toString']` and `ET['__proto__']` are truthy; `mkEl` (`:1731`) then calls `ET[t].ps.forEach` on `undefined`.
* **Exploit scenario:** `{"v":2,"els":[{"t":"constructor","p":{}}]}` pasted or opened. The player taps Import and sees
  no message; a pre-boot copy of the same bug would trip the start-up watchdog.
* **Proof (verified, `poc1_design_import.js` cases `protoType`, `protoType2`, both paste and file):**
  `PAGEERROR TypeError: Cannot read properties of undefined (reading 'forEach') at mkEl (…:1731)`; the design is
  unchanged and no toast is shown.
* **Fix:**
  ```diff
  -for(let i=0;i<o.els.length;i++){const e=o.els[i];if(!e||!ET[e.t])return{ok:0,why:'section '+(i+1)+' has an unknown type'};
  +for(let i=0;i<o.els.length;i++){const e=o.els[i];if(!e||typeof e.t!=='string'||!Object.hasOwn(ET,e.t))return{ok:0,why:'section '+(i+1)+' has an unknown type'};
  ```
  (`Object.hasOwn` is in Safari 15.4+, below the game's iOS 16.4 floor.)

### 3. Spreadsheet formula injection in the CSV exports

* **Severity: Low.** Needs a shared design with a crafted name, then a CSV export opened in Excel / Sheets / Numbers.
  Modern Excel blocks DDE by default and warns, and `cleanName` strips `"`, which rules out the usual
  `HYPERLINK("…")` exfil formulas, so the realistic impact is a spreadsheet that runs a formula or shows a warning.
* **Location:** coaster names are written as `'"'+name.replace(/"/g,'""')+'"'` with no formula guard in
  `histCSV72` `coaster_lab_v8_6.html:3906` (ride history), `cmpCSV72` `:3926` (comparison) and the Owner ride-statistics
  export `:4250`. `cleanName` (`:1707`) keeps `= + - @ | ' !`.
* **Exploit scenario:** a shared `.coaster.json` named `=1+1+cmd|' /C calc'!A0`. The player rides it, then exports ride
  history or ride statistics and opens the CSV in a spreadsheet: the cell starts with `=` and is treated as a formula.
* **Proof (verified, `reports/security/poc3_csv_formula.js`, output `poc3_output.txt`):** the imported name survives
  `sanDesign` unchanged, and the Owner ride-statistics CSV row is `"=1+1+cmd|' /C calc'!A0",39.0,20.80,…`. History and
  comparison CSVs use the same quoting (read, not run).
* **Fix:** one helper used by all three exports.
  ```diff
  +const csvQ72=s=>{s=String(s);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return'"'+s.replace(/"/g,'""')+'"'};
  -…'"'+h.r.replace(/"/g,'""')+'"'…            (histCSV72, :3906)
  +…csvQ72(h.r)…
  -…'"'+rideName(r.i).replace(/"/g,'""')+'"'…  (cmpCSV72, :3926)
  +…csvQ72(rideName(r.i))…
  -['"'+(i===CI?curName:ride(i).name).replace(/"/g,'""')+'"',…   (statsCsv, :4250)
  +[csvQ72(i===CI?curName:ride(i).name),…
  ```
  While there: `h.env`, `h.wx`, `h.tod`, `h.seat`, `h.ops` are written unquoted in `:3906`; they come only from the
  player's own storage (`cleanHist72` `:3876` keeps any short string), so quoting them with `csvQ72` too is cheap.

### 4. No Content-Security-Policy

* **Severity: Low.** No injection was found, so a CSP is defence in depth: it would stop a future escaping mistake from
  loading outside scripts or sending saves anywhere.
* **Location:** `<head>` `coaster_lab_v8_6.html:3–9` has no CSP `<meta>`. (A header is impossible for a file opened
  locally, so a meta tag is the right tool.)
* **Proof that a CSP fits (verified, `reports/security/poc4_csp_check.js`, output `poc4_output.txt`):** with the policy
  below inserted, the game boots, the 🪐 / 💥 / 📅 / 🏆 / 📊 pages, Owner panel and builder open, with
  **0 CSP violations and 0 console errors**.
* **Fix:**
  ```diff
   <meta charset="utf-8">
  +<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; media-src data: blob:; connect-src data: blob:; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  ```
  `'unsafe-inline'` is needed because the game is three inline scripts (`:1142`, `:1143`, `:1179`) and uses inline
  `style=""` everywhere. The value is in what it blocks: any script, image, font or request from any other host, so an
  injected payload could not load more code or send saves out. A stricter version swaps `'unsafe-inline'` in
  `script-src` for the three scripts' `sha256-…` hashes, but those must be recomputed on every edit.
  *Not tested:* a real iPhone (headless Chromium only), the photo Share sheet, and audio.

### 5. Third-party code: import-map integrity correct, but not enforced everywhere; Google Fonts

* **Severity: Low.** jsDelivr npm files with an exact version are immutable, so this only matters if the CDN itself is
  compromised. If that happens, the attacker has full script access to the game's origin, which holds only game progress.
* **Location:** import map `coaster_lab_v8_6.html:1142`; fonts `:8–9`.
* **Checked and fine:** the URL is pinned to `three@0.160.0`, and the `integrity` value matches the real file. I hashed
  `tests/node_modules/three/build/three.module.js` (0.160.0, 1 272 972 bytes) and the SHA-384 equals the import map
  entry exactly. No other script or module is loaded from anywhere. No `eval`, `new Function`, string
  `setTimeout`/`setInterval`, `document.write`, `outerHTML`, `srcdoc` or `DOMParser` anywhere in the file.
* **Gap:** the `integrity` key in import maps is newer than import maps. Browsers that support import maps but not
  their integrity key (for example Safari versions in the game's iOS 16.4+ range, older Chromium) ignore it **silently**
  and load the CDN file unchecked. *Not verified on a device*; check the exact Safari version your players use.
  Google Fonts CSS cannot carry SRI because it changes per browser. It can only restyle text, and the policy above
  limits it to fonts. Loading it also sends each player's IP address to Google, a privacy point for a kids' game in
  the EU/UK.
* **Fix (pick one):** the most robust is to ship `three.module.js` next to the HTML file (same origin) and point the
  import map at it. Or keep the CDN and add a preload that older Safari also checks:
  ```diff
   <script type="importmap">{…}</script>
  +<link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js" integrity="(the same sha384 value as the import map)" crossorigin="anonymous">
  ```
  *Not verified* that this closes the gap on every Safari version. For fonts, self-host the two WOFF2 files, or accept
  the trade-off.

### 6. Owner / moderator locks: client-side by design; owner-only settings live in ordinary save keys

* **Severity: Info.** The code comments already say these locks protect only this browser's copy. That is correct, and
  no owner action reaches any other player. This entry records what holds and what does not.
* **How it works (by location only; no secrets reproduced):**
  * Owner check: `ownerCheck72` `coaster_lab_v8_6.html:4186–4191`, a two-stage PBKDF2-SHA-256 (600 000 + 1 400 000
    rounds) against the stored fingerprint at `:4180`. Moderator check: `modCheck83` `:6047–6049`, one stage,
    600 000 rounds, fingerprint at `:6033`. Neither passcode is in the file in plain text, and the legacy
    `ownerTry` at `:2516` is dead code that just calls the new check. Comparison is constant-time (`ctEq72` `:4185`),
    which does no harm here.
  * Being signed in is held only in memory (`ownerOK72` `:4181`, `modOK83` `:6041`); it is never saved, so a backup
    or a localStorage edit cannot sign anyone in. Good.
  * The gates at `:4203` and `:6073` also open for `window.__coasterTestHarness === true`, and the debug object at
    `:7486` exposes `openOwner()` under the same flag. The strict `=== true` means DOM clobbering (an element with
    that id) cannot trip it, so only code already running on the page can. Good.
* **What does not hold (inherent to client-only):**
  * Salts, round counts and fingerprints ship in the page, so anyone can guess **offline** at full GPU speed. The
    5-tries lockout (`:4193–4200`, `:6044–6045` + `:6055–6060`) is kept in localStorage and only slows the on-page prompt.
    `normPw72` (`:4182`) lower-cases and removes spaces, `-`, `_` and `.`, which shrinks the guess space. 2 000 000 /
    600 000 rounds are a good cost; the passcodes' strength is what really matters. Keep them long and random,
    especially the moderator one (a third of the owner's rounds).
  * The owner-only choices "moderator panel on/off" and "which tools moderators may use", and the moderator
    **activity log** the owner reviews, are stored in `coasterlab.v83.mod` (`modCfg83` `:6038–6040`). They can be
    changed or erased by anyone with DevTools on that device, so the log is not evidence. The Owner backup import
    (`:4254–4255`) accepts any `coasterlab.*` key, including `coasterlab.v83.mod`, `coasterlab.v72.ownLock` and the
    progress and secret-unlock keys. *Verified:* `poc2` run 2 imported a crafted backup and `v83.mod` was written.
    So "send me your save file and import it" can switch the moderator panel on, re-enable every tool, clear the log
    or unlock rewards. This is cheating-level only, and it needs the owner to choose to import.
  * Secret rides' designs and names are in the page source, and unlocking is a saved value, so a determined player can
    read or unlock them. That comes with a single-file game.
* **Fix (optional, small):** in `impAll` (`:4254`), leave the owner and moderator control keys out of backups unless
  the owner ticks a box:
  ```diff
  -const ks=Object.keys(o.data).filter(k=>/^coasterlab\.[a-z0-9._-]+$/i.test(k)&&typeof o.data[k]==='string'&&o.data[k].length<4e6);
  +const ks=Object.keys(o.data).filter(k=>/^coasterlab\.[a-z0-9._-]+$/i.test(k)&&!/^coasterlab\.(v83\.(mod|modLock)|v72\.ownLock)$/.test(k)&&typeof o.data[k]==='string'&&o.data[k].length<4e6);
  ```
  For release builds, consider stripping the test-harness branches (`:4203`, `:6073`, `:7486`), so the shipped game
  has no "skip the lock" switch at all, even one only local code can flip.

### 7. Escaping defence-in-depth gaps

* **Severity: Info.** Each spot below is safe today only because the value was cleaned when it was stored. None is
  reachable from a shared design, owner config or backup: `poc2` verified 0 hits. The point is that one future loader
  that forgets to clean would become a real XSS.
* **Locations:**
  * `esc` `coaster_lab_v8_6.html:1461` escapes `& < > "` but not `'`. I found no single-quoted attribute with an
    interpolated value, so this is safe today.
  * Names interpolated without `esc`: ride cards `${d.name}` `:1428` and the hub fallback `${h.name}` `:2840`. Ride
    and park names always pass `cleanName` (`:1707`, which strips `<>&"`) first; `PKS72.name` in the hub subtitle is
    escaped by the caller.
  * `<div class="${a.k}">` in the alert log `:3732`. The loader `:3535` keeps `a.k` as any 10-character string (not
    stripped of `"`); only a hand-edited localStorage can put a quote there (the backup import strips quotes with
    `scrub82`). With 10 characters it cannot carry a useful payload (`"onclick=x` is the most it fits).
  * Photo gallery `src="${o.thumb}"` and `data-v="${o.id}"` `:3864` come from IndexedDB, which only the game writes
    and nothing imports.
* **Fix:**
  ```diff
  -const esc=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  +const esc=t=>String(t).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  ```
  Wrap `d.name` (`:1428`) and `h.name` (`:2840`) in `esc()`. In `:3535`, replace `k:String(a.k||'info').slice(0,10)`
  with `k:/^[a-z]{1,10}$/.test(a.k)?a.k:'info'`.

### 8. Object-key lookups from saved or pasted data accept `Object.prototype` names

* **Severity: Info.** The same pattern as finding 2, but only reachable from the player's own storage or the owner's own
  config paste. Worst case: that player's settings misbehave until they reset them.
* **Locations:** `heat=HEAT[o.heat]?o.heat:'off'` `coaster_lab_v8_6.html:1557`
  (`coasterlab.prefs.v1`); `if(o.q&&QUAL[o.q.gq])` in `ownApply` `:2562` (Owner → Export / import ride configuration).
  `"constructor"` passes both checks. In the owner config, `presets` keys are copied as is (`cleanOwn7` `:2503`), so a
  key named `__proto__` replaces the prototype of that one presets object only. It has no global effect: no deep
  merge into shared objects exists anywhere.
* **Fix:** `Object.hasOwn(HEAT,o.heat)`, `Object.hasOwn(QUAL,o.q.gq)`, and skip `k==='__proto__'` in `cleanOwn7`.

---

## Proof-of-concept results

All PoCs are in `reports/security/`, run only against the local copy through `tests/harness.js`, and are read-only on
the game. Outputs (`poc*_output.txt`) were checked: no passcode, fingerprint, salt or secret-ride data appears in any of
them.

| PoC | What it does | Result |
|---|---|---|
| `poc1_design_import.js` | XSS name, classic huge/junk points, prototype section types, each through the real paste box **and** the real file input | Name payload stripped by `cleanName` (no execution); findings 1 and 2 reproduced |
| `poc1b_v1_magnitude.js` | Classic points at 1e3…1e15 m and junk | 1e5 m: 1 GB heap, 37 s; 1e6 m: tab blocked > 120 s (finding 1) |
| `poc2_storage_xss_sweep.js` | Plants an `"><img onerror><svg onload>'&` payload in **every string field** of 13 save keys (designs, draft, park, staff, train looks, owner config + presets, moderator log, Daily history incl. share values, Gravity, blueprints, ride history, cameras), opens every 🎡 hub tile and tab, every Owner tab and every builder library tab (incl. 🧬 Evolve and 📅 Daily). Run 2 delivers the same payload as a crafted Owner backup. A deliberately unsafe sink is the positive control | see below |
| `poc3_csv_formula.js` | Opens a shared design named `=1+1+cmd|' /C calc'!A0`, exports Owner ride statistics CSV | see below |
| `poc4_csp_check.js` | Boots a temporary copy with the proposed CSP and opens the main screens | 0 violations, 0 console errors |

**`poc2` result (verified, `poc2_output.txt`):**
```
RUN 1 (seeded localStorage): {"hits":["CONTROL"],"live":1,"payloadShownAsText":160}   page errors: 0
RUN 2 import done; stored park item now contains "<"? false | v83.mod written: true
RUN 2 (owner backup import):  {"hits":["CONTROL"],"live":1,"payloadShownAsText":155}  page errors: 0
```
The only hit and the only live element in both runs are the positive control, so the detectors work. The payload text
reached the screen 160 / 155 times, always as harmless text (escaped, or with `<>"` removed). No saved or imported field
produced markup.

**`poc3` result (verified, `poc3_output.txt`; the exported file is `poc3_stats.csv`):**
```
design name after import + sanDesign/cleanName: "=1+1+cmd|' /C calc'!A0"
CSV row with the imported name:
  "=1+1+cmd|' /C calc'!A0",39.0,20.80,23.7,0,0,0,69,100,739
```
The first cell of the row starts with `=` (finding 3). I did not open the file in Excel or Numbers; how each spreadsheet
treats it there is not verified.

---

## Checked and fine

**8.6 block (`:7063` onward):**
* **Every 8.6 HTML sink** (`renderOv7` pages `:7092`, Gravity list `:7138–7140`, Gravity page `:7143–7152`, lap-card
  note `:7160`, Settings section `:7164`, Incident Report and Disaster page `:7286–7305`, Evolve progress / tab
  `:7359–7371`, library wrapper `:7379`, Daily card / history / page `:7449–7458`): every string is either built-in
  text, a number from a formatter (`fV`, `fL`, `fG2`, `toFixed`, `Math.round`) or wrapped in `esc()`. Ride names come
  from `rideName` → `esc`. The 8.6 code never puts a coaster name or anything saved into HTML unescaped.
* **`coasterlab.v86.*` saves are validated on load:** `disaster` strict `=== true` (`:7074`); `gravity` must be
  `obj72`, `k` must be a known planet or `custom`, `g` finite and clamped to 1–25 (`:7106`); `daily` (`:7429`) accepts
  only `YYYY-MM-DD` keys (so no `__proto__`), `best` clamped 0–1000, `tries` ≥ 1, `res` booleans, `vals` at most
  3 × 24-character strings, trimmed to 90 days on save (`:7430`). Evolve state is not saved; its seed input is
  rounded, range-checked and written back (`:7382`). Disaster reports live in memory only.
* **Daily share text (`shareText86` `:7443`, `share86` `:7444–7446`)** is plain text only, sent through
  `navigator.share({text})`, `navigator.clipboard.writeText` or a `textarea.value`. It never goes into HTML, never
  includes the coaster's name, and has no URL. The only saved strings in it are the three ≤ 24-character `vals`,
  which only the player's own storage can change. The challenge comes from the date only (`challenge86`), so it
  cannot be steered by data.
* Disaster Mode, Gravity Lab and Evolve only change physics numbers that are validated or clamped. Evolve's mutations
  stay inside `clampP` limits and every candidate goes through `sanDesign` + `inspect`. Its 25 s cap and per-frame
  yielding prevent a hang.

**Rest of the game:**
* **97 HTML sinks** (79 `innerHTML`, 18 `insertAdjacentHTML`; 0 `outerHTML`, 0 `document.write`) were traced. No URL
  input at all: no `location.hash`, `location.search`, `URLSearchParams`, `postMessage`, `window.name` or `referrer`.
  No clipboard *read* (paste only into textareas the player fills). No `<a>` links, so no `target=_blank` issue. No
  iframes, `<object>` or workers. The only `fetch` is of the game's own `data:` URLs (`:3792`, `:6261`). No network
  requests besides the CDN module and Google Fonts.
* **Toasts, dialogs and pop-ups** (`say` `:1357`, `ask` `:2121`, `ask7` `:2494`, `pop7` `:2738`) use `textContent`.
  `notify80` (`:4400–4403`) escapes title and text.
* **Import paths are well guarded:** paste is capped at 200 000 characters (`:2179`, `:4844`) and files at 600 kB
  (`:6998`), with `JSON.parse` in `try`. `sanDesign` (`:1908–1912`) whitelists section types (apart from finding 2),
  clamps every parameter through `clampP` (`:1735`, which also turns NaN/Infinity into the default), allows 1–60
  sections, filters v2 points, and cleans the name and style (`cleanName` `:1707`, `cleanStyle` `:2617`, hex
  colours only). Owner config import (`:2592` → `ownApply` `:2561`) validates every field, clamping physics to `PHR7`.
  Owner backup import (`:4254–4255`) only accepts `coasterlab.*` keys and runs `scrub82` (`:5777–5783`) over every
  string at every depth, including nested JSON. *Verified in `poc2` run 2:* the stored park data contained no `<`
  after import.
* Loaders for every other saved string clean it: staff (`:5094`), train looks (`:3339–3340`), park (`:3528`, `:3535`),
  owner rides/edits (`:2499–2503`), blueprints (`:4871`), builder clipboard (`:4718`), ride history (`:3876`),
  cameras (`:3755`), moderator log (`:6040`).
* **Prototype pollution:** all loaders build fresh objects from validated keys. There is no recursive merge into
  shared objects, and `Object.assign` targets only receive cleaned objects.
* **NaN / Infinity in physics:** stored and imported physics values go through `isN7` + clamps (`:2561`, `PHR7`), the
  8.6 gravity save is clamped, and design parameters go through `clampP`. The one exception is finding 1.

---

## Summary

* **No XSS, no code execution, no secret exposure found.** All 97 HTML sinks were traced, and a payload planted in
  every saved string field and in a crafted Owner backup never ran or turned into markup (positive control caught).
  The 8.6 block (Gravity, Disaster, Evolve, Daily Challenge, share text and `coasterlab.v86.*` saves) validates
  everything it loads and escapes everything it shows.
* **Fix first (each is a few characters):** #1 run classic designs back through `sanDesign` (stops a shared file from
  freezing the tab); #2 `Object.hasOwn(ET, …)`; #3 a `csvQ72` formula guard in the three CSV exports.
* **Hardening:** #4 the CSP meta tag (tested: 0 violations); #5 self-host three.js, or add a modulepreload with the same
  integrity, for browsers that ignore import-map integrity; #7 `esc` also escapes `'`, plus three `esc()` wraps;
  #8 `hasOwn` lookups.
* **Owner / moderator locks** are as strong as a client-only page can make them (slow PBKDF2, nothing secret saved as
  plain text, sign-in kept in memory). They cannot stop offline guessing or DevTools edits. Owner-only moderator
  settings and the moderator log are ordinary save keys that a backup import can overwrite (#6).
