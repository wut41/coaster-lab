# Coaster Lab 10.0 — 🎯 Ride challenges

Permanent ride feats with 🥉 Bronze, 🥈 Silver and 🥇 Gold medals. Every finished test-ride lap is checked
automatically, so players just ride (or build) and the medals come to them.

## The 12 challenges

| | Challenge | 🥉 / 🥈 / 🥇 | Notes |
|---|---|---|---|
| ⚡ | Speed Demon | 50 / 65 / 80 mph | Gold: Thunder Comet (84 mph) |
| 🚀 | Warp Speed | 90 / 100 / 110 mph | **Any planet**: the one challenge meant for the 🧪 Gravity Lab. Gold: Titan on Jupiter (113 mph) |
| 🌀 | Loop Survivor | 3 / 5 / 7 inversions in one lap | Gold: Hydra |
| 🪂 | Airtime Addict | 1 / 3 / 5 s of airtime | Gold: Timberwolf, Hydra |
| 💥 | G-Force Hero | 4.5 / 6 / 8 G | Gold: Looping Adventure |
| 🧲 | Ejector Seat | −0.5 / −1 / −1.5 G | Gold: Skyfall |
| 📏 | Marathon Track | 1,000 / 2,000 / 3,000 ft | Gold: Nebula, Nova Giant |
| 🏔 | Sky Scraper | 100 / 150 / 200 ft tall | Gold: Titan |
| ⏱ | Endurance Run | 45 / 70 / 100 s lap | Gold: Nova Giant |
| 💀 | Daredevil | finish / 3 / 5 inversions with 💥 Disaster Mode on | Gold: The Void (makes it round with safety off) |
| 🏗 | Garage Engineer | 40 / 50 / 60 mph on **your own** coaster | Track Builder only |
| 💰 | Budget Builder | your own coaster, 50 mph + 1 inversion, for $20,000 / $15,000 / $11,000 or less | Uses the My Park build price |

Every Gold was checked in the game (section D of `tests/t12_rch.js`). The Track Builder limits (80 m tall, 950 m of
track, a 190 m square) cap Earth speeds at about 97 mph, so "hit 100 mph" lives in 🚀 Warp Speed, where the Gravity Lab
is allowed. All other challenges only count with standard Earth physics.

## Rewards

- Every medal pays into the existing ⭐ wallet: 🥉 +80 XP and 🪙 50, 🥈 +160 XP and 🪙 120, 🥇 +320 XP and 🪙 250.
  One lap can win several medals; a medal is never paid twice.
- Milestones: 🎯 **Challenger** badge (5 medals), 🏆 **Champion** badge + Champion train skin in 🎨 Train Studio
  (5 golds), 👑 **Ride Royalty** badge + title (every gold). A **Challenger** title unlocks at 10 medals.
- The lap card shows the medals just won, or "So close: 4 mph short of 🥇 Speed Demon".
- A new **🎯 Ride challenges** tab in the Goals window and a tile in 🎡 Park & tools show every challenge, the next
  target, the best result and which ride it came from.

Progress is saved in this browser under `coasterlab.v10.rch` and cleaned on load (bad values are dropped).

## Files

- `src/v10/js/45_rch.js` — the whole feature (rules, saving, rewards, screens, test hooks under `__coasterDebug.v80.v10.rch`)
- `src/v10/css/45_rch.css` — styles
- `tests/t12_rch.js` — 52 checks: rewards, rules, saving, real laps (built-in ride, Disaster Mode, Track Builder
  playtest), phone layout, and proof that every Gold is reachable
- `coaster_lab_v10_0.html` — rebuilt with `node build.mjs --check`

## Merging notes

- Only new files, plus the rebuilt `coaster_lab_v10_0.html`. That file is generated: if it conflicts, take the other
  branch's version and run `node build.mjs --check` again.
- `tests/run_all.js` was left alone (other work edits it); run the suite with `cd tests && node t12_rch.js`.
- The module extends 7.2/8.6 code without changing it: `on72('lap')`, `award72`, `GOALTABS72`, `renderOv7`,
  `hubItem72`, `BADGES72`, `TITLES72`, `SKIN72`, `LOCKS72`, `lockText72`, `phMod`, `DZ86`. The budget price repeats
  My Park's build-price formula from `21_ty_rides.js` (`rideProf10`); a test checks the two agree.
