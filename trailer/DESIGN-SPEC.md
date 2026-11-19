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
| Format | 1920×1080, 30 fps, about 45 s, English, two renders: with music and without music (SFX only) |
| Data | Everything on screen is the game's own fictional content (ride names, cartoon riders). No personal data. Saves come from a fresh test profile |

### Requirement → execution decisions

| Requirement | Decision |
|---|---|
| Real 3D gameplay, not mock-ups (Q1) | Capture the real game with Playwright: fake clock + one WebGL draw per video frame, seeded `Math.random`, so every clip is reproducible frame by frame. UI shots are real 2x screenshots of the game's panels |
| No GPU in the build machine | Software WebGL (SwiftShader) at 1.5 s per 1080p frame; record only the frames the edit needs, fast-forward physics between them |
| It's a game, energy is high | "Bold & energetic" motion preset (below), trailer grammar: cold-open bumper, slams, a freeze-frame |
| Sound | Freesound blocks this cloud machine (HTTP 403 from the site), so SFX are synthesized locally (ffmpeg; original, no licence needed). BGM: Mixkit "Cat Walk" (house, ~129 BPM, bundled with the skill, Mixkit free licence) |
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
| 🪐 Gravity Lab | `segmented-thumb-hero` (Earth → Moon), then Moon footage | A two-option switch is exactly what the card is best at |
| 💥 Disaster Mode | crash footage, then `slam-entrance-moves · score-slam` with the real Incident Report | Weight: the report slams down like a final score |
| 🧬 Evolve | `cloner-depth-echo` on the real Evolve panel | One track → many generations → the best one |
| 📅 Daily Challenge | real panel, `blur-slide` title | Short, calm beat before the finale |
| Outro | `outro-group-photo-launch` | Every feature sends one element to the group photo around the wordmark |

Title cards between beats use `blur-slide` (the default calm reveal).

## 3. Storyboard (30 fps)

| # | Time | Shot | Key motion |
|---|---|---|---|
| 1 | 0:00–0:01.1 | Cold open | POV drop / crash / Moon float, 9f each, 1→1.04 push; 6f black |
| 2 | 0:01.1–0:05.1 | Wordmark | COASTER LAB letters drop and bounce, snap upright, logo tile, tagline "Build it. Ride it. Break it."; hold ≥ 1 s |
| 3 | 0:05.1–0:10.5 | POV ride | Crest of the lift hill → first drop; caption "Ride 12 wild coasters" |
| 4 | 0:10.5–0:15.8 | Freeze on the loop | Side camera, freeze at the top: "Upside down. Real physics." |
| 5 | 0:15.8–0:19.0 | Park flyby | Cinema camera; caption "Build your own park" |
| 6 | 0:19.0–0:20.8 | Title card | "New in 8.6" |
| 7 | 0:20.8–0:24.3 | Gravity switch | 🌍 Earth → 🌙 Moon segmented control |
| 8 | 0:24.3–0:28.3 | Moon ride | Chase camera, floaty drop, planet chip "🌙 1.62 m/s²" |
| 9 | 0:28.3–0:32.3 | Crash | Disaster Mode derail, riders fly; caption "💥 Disaster Mode" |
| 10 | 0:32.3–0:36.3 | Incident Report slam | Real report panel slams in |
| 11 | 0:36.3–0:40.5 | Evolve | Evolve panel clones into generations and merges |
| 12 | 0:40.5–0:43.0 | Daily Challenge | Real panel push-in, "A new challenge every day" |
| 13 | 0:43.0–0:48.0 | Outro | Group photo + wordmark, "Free · plays in your browser · works on iPhone", hold 1 s |

Frame-level timeline lives in `src/timeline.ts` (`SHOTS` is the single source of truth;
captions, SFX and transitions are derived from it).
