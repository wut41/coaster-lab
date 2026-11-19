// Shot 13 · outro-group-photo-launch (demos/outro/outro-group-photo-launch/OutroGroupPhotoLaunch.tsx)
// Every feature shown sends one element back for the group photo: 9 elements fly in from all sides
// (cue 4 + 3f each, 12f flight, FLY_EASE bezier(0.34,1.4,0.44,1) — y1 > 1 for a real overshoot),
// directional motion blur by screen speed, landing press 1.5%; when the wordmark arrives (42–50f) everyone
// steps back (opacity −12%, saturate −8%). Crane: perspective rotateX 4°→0 + scale 1.06→1 over 40f, then a
// slow push from zero velocity. Launch atmosphere: light sweep 2–14f, stage light 42→50→58f, 20 seeded
// gold dust motes + 6 bokeh. Wordmark letterpress (logo first at 38f, letters 42 + i·1.8, 8f each),
// rule grows 58→70f with 190px extension lines; sign-off hold ≥ 30f, then a dark fade.
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, LogoMark, alpha } from '../brand';
import { Footage, frameUrl } from '../components';
import { EASE, Grain, SpeedBlur, ramp, velocity } from '../lib/Polish';
import { panelSize } from './Disaster';

export const OUTRO_DUR = 150;
const FLY_EASE = Easing.bezier(0.34, 1.4, 0.44, 1);
const CRANE_EASE = Easing.bezier(0.3, 0, 0.2, 1);

type El = { key: string; img: string; w: number; h: number; cx: number; cy: number; rot: number; dx: number; dy: number; cue: number; photo?: boolean };
const photo = (key: string, clip: string, i: number, cx: number, cy: number, rot: number, dx: number, dy: number, cue: number, w = 420): El =>
  ({ key, img: frameUrl(clip, i), w, h: (w * 9) / 16, cx, cy, rot, dx, dy, cue, photo: true });
const ui = (key: string, name: string, maxH: number, cx: number, cy: number, rot: number, dx: number, dy: number, cue: number): El => {
  const s = panelSize(name, maxH, 360);
  return { key, img: staticFile(`ui/${name}-panel.png`), w: s.width, h: s.height, cx, cy, rot, dx, dy, cue };
};
// render order = cue order (later arrivals stack on top)
const ELS: El[] = [
  photo('pov', 'pov', 56, 300, 210, -5, -500, -100, 4),
  photo('park', 'cine', 60, 1620, 200, 4, 500, -100, 7),
  ui('report', 'report', 400, 1650, 660, 5, 480, 200, 10),
  photo('moon', 'moon', 60, 235, 700, -3, -460, 120, 13, 380),
  ui('evolve', 'evolve', 360, 560, 890, 3, -300, 320, 16),
  photo('crash', 'crash', 70, 1330, 920, -4, 380, 320, 19, 380),
  ui('daily', 'daily', 330, 1130, 170, -2, 160, -320, 22),
  photo('loop', 'loop', 27, 760, 160, 3, -160, -320, 25, 360),
  ui('gravity', 'gravity', 300, 930, 960, -2, 0, 360, 28),
];
const DUST = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 439 + 137) % 1920, y0: (i * 613 + 271) % 1080, rise: 0.3 + (i % 5) * 0.11, swayAmp: 9 + (i % 4) * 5,
  swayFreq: 0.022 + (i % 3) * 0.008, phase: (i * 0.83) % (Math.PI * 2), size: 2.4 + (i % 3) * 0.9, opacity: 0.35 + ((i * 7) % 5) * 0.09,
}));
const BOKEH = Array.from({ length: 6 }, (_, i) => ({ x: (i * 701 + 260) % 1920, y0: (i * 389 + 640) % 1080, rise: 0.55 + (i % 3) * 0.2, size: 14 + (i % 3) * 7, opacity: 0.1 + (i % 2) * 0.06 }));
const WORD = 'COASTER LAB';
const cl = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const OUTRO_STAMP = 42; // first letter lands
export const OUTRO_RULE = 58;

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = 1 - ramp(frame, OUTRO_DUR - 12, 11, EASE.exit);
  const recede = interpolate(frame, [42, 50], [0, 1], cl);
  const craneT = interpolate(frame, [0, 40], [0, 1], { ...cl, easing: CRANE_EASE });
  const pushT = ramp(frame, 36, OUTRO_DUR - 36, EASE.smooth);
  const camScale = 1.06 - 0.06 * craneT + 0.035 * pushT;
  const camTilt = 4 * (1 - craneT);
  const blur = interpolate(frame, [0, 24], [0, 14], { ...cl, easing: Easing.bezier(0.4, 0, 0.4, 1) });
  const sweepX = interpolate(frame, [2, 14], [-700, 2020], { ...cl, easing: Easing.bezier(0.4, 0, 0.6, 1) });
  const sweepOp = interpolate(frame, [2, 5, 11, 14], [0, 0.16, 0.16, 0], cl);
  const stage = interpolate(frame, [42, 50, 58], [0, 0.6, 0.38], cl);
  const rule = interpolate(frame, [58, 70], [0, 1], { ...cl, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const ruleExt = interpolate(frame, [58, 66], [0, 1], { ...cl, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const ruleExtFade = interpolate(frame, [66, 72], [1, 0], cl);
  const tag = ramp(frame, 68, 12, EASE.out);
  const spacing = interpolate(frame, [62, 66], [0.0, 0.02], { ...cl, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const press = (delay: number) => interpolate(frame, [delay, delay + 8], [0, 1], { ...cl, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
  let li = 0;
  return (
    <AbsoluteFill style={{ background: '#03060d' }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <AbsoluteFill style={{ transform: `perspective(1400px) rotateX(${camTilt}deg) scale(${camScale})`, transformOrigin: '50% 45%' }}>
          {/* background: the park at dusk, sliding out of focus */}
          <Footage clip="cine" src={() => 80 + frame * 0.2} blend scale={1.05} style={{ filter: `blur(${blur}px) brightness(0.55)` }} />
          <AbsoluteFill style={{ background: 'radial-gradient(1200px 800px at 50% 46%, rgba(5,10,22,0.35), rgba(5,10,22,0.7) 70%, rgba(5,10,22,0.85))' }} />
          {ELS.map((el) => {
            if (frame < el.cue) return null;
            const posAt = (fr: number) => { const tt = interpolate(fr, [el.cue, el.cue + 12], [0, 1], { ...cl, easing: FLY_EASE }); return [el.dx * (1 - tt), el.dy * (1 - tt), tt]; };
            const [x, y, t] = posAt(frame);
            const op = interpolate(frame, [el.cue, el.cue + 3], [0, 1], cl) * (1 - 0.12 * recede);
            const rot = el.rot * (2 - t);
            const scale = 1.12 - 0.12 * t;
            const vx = velocity((fr) => posAt(fr)[0], frame), vy = velocity((fr) => posAt(fr)[1], frame);
            const land = interpolate(frame, [el.cue + 9, el.cue + 12, el.cue + 16], [0, 1, 0], cl);
            const air = Math.max(0, 1 - t);
            return (
              <SpeedBlur key={el.key} vx={vx} vy={vy} amount={0.3} max={22}>
                <div style={{
                  position: 'absolute', left: el.cx - el.w / 2, top: el.cy - el.h / 2, width: el.w, height: el.h,
                  transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale * (1 - 0.015 * land)})`,
                  borderRadius: el.photo ? 18 : 22, overflow: 'hidden', opacity: op, filter: `saturate(${1 - 0.08 * recede})`,
                  boxShadow: `0 ${10 + 26 * air - 5 * land}px ${24 + 46 * air - 12 * land}px rgba(0,0,0,${0.45 + 0.1 * air}), 0 2px 6px rgba(0,0,0,.3)`,
                  border: el.photo ? '6px solid #f4f8ff' : undefined, boxSizing: 'border-box',
                }}>
                  <Img src={el.img} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              </SpeedBlur>
            );
          })}
        </AbsoluteFill>
        {/* gold dust + bokeh */}
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {DUST.map((d, i) => {
            const y = (((d.y0 - frame * d.rise) % 1080) + 1080) % 1080, x = d.x + Math.sin(frame * d.swayFreq + d.phase) * d.swayAmp;
            const tw = 0.7 + 0.3 * Math.sin(frame * 0.21 + d.phase * 3);
            return <div key={i} style={{ position: 'absolute', left: x, top: y, width: d.size, height: d.size, borderRadius: '50%', background: '#ffd36b', opacity: d.opacity * tw, boxShadow: `0 0 ${d.size * 2.5}px ${d.size * 0.6}px rgba(255,211,107,0.6)` }} />;
          })}
          {BOKEH.map((b, i) => {
            const y = (((b.y0 - frame * b.rise) % 1180) + 1180) % 1180 - 50;
            return <div key={`b${i}`} style={{ position: 'absolute', left: b.x, top: y, width: b.size, height: b.size, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,222,140,0.9) 0%, rgba(255,222,140,0.35) 55%, rgba(255,222,140,0) 72%)', opacity: b.opacity, filter: 'blur(2px)' }} />;
          })}
        </AbsoluteFill>
        {sweepOp > 0 && (
          <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: sweepX - 300, width: 600, background: 'linear-gradient(90deg, rgba(150,210,255,0), rgba(150,210,255,1) 50%, rgba(150,210,255,0))', opacity: sweepOp }} />
          </AbsoluteFill>
        )}
        {stage > 0 && <AbsoluteFill style={{ background: `radial-gradient(760px 380px at 960px 500px, ${alpha('#0b1a36', 0.95)}, ${alpha('#0b1a36', 0.6)} 55%, rgba(11,26,54,0) 78%)`, opacity: Math.min(1, stage * 1.6) }} />}
        {stage > 0 && <AbsoluteFill style={{ background: `radial-gradient(620px 300px at 960px 470px, ${alpha(C.acc, 0.5)}, ${alpha(C.acc, 0)} 70%)`, opacity: stage }} />}
        {/* wordmark sign-off */}
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', transform: 'translateY(-30px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', font: `italic 900 150px ${FONT.display}`, lineHeight: 1.1, letterSpacing: `${spacing}em`, color: C.ink, textShadow: '0 10px 40px rgba(0,0,0,0.55)' }}>
              {(() => { const t = press(38); return <div style={{ marginRight: 40, opacity: t, transform: `translateY(${(1 - t) * 28}px) scale(${1.35 - 0.35 * t})`, filter: t < 0.995 ? `blur(${(1 - t) * 8}px)` : undefined }}><LogoMark size={150} /></div>; })()}
              {WORD.split('').map((ch, k) => {
                if (ch === ' ') return <span key={k} style={{ width: 44 }} />;
                const t = press(Math.round(42 + li++ * 1.8));
                const lab = k > 7;
                return <span key={k} style={{
                  display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 28}px) scale(${1.35 - 0.35 * t})`, filter: t < 0.995 ? `blur(${(1 - t) * 8}px)` : undefined,
                  ...(lab ? { background: `linear-gradient(90deg, ${C.acc}, ${C.violet})`, backgroundSize: '300% 100%', backgroundPosition: `${(k - 8) * 50}% 0`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textShadow: 'none' } : {}),
                }}>{ch}</span>;
              })}
            </div>
            <div style={{ position: 'relative', height: 7, width: 320, margin: '30px auto 0' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: `linear-gradient(90deg, ${C.acc}, ${C.violet})`, transform: `scaleX(${rule})` }} />
              {ruleExt > 0 && ruleExtFade > 0 && <>
                <div style={{ position: 'absolute', top: 3, height: 1.5, right: '100%', width: 190 * ruleExt, background: C.acc, opacity: ruleExtFade }} />
                <div style={{ position: 'absolute', top: 3, height: 1.5, left: '100%', width: 190 * ruleExt, background: C.violet, opacity: ruleExtFade }} />
              </>}
            </div>
            <div style={{ font: `800 44px ${FONT.ui}`, color: C.ink, marginTop: 34, letterSpacing: '0.04em', opacity: tag, transform: `translateY(${(1 - tag) * 8}px)`, textShadow: '0 4px 20px rgba(0,0,0,.6)' }}>
              Free <span style={{ color: C.acc }}>·</span> Plays in your browser <span style={{ color: C.acc }}>·</span> Works on iPhone
            </div>
          </div>
        </AbsoluteFill>
        <Grain opacity={0.05} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
