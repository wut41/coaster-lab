# Synthesizes the ~15 s hype track for the Coaster Lab short: 128 BPM, 8 bars, loops seamlessly.
# Beat map (b = one beat = 0.46875 s):
#   0-2b  riser + lift-chain clicks      2b  DROP (coaster tips over the crest)
#   7b cut to loop · 12b cut to crash (impact at CRASH_T) · 18b rides · 22.5b holiday · 27b end card · 32b loop point
import numpy as np, wave, sys

SR = 44100
BPM = 128
B = 60 / BPM
BARS = 8
N = int(round(BARS * 4 * B * SR))
CRASH_T = float(sys.argv[2]) if len(sys.argv) > 2 else 12 * B + 1.2
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)


def t_(dur): return np.arange(int(dur * SR)) / SR


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * (1 - max(pan, 0))
    R[i:i + len(sig)] += sig * gain * (1 + min(pan, 0))


def lp(x, a):  # one-pole low-pass, a in (0,1], smaller = darker
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s += a * (v - s); y[i] = s
    return y


def hp(x, a): return x - lp(x, a)


def kick(big=False):
    t = t_(0.5 if big else 0.32)
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * (5 if big else 9))
    click = rng.standard_normal(len(t)) * np.exp(-t * 300) * .3
    return np.tanh((body + click) * (1.8 if big else 1.4))


def clap():
    t = t_(0.25)
    n = rng.standard_normal(len(t))
    env = np.exp(-t * 22) + .5 * np.exp(-((t - .012) ** 2) / 1e-5) + .4 * np.exp(-((t - .024) ** 2) / 1e-5)
    return hp(n, .35) * env * .8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * .3


def hat(open_=False):
    t = t_(0.18 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), .9) * np.exp(-t * (14 if open_ else 80)) * .35


def crash_cym():
    t = t_(1.6)
    return hp(rng.standard_normal(len(t)), .7) * np.exp(-t * 2.6) * .5


def note(f, dur, kind='saw', det=0.0):
    t = t_(dur)
    if kind == 'sub':
        s = np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)
        return np.tanh(s * 1.6) * np.minimum(1, t / .005) * np.exp(-t * 1.2)
    out = 0
    for d in (-det, 0, det) if det else (0,):
        ph = (f * (1 + d) * t) % 1.0
        out = out + (2 * ph - 1)
    out = out / (3 if det else 1)
    env = np.minimum(1, t / .004) * np.exp(-t * 7)
    return lp(out, .22) * env


def whoosh(dur=0.45, up=True):
    t = t_(dur)
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * t / dur) ** 2
    # sweep a crude band by mixing two low-passes
    a = np.linspace(.03, .4, len(t)) if up else np.linspace(.4, .03, len(t))
    y = np.empty_like(n); s = 0.0
    for i, v in enumerate(n):
        s += a[i] * (v - s); y[i] = s
    return y * env * 1.4


def riser(dur):
    t = t_(dur)
    n = hp(rng.standard_normal(len(t)), .5) * (t / dur) ** 2 * .35
    f = 220 * 2 ** (t / dur * 2)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 1.5 * .18
    return n + tone


def chain_click():
    t = t_(.03)
    return hp(rng.standard_normal(len(t)), .6) * np.exp(-t * 250) * .5 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 300) * .2


def impact():
    t = t_(1.4)
    boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 3) + 30) / SR) * np.exp(-t * 3.5)
    crunch = lp(rng.standard_normal(len(t)), .25) * np.exp(-t * 9) * 1.2
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in ((523, 6), (811, 8), (1307, 11), (1977, 14))) * .12
    return np.tanh((boom * 1.4 + crunch + metal) * 1.3)


# F minor-ish progression, one chord per bar: Fm, Db, Ab, Eb
ROOTS = [43.65, 34.65, 51.91, 38.89]          # F1, Db1, Ab1, Eb1
CHORDS = [[349.2, 415.3, 523.3], [277.2, 349.2, 415.3], [415.3, 523.3, 622.3], [311.1, 392.0, 466.2]]

# --- intro (0-2b): riser + lift chain clicks, filtered so the drop hits hard
add(riser(2 * B), 0, .9)
for k in range(8):
    add(chain_click(), k * B / 4, .6, pan=.2 if k % 2 else -.2)

DROP = 2 * B
add(kick(big=True), DROP, 1.0); add(crash_cym(), DROP, .7); add(whoosh(.6, up=False), DROP - .05, .8)

total_beats = BARS * 4
for b in range(2, total_beats):
    at = b * B
    bar = b // 4
    in_crash_gap = 12 * B <= at < 12 * B + .01
    # drums
    add(kick(), at, .95)
    if b % 2 == 1: add(clap(), at, .55)
    add(hat(), at + B / 2, .5, pan=.3)
    if b % 4 == 3: add(hat(True), at + B / 2, .35, pan=-.3)
    # sub bass on the beat, octave bounce on the and
    root = ROOTS[bar % 4]
    add(note(root * 2, B * .9, 'sub'), at, .55)
    if b % 2 == 0: add(note(root * 4, B * .4, 'sub'), at + B * .75, .25)
    # supersaw stabs on off-beats
    for f in CHORDS[bar % 4]:
        add(note(f, B * .35, 'saw', det=.006), at + B / 2, .07, pan=-.25)
        add(note(f * 1.003, B * .35, 'saw', det=.006), at + B / 2, .07, pan=.25)

# pluck melody over bars 2-8: arpeggio in 8ths
for b in range(4, total_beats):
    bar = b // 4
    ch = CHORDS[bar % 4]
    for h in range(2):
        f = ch[(b * 2 + h) % 3] * 2
        add(note(f, B * .45, 'saw'), b * B + h * B / 2, .05, pan=.35 if h else -.35)

# transitions: whoosh into every cut, crash cymbal on big moments
for cut in (7, 12, 18, 22.5, 27):
    add(whoosh(.4), cut * B - .32, .55)
for cut in (12, 18, 27):
    add(crash_cym(), cut * B, .45)
add(impact(), CRASH_T, .9)
# end card: big hit, then a riser back into the loop's own intro riser
add(kick(big=True), 27 * B, .9)
add(riser(2 * B), 30 * B, .5)

mix = np.stack([L, R], 1)
# glue: gentle saturation + normalize to -1 dBFS
mix = np.tanh(mix * 1.1)
mix /= np.abs(mix).max() / 0.89
# 3 ms fades so the loop seam doesn't click
f = int(.003 * SR); ramp = np.linspace(0, 1, f)[:, None]
mix[:f] *= ramp; mix[-f:] *= ramp[::-1]
out = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(out, N / SR, 's')
