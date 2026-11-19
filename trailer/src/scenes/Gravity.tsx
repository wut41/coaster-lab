import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, alpha, glass } from '../brand';
import { Eyebrow, Finish, Footage } from '../components';
import { EASE, SpeedBlur, mix, ramp, velocity } from '../lib/Polish';

// Shot 6 · blur-slide title card (demos/typography/blur-slide/BlurSlide.tsx):
// opacity / translateY / blur all bound to ONE progress p (EASE.out); words 4f apart; the subtitle
// starts before the title has landed (overlap = one sentence, not two beats).
type W = { text: string; start: number; dur: number; style?: React.CSSProperties };
const Words: React.FC<{ words: W[]; dy: number; blur: number; style: React.CSSProperties }> = ({ words, dy, blur, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.28em', whiteSpace: 'nowrap', ...style }}>
      {words.map((w, i) => {
        const p = ramp(frame, w.start, w.dur, EASE.out);
        return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * dy).toFixed(2)}px)`, filter: p >= 0.999 ? undefined : `blur(${((1 - p) * blur).toFixed(2)}px)`, ...w.style }}>{w.text}</span>;
      })}
    </div>
  );
};
export { Words as BlurWords };

export const NewIn: React.FC = () => {
  const frame = useCurrentFrame();
  const push = 1 + 0.03 * ramp(frame, 0, 56, EASE.smooth);
  const grad: React.CSSProperties = { background: `linear-gradient(90deg, ${C.acc}, ${C.violet})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingRight: '0.08em' };
  const chips = ['🪐 Gravity Lab', '💥 Disaster Mode', '🧬 Evolve', '📅 Daily Challenge'];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 45%, #0f2244 0%, ${C.night} 70%)`, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, justifyContent: 'center', alignItems: 'center' }}>
        <Words dy={70} blur={18} style={{ font: `italic 900 200px ${FONT.display}`, textTransform: 'uppercase', color: C.ink, lineHeight: 1 }}
          words={[{ text: 'New', start: 2, dur: 20 }, { text: 'in', start: 6, dur: 20 }, { text: '8.6', start: 10, dur: 24, style: grad }]} />
        <div style={{ display: 'flex', gap: 22, marginTop: 56 }}>
          {chips.map((c, i) => {
            const p = ramp(frame, 16 + i * 2.4, 18, EASE.out);
            return <div key={c} style={{ ...glass(999), padding: '16px 30px', font: `800 40px ${FONT.ui}`, opacity: p, transform: `translateY(${((1 - p) * 26).toFixed(2)}px)`, filter: p > 0.99 ? undefined : `blur(${((1 - p) * 9).toFixed(2)}px)` }}>{c}</div>;
          })}
        </div>
      </AbsoluteFill>
      <Finish vignette={0.3} />
    </AbsoluteFill>
  );
};

// Shot 7 · segmented-thumb-hero (demos/interaction/segmented-thumb-hero/SegmentedThumbHero.tsx)
// 1080×220 control springs up from +200px (damping 14 / stiffness 120); oversized outlined cursor slides in
// from off-frame over 24f (out-cubic); press 0.86 + 12f accent ripple at the tip; thumb moves in EXACTLY 8f
// (out-cubic, leading edge first → stretch, 1.5% settle); new icon springs (damping 10 / stiffness 220),
// old icon collapses with width → 0; ≥ 30f hold on the new state.
const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width={130} height={150} viewBox="0 0 26 30" style={{
    position: 'absolute', left: x, top: y, transform: `scale(${1 - press * 0.14})`, transformOrigin: '15% 10%',
    filter: `drop-shadow(0 ${2 - press}px ${3 - press}px rgba(0,0,0,0.35)) drop-shadow(0 ${12 - press * 6}px ${18 - press * 6}px rgba(0,0,0,0.3))`,
  }}>
    <path d="M4 2 L4 24 L9.5 18.5 L13 27 L16.8 25.4 L13.3 17 L21 17 Z" fill="#fff" stroke="#0b1220" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);
const lerpHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};
export const GRAV = { CLICK: 48, SLIDE: 52, SLIDE_END: 60 };

export const GravitySwitch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { CLICK, SLIDE, SLIDE_END } = GRAV;
  const floatT = spring({ frame, fps, config: { damping: 14, stiffness: 120, mass: 0.9 } });
  const ctrlY = interpolate(floatT, [0, 1], [200, 0]);
  const CW = 1080, CH = 220, PAD = 16, SEGW = (CW - PAD * 2) / 2, TH = CH - PAD * 2;
  const CL = 960 - CW / 2, CT = 470 - CH / 2;
  const curT = interpolate(frame, [20, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const curX = interpolate(curT, [0, 1], [2020, 1250]);
  const curY = interpolate(curT, [0, 1], [1200, 520]);
  const TIP = { x: 1250 + 20 - CL - 1.5, y: 520 + 10 - CT - 1.5 };
  const press = interpolate(frame, [CLICK, CLICK + 3, CLICK + 7], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slide = (f: number, e: (x: number) => number) => interpolate(f, [SLIDE, SLIDE_END], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
  const thumbT = slide(frame, Easing.out(Easing.cubic));
  const settle = (f: number) => (f < SLIDE_END ? 0 : 0.015 * Math.sin(Math.min(1, (f - SLIDE_END) / 6) * Math.PI) * (1 - Math.min(1, (f - SLIDE_END) / 6)));
  const thumbL = PAD + (slide(frame, Easing.out(Easing.quad)) + settle(frame)) * SEGW;
  const thumbR = PAD + SEGW + (slide(frame, Easing.out(Easing.poly(4))) + settle(frame)) * SEGW;
  const thumbV = velocity((f) => PAD + slide(f, Easing.out(Easing.cubic)) * SEGW, frame);
  const moonIcon = frame >= SLIDE_END ? spring({ frame: frame - SLIDE_END, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } }) : 0;
  const earthIcon = interpolate(frame, [SLIDE, SLIDE + 6], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  const ripple = interpolate(frame, [CLICK, CLICK + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const moonAmt = Math.min(1, Math.max(0, (thumbT - 0.2) / 0.6));
  // the world under the control turns from day to the Moon's night with the switch
  const night = ramp(frame, SLIDE, 20, EASE.smooth);
  const readout = ramp(frame, SLIDE_END, 14, EASE.snappy);
  const label = (amt: number): React.CSSProperties => ({
    font: `800 76px ${FONT.ui}`, letterSpacing: '-0.02em', color: lerpHex('#7f90ab', '#ffffff', amt),
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, width: SEGW, height: TH, position: 'relative', zIndex: 2,
  });
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <AbsoluteFill>
        <Footage clip="moon" src={() => 40} scale={1.1} style={{ filter: `blur(18px) brightness(${mix(0.75, 0.45, night)})` }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 50% at 50% 46%, ${alpha('#0a1430', 0.2)}, ${alpha('#050a16', 0.75)})` }} />
      </AbsoluteFill>
      <Eyebrow text="NEW · 🪐 GRAVITY LAB" />
      <div style={{
        position: 'absolute', left: CL, top: CT, width: CW, height: CH, borderRadius: CH / 2, boxSizing: 'border-box', padding: PAD,
        background: 'linear-gradient(180deg, rgba(6,12,26,0.92), rgba(14,24,44,0.92))', border: `1.5px solid ${C.line}`,
        boxShadow: `inset 0 3px 8px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.08), 0 ${mix(30, 14, floatT).toFixed(1)}px ${mix(80, 44, floatT).toFixed(1)}px -18px rgba(0,0,0,${mix(0.7, 0.55, floatT).toFixed(3)})`,
        transform: `translateY(${ctrlY}px)`, opacity: Math.min(1, floatT * 1.5), display: 'flex', alignItems: 'center',
      }}>
        <SpeedBlur vx={thumbV} amount={0.06} max={6} style={{ zIndex: 1 }}>
          <div style={{
            position: 'absolute', left: thumbL, top: PAD, width: thumbR - thumbL, height: TH, borderRadius: TH / 2,
            background: `linear-gradient(135deg, ${C.acc}, ${C.logo2})`,
            boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.45), 0 2px 4px rgba(0,0,0,0.3), 0 14px 34px -8px ${alpha(C.acc, 0.6)}`,
          }} />
        </SpeedBlur>
        {ripple > 0 && ripple < 1 && (
          <div style={{
            position: 'absolute', left: TIP.x - 130 * ripple, top: TIP.y - 130 * ripple, width: 260 * ripple, height: 260 * ripple, borderRadius: '50%',
            boxSizing: 'border-box', border: `3px solid ${C.gold}`, opacity: (1 - ripple) * 0.9, zIndex: 3,
          }} />
        )}
        <div style={label(1 - moonAmt)}>
          <span style={{ display: 'inline-flex', fontSize: 80, transform: `scale(${earthIcon})`, width: earthIcon < 0.05 ? 0 : 92, justifyContent: 'center' }}>🌍</span>
          Earth
        </div>
        <div style={label(moonAmt)}>
          <span style={{ display: 'inline-flex', fontSize: 80, transform: `scale(${moonIcon})`, width: moonIcon < 0.05 ? 0 : 92, justifyContent: 'center' }}>🌙</span>
          Moon
        </div>
      </div>
      {/* gravity readout swaps with the switch */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: CT + CH + 70, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 24, opacity: floatT, transform: `translateY(${ctrlY}px)` }}>
        <span style={{ font: `800 40px ${FONT.ui}`, color: C.ink2, letterSpacing: '0.12em' }}>GRAVITY</span>
        <span style={{ position: 'relative', display: 'inline-block', width: 230, height: 96 }}>
          <span style={{ position: 'absolute', left: 0, bottom: 0, font: `italic 900 96px ${FONT.display}`, color: C.ink, opacity: 1 - readout, transform: `translateY(${-40 * readout}px)`, filter: readout > 0.01 ? `blur(${6 * readout}px)` : undefined }}>9.81</span>
          <span style={{ position: 'absolute', left: 0, bottom: 0, font: `italic 900 96px ${FONT.display}`, color: C.gold, opacity: readout, transform: `translateY(${40 * (1 - readout)}px)`, filter: readout < 0.99 ? `blur(${6 * (1 - readout)}px)` : undefined }}>1.62</span>
        </span>
        <span style={{ font: `800 40px ${FONT.ui}`, color: C.ink2 }}>m/s²</span>
      </div>
      <Cursor x={curX} y={curY} press={press} />
      <Finish vignette={0.3} />
    </AbsoluteFill>
  );
};

// Shot 8 · Moon ride (real footage, Moon gravity with "realistic planet" on), planet chip top-right
export const MoonRide: React.FC = () => {
  const frame = useCurrentFrame();
  const chip = ramp(frame, 4, 16, EASE.snappy);
  return (
    <AbsoluteFill>
      <Footage clip="moon" src={(f) => 22 + f * 0.58} blend scale={1 + 0.025 * ramp(frame, 0, 120, EASE.smooth)} />
      <div style={{ position: 'absolute', right: 96, top: 84, ...glass(999), padding: '16px 30px', display: 'flex', gap: 16, alignItems: 'center', opacity: chip, transform: `translateX(${mix(40, 0, chip)}px)` }}>
        <span style={{ fontSize: 46 }}>🌙</span>
        <span style={{ font: `800 42px ${FONT.ui}` }}>Moon gravity</span>
        <span style={{ font: `800 42px ${FONT.ui}`, color: C.gold }}>1.62 m/s²</span>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};
