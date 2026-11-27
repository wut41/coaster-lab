# Changelog

Every Coaster Lab version in one place, newest first. Format based on [Keep a Changelog](https://keepachangelog.com/);
versions follow `MAJOR.MINOR.PATCH` (see [`docs/RELEASES.md`](docs/RELEASES.md)).

**Where the details live.** Versions up to 10.1 were built in this repository and have full notes in
[`docs/changes/`](docs/changes/) and [`docs/reports/`](docs/reports/). Versions 10.2 to 10.10.0 were built outside
the repository; their entries below were reconstructed on 2026-11-27 from the version-tagged notes inside each build
file (`builds/`) and from the 10.9 developer report. They are accurate summaries, not complete lists. Items marked
*unreleased* exist only on a branch and are not in any shipped build.

---

## [Unreleased]

### Repository
- Imported the finished builds 10.2 → 10.10.0, the 4.1 / Owner's Edition / VELOCITY prototypes and the 10.9 developer report into `builds/` and `docs/reports/` (2026-11-27).
- Reorganized the repository: `main` and `develop` branches, centralized changelog, contributor guide, branch
  inventory, CI syntax checks, secret scanning and regression workflow (2026-11-27). No game code changed.

### Work preserved on branches, not in any build yet
- **Ride challenges** (10.0 line): 12 bronze/silver/gold feats checked every lap, with XP, coins, badges, titles and
  a Champion skin. Branches `claude/ride-challenges-10` and `claude/ride-challenges-10b`. *Unreleased.*
- **8.7 VIP pack** ($2 one-time): 3 golden coasters and VIP colours, plus Supabase `vip-status` / `vip-webhook`
  functions, and a Remotion trailer project for 8.6. Branch `claude/upbeat-meitner-pw7oe6`. Built on 8.6, never
  merged into 9.x/10.x. *Unreleased.*
- **Review squad**: five permanent review agents (developer, debugger, designer, security, tester) and their reports on
  8.6. Branch `claude/great-fermat-rrwnat`. Several of its findings were applied in 10.6 ("squad fixes"); the agents
  and reports themselves were never merged.

## [10.10.0] — merged build
- **Riders**: two rider styles; the sculpted 10.5 riders (hair, faces, beards, glasses) are the default, Codex's lofted
  riders remain available. Both keep the arm animation; riders sit lower to fit the new bucket seats.
- **Landscape**: Codex landscape pieces are tagged so Holiday Mode snow coats them correctly.
- Two files carry this version. The later one (`coaster_lab_v10_10_0_2`) adds one fix: arm pivots are no longer
  treated as riders, so holiday hats are not placed on arms. **Pending confirmation of which file is canonical.**

## [10.9.2]
- **Cloud saves & accounts**: a park fetched for one account can never land in another account's profile; parks are
  put away before sign-out completes (if that fails, the player stays signed in); sync no longer stays stuck "running";
  uploads that finish after a sign-out or account switch are discarded safely.
- **Park ids**: repaired ids use the lowest free numbers when no room is left above the highest id.

## [10.9.1]
- **Save integrity**: every object id is checked on load; the first object keeps a duplicated id, repeats get new ones.
- **Cloud**: a revision counter (`RVNEXT10`) is written in the same write as the park; the replaced park is backed up
  first; starting again from nothing replaces the account copy in one checked step; answers lost after a successful
  cloud save are remembered and reconciled; guest and account parks are kept apart on one device.

## [10.9] — release-candidate fixes (from the 10.9 developer report)
- **Simulation timing**: park time follows real time × speed; slow frames (up to 1 s) are caught up over the next frames.
- **Holiday Mode**: visuals and the Winter Festival share one calendar entry (1 Dec – 6 Jan); auto mode re-checks the
  date every 30 s, on tab return and at local midnight; snow coating is spread across frames to avoid shader-compile
  hitches; scene scans adapt to load; holiday effects step down when frames drop below ~28 fps.
- **Train looks**: one documented precedence for who decides a train's skin (Train Studio preview first).
- Full plan and bug register: [`docs/reports/REPORT-10.9-developer.md`](docs/reports/REPORT-10.9-developer.md).

## [10.8]
- **Holiday Mode**: a winter wonderland for the rides and My Park — falling snow, snow-coated ground and scenery,
  twinkling lights, festive trees, presents, snowmen, candy-cane rails, Holiday Express, Santa hats, seasonal audio.
- **POV recorder** (10/15/30-second clips, portrait/landscape).

## [10.7]
- **My Park**: speech bubbles that say what visitors want, staff visible at work, security guards, staff cards.
- Two files carry this version; the later one (`coaster_lab_v10_7_2`) adds the review squad's import fixes (safer
  old-design conversion, sanitized imports, validated user pixel ratio).

## [10.6]
- **Squad fixes**: designer-review P1-1, P1-2 and P1-4 from the review squad (branch `claude/great-fermat-rrwnat`).

## [10.5]
- **People**: sculpted riders — heads shaped from a sphere (jaw, chin, cheekbones, eye sockets, brow ridge), hair, faces.

## [10.4]
- **Atmosphere**: directionally shaded cloud decks baked for the game.

## [10.3]
- **Graphics**: ambient occlusion (soft shading where objects meet) from a half-size depth pass.
- A second 10.3 file (`coaster-lab.html`) adds lake-scene pine trees with drooping, uneven branch tiers.

## [10.2]
- **My Park, building round two**: Undo button, Weekly Park Awards on the day card, trophy cabinet, Trophy Room and
  trophy pop-ups; move anything you built (✥ Move, or G to grab).
- **Track Builder → Looks**: ride types; water-coaster boats with a short hull, gunwales, bench and pointed bow.

## [10.1] — 2026-11-16 — engineering, security and feature upgrade
- Security hardening, save reliability, Diagnostics Center (owner), database hardening migration.
- Track Builder 6: live numbers, status chip, history, suggestions, "test from here", ten more layouts.
- My Park: Reports, Park Advisor, recent events; visitor-loop crash fix.
- Merged branches: park-build-2, trailer, daily-streak, sharper graphics. 22 test suites, 875 checks passed.
- Details: [`docs/changes/CHANGES-10.1.md`](docs/changes/CHANGES-10.1.md), [`docs/reports/REPORT-10.1.md`](docs/reports/REPORT-10.1.md).

## [10.0.1]
- Sharper graphics: crisp by default; only steep drops and launches shake or blur.

## [10.0] — 2026-11-13 — "Coaster Lab 3.0"
- **My Park**: build and run a park (paths, coasters, flat rides, shops, staff, days, money ledger, goals, levels).
- Living visitors; ten new coasters, two rebuilt flagships, eight new train types; park sharing; accounts and cloud saves.
- Sound upgrade (rider screams, My Park soundscape), graphics extras (glow, sun, shinier metal, speed effects),
  neon logo and sky art, first-visit trailer, daily streak and rewards.
- Details: [`docs/changes/CHANGES-10.0.md`](docs/changes/CHANGES-10.0.md), [`CHANGES-SOUND.md`](docs/changes/CHANGES-SOUND.md),
  [`CHANGES-STREAK.md`](docs/changes/CHANGES-STREAK.md), [`docs/reports/REPORT-10.0.md`](docs/reports/REPORT-10.0.md).

## [9.0.1]
- Fixed Replay: the replay bar's controls were never built, so the HUD task failed every frame.

## [9.0] — 2026-11-11
- Track Builder 5.0 (three builder levels, grouped diagnostics, repair + undo, starter blueprints).
- Sketch-to-Coaster closed circuits; ride fares and guest speech bubbles in the park.
- Details: [`docs/changes/CHANGES-9.0.md`](docs/changes/CHANGES-9.0.md).

## [8.6] — 2026-11-09
- 🪐 Gravity Lab (Moon, Mars, Earth, Jupiter), 💥 Disaster Mode, 🧬 Evolve in the Track Builder, 📅 Daily Challenge.
- Details: [`docs/changes/CHANGES-8.6.md`](docs/changes/CHANGES-8.6.md), plan: [`docs/plans/PLAN-8.6.md`](docs/plans/PLAN-8.6.md).

## [8.5] — untouched baseline
- The version every later build is compared against.

## Before 8.5 — builds in `builds/legacy/`
Reconstructed from the version markers inside each file. Versions without a file are noted.

- **[8.4] "Living Worlds"** — 8.0 Living Worlds; 8.1 recovery screen, start-up watchdog, untouched backup of
  older saves, failed-save warnings, fault containment; 8.2 Park HQ (one screen for running the park); 8.3
  extreme Track Builder and moderator panel. *(No separate files for 8.0–8.3.)*
- **[7.2]** — ships inside the 2026-11-07 website build (`builds/website-2026-11-07/simulator.html`).
- **[7.1] Fun update** — coins, hands-up thrill score, ride photos, secrets and four secret rides.
- **[7.0]** — Owner Control Center, Builder 3.0, graphics quality levels, particles, weather, themes, tunnels,
  train styles, new rides.
- **[6.3]** — rounded fibreglass cars with accent stripes, bucket seats and lap bars.
- **[6.2]** — seated riders with legs, hair, eyes and two-part arms; Track Builder templates; three new park rides.
- **[6.1] Track Builder 2.0** — redesigned dark construction workspace (engine, workspace, panels).
- **[6.0] Research Lab** — overview stats, charts, auto-detected elements, ride comparison, physics experiments
  (Moon/Mars/Jupiter gravity), Learn tab; live telemetry panel; track heatmaps; day/sunset/night; seat choice;
  CSV/JSON export; brake fins and night rail lights.
- **[5.2] release candidate** — first Track Builder: points, hills, drops, turns, undo/redo, validation, saved
  designs, import/export.
- **[5.1] release candidate** — 5.0 art direction (glass panels, per-ride accent colours), Cinema mode, optional
  synthesized sound, shaped terrain, station signs.
- **[4.1]** — four rides: Looping Adventure, Canyon Rush, Sky Serpent, Mine Mountain; ride menu with stats.
  **Owner's Edition** is a 4.x side branch with an owner panel, telemetry, weather and a JSON track workshop.
- **[4.0]** — first four-ride version with the ride menu; physics stepped once per frame.
- **[2] "version 2"** — one track (Looping Adventure), five cameras including the ride camera, physics-based speed, lights. Two files: an early one and the final one.
- **[prototype 01]** — the first file on record: one looping track, four cameras, speed estimated from height.
- **VELOCITY 1.1** — a separate 2D-canvas prototype, not part of the main line.
