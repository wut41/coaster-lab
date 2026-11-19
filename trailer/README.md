# Coaster Lab 8.6 trailer

A ~48 s, 1920×1080, 30 fps trailer for `coaster_lab_v8_6.html`, made with Remotion and the
[video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) skill. Design decisions,
shot list and storyboard are in [`DESIGN-SPEC.md`](DESIGN-SPEC.md).

All gameplay is **real footage of the game**, not mock-ups: `capture/` drives the HTML file in headless
Chromium with Playwright's fake clock (paused) and a manual `requestAnimationFrame` queue, so every
video frame is exactly 1/30 s of game time and one WebGL draw. `Math.random` is seeded, so captures are
reproducible. The four feature panels are real 2x screenshots of the game's own UI.

## Rebuild

```bash
cd trailer
npm install
(cd capture && npm install)            # three.js 0.160 for the offline game page

# 1. footage + UI panels (~25 min on a CPU-only machine; writes public/footage and public/ui)
capture/run_all.sh

# 2. sound effects (synthesized with ffmpeg) and music
audio/make-sfx.sh
mkdir -p public/audio/bgm && cp <video-shotcraft>/assets/audio/bgm/cat-walk.mp3 public/audio/bgm/

# 3. render both versions
npx remotion render src/index.ts Trailer out/coaster-lab-trailer.mp4 --timeout=120000
npx remotion render src/index.ts Trailer out/coaster-lab-trailer-nobgm.mp4 --props=props-nobgm.json --timeout=120000
```

Preview and tweak: `npx remotion studio src/index.ts`. Frame-level timing lives in `src/timeline.ts`
(`SHOTS` is the single source of truth); the SFX table is in `src/Main.tsx`.

## Sound and licences

- **Sound effects** are original, synthesized from noise and sine waves by `audio/make-sfx.sh`
  (the skill's usual source, Freesound, refused connections from the build machine).
- **Music**: "Cat Walk" by Arulo, Mixkit Stock Music Free Licence (free to use in videos, no credit
  required; the file itself is not redistributed in this repo).
- **Fonts**: Exo 2 and Nunito Sans (SIL Open Font Licence), the same fonts the game uses.
- **Rendering**: Remotion is free for individuals and small teams; companies may need a
  [company licence](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
