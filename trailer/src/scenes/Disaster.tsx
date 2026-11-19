import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, alpha } from '../brand';
import { Eyebrow, Finish, Footage } from '../components';
import { EASE, bezier, mix, ramp } from '../lib/Polish';
import layout from '../../public/ui/layout.json';
import { CRASH_STOP_FRAME } from '../data/speeds';

// Shot 9 · Disaster Mode: chase camera kept on the train through the derail (capture/footage.js crashchase):
// banked turn → wheels leave the track in sparks → confetti burst → cars fly, riders' parachutes open.
// 0.6× slow motion (blended) so the derail reads; the music's full groove drops on frame 0.
const CRASH_SRC = (f: number) => 28 + f * 0.6;
export const CRASH_DERAIL = Math.round((CRASH_STOP_FRAME - 28) / 0.6); // output frame the wheels let go
export const Crash: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Footage clip="crashchase" src={CRASH_SRC} blend scale={1 + 0.04 * ramp(frame, 0, 124, EASE.smooth)} />
      <Eyebrow text="NEW · 💥 DISASTER MODE" color={C.danger} start={2} />
      <Finish />
    </AbsoluteFill>
  );
};

// Shot 10 · slam-entrance-moves · score-slam (demos/effects/slam-entrance-moves/ScoreSlam.tsx)
// 0–9f hover in front of the lens (2.75→2.6, 10px DOF, half-transparent) → 9–15f ease-in(quad) slam to 0.965
// → spring back to 1. Impact frame 15: ring 120→1500px / 16f (white core + coloured glow; spread out-cubic,
// fade linear — decoupled), 14 shards + 16 sparks, 18px vertical-biased shake decaying over 5f, 2f flash.
// The card is the game's real Incident Report panel (2x screenshot).
const IMPACT = 15, SLAM0 = 9;
export const REPORT_IMPACT = IMPACT;
const EASE_IN_QUAD = bezier(0.55, 0.085, 0.68, 0.53);
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SHARDS = Array.from({ length: 14 }, (_, i) => ({
  ang: (i / 14) * Math.PI * 2 + (rnd(i + 3) - 0.5) * 0.5, dist: 280 + rnd(i + 11) * 300, size: 22 + rnd(i + 23) * 26, spin: (rnd(i + 31) - 0.5) * 620,
  hot: i % 3 === 0,
  poly: [0, 1, 2, 3].map((k) => `${(50 + Math.cos(k * 1.7 + i) * (30 + rnd(i * 4 + k) * 20)).toFixed(0)}% ${(50 + Math.sin(k * 1.7 + i) * (30 + rnd(i * 5 + k) * 20)).toFixed(0)}%`).join(', '),
}));
const SPARKS = Array.from({ length: 16 }, (_, i) => ({ ang: (i / 16) * Math.PI * 2 + (rnd(i + 61) - 0.5) * 0.4, dist: 360 + rnd(i + 71) * 320, len: 40 + rnd(i + 81) * 50 }));

type Box = { width: number; height: number };
const L = layout as unknown as Record<string, Box | undefined>;
// fit a panel screenshot into a target height
export const panelSize = (name: string, maxH: number, maxW = 1500): Box => {
  const b = L[name] || { width: 600, height: 700 };
  const k = Math.min(maxH / b.height, maxW / b.width);
  return { width: b.width * k, height: b.height * k };
};

export const ReportSlam: React.FC = () => {
  const frame = useCurrentFrame();
  const P = panelSize('report', 960, 1140);
  const CX = 1295, CY = 540;
  const hover = ramp(frame, 0, SLAM0, EASE.smooth);
  const drop = ramp(frame, SLAM0, IMPACT - SLAM0, EASE_IN_QUAD);
  const k = Math.min(1, Math.max(0, (frame - IMPACT) / 11));
  const settle = frame < IMPACT ? 0 : 1 - Math.exp(-k * 5) * Math.cos(k * 9);
  const scale = frame < IMPACT ? mix(mix(2.75, 2.6, hover), 0.965, drop) : mix(0.965, 1, settle);
  const rot = mix(5, 0, drop);
  const dy = frame < IMPACT ? mix(-40 - 30 * hover, 0, drop) : 0;
  const cardOp = ramp(frame, 0, 6, EASE.out) * mix(0.6, 1, drop);
  const height01 = Math.min(1, Math.max(0, (scale - 1) / 1.75));
  const dof = height01 * 10;
  let shakeX = 0, shakeY = 0;
  if (frame >= IMPACT && frame < IMPACT + 5) {
    const t = frame - IMPACT, amp = 18 * Math.exp(-t * 0.85);
    shakeX = amp * 0.4 * (rnd(frame * 7 + 1) * 2 - 1);
    shakeY = amp * (t === 0 ? 1 : rnd(frame * 13 + 2) * 2 - 1);
  }
  const flash = frame >= IMPACT && frame < IMPACT + 3 ? [0.22, 0.12, 0.04][frame - IMPACT] : 0;
  const ringT = ramp(frame, IMPACT, 16, EASE.snappy), ringLin = ramp(frame, IMPACT, 16, EASE.linear);
  const ringOn = frame >= IMPACT && frame < IMPACT + 16;
  const ringD = mix(120, 1500, ringT);
  const ringOp = ringLin < 0.6 ? mix(1, 0.65, ringLin / 0.6) : mix(0.65, 0, (ringLin - 0.6) / 0.4);
  const ringW = mix(9, 1.5, ringT);
  const shT = ramp(frame, IMPACT, 20, EASE.out), shLin = ramp(frame, IMPACT, 20, EASE.linear), shOn = frame >= IMPACT && frame < IMPACT + 20;
  const spT = ramp(frame, IMPACT, 10, bezier(0.1, 0.9, 0.2, 1)), spLin = ramp(frame, IMPACT, 10, EASE.linear), spOn = frame >= IMPACT && frame < IMPACT + 10;
  const push = 1 + 0.02 * ramp(frame, IMPACT, 105, EASE.swift);
  const side = ramp(frame, 34, 18, EASE.out);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: C.night }}>
      {/* the crash site, frozen and darkened behind the report */}
      <Footage clip="crashchase" src={() => 104} scale={1.08} style={{ filter: 'blur(16px) brightness(0.45) saturate(0.8)' }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 60% at 50% 50%, ${alpha(C.danger, 0.12)}, rgba(5,10,22,0.6) 75%)` }} />
      <div style={{ position: 'absolute', inset: -40, transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px)` }}>
        <div style={{ position: 'absolute', inset: 40, transform: `scale(${push.toFixed(5)})` }}>
          {ringOn && (
            <>
              <div style={{ position: 'absolute', left: CX - ringD / 2, top: CY - ringD / 2, width: ringD, height: ringD, borderRadius: '50%', opacity: ringOp, boxShadow: `0 0 ${(30 + ringT * 40).toFixed(0)}px ${(6 + ringT * 8).toFixed(0)}px ${alpha(C.danger, 0.4)}, inset 0 0 ${(30 + ringT * 40).toFixed(0)}px ${alpha(C.gold, 0.25)}` }} />
              <div style={{ position: 'absolute', left: CX - ringD / 2, top: CY - ringD / 2, width: ringD, height: ringD, borderRadius: '50%', opacity: ringOp, border: `${ringW.toFixed(2)}px solid rgba(255,250,240,0.95)`, boxSizing: 'border-box' }} />
            </>
          )}
          {spOn && SPARKS.map((s, i) => {
            const r = 160 + s.dist * spT, len = s.len * (1 - spLin) + 6;
            return <div key={i} style={{ position: 'absolute', left: CX + Math.cos(s.ang) * r - len / 2, top: CY + Math.sin(s.ang) * r * 0.8 - 2, width: len, height: 4, borderRadius: 2, background: 'linear-gradient(90deg, rgba(255,243,214,0), #fffaf0)', transform: `rotate(${((s.ang * 180) / Math.PI).toFixed(1)}deg)`, opacity: 1 - spLin, boxShadow: `0 0 10px ${alpha(C.gold, 0.8)}` }} />;
          })}
          <div style={{
            position: 'absolute', left: CX - P.width / 2, top: CY - P.height / 2, width: P.width, height: P.height, opacity: cardOp,
            transform: `translateY(${dy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
            filter: dof > 0.4 ? `blur(${dof.toFixed(2)}px)` : undefined,
            borderRadius: 26, boxShadow: `0 ${(40 + height01 * 80).toFixed(1)}px ${(90 + height01 * 120).toFixed(1)}px -20px rgba(0,0,0,${(0.85 - height01 * 0.3).toFixed(2)})`,
          }}>
            <Img src={staticFile('ui/report-panel.png')} style={{ width: '100%', height: '100%', display: 'block', borderRadius: 26 }} />
          </div>
          {shOn && SHARDS.map((d, i) => {
            const dx = Math.cos(d.ang) * d.dist * shT, dyy = Math.sin(d.ang) * d.dist * 0.75 * shT + 260 * shLin * shLin, s = d.size * (1 - 0.55 * shLin);
            const flip = Math.abs(Math.cos(shLin * Math.PI * 1.6 + i));
            return <div key={i} style={{
              position: 'absolute', left: CX + Math.cos(d.ang) * 300 + dx - s / 2, top: CY + Math.sin(d.ang) * 120 + dyy - s / 2, width: s, height: s, clipPath: `polygon(${d.poly})`,
              background: d.hot ? `linear-gradient(135deg, #8a2a2a, ${C.danger} 45%, #ffd2c8 55%, #9c3434)` : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(201,204,212,0.55))',
              opacity: shLin < 0.7 ? 1 : 1 - (shLin - 0.7) / 0.3, transform: `rotate(${(d.spin * shT).toFixed(1)}deg) scaleY(${Math.max(0.15, flip).toFixed(3)})`, filter: i % 4 === 0 ? 'blur(2px)' : undefined,
            }} />;
          })}
        </div>
      </div>
      {/* the line that tells you what you are looking at */}
      <div style={{ position: 'absolute', left: 96, bottom: 120, whiteSpace: 'nowrap', opacity: side, transform: `translateY(${mix(20, 0, side)}px)` }}>
        <div style={{ font: `italic 900 64px ${FONT.display}`, textTransform: 'uppercase', color: C.ink, lineHeight: 1.02 }}>Every crash</div>
        <div style={{ font: `italic 900 64px ${FONT.display}`, textTransform: 'uppercase', color: C.danger, lineHeight: 1.02 }}>gets a report</div>
      </div>
      {flash > 0 && <AbsoluteFill style={{ background: '#fffaf0', opacity: flash, mixBlendMode: 'screen' }} />}
      <Finish vignette={0.3} />
    </AbsoluteFill>
  );
};
