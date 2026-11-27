# Coaster Lab sound upgrade (10.0)

Everything is synthesized in code with the Web Audio API: no sound files, no downloads, nothing to license.

## What was already there (7.x engine, unchanged)
- Wheel rumble and a lift-hill chain click that follow the train's speed, rushing wind that rises with speed,
  launch whine, brake hiss, tunnel echo, station murmur, weather (rain, thunder), crowd, effects
- Generative background music (mood follows the world)
- 🔇/🔊 button, ⚙ Settings → Sound mixer with a slider and a mute switch per channel (saved)

## New in this upgrade (`src/v10/js/35_sound.js`)
- **Rider screams** on steep, fast drops and on launches: a few synthesized voices (sawtooth through "aah"
  formants, pitch swoop, vibrato, breath). Works on the main ride, on every coaster in My Park (quieter and duller
  with distance, panned left/right) and on the one you ride along with.
- **My Park soundscape**: rumble of the coasters near the camera, wind and lift-hill clicks while riding a park
  coaster, a crowd that grows with the number of visitors, music that is bright by day and calm at night.
- **🔊 Sound button in My Park** (the ride HUD with the old button is hidden there).
- **Rider screams** channel in the mixer (volume + mute, saved with the others).
- **Sound on is remembered.** Browsers only allow audio after a tap, so it comes back on the first tap of the
  next visit. Default for new players is still off.
- Light on phones: the My Park layer only exists while My Park is open; screams are capped at 6 voices (3 on Low
  graphics) and at most one new park scream every half second.

## Merging
- New files only: `src/v10/js/35_sound.js`, `tests/t9_sound.js`, this file. No 9.0 patch was added to `build.mjs`.
- `coaster_lab_v10_0.html` is a build output: after merging, run `node build.mjs --check` again instead of
  resolving conflicts in the HTML by hand.
- Storage: `coasterlab.v10.sound` (on/off); the screams volume and mute live in the existing `vol` and `mute` settings.

## Tests
`node tests/t9_sound.js` (sections: `T9=A` ride view, `B` remembered sound, `C` My Park).
