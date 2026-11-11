/* CIRCUIT — power routing. Rotate tiles to connect the source to every terminal. Seeded spanning-tree generation (always solvable),
   locked tiles, surges (telegraphed), overload fuses. Tap = rotate, hold / CCW mode = rotate back. Fully touch + keyboard. */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h;
  const N_ = 1, E_ = 2, S_ = 4, W_ = 8;
  const DIRS = [[0, -1, N_, S_], [1, 0, E_, W_], [0, 1, S_, N_], [-1, 0, W_, E_]]; // dx, dy, bit, opposite bit
  const rotM = (m, r) => { r = ((r % 4) + 4) % 4; return r ? (((m << r) | (m >> (4 - r))) & 15) : m; };
  const COL = { on: '#4d9cff', off: '#474e58', g: '#3fb96b', a: '#e0a63a', r: '#ef5b5b', v: '#a997f6' };

  C.mg.register({
    id: 'circuit', name: 'CIRCUIT', icon: '⌁',
    blurb: 'Reroute the power grid before the surges scramble it.',
    info: {
      goal: 'Rotate the tiles so power flows from the source ◉ to every terminal ◎. Keep the ⚡ fuses un-powered or they overload.',
      controls: ['Click a tile to rotate it clockwise · right-click or Q to rotate back', 'Arrow keys move the cursor, Space rotates', 'Warning flickers mean a surge is about to scramble that tile', 'Padlocked tiles are already correct'],
      touch: ['Tap a tile to rotate it · hold to rotate the other way (or use the ↻ / ↺ mode button)', 'Warning flickers mean a surge is about to scramble that tile', 'Padlocked tiles are already correct', 'Keep ⚡ fuses un-powered'],
    },
    create(host) {
      const d = host.params.difficulty, bonus = host.params.bonus, v0 = host.view();
      const fx = new C.fx.Particles(), txt = new C.fx.Texts();

      // ---------------------------------------------------------------- grid size from difficulty + stage aspect
      const n = C.clamp(Math.round(3.6 + d * 0.42), 4, 9);
      const availW = Math.max(300, v0.w - 12), availH = Math.max(220, v0.h - 52), ratio = availW / availH;
      const maxCols = Math.max(4, Math.min(12, Math.floor(availW / 38))), maxRows = Math.max(4, Math.min(10, Math.floor(availH / 38)));
      let rows = C.clamp(Math.round(n / Math.sqrt(ratio)), Math.min(5, maxRows), maxRows);
      let cols = C.clamp(Math.round(n * n * 1.05 / rows), 4, maxCols);
      const NN = cols * rows;
      const idx = (x, y) => y * cols + x, xy = (i) => [i % cols, (i / cols) | 0];

      // ---------------------------------------------------------------- generation
      const base = new Uint8Array(NN), rot = new Int8Array(NN), solRot = new Int8Array(NN), locked = new Uint8Array(NN);
      const role = new Array(NN).fill('void'); // void tree src term decoy fuse
      let source = 0, terms = [];
      function genTree() {
        // randomized DFS spanning tree
        const adj = Array.from({ length: NN }, () => 0), seen = new Uint8Array(NN);
        const start = host.randInt(0, NN - 1); const stack = [start]; seen[start] = 1;
        while (stack.length) {
          const c = stack[stack.length - 1], [cx, cy] = xy(c);
          const opts = host.shuffle([0, 1, 2, 3]).filter((k) => { const nx = cx + DIRS[k][0], ny = cy + DIRS[k][1]; return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[idx(nx, ny)]; });
          if (!opts.length) { stack.pop(); continue; }
          const k = opts[0], nx = cx + DIRS[k][0], ny = cy + DIRS[k][1], nb = idx(nx, ny);
          adj[c] |= DIRS[k][2]; adj[nb] |= DIRS[k][3]; seen[nb] = 1; stack.push(nb);
        }
        const deg = (m) => ((m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1));
        const leaves = []; for (let i = 0; i < NN; i++) if (deg(adj[i]) === 1) leaves.push(i);
        // source = a random cell; terminals = spread-out leaves
        source = host.randInt(0, NN - 1);
        const want = C.clamp(Math.round(1.6 + d * 0.42), 2, 8);
        const cand = leaves.filter((l) => l !== source);
        const dist = (a, b) => { const [ax, ay] = xy(a), [bx, by] = xy(b); return Math.abs(ax - bx) + Math.abs(ay - by); };
        terms = [];
        while (terms.length < Math.min(want, cand.length)) {
          let best = -1, bs = -1;
          host.shuffle(cand.filter((c) => !terms.includes(c))).slice(0, 8).forEach((c) => { const sc = Math.min(dist(c, source), ...terms.map((t) => dist(c, t))) + host.rand() * 1.5; if (sc > bs) { bs = sc; best = c; } });
          terms.push(best);
        }
        // prune branches that lead to nothing
        const keep = new Uint8Array(NN).fill(1); let ch = true;
        while (ch) {
          ch = false;
          for (let i = 0; i < NN; i++) if (keep[i] && i !== source && !terms.includes(i)) {
            let k = 0, last = -1; const [cx, cy] = xy(i);
            for (let q = 0; q < 4; q++) if (adj[i] & DIRS[q][2]) { const nb = idx(cx + DIRS[q][0], cy + DIRS[q][1]); if (keep[nb]) { k++; last = q; } }
            if (k <= 1) { keep[i] = 0; ch = true; if (last >= 0) { const nb = idx(cx + DIRS[last][0], cy + DIRS[last][1]); adj[nb] &= ~DIRS[last][3]; } adj[i] = 0; }
          }
        }
        return { adj, keep };
      }
      const shapeBase = (m) => { const dg = ((m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1)); return dg === 1 ? 1 : dg === 4 ? 15 : dg === 3 ? 11 : ((m === 5 || m === 10) ? 5 : 3); };
      function build() {
        const { adj, keep } = genTree();
        for (let i = 0; i < NN; i++) {
          if (!keep[i]) continue;
          const sm = adj[i]; base[i] = shapeBase(sm);
          for (let r = 0; r < 4; r++) if (rotM(base[i], r) === sm) { solRot[i] = r; break; }
          role[i] = i === source ? 'src' : terms.includes(i) ? 'term' : 'tree';
        }
        // locked tiles (already correct)
        const treeCells = []; for (let i = 0; i < NN; i++) if (role[i] === 'tree') treeCells.push(i);
        const nLock = d < 4 ? 0 : Math.min(Math.floor(treeCells.length * 0.28), Math.round((d - 3) * 0.75));
        host.shuffle(treeCells.slice()).filter((i) => base[i] !== 15).slice(0, nLock).forEach((i) => { locked[i] = 1; });
        // decoys + fuses
        const pd = C.clamp(0.22 + d * 0.04, 0.22, 0.7);
        const nearTree = (i) => { const [cx, cy] = xy(i); return DIRS.some((dd) => { const nx = cx + dd[0], ny = cy + dd[1]; return nx >= 0 && ny >= 0 && nx < cols && ny < rows && role[idx(nx, ny)] !== 'void' && role[idx(nx, ny)] !== 'decoy' && role[idx(nx, ny)] !== 'fuse'; });
        };
        const voids = []; for (let i = 0; i < NN; i++) if (role[i] === 'void') voids.push(i);
        const nFuse = d < 6 ? 0 : Math.min(4, Math.floor((d - 4) / 2.2));
        host.shuffle(voids.filter(nearTree)).slice(0, nFuse).forEach((i) => { role[i] = 'fuse'; base[i] = host.pick([3, 11, 5]); });
        voids.forEach((i) => { if (role[i] === 'void' && host.rand() < pd) { role[i] = 'decoy'; base[i] = host.pick([5, 3, 3, 11, 1]); } });
        // scramble
        for (let i = 0; i < NN; i++) { if (role[i] === 'void') continue; rot[i] = locked[i] ? solRot[i] : host.randInt(0, 3); }
      }
      const curMask = (i) => rotM(base[i], rot[i]);
      function flood() {
        const dist = new Int16Array(NN).fill(-1); dist[source] = 0; const q = [source];
        for (let qi = 0; qi < q.length; qi++) {
          const c = q[qi], m = curMask(c), [cx, cy] = xy(c);
          for (let k = 0; k < 4; k++) if (m & DIRS[k][2]) {
            const nx = cx + DIRS[k][0], ny = cy + DIRS[k][1]; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const nb = idx(nx, ny); if (role[nb] === 'void' || dist[nb] >= 0) continue;
            if (curMask(nb) & DIRS[k][3]) { dist[nb] = dist[c] + 1; q.push(nb); }
          }
        }
        return dist;
      }
      let tries = 0;
      do { role.fill('void'); base.fill(0); rot.fill(0); solRot.fill(0); locked.fill(0); build(); tries++; } while (tries < 12 && (terms.length < 2 || flood().filter((x, i) => terms.includes(i) && x >= 0).length === terms.length));
      // par (rotation count)
      let par = 0;
      for (let i = 0; i < NN; i++) if ((role[i] === 'tree' || role[i] === 'term' || role[i] === 'src') && !locked[i]) {
        let best = 9; for (let s = 0; s < 4; s++) if (rotM(base[i], s) === rotM(base[i], solRot[i])) { const df = ((s - rot[i]) % 4 + 4) % 4; best = Math.min(best, Math.min(df, 4 - df)); }
        par += best;
      }
      par = Math.max(1, par);

      // ---------------------------------------------------------------- state
      let started = false, over = false, won = false, mode = 'cw', rotations = 0, overloads = 0, surgesHit = 0, hintsUsed = 0;
      const timeMax = (36 + terms.length * 6 + NN * 1.1) * (1 + bonus.time), grace = 7;
      let timeLeft = timeMax, freezeT = 0, shieldN = 0, surgeT = grace, tNow = 0, winT = 0;
      const surgeEvery = () => C.clamp(19 - (d - 3) * 1.15, 6.5, 19);
      const surgeOn = d >= 3;
      const warn = new Float32Array(NN), warnSteps = new Int8Array(NN), fuseT = new Float32Array(NN), hintT = new Float32Array(NN), shake = new Float32Array(NN), litAt = new Float32Array(NN).fill(1e9);
      const visAng = new Float32Array(NN), tgtAng = new Float32Array(NN); for (let i = 0; i < NN; i++) { visAng[i] = tgtAng[i] = rot[i] * Math.PI / 2; }
      let dist = flood(); let cur = source, press = null;
      const lit = (i) => dist[i] >= 0 && tNow >= litAt[i];
      function reflood() {
        const old = dist; dist = flood();
        for (let i = 0; i < NN; i++) { if (dist[i] >= 0 && old[i] < 0) litAt[i] = tNow + dist[i] * 0.04; else if (dist[i] < 0) litAt[i] = 1e9; }
        updBar();
      }
      for (let i = 0; i < NN; i++) if (dist[i] >= 0) litAt[i] = 0;

      // ---------------------------------------------------------------- DOM
      host.css(`.ci{position:absolute;inset:0;display:flex;flex-direction:column;touch-action:none}.ci-cv{flex:1;min-height:0;position:relative}
        .ci-bar{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;justify-content:space-between;padding:6px 14px;border-top:1px solid var(--ln);background:rgba(25,28,31,.92);font-family:var(--ff-ui);font-size:12px;color:var(--d)}
        .ci-bar b{color:var(--t)}.ci-mode{display:flex}.ci-mode button{min-width:72px}.ci-mode button.on{--bc:var(--c);--bt:var(--c);background:rgba(77,156,255,.15)}.ci-bar .w{color:var(--a)}`);
      const wrap = h('div', { class: 'ci' }), cvBox = h('div', { class: 'ci-cv' });
      const leftEl = h('span'), rightEl = h('span');
      const bCW = h('button', { class: 'btn sm on', onclick: () => setMode('cw') }, '↻ CW'), bCCW = h('button', { class: 'btn sm', onclick: () => setMode('ccw') }, '↺ CCW');
      wrap.append(cvBox, h('div', { class: 'ci-bar' }, leftEl, h('div', { class: 'ci-mode' }, bCW, bCCW), rightEl)); host.root.append(wrap);
      function setMode(m) { mode = m; bCW.classList.toggle('on', m === 'cw'); bCCW.classList.toggle('on', m === 'ccw'); host.sfx('click'); }
      function updBar() {
        const got = terms.filter((t) => dist[t] >= 0).length;
        leftEl.innerHTML = `ROTATIONS <b>${rotations}</b> · PAR <b>${par}</b>${shieldN ? ` · <b style="color:var(--c)">⬡ ×${shieldN}</b>` : ''}`;
        rightEl.innerHTML = `${surgeOn ? `SURGE <b class="${surgeT < 3 && freezeT <= 0 ? 'w' : ''}">${freezeT > 0 ? 'FROZEN' : Math.max(0, Math.ceil(surgeT)) + 's'}</b> · ` : ''}POWERED <b>${got}/${terms.length}</b>`;
      }

      // ---------------------------------------------------------------- layout
      let cv, W = 0, H = 0, cs = 40, ox = 0, oy = 0;
      cv = host.autoCanvas(cvBox, (w, hh) => { W = w; H = hh; cs = Math.floor(Math.min((W - 8) / cols, (H - 8) / rows)); ox = Math.floor((W - cs * cols) / 2); oy = Math.floor((H - cs * rows) / 2); });
      const ctx = cv.ctx, canvas = cv.canvas;
      const center = (i) => { const [x, y] = xy(i); return { x: ox + (x + 0.5) * cs, y: oy + (y + 0.5) * cs }; };

      // ---------------------------------------------------------------- actions
      function rotate(i, dir) {
        if (!host.active || won || role[i] === 'void') return;
        if (locked[i]) { shake[i] = 0.3; host.sfx('bad'); C.haptic(15); host.setStatus('That tile is locked in place.', 'warn'); return; }
        rot[i] = ((rot[i] + dir) % 4 + 4) % 4; tgtAng[i] += dir * Math.PI / 2; rotations++;
        host.sfx('click'); C.haptic(6);
        const c = center(i); fx.burst(c.x, c.y, '#4d9cff', 5, 70, 0.3);
        if (hintT[i] > 0) hintT[i] = 0;
        reflood(); checkWin(true);
      }
      function checkWin(announce) {
        if (won || over) return;
        if (terms.every((t) => dist[t] >= 0)) {
          won = true; winT = 0; host.sfx('success'); host.setStatus('GRID ONLINE', 'good');
          terms.forEach((t) => { const c = center(t); fx.burst(c.x, c.y, COL.g, 26, 220); });
          host.after(1000, () => {
            over = true;
            const eff = C.clamp(par / Math.max(par, rotations), 0.2, 1);
            const sc = C.clamp(0.38 + 0.34 * eff + 0.22 * (timeLeft / timeMax) + 0.06 - 0.05 * overloads - 0.04 * hintsUsed, 0.3, 1);
            host.finish({ success: true, score: sc, stats: { Rotations: `${rotations}/${par} par`, Overloads: overloads, 'Surges hit': surgesHit, Time: C.fmt.time(timeMax - timeLeft) } });
          });
        }
      }
      function lose(why) { if (over) return; over = true; host.setStatus(why, 'bad'); host.sfx('fail'); host.finish({ success: false, score: 0, stats: { Reason: why, Powered: `${terms.filter((t) => dist[t] >= 0).length}/${terms.length}` } }); }
      function fireSurge() {
        const cells = []; for (let i = 0; i < NN; i++) if (role[i] !== 'void' && !locked[i] && role[i] !== 'src') cells.push(i);
        if (!cells.length) return;
        const poweredCells = cells.filter((i) => dist[i] >= 0);
        const k = d >= 10 ? 3 : d >= 6 ? 2 : 1;
        for (let j = 0; j < k; j++) {
          const pool = (host.rand() < 0.7 && poweredCells.length) ? poweredCells : cells;
          const i = host.pick(pool); if (warn[i] > 0) continue;
          warn[i] = 1.1; warnSteps[i] = host.randInt(1, 3);
        }
        host.sfx('warn');
      }
      function applySurge(i) {
        if (shieldN > 0) { shieldN--; const c = center(i); fx.burst(c.x, c.y, '#4d9cff', 18, 160); txt.add(c.x, c.y, 'ABSORBED', '#4d9cff', 13); host.sfx('good'); updBar(); return; }
        rot[i] = (rot[i] + warnSteps[i]) % 4; tgtAng[i] += warnSteps[i] * Math.PI / 2; surgesHit++;
        const c = center(i); fx.burst(c.x, c.y, '#e0a63a', 16, 190); host.sfx('zap'); shake[i] = 0.25;
        reflood();
      }

      // ---------------------------------------------------------------- input
      const tileAt = (e) => { const p = host.pointer(e, canvas), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs); return x >= 0 && y >= 0 && x < cols && y < rows ? idx(x, y) : -1; };
      host.listen(canvas, 'contextmenu', (e) => e.preventDefault());
      host.listen(canvas, 'pointerdown', (e) => {
        if (!host.active) return; e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
        const i = tileAt(e); if (i < 0 || role[i] === 'void') return; cur = i;
        if (e.button === 2) { rotate(i, -1); return; }
        press = { i, t: performance.now(), x: e.clientX, y: e.clientY, long: false };
      });
      host.listen(canvas, 'pointermove', (e) => { if (e.pointerType !== 'touch') { const i = tileAt(e); if (i >= 0) cur = i; } if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 14) press = null; });
      host.listen(canvas, 'pointerup', (e) => {
        if (!press) return; const pr = press; press = null; if (pr.long || !host.active) return;
        if (tileAt(e) !== pr.i) return; rotate(pr.i, mode === 'cw' ? 1 : -1);
      });
      host.listen(canvas, 'pointercancel', () => { press = null; });
      host.listen(window, 'keydown', (e) => {
        if (!host.active) return; const k = e.key; let [cx, cy] = xy(cur);
        if (k === 'ArrowLeft') cx = Math.max(0, cx - 1); else if (k === 'ArrowRight') cx = Math.min(cols - 1, cx + 1); else if (k === 'ArrowUp') cy = Math.max(0, cy - 1); else if (k === 'ArrowDown') cy = Math.min(rows - 1, cy + 1);
        else if (k === ' ' || k === 'Enter' || k.toLowerCase() === 'e') { e.preventDefault(); rotate(cur, 1); return; } else if (k.toLowerCase() === 'q') { rotate(cur, -1); return; } else return;
        e.preventDefault(); cur = idx(cx, cy);
      });

      // ---------------------------------------------------------------- drawing
      function conduit(m, col, w, off, glow) {
        ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w;
        if (glow) { ctx.shadowColor = col; ctx.shadowBlur = 0; }
        ctx.beginPath();
        for (let k = 0; k < 4; k++) if (m & DIRS[k][2]) { ctx.moveTo(0, 0); ctx.lineTo(DIRS[k][0] * cs * 0.5, DIRS[k][1] * cs * 0.5); }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      function drawTile(i, t) {
        const [gx, gy] = xy(i), r = role[i]; if (r === 'void') return;
        const x = ox + gx * cs, y = oy + gy * cs, c = center(i), on = lit(i), isFuse = r === 'fuse';
        const sx = shake[i] > 0 ? Math.sin(t * 80) * 2.5 : 0;
        ctx.save(); ctx.translate(c.x + sx, c.y);
        // tile plate
        const half = cs / 2 - 2;
        ctx.fillStyle = on ? 'rgba(77,156,255,.07)' : '#1b1e22'; ctx.fillRect(-half, -half, half * 2, half * 2);
        ctx.strokeStyle = locked[i] ? 'rgba(224,166,58,.55)' : (cur === i && host.active && !C.isTouch ? 'rgba(77,156,255,.8)' : 'rgba(71,79,89,.8)'); ctx.lineWidth = locked[i] || cur === i ? 1.6 : 1; ctx.strokeRect(-half + .5, -half + .5, half * 2 - 1, half * 2 - 1);
        // rotated conduits
        ctx.rotate(visAng[i]);
        const w = Math.max(4, cs * 0.14);
        conduit(base[i], on ? 'rgba(77,156,255,.30)' : '#353b42', w + 4, 0, 0);
        conduit(base[i], on ? (isFuse ? '#e0a63a' : COL.on) : (isFuse ? '#4b535d' : COL.off), w, 0, on ? 12 : 0);
        if (on) { ctx.setLineDash([cs * 0.1, cs * 0.18]); ctx.lineDashOffset = -t * cs * 0.9; conduit(base[i], '#b6d6ff', Math.max(1.5, w * 0.3), 0, 0); ctx.setLineDash([]); }
        ctx.restore();
        ctx.save(); ctx.translate(c.x + sx, c.y);
        // node hub / role marks
        if (r === 'src') {
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.26, 0, 6.3); ctx.fillStyle = '#1e2125'; ctx.fill(); ctx.strokeStyle = COL.g; ctx.lineWidth = 2.5; ctx.shadowColor = COL.g; ctx.shadowBlur = 0; ctx.stroke(); ctx.shadowBlur = 0;
          ctx.fillStyle = COL.g; ctx.font = `700 ${Math.floor(cs * 0.32)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚡', 0, 1);
        } else if (r === 'term') {
          const R = cs * 0.24; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.3); ctx.fillStyle = on ? 'rgba(63,185,107,.3)' : '#1b1e22'; ctx.fill();
          ctx.strokeStyle = on ? COL.g : COL.a; ctx.lineWidth = 2.5; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 0; ctx.stroke(); ctx.shadowBlur = 0;
          ctx.fillStyle = on ? COL.g : COL.a; ctx.font = `700 ${Math.floor(cs * 0.28)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(on ? '✓' : '◎', 0, 1);
        } else if (isFuse) {
          const k = Math.min(1, fuseT[i] / 2.4);
          ctx.fillStyle = '#1c1e22'; ctx.beginPath(); ctx.arc(0, 0, cs * 0.2, 0, 6.3); ctx.fill();
          ctx.strokeStyle = k > 0 ? COL.r : COL.a; ctx.lineWidth = 2; ctx.stroke();
          if (k > 0) { ctx.strokeStyle = COL.r; ctx.lineWidth = 3; ctx.shadowColor = COL.r; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(0, 0, cs * 0.3, -1.57, -1.57 + k * 6.28); ctx.stroke(); ctx.shadowBlur = 0; }
          ctx.fillStyle = k > 0 ? COL.r : COL.a; ctx.font = `700 ${Math.floor(cs * 0.26)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚡', 0, 1);
        } else {
          ctx.beginPath(); ctx.arc(0, 0, Math.max(3, cs * 0.075), 0, 6.3); ctx.fillStyle = on ? '#94c4ff' : '#4b535e'; ctx.fill();
        }
        if (locked[i]) { const lx = cs / 2 - 11, ly = -cs / 2 + 10; ctx.fillStyle = COL.a; ctx.fillRect(lx - 4, ly - 1, 8, 6); ctx.strokeStyle = COL.a; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(lx, ly - 1, 2.6, Math.PI, 0); ctx.stroke(); }
        // surge warning
        if (warn[i] > 0) {
          const f = Math.sin(t * 36) > 0;
          ctx.strokeStyle = f ? COL.a : '#49505b'; ctx.lineWidth = 3; ctx.strokeRect(-half, -half, half * 2, half * 2);
          ctx.fillStyle = COL.a; ctx.font = `700 ${Math.floor(cs * 0.3)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, -cs * 0.34);
        }
        if (hintT[i] > 0) { ctx.strokeStyle = `rgba(56,255,160,${0.4 + 0.5 * Math.sin(t * 8)})`; ctx.lineWidth = 3; ctx.strokeRect(-half - 2, -half - 2, half * 2 + 4, half * 2 + 4); }
        if (press && press.i === i && !press.long && host.active) { const k = Math.min(1, (performance.now() - press.t) / 380); ctx.strokeStyle = '#d96bb0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, cs * 0.36, -1.57, -1.57 + k * 6.28); ctx.stroke(); }
        ctx.restore();
      }
      function draw(dt, t) {
        tNow = t;
        if (!W) return;
        ctx.clearRect(0, 0, W, H);
        // timers
        if (started && !over && !won) {
          if (freezeT > 0) freezeT -= dt; else timeLeft -= dt;
          host.setTimer(timeLeft); if (timeLeft <= 0) lose('GRID TIMEOUT');
          if (surgeOn && freezeT <= 0) { surgeT -= dt; if (surgeT <= 0) { fireSurge(); surgeT = surgeEvery() * (0.85 + host.rand() * 0.3); } }
          if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) updBar();
        }
        if (press && !press.long && host.active && performance.now() - press.t > 380) { press.long = true; rotate(press.i, mode === 'cw' ? -1 : 1); }
        for (let i = 0; i < NN; i++) {
          if (role[i] === 'void') continue;
          visAng[i] += (tgtAng[i] - visAng[i]) * (1 - Math.exp(-dt * 24));
          if (shake[i] > 0) shake[i] -= dt; if (hintT[i] > 0) hintT[i] -= dt;
          if (warn[i] > 0) { warn[i] -= dt; if (warn[i] <= 0) { warn[i] = 0; if (!over && !won) applySurge(i); } }
          if (role[i] === 'fuse' && started && !over && !won) {
            if (dist[i] >= 0) { fuseT[i] += dt; if (fuseT[i] >= 2.4) { const c = center(i);
              if (shieldN > 0) { shieldN--; fuseT[i] = 0; fx.burst(c.x, c.y, '#4d9cff', 18, 150); txt.add(c.x, c.y, 'ABSORBED', '#4d9cff', 13); host.sfx('good'); updBar(); }
              else { overloads++; host.penalty(4, 'overload'); host.sfx('bad'); fx.burst(c.x, c.y, '#ef5b5b', 30, 240); txt.add(c.x, c.y, 'OVERLOAD', '#ef5b5b', 15); role[i] = 'void'; reflood(); } } }
            else fuseT[i] = Math.max(0, fuseT[i] - dt * 2);
          }
        }
        // ambient sparks on powered tiles
        if (Math.random() < dt * 14) { const pc = []; for (let i = 0; i < NN; i++) if (dist[i] >= 0 && lit(i)) pc.push(i); if (pc.length) { const c = center(pc[(Math.random() * pc.length) | 0]); fx.burst(c.x + (Math.random() - .5) * cs * .5, c.y + (Math.random() - .5) * cs * .5, '#7bb5ff', 1, 40, 0.35); } }
        for (let i = 0; i < NN; i++) drawTile(i, t);
        if (freezeT > 0) { ctx.fillStyle = 'rgba(77,156,255,.06)'; ctx.fillRect(0, 0, W, H); }
        if (won) { winT += dt; ctx.fillStyle = `rgba(56,255,160,${Math.max(0, 0.16 - winT * 0.16)})`; ctx.fillRect(0, 0, W, H); }
        fx.update(dt); fx.draw(ctx); txt.update(dt); txt.draw(ctx);
      }
      host.loop(draw);
      updBar();

      return {
        start() { started = true; host.setTimer(timeLeft); host.setStatus(C.isTouch ? 'Tap to rotate · hold to rotate back' : 'Click / Space to rotate · right-click / Q back', ''); },
        tool(id) {
          if (over || won) return false;
          if (id === 'hint') {
            const wrongs = []; for (let i = 0; i < NN; i++) if ((role[i] === 'tree' || role[i] === 'term' || role[i] === 'src') && !locked[i] && curMask(i) !== rotM(base[i], solRot[i])) wrongs.push(i);
            if (!wrongs.length) return false;
            // prefer the wrong tile closest to the already-powered area
            wrongs.sort((a, b) => { const na = nearestPower(a), nb = nearestPower(b); return na - nb; });
            const i = wrongs[0]; let s = 0; for (let k = 0; k < 4; k++) if (rotM(base[i], k) === rotM(base[i], solRot[i])) { s = k; break; }
            let df = ((s - rot[i]) % 4 + 4) % 4; if (df === 3) df = -1; if (df === 2) df = 2;
            rot[i] = s; tgtAng[i] += df * Math.PI / 2; hintT[i] = 3; hintsUsed++;
            const c = center(i); fx.burst(c.x, c.y, COL.g, 20, 140); host.sfx('good'); host.setStatus('Oracle rotated a tile into place.', 'good');
            reflood(); checkWin(true); return true;
          }
          if (id === 'freeze') { freezeT += 8; timeLeft += 5; host.sfx('good'); host.setStatus('Chronos: surges and clock frozen 8 s (+5 s)', 'good'); updBar(); return true; }
          if (id === 'shield') { if (shieldN >= 2) return false; shieldN++; host.sfx('good'); host.setStatus('Aegis armed: absorbs the next surge or overload.', 'good'); updBar(); return true; }
          return false;
        },
        onFinish() { over = true; },
        debug: {
          solve() { for (let i = 0; i < NN; i++) if (role[i] !== 'void' && !locked[i] && (role[i] === 'tree' || role[i] === 'term' || role[i] === 'src')) { let df = ((solRot[i] - rot[i]) % 4 + 4) % 4; rot[i] = solRot[i]; tgtAng[i] += df * Math.PI / 2; } reflood(); checkWin(true); },
          fail() { lose('POWER FAILURE'); },
          info() { return { cols, rows, terminals: terms.length, par, locked: locked.reduce((a, b) => a + b, 0), fuses: role.filter((r) => r === 'fuse').length, solvedAtStart: terms.every((t) => dist[t] >= 0) }; },
          nextWrong() { for (let i = 0; i < NN; i++) if ((role[i] === 'tree' || role[i] === 'term' || role[i] === 'src') && !locked[i] && curMask(i) !== rotM(base[i], solRot[i])) { const c = center(i), r = canvas.getBoundingClientRect(); let df = ((solRot[i] - rot[i]) % 4 + 4) % 4; return { i, x: r.left + c.x, y: r.top + c.y, steps: df }; } return null; },
          clients() { const r = canvas.getBoundingClientRect(); return { l: r.left + ox, t: r.top + oy, cs, cols, rows }; },
        },
      };
      function nearestPower(i) { const [ax, ay] = xy(i); let best = 99; for (let j = 0; j < NN; j++) if (dist[j] >= 0) { const [bx, by] = xy(j); best = Math.min(best, Math.abs(ax - bx) + Math.abs(ay - by)); } return best; }
    },
  });
})();
