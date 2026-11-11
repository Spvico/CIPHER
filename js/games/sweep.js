/* HONEYPOT SWEEP — minesweeper reimagined: solver-verified fair boards, data fragments, touch (tap / long-press flag / mode toggle) */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h;
  const NUMCOL = ['', '#4d9cff', '#3fb96b', '#e0a63a', '#a997f6', '#d96bb0', '#ef5b5b', '#ffffff', '#b8bec6'];

  C.mg.register({
    id: 'sweep', name: 'HONEYPOT SWEEP', icon: '●',
    blurb: 'Reveal every safe memory cell. The honeypots are watching.',
    info: {
      goal: 'Numbers count adjacent honeypots. Reveal all safe cells. Gold cells are data fragments: grab them for score.',
      controls: ['Left click: reveal · Right click / F / Shift+click: flag', 'Click a satisfied number (or middle-click) to reveal its neighbours', 'A honeypot costs a life and trace, not the whole run'],
      touch: ['Tap a cell to dig, hold to plant a flag (or switch the DIG/FLAG mode button)', 'Tap a satisfied number to reveal its neighbours', 'A honeypot costs a life and trace, not the whole run'],
    },
    create(host) {
      const d = host.params.difficulty, bonus = host.params.bonus;
      const v = host.view();
      const root = host.root;
      host.css(`.sw{position:absolute;inset:0;display:flex;flex-direction:column;touch-action:none}.sw-cv{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}
        .sw-bar{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:6px 14px;border-top:1px solid var(--ln);background:rgba(25,28,31,.9);font-family:var(--ff-ui);font-size:12px;color:var(--d)}
        .sw-bar b{color:var(--t)}.sw-mode{display:flex}.sw-mode button{min-width:84px}.sw-mode button.on{--bc:var(--c);--bt:var(--c);background:rgba(77,156,255,.15)}`);
      const wrap = h('div', { class: 'sw' }), cvBox = h('div', { class: 'sw-cv' });
      const minesEl = h('b'), livesInfo = h('span');
      let mode = 'dig';
      const bDig = h('button', { class: 'btn sm on', onclick: () => setMode('dig') }, '⛏ DIG'), bFlag = h('button', { class: 'btn sm', onclick: () => setMode('flag') }, '⚑ FLAG');
      const bar = h('div', { class: 'sw-bar' }, h('span', 'HONEYPOTS LEFT ', minesEl), h('div', { class: 'sw-mode' }, bDig, bFlag), livesInfo);
      wrap.append(cvBox, bar); root.append(wrap);
      function setMode(m) { mode = m; bDig.classList.toggle('on', m === 'dig'); bFlag.classList.toggle('on', m === 'flag'); host.sfx('click'); }

      // ---- board size from difficulty + stage aspect
      const cells = Math.round(64 + (d - 1) * 22), density = Math.min(0.2, 0.12 + d * 0.0075);
      const availW = Math.max(300, v.w - 20), availH = Math.max(200, v.h - 56);
      const ratio = availW / availH;
      let cols = Math.round(Math.sqrt(cells * ratio)), rows = Math.ceil(cells / cols);
      const maxCols = Math.floor(availW / (v.narrow ? 25 : 30)), maxRows = Math.floor(availH / (v.narrow ? 25 : 30));
      cols = C.clamp(cols, 6, maxCols); rows = C.clamp(rows, 6, maxRows);
      const N = cols * rows, mineCount = Math.min(Math.round(N * density), N - 12);
      const LW = Math.round(availW), LH = Math.round(availH);
      const { canvas, ctx } = host.makeCanvas(LW, LH, cvBox);
      const cs = Math.floor(Math.min((LW - 10) / cols, (LH - 10) / rows));
      const ox = Math.floor((LW - cs * cols) / 2), oy = Math.floor((LH - cs * rows) / 2);

      const mine = new Uint8Array(N), num = new Uint8Array(N), rev = new Uint8Array(N), flag = new Uint8Array(N), data = new Uint8Array(N), bombShown = new Uint8Array(N);
      const revT = new Float32Array(N); // reveal anim start time
      const nbrs = []; for (let i = 0; i < N; i++) { const x = i % cols, y = (i / cols) | 0, a = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) a.push(ny * cols + nx); } nbrs.push(a); }
      let generated = false, lives = 3 + bonus.lives, maxLives = lives, over = false, started = false, shield = 0, freezeT = 0, revealed = 0, hits = 0, dataGot = 0, dataTotal = 0, safeTotal = N - mineCount;
      let timeLeft = (60 + N * 0.7) * (1 + bonus.time), timeMax = timeLeft, shakeT = 0, flagsPlaced = 0;
      const fx = new C.fx.Particles(), txt = new C.fx.Texts();
      let press = null, hover = -1, tNow = 0;

      // ---- generation + solver
      function solverSolvable(first) {
        const known = new Int8Array(N); // 0 unknown, 1 safe(revealed), 2 mine
        const stack = [first]; const vis = new Uint8Array(N);
        const open = (i) => { const q = [i]; while (q.length) { const c = q.pop(); if (known[c] === 1) continue; known[c] = 1; if (num[c] === 0) nbrs[c].forEach((n) => { if (known[n] !== 1) q.push(n); }); } };
        open(first);
        let prog = true;
        while (prog) {
          prog = false;
          const cons = [];
          for (let i = 0; i < N; i++) if (known[i] === 1 && num[i] > 0) {
            const U = [], m = []; let k = num[i];
            nbrs[i].forEach((n) => { if (known[n] === 0) U.push(n); else if (known[n] === 2) k--; });
            if (!U.length) continue;
            if (k === 0) { U.forEach((n) => open(n)); prog = true; } else if (k === U.length) { U.forEach((n) => { known[n] = 2; }); prog = true; } else cons.push({ U, k });
          }
          if (prog) continue;
          for (let a = 0; a < cons.length && !prog; a++) for (let b = 0; b < cons.length && !prog; b++) {
            if (a === b) continue; const A = cons[a], B = cons[b];
            if (A.U.length >= B.U.length) continue; if (!A.U.every((x) => B.U.includes(x))) continue;
            const diff = B.U.filter((x) => !A.U.includes(x)), dk = B.k - A.k;
            if (dk === 0) { diff.forEach((n) => open(n)); prog = true; } else if (dk === diff.length) { diff.forEach((n) => { known[n] = 2; }); prog = true; }
          }
        }
        for (let i = 0; i < N; i++) if (!mine[i] && known[i] !== 1) return false;
        return true;
      }
      function generate(first) {
        const forbid = new Set([first, ...nbrs[first]]);
        const tries = d <= 8 ? 80 : d <= 11 ? 40 : 14;
        for (let t = 0; t < tries; t++) {
          mine.fill(0); num.fill(0);
          const pool = []; for (let i = 0; i < N; i++) if (!forbid.has(i)) pool.push(i);
          host.shuffle(pool).slice(0, mineCount).forEach((i) => { mine[i] = 1; });
          for (let i = 0; i < N; i++) if (!mine[i]) num[i] = nbrs[i].reduce((a, n) => a + mine[n], 0);
          if (solverSolvable(first)) break;
        }
        // data fragments on safe, non-start cells
        const safe = []; for (let i = 0; i < N; i++) if (!mine[i] && !forbid.has(i) && num[i] > 0) safe.push(i);
        host.shuffle(safe).slice(0, Math.min(safe.length, 3 + Math.floor(d / 3))).forEach((i) => { data[i] = 1; dataTotal++; });
        generated = true;
      }

      // ---- actions
      function reveal(i, delay) {
        if (rev[i] || flag[i] || over) return;
        if (!generated) generate(i);
        if (mine[i]) return hitMine(i);
        const q = [[i, 0]];
        while (q.length) {
          const [c, dist] = q.shift(); if (rev[c] || flag[c]) continue;
          rev[c] = 1; revealed++; revT[c] = tNow + (delay || 0) + dist * 0.035;
          if (data[c]) { dataGot++; host.sfx('coin'); txt.add(ox + (c % cols + 0.5) * cs, oy + (((c / cols) | 0) + 0.5) * cs, '+DATA', '#e0a63a', 16); fx.burst(ox + (c % cols + 0.5) * cs, oy + (((c / cols) | 0) + 0.5) * cs, '#e0a63a', 14, 140); }
          if (num[c] === 0) nbrs[c].forEach((n) => { if (!rev[n] && !flag[n]) q.push([n, dist + 1]); });
        }
        host.sfx('tick'); host.setProgress(revealed / safeTotal);
        if (revealed >= safeTotal) win();
      }
      function hitMine(i) {
        const cx = ox + (i % cols + 0.5) * cs, cy = oy + (((i / cols) | 0) + 0.5) * cs;
        flag[i] = 1; bombShown[i] = 1; flagsPlaced++;
        if (shield > 0) { shield--; host.setStatus('Aegis absorbed the honeypot hit.', 'good'); host.sfx('good'); fx.burst(cx, cy, '#4d9cff', 20, 160); updInfo(); return; }
        lives--; hits++; shakeT = 0.35; host.penalty(4 + d * 0.15, 'honeypot'); host.sfx('bad'); fx.burst(cx, cy, '#ef5b5b', 26, 220); txt.add(cx, cy, 'HONEYPOT!', '#ef5b5b', 18);
        host.setLives(lives, maxLives); updInfo();
        if (lives <= 0) lose('HONEYPOTS TRIGGERED');
      }
      function toggleFlag(i) {
        if (rev[i] || over || bombShown[i]) return;
        flag[i] ^= 1; flagsPlaced += flag[i] ? 1 : -1; host.sfx('click'); C.haptic(12); updInfo();
      }
      function chord(i) {
        if (!rev[i] || num[i] === 0) return;
        const f = nbrs[i].reduce((a, n) => a + flag[n], 0); if (f !== num[i]) return;
        let any = false; nbrs[i].forEach((n) => { if (!rev[n] && !flag[n]) { reveal(n); any = true; } });
        if (any) host.sfx('whoosh');
      }
      function updInfo() { minesEl.textContent = String(Math.max(0, mineCount - flagsPlaced)); livesInfo.innerHTML = `LIVES <b>${lives}</b> · DATA <b>${dataGot}/${dataTotal || '?'}</b>${shield ? ' · <b style="color:var(--c)">⬡ SHIELD</b>' : ''}`; }
      function win() {
        if (over) return; over = true; host.sfx('success');
        for (let i = 0; i < N; i++) if (mine[i] && !flag[i]) { flag[i] = 1; }
        const sc = C.clamp(0.45 + 0.25 * (lives / maxLives) + 0.15 * (timeLeft / timeMax) + 0.15 * (dataTotal ? dataGot / dataTotal : 1) - 0.02 * hits, 0.3, 1);
        host.finish({ success: true, score: sc, stats: { Honeypots: hits, 'Data fragments': `${dataGot}/${dataTotal}`, Board: `${cols}×${rows}` } });
      }
      function lose(why) { if (over) return; over = true; for (let i = 0; i < N; i++) if (mine[i]) bombShown[i] = 1; host.setStatus(why, 'bad'); host.sfx('fail'); host.finish({ success: false, score: 0, stats: { Reason: why } }); }

      // ---- input
      const cellAt = (e) => { const p = host.pointer(e, canvas), x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs); return x >= 0 && y >= 0 && x < cols && y < rows ? y * cols + x : -1; };
      host.listen(canvas, 'contextmenu', (e) => e.preventDefault());
      host.listen(canvas, 'pointerdown', (e) => {
        if (!host.active) return; e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
        const i = cellAt(e); if (i < 0) return;
        if (e.button === 2) { toggleFlag(i); return; }
        if (e.button === 1) { chord(i); return; }
        press = { i, t: performance.now(), x: e.clientX, y: e.clientY, long: false, id: e.pointerId };
      });
      host.listen(canvas, 'pointermove', (e) => { hover = cellAt(e); if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 12) press = null; });
      host.listen(canvas, 'pointerup', (e) => {
        if (!press || !host.active) { press = null; return; }
        const pr = press; press = null; if (pr.long) return;
        const i = cellAt(e); if (i !== pr.i) return;
        if (e.shiftKey) { toggleFlag(i); return; }
        if (rev[i]) { chord(i); return; }
        if (mode === 'flag') toggleFlag(i); else reveal(i);
      });
      host.listen(canvas, 'pointercancel', () => { press = null; });
      host.listen(window, 'keydown', (e) => { if (!host.active) return; if (e.key.toLowerCase() === 'f' && hover >= 0) { toggleFlag(hover); } else if (e.key === ' ') { e.preventDefault(); setMode(mode === 'dig' ? 'flag' : 'dig'); } });

      // ---- draw
      function draw(dt, t) {
        tNow = t;
        ctx.clearRect(0, 0, LW, LH);
        ctx.save();
        if (shakeT > 0) { shakeT -= dt; ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8); }
        // long press
        if (press && !press.long && host.active && performance.now() - press.t > 380) { press.long = true; toggleFlag(press.i); }
        const fs = Math.floor(cs * 0.5);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 0; i < N; i++) {
          const x = ox + (i % cols) * cs, y = oy + ((i / cols) | 0) * cs, g = 1.5;
          const isRev = rev[i] && t >= revT[i];
          if (isRev) {
            const k = Math.min(1, (t - revT[i]) / 0.18), sc = 0.6 + 0.4 * C.ease.back(k);
            ctx.save(); ctx.translate(x + cs / 2, y + cs / 2); ctx.scale(sc, sc);
            ctx.fillStyle = data[i] ? 'rgba(224,166,58,.2)' : '#1b1e21'; ctx.fillRect(-cs / 2 + g, -cs / 2 + g, cs - g * 2, cs - g * 2);
            if (data[i]) { ctx.strokeStyle = '#e0a63a'; ctx.lineWidth = 1.5; ctx.strokeRect(-cs / 2 + g + 1, -cs / 2 + g + 1, cs - g * 2 - 2, cs - g * 2 - 2); }
            if (num[i] > 0) { ctx.fillStyle = NUMCOL[num[i]]; ctx.font = `700 ${fs + 3}px system-ui, sans-serif`; ctx.shadowColor = NUMCOL[num[i]]; ctx.shadowBlur = 0; ctx.fillText(String(num[i]), 0, 1); ctx.shadowBlur = 0; }
            else if (data[i]) { ctx.fillStyle = '#e0a63a'; ctx.font = `700 ${fs}px sans-serif`; ctx.fillText('◆', 0, 0); }
            ctx.restore();
          } else {
            const hv = hover === i && host.active;
            ctx.fillStyle = hv ? '#353b42' : '#282c31'; ctx.fillRect(x + g, y + g, cs - g * 2, cs - g * 2);
            ctx.fillStyle = 'rgba(77,156,255,.07)'; ctx.fillRect(x + g, y + g, cs - g * 2, 2);
            ctx.strokeStyle = hv ? 'rgba(77,156,255,.7)' : 'rgba(71,79,89,.8)'; ctx.lineWidth = 1; ctx.strokeRect(x + g + .5, y + g + .5, cs - g * 2 - 1, cs - g * 2 - 1);
            if (cs > 30) { ctx.fillStyle = 'rgba(144,153,166,.18)'; ctx.font = `500 ${Math.floor(cs * 0.3)}px "IBM Plex Mono", monospace`; ctx.fillText(((i * 37 + 11) & 255).toString(16).toUpperCase().padStart(2, '0'), x + cs / 2, y + cs / 2); }
            if (bombShown[i] && !flag[i]) { ctx.fillStyle = '#ef5b5b'; ctx.font = `700 ${fs + 4}px sans-serif`; ctx.fillText('✹', x + cs / 2, y + cs / 2); }
            if (flag[i]) {
              const bad = bombShown[i];
              ctx.fillStyle = bad ? '#ef5b5b' : '#d96bb0'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 0;
              ctx.beginPath(); ctx.moveTo(x + cs * 0.38, y + cs * 0.22); ctx.lineTo(x + cs * 0.72, y + cs * 0.38); ctx.lineTo(x + cs * 0.38, y + cs * 0.54); ctx.closePath(); ctx.fill(); ctx.fillRect(x + cs * 0.36, y + cs * 0.22, 2, cs * 0.56); ctx.shadowBlur = 0;
            }
          }
          if (press && press.i === i && !press.long && host.active) { const k = Math.min(1, (performance.now() - press.t) / 380); ctx.strokeStyle = '#d96bb0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + cs / 2, y + cs / 2, cs * 0.34, -1.57, -1.57 + k * 6.28); ctx.stroke(); }
        }
        fx.update(dt); fx.draw(ctx); txt.update(dt); txt.draw(ctx);
        ctx.restore();
        if (started && !over) {
          if (freezeT > 0) { freezeT -= dt; } else if (generated || true) timeLeft -= dt;
          host.setTimer(timeLeft);
          if (timeLeft <= 0) lose('TIME EXPIRED');
        }
      }
      host.loop(draw);
      updInfo();

      // ---- helpers for tools / debug
      function safeFrontier() {
        const c = []; for (let i = 0; i < N; i++) if (!mine[i] && !rev[i] && nbrs[i].some((n) => rev[n])) c.push(i); return c;
      }
      return {
        start() { started = true; host.setTimer(timeLeft); host.setLives(lives, maxLives); host.setStatus(C.isTouch ? 'Tap to dig · hold to flag' : 'Click to dig · right-click to flag', ''); },
        tool(id) {
          if (over) return false;
          if (id === 'hint') {
            if (!generated) { const first = host.randInt(0, N - 1); reveal(first); host.setStatus('Oracle opened a safe region.', 'good'); return true; }
            let c = safeFrontier(); if (!c.length) { c = []; for (let i = 0; i < N; i++) if (!mine[i] && !rev[i]) c.push(i); }
            if (!c.length) return false;
            const i = host.pick(c), x = ox + (i % cols + 0.5) * cs, y = oy + (((i / cols) | 0) + 0.5) * cs; fx.burst(x, y, '#4d9cff', 24, 170); reveal(i); host.setStatus('Oracle revealed a safe cell.', 'good'); return true;
          }
          if (id === 'freeze') { freezeT = 10; host.setStatus('Chronos: timer frozen 10 s', 'good'); return true; }
          if (id === 'shield') { if (shield >= 2) return false; shield++; updInfo(); host.setStatus('Aegis armed: next honeypot is harmless.', 'good'); return true; }
          return false;
        },
        onFinish() { over = true; },
        debug: { solve() { if (!generated) generate(0); for (let i = 0; i < N; i++) if (!mine[i]) reveal(i); }, fail() { lives = 1; if (!generated) generate(0); for (let i = 0; i < N; i++) if (mine[i]) { reveal(i); break; } }, info() { return { cols, rows, mineCount, N }; }, gen(first) { generate(first); return { mine: Array.from(mine), solvable: solverSolvable(first), cols, rows }; } },
      };
    },
  });
})();
