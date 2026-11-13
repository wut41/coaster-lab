**TO:** Coaster Lab Owner
**FROM:** Claude — Lead Developer
**SUBJECT:** Coaster Lab 3.0 Development Report

The upgrade is built and playable as `coaster_lab_v10_0.html`. The brief calls it "Coaster Lab 3.0"; the file is
numbered 10.0 because the game was already at 9.0.1. This report says what works, what is partial, and what is not
done. Where something was tested with a stand-in instead of the real thing, it says so.

**Two things need you before the online features go live:** the database migration is written but not applied to
the real Supabase project yet, and "Confirm email" has to be switched off in the Supabase dashboard (section 6).

---

## 1. New features

| # | Feature | State |
|---|---|---|
| 1 | **My Park** — build and run your own park: paths, coasters, 7 flat rides, 4 shops, 2 facilities, 16 scenery items, land, upgrades, staff, days, a real ledger | playable |
| 2 | **Living visitors** — simulated one by one: walk, choose, queue, board, ride, rate, eat, drink, litter, leave; five types; emoji thoughts | playable |
| 3 | **10 new coasters + 2 rebuilt flagships** (Thunder Comet, Nova Giant) and **8 new train types** | playable |
| 4 | **🎲 Generate** in the Track Builder — complete, editable coasters in 7 styles | playable |
| 5 | **Dynamic world** — continuous day and night, five kinds of weather that change visitor behaviour | playable |
| 6 | **Sandbox** (unlimited money, everything unlocked) next to Career, separate saves | playable |
| 7 | **Progression** — park levels and XP, 14 goals with prizes, 12 perks, reputation, 5 achievements | playable |
| 8 | **Customising** — ride names, colours, station styles, train types, path surfaces, entrance gate and sign colours | playable |
| 9 | **Park codes** — share a whole park as text or a file, visit or copy into Sandbox, works offline | playable |
| 10 | **Park cloud** — publish under a 6-letter code, visit, rate, leaderboards | built; waits for the database (section 6) |
| 11 | **Live presence** — see who else is in a published park right now, emoji reactions | built; waits for the database |
| 12 | **Player accounts** — sign-in page, email + password, cloud saves tied to the account | sign-in built; cloud saves wait for the database |
| 13 | **Owner Control Center → My Park 10.0** — live numbers and testing controls | playable |

Also merged from your other sessions and kept: the neon logo, photo sky and grass (PR #2), glow, sun disc, shinier
track and speed effects (PR #3), rider screams and the My Park soundscape (PR #4).

## 2. Fully playable now (no internet, no account needed)

* **My Park, Career and Sandbox.** Start with $25,000 and 8 plots. Everything you build costs its price, every
  visitor pays at the gate and at each ride, shops sell and restock, staff are paid, rides wear, break and get
  repaired. The balance always equals start money + income − costs; the test suite checks that after every step.
* **Visitors** are the same people in the queue, on the train, at the burger bar and in the visitor counter.
  Nothing is decorative and no statistic is invented.
* **Every coaster in the game can be placed in your park** (26, plus secret rides you have found, plus your own
  Track Builder designs) and runs real laps; tap a ride → 🎥 Ride it.
* **The 12 new or rebuilt rides** in the normal ride list, each with its own world, station and train.
* **🎲 Generate**, Preview → Place it → Undo.
* **Day and night, weather, goals, levels, perks, upgrades, a second train, breakdowns, refunds, litter, janitors,
  mechanics, the end-of-day card, park codes.**
* **The sign-in page** (it opens, validates, explains errors) — signing in itself needs the internet.

## 3. Partially implemented

| Thing | What works | What is missing |
|---|---|---|
| Multiplayer | Sharing by code and cloud, visiting, ratings, leaderboards, seeing other people live in the same park | **Not** building together in real time. Each visitor's device runs the park's simulation itself from the published copy. Visiting is read-only |
| AI track creator | A procedural generator (7 styles, 3 sizes), the existing ✍️ Sketch it (draw a line, get a coaster), Beginner / Intermediate / Advanced builder levels, blueprints, undo/redo and validation from 9.0 | It does not call an AI service: no text prompts like "make me a scary coaster". That would need a paid API behind a server (keys must never sit in the page); not built |
| Accounts | Create account, sign in, sign out, change name and password, cloud saves with conflict handling, account-owned published parks | Password reset by email works only within Supabase's built-in limit (about 2 emails an hour, team addresses) until a custom email sender is set up. No "delete my account" button (owner does it in the dashboard). Track Builder designs are not synced, only parks |
| Customising | Names, ride colours, station styles, train types, path surfaces, entrance gate and sign colours | No park-wide themes that restyle everything at once |
| Visitors | Individual needs, choices and thoughts | No groups or families walking together; queues are straight lines |
| Night | Darker sky, dim blue light, lamps and station lights | Rides have no extra light shows |

## 4. New systems and architecture

* **Still one HTML file to play.** `build.mjs` (plain Node, no packages) reads the untouched 9.0 page, applies a few
  small checked text patches and inserts everything from `src/v10/` (21 script modules, styles, markup, four
  pictures). Old code is wrapped, never rewritten; every new name ends in `10`.
* **Park simulation** (`23_ty_sim`): a fixed-step simulation of visitors, ride cycles, staff, clock, weather, goals.
  One ledger (`earn10` / `pay10`) is the only way money moves.
* **Path-finding**: one flow field per destination, shared by everyone walking there, rebuilt only when paths change.
* **Coasters as park objects** (`21_ty_rides`): the real track, scaled to fit, with its own lap physics and timing.
* **Drawing**: visitors are 5 instanced meshes, paths 1; scenery merged per kind.
* **Design tuner** (`05_tune`): a seeded search that adjusts builder pieces until the builder's own inspection is
  clean. It tuned the 12 new layouts and powers 🎲 Generate.
* **Sharing** (`28_ty_share`): compressed park codes; cloud calls through database functions only; live presence
  over one WebSocket.
* **Accounts** (`28b_ty_account`): Supabase Auth over plain `fetch` (no extra library), session renewal, cloud saves
  with revision numbers.
* **Private storage**: the session and this device's secret are stored outside the save area, so "Save a copy" and
  backups never contain them.

## 5. Files changed

| File | Change |
|---|---|
| `coaster_lab_v10_0.html` | **new** — the game (generated; {SIZE} MB, 9.0 was 1.44 MB; the four inlined pictures are about 0.6 MB of that) |
| `coaster_lab_v9_0.html`, `v8_6`, `v8_5` | **untouched** (backups) |
| `build.mjs` | new — the build script |
| `src/v10/js/*.js` (21), `css/*.css` (4), `html/*.html` (3), `post/*.js` (1), `art/*` (4) | new — all 10.0 source |
| `supabase/migrations/20261113000000_coaster_lab_10_parks_and_accounts.sql` | new — database set-up |
| `tests/t7_v10_rides.js`, `t8_v10_park.js`, `t9_sound.js`, `t10_v10_gfx.js`, `t11_v10_account.js` | new suites |
| `tests/tools/cloud_mock.js`, `park_lib.js`, `balance.js`, tuning tools | new |
| `tests/t0`–`t6`, `run_all.js`, `harness.js`, `README.md` | now test 10.0; expectations updated where 10.0 adds rides, tiles and achievements |
| `README.md`, `CHANGES-10.0.md`, `CHANGES-SOUND.md`, this report | docs |

## 6. Backend changes

The game uses your existing Supabase project "Coaster lab". **No new service, no subscription, no server code.**

* The page contains only the **publishable key** (public by design). No secret key is in the page, the repository
  or the tests.
* Publishing, visiting, rating and leaderboards go through six database functions. The tables behind them cannot be
  read or written directly from a browser.
* Accounts use Supabase Auth (email + password). Cloud saves are protected by row-level security: a player can read
  and write only their own rows.
* Live presence uses Supabase Realtime (presence + broadcast) on a public channel per park code.

**Status — please read:**

1. **{MIGRATION}**
2. **"Confirm email" is still on** in the project (2 of the 3 existing users were sent confirmation emails). For
   email + password sign-up without emails it has to be switched off: Dashboard → Authentication → Sign In /
   Providers → Email → Confirm email → off. I cannot change that setting from here. Until then new players see
   "confirm by email first", honestly, and Supabase's built-in sender will only deliver to your team's addresses.
3. **Password reset emails** will hit the built-in limit until a custom SMTP sender is set (README, step 4). The
   game already handles reset links and confirmation links, so switching later needs no game change.

## 7. Database changes

One additive migration. Nothing existing (`profiles`, `coasters`, the sign-up trigger, the 3 users) is changed.

| Object | Purpose | Access |
|---|---|---|
| `cl_parks` | published parks (code, name, author, data ≤ 400 kB, stats, visits, owner) | no direct access; functions only |
| `cl_park_ratings` | one 1–5 star rating per account or device per park | no direct access; functions only |
| `cl_saves` | a player's Career and Sandbox park (one row each, ≤ 400 kB, revision number) | row-level security: own rows only, signed-in only |
| 6 park functions | publish, get (counts a visit), rate, list (leaderboards), my parks, unpublish | anyone with the publishable key |
| 6 account functions | who am I, is a name free, change name, save / load / delete a park | signed-in players (name check: anyone) |
| 2 helpers | hashing and text cleaning | not callable from browsers |

Rules in the functions: sizes are checked, names are cleaned, publishing is rate-limited, nobody can rate their own
park, a park owned by an account can only be changed by that account, and a save is never overwritten by a device
that has not seen the latest revision. The file starts with a "who can do what" summary and an undo script.

## 8. Testing evidence

Everything below ran in **headless Chromium with a software graphics card** on the build that is in the repository.
**No physical device was used.** Screen sizes covered: 320×568, 390×844, 844×390, 1200×800.

{TESTS}

Screenshots from these runs are in `docs/report-10.0/`.

**Not verified:** real iPhone or Android frame rates and touch feel; Safari; the on-screen keyboard over the sign-in
form; password-manager autofill; and anything against the live Supabase project (the test machine cannot reach
supabase.co, so the account server and database were played by a stand-in that follows the same rules as the SQL).

## 9. Known bugs and limits

{BUGS}

## 10. Remaining work

1. **You:** approve / run the database migration and switch "Confirm email" off (section 6). Then do one real
   sign-up, one publish and one visit from a second device; that is the first time the real cloud is exercised.
2. **You:** play it on a real iPhone, especially a busy park, the sign-in form with the keyboard open, and sound.
3. A custom email sender when password resets should work for every player.
4. Not built from the brief: building together live, AI text prompts for tracks, visitor groups, park-wide themes,
   ride light shows at night, scenarios.

## 11. Backup and recovery

* `coaster_lab_v9_0.html`, `coaster_lab_v8_6.html` and `coaster_lab_v8_5.html` are in the repository, byte for byte
  as they were. Opening one of them gives the old game back with the same saves.
* 10.0 stores My Park under its own keys; it does not change 9.0's saves. The old "Save a copy" button still exports
  everything (now including My Park, never the session).
* Every step of this upgrade is a commit on the branch `claude/beautiful-pasteur-82f2g4`; any earlier state can be
  checked out. No pull request was opened.
* When a cloud save replaces a park on a device, the replaced park is kept on that device and can be swapped back
  (Account → ↩ Backup).
* The database migration only adds things and comes with an undo script at the top of the file.

## 12. Run instructions

* **Play:** open `coaster_lab_v10_0.html` in a browser. My Park is the first button on the title screen.
* **Change something:** edit files in `src/v10/`, then `node build.mjs --check`.
* **Test:** `cd tests && npm install && npm test` (all suites, about an hour on a software renderer), or one suite:
  `node t8_v10_park.js`. One section: `T8=C node t8_v10_park.js`, `T11=BC node t11_v10_account.js`.
* **Owner controls:** the same hidden entrance as before, or Park Office → Park → ♛ Owner controls; the new tab is
  "🏗 My Park 10.0".
* **Cloud set-up:** README → "Cloud & accounts".
