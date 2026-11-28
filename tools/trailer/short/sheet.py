import sys, os
from PIL import Image, ImageDraw
d, out, step = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 3
first = int(sys.argv[4]) if len(sys.argv) > 4 else 0
fs = sorted(os.listdir(d))[first::step][:24]
cols = 8; rows = (len(fs) + cols - 1) // cols
c = Image.new('RGB', (cols * 180, rows * 320), 'black')
for k, f in enumerate(fs):
    im = Image.open(os.path.join(d, f)).resize((180, 320)); ImageDraw.Draw(im).text((4, 4), f[:4], fill='yellow')
    c.paste(im, ((k % cols) * 180, (k // cols) * 320))
c.save(out, quality=80)
