// Helpers for the My Park tests: find a free spot for something, and route a path to it with the game's own rules.
// They run inside the page (pass them to page.evaluate) and use only the test hooks.
module.exports = {
  // try anchors around (ci, cj) until the thing fits; returns the build result
  place: ([key, ci, cj, rad]) => { const T = window.__coasterDebug.v80.v10.ty; for (let r = 0; r <= rad; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; for (let rot = 0; rot < 4; rot++) { const x = T.build(key, ci + di, cj + dj, rot); if (x.ok) return { ...x, i: ci + di, j: cj + dj, r: rot } } } return { ok: false } },
  // breadth-first search over free, owned tiles from any existing path tile to a tile next to the object's queue
  // area; lays the path and returns how many tiles it used
  connect: ([id]) => { const D = window.__coasterDebug.v80.v10, T = D.ty, G = 48, info = D.tyGrid(id); if (!info) return -1; const { free, path, goal } = info, prev = new Int32Array(G * G).fill(-2), q = []; for (let k = 0; k < G * G; k++) if (path[k]) { prev[k] = -1; q.push(k) }
    let end = -1; for (let h = 0; h < q.length; h++) { const k = q[h]; if (goal.includes(k)) { end = k; break } const i = k % G, j = (k - i) / G; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, z = j + b; if (x < 0 || z < 0 || x >= G || z >= G) continue; const n = z * G + x; if (prev[n] !== -2 || !free[n]) continue; prev[n] = k; q.push(n) } }
    if (end < 0) return -1; let n = 0; for (let k = end; k >= 0 && prev[k] !== -1; k = prev[k]) { T.path(k % G, Math.floor(k / G), k % G, Math.floor(k / G)); n++ } return n }
};
