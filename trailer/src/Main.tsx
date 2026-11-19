import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion';
import { CAPTIONS, FLASH_CUTS, SHOTS, TOTAL } from './timeline';
import { Caption, FlashCut } from './components';
import { Bumper, LETTER_LANDS, WORDMARK_SNAP, Wordmark } from './scenes/ColdOpen';
import { FREEZE, LoopFreeze, POV, Park, THAW } from './scenes/Ride';
import { GRAV, GravitySwitch, MoonRide, NewIn } from './scenes/Gravity';
import { Crash, REPORT_IMPACT, ReportSlam } from './scenes/Disaster';
import { Daily, EVOLVE_LAND, EVOLVE_SPREAD, Evolve } from './scenes/Evolve';
import { OUTRO_RULE, OUTRO_STAMP, Outro } from './scenes/Outro';

const SCENES: [keyof typeof SHOTS, React.FC][] = [
  ['bumper', Bumper], ['wordmark', Wordmark], ['pov', POV], ['loop', LoopFreeze], ['park', Park], ['newin', NewIn],
  ['gravity', GravitySwitch], ['moon', MoonRide], ['crash', Crash], ['report', ReportSlam], ['evolve', Evolve], ['daily', Daily], ['outro', Outro],
];

// ---- SFX table: every entry pinned to a shot (SHOTS.x.from + offset), one comment per action ----
// OUT = measured output-track delay of the AAC encode (S5 / sound-design §4.6), subtracted once here.
const OUT = 1;
type Sfx = { at: number; src: string; volume: number; dur?: number };
const S = SHOTS;
export const SFX: Sfx[] = [
  // cold open: one hit per 9f cut, the 6f black is silent
  { at: S.bumper.from + 0, src: 'whoosh', volume: 0.55 },            // cut 1: POV drop
  { at: S.bumper.from + 9, src: 'crash', volume: 0.5, dur: 9 },       // cut 2: derail
  { at: S.bumper.from + 18, src: 'whoosh', volume: 0.45 },           // cut 3: Moon float
  // wordmark: each letter lands with a thud, alternating weight, quieter as they speed up
  ...LETTER_LANDS.map((f, i) => ({ at: S.wordmark.from + f, src: 'thud', volume: Math.max(0.28, 0.6 - i * 0.03) * (i % 2 ? 0.85 : 1) })),
  { at: S.wordmark.from + WORDMARK_SNAP, src: 'pop', volume: 0.6 },   // collective snap upright + logo
  { at: S.wordmark.from + WORDMARK_SNAP + 2, src: 'sparkle', volume: 0.35 },
  // POV ride
  { at: S.pov.from - 5, src: 'whoosh', volume: 0.5 },                 // flash-cut into the ride
  { at: S.pov.from + 0, src: 'chain', volume: 0.4, dur: 8 },          // last clacks of the lift chain at the crest
  { at: S.pov.from + 4, src: 'wind', volume: 0.8 },                   // over the top and down the first drop
  { at: S.pov.from + 56, src: 'whoosh', volume: 0.5 },                // into the loop, upside down
  // loop freeze
  { at: S.loop.from + FREEZE, src: 'shutter', volume: 0.7 },          // freeze: shutter
  { at: S.loop.from + FREEZE + 9, src: 'marker', volume: 0.55 },      // marker circle
  { at: S.loop.from + FREEZE + 19, src: 'marker', volume: 0.4, dur: 8 }, // arrow
  { at: S.loop.from + THAW, src: 'whoosh', volume: 0.55 },            // thaw
  // park
  { at: S.park.from + 2, src: 'whoosh', volume: 0.35 },
  // New in 8.6
  { at: S.newin.from - 5, src: 'whoosh', volume: 0.5 },
  { at: S.newin.from + 12, src: 'sparkle', volume: 0.4 },
  // Gravity switch
  { at: S.gravity.from + 0, src: 'whoosh', volume: 0.35 },           // control floats up
  { at: S.gravity.from + GRAV.CLICK, src: 'click', volume: 0.7 },     // press
  { at: S.gravity.from + GRAV.SLIDE, src: 'slide', volume: 0.6 },     // thumb slides (8f)
  { at: S.gravity.from + GRAV.SLIDE_END, src: 'pop', volume: 0.6 },   // 🌙 springs in
  { at: S.gravity.from + GRAV.SLIDE_END + 2, src: 'sparkle', volume: 0.3 },
  // Moon ride
  { at: S.moon.from + 24, src: 'wind', volume: 0.35 },
  // Disaster Mode
  { at: S.crash.from - 5, src: 'whoosh', volume: 0.5 },
  { at: S.crash.from - 3, src: 'crash', volume: 0.7 },               // cut to the crash site (derail already happened)
  { at: S.report.from + 2, src: 'whoosh', volume: 0.45 },             // report hovers in front of the lens
  { at: S.report.from + REPORT_IMPACT, src: 'impact', volume: 0.75 },  // slam (one of 2 slams in the film)
  // Evolve: a run of light pops as clones spread, one whoosh back, one solid landing
  ...Array.from({ length: 7 }, (_, i) => ({ at: S.evolve.from + Math.round(EVOLVE_SPREAD + i * 2.2), src: i % 2 ? 'click' : 'pop', volume: 0.42 - i * 0.03 })),
  { at: S.evolve.from + EVOLVE_LAND - 10, src: 'whoosh', volume: 0.5 },
  { at: S.evolve.from + EVOLVE_LAND, src: 'thud', volume: 0.8 },
  // Daily
  { at: S.daily.from + 0, src: 'whoosh', volume: 0.4 },
  // Outro: riser → impact on the wordmark stamp → sparkle on the rule
  { at: S.outro.from + OUTRO_STAMP - 54, src: 'riser', volume: 0.55 },
  { at: S.outro.from + OUTRO_STAMP, src: 'impact', volume: 0.65 },
  { at: S.outro.from + OUTRO_RULE, src: 'sparkle', volume: 0.45 },
];

export type TrailerProps = { bgm: boolean };
// the track's first ~25 s is a quiet intro (−24 dB); the trailer drops in where the full groove starts
export const BGM_IN = 28 * 30;

export const Trailer: React.FC<TrailerProps> = ({ bgm }) => {
  const musicIn = S.wordmark.from;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {SCENES.map(([k, Comp]) => (
        <Sequence key={k} from={SHOTS[k].from} durationInFrames={SHOTS[k].dur} name={k}>
          <Comp />
        </Sequence>
      ))}
      {CAPTIONS.map((c, i) => <Caption key={i} {...c} />)}
      {FLASH_CUTS.map((f, i) => <FlashCut key={i} {...f} />)}
      {SFX.map((s, i) => (
        <Sequence key={`sfx${i}`} from={Math.max(0, s.at - OUT)} durationInFrames={s.dur ?? 90} name={`sfx ${s.src}`}>
          <Audio src={staticFile(`audio/sfx/${s.src}.wav`)} volume={s.volume} />
        </Sequence>
      ))}
      {bgm && (
        <Sequence from={musicIn} durationInFrames={TOTAL - musicIn} name="bgm">
          <Audio
            src={staticFile('audio/bgm/cat-walk.mp3')}
            trimBefore={BGM_IN}
            volume={(f) => 0.5 * interpolate(f, [0, 12, TOTAL - musicIn - 40, TOTAL - musicIn - 2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
