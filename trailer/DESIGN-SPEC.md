# Coaster Lab 8.6 trailer: design spec

Made with the video-shotcraft skill in **autonomous mode** (the user approved the mode; the
agent decides direction, shots and edit without stage-by-stage sign-off).

## 0. Product brief

| | |
|---|---|
| Product | Coaster Lab 8.6: a 3D roller coaster simulator in one HTML file (three.js), plays in the browser, tested on iPhone |
| Audience | Players and friends the owner shares the game with (social posts, a link in a chat) |
| Job of the film | Make people want to open the link: show that it is a real 3D ride, then the four new 8.6 features |
| Must show | Riding a coaster (POV, the loop), the park, 🪐 Gravity Lab, 💥 Disaster Mode, 🧬 Evolve, 📅 Daily Challenge |
| Format | 1920×1080, 30 fps, 47 s, English, two renders: with music and without music (SFX only) |
| Data | Everything on screen is the game's own fictional content (ride names, cartoon riders). No personal data. Saves come from a fresh test profile |

### Requirement → execution decisions

| Requirement | Decision |
|---|---|
| Real 3D gameplay, not mock-ups (Q1) | Capture the real game with Playwright: fake clock + one WebGL draw per video frame, seeded `Math.random`, so every clip is reproducible frame by frame. UI shots are real 2x screenshots of the game's panels |
| No GPU in the build machine | Software WebGL (SwiftShader) at 1.5 s per 1080p frame; record only the frames the edit needs, fast-forward physics between them |
| It's a game, energy is high | "Bold & energetic" motion preset (below), trailer grammar: cold-open bumper, slams, a freeze-frame |
| Sound | Freesound blocks this cloud machine (HTTP 403 from the site), so SFX are synthesized locally (ffmpeg, noise-based foley; original, no licence needed; hashes and levels in `public/audio/sfx/audio-manifest.json`). BGM: Mixkit "Cat Walk" (house, 129.96 BPM measured by `audio/beats.py`), trimmed so its full groove drops on the crash seam; the report slam, Evolve merge and outro stamp sit within 0.5 f of a kick |
| CTA | No public URL in the repo, so the end card says "Free · plays in your browser · works on iPhone" |

## 1. Visual direction

Direction chosen: **"Sky & Glass"**, the game's own look. Bright low-poly daytime footage,
dark navy glass panels for every overlay, the bold italic EXO 2 wordmark. Rejected: a dark
"neon night" skin (fights the bright sky footage) and Ink Press paper (built for SaaS dashboards).
Styleframe skipped on purpose: the brand system is fully defined by the game's CSS, and the
footage itself is the frame.

**Tokens (from `coaster_lab_v8_6.html`)**

| Token | Value |
|---|---|
| Display font | `Exo 2` 900 italic, uppercase (`.stLogo h1`) |
| UI font | `Nunito Sans` 600–800 |
| Accent | `#36a7ff` (`--acc`), wordmark gradient `#36a7ff → #c48bff` |
| Logo tile | gradient `140deg, #36a7ff → #7b5cff`, radius 22/74, white coaster-swoosh SVG |
| Glass | `rgba(9,20,39,.78)` / `rgba(10,16,30,.84)`, hairline `rgba(255,255,255,.12)` |
| Ink | `#f4f8ff`, secondary `#a9bbd6` |
| Status | gold `#ffc233`, danger `#ff6b6b`, ok `#4ade80` |
| Night base | `#050a16` |

**Motion tokens**: preset "bold & energetic (games)": main move ~18f, entrance
`bezier(0.16,1,0.3,1)`, overshoot 1.12, squash 0.25. Landings that should bounce use y1 > 1.

## 2. Feature → shot mapping

| Feature | Card · style | Why |
|---|---|---|
| Cold open | `trailer-grammar-moves · trailer-bumper` | It is a trailer: 3 × 9f hook cuts of the best footage, 6f black |
| Wordmark | `type-entrance-moves · letter-drop-physics` | Letters fall under gravity and bounce: the game's physics as typography |
| Ride (POV drop) | real footage, `shot-transitions · flash-cut` into it | The core promise; footage carries the shot |
| The loop | `speed-ramp-freeze · freeze-annotate` | Freeze the train upside-down at the top of the loop, marker circle + note |
| Park | real Cinema-camera footage + `blur-slide` caption | Breadth: 12 coasters, 10 worlds, a living park |
| 🪐 Gravity Lab | `segmented-thumb-hero` (Earth → Moon), then an Earth-vs-Moon split screen | The switch is the card's sweet spot; the split screen (two captures from the same start frame, live mph from the game) makes "low gravity" visible |
| 💥 Disaster Mode | chase-camera derail (0.6×), then `slam-entrance-moves · score-slam` with the real Incident Report | The derail itself on camera; the report slams down like a final score |
| 🧬 Evolve | `cloner-depth-echo` on the real Evolve panel | One track → many generations → the best one |
| 📅 Daily Challenge | real panel, `blur-slide` title | Short, calm beat before the finale |
| Outro | `outro-group-photo-launch` | Every feature sends one element to the group photo around the wordmark |

Title cards between beats use `blur-slide` (the default calm reveal).

## 3. Storyboard (30 fps)

| # | Frames | Shot | Key motion |
|---|---|---|---|
| 1 | 0–33 | Cold open | POV drop / derail sparks / wide park, 9f each, 1→1.04 push; 6f silent black |
| 2 | 33–163 | Wordmark | COASTER LAB letters drop and bounce, snap upright, logo tile, "Build it. Ride it. Break it."; hold ≥ 1 s; music starts |
| 3 | 163–263 | POV ride | Crest → first drop → upside down through the loop; caption "Ride 12 wild coasters" |
| 4 | 263–387 | Freeze on the loop | Chase camera, frozen upside down: shutter tick, brackets, PAUSED, marker circle, "Upside down"; thaw |
| 5 | 387–483 | Park flyby | Cinema camera; caption "Build and run your own park" |
| 6 | 483–554 | Title card | "New in 8.6" + four feature chips |
| 7 | 554–664 | Gravity switch | 🌍 Earth → 🌙 Moon segmented control, 9.81 → 1.62 m/s² |
| 8 | 664–784 | Earth vs Moon | Split screen, same hill, live mph; "Same hill. A sixth of the gravity." |
| 9 | 784–908 | Crash | Music drop + flash; chase camera through the derail, confetti, parachutes; "Off the rails…" |
| 10 | 908–1030 | Incident Report slam | Real report panel slams in on a kick |
| 11 | 1030–1168 | Evolve | Evolve panel clones into 5 generations and merges on a kick: "×6 generations", "Breed better rides." |
| 12 | 1168–1254 | Daily Challenge | Real panel push-in, "One challenge. Every day." |
| 13 | 1254–1414 | Outro | Group photo + wordmark (stamp on a kick), "Free · Plays in your browser · Works on iPhone", hold, 15f fade |

**Deliberate deviations (recorded per the aesthetic rules):** the freeze-annotate shot opens already frozen
(the chase camera flies through supports until the top of the loop; the preceding POV shot provides the
"flow"); full-frame hits are limited to the crash flash-cut, the report slam shake and a light freeze shutter.

Frame-level timeline lives in `src/timeline.ts` (`SHOTS` is the single source of truth;
captions, SFX and transitions are derived from it).
