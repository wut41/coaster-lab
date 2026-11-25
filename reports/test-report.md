# Coaster Lab 8.6: test report

Tester run on 2026-11-25, against `coaster_lab_v8_6.html` as it is in the working tree. That file already holds the
developer's 📊 Lab slider saving code (`coasterlab.v86.labPhys`). Playwright 1.63.0 drove the pre-installed Chromium
with a software GPU. Three other agents were running browsers on the same CPU the whole time (load average 8 to 31),
so every timing below is inflated and several timing checks are flaky. `t4_corners` was skipped as asked.

## Summary

* **No game errors appeared in any suite.** Every boot in every suite logged 0 console errors and 0 page errors.
* **Feature suites (t0 to t5):** no failures that point at a game bug. t2b and t3 fail only on frame rate and time
  checks. Both were rerun alone and the cause was confirmed (details below). None of these failures is caused by the
  new Lab slider saving code.
* **New suite `t6_robust`: 5 checks fail, and they show 3 real game bugs (1 in 8.6 code, 2 in 7.x save loading).**
  The checks were kept as written.

## Results per suite

Full run: `cd tests && npm test`, 2607 s in total, 226 passed and 10 failed. The load average was 13 to 17 during
the run. The "Alone" column is a second run of that suite with no other suite running (the other agents were still
running).

| Suite | Full run | Time | Alone | Notes |
|---|---|---|---|---|
| t0_baseline | 0 errors in both sizes | 52 s | | reports only (no PASS/FAIL lines); 16 rides measured |
| t1_gravity | **PASS** 32/32 | 444 s | | |
| t2a_same | **PASS** 1/1 | 48 s | | rides match 8.5 to 6 decimals; 0 errors |
| t2b_disaster | **FAIL** (timeout, crashed after 5 PASS) | 131 s | portrait **20/20 PASS**, landscape timed out again (194 s) | load: frame rate too low, see below |
| t3_evolve | **FAIL** 32 pass / 4 fail | 466 s | 34 pass / 2 fail (315 s) | load: time cap, see below |
| t4_daily | **PASS** 31/31 | 309 s | | |
| t5_regress | **PASS** 27/27 | 908 s | | |
| t6_robust (new) | **FAIL** 98 pass / 5 fail | 249 s | 98 pass / 5 fail (214 s) | 3 real game bugs, see below |

Earlier attempts in the same session (load around 26) gave the same pattern. t4_daily and t5_regress also timed out
once on `page.click`. Both passed fully when rerun.

### t2b_disaster: the frame rate was too low for the test's timer (not a game bug, not caused by Lab slider saving)

The same step failed every time:
```
PASS derailed, crash camera on: phase=crash s=94.75
PASS cartoon riders popped out: 8
page.waitForFunction: Timeout 30000ms exceeded.      (t2b_disaster.js:24, waiting for the Incident Report)
```
The Incident Report opens after a set number of simulated seconds: `DZ86.t>14`, or 1.4 s with the cars at rest. Each
frame advances the simulation by at most 0.05 s, so the delay depends on the frame rate. A diagnostic copy of the
test (in the scratchpad, not in tests/) logged the crash in landscape:
```
 2s phase crash, frames 1 ... 23s frames 30 ... 39s landed 8 ... 44s phase report, Incident Report open (inc86), errors 0
```
The page drew only 1 to 2.5 frames per second, so the report took about 44 s to open, and the test waits 30 s. The
pre-Lab-slider version of the game (commit c5cd625) gave the same timing: report at 44 s, 0 errors. When it ran
alone, the portrait pass completed all 20 checks: derail, report, reset, Moon rollback and Safety back on. **This
failure comes from CPU load, not from a game bug.** It should pass on an unloaded machine.

### t3_evolve: the 25 s time cap ends the run early (documented behaviour, not a game bug)

```
   run: {"goal":"thrill","seed":4242,"tried":26,"ok":17,"ms":26105,"capped":true,...} frames drawn: 32 longest frame gap: 1500 ms
FAIL same seed → identical results (repeatable)
FAIL Place it applied the evolved design as one history step
(full run, landscape, additionally:)
FAIL screen kept drawing while evolving (18 frames)
FAIL time cap stops a long run: 4011 ms, capped=true
```
Every run on this machine hit the 25 s cap (`capped:true`), so each run tried a different number of designs. That is
why the same seed gave different results. CHANGES-8.6.md says this happens: "Same seed = same results holds when the
run finishes". "Place it" checks the key against the first run, so it fails as a knock-on of the repeatability check.
The frames-drawn check (needs more than 20) and the 4 s cap check fail because the CPU is starved. All the other
Evolve checks pass. Comment for the owner of the suite: the repeatability check fails on any machine slow enough to
hit the cap. A slow phone would do the same.

## New suite: `tests/t6_robust.js` (damaged saves)

The suite is listed in `run_all.js` and in `tests/README.md`. I also changed `run_all.js` so it prints how long each
suite took (`--- tN: S s`). The suite runs 13 boots at 390×844 and one at 844×390, in about 3.5 minutes with nothing
else running (most of that time is boot). Each boot puts garbage into localStorage with the harness `storage` option.
It then checks:
* gravity and physics stay finite and in range;
* the brand chip, HUD badge and ride stats show no NaN, undefined or Infinity;
* Disaster Mode is off;
* the Daily history keeps only well-formed days, and the streak is right;
* there are 0 console errors.

Some boots also open the Gravity Lab and Daily Challenge pages and check their text for NaN, undefined or Infinity.

| Boot | Garbage seeded | Result |
|---|---|---|
| control | valid Mars gravity, Disaster on, 2-day streak | read back correctly, which proves the seeding works |
| invalid JSON | `{"k":"moon",` · `{tru` · cut-off daily | Earth, off, empty history; both pages OK |
| wrong types | `{k:7,g:"9.81",real:"no"}` · `"true"` · `{days:[…]}` | fallbacks OK |
| NaN/Infinity/huge | custom `g:1e999` · `1e999` · days with `best` set to 1e308, 1e999, "NaN", -1e308, `res:"yes"`, 5000-char vals | Earth; bad days dropped; best clamped to 1000/0; vals cut to 24 characters; page OK |
| huge / negative custom gravity | `g:1e308` → 25; `g:-1e308` → 1 | clamped, finite |
| odd keys | `k:"__proto__"`, day keys `__proto__`, `yesterday`, `2026-1-1`, `""` | all rejected |
| empty strings | `''` for all 3 keys | fallbacks OK |
| very long strings | 300k-character strings, including as a day key and as vals | fallbacks OK; page OK |
| future dates | 95 future days plus 9999-12-31, 0001-01-01, 1970-01-01 | streak 0 (correct), then **Submit loses today's result (bug 1)** |
| past + future around a real streak (landscape) | yesterday and 2 days ago passed, plus future and 1999 days | streak 2 (correct) |
| old keys 1 | `v7.pr:"abc"`, `prefs.v1` with heat `constructor`, `v7.vol` with Infinity, broken `designs.v2` | **blank 3D view (bug 2)**; broken designs list is kept aside as `designs.v2.unreadable` (correct) |
| old keys 2 | `v7.pr:-5`, `v7.quality:"constructor"` | **canvas never sized (bug 2); quality preset invalid (bug 3)** |

`coasterlab.v86.labPhys` is not covered yet, as instructed.

### Bug 1 (8.6, low): a Daily Challenge Submit is thrown away when future-dated days are saved

```
PASS saved history is valid JSON, at most 90 days (90)
FAIL today's Submit survives the 90-day trim when future-dated days are stored (today in memory: false)
FAIL today's Submit is in the saved history (saved: false, oldest kept: 2026-12-02)
```
`saveDly86()` (line 7449) sorts the day keys and deletes from the start of the list until 90 are left:
`while(ks.length>90)delete DLY86.days[ks.shift()]`. Future dates sort after today, so they are always kept, and
today's result is deleted straight after Submit. Here the save had 98 days, and Submit added a 99th, so 9 were
deleted: 0001-01-01, 1970-01-01, today (2026-11-25) and 2026-11-26 to 12-01. The loader (line 7448) only checks the
shape of each key (`/^\d{4}-\d\d-\d\d$/`). It accepts dates in the future and impossible ones such as 2026-13-45.

How a player gets there: the device clock was set ahead for a while (or the save was damaged), then corrected. That
leaves more than 90 future-dated days, which is rare. Possible fix: drop keys later than `dayKey86()` when loading,
or never trim today.

### Bug 2 (7.x save, medium): a bad `coasterlab.v7.pr` leaves a blank 3D view with no error

```
FAIL pixel ratio "abc": renderer pixel ratio NaN, 3D canvas 0x0
FAIL pixel ratio -5: renderer pixel ratio -5, 3D canvas 300x150 (window 390x844)
```
`prUser=LS7('pr',null)` (line 2232) is used without any check. `applyQuality` sets `window.__gqPr=prUser||Q.pr`, then
`prCap()` computes `Math.min(devicePixelRatio,'abc')`, which is NaN, so the renderer's pixel ratio is NaN and the canvas
is 0×0. The screenshot `tests/shots/robust_pr_text.png` shows the HUD drawn over an empty white page: no sky, no track.
A negative value means the canvas is never sized. The console shows no error, and the problem comes back on every
load. Choosing a quality preset in Settings probably clears it (`prUser=null`, line 2585), but nothing tells the
player to do that.

Fix: accept the value only if `isN7(x)&&x>0`, clamped to roughly 0.5–3.

### Bug 3 (7.x save, low): quality `"constructor"` passes the check

```
FAIL quality "constructor" falls back to a real preset (got constructor)
```
`if(!QUAL[gq])gq=defQ7()` (line 2233) also accepts names that every object inherits, such as `constructor`,
`toString` and `__proto__`. With `gq='constructor'`, `QUAL[gq].fx`, `.pr` and `.sh` are undefined. As a result:
* `fxMul()` returns NaN;
* shadows are off;
* the pixel ratio falls back to the default.

No error is logged. Fix: `Object.hasOwn(QUAL,gq)`. The same pattern is in `HEAT[o.heat]` (prefs, line 1557). In my
check, `heat:"constructor"` logged no error when I picked a ride and opened the Lab, so the suite does not assert
anything about it.

### Seen but not asserted (judgement calls)
* Daily: `pass:"no"` loads as `true` (`!!x.pass`), so a damaged entry can count as a passed day. Non-string `vals`
  become `"7"` and `"null"`. `tries` is only given a minimum, so `1e308` would show up in the share text.
* `bestStreak86()` counts future-dated days, so the Daily page can show a best streak that never happened.
* `coasterlab.v7.fx:"yes"` loads as `fxOn="yes"`. It works because the string is truthy, but it is never turned into
  a true/false value.

## Coverage gaps
* **`coasterlab.v86.labPhys`** (the new Lab slider saving): not tested yet, as instructed. Areas to cover:
  * precedence with the Gravity Lab;
  * "Restore default physics" clears the save;
  * damaged values (the loader already checks with `isN7` and clamps to the slider ranges).
* **Older keys:** the remaining 7.x and 8.x keys have no damaged-data checks. These include `v7.progress`,
  `v7.world`, `v72.*`, `v80.settings`, `v80.park`, `v85.*` and `draft.v2`. Owner and moderator keys were left out on
  purpose.
* **Storage quota full or localStorage throwing:** only reading is covered. Saving when the quota is full
  (`saveFail81`) is not tested.
* **Timing-sensitive suites:** t2b (waits 30 s for the report) and t3 (frames drawn, 4 s cap, repeatability under the
  25 s cap) cannot pass on a heavily loaded machine. They need a quiet machine to give a clean result. I did not loosen
  them.
* **Midnight:** t6 works out "today" in Node once at the start. A run that crosses midnight could fail the streak
  checks.
* **Real devices:** this setup cannot measure real phone frame rates or test Safari's storage eviction.
