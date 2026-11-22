const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + e.stack));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + require('path').resolve(__dirname, '..', 'neon-arcade.html'));
  await page.waitForTimeout(300);
  const res = await page.evaluate(() => {
    const A = window.__arcade, out = {};
    const [BR, DU, SE, SW] = A.games;
    // ---- Breakout: perfect-ish bot
    A.shell.play(BR, null);
    let maxLevel = 0, frames = 0, nanSeen = false, lastLevel = -1, levelFrames = 0;
    for (; frames < 200000 && A.shell.state === 'PLAYING'; frames++) {
      const S = BR.debug();
      maxLevel = Math.max(maxLevel, S.level);
      let target = null, best = -1;
      for (const b of S.balls) { if (isNaN(b.x) || isNaN(b.y)) nanSeen = true; if (!b.stuck && b.dy > 0 && b.y > best) { best = b.y; target = b.x; } }
      if (target == null && S.balls[0]) target = S.balls[0].x;
      let aimOff = 0;
      const tb = S.bricks.length ? S.bricks.reduce((a, b) => (b.y > a.y ? b : a)) : (S.boss ? { x: S.boss.x + 70, y: S.boss.y } : null);
      const lead = S.balls.find(b => !b.stuck && b.dy > 0 && b.x === target);
      if (tb && lead && lead.y > 380) { const a = Math.atan2(tb.x + 23 - lead.x, lead.y - tb.y); aimOff = -Math.max(-0.9, Math.min(0.9, a / 1.05)) * S.pw / 2; }
      if (target != null) { A.input.ptr.x = target + aimOff; A.input.ptr.moved = true; }
      if (S.level !== lastLevel) { lastLevel = S.level; levelFrames = 0; }
      if (++levelFrames === 1500 && S.level < 9) { S.bricks.splice(0, S.bricks.length - 1); }
      A.input.ptr.tap = frames % 20 === 0;
      A.tick();
    }
    const S = BR.debug();
    out.breakout = { state: A.shell.state, frames, maxLevel: maxLevel + 1, lives: S.lives, score: BR.score, bricksLeft: S.bricks.length, boss: !!S.boss, nanSeen, title: document.querySelector('#panel h1')?.textContent };
    // ---- Duel: bot tracks ball y, normal
    for (const mode of ['easy','normal','hard']) {
      A.shell.play(DU, mode);
      let f = 0;
      for (; f < 100000 && A.shell.state === 'PLAYING'; f++) {
        const S = DU.debug();
        A.input.ptr.y = S.ball.y + 8 * Math.sin(f / 13); A.input.ptr.moved = true;
        A.tick();
      }
      const S = DU.debug();
      out['duel_' + mode] = { state: A.shell.state, f, ps: S.ps, cs: S.cs, best: S.best, score: DU.score, title: document.querySelector('#panel h1')?.textContent };
    }
    // ---- Serpent: greedy bot
    for (const mode of ['classic','wrap','maze']) {
      A.shell.play(SE, mode);
      let f = 0;
      for (; f < 60000 && A.shell.state === 'PLAYING'; f++) {
        const S = SE.debug();
        if (S.q.length === 0 && S.food) {
          const h = S.snake[0], tgt = S.bonus || S.food;
          const opts = [['ArrowUp',0,-1],['ArrowDown',0,1],['ArrowLeft',-1,0],['ArrowRight',1,0]];
          const safe = (x,y) => { if (S.mode==='wrap'){x=(x+32)%32;y=(y+24)%24;} if(x<0||y<0||x>=32||y>=24) return false; if (S.walls.has(x+','+y)) return false; return !S.snake.slice(0,-1).some(p=>p.x===x&&p.y===y); };
          let bestK = null, bestD = 1e9;
          for (const [k,dx,dy] of opts) {
            if (dx === -S.dir[0] && dy === -S.dir[1]) continue;
            const nx=h.x+dx, ny=h.y+dy; if (!safe(nx,ny)) continue;
            const d = Math.abs(nx-tgt.x)+Math.abs(ny-tgt.y);
            if (d < bestD) { bestD = d; bestK = k; }
          }
          if (bestK) A.input.hit.add(bestK);
        }
        A.tick();
      }
      const S = SE.debug();
      out['serpent_' + mode] = { state: A.shell.state, f, len: S.snake.length, eaten: S.eaten, score: SE.score, grow: S.grow };
    }
    // ---- Swarm: dodge-ish bot (follow nearest enemy x, avoid bullets)
    A.shell.play(SW, null);
    let f = 0, maxWave = 0;
    for (; f < 120000 && A.shell.state === 'PLAYING'; f++) {
      const S = SW.debug();
      maxWave = Math.max(maxWave, S.wave);
      let tx = S.boss ? S.boss.x + S.boss.w / 2 : (S.enemies[0] ? S.enemies[0].x : 320);
      for (const b of S.eshots) if (b.y > 380 && Math.abs(b.x - S.x) < 30) tx = S.x + (b.x < S.x ? 60 : -60);
      A.input.ptr.x = tx; A.input.ptr.moved = true;
      A.tick();
    }
    const S2 = SW.debug();
    out.swarm = { state: A.shell.state, f, maxWave, score: SW.score, lives: S2.lives };
    // ---- pause/resume + hub
    A.shell.play(BR, null); A.tick(); A.shell.pause(); const p1 = A.shell.state; A.shell.resume(); const p2 = A.shell.state; A.shell.hub();
    out.pause = [p1, p2, A.shell.state];
    out.bests = A.games.map(g => [g.id, A.shell.getBest(g)]);
    return out;
  });
  for (const k in res) console.log(k, JSON.stringify(res[k]));
  console.log('ERRORS', errors);
  await browser.close();
})();
