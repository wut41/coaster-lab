for (const f of process.argv.slice(2)) { let r; try { r = require("./" + f + ".json") } catch (e) { console.log("missing", f); continue }
  console.log("== " + f); (r.smallTargets || []).forEach(t => console.log("  T", t.w + "x" + t.h, t.tag, t.id || "", t.data || "", JSON.stringify(t.lbl)));
  r.contrastFails.forEach(c => console.log("  C", c.ratio, "worst", c.worst, c.fs + "px", c.fw, c.fg, "op", c.op, "on", c.bg, c.el, JSON.stringify(c.txt)));
  if (r.overflow) { if (r.overflow.hClip.length) console.log("  clip", JSON.stringify(r.overflow.hClip)); if (r.overflow.offscreen.length) console.log("  off", JSON.stringify(r.overflow.offscreen.slice(0, 5))) } }
