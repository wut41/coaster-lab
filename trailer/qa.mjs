// QA stills: bundle once, render a list of frames → out/qa/f<frame>.jpg
// usage: node qa.mjs 4 13 200 ...   (add --props='{"bgm":false}' style args not needed for stills)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const composition = await selectComposition({ serveUrl, id: 'Trailer', inputProps: { bgm: true }, browserExecutable });
for (const frame of frames) {
  await renderStill({ composition, serveUrl, frame, output: `out/qa/f${String(frame).padStart(4, '0')}.jpg`, imageFormat: 'jpeg', jpegQuality: 88, inputProps: { bgm: true }, browserExecutable, chromiumOptions: { gl: 'angle' } });
  console.log('still', frame);
}
