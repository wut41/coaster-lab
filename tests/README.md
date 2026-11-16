# Coaster Lab tests

Automated checks for `coaster_lab_v10_0.html`. They run the real game in headless Chromium at a 390×844 phone
size and an 844×390 landscape size (`t6_v90`, `t8_v10_park` and `t11_v10_account` also at 320×568 and 1200×800). three.js comes from the npm package instead of the CDN; it is byte-identical,
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
| `t7_v10_rides` | 10.0 rides: the 10 new coasters and 2 rebuilt flagships pass the builder's full check with no warnings, all differ, run without errors; 8 new train types; ride camera; 🎲 Generate (results valid, Preview → Place it → Undo) |
| `t8_v10_park` | 10.0 My Park: building rules, every dollar in the ledger, visitors arriving / queueing / riding / buying, prices, upgrades and a second train, breakdowns and repairs, litter, weather and the clock, closing time, goals and levels, saving, Sandbox, your own coaster in the park, park codes, the park cloud and live presence (stand-ins), the Owner tab, four screen sizes |
| `t9_sound` | 10.0 sound upgrade: no audio before a tap, the remembered Sound switch, rider screams, the mixer channel, My Park soundscape |
| `t10_v10_gfx` | 10.0 graphics extras: glow, sun disc, shinier metal, speed effects, the quality ladder and its Settings switches, the frame-rate watch |
| `t11_v10_account` | 10.0 accounts: the sign-in page, creating an account, signing in and out, session renewal, cloud saves on two devices (never overwritten without asking, backups), parks owned by the account, a project with email confirmation still on, forgot password and the reset link, offline, a database that is not set up yet, four screen sizes |
| `t17_trailer` | the first-visit trailer: plays once, Skip, remembered, Watch again, a video that can't load |
| `t19_streak_logic` | daily streak rules in plain node: days in a row, the freeze, a broken streak, clock set back, DST, the reward ladder, week bonus, mystery item, Inferno skin |
| `t19_streak_dom` | daily streak popup, HUD chip and title card in jsdom: opening by itself (never over the trailer, a first visit's title screen or a dialog), claiming, rewards, the switch |
| `t19_streak` | daily streak in the real game: popup fits at four sizes, day 7 pays into the game, Inferno skin usable, chip and title card |

`t8`, `t9` and `t11` can run one section at a time: `T8=C node t8_v10_park.js`, `T9=A node t9_sound.js`, `T11=BC node t11_v10_account.js`.

**The cloud in these tests is a stand-in.** The test machine cannot reach supabase.co, so `tools/cloud_mock.js` plays
the account server and the database functions with the same rules as the SQL migration, and a small script plays the
live-presence socket. The real Supabase project is not exercised by these suites.

Other tools in `tools/`: `balance.js` (plays whole days in three parks and prints the books), `tune_designs.js` and
`probe_designs.js` (how the twelve 10.0 layouts were tuned and measured), `shot_rides.js` (a picture of every new ride).

Screenshots land in `tests/shots/`. The suites use the game's built-in test hooks, which only switch on inside a
test harness. These checks cannot measure real iPhone frame rates: the browser draws with a software graphics card.
