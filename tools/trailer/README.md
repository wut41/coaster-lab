# Coaster Lab trailer

The 42-second trailer that plays the first time someone opens Coaster Lab (and from **🎬 Watch the trailer** on the title screen).

- **Game code:** `src/v10/post/10_trailer.js` and `src/v10/css/50_trailer.css`. The video is not inlined: it streams from the Higgsfield CDN only when it is shown. It has a Skip button (and Escape), starts muted with a "Tap for sound" button when the browser blocks sound, remembers it was seen (`coasterlab.v10.trailerSeen`), and gets out of the way if the video can't load. `?notrailer` and "reduce motion" skip it.
- **Footage:** `capture.js` records real gameplay frame by frame on a virtual clock, so every frame is smooth even on a slow machine: `node tools/trailer/capture.js [shot ...]` (env `W`, `H`, `FPS`, `OUT`). Shots: loop, hyper, wing, manta, spin, lift, crash (a real Disaster Mode derail).
- **Everything else** (narrator lines, the Kevin and hot dog shots, the epic sunset shot) was made with Higgsfield, and the music and sound effects were synthesized from scratch, then cut together with ffmpeg.
- **Tests:** `tests/t17_trailer.js` (uses `tests/fixtures/trailer_test.webm` in place of the real video).
