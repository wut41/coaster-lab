import React, { useId } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT, alpha, glass } from '../brand';
import { Finish, Footage } from '../components';
import { EASE, mix, ramp } from '../lib/Polish';

// Shot 3 · POV: lift crest → first drop (real footage, 1:1, slow 3% push to keep it alive)
export const POV: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Footage clip="pov" src={(f) => 38 + f} scale={1 + 0.03 * ramp(frame, 0, 100, EASE.smooth)} />
      <Finish />
    </AbsoluteFill>
  );
};

// Shot 4 · speed-ramp-freeze · freeze-annotate (demos/rhythm/speed-ramp-freeze/FreezeAnnotateReal.tsx)
// Output frames remap the footage: flow 1× → freeze (slope 0, instant, no ease-in) → smootherstep thaw
// (average slope > 1 makes up the held time) → 1×. Pause signals: 3f shutter flash, corner brackets,
// LIVE → PAUSED timecode. Marker: one-stroke super-ellipse 10f (1.08 turns, not closed) + feTurbulence,
// arrow shaft 6f + head 3f, 68px+ bold note, underline, byline. Ink fades 104–112, thaw 112–134.
// Adaptation: the chase camera flies through the loop's supports until 3 frames before the top, so the
// flow segment is a 10f step-printed run-up instead of 45f at 1× (the POV shot before it already showed the
// ride at full speed); the freeze itself is still instant (slope 0).
export const FZ = 27;          // source frame (loop clip, chase camera): train upside down at the top
export const FREEZE = 10, THAW = FREEZE + 67, LAND = THAW + 22;
const THAW_SRC = 30;
const srcAt = (f: number) => {
  if (f <= FREEZE) return FZ - Math.round(0.3 * (FREEZE - f)); // step-printed 0.3× run-up (frames 24→27)
  if (f <= THAW) return FZ;
  if (f <= LAND) { const t = (f - THAW) / (LAND - THAW); return FZ + THAW_SRC * t * t * t * (t * (6 * t - 15) + 10); }
  return FZ + THAW_SRC + (f - LAND);
};
// riders' position on screen at the freeze frame (measured on loop/0027.jpg)
export const TRAIN = { x: 580, y: 590, rx: 330, ry: 250 };
const SE = 2 / 3;
const circlePath = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 140; i++) {
    const u = i / 140, a = -2.3 + u * Math.PI * 2 * 1.08, k = 1 - 0.04 * u;
    const c = Math.cos(a), s = Math.sin(a);
    pts.push(`${(TRAIN.x + Math.sign(c) * Math.pow(Math.abs(c), SE) * TRAIN.rx * k).toFixed(1)} ${(TRAIN.y + Math.sign(s) * Math.pow(Math.abs(s), SE) * TRAIN.ry * k).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')}`;
})();
const timecode = (f: number) => {
  const total = 30 * 10 + 12 + Math.floor(srcAt(f));
  const p = (n: number) => String(n).padStart(2, '0');
  return `00:00:${p(Math.floor(total / 30) % 60)}:${p(total % 30)}`;
};
const Bracket: React.FC<{ x: number; y: number; sx: 1 | -1; sy: 1 | -1; s: number }> = ({ x, y, sx, sy, s }) => (
  <div style={{
    position: 'absolute', left: sx === 1 ? x : x - 72, top: sy === 1 ? y : y - 72, width: 72, height: 72,
    borderLeft: sx === 1 ? `6px solid ${C.gold}` : undefined, borderRight: sx === -1 ? `6px solid ${C.gold}` : undefined,
    borderTop: sy === 1 ? `6px solid ${C.gold}` : undefined, borderBottom: sy === -1 ? `6px solid ${C.gold}` : undefined,
    transform: `translate(${(-sx * (1 - s) * 40).toFixed(1)}px, ${(-sy * (1 - s) * 40).toFixed(1)}px)`, opacity: Math.min(1, s * 1.5),
    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.45))',
  }} />
);
const springish = (f: number, start: number) => { const t = Math.max(0, f - start); return 1 - Math.exp(-t / 2.4) * Math.cos(t * 0.55); };

export const LoopFreeze: React.FC = () => {
  const frame = useCurrentFrame();
  const rough = `rough-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const frozen = frame >= FREEZE && frame < THAW;
  const focus = ramp(frame, FREEZE, 10, EASE.snappy) * (1 - ramp(frame, THAW - 8, 12, EASE.swift));
  const flash = frame >= FREEZE ? 1 - ramp(frame, FREEZE, 4, EASE.out) : 0;
  const bracket = (frame >= FREEZE ? Math.min(1.1, springish(frame, FREEZE)) : 0) * (1 - ramp(frame, FREEZE + 59, 8, EASE.exit));
  const draw = ramp(frame, FREEZE + 9, 10, EASE.swift);
  const shaft = ramp(frame, FREEZE + 19, 6, EASE.out);
  const head = ramp(frame, FREEZE + 25, 3, EASE.out);
  const under = ramp(frame, FREEZE + 35, 10, EASE.swift);
  const sign = ramp(frame, FREEZE + 41, 12, EASE.out);
  const fade = 1 - ramp(frame, FREEZE + 59, 8, EASE.out);
  const showInk = frame >= FREEZE + 9 && fade > 0.001;
  const note = ramp(frame, FREEZE + 19, 14, EASE.snappy);
  // arrow: from the note (bottom-right) to the circle's lower-right edge
  const ax0 = 1170, ay0 = 640, ax1 = TRAIN.x + TRAIN.rx * 0.75, ay1 = TRAIN.y + TRAIN.ry * 0.8;
  const qx = ax0 - 40, qy = ay1 + 20;
  const ang = Math.atan2(ay1 - qy, ax1 - qx);
  const wing = (s: number) => `M ${ax1.toFixed(1)} ${ay1.toFixed(1)} L ${(ax1 - Math.cos(ang + s * 0.5) * 38).toFixed(1)} ${(ay1 - Math.sin(ang + s * 0.5) * 38).toFixed(1)}`;
  const lift = 1 + 0.04 * focus;
  return (
    <AbsoluteFill>
      <Footage clip="loop" src={srcAt} scale={lift} origin={`${TRAIN.x}px ${TRAIN.y}px`} blend={frame > THAW} />
      {/* everything but the train recedes while frozen */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse ${TRAIN.rx * 2.6}px ${TRAIN.ry * 2.8}px at ${TRAIN.x}px ${TRAIN.y}px, rgba(5,10,22,0) 45%, rgba(5,10,22,0.42) 100%)`,
        opacity: focus * 0.85, filter: undefined,
      }} />
      <Finish />
      {/* LIVE → PAUSED timecode */}
      <div style={{ position: 'absolute', left: 96, top: 92, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 14,
          background: frozen ? C.gold : 'rgba(9,20,39,0.7)', color: frozen ? '#1a1406' : C.ink,
          font: `800 26px ${FONT.ui}`, letterSpacing: '0.14em',
        }}>
          {frozen
            ? <span style={{ display: 'flex', gap: 5 }}><span style={{ width: 7, height: 22, background: '#1a1406', borderRadius: 1 }} /><span style={{ width: 7, height: 22, background: '#1a1406', borderRadius: 1 }} /></span>
            : <span style={{ width: 14, height: 14, borderRadius: 7, background: C.danger }} />}
          {frozen ? 'PAUSED' : 'LIVE'}
        </div>
        <span style={{ font: `700 32px ui-monospace, Menlo, monospace`, color: frozen ? C.gold : C.ink, textShadow: '0 2px 8px rgba(0,0,0,.5)' }}>{timecode(frame)}</span>
      </div>
      {showInk && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: fade }}>
          <defs>
            <filter id={rough}>
              <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="11" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
            </filter>
            <filter id={`${rough}-sh`}><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.45" /></filter>
          </defs>
          <g filter={`url(#${rough}-sh)`}>
            <g filter={`url(#${rough})`} fill="none" stroke={C.gold} strokeLinecap="round" strokeLinejoin="round">
              <path d={circlePath} strokeWidth={12} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} transform={`rotate(-3 ${TRAIN.x} ${TRAIN.y})`} />
              {shaft > 0 && <path d={`M ${ax0} ${ay0} Q ${qx} ${qy} ${ax1} ${ay1}`} strokeWidth={9} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - shaft} />}
              {head > 0 && <><path d={wing(1)} strokeWidth={9} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - head} /><path d={wing(-1)} strokeWidth={9} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - head} /></>}
            </g>
          </g>
        </svg>
      )}
      {/* the note: on a glass slab so it reads over the bright sky (Q11) */}
      {showInk && frame >= FREEZE + 19 && (
        <div style={{
          position: 'absolute', left: 1170, top: 520, padding: '30px 40px 28px', ...glass(30), opacity: fade * note,
          transform: `translateY(${mix(30, 0, note)}px) rotate(-2deg)`, transformOrigin: '0% 100%',
        }}>
          <div style={{ font: `italic 900 76px ${FONT.display}`, lineHeight: 1, textTransform: 'uppercase', color: C.ink, whiteSpace: 'nowrap' }}>Upside down</div>
          <div style={{ position: 'relative', height: 14, marginTop: 10 }}>
            <div style={{ position: 'absolute', left: 0, top: 4, height: 8, borderRadius: 4, width: `${(under * 100).toFixed(1)}%`, background: C.gold }} />
          </div>
          <div style={{ font: `800 40px ${FONT.ui}`, color: C.ink2, marginTop: 8, opacity: sign, transform: `translateY(${mix(10, 0, sign)}px)` }}>
            Real physics. Real G-forces.
          </div>
        </div>
      )}
      {bracket > 0.001 && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <Bracket x={48} y={48} sx={1} sy={1} s={bracket} />
          <Bracket x={1872} y={48} sx={-1} sy={1} s={bracket} />
          <Bracket x={48} y={1032} sx={1} sy={-1} s={bracket} />
          <Bracket x={1872} y={1032} sx={-1} sy={-1} s={bracket} />
        </AbsoluteFill>
      )}
      {flash > 0.001 && <AbsoluteFill style={{ background: '#fff', opacity: 0.7 * flash }} />}
    </AbsoluteFill>
  );
};

// Shot 5 · park flyby (the game's own Cinema camera)
export const Park: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Footage clip="cine" src={(f) => 12 + f} scale={1.02 + 0.03 * ramp(frame, 0, 96, EASE.smooth)} />
      <AbsoluteFill style={{ background: `linear-gradient(0deg, ${alpha(C.night, 0.35)} 0%, ${alpha(C.night, 0)} 35%)` }} />
      <Finish />
    </AbsoluteFill>
  );
};
