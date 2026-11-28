# Coaster Lab launch Short (YouTube Shorts / TikTok / Reels)

A 15-second, 1080×1920 vertical video that loops with no seam. It is built only from real gameplay recorded off the game
canvas, plus a beat synthesized from scratch (no licensed music). It was cut for the Dec 1 launch, following what
works on the @cerealsquad1 channel: 11–15 s videos, a payoff in the first second, and a loop people rewatch.

| Time | Shot | Caption |
|---|---|---|
| 0.0–3.3 s | Nova Giant dive POV: hangs over the drop, releases on the bass drop | I made my own roller coaster game 🎢 |
| 3.3–5.6 s | Looping Adventure, side cam | build ANY ride you want 🛠️ |
| 5.6–8.4 s | Disaster Mode derail, then the riders' parachutes | or CRASH them 💀 (they're fine 🪂) |
| 8.4–10.5 s | Aurora Wing → Sky Manta → Cheddar Chase | 12 insane rides 🔥 |
| 10.5–12.7 s | Holiday Mode on Little Dipper | and it SNOWS for launch ❄️🎅 |
| 12.7–15.0 s | Neon logo end card | DROPS DEC 1 |

## Make it

```bash
cd tests && npm ci && cd ..                     # three.js for the headless browser (same as the tests)
W=$PWD/work; mkdir -p $W

# 1. footage: 720×1280 JPEG frames on a virtual clock (software rendering, about 5–7 s per frame; run two in parallel)
OUT=$W/frames node tools/trailer/short/capture_short.js hyper crash loop
OUT=$W/frames node tools/trailer/short/capture_short.js wing manta spin snow2

# 2. music: 128 BPM, 8 bars = 15.0 s; the second argument is the crash impact time in seconds
python3 tools/trailer/short/music.py $W/music.wav 5.895

# 3. edit: preview a few frames, then render
python3 tools/trailer/short/compose.py $W tools/trailer/short/cfg.json $W/pv --preview 0,30,178,236,400
python3 tools/trailer/short/compose.py $W tools/trailer/short/cfg.json $W/coaster_lab_short.mp4

# contact sheet of a shot, to choose frames: sheet.py <dir> <out.jpg> [step] [first]
python3 tools/trailer/short/sheet.py $W/frames/crash crash.jpg 2
```

All text, timings and frame choices are in `cfg.json`. Each segment runs from beat `b0` to beat `b1` (1 beat = 0.46875 s).
`map` gives keyframes `[seconds into the segment, source frame]` for time remapping (in-between frames are blended).
`sub` lists quick cuts inside a segment. `hits` adds screen shake and `flashes` adds white flashes, both in seconds.

## Things learned while capturing (game 10.10.1)

- **Camera switches blend over 1.3–2.8 s**, and `v72.ff()` does not advance the blend. `capture_short.js` switches the
  camera on a 90×160 viewport, where real frames are fast, then checks `cine().xf === 1` before it records.
- **Don't shrink the viewport for the crash shot.** With fast real frames the ride plays out live during the setup
  wait, and the derail happens before recording starts. Chase is already the default camera, so no switch is needed.
- **Thunder Comet looks bad in Holiday Mode from the chase cam** (dark cloud puffs fill the sky). Little Dipper shows
  the candy-cane rails, snow and Holiday Express up close.
- Nova Giant is a dive coaster. "Tip" detection fires after the holding brake lets go, so the hang is at the start of the shot.
