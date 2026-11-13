# Coaster Lab 10.0 (the "Coaster Lab 3.0" upgrade)

`coaster_lab_v10_0.html` is the new version. `coaster_lab_v9_0.html` (and 8.6, 8.5) are unchanged and stay in the
repository as backups. The brief calls this upgrade "Coaster Lab 3.0"; the file is numbered 10.0 because the game was
already at 9.0.1.

Everything 9.0 had is still there, on the same buttons, with the same saves. 10.0 adds seven things.

## 1. My Park: build and run your own park

Title screen → **🏗 My Park** (also in Park & tools). A park is a 192 × 192 m lawn divided into 4 m tiles and 36 plots
of land; you start with 8 plots, an entrance and $25,000.

* **Build** from the bar at the bottom: paths (5 surfaces), coasters, 7 flat rides, 4 shops, restrooms, an info &
  first-aid hut and 16 kinds of scenery. Tap a place, turn it, confirm. Things cannot overlap, must be on your land,
  and say why when they do not fit. Removing gives half the price back.
* **Coasters in the park are the game's real coasters.** Every ride you can ride (26, plus secret rides you have
  found) and every coaster you made in the Track Builder can be placed. Its train runs a real lap computed from the
  track's physics, the station has a queue yard, and you can ride it from the park (tap the ride → 🎥).
* **Money is real.** Every dollar goes through one ledger: entrance tickets, ride tickets, food and shop sales, goal
  prizes, sales and loans coming in; building, land, power, wages, repairs, stock, loan interest, promotions and
  refunds going out. The balance is always exactly start money + everything in − everything out (the tests check this
  after every step). Park Office → Money shows today's books line by line and the last twelve days.
* **Prices matter.** Each ride shows what a ride is worth to most visitors. Charge more and fewer people ride (and some
  say "the rides cost too much"); charge less and queues grow.
* **Land** is bought plot by plot, next to what you own; each plot costs more than the last.
* **Upgrades** per ride: capacity (a second train on coasters at level 2), reliability, effects; plus station style,
  train type, colour and name. The entrance gate and park sign have their own colours.
* **Staff**: janitors sweep litter, mechanics walk to broken rides and repair them. Rides wear with use, get
  inspected when a mechanic is free, and break more often when neglected. A broken ride lets everyone off first;
  people who paid but never set off get a refund.
* **Days**: the park opens at 09:00 and closes at 21:00. At closing a day card shows the day's books; the night
  passes quickly once everyone has gone home.
* **Progress**: park level and XP (levels unlock rides, shops and scenery), 14 goals with cash prizes, 12 perks
  bought with level stars, reputation that follows how happy visitors leave, and 5 achievements in the game's
  existing Goals list.
* **Career and Sandbox** are two separate parks. Sandbox has unlimited money and everything unlocked; switching
  never touches the other park.

## 2. Living visitors

Visitors are simulated one by one (how many come depends on the park; at most 260 at once on a phone, 420 on a
computer). Each has a type (thrill seeker,
family, casual visitor, coaster enthusiast, gentle rider), money, and needs that change through the day: hunger,
thirst, energy, restroom, nausea, happiness.

They walk in through the gate and pay the entrance fee, find their way along your paths, choose rides that suit them
(weighing excitement, intensity, price, queue length, walking distance and whether they have ridden it before), join
the real queue, board when the train is in the station, ride, and rate the ride afterwards. They buy food and drink
when hungry or thirsty, look for restrooms and benches, drop litter where there are no bins, put up umbrellas in the
rain, and leave when tired, broke, unhappy or at closing time. Emoji bubbles and the Visitors tab show what they are
thinking ("I am hungry and there is nowhere to eat", "Hydra was amazing!"). Tap any visitor to see their card.

Ride queues, riders on trains, ride income and the visitor counter are all the same people; nothing is decorative.

## 3. Ten new coasters, two rebuilt flagships, eight new train types

| Ride | Type | What makes it different |
|---|---|---|
| **Talon Strike** | dive coaster | wide 6-across cars, a held vertical drop |
| **Aurora Wing** | launched wing coaster | seats beside the track, a launch instead of a lift |
| **Nightshade** | inverted coaster | train hangs under the rail |
| **Sky Manta** | flying coaster | riders face the ground |
| **Turbo Circuit** | motorbike launch coaster | low, fast, no inversions |
| **Timberwolf** | wooden coaster | wooden structure and rails, a train that shakes |
| **Hydra** | floorless coaster | 7 inversions |
| **Cheddar Chase** | spinning family coaster | tight mouse-style turns |
| **Little Dipper** | family coaster | the gentlest ride in the game |
| **Pendulum Pass** | swinging suspended coaster | cars swing out in the turns |
| **Thunder Comet** (rebuilt) | launched flagship | bullet train, top hat, 2 inversions |
| **Nova Giant** (rebuilt) | hyper flagship | the tallest ride, giant loop and zero-G hill |

Thunder Comet and Nova Giant existed since 8.4 as signature rides; they keep their place in the list (rides 17 and
18) and were redesigned from scratch. The first 20 rides keep their numbers, so saved favourites and records still
point at the right ride.

Every layout was written as Track Builder pieces and tuned by a small search program (`src/v10/js/05_tune.js`) until
the builder's own full check reports **no must-fix problems and no warnings** (forces, clearances, stalls, kinks).
No two of the twelve share the same length / height / inversions / top speed. Each ride has its own world, scenery
and station.

The eight train types (dive, floorless, wing, motorbike, wooden, hyper, bullet, swinging) are also available in the
Train Studio and in the builder's Track look.

## 4. 🎲 Generate in the Track Builder

A new library tab (in all three builder levels). Pick a style (family, looper, launch, hyper, twister, wooden or
surprise me) and a size; it writes up to three complete coasters out of ordinary builder pieces, tunes each until the
full check has no must-fix problems, and shows them with their numbers. **Preview** uses the builder's own preview
bar; **Place it** replaces your coaster and **Undo** brings the old one back. The result is a normal design you can
edit, save and share.

This is a procedural generator running in the browser. It does not call an AI service, so there is no API key and no
running cost. The brief's "draw a line and get a coaster" already exists as ✍️ Sketch it (8.5/9.0) and was kept.

## 5. A world that changes

In My Park the time of day moves continuously (sky colour, sun height and colour, shadows, lamps and station lights
at night), and the weather changes by itself: sunny, cloudy, rain, thunderstorm, fog. Weather matters: rain and storms
bring fewer visitors, people without umbrellas hurry, sunny days make people thirstier. Park Office → World lets you
hold the clock or the weather.

## 6. Sharing and visiting parks

* **Park codes** (work offline): the whole park packed into a text code. Copy, paste into a message, or download as a
  file. Anyone with 10.0 can paste it to visit, or load it into their Sandbox.
* **The park cloud**: publish a park under a 6-letter code, visit by code or from the leaderboards (top rated, best
  park rating, most visited, newest), rate parks you visit with 1–5 stars. A link like `…#park=K7Q2XM` opens a park
  directly.
* **Live presence**: while you are in a published park, everyone else in that park right now appears as a coloured
  pin with their name, moving where they look, and can send emoji reactions.

What this is and is not: visiting is **read-only**; each visitor's device simulates the park's visitors itself from
the published copy. Live presence shows *people*, not a shared simulation. Building together in real time is not
implemented.

## 7. Player accounts (optional)

Title screen → **👤 Sign in** (also in Park & tools and Park Office → Share / Park).

* Create an account with an email, a password and a player name; sign in; sign out. Email + password only: nothing
  depends on an email arriving (see README → Cloud & accounts for the one dashboard switch this needs).
* **Parks belong to the account.** Career and Sandbox are saved to the account while you play (a few minutes apart,
  at the end of each day and when you leave the park) and load on any device you sign in on.
* **Nothing is overwritten without asking.** If two devices changed the same park, the account page shows both side
  by side and you choose; the other one is kept as a backup on the device and can be swapped back.
* Parks you publish while signed in belong to the account (your player name, a ✔ on leaderboards) and can be updated
  or removed from any device; a signed-out device cannot change them.
* Change your player name or password in Account settings. "Forgot password?" asks Supabase for a reset email; until
  the project has its own email sender that email is limited to a couple an hour (the page says so).
* **Signed out, offline, or before the database is set up, the game plays exactly as before.** Signing out keeps your
  parks on the device.

## Also in this build (from other work sessions, merged)

* **Art** (`31_art.js`): a neon logo on the title screen, photo clouds, a sunset sky, a grass texture.
* **Graphics extras** (`40_gfx.js`): glow, a sun disc, shinier metal track, shake and motion blur on drops, scaled
  down automatically on phones and when the frame rate drops.
* **Sound** (`35_sound.js`, see `CHANGES-SOUND.md`): rider screams, a My Park soundscape, a remembered Sound switch.

One side effect to know: the older **Park HQ** mode counts every ride in the game, so with ten more coasters the
same day there now brings roughly a third more visitors and income than in 9.0.

## Owner Control Center

A new tab, **🏗 My Park 10.0** (also reachable from Park Office → Park → ♛ Owner controls). It shows the running
park's real numbers (money, today's and all-time income and costs, visitors by state and type, needs, a table of every
ride with state, queue, riders, income, running cost, reliability and verdict, frame rate and draw calls, account and
cloud state) and has testing controls: add money (booked as "Owner grant" so the books still add up), add visitors
(they pay at the gate like everyone else), cheer everyone up, send everyone home, clear litter, set the time, end the
day, set speed ×1–×8, set or hold the weather, break / repair / wear rides, +1 park level, show the tutorial again.
The older Owner tabs are unchanged.

## How it is built

* **One file to play, many files to edit.** `build.mjs` reads the untouched 9.0 page, applies ten small checked text
  patches (three version labels, four texts, three hooks in the track renderer for wooden track) and
  inserts `src/v10/css`, `src/v10/html` and `src/v10/js` in file-name order. All 10.0 script code sits in one block
  with every name ending in `10`, so it cannot collide with the 9.0 code. Old functions are wrapped, never rewritten.
* **Storage.** My Park uses its own keys (`coasterlab.v10.*`): `park.career`, `park.sandbox` and their `.bak`
  backups. Older saves are not touched. Three things are deliberately kept **outside** the save area, under
  `coasterlab-device.v10.*`: `dev` (this device's secret for the parks it published, its nickname and colour), `auth`
  (the signed-in session) and `sync` (which cloud revision this device last saw). The game's "Save a copy", backup
  and restore features handle every `coasterlab.*` key, so a save file never contains a session or a device secret
  and can be shared safely.
* **Modules** (`src/v10/js`, 21 files): `00_core` helpers · `05_tune` design tuner · `10_trains` train types · `11_designs`,
  `12_rides` the twelve rides · `20_ty_core` park data, catalogue, ledger · `21_ty_rides` coasters as park objects ·
  `22_ty_world` 3D park, sky, light, camera · `23_ty_sim` visitors, rides, staff, clock, goals · `24_ty_draw` drawing
  visitors and trains · `25_ty_build` building rules and touch input · `26_ty_ui` park interface · `27_ty_office` Park
  Office · `28_ty_share` codes, cloud, live presence · `28b_ty_account` accounts and cloud saves · `29_ty_debug` test
  hooks · `30_gen` generator · `31_owner` Owner tab · `31_art`, `35_sound`, `40_gfx` art, sound and graphics extras.
* **Performance.** Visitors are drawn as five instanced meshes (one draw call each) and paths as one; scenery is
  merged per kind. Path-finding is one flow field per destination, shared by everyone walking there and rebuilt only
  when paths change.

## Database (Supabase)

One additive migration, `supabase/migrations/20261113000000_coaster_lab_10_parks_and_accounts.sql`:

* `cl_parks`, `cl_park_ratings`: published parks and their star ratings. Closed to direct access (row-level security
  on, no policies, no grants); browsers go through six functions that validate sizes, clean names, rate-limit
  publishing and count visits.
* `cl_saves`: one row per player and slot (career, sandbox), at most 400 kB. Row-level security: a signed-in player
  can read and write only their own rows.
* Six account functions: `cl_me`, `cl_username_free`, `cl_set_username`, `cl_save_put` (refuses to overwrite a
  revision the device has not seen and says so), `cl_save_get`, `cl_save_delete`.
* Player names use the existing `profiles` table and its sign-up trigger, unchanged.

**Status: written and reviewed, not yet applied to the live project** (applying needs the owner's approval in
Supabase; see "What is left").

## Known limits

* **Not tested on a physical phone.** All testing ran in headless Chromium with a software graphics card at 320×568,
  390×844, 844×390 and 1200×800. Layout, touch targets and logic are checked; real iPhone frame rates, Safari quirks,
  the on-screen keyboard over the sign-in form and password-manager autofill are not.
* **The cloud was tested against a stand-in**, not the live Supabase project: the test sandbox cannot reach
  supabase.co, and the migration is not applied yet. The stand-in follows the same rules as the SQL
  (`tests/tools/cloud_mock.js`). The first real publish, visit, sign-up and cloud save should be watched.
* Live presence shows people, not a shared simulation; visiting is read-only.
* A park that is open keeps changing as its clock runs. Leaving the same park open and visible on two devices at once
  therefore counts as two different parks: the second device is asked which one to keep.
* Coasters in the park are scaled-down copies so several fit on the lawn (builder coasters to about 40% size); the
  on-ride camera in the park rides the scaled copy.
* Visitors walk only on paths and queue in straight lines; there are no groups or families walking together.
* The page grew from 1.44 MB to 2.4 MB (about 0.6 MB of that are the four pictures built into the file).

## What is left

1. **Apply the database migration** and switch "Confirm email" off (README → Cloud & accounts, steps 1–3). Then try
   one real sign-up, one publish and one visit from a second device.
2. Play it on a real iPhone and note frame rate with a busy park.
3. A custom email sender, when password resets should work for every player.
4. Ideas not built: building together live, visitor groups, staff patrol zones, ride photos sold to visitors,
   scenarios with set goals, syncing Track Builder designs to the account.
