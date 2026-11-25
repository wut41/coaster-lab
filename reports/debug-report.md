# Debug report: Coaster Lab 8.6 block (Gravity Lab, Disaster Mode, Evolve, Daily Challenge)

Debugger agent, read-only on the game. All work was done on copies in `reports/debug/`:

* `game.html`: snapshot of `coaster_lab_v8_6.html` at commit c5cd625, taken at the start (md5 7cc8923e…).
* `current.html`: the game as it is now, with the developer's new **LAB PHYSICS SAVE** block (19 new lines after line 7170, md5 87d348c8…).
* `current_fixed.html`: `current.html` with every fix below applied.
* `fix-all.diff`: all fixes as one unified diff against the **current** `coaster_lab_v8_6.html`. It applies cleanly with `patch -p0`. It touches nothing in the Lab-slider save block.

**Line numbers below refer to the current file.** Code before line 7171 did not move. Code after it moved down by 19 lines compared with the c5cd625 snapshot.

Repro scripts are in `reports/debug/r*.js`. Each takes the game file as an optional argument (default `reports/debug/game.html`) and is run from the repo root, e.g. `node reports/debug/r1_env_crash.js reports/debug/current.html`.

---

## Bug 1: Changing the world, or Park life, during a Disaster crash puts the derailed train back on the track, then fakes a rollback
**Severity: medium.** The train teleports, a bogus "↩️ Out of speed!" rollback follows, and the 🏆 *Rollback!* achievement unlocks without being earned.

**Reproduce** (`r1_env_crash.js`, and `r1b_parklife_crash.js` for the Park life variant):
1. Turn on Disaster Mode and ride Looping Adventure until it derails.
2. While it is crashing or the Incident Report is open, change 🌦 World → environment (e.g. Industrial Zone), or toggle Park life.
3. The train reappears on the track at the derail point (s = 94.76 m) at 0 m/s, with the crash ended.
4. Disaster physics then lets it crawl, stall and roll back: `phase "roll"`, and `dzroll86` is awarded.

Result on `current.html`: `after env switch: phase "" s 94.76 v 0.02` → `phase "roll" … Rollback! achievement before false after true`.

**Root cause.** `setEnv72` (coaster_lab_v8_6.html:2913–2914) and `rebuildWorld72` (:3254) save `{s,v,…}`, call `selectRide(cur)` and then write `s`/`v` back. The 8.6 `selectRide` wrapper (:7289) runs `dzEnd86()`, which clears the crash (`phase=''`, `crashed=false`). After that, the old code restores the train to the derail point with v = 0. The stall detector at :7230 (`v===0&&!inStation86()` → `dzRollStart86` after 2.5 s) then fires.

**Fix** (wrap, don't rewrite): if an incident is in progress, return the train to the station before the world is rebuilt, so the position that gets saved and restored is the station.
```diff
@@ -7289,6 +7289,10 @@
 {const f0=selectRide;selectRide=function(i){dzEnd86();return f0.apply(this,arguments)}}
 {const f0=setEditing;setEditing=function(on){if(on)dzEnd86();return f0.apply(this,arguments)}}
 {const f0=replayStart72;replayStart72=function(){if(DZ86.phase)return say('Reset the ride first');return f0.apply(this,arguments)}}
+// a new world / Park life rebuilds the ride and puts the train back where it was: after a crash, put it in the station first
+function dzRescue86(){if(DZ86.phase||DZ86.crashed){dzEnd86();reset()}}
+{const f0=setEnv72;setEnv72=function(k){if((k==='auto'||ENV72[k])&&k!==ENVK72)dzRescue86();return f0.apply(this,arguments)}}
+{const f0=rebuildWorld72;rebuildWorld72=function(){dzRescue86();return f0.apply(this,arguments)}}
```
The guard in the `setEnv72` wrapper copies `setEnv72`'s own early return, so picking the environment you already have does nothing.

**Verified:** on `current_fixed.html`, `after env switch: phase "" s 0 v 3.8`. The train restarts from the station, derails normally at 94.75 m, and no rollback achievement is awarded. The Park life variant gives the same result. 0 console errors.

---

## Bug 2: A rollback left running when Ride Ops takes over later disables the lift chain
**Severity: medium.** The train rolls backwards down the lift hill on a later lap, and the HUD keeps saying "↩ Rolled back!".

**Reproduce** (`r6_modes.js`, part A; run with `ONLYA=1` for that part only):
1. Turn on Disaster Mode, set Moon gravity with Realistic planet off, ride Sky Serpent and let it start rolling back.
2. Switch 🚦 Ride Operations to Realistic. The HUD still says "↩ Rolled back!" while the ops simulation drives the train round the lap.
3. Switch back to Classic. Disaster physics resumes in roll mode with the train on the lift hill, and the train runs backwards at −3.05 m/s.

Result on `current.html`: `ops realistic + 40 s phase="roll" … hud=↩ Rolled back!` → `ops classic again + 2 s phase="roll" s=37.39 v=-3.05`.

**Root cause.** The roll phase only ends inside the Disaster branch of the `advance` wrapper (:7226, ends at :7231–7232). When `dzLive86()` is false, the wrapper hands over to the old `advance` and leaves `DZ86.phase='roll'` set. That happens when Realistic ops is on, and also when `opsActive72()` (:3421) is true because a breakdown closed the ride. When Disaster physics resumes, `roll` still skips lift and launch zones (:7221, `else if(roll)continue`).

**Fix:**
```diff
-{const f0=advance;advance=function(raw){if(!DZ86.on)return f0(raw);if(DZ86.phase==='crash'||DZ86.phase==='report')return;if(!dzLive86())return f0(raw);if(!playing)return;
+{const f0=advance;advance=function(raw){if(!DZ86.on)return f0(raw);if(DZ86.phase==='crash'||DZ86.phase==='report')return;if(!dzLive86()){if(DZ86.phase==='roll')dzEnd86();return f0(raw)}if(!playing)return;
```
**Verified:** on `current_fixed.html`, `phase=""`, the HUD shows "Lift hill" / "Free roll" again, and the train climbs normally after switching back (v = +5.02). 0 console errors.

---

## Bug 3: Daily Challenge: a Submit just after midnight is scored against rules the player has not seen
**Severity: medium.** The coaster is scored against the new day's rules, and the try is counted on the new day, while the card on screen still shows yesterday's challenge.

**Reproduce** (`r2_daily_midnight.js`, which fakes the clock):
1. At 23:59:30 on 25 Nov, open the 📅 tab. It shows #329 Airtime party.
2. At 00:00:30, tap Submit.

Result on `current.html`: `days recorded: ['2026-11-26']`, scored against "Exactly 3 inversions | Peak G ≤ 4.8 G | ≥ 2 s floating" (#330). The ✓/✗ ticks the player was looking at belonged to #329. The 🎡 page's 📤 Share button has the same problem: after midnight it silently does nothing, because there is no result yet for the new day.

**Root cause.** `dlySubmit86` (:7458) and `share86` (:7463) call `challenge86()` / `shareText86()` with *today's* date at the moment of the tap. The card on screen was rendered from an earlier date (:7472), and nothing links the two.

**Fix:** stamp the card's date on its buttons. Submit refuses (and re-renders) if the date has changed. Share shares the result that is on screen.
```diff
-function dlySubmit86(){const ch=challenge86();if(!editing||!B8.on)return say('Open the Track Builder to submit a coaster');if(B8.pv)b8Apply(true);…
+function dlySubmit86(k){const ch=challenge86();if(!editing||!B8.on)return say('Open the Track Builder to submit a coaster');if(k&&k!==ch.k){DLY86.err='';say('📅 A new Daily Challenge started at midnight. Check the new rules, then submit again.');b8LibR();return}if(B8.pv)b8Apply(true);…
-async function share86(host){const txt=shareText86();…
+async function share86(host,k){const txt=shareText86(k||dayKey86());…
-… data-dc86="submit" ${crit?'disabled':''}>📤 Submit my coaster</button>…
+… data-dc86="submit" data-k="${ch.k}" ${crit?'disabled':''}>📤 Submit my coaster</button>…
-… data-dc86="share">📤 Share</button>…
+… data-dc86="share" data-k="${ch.k}">📤 Share</button>…
-…else if(a==='share')share86(t.closest('.dRes86'))});            (both click listeners, :7479 and :7480)
+…else if(a==='share')share86(t.closest('.dRes86'),t.dataset.k)});
-…if(a==='submit')dlySubmit86();…
+…if(a==='submit')dlySubmit86(t.dataset.k);…
```
The exact lines are in `fix-all.diff`. The debug hook `DBG86.submit()` calls `dlySubmit86()` with no argument and behaves as before.

**Verified:** on `current_fixed.html`, the Submit after midnight records nothing, shows the toast and redraws the card as #330. The next Submit is scored against #330. `t4_daily` passes in both sizes with 0 console errors.

---

## Bug 4: Evolve's progress line covers the Place it / Cancel bar of a preview started during a run
**Severity: low to medium.** For the rest of the run (up to 25 s), the player cannot place or cancel the piece they just added.

**Reproduce** (`r3_evolve_preview.js`): start 🧬 Evolve, switch to the Basic tab and add a piece.

Result on `current.html`: `1.5 s later: {"pv":false,"evoBar":true}`. The preview exists, but `#b8Pv` shows "🧬 Evolving… ■ Stop" until the run ends.

**Root cause.** `evoUI86` (:7378–7380) writes `#b8Pv` on every tick without checking for a preview. The 8.6 `b8PvR` wrapper next to it does check (`!bPv&&!B8.pv`), but `tick()` calls `evoUI86` directly.

**Fix:**
```diff
- if(bar){bar.innerHTML=txt;bar.hidden=B8.mode!=='build'}const p=$('#evoP86');if(p)p.innerHTML=txt}
+ if(bar&&!bPv&&!B8.pv){bar.innerHTML=txt;bar.hidden=B8.mode!=='build'}const p=$('#evoP86');if(p)p.innerHTML=txt}
```
Progress stays visible in the 🧬 tab (`#evoP86`). Once the preview is placed or cancelled, `b8PvR` → `evoUI86` puts the progress line back.

**Verified:** on `current_fixed.html` the preview bar stays (`pv:true, evoBar:false`) for the whole run. 0 console errors.

---

## Bug 5: Leaving the builder during Evolve shows a "🧬 No valid improvements found" toast over the ride and changes builder state
**Severity: low.**

**Reproduce** (`r4_evolve_exit.js`): start Evolve, tap the builder's exit button.

Result on `current.html`: after "Back to Looping Adventure…", a second toast appears: "🧬 No valid improvements found — try another seed or goal". Also `B8.lib` is forced to `'evo'`, and the library sheet is set to open, even though the builder is closed.

**Root cause.** The `exitEditor` wrapper (:7403) only sets `run.stop`. The end of `evoGo86` (:7372–7374) then shows its toast and runs `B8.lib='evo'`, `B8.sheet/libOpen`, `b8Render(true)` and the scroll timer regardless of `editing`.

**Fix:**
```diff
- run.ms=performance.now()-t0;run.done=true;EVO86.last=run;EVO86.run=null;const chg=evoKey86(D)!==baseKey;
+ run.ms=performance.now()-t0;run.done=true;EVO86.last=run;EVO86.run=null;if(!editing)return;const chg=evoKey86(D)!==baseKey;
```
Results are still kept in `EVO86.last` / `EVO86.res`, so the 🧬 tab shows them next time.

**Verified:** on the patched copy, only the "Back to …" toast appears, the library tab is left alone, and the results are kept (`nres:1`).

---

## Bug 6 (hardening): `prevDay86` uses local midnight, so streak counting can loop forever on a skipped calendar day
**Severity: low.** It only happens in practice for Pacific/Apia on 2011-12-30, but the failure is a frozen page.

**Root cause.** `prevDay86` (:7444) builds `new Date(y,m-1,d-1)` in local time. If that local date does not exist, the result rolls forward to the same key: `prevDay86('2011-12-31') === '2011-12-31'` under `TZ=Pacific/Apia`. `streak86` (:7450) would then loop forever on a passed day. No time zone in 2026–2030 has this problem. I checked every day in 14 zones, including the ones whose DST change happens at midnight: Santiago, Havana, Asunción, Beirut, Cairo and São Paulo 2017–19 (`r5_dst.js`).

**Fix:** step back one day in UTC on the calendar date, with no time zone involved:
```diff
-const prevDay86=k=>{const[y,m,d]=k.split('-').map(Number);return dayKey86(new Date(y,m-1,d-1))};
+const prevDay86=k=>{const[y,m,d]=k.split('-').map(Number),t=new Date(Date.UTC(y,m-1,d-1));return t.getUTCFullYear()+'-'+String(t.getUTCMonth()+1).padStart(2,'0')+'-'+String(t.getUTCDate()).padStart(2,'0')};
```
**Verified:** `t4_daily` (which builds a 3-day streak) passes on the patched copy.

---

## Bug 7: Gravity Lab "🌍 Earth" column goes stale after a Lab lift, brake or launch change (may overlap the developer's work; not in the diff)
**Severity: low.** The side-by-side table shows wrong Earth numbers.

**Reproduce:** run `r8_earth_cache.js` with Moon gravity. Earth lap time for Looping Adventure is 18.07 s. After `setPH({lift:9})`, the Earth column still reads 18.07 s. A fresh computation with lift 9 set before the first call (`r8b_earth_fresh.js`) gives **11.22 s**.

**Root cause.** `earthStats86` (:7129–7131) caches by `'r'+i` (or a hash of the custom track's points), but computes with the live `PH.lift`, `PH.brake` and `PH.launch`. If a Lab slider changes any of them after the table was first drawn, the cached entry is served until the cache passes 40 entries and is cleared.

**Suggested fix** (not applied, because the developer is working on Lab-slider persistence in the same area):
```diff
-function earthStats86(i){const d=ride(i);if(!d||!d.pts||d.pts.length<4)return null;const key=i===CI?'c'+hash86(JSON.stringify(CUSTOM.pts)):'r'+i;…
+function earthStats86(i){const d=ride(i);if(!d||!d.pts||d.pts.length<4)return null;const key=(i===CI?'c'+hash86(JSON.stringify(CUSTOM.pts)):'r'+i)+'|'+PH.lift+'|'+PH.brake+'|'+PH.launch;…
```
**Not verified on a patched copy.**

---

## Checked and found fine
* **Daily seeded generator:** `rng86` (mulberry32) and `hash86` use only `Math.imul`, integer ops and one final division. The challenge depends only on the date key, not on units or gravity (`t4_daily` checks this too). `rs()` rounds with `toFixed(2)`. Results are identical across runs.
* **Daily dates:** `dayKey86`/`dayNum86` across DST in 14 zones (2026–2030 and São Paulo 2017–19): no gaps or doubles. The card's `new Date(k+'T12:00:00')` (noon) avoids DST-edge mistakes.
* **Streak:** a missed day ends the streak. If today has not been passed yet, the count starts from yesterday (standard). If the clock goes backwards, entries "in the future" are ignored by the current streak and still count for best-ever. The 90-day pruning keeps the newest keys. Loading damaged saves falls back cleanly. Scores are capped at 1000, which matches the maximum.
* **Earth physics for scoring:** `withPH86` swaps `PH`, `G` and `LIFT` and restores them in `finally`. `inspect` and `earthStats86` use fresh temporary contexts, so the live `traceOf`/`ratings80` caches (keyed by `phVer`) are never filled with Earth-physics numbers.
* **Disaster mode switches:** another ride mid-crash, opening the builder mid-crash, gravity changes mid-crash (Jupiter), Disaster off mid-roll and mid-crash, and replay refused while crashed all leave clean state (`r6_modes.js` B–D). The camera comes back from crash cam. Seated riders become visible again, because `updateCars` sets their visibility every frame. Parachute riders and car bodies are built once and reused. Riders live in `scene`, so `disposeRG` never frees them. Disaster physics is identical to `physics()` while v > 0, and `t2a_same` confirms that with the mode off, rides match 8.5 to 6 decimals.
* **Note:** after leaving the builder the camera mode reads `build`, but that is the same with Disaster Mode off (`r7_cam_baseline.js`), so it is older behaviour, not 8.6.
* **Evolve:** Stop and the time cap clear `EVO86.run` and the spinner. When the run ends, `b8Render(true)` → `b8PvR` restores the bar. Seeds are clamped. `b8LibR` is wrapped once and nothing captures the old function. The `LIB80` entries with `null` items are only read by the 8.6 wrapper.
* **Double wrapping / init twice:** every 8.6 wrapper and listener is installed once at the top level of the block. The `#gp86`, `#dzChip` and hub item inserts are guarded or run once. Nothing re-runs the block. `physChanged` is now wrapped twice (Gravity Lab, then the developer's save). The order is fine: the save runs after the Gravity Lab has reset itself to Earth.
* **Leaks:** `yield86` schedules one rAF and one 120 ms timer per yield, and both settle. There is no `setInterval`. `gravCheckAll86` stops when physics changes and restarts only if the page is open. Particles go through the pooled `emit`.
* **Console errors:** 0 in every repro, and in `t0_baseline`, `t1_gravity`, `t2a_same` and `t4_daily` on the patched copy (only the 4 known warnings in t0).

## Test status on the patched copy (`current_fixed.html`, copied suites in `reports/debug/suite/`)
The machine was heavily loaded the whole time (load average 12–17 on 4 cores, with other agents running).
* **Pass:** t0_baseline, t1_gravity, t2a_same and t4_daily all passed with 0 errors.
* **t3_evolve:** failures came only from runs hitting the 25 s time cap under load ("same seed → identical", the "Place it" key check, frame count). The **unpatched** `current.html` run in parallel fails the same checks and more, so this is load, not the patch (`ab_t3_evolve_*.log`).
* **t2b_disaster:** timed out on both copies with the suite's 30 s limits (the patched run failed at its first click, before any 8.6 code). See the result of the longer-timeout copy below.

* **t2b_disaster with longer timeouts** (`suite/t2b_slow.js`: the same checks, with the wait limits raised from 30 s to 240 s, run on its own): **30/30 PASS** on `current_fixed.html` in both sizes, 0 console errors (`ab_t2b_slow_fixed.log`). The normal rollback still unlocks *Rollback!*, so the Bug 1 and Bug 2 fixes do not block a real rollback.

## Summary for the manager
I found seven bugs in the 8.6 block, all reproduced. Six are fixed and verified on a copy; `reports/debug/fix-all.diff` holds those six fixes and applies cleanly to the current game file. Two are medium Disaster Mode state leaks: a world or Park life change mid-crash teleports the train and fakes a rollback plus its achievement, and a rollback left over when Ride Ops takes over later disables the lift chain. One is a medium Daily Challenge bug: a Submit just after midnight is scored against rules the player hasn't seen. Two are Evolve UI problems, low or low-to-medium: the progress line covers a preview's Place it bar, and a stray toast plus builder-state changes happen after leaving the builder. One is a low hardening fix for the streak date step. I did not change the developer's Lab-slider save code; Bug 7, a stale Gravity Lab Earth column, is in that area, so I wrote a suggested fix but did not apply it. Nothing was committed.
