// Shot 1 · trailer-grammar-moves · trailer-bumper (demos/rhythm/trailer-grammar-moves/TrailerBumper.tsx)
//   three equal 9f hard cuts (0/9/18), each with a linear 1→1.04 push (the "命门": stills read as slides),
//   then 27–33f pure black, nothing in it.
// Shot 2 · type-entrance-moves · letter-drop-physics (demos/typography/type-entrance-moves/LetterDropPhysics.tsx)
//   letters fall under gravity (y = −D + D·(t/24)²), bounce 30% / 9%, land tilted ±6°, collective snap upright.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, FONT, LogoMark, alpha } from '../brand';
import { Finish, Footage } from '../components';
import { EASE, SpeedBlur, mix, ramp } from '../lib/Polish';

// ---------- bumper ----------
const CUTS: { clip: string; at: number }[] = [
  { clip: 'pov', at: 50 },   // straight down the first drop
  { clip: 'crash', at: 66 }, // derail: riders parachuting down
  { clip: 'moon', at: 60 },  // creeping over the crest on the Moon
];
const push = (f: number, start: number) => interpolate(f, [start, start + 9], [1, 1.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const Bumper: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= 27) return <AbsoluteFill style={{ background: '#000' }} />; // silence beat: pure black, empty
  const k = Math.floor(frame / 9);
  const c = CUTS[k];
  return (
    <AbsoluteFill>
      <Footage clip={c.clip} src={(f) => c.at + (f - k * 9)} scale={push(frame, k * 9)} />
      <Finish vignette={0.3} />
    </AbsoluteFill>
  );
};

// ---------- wordmark ----------
const WORD = 'COASTER LAB';
const SIZE = 220;
const FLOOR_Y = 560;
const BASE = Math.round(SIZE * 0.78); // Exo 2 caps: line box top → baseline (lineHeight 1)
const ROW_TOP = FLOOR_Y - BASE;
const PAD = 200;
const DROP = 720, T_FALL = 24, T_B1 = 16, T_B2 = 8;
const SNAP = 92, SNAP_DUR = 6;
const N = WORD.replace(' ', '').length;
const h = (n: number) => { const s = Math.sin(n * 127.3) * 43758.5453; return s - Math.floor(s); };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
// letter index → start frame: non-uniform stagger, faster and faster (R2)
const startOf = (i: number) => 4 + 36 * (1 - Math.pow(1 - i / (N - 1), 1.5));
const dropY = (t: number): number => {
  if (t <= 0) return -DROP;
  if (t < T_FALL) return -DROP + DROP * (t / T_FALL) ** 2;
  if (t < T_FALL + T_B1) { const u = (t - T_FALL) / T_B1; return -DROP * 0.3 * 4 * u * (1 - u); }
  if (t < T_FALL + T_B1 + T_B2) { const u = (t - T_FALL - T_B1) / T_B2; return -DROP * 0.09 * 4 * u * (1 - u); }
  return 0;
};
const IMPACTS: [number, number][] = [[T_FALL, 1], [T_FALL + T_B1, 0.45], [T_FALL + T_B1 + T_B2, 0.18]];
const squashAt = (t: number) => {
  let s = 0;
  for (const [t0, k] of IMPACTS) { const d = t - t0; if (d < 0 || d > 16) continue; s += k * Math.exp(-d / 2.6) * Math.cos(d * 0.85); }
  return s;
};
// letter landing frames, used by the SFX table
export const LETTER_LANDS = Array.from({ length: N }, (_, i) => Math.round(startOf(i) + T_FALL));
export const WORDMARK_SNAP = SNAP;

export const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const inhale = ramp(frame, SNAP - 2, 2, EASE.out);
  const snap = ramp(frame, SNAP, SNAP_DUR, EASE.snappy);
  const snapRot = ramp(frame, SNAP, SNAP_DUR + 2, EASE.overshoot);
  const pulse = 0.06 * inhale * (1 - snap);
  const sub = ramp(frame, SNAP + 4, 18, EASE.out);
  const logo = ramp(frame, SNAP, 14, EASE.overshoot);
  const bgIn = ramp(frame, 0, 20, EASE.out);
  let li = -1;
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      {/* the park, far behind and out of focus (same treatment as the game's start screen) */}
      <AbsoluteFill style={{ opacity: bgIn }}>
        <Footage clip="cine" src={() => 60 + frame * 0.35} scale={1.12} blend style={{ filter: 'blur(14px) saturate(1.1)' }} />
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(5,10,22,.55) 0%, rgba(5,10,22,.78) 55%, rgba(5,10,22,.9) 100%)' }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 40% at 50% 46%, ${alpha(C.acc, 0.16)} 0%, ${alpha(C.acc, 0)} 70%)` }} />
      </AbsoluteFill>
      {/* the ground line the letters land on */}
      <div style={{ position: 'absolute', left: 260, right: 260, top: FLOOR_Y + 34, height: 2, background: `linear-gradient(90deg, ${alpha(C.acc, 0)}, ${alpha(C.acc, 0.45)} 25%, ${alpha(C.violet, 0.45)} 75%, ${alpha(C.violet, 0)})`, opacity: bgIn }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, top: ROW_TOP, height: SIZE, display: 'flex', justifyContent: 'center',
        font: `italic 900 ${SIZE}px ${FONT.display}`, lineHeight: 1, letterSpacing: '0.02em', color: C.ink,
      }}>
        {WORD.split('').map((ch, k) => {
          if (ch === ' ') return <span key={k} style={{ width: SIZE * 0.32 }} />;
          li++;
          const i = li;
          const lab = k > 7;
          const t = frame - startOf(i);
          const y = dropY(t);
          const vy = dropY(t + 0.5) - dropY(t - 0.5);
          const air = -y;
          const tiltTarget = (h(i + 3) - 0.5) * 12;
          const rot = tiltTarget * EASE.out(clamp01((t - T_FALL) / 6)) * (1 - snapRot);
          const jitter = -Math.sin((Math.abs(rot) * Math.PI) / 180) * 60;
          const stretch = Math.min(1, Math.abs(vy) / 60) * 0.1 * (t < T_FALL ? 1 : 0.6);
          const sq = squashAt(t);
          const sy = (1 + stretch) * (1 - 0.2 * sq) + pulse;
          const sx = (1 - stretch * 0.55) * (1 + 0.15 * sq) + pulse;
          const lift = clamp01(air / 420);
          const shOp = (t < 0 ? 0 : 0.55) * (1 - lift * 0.85) * clamp01((t + 2) / 8);
          const letterStyle: React.CSSProperties = lab
            ? { background: `linear-gradient(90deg, ${C.acc}, ${C.violet})`, backgroundSize: '300% 100%', backgroundPosition: `${(k - 8) * 50}% 0`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
            : { textShadow: '0 6px 30px rgba(0,0,0,.45)' };
          return (
            <span key={k} style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ visibility: 'hidden' }}>{ch}</span>
              <div style={{
                position: 'absolute', left: '50%', top: BASE - 8, width: '80%', height: 16, borderRadius: '50%',
                transform: `translateX(-50%) scaleX(${mix(0.74, 1.3, lift).toFixed(3)})`, background: '#000',
                opacity: shOp, filter: `blur(${mix(7, 28, lift).toFixed(1)}px)`,
              }} />
              <div style={{ position: 'absolute', left: -PAD, right: -PAD, top: -PAD, bottom: -PAD, transform: `translateY(${(y + jitter).toFixed(2)}px)` }}>
                <SpeedBlur vx={0} vy={vy} amount={t < T_FALL ? 0.26 : 0.12} max={16}>
                  <div style={{
                    position: 'absolute', left: PAD, right: PAD, top: PAD, bottom: PAD, textAlign: 'center',
                    transform: `rotate(${rot.toFixed(3)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, transformOrigin: '50% 86%',
                    ...letterStyle,
                  }}>{ch}</div>
                </SpeedBlur>
              </div>
            </span>
          );
        })}
      </div>
      {/* logo tile + tagline arrive with the snap */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: FLOOR_Y + 70, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26 }}>
        <div style={{ opacity: clamp01(logo * 1.4), transform: `scale(${mix(0.4, 1, logo)}) rotate(${mix(-20, 0, logo)}deg)` }}>
          <LogoMark size={84} />
        </div>
        <div style={{ font: `800 50px ${FONT.ui}`, color: C.ink2, letterSpacing: '0.01em', opacity: sub, transform: `translateY(${((1 - sub) * 12).toFixed(2)}px)` }}>
          Build it. <span style={{ color: C.ink }}>Ride it.</span> <span style={{ color: C.danger }}>Break it.</span>
        </div>
      </div>
      <Finish vignette={0.35} />
    </AbsoluteFill>
  );
};
