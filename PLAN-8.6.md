# Coaster Lab 8.6 — plan

`coaster_lab_v8_5.html` stays untouched as the backup. 8.6 is a copy with **one new block of code** added at the end
of the game script (`COASTER LAB 8.6`), following the house rules already used by 8.0–8.5:

* old functions are **wrapped** (call the original, then add), never rewritten;
* 8.6 data lives under `coasterlab.v86.*` only;
* new screens reuse what is there: the `#ov7` overlay (Settings / Goals), toasts (`say`), notices (`notify80`),
  achievements (`ACH` + `achToast`), the 🎡 Park & tools hub (`hubItem72`), the builder library tabs (`LIB80`),
  the builder preview (`b8Begin` → ✓ Place it / ✕ Cancel → `commit`, so Undo works), the busy spinner (`B8.busy`),
  camera plug-ins (`CAM72`) and pooled particles (`emit`).
* Owner password / passcode / PBKDF2 code and the secret rides are not touched.

## What I found
| Thing | Where | Used for |
|---|---|---|
| `PH`, `PH0`, `physChanged()` | physics core | Gravity Lab sets `PH.g` (and, realistically, friction + air) |
| `physics()` has `v=Math.max(v,1.5)` | physics core | the hidden "never stall" safety drive → Disaster Mode turns it off |
| `traceOf()` → `seatG()` → `statsOf()` / `ratings80()` | research engine | stats for Gravity warnings, Disaster predictions, Evolve and Daily scores |
| `inspect(D)` (pure) + `validate` + `sanDesign` | builder engine | validity gate for Evolve and Daily |
| `ET[type].ps` (min / max / step) + `clampP` | builder engine | Evolve's mutation limits |
| no builder budget exists | — | Daily Challenge uses rules only |

## Stages (test after each one)
1. **Gravity Lab** — planets Moon / Mars / Earth / Jupiter + custom slider. "Realistic planet" option on by
   default: rolling resistance scales with weight, Moon has no air (measured: 0 of 20 rides stall, ~43 s of floating
   per lap). G numbers stay in Earth G and are labelled with the planet; a time-sliced check lists rides that stall.
   Saved; one-tap 🌍 Back to Earth. Lives in ⚙ Settings + a 🎡 tile.
2. **Disaster Mode** — off by default; when off nothing changes. When on (classic operations): no safety creep drive,
   no anti-rollback, wheels give up above 2.6 G sideways or below −2.0 G (averaged over ~⅓ s, measured against all 20 rides).
   Derail → cars tumble with gravity, cartoon riders pop out with parachutes and confetti, crash camera, 📋 Incident Report.
3. **Evolve** (builder library tab 🧬) — seeded (μ+λ) evolution of the current design inside the builder's own limits,
   only designs with no must-fix problems, four goals, progress bar, time cap, best 3, preview with Place it / Cancel.
4. **Daily Challenge** (builder library tab 📅 + 🎡 tile) — challenge made from the date with a seeded generator,
   Submit checks rules with standard Earth physics, score, streak + history, Wordle-style share.

Testing: Playwright + headless Chromium, three.js served from the npm package (byte-identical to the CDN file,
so the import map's integrity hash still passes), 390×844 portrait and 844×390 landscape, 0 console errors.
