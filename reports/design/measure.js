// Design-review helpers: tap-target sizes and real-pixel text contrast for a root element.
// Contrast is measured from pixels: text is made transparent, the page is screenshotted, and the
// background under each text run is sampled, so gradients, translucent panels and the 3D scene count.
const fs = require('fs');

async function targets(page, root) {
  return page.evaluate(root => {
    const R = document.querySelector(root); if (!R) return { err: 'no root ' + root };
    const sel = 'button,a[href],input:not([type=hidden]),select,textarea,[role=button],[tabindex="0"],summary,label.tg7';
    const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[hidden]'); };
    const out = [];
    R.querySelectorAll(sel).forEach(e => {
      if (!vis(e)) return;
      if (e.tagName === 'INPUT' && e.closest('label.tg7')) return; // measured via label
      const r = e.getBoundingClientRect();
      let hit = { w: r.width, h: r.height };
      if (e.tagName === 'INPUT' && e.type === 'range') { const s = getComputedStyle(e); hit.h = r.height; }
      const lbl = (e.getAttribute('aria-label') || e.textContent || e.value || e.dataset.v || e.id || e.className || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      out.push({ lbl, tag: e.tagName.toLowerCase(), id: e.id || undefined, cls: (typeof e.className === 'string' ? e.className : '').slice(0, 40) || undefined, data: Object.keys(e.dataset).map(k => k + '=' + e.dataset[k]).join(' ').slice(0, 50) || undefined, w: Math.round(hit.w), h: Math.round(hit.h), x: Math.round(r.x), y: Math.round(r.y), small: hit.w < 44 || hit.h < 44 });
    });
    return out;
  }, root);
}

async function contrast(page, root, shotPath) {
  const items = await page.evaluate(root => {
    const R = document.querySelector(root); if (!R) return [];
    const out = []; let i = 0;
    const tw = document.createTreeWalker(R, NodeFilter.SHOW_TEXT, { acceptNode: n => /[A-Za-z0-9]/.test(n.nodeValue) ? 1 : 2 });
    let n; while ((n = tw.nextNode())) {
      const e = n.parentElement; if (!e || e.closest('[hidden],svg,textarea,option,script,style')) continue;
      const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const rs = [...rg.getClientRects()].filter(r => r.width > 2 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth);
      if (!rs.length) continue;
      let op = 1; for (let p = e; p; p = p.parentElement) op *= +getComputedStyle(p).opacity;
      const disabled = !!e.closest('button:disabled,[disabled],input:disabled');
      out.push({ i: i++, txt: n.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 50), col: s.color, fill: s.webkitTextFillColor, op, fs: parseFloat(s.fontSize), fw: +s.fontWeight || 400, disabled, el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').join('.') : ''), rects: rs.slice(0, 3).map(r => [r.x, r.y, r.width, r.height]) });
    }
    return out;
  }, root);
  if (!items.length) return [];
  const st = await page.addStyleTag({ content: '*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important;transition:none!important}' });
  await page.waitForTimeout(120);
  const buf = await page.screenshot();
  if (shotPath) fs.writeFileSync(shotPath, buf);
  await st.evaluate(n => n.remove());
  const res = await page.evaluate(async ([b64, items]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const sx = img.width / innerWidth;
    const parse = s => { const m = s.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m[3] == null ? 1 : m[3]]; };
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    const L = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
    return items.map(it => {
      // sample background pixels inside the text rects; take the median luminance colour
      const px = [];
      it.rects.forEach(([rx, ry, rw, rh]) => {
        const X0 = Math.max(0, Math.floor(rx * sx)), Y0 = Math.max(0, Math.floor(ry * sx)), W = Math.max(1, Math.min(img.width - X0, Math.ceil(rw * sx))), H = Math.max(1, Math.min(img.height - Y0, Math.ceil(rh * sx)));
        const d = x.getImageData(X0, Y0, W, H).data; const step = Math.max(1, Math.floor(d.length / 4 / 400));
        for (let k = 0; k < d.length / 4; k += step) px.push([d[k * 4], d[k * 4 + 1], d[k * 4 + 2]]);
      });
      px.sort((a, b) => L(a) - L(b));
      const med = px[Math.floor(px.length / 2)], lo = px[0], hi = px[px.length - 1];
      let fg = parse(it.fill && it.fill !== it.col && !/rgba\(0, 0, 0, 0\)/.test(it.fill) ? it.fill : it.col); const a = fg[3] * it.op;
      const comp = bg => [0, 1, 2].map(k => fg[k] * a + bg[k] * (1 - a));
      const cr = bg => { const l1 = L(comp(bg)), l2 = L(bg); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
      const large = it.fs >= 24 || (it.fs >= 18.66 && it.fw >= 700);
      const ratio = +cr(med).toFixed(2), worst = +Math.min(cr(lo), cr(hi), cr(med)).toFixed(2);
      return { txt: it.txt, el: it.el, fs: it.fs, fw: it.fw, fg: it.fill && it.fill !== it.col ? it.fill : it.col, op: +it.op.toFixed(2), bg: 'rgb(' + med.join(',') + ')', ratio, worst, large, disabled: it.disabled, need: large ? 3 : 4.5, fail: ratio < (large ? 3 : 4.5) };
    });
  }, [buf.toString('base64'), items]);
  return res;
}

async function overflow(page, root) {
  return page.evaluate(root => {
    const R = document.querySelector(root); if (!R) return null;
    const out = { root: { sw: R.scrollWidth, cw: R.clientWidth, sh: R.scrollHeight, ch: R.clientHeight }, hClip: [], offscreen: [] };
    R.querySelectorAll('*').forEach(e => {
      if (e.closest('[hidden],svg')) return; const s = getComputedStyle(e); if (s.display === 'none') return;
      if (e.scrollWidth > e.clientWidth + 2 && (s.overflowX === 'hidden' || s.textOverflow === 'ellipsis' || s.overflow === 'hidden') && e.clientWidth > 0 && e.textContent.trim()) out.hClip.push({ el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ').join('.'), txt: e.textContent.trim().slice(0, 40), sw: e.scrollWidth, cw: e.clientWidth });
      const r = e.getBoundingClientRect(); if (r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && s.position !== 'fixed' && !e.closest('[style*="overflow"]')) out.offscreen.push({ el: e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0], l: Math.round(r.left), r: Math.round(r.right), txt: e.textContent.trim().slice(0, 30) });
    });
    out.hClip = out.hClip.slice(0, 20); out.offscreen = out.offscreen.slice(0, 20);
    return out;
  }, root);
}

async function audit(page, name, root, dir, extra = {}) {
  const shot = dir + name + '.png';
  await page.screenshot({ path: shot });
  const t = await targets(page, root), c = await contrast(page, root, null), o = await overflow(page, root);
  const rep = { name, root, shot, targets: t, smallTargets: Array.isArray(t) ? t.filter(x => x.small) : t, contrastFails: c.filter(x => x.fail && !x.disabled), contrastAll: c, overflow: o, ...extra };
  fs.writeFileSync(dir + name + '.json', JSON.stringify(rep, null, 1));
  console.log(`[${name}] targets ${Array.isArray(t) ? t.length : t.err} (small ${rep.smallTargets.length}) · text runs ${c.length} (contrast fails ${rep.contrastFails.length})`);
  return rep;
}
module.exports = { targets, contrast, overflow, audit };
