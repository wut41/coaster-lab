import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, alpha } from '../brand';
import { Eyebrow, Finish, Footage } from '../components';
import { EASE, mix, ramp } from '../lib/Polish';
import { BlurWords } from './Gravity';
import { panelSize } from './Disaster';

// Shot 11 · cloner-depth-echo (demos/ui-entrance/cloner-depth-echo/ClonerDepthEcho.tsx)
// The real Evolve panel "photocopies" 7 clones back along Z (perspective 1500, vanishing point moved to the
// top-left corner — the 命门: a centred VP hides every clone behind the hero), 250px apart, opacity
// 100% → 28%, fill fades to an accent outline. Spread: spring stagger 2.2f each (damping 15, one light
// overshoot); hold 32f with a 2% push; merge: strong ease-in 10f, all together; on landing a single
// 1.06 pulse + one accent rim flash (14f). Counter "×N" rolls one notch per clone.
const N = 7, GAP_Z = 250, SPREAD = 24, EACH = 2.2, MERGE = 76, MERGE_DUR = 10, LAND = MERGE + MERGE_DUR;
export const EVOLVE_LAND = LAND;
export const EVOLVE_SPREAD = SPREAD;
const PERSP = 1500, VP = { x: 360, y: 120 };
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const springAt = (f: number, start: number, damping = 15) => {
  const t = Math.max(0, f - start); const w = 0.55, z = damping / 30;
  return 1 - Math.exp(-z * w * t * 1.6) * Math.cos(w * t * Math.sqrt(Math.max(0.01, 1 - z * z)));
};
const spreadOf = (f: number, idx: number) => (f < SPREAD + (idx - 1) * EACH ? 0 : Math.min(1.08, springAt(f, SPREAD + (idx - 1) * EACH)));
const mergeOf = (f: number) => ramp(f, MERGE, MERGE_DUR, EASE.exit);
const depthOf = (f: number, idx: number) => spreadOf(f, idx) * (1 - mergeOf(f));

export const Evolve: React.FC = () => {
  const frame = useCurrentFrame();
  const P = panelSize('evolve', 860, 760);
  const CX = 1340 - P.width / 2, CY = 540 - P.height / 2 + 20; // hero top-left corner
  const enter = ramp(frame, 0, 16, EASE.snappy);
  const press = ramp(frame, 16, 8, EASE.swift) * (1 - ramp(frame, SPREAD, 10, EASE.overshoot));
  const popT = clamp01((frame - LAND) / 16);
  const pop = frame >= LAND ? Math.sin(popT * Math.PI) * Math.pow(1 - popT, 0.6) : 0;
  const heroScale = (1 - 0.04 * press) * (1 + 0.06 * pop) * mix(0.94, 1, enter);
  const rim = frame >= LAND ? Math.max(0, 1 - (frame - LAND) / 14) : 0;
  let count = 1, lastTick = -99;
  for (let idx = 1; idx <= N; idx++) { const f0 = SPREAD + (idx - 1) * EACH + 2; if (frame >= f0) { count++; lastTick = f0; } }
  const roll = ramp(frame - lastTick, 0, 5, EASE.snappy);
  const counterPunch = frame >= LAND ? Math.sin(clamp01((frame - LAND) / 12) * Math.PI) : 0;
  const dolly = 1 + 0.02 * ramp(frame, 40, 40, EASE.smooth) + 0.006 * ramp(frame, 100, 38, EASE.smooth);
  const drift = 14 * ramp(frame, 40, 40, EASE.smooth) * (1 - mergeOf(frame));
  const label = ramp(frame, 6, 16, EASE.out);
  const panel = (op: number, outline: number, key: React.Key, extra: React.CSSProperties = {}) => (
    <div key={key} style={{ position: 'absolute', left: CX, top: CY, width: P.width, height: P.height, borderRadius: 26, ...extra }}>
      <Img src={staticFile('ui/evolve-panel.png')} style={{ width: '100%', height: '100%', display: 'block', borderRadius: 26, opacity: op }} />
      {outline > 0 && <div style={{ position: 'absolute', inset: 0, borderRadius: 26, border: `2px solid ${alpha(C.acc, 0.55 + 0.3 * outline)}`, boxShadow: `0 0 ${(18 + 20 * outline).toFixed(0)}px ${alpha(C.acc, 0.14 + 0.1 * outline)}` }} />}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <Footage clip="cine" src={() => 100} scale={1.1} style={{ filter: 'blur(20px) brightness(0.35) saturate(0.9)' }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 45% 55% at 62% 55%, ${alpha(C.acc, 0.14 + 0.1 * rim)}, rgba(5,10,22,0) 70%)` }} />
      <AbsoluteFill style={{ transform: `scale(${dolly.toFixed(5)})`, transformOrigin: `${CX + P.width / 2}px ${CY + P.height / 2}px` }}>
        <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: `${VP.x}px ${VP.y}px` }}>
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
            {Array.from({ length: N }, (_, k) => N - k).map((idx) => {
              const d = depthOf(frame, idx), sp = spreadOf(frame, idx);
              const op = (1 - (idx / N) * 0.72) * clamp01(sp * 2.5) * (1 - mergeOf(frame) * 0.4);
              if (op <= 0.005 || d <= 0.002) return null;
              const v = Math.abs(depthOf(frame + 0.5, idx) - depthOf(frame - 0.5, idx)) * GAP_Z * idx;
              const c = idx / N;
              return panel(mix(0.5, 0.08, c), 1, idx, {
                transform: `translate3d(${((-58 * idx - drift * idx * 0.4) * d).toFixed(2)}px, ${(-6 * idx * d).toFixed(2)}px, ${(-GAP_Z * idx * d).toFixed(2)}px)`,
                opacity: op, filter: `blur(${(1.6 * c + Math.min(6, v * 0.03)).toFixed(2)}px)`,
              });
            })}
            {panel(1, 0, 'hero', {
              transform: `translateY(${((1 - enter) * 40).toFixed(2)}px) scale(${heroScale.toFixed(4)})`, opacity: enter,
              boxShadow: `0 40px 90px -30px rgba(0,0,0,0.9), 0 0 0 ${(2 * rim).toFixed(2)}px ${alpha(C.acc, rim)}, 0 0 ${(60 * rim).toFixed(0)}px ${alpha(C.acc, 0.6 * rim)}`,
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <Eyebrow text="NEW · 🧬 EVOLVE" color={C.ok} />
      {/* counter: each clone rolls it one notch */}
      <div style={{ position: 'absolute', left: 110, bottom: 150, opacity: label, transform: `scale(${(1 + 0.06 * counterPunch).toFixed(4)})`, transformOrigin: '0% 70%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <span style={{ font: `italic 900 150px ${FONT.display}`, color: alpha(C.ok, 0.6), marginTop: 50, marginRight: 8 }}>×</span>
          <div style={{ position: 'relative', height: 240, width: 160 }}>
            {[count - 1, count].map((v, k) => {
              if (v < 1) return null;
              const y = k === 0 ? -roll * 45 : (1 - roll) * 45;
              return <div key={k} style={{ position: 'absolute', left: 0, top: 0, font: `italic 900 240px ${FONT.display}`, lineHeight: 1, color: C.ok, transform: `translateY(${y.toFixed(2)}%)`, opacity: k === 0 ? clamp01(1 - roll * 1.6) : clamp01(roll * 1.6), textShadow: `0 0 ${30 + 30 * counterPunch}px ${alpha(C.ok, 0.4)}`, filter: roll < 0.95 ? `blur(${((1 - roll) * 6).toFixed(2)}px)` : undefined }}>{v}</div>;
            })}
          </div>
        </div>
        <div style={{ font: `800 40px ${FONT.ui}`, color: C.ink2, letterSpacing: '0.1em', marginTop: -10 }}>GENERATIONS</div>
      </div>
      {/* headline lands after the merge */}
      <div style={{ position: 'absolute', left: 110, top: 220 }}>
        <BlurWords dy={56} blur={16} style={{ font: `italic 900 104px ${FONT.display}`, textTransform: 'uppercase', color: C.ink, lineHeight: 1, justifyContent: 'flex-start' }}
          words={[{ text: 'Breed', start: LAND + 4, dur: 20 }, { text: 'better', start: LAND + 8, dur: 20 }]} />
        <BlurWords dy={56} blur={16} style={{ font: `italic 900 104px ${FONT.display}`, textTransform: 'uppercase', color: C.ok, lineHeight: 1.05, justifyContent: 'flex-start' }}
          words={[{ text: 'rides.', start: LAND + 14, dur: 24 }]} />
      </div>
      <Finish vignette={0.3} />
    </AbsoluteFill>
  );
};

// Shot 12 · Daily Challenge: the real panel, slow push-in, blur-slide headline
export const Daily: React.FC = () => {
  const frame = useCurrentFrame();
  const P = panelSize('daily', 860, 800);
  const push = 1 + 0.05 * ramp(frame, 0, 84, EASE.smooth);
  const inP = ramp(frame, 0, 18, EASE.snappy);
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <Footage clip="cine" src={() => 30} scale={1.1} style={{ filter: 'blur(20px) brightness(0.4)' }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 45% 55% at 70% 50%, ${alpha(C.gold, 0.12)}, rgba(5,10,22,0) 70%)` }} />
      <div style={{
        position: 'absolute', left: 1450 - P.width / 2, top: 540 - P.height / 2, width: P.width, height: P.height,
        transform: `translateY(${mix(60, 0, inP)}px) scale(${push})`, opacity: inP, borderRadius: 26, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.9)',
      }}>
        <Img src={staticFile('ui/daily-panel.png')} style={{ width: '100%', height: '100%', display: 'block', borderRadius: 26 }} />
      </div>
      <Eyebrow text="NEW · 📅 DAILY CHALLENGE" color={C.gold} />
      <div style={{ position: 'absolute', left: 110, top: 330 }}>
        <BlurWords dy={56} blur={16} style={{ font: `italic 900 96px ${FONT.display}`, textTransform: 'uppercase', color: C.ink, lineHeight: 1.05, justifyContent: 'flex-start' }}
          words={[{ text: 'One', start: 8, dur: 20 }, { text: 'challenge.', start: 12, dur: 20 }]} />
        <BlurWords dy={56} blur={16} style={{ font: `italic 900 96px ${FONT.display}`, textTransform: 'uppercase', color: C.gold, lineHeight: 1.05, justifyContent: 'flex-start' }}
          words={[{ text: 'Every', start: 18, dur: 22 }, { text: 'day.', start: 22, dur: 24 }]} />
        <div style={{ font: `800 40px ${FONT.ui}`, color: C.ink2, marginTop: 30, maxWidth: 900, opacity: ramp(frame, 26, 20, EASE.out) }}>Same rules for everyone.<br />Keep your streak going.</div>
      </div>
      <Finish vignette={0.3} />
    </AbsoluteFill>
  );
};
