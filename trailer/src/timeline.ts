// Frame-level timeline (30 fps). SHOTS is the single source of truth: captions, flashes and
// the SFX table are all derived from it (DESIGN-SPEC.md §3).
export const FPS = 30;

type Shot = { from: number; dur: number };
const seq = <K extends string>(order: [K, number][]): Record<K, Shot> => {
  let t = 0;
  const out = {} as Record<K, Shot>;
  for (const [k, d] of order) { out[k] = { from: t, dur: d }; t += d; }
  return out;
};

// Durations are chosen so the music lines up (see BGM below): the track's full groove drops on the crash
// seam, and the report slam (report+15), the Evolve merge (evolve+86) and the outro wordmark stamp
// (outro+42) each land within 1 frame of a kick.
export const SHOTS = seq([
  ['bumper', 33],    // 3 × 9f hook cuts + 6f silent black
  ['wordmark', 130], // letter-drop wordmark, hold ≥ 30f
  ['pov', 100],      // POV: lift crest → first drop → upside down through the loop
  ['loop', 124],     // freeze-annotate: train upside down at the top of the loop
  ['park', 96],      // Cinema flyby
  ['newin', 71],     // title card "New in 8.6"
  ['gravity', 110],  // Earth → Moon segmented switch
  ['moon', 120],     // split screen: the same drop on Earth and on the Moon
  ['crash', 124],    // Disaster Mode derail (music drop lands on its first frame)
  ['report', 122],   // Incident Report slam
  ['evolve', 138],   // Evolve cloner
  ['daily', 86],     // Daily Challenge
  ['outro', 160],    // group photo + wordmark + hold + 15f fade
]);

export const TOTAL = Object.values(SHOTS).reduce((a, s) => Math.max(a, s.from + s.dur), 0);

// ---- music: "Cat Walk" (Mixkit), kick grid measured with audio/beats.py: 129.962 BPM, groove drops at 89.105 s ----
export const BEAT_S = 0.46167;
export const DROP_S = 89.105;
export const BEAT_F = BEAT_S * FPS;                                   // 13.85 frames per beat
export const MUSIC_FROM = SHOTS.wordmark.from;                         // music starts with the wordmark
export const BGM_IN_S = DROP_S - (SHOTS.crash.from - MUSIC_FROM) / FPS; // trim so the drop hits the crash seam
export const beatF = (n: number) => SHOTS.crash.from + n * BEAT_F;     // output frame of beat n (0 = the drop)

// One white flash-cut only (R4: ≤ 3 full-frame hits — this flash, the slam shake, the freeze shutter)
export const FLASH_CUTS = [SHOTS.crash.from].map((seam) => ({ from: seam - 5, dur: 10 }));

// bottom captions (absolute frames)
export const CAPTIONS = [
  { from: SHOTS.pov.from + 20, dur: 76, icon: '🎢', text: 'Ride 12 wild coasters' },
  { from: SHOTS.park.from + 8, dur: 84, icon: '🎡', text: 'Build and run your own park' },
  
  { from: SHOTS.crash.from + 34, dur: 84, icon: '🪂', text: 'Off the rails. Riders parachute to safety.' },
];
