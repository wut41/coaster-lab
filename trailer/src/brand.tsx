// Coaster Lab brand system, taken from coaster_lab_v8_6.html (see DESIGN-SPEC.md §1).
import React from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

// Fonts are bundled in public/fonts (downloaded from Google Fonts by the build, Open Font License),
// so renders never depend on the network. Rendering waits until every face has loaded.
const FACES: [string, string, string, string][] = [
  ['Exo 2', 'Exo2-800i.ttf', '800', 'italic'], ['Exo 2', 'Exo2-900i.ttf', '900', 'italic'],
  ['Exo 2', 'Exo2-800.ttf', '800', 'normal'], ['Exo 2', 'Exo2-900.ttf', '900', 'normal'],
  ['Nunito Sans', 'NunitoSans-600.ttf', '600', 'normal'], ['Nunito Sans', 'NunitoSans-700.ttf', '700', 'normal'],
  ['Nunito Sans', 'NunitoSans-800.ttf', '800', 'normal'],
];
if (typeof document !== 'undefined') {
  // CSS @font-face too, so the faces are always declared even if a FontFace promise stalls
  const css = FACES.map(([fam, file, weight, style]) =>
    `@font-face{font-family:'${fam}';src:url(${staticFile(`fonts/${file}`)}) format('truetype');font-weight:${weight};font-style:${style};font-display:block}`).join('');
  const tag = document.createElement('style'); tag.textContent = css; document.head.appendChild(tag);
  const handle = delayRender('Loading Coaster Lab fonts', { timeoutInMilliseconds: 90000, retries: 2 });
  const load = (attempt: number): Promise<void> => Promise.all(FACES.map(([fam, , weight, style]) =>
    document.fonts.load(`${style} ${weight} 40px '${fam}'`))).then((r) => {
      const missing = r.filter((x) => x.length === 0).length;
      if (missing && attempt < 20) return new Promise<void>((res) => setTimeout(res, 500)).then(() => load(attempt + 1));
    });
  load(0).then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });
}

export const FONT = {
  display: `'Exo 2', 'Nunito Sans', sans-serif`,
  ui: `'Nunito Sans', ui-sans-serif, system-ui, sans-serif`,
};

export const C = {
  acc: '#36a7ff',
  violet: '#c48bff',
  logo2: '#7b5cff',
  ink: '#f4f8ff',
  ink2: '#a9bbd6',
  gold: '#ffc233',
  danger: '#ff6b6b',
  ok: '#4ade80',
  glass: 'rgba(9,20,39,0.78)',
  glass2: 'rgba(10,16,30,0.86)',
  line: 'rgba(255,255,255,0.12)',
  night: '#050a16',
  sky: '#9fd3fb',
};

export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// "Bold & energetic" motion tokens (DESIGN-SPEC §1)
export const MOTION = { dur: 18, overshoot: 1.12, squash: 0.25 };

// Logo tile: the game's own coaster-swoosh mark (same SVG path as .logoMark in the game)
export const LogoMark: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.297, flex: 'none',
      background: `linear-gradient(140deg, ${C.acc}, ${C.logo2})`,
      display: 'grid', placeItems: 'center',
      boxShadow: `0 ${size * 0.08}px ${size * 0.22}px ${alpha(C.acc, 0.45)}, inset 0 1px 0 rgba(255,255,255,.4)`,
      ...style,
    }}
  >
    <svg viewBox="0 0 48 48" width={size * 0.62} height={size * 0.62}>
      <path d="M4 36 H12 C17 36 16 14 24 14 C29 14 31 22 28 27 C25 32 18 29 20 23 C22 16 30 12 36 22 C39 28 40 36 44 36" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 41 H44" stroke="rgba(255,255,255,.55)" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  </div>
);

// Dark glass surface used by every overlay (matches the game's panels)
export const glass = (radius = 28): React.CSSProperties => ({
  background: `linear-gradient(180deg, rgba(22,32,54,0.82), ${C.glass2})`,
  border: `1.5px solid ${C.line}`,
  borderRadius: radius,
  boxShadow: '0 24px 60px -18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.10)',
  backdropFilter: 'blur(14px)',
  color: C.ink,
});
