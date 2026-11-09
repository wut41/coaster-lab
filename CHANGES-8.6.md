# Coaster Lab 8.6: what's new

**File:** `coaster_lab_v8_6.html` (still one HTML file).
**Backup:** `coaster_lab_v8_5.html` is untouched. Its checksum matches the file you uploaded.

## How it was added (plain language)

All the new code sits in one clearly marked block near the end of the game script, called
`COASTER LAB 8.6`, plus a short block of styles. It follows the same house rules 8.0–8.5 used:

* **Wrap, don't rewrite.** When 8.6 needs to change what an older function does, it keeps the old
  function and puts a small "wrapper" around it. The wrapper calls the original, then adds the new part.
  If a new feature is switched off, the wrapper just steps aside.
* **Its own save slot.** Everything 8.6 saves lives under `coasterlab.v86.*` in your browser storage.
  Older saves are read as they are and never rewritten.
* **Reuses what's there:** the ⚙ Settings / 🏆 Goals window, toasts, notices, achievements, the 🎡 Park & tools menu,
  the builder library tabs, the builder's preview ("✓ Place it / ✕ Cancel", so Undo works), the crash camera
  plug-in point and the pooled particles.
* **Not touched:** the owner password, the moderator passcode, the PBKDF2 code and the secret rides.
  New lists only name secret rides you have already unlocked.

---

## 1. 🪐 Gravity Lab

*Where:* 🎡 Park & tools → 🧪 Experiments → **Gravity Lab**, or ⚙ Settings → 🧪 Experiments at the top.

* **Planets:** 🌙 Moon (1.62 m/s²), 🔴 Mars (3.71), 🌍 Earth (9.81) and 🪐 Jupiter (24.79), plus a
  **custom slider** from 1 to 25 m/s².
* **Real physics:** it sets `PH.g` through `physChanged()`, the same path the Lab uses. Speeds, lap times,
  G-forces, ride stats and the builder all follow it.
* **"Realistic planet" (on by default):** in real life, rolling friction is a share of the train's weight,
  so it gets smaller when gravity is lower. The Moon also has no air, and Mars almost none. With this on,
  the Moon gives *floaty airtime instead of stalls*. Measured: 0 of 16 visible rides stall, and Looping
  Adventure floats for 20.6 s per lap instead of 5.9 s. With it off, only gravity changes, exactly like the
  Lab's gravity slider; then 7 visible rides run out of speed on the Moon.
* **Honest G readouts:** G numbers are always in **Earth G** (1 G = your weight at home). Whenever gravity
  isn't Earth's:
  * the top-left badge names the planet (for example "🌙 Moon gravity");
  * the HUD G-force / Feel reading gets the planet's icon;
  * lap cards say "🌙 Moon gravity (1.62 m/s²) · G-forces in Earth G";
  * the Gravity Lab shows an Earth vs. planet table for the ride you're on.
* **Stall warnings:** a notice appears when the current ride would run out of speed. The Gravity Lab also
  checks every ride, one per frame so the screen never freezes, and lists the ones that stall.
* **Saved, with a one-tap reset:** **🌍 Back to Earth** on the page and in Settings. "Restore default
  physics" in the Lab also counts as going back to Earth.
* Achievements: 🌙 **Moonwalker** (a lap in Moon gravity), 🪐 **Heavyweight** (a lap in Jupiter gravity).

## 2. 💥 Disaster Mode

*Where:* 🎡 Park & tools → 🧪 Experiments → **Disaster Mode**, or the switch in ⚙ Settings → 🧪 Experiments.
A red **💥 Disaster** badge shows while it's on.

* **Off by default.** When it's off, rides are **bit-for-bit identical to 8.5**. Tested: 6 rides were sampled
  through their laps in both versions, and position, speed and time matched to 6 decimal places.
* **On (Classic ride operations, not while building)**, three safety systems are switched off:
  1. **Safety drive tyres.** The normal physics never lets the train go slower than 1.5 m/s, so it can never stall.
  2. **Lift anti-rollback.** The chain only pulls a train that's going forwards.
  3. **Strong wheel grip.** The wheels let go above **2.6 G sideways** or below **−2.0 G**, averaged over about
     ⅓ s (what a wheel and a rider would actually feel).

  These limits were measured on every ride. With Earth gravity, three of the four classic toy-scale rides
  (Looping Adventure, Canyon Rush, Sky Serpent) fly off, and every modern ride stays on the track. Heavier
  gravity makes more rides fail; lighter "gravity only" settings make trains roll back.
* **Derail:** the four cars become tumbling bodies that fly with the current gravity, bounce on the ground
  and settle. The crash physics runs in fixed 1/120 s steps, so the results don't depend on your frame rate.
  The cartoon riders pop out with confetti and float down on striped parachutes 🪂 (everyone lands safely),
  and a crash camera circles the wreck (drag to turn, pinch to zoom).
* **📋 Incident Report:**
  * a "DERAILED" or "ROLLED BACK" stamp;
  * a silly cause of failure (for example "Someone forgot that the banked turn is not a suggestion.");
  * speed when it failed, distance flown, where it ended up, hang time, highest point, cars upside down;
  * official findings (the real force and limit) and a couple of joke stats.

  Buttons: **↻ Reset & ride again**, **🛟 Safety back on**.
* The Disaster page tells you in advance what will happen on the current ride.
* Achievements: 💥 **Off the rails!**, 🛫 **Frequent flyer** (a car flies 60 m / 200 ft), ↩️ **Rollback!**

## 3. 🧬 Evolve (Track Builder)

*Where:* in the Track Builder, open the pieces library (＋ Add) → the **🧬 Evolve** tab.

* **What it does:** makes small random changes to the coaster you're building. It changes 1 to 3 numbers at a
  time: heights, angles, lengths, radii, turn direction, and so on. Every change stays inside **the same
  min / max / step limits the builder's own sliders use**. The station doesn't move.
* **Goals:** 🎢 Max thrill · 🪂 Max airtime · 🧸 Smooth & family-friendly · 💥 Max G (scored up to 6.5 G).
  Scores use the game's existing numbers: the thrill / intensity / comfort / smoothness ratings, peak G,
  airtime and floating time from the simulated lap. Each ✓ Check warning costs a few points.
* **Only valid designs:** every version must pass `sanDesign` and the full ✓ Check (`inspect`) with
  **no must-fix problems**, or it's thrown away.
* **How it works:** keep the best 4, make 8 new versions from them, and repeat for 6 / 10 / 16 generations.
  The changes get smaller as it goes.
* **Seeded:** the same seed, goal and starting coaster always give the same results (tested). 🎲 picks a new seed.
* **Never freezes:** it checks one design at a time between frames, shows a progress bar in the builder's
  bottom bar (with ■ Stop), and has a **25-second time cap**.
* **Results:** the best 3, each with a mini picture, its stats and the change in score. **👁 Preview** opens the
  builder's normal preview (your old track as a dashed line → ✓ Place it / ✕ Cancel). Placing it is one
  normal step in history, so **Undo works** (tested).
* Achievement: 🧬 **Mad scientist** (place an evolved design).

## 4. 📅 Daily Challenge

*Where:* 🎡 Park & tools → 🧪 Experiments → **Daily Challenge**, or in the Track Builder library → the **📅 Daily** tab.

* **Same challenge for everyone:** the challenge comes from the **date only**. A seeded generator picks one of
  7 themes (🧸 Family day, 🌀 Loop-de-loop, 🪂 Airtime party, ⚡ Speed run, 📏 Pocket rocket, 🏔 Sky high,
  🎲 Mystery mix) and 3 rules with their numbers. Example: "Sky high: at least 138 ft tall · peak G no more than
  4.8 G · the ride lasts at least 56 s". Units and gravity settings don't change it (tested).
* **No budget:** the builder has no money budget, so challenges are rules only.
* **Submit:** in the builder's 📅 tab. The coaster must pass the normal ✓ Check. Then it's measured with
  **standard Earth physics**, so it's fair whatever gravity you play with, using the game's own stats.
  While you build, the tab ticks rules off live (when your physics is Earth's).
* **Score:** up to 1000. A pass is 600, plus up to 300 from the theme's stat (comfort, thrill or airtime),
  plus up to 100 for clearing the rules with room to spare. Without a pass it's 100 per rule passed.
  Submit as often as you like; your best score counts.
* **Fair numbers:** for every theme, every *strictest* combination of its rules was checked against coasters
  built in this builder (built-in layouts, park rides, and small tweaks of them), so every challenge it can
  make is passable. The Loop-de-loop and Mystery mix ranges were trimmed until that was true.
* **Saved:** streak, best streak and the last 90 days of history stay on the phone.
* **Share (Wordle-style):** uses the phone's share sheet (`navigator.share`), falls back to copying to the
  clipboard, and as a last resort shows the text in a box to copy.

  ```
  🎢 Coaster Lab Daily #313 🏔 Sky high
  🟩🟩🟩 820 pts · 2 tries
  ✅ At least 138 ft tall (147 ft)
  ✅ Peak G no more than 4.8 G (4.49 G)
  ✅ The ride lasts at least 56 s (56 s)
  🔥 Streak 3
  ```
* Achievements: 📅 **Daily challenger**, 🔥 **On a roll** (3 days in a row).

---

## Known limits (honest list)

* **Frame rate isn't proven.** Testing used a headless browser with a *software* graphics card, which can't
  show real iPhone speed. Please run the checklist below on your iPhone.
* **Evolve** can't split one ✓ Check into smaller pieces. Each check took about 6 ms in testing, but the run
  added roughly 50 ms per frame on the slow software renderer (median frame gap 217 → 267 ms). On a phone the
  frame rate may dip while Evolve runs. It never freezes, and you can press Stop.

  Evolve only changes numbers; it never adds or removes pieces. "Same seed = same results" holds when the run
  finishes. A Stop or the 25 s cap ends it early. It scores with the physics you're using, and says so when
  that isn't Earth's.
* **Disaster Mode** works with Classic ride operations only. Realistic operations keep their own block safety
  system, and the page says so. The derail point is worked out from the ride's simulated lap (the same
  physics), so if you jump the train past it (Lab → "Watch"), that lap won't derail. The crash is simple
  cartoon physics: cars bounce on the ground but don't hit each other, the track or the scenery, and water
  counts as ground.
* **Gravity Lab:** Jupiter is a thought experiment. The builder's ✓ Check uses whatever gravity is on, so a
  coaster can show warnings on Jupiter that it doesn't have on Earth. The Lab's other sliders (friction,
  drag, lift, brakes) still aren't saved, same as before.
* **Daily Challenge** uses the phone's clock, so it changes at *your* midnight, and changing the clock would let
  someone play another day. Scores are only on the device. Clearing Safari's website data deletes the streak,
  like every other save in the game. Adding the game to the Home Screen protects saves better, and the game
  already shows that tip.
* **Test-rig note:** headless Chromium sometimes loses `localStorage` when a `file://` page reloads straight
  after saving. Even the game's own 8.5 builder draft vanished. So the final tests serve the page from a
  `https://` test address. This is a test-environment quirk, not a game bug.

---

## iPhone test checklist (about 15 minutes)

Open `coaster_lab_v8_6.html` the way you normally do (ideally from the Home Screen icon).

**Before you start**
- [ ] The game loads, and the badge next to the logo says **8.6**.
- [ ] Ride Looping Adventure for one lap. It should feel exactly like 8.5.

**🪐 Gravity Lab**
- [ ] 🎡 Park & tools → 🧪 Experiments → Gravity Lab. Tap 🌙 **Moon**.
- [ ] The top-left badge says "🌙 Moon gravity" and the HUD G reading has a 🌙.
- [ ] Ride a lap: drops are slow and floaty, and the lap card says "🌙 Moon gravity · G-forces in Earth G".
- [ ] Untick **Realistic planet**. The "Every ride" list shows some rides that run out of speed. Tick it again.
- [ ] Drag the custom slider. The badge shows "🛰 … × Earth gravity".
- [ ] Close the game completely, reopen it, and check the planet is still set. Then tap **🌍 Back to Earth**
  and check the badge disappears.

**💥 Disaster Mode**
- [ ] 🎡 → 🧪 Experiments → Disaster Mode → switch it on. The red 💥 badge appears.
- [ ] Ride **Looping Adventure**: the train flies off at the banked turn, riders parachute down, the camera
  follows, and the 📋 Incident Report opens.
- [ ] Tap **↻ Reset & ride again**: the train is back on the track and the riders are back in their seats.
- [ ] Ride **Titan** with Disaster Mode on: it should complete normally.
- [ ] Set 🌙 Moon, untick Realistic planet, and ride **Sky Serpent**: it stalls and rolls back. Tap
  **🛟 Safety back on**, then 🌍 Back to Earth.
- [ ] Check the frame rate stays smooth during the crash. Tell me if it stutters.

**🧬 Evolve**
- [ ] 🏗 Build (start screen) → ＋ Add → 🧬 Evolve. Pick 🎢 Max thrill, Normal, then 🧬 Evolve my coaster.
- [ ] The bottom bar shows a progress bar. **You can still rotate the view while it runs.** Note how smooth it feels.
- [ ] When it's done, 3 results appear. Tap 👁 Preview on #1: the old track shows dashed. Tap ✓ Place it.
- [ ] Tap ↶ Undo: your original coaster comes back.
- [ ] Run again with the **same seed**: the same 3 results come back.

**📅 Daily Challenge**
- [ ] 🎡 → 🧪 Experiments → Daily Challenge. Note today's theme and rules. Tap 🏗 Build it now.
- [ ] Tap 📤 **Submit my coaster**. A result appears with 🟩/🟥 squares.
- [ ] Tap 📤 **Share**: the iPhone share sheet opens with the emoji text (try sending it to yourself).
- [ ] Close and reopen the game. 🎡 → Daily Challenge still shows today's result and your streak.
- [ ] If you have a second device, check that it shows the same challenge today.

**Anything odd?** Send me a screenshot and what you tapped.

---

## Next step idea: an online leaderboard with Supabase (not built yet)

Phase 1 is fully offline, on purpose. Here's how a Phase 2 leaderboard could work:

1. **Table** `daily_scores`: `day` (date), `player_id` (uuid), `nickname` (short text), `score` (int),
   `rules` (json), `design` (json, the coaster itself), `created_at`. Keep one row per player per day
   (`unique(day, player_id)`) and update it when they beat their best.
2. **Players without accounts:** Supabase **anonymous sign-in** gives each phone a private player id. Nicknames
   only, no emails. That matters for a family game, because children's privacy rules apply.
3. **Row Level Security:** anyone can *read* the leaderboard, but nobody can write rows directly from the game.
4. **The honest part: scores would be self-reported** unless a server checks them. The game is a public HTML
   file with a public key, so anyone could send "1000 points" with a simple script. The fix is to make the game
   send the **coaster design** (not the score) to a Supabase **Edge Function**. That function re-runs the same
   track generator, safety check and Earth-physics lap simulation on the server, works out the score itself,
   and only then writes the row.

   This means moving the track engine into a shared module the server can run too. It only needs three.js's
   maths (vectors and curves), no graphics. It's a real chunk of work, but it's the only way the leaderboard
   can be trusted.
5. **Extras:** rate limiting (for example 20 submissions per player per day), a nickname word filter,
   and keeping finished entries queued while the phone is offline.
6. **Same challenge for everyone:** the server should generate the challenge from the date too, using the same
   `challenge86()` code, and decide which day it is in one fixed time zone. Otherwise people in different time
   zones (or with a changed phone clock) could submit to the wrong day.
