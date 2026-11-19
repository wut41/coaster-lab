"""Kick-drum grid of the BGM (numpy only): low-passed energy envelope → onset peaks → least-squares beat grid.
usage: python3 -I audio/beats.py public/audio/bgm/cat-walk.mp3 [t0 t1]"""
import json, subprocess, sys
import numpy as np
src = sys.argv[1]; t0 = float(sys.argv[2]) if len(sys.argv) > 2 else 0; t1 = float(sys.argv[3]) if len(sys.argv) > 3 else 1e9
SR = 11025
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-af', 'lowpass=f=140,lowpass=f=140', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32)
hop = SR // 200  # 5 ms
env = np.sqrt(np.convolve(x * x, np.ones(hop * 4) / (hop * 4), 'same'))[::hop]
d = np.maximum(0, np.diff(env, prepend=env[0]))
thr = np.percentile(d, 97)
cand = [i for i in range(2, len(d) - 2) if d[i] > thr and d[i] == d[i - 2:i + 3].max()]
peaks = []
for i in cand:  # 200 ms refractory: one onset per kick
    if peaks and (i - peaks[-1]) * hop / SR < 0.2:
        if d[i] > d[peaks[-1]]: peaks[-1] = i
        continue
    peaks.append(i)
times = np.array([p * hop / SR for p in peaks]); times = times[(times >= t0) & (times <= t1)]
# fit a beat grid: period from median spacing, phase by least squares
# grid search period (120–135 BPM) and phase for the most onsets within 25 ms, then refine by least squares
best = None
for bpm in np.arange(120, 135, 0.02):
    P = 60 / bpm
    for ph in np.arange(0, P, 0.005):
        r = (times - t0 - ph) % P; r = np.minimum(r, P - r)
        sc = int((r < 0.025).sum())
        if best is None or sc > best[0]: best = (sc, P, t0 + ph)
_, T, ph0 = best
k = np.round((times - ph0) / T)
keep = np.abs(times - (ph0 + k * T)) < 0.04
times, k = times[keep], k[keep]
A = np.vstack([k, np.ones_like(k)]).T
T, ph = np.linalg.lstsq(A, times, rcond=None)[0]
res = times - (ph + k * T)
print(json.dumps({'bpm': round(60 / T, 3), 'period': round(T, 5), 'phase': round(ph, 4), 'kicks': len(times),
                  'fit_rms_ms': round(float(np.sqrt(np.mean(res ** 2))) * 1000, 1), 'first_kicks': [round(t, 3) for t in times[:6]]}))
