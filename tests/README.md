# Coaster Lab tests

Automated checks for `coaster_lab_v10_1.html`. They run the real game in headless Chromium at a 390×844 phone
size and an 844×390 landscape size (`t6_v90`, `t8_v10_park`, `t11_v10_account` and `t21`–`t24` also at 320×568 and 1200×800; `t20_security` runs at 390×844 and 1200×800, and its one new screen, the "Is this your account?" question, at all four). three.js comes from the npm package instead of the CDN; it is byte-identical,
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

| `t13_terra` | 10.1 park: land shaping and water |
| `t14_fx` | 10.1 park: effects (fireworks, lights, weather extras) |
| `t15_parksim` | 10.1 park: upkeep and going broke, themed scenery and rides, on-ride photos, families, the four scenarios |
| `t16_builder` | 10.1 builder: the roomier piece picker, recent pieces, the force colours, handles |
| `t20_security` | **10.1 hardening**, each item attacked on 10.1 and, where it shows the problem, on 10.0 for comparison: hostile leaderboard rows, the Content-Security-Policy, park codes with built-in property names, the published code, a park code that unpacks to 12 MB, a flood of fake live visitors, the owner lock, a hostile design, two tabs sharing a sign-in (renewing one after the other and at the same moment, signing out, a renewal still on its way during a sign-out: the account server's answer is held back to make those moments last), sign-in links |
| `t21_saves` | **10.1 saves**: daily backups and going back to one, a save that cannot be read (with the 10.0 comparison), the same park in two tabs (with the 10.0 comparison), backup files and every way one can be wrong, the warning that stays while saving fails, four screen sizes, and going back: a park saved by 10.1 opened in 10.0 and again in 10.1 |
| `t22_diag` | **10.1 Diagnostics**: every section and its numbers, recorded errors with tokens cut short, each health warning and its threshold, the report (no tokens, no device key), the on-screen counter, hidden from players, four screen sizes |
| `t23_builder6` | **10.1 Track Builder**: live numbers and what a change does to them, the status chip, good next pieces by situation, History and named Undo, Test from here, the ten new layouts measured with the builder's own check, sketch matching, the phone layout, four screen sizes |
| `t24_parkpro` | **10.1 My Park**: the books against the ledger, the week, saving and cleaning a hand-edited save, why visitors went home, the Advisor's rules, the short line, mechanic order and the service policy, recent events, the Visitors tab, the CSV download, a long busy day with families, four screen sizes, and the starter park that stops 10.0 with "Maximum call stack size exceeded" (10.1 plays it for three days) |

Most suites can run one section at a time: `T8=C node t8_v10_park.js`, `T9=A node t9_sound.js`, `T11=BC node t11_v10_account.js`,
`T20=AB node t20_security.js`, `T21=C node t21_saves.js`, `T22=A node t22_diag.js`, `T23=DE node t23_builder6.js`, `T24=H node t24_parkpro.js`.
`CL_F=/path/to/another.html` points `t23` and `t24` at a different build.

**The database has its own tests.** `bash supabase/tests/run.sh` starts a throw-away local PostgreSQL, builds a copy
of the live project's tables, applies both migrations (twice, to prove they can be re-run) and runs
`supabase/tests/10_tests.sql` as the signed-out and signed-in roles a browser would be. `bash supabase/tests/run.sh
payments` also runs the design-only purchases proposal in `docs/payments/`. Nothing is sent to Supabase.

**The cloud in these tests is a stand-in.** The test machine cannot reach supabase.co, so `tools/cloud_mock.js` plays
the account server and the database functions with the same rules as the SQL migration, and a small script plays the
live-presence socket. The real Supabase project is not exercised by these suites.

Other tools in `tools/`: `balance.js` (plays whole days in three parks and prints the books), `tune_designs.js` and
`probe_designs.js` (how the twelve 10.0 layouts were tuned and measured), `shot_rides.js` (a picture of every new ride).

Screenshots land in `tests/shots/`. The suites use the game's built-in test hooks, which only switch on inside a
test harness. These checks cannot measure real iPhone frame rates: the browser draws with a software graphics card.
