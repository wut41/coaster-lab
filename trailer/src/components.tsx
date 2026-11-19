import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, alpha, glass } from './brand';
import { EASE, Grain, Vignette, mix, ramp } from './lib/Polish';

// Real gameplay footage, captured frame by frame (capture/footage.js).
// `src` maps the local frame to a source frame (float → nearest + optional crossfade for slow-mo).
export const CLIP_LEN: Record<string, number> = { pov: 168, loop: 102, cine: 120, moon: 132, crash: 150, crashchase: 110, povearth: 120, povmoon: 120 };
const pad = (n: number) => String(n).padStart(4, '0');
export const frameUrl = (clip: string, i: number) =>
  staticFile(`footage/${clip}/${pad(Math.max(0, Math.min(CLIP_LEN[clip] - 1, Math.round(i))))}.jpg`);

export const Footage: React.FC<{
  clip: string; src?: (f: number) => number; scale?: number; origin?: string; blend?: boolean; style?: React.CSSProperties;
}> = ({ clip, src = (f) => f, scale = 1, origin = '50% 50%', blend = false, style }) => {
  const frame = useCurrentFrame();
  const s = src(frame);
  const a = Math.floor(s), t = s - a;
  const img = (i: number, op = 1) => (
    <Img src={frameUrl(clip, i)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: op }} />
  );
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#000', ...style }}>
      <AbsoluteFill style={{ transform: `scale(${scale.toFixed(5)})`, transformOrigin: origin }}>
        {blend && t > 0.02 && t < 0.98 ? <>{img(a)}{img(a + 1, t)}</> : img(Math.round(s))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Filmic finish on top of footage: light vignette + grain, so all clips feel shot by one camera.
export const Finish: React.FC<{ vignette?: number }> = ({ vignette = 0.22 }) => (
  <>
    <Vignette strength={vignette} inner={0.55} color="#06101f" />
    <Grain opacity={0.05} />
  </>
);

// Lower-third caption: dark glass pill, emoji + 60px bold text (Q11: ≥ 56px effective height).
export const Caption: React.FC<{ from: number; dur: number; icon: string; text: string }> = ({ from, dur, icon, text }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < 0 || local > dur) return null;
  const inP = ramp(local, 0, 16, EASE.snappy);
  const outP = ramp(local, dur - 10, 10, EASE.exit);
  const words = text.split(' ');
  return (
    <div style={{
      position: 'absolute', left: 96, bottom: 92, display: 'flex', alignItems: 'center', gap: 22,
      padding: '20px 34px 20px 24px', ...glass(999),
      opacity: inP * (1 - outP),
      transform: `translateY(${mix(40, 0, inP) + 30 * outP}px) scale(${mix(0.94, 1, inP)})`, transformOrigin: '0% 100%',
    }}>
      <span style={{ fontSize: 58, lineHeight: 1 }}>{icon}</span>
      <span style={{ font: `800 60px ${FONT.ui}`, letterSpacing: '-0.01em', whiteSpace: 'nowrap', display: 'flex', gap: '0.26em' }}>
        {words.map((w, i) => {
          const p = ramp(local, 4 + i * 2.5, 16, EASE.out);
          return (
            <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * 18).toFixed(2)}px)`, filter: p > 0.99 ? undefined : `blur(${((1 - p) * 7).toFixed(2)}px)` }}>{w}</span>
          );
        })}
      </span>
    </div>
  );
};

// Flash-cut (shot-transitions · flash-cut): a white flash straddling a seam, 5f each side.
export const FlashCut: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const t = (frame - from) / dur;
  if (t < 0 || t > 1) return null;
  const op = t < 0.5 ? EASE.out(t / 0.5) : 1 - EASE.swift((t - 0.5) / 0.5);
  return <AbsoluteFill style={{ background: '#f4f8ff', opacity: op * 0.95, pointerEvents: 'none' }} />;
};

// Feature eyebrow chip (top-left), e.g. "NEW IN 8.6 · GRAVITY LAB"
export const Eyebrow: React.FC<{ text: string; color?: string; start?: number }> = ({ text, color = C.acc, start = 0 }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, start, 16, EASE.snappy);
  return (
    <div style={{
      position: 'absolute', left: 96, top: 84, padding: '14px 26px', borderRadius: 999,
      background: 'rgba(9,20,39,0.78)', border: `2px solid ${alpha(color, 0.75)}`, boxShadow: `0 10px 30px -10px rgba(0,0,0,0.6), inset 0 0 24px ${alpha(color, 0.12)}`,
      font: `800 34px ${FONT.ui}`, letterSpacing: '0.14em', color, opacity: p,
      transform: `translateX(${mix(-30, 0, p)}px)`, backdropFilter: 'blur(10px)',
    }}>{text}</div>
  );
};
