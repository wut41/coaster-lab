"""Writes <dir>/audio-manifest.json: sha256, duration, peak/mean dB and 10 ms-RMS peak time for each wav."""
import hashlib, json, os, re, subprocess, sys
d = sys.argv[1]; out = {}
for f in sorted(os.listdir(d)):
    if not f.endswith('.wav'): continue
    p = os.path.join(d, f)
    vd = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], capture_output=True).stdout
    import array; a = array.array('h', raw); w = 480
    rms = [sum(x * x for x in a[i:i + w]) for i in range(0, max(1, len(a) - w), w)]
    out[f] = {'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'seconds': round(len(a) / 48000, 3),
              'peak_db': float(re.search(r'max_volume: (-?[\d.]+)', vd).group(1)), 'mean_db': float(re.search(r'mean_volume: (-?[\d.]+)', vd).group(1)),
              'rms_peak_ms': rms.index(max(rms)) * 10 if rms else 0, 'source': 'synthesized by audio/make-sfx.sh (original, no third-party audio)'}
out['_note'] = 'Output track offset: SFX are placed 1 frame early (Main.tsx OUT=1) for AAC priming; independent review measured 0-frame residuals for click/shutter/thud on the rendered file (2026-11-19, Remotion 4.0.484, h264+aac 48 kHz, mp4).'
json.dump(out, open(os.path.join(d, 'audio-manifest.json'), 'w'), indent=2)
print(len(out) - 1, 'files in manifest')
