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

export const SHOTS = seq([
  ['bumper', 33],    // 3 × 9f hook cuts + 6f black
  ['wordmark', 130], // letter-drop wordmark, hold ≥ 30f
  ['pov', 100],      // POV: lift crest → first drop → upside down through the loop
  ['loop', 123],     // chase camera, freeze-annotate upside down at the top of the loop
  ['park', 96],      // Cinema flyby
  ['newin', 56],     // title card "New in 8.6"
  ['gravity', 110],  // Earth → Moon segmented switch
  ['moon', 120],     // Moon ride
  ['crash', 120],    // Disaster Mode derail
  ['report', 120],   // Incident Report slam
  ['evolve', 138],   // Evolve cloner
  ['daily', 84],     // Daily Challenge
  ['outro', 150],    // group photo + wordmark + hold
]);

export const TOTAL = Object.values(SHOTS).reduce((a, s) => Math.max(a, s.from + s.dur), 0);

// white flash-cuts that straddle a seam (from = seam − 5, 10f long)
export const FLASH_CUTS = [SHOTS.pov.from, SHOTS.newin.from, SHOTS.crash.from, SHOTS.outro.from].map((seam) => ({ from: seam - 5, dur: 10 }));

// bottom captions (absolute frames)
export const CAPTIONS = [
  { from: SHOTS.pov.from + 26, dur: 70, icon: '🎢', text: 'Ride 12 wild coasters' },
  { from: SHOTS.park.from + 8, dur: 84, icon: '🎡', text: 'Build and run your own park' },
  { from: SHOTS.moon.from + 14, dur: 100, icon: '🌙', text: 'Floaty airtime on the Moon' },
  { from: SHOTS.crash.from + 20, dur: 96, icon: '💥', text: 'Disaster Mode: when physics bites back' },
];
