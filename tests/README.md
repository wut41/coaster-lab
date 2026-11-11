# Coaster Lab tests

Automated checks for `coaster_lab_v9_0.html`. They run the real game in headless Chromium at a 390×844 phone
size and an 844×390 landscape size (`t6_v90` also at 320×568 and 1200×800). three.js comes from the npm package instead of the CDN; it is byte-identical,
so the page's integrity check still passes.

```bash
cd tests
npm install
npx playwright install chromium   # once, if this computer has no Playwright browser yet
npm test                          # every suite, with a PASS / FAIL summary at the end
node t4_corners.js                # optional, slow (~15 min): proves every Daily Challenge theme is passable
```

| Suite | What it checks |
|---|---|
| `t0_baseline` | 0 console errors in both sizes; measures every ride |
| `t1_gravity` | Gravity Lab presets, realistic friction, labels, stall list, custom slider, saving, Earth reset |
| `t2a_same` | Disaster Mode **off** = rides identical to 8.5 (position and speed to 6 decimals) |
| `t2b_disaster` | Derail, parachute riders, crash camera, Incident Report, rollback, reset, achievements |
| `t3_evolve` | Evolve: valid results only, repeatable seeds, preview → Place it → Undo, Cancel, time cap |
| `t4_daily` | Daily Challenge: same challenge for everyone, Submit, Earth physics, streak, share fallbacks, saving |
| `t5_regress` | Older features next to 8.5: start screen, Lab, Goals, Settings, Park & tools, builder, sketch studio, owner prompt |
| `t6_v90` | 9.0: three builder levels, one card per cause, repair + Undo, starter blueprints, closed-circuit sketches, ride fares (next to 8.6), speech bubbles, 8.6 saves, four screen sizes |

Screenshots land in `tests/shots/`. The suites use the game's built-in test hooks, which only switch on inside a
test harness. These checks cannot measure real iPhone frame rates: the browser draws with a software graphics card.
