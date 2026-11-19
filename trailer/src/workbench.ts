// Workbench manifest (video-shotcraft references/workbench.md §2): splits the film into tracks.
// Every table is imported from the same source the render uses (timeline.ts / Main.tsx).
import React from 'react';
import { Caption, FlashCut } from './components';
import { SFX, Trailer } from './Main';
import { BGM_IN_S, CAPTIONS, FLASH_CUTS, SHOTS, TOTAL } from './timeline';
import { Bumper, Wordmark } from './scenes/ColdOpen';
import { LoopFreeze, POV, Park } from './scenes/Ride';
import { GravitySwitch, MoonRide, NewIn } from './scenes/Gravity';
import { Crash, ReportSlam } from './scenes/Disaster';
import { Daily, Evolve } from './scenes/Evolve';
import { Outro } from './scenes/Outro';

// units start at their own frame 0 inside the workbench
const CaptionUnit: React.FC<{ icon: string; text: string; duration: number }> = ({ icon, text, duration }) =>
  React.createElement(Caption, { from: 0, dur: duration, icon, text });
const FlashUnit: React.FC<{ duration: number }> = ({ duration }) => React.createElement(FlashCut, { from: 0, dur: duration });

const LABELS: Record<keyof typeof SHOTS, [string, React.FC]> = {
  bumper: ['S1 Cold open', Bumper], wordmark: ['S2 Wordmark drop', Wordmark], pov: ['S3 POV drop', POV], loop: ['S4 Loop freeze', LoopFreeze],
  park: ['S5 Park flyby', Park], newin: ['S6 New in 8.6', NewIn], gravity: ['S7 Gravity switch', GravitySwitch], moon: ['S8 Moon ride', MoonRide],
  crash: ['S9 Crash', Crash], report: ['S10 Incident Report slam', ReportSlam], evolve: ['S11 Evolve', Evolve], daily: ['S12 Daily Challenge', Daily],
  outro: ['S13 Outro', Outro],
};

export const WORKBENCH = {
  name: 'Coaster Lab 8.6 · trailer',
  fps: 30, width: 1920, height: 1080,
  total: TOTAL,
  background: '#000000',
  shots: (Object.keys(SHOTS) as (keyof typeof SHOTS)[]).map((k) => ({
    id: k, label: LABELS[k][0], from: SHOTS[k].from, duration: SHOTS[k].dur, component: LABELS[k][1],
  })),
  captions: CAPTIONS.map((c, i) => ({
    id: `cap${i + 1}`, label: `Caption ${i + 1}`, from: c.from, duration: c.dur, component: CaptionUnit,
    props: { icon: c.icon, text: c.text }, durationProp: 'duration', cardId: 'caption',
    schema: [{ type: 'text', key: 'icon', label: 'Icon', default: '🎢' }, { type: 'text', key: 'text', label: 'Text', default: '' }],
  })),
  transitions: FLASH_CUTS.map((f, i) => ({ id: `flash${i + 1}`, label: `Flash ${i + 1}`, from: f.from, duration: f.dur, component: FlashUnit, durationProp: 'duration', cardId: 'flash' })),
  overlays: [],
  sfx: SFX.map((s) => ({ from: Math.max(0, s.at - 1), duration: s.dur ?? 90, src: `audio/sfx/${s.src}.wav`, volume: s.volume })),
  bgm: [{ from: SHOTS.wordmark.from, duration: TOTAL - SHOTS.wordmark.from, src: 'audio/bgm/cat-walk.mp3', volume: 0.5, trimBefore: Math.round(BGM_IN_S * 30) }],
  order: ['transitions', 'captions', 'overlays'],
  original: Trailer,
};
