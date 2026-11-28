# Cuts the captured Coaster Lab footage into a 1080x1920, 30 fps, 15 s loopable YouTube Short with captions.
#   python3 -I compose.py <workdir with frames/ and music.wav> <cfg.json> <out.mp4> [--preview N,N,...]
import json, math, subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

D = sys.argv[1]; CFG = json.load(open(sys.argv[2])); OUT = sys.argv[3]
PREVIEW = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 and sys.argv[4] == '--preview' else None
W, H, FPS = 1080, 1920, 30
B = 60 / 128
NF = int(round(32 * B * FPS))            # 450 frames = 15 s
ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'src', 'v10', 'art')
FONT = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
EMOJI = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
YEL, RED, CYAN, ORANGE = '#FFD23F', '#FF4D4D', '#3FD8FF', '#FF8A3D'

# ---------- text with color emoji ----------
_fonts = {}
def font(sz):
    if sz not in _fonts: _fonts[sz] = ImageFont.truetype(FONT, sz)
    return _fonts[sz]
EF = ImageFont.truetype(EMOJI, 109)

def is_emoji(ch):
    o = ord(ch)
    return o >= 0x1F000 or 0x2600 <= o <= 0x27BF or o in (0xFE0F, 0x200D, 0x2B50, 0x2744)

def runs(s):
    out = []
    for ch in s:
        e = is_emoji(ch)
        if out and out[-1][0] == e: out[-1][1] += ch
        else: out.append([e, ch])
    return out

def emoji_img(s, sz):
    s = s.replace('️', '')
    ims = []
    for ch in s:
        if ch == '‍': continue
        im = Image.new('RGBA', (160, 160)); ImageDraw.Draw(im).text((0, 0), ch, font=EF, embedded_color=True)
        bb = im.getbbox() or (0, 0, 1, 1); im = im.crop(bb)
        k = sz * 1.05 / im.height; ims.append(im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS))
    w = sum(i.width for i in ims) + 6 * (len(ims) - 1); h = max(i.height for i in ims)
    c = Image.new('RGBA', (w, h)); x = 0
    for i in ims: c.alpha_composite(i, (x, (h - i.height) // 2)); x += i.width + 6
    return c

def line_img(segs, sz, stroke=None):
    """segs: list of (text, color). Returns RGBA of one line with black outline + soft shadow."""
    stroke = stroke if stroke is not None else max(6, sz // 9)
    f = font(sz)
    # lay out by advance width so spaces between colored runs look like normal spaces
    items, x = [], 0.0
    for text, col in segs:
        for e, chunk in runs(text):
            if e:
                em = emoji_img(chunk, sz); items.append(('e', x + sz * .06, em)); x += em.width + sz * .12
            else:
                items.append(('t', x, (chunk, col))); x += f.getlength(chunk)
    h = int(sz * 1.4) + 2 * stroke; pad = stroke + 8
    im = Image.new('RGBA', (int(x) + 2 * pad, h)); dr = ImageDraw.Draw(im)
    asc = f.getmetrics()[0]; base = (h - sz) // 2
    for k, px, v in items:
        if k == 't': dr.text((pad + px, base - (asc - sz) - sz * .08), v[0], font=f, fill=v[1], stroke_width=stroke, stroke_fill='#000000')
    for k, px, v in items:
        if k == 'e': im.alpha_composite(v, (int(pad + px), max(0, (h - v.height) // 2)))
    bb = im.getbbox(); im = im.crop((max(0, bb[0] - 2), 0, min(im.width, bb[2] + 2), h))
    # drop shadow
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sh.putalpha(im.getchannel('A').point(lambda a: a * .55))
    sh = sh.filter(ImageFilter.GaussianBlur(10))
    out = Image.new('RGBA', (im.width + 20, im.height + 24)); out.alpha_composite(sh, (10, 18)); out.alpha_composite(im, (6, 4))
    return out

def block(lines, sz, gap=-10):
    ims = [line_img(l, sz) for l in lines]
    w = max(i.width for i in ims); h = sum(i.height for i in ims) + gap * (len(ims) - 1)
    c = Image.new('RGBA', (w, h)); y = 0
    for i in ims: c.alpha_composite(i, ((w - i.width) // 2, y)); y += i.height + gap
    return c

def ease_out_back(x):
    c1 = 1.9; c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2

def pop(t, dur=.22):
    """scale and alpha for a caption that appeared t seconds ago"""
    if t < 0: return 0, 0
    x = min(1, t / dur)
    return max(.01, .55 + .45 * ease_out_back(x)), min(1, t / .07)

def paste_center(frame, im, cx, cy, scale=1.0, alpha=1.0):
    if alpha <= 0: return
    if abs(scale - 1) > .005: im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BILINEAR)
    if alpha < 1:
        a = im.getchannel('A').point(lambda v: int(v * alpha)); im = im.copy(); im.putalpha(a)
    frame.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

# ---------- footage ----------
_cache = {}
def src(shot, i):
    d = os.path.join(D, 'frames', shot); n = len(os.listdir(d))
    i = max(0, min(n - 1, int(i)))
    k = (shot, i)
    if k not in _cache:
        if len(_cache) > 40: _cache.clear()
        _cache[k] = Image.open(os.path.join(d, f'{i:04d}.jpg')).convert('RGB').resize((W, H), Image.LANCZOS)
    return _cache[k]

def srcf(shot, fi):
    """source frame at a fractional position: blends neighbours so slow motion stays smooth"""
    a = math.floor(fi); w = fi - a
    if w < .15: return src(shot, a)
    if w > .85: return src(shot, a + 1)
    return Image.blend(src(shot, a), src(shot, a + 1), w)

def zoomed(im, z, dx=0, dy=0):
    if z <= 1.001 and not dx and not dy: return im
    cw, ch = W / z, H / z
    x0 = (W - cw) / 2 + dx; y0 = (H - ch) / 2 + dy
    return im.transform((W, H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BILINEAR)

def shake(t, at, dur=.35, amp=22):
    dt = t - at
    if dt < 0 or dt > dur: return 0, 0
    k = amp * (1 - dt / dur) ** 2
    return k * math.sin(dt * 97), k * math.cos(dt * 71)

# ---------- segments ----------
SEG = CFG['segments']                                  # list of {shot | end, b0, b1, start, [sub]}
CAP = {}
for s in SEG:
    if 'cap' in s:
        c = block(s['cap'], s.get('capsz', 84))
        if c.width > 980: c = c.resize((980, int(c.height * 980 / c.width)), Image.LANCZOS)
        CAP[id(s)] = c
    if 'cap2' in s: CAP[('2', id(s))] = block(s['cap2']['lines'], s['cap2'].get('sz', 70))
CAP_Y = CFG.get('cap_y', 430)

# end card assets
logo = Image.open(f'{ART}/logo.webp').convert('RGBA')
logo = logo.resize((960, int(960 * logo.height / logo.width)), Image.LANCZOS)
glow = logo.copy().filter(ImageFilter.GaussianBlur(28)); glow = ImageEnhance.Brightness(glow).enhance(1.4)
def glowtext(text, sz, col, glowcol):
    im = line_img([(text, col)], sz, stroke=max(4, sz // 16))
    g = Image.new('RGBA', im.size, glowcol); g.putalpha(im.getchannel('A').filter(ImageFilter.GaussianBlur(22)))
    c = Image.new('RGBA', im.size); c.alpha_composite(g); c.alpha_composite(g); c.alpha_composite(im); return c
date_im = glowtext(CFG['end']['date'], 150, YEL, ORANGE)
sub1 = block([[(CFG['end']['line1'], '#FFFFFF')]], 60)
sub2 = block([[(CFG['end']['line2'], CYAN)]], 54)
end_bg = None

def end_frame(t, seg):
    global end_bg
    if end_bg is None:
        sh = seg['bgshot']; im = src(sh, seg['bgframe'])
        bg = im.filter(ImageFilter.GaussianBlur(22)); bg = ImageEnhance.Brightness(bg).enhance(.38)
        tint = Image.new('RGB', (W, H), '#0d0b26'); end_bg = Image.blend(bg, tint, .45).convert('RGBA')
    f = end_bg.copy()
    breath = 1 + .025 * math.sin(t * 4)
    s, a = pop(t, .3); paste_center(f, glow, W / 2, 720, s * breath, a * .9); paste_center(f, logo, W / 2, 720, s * breath, a)
    s, a = pop(t - .18, .25); paste_center(f, date_im, W / 2, 1110, s, a)
    s, a = pop(t - .36); paste_center(f, sub1, W / 2, 1265, s, a)
    s, a = pop(t - .52); paste_center(f, sub2, W / 2, 1370, s, a)
    return f

def frame(n):
    t = n / FPS
    seg = next(s for s in SEG if s['b0'] * B <= t + 1e-6 < s['b1'] * B)
    ts = t - seg['b0'] * B                                     # time since this segment's cut
    if seg.get('end'): return end_frame(ts, seg).convert('RGB')
    # which shot (sub-cuts inside a segment, e.g. the 3 quick ride shots)
    shot, start, speed = seg.get('shot'), seg.get('start', 0), seg.get('speed', 1)
    if 'sub' in seg:
        k = min(len(seg['sub']) - 1, int(ts / (seg['subb'] * B)))
        sb = seg['sub'][k]; shot, start = sb[0], sb[1]; ts_sh = ts - k * seg['subb'] * B
        speed = sb[2] if len(sb) > 2 else 1
    else: ts_sh = ts
    if 'map' in seg:                                           # keyframed time remap: [[seconds into segment, source frame], ...]
        km = seg['map']; j = max(k for k in range(len(km)) if km[k][0] <= ts_sh or k == 0)
        if j + 1 < len(km):
            (t0, f0), (t1, f1) = km[j], km[j + 1]; fi = f0 + (f1 - f0) * (ts_sh - t0) / (t1 - t0)
        else: fi = km[-1][1] + (ts_sh - km[-1][0]) * FPS
        im = srcf(shot, fi)
    else:
        im = srcf(shot, start + ts_sh * FPS * speed)
    # punch-in on every cut, ease out over .3 s
    z = 1 + .07 * max(0, 1 - ts_sh / .3) ** 2 + seg.get('zoom', 0)
    dx = dy = 0
    for hit in CFG.get('hits', []):
        sx, sy = shake(t, hit); dx += sx; dy += sy
    out = zoomed(im, z + (.02 if dx or dy else 0), dx, dy).convert('RGBA')
    for fl in CFG.get('flashes', []):                          # white flash
        if 0 <= t - fl < .1:
            a = int(150 * (1 - (t - fl) / .1)); out.alpha_composite(Image.new('RGBA', (W, H), (255, 255, 255, a)))
    if id(seg) in CAP:
        cap = CAP[id(seg)]
        if seg.get('nopop'): s, a = 1, 1
        else: s, a = pop(ts)
        for bump in seg.get('bumps', []):                      # caption pulses with the bass
            d = t - bump
            if 0 <= d < .25: s *= 1 + .12 * math.sin(math.pi * d / .25)
        paste_center(out, cap, W / 2, CAP_Y, s, a)
    if ('2', id(seg)) in CAP:
        c2 = seg['cap2']; s, a = pop(ts - c2['at'])
        paste_center(out, CAP[('2', id(seg))], W / 2, c2.get('y', CAP_Y + 150), s, a)
    return out.convert('RGB')

if PREVIEW:
    for n in PREVIEW: frame(n).save(f'{OUT}_{n:03d}.jpg', quality=88)
    sys.exit()

ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-i', os.path.join(D, CFG['music']), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
                       '-profile:v', 'high', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', '-shortest', OUT], stdin=subprocess.PIPE)
for n in range(NF):
    ff.stdin.write(frame(n).tobytes())
    if n % 50 == 0: print('frame', n, flush=True)
ff.stdin.close(); ff.wait(); print('done', OUT, ff.returncode)
