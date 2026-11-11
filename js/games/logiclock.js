/* LOGIC LOCK — logic-gate circuit puzzle. Flip switches so every output lamp matches its target.
   Guaranteed solvable (built from a random solution), BFS-computed par, locked + coupled switches, toggle budget, touch-first, flows left→right or top→bottom. */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h;
  const OPS = { AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b, NAND: (a, b) => (a & b) ^ 1, NOR: (a, b) => (a | b) ^ 1, XNOR: (a, b) => (a ^ b) ^ 1, NOT: (a) => a ^ 1 };
  const EXPL = { AND: 'AND: 1 only when both inputs are 1', OR: 'OR: 1 when either input is 1', XOR: 'XOR: 1 when the inputs differ', NAND: 'NAND: 0 only when both inputs are 1', NOR: 'NOR: 1 only when both inputs are 0', XNOR: 'XNOR: 1 when the inputs match', NOT: 'NOT: flips its input' };
  const COL = { on: '#4d9cff', off: '#383e46', lamp: '#3fb96b', bad: '#ef5b5b', amb: '#e0a63a', vio: '#a997f6', dim: '#9099a6' };

  C.mg.register({
    id: 'logiclock', name: 'LOGIC LOCK', icon: '◧',
    blurb: 'Flip the switches until every lamp matches its target.',
    info: {
      goal: 'Route signals through the gates so each output lamp matches its target (ON or OFF). Lit wires carry 1, dark wires carry 0.',
      controls: ['Click a switch (or press its number key 1-9, 0) to flip it', 'Hover a gate to read its rule', 'Padlocked switches cannot move; violet links flip a partner too', 'Finish within the toggle budget and the clock'],
      touch: ['Tap a switch to flip it', 'Tap a gate to read its rule', 'Padlocked switches cannot move; violet links flip a partner too', 'Finish within the toggle budget and the clock'],
    },
    create(host) {
      const d = host.params.difficulty, bonus = host.params.bonus;
      const nIn = C.clamp(Math.round(3.4 + d * 0.55), 4, 10);
      const nOut = d < 3.5 ? 1 : d < 6.5 ? 2 : d < 9.5 ? 3 : 4;
      const Lw = C.clamp(Math.round(1.6 + d * 0.28), 2, 5);
      const binTypes = ['AND', 'OR'];
      if (d >= 2.5) binTypes.push('XOR');
      if (d >= 4.5) binTypes.push('NAND', 'NOR');
      if (d >= 7) binTypes.push('XNOR');
      const pNot = d >= 1.5 ? 0.18 : 0;

      // ------------------------------------------------------------------ generation
      let nodes, layers, outs, target, locked, coupleTo, moveMask, sol, state, par, budget, solved;
      const SIZE = 1 << nIn;
      function build() {
        nodes = []; layers = [];
        const L0 = []; for (let i = 0; i < nIn; i++) { nodes.push({ k: 'in', layer: 0, idx: i, id: nodes.length }); L0.push(nodes.length - 1); } layers.push(L0);
        const widths = []; let prev = nIn;
        for (let l = 1; l < 24; l++) {
          if (l >= Lw && Math.ceil(prev / 2) <= nOut) { widths.push(nOut); break; }
          const t = Math.min(1, l / Lw);
          const w = Math.max(Math.ceil(prev / 2), Math.round(nIn + (nOut - nIn) * t), nOut);
          widths.push(w); prev = w;
        }
        for (let l = 1; l <= widths.length; l++) {
          const pl = layers[l - 1], cur = [], unused = host.shuffle(pl.slice());
          const take = (avoid) => { let k = unused.findIndex((u) => !avoid.includes(u)); if (k >= 0) return unused.splice(k, 1)[0]; const pool = pl.filter((u) => !avoid.includes(u)); return pool.length ? host.pick(pool) : host.pick(pl); };
          for (let i = 0; i < widths[l - 1]; i++) {
            const isNot = host.rand() < pNot && l < widths.length + 1;
            const op = isNot ? 'NOT' : host.pick(binTypes);
            const n = { k: 'gate', op, layer: l, idx: i, id: nodes.length, a: -1, b: -1 };
            n.a = take([]);
            if (!isNot) {
              if (d >= 4 && l >= 2 && host.rand() < 0.22) { const far = layers[l - 2]; n.b = host.pick(far.filter((u) => u !== n.a)); if (n.b == null) n.b = take([n.a]); }
              else n.b = take([n.a]);
            }
            nodes.push(n); cur.push(n.id);
          }
          // any previous-layer node still unused: widen a NOT gate into a 2-input gate
          unused.forEach((u) => {
            const nots = cur.map((id) => nodes[id]).filter((g) => g.op === 'NOT');
            if (nots.length) { const g = host.pick(nots); g.op = host.pick(binTypes); g.b = u; }
          });
          layers.push(cur);
        }
        outs = layers[layers.length - 1];
      }
      const vals = new Uint8Array(64);
      function evalMask(mask, out) {
        for (let i = 0; i < nIn; i++) out[i] = (mask >> i) & 1;
        for (let i = nIn; i < nodes.length; i++) { const n = nodes[i]; out[i] = n.op === 'NOT' ? OPS.NOT(out[n.a]) : OPS[n.op](out[n.a], out[n.b]); }
      }
      function outMask(mask) { evalMask(mask, vals); let m = 0; outs.forEach((id, i) => { m |= vals[id] << i; }); return m; }
      function isSolved(mask) { return outMask(mask) === targetMask; }
      let targetMask = 0;

      function bfs(startMask) {
        const dist = new Int16Array(SIZE).fill(-1), par = new Int32Array(SIZE).fill(-1), mv = new Int8Array(SIZE).fill(-1);
        const q = [startMask]; dist[startMask] = 0;
        for (let qi = 0; qi < q.length; qi++) {
          const s = q[qi];
          if (solved[s]) { let c = s, first = -1; while (par[c] >= 0) { first = mv[c]; c = par[c]; } return { dist: dist[s], first, to: s }; }
          for (let i = 0; i < nIn; i++) {
            if (locked[i]) continue;
            const ns = s ^ moveMask[i]; if (dist[ns] >= 0) continue;
            dist[ns] = dist[s] + 1; par[ns] = s; mv[ns] = i; q.push(ns);
          }
        }
        return null;
      }

      function generate() {
        for (let attempt = 0; attempt < 60; attempt++) {
          build();
          sol = host.randInt(0, SIZE - 1);
          evalMask(sol, vals);
          target = outs.map((id) => vals[id]);
          targetMask = 0; target.forEach((v, i) => { targetMask |= v << i; });
          // quality: no constant outputs, solution not too common
          solved = new Uint8Array(SIZE); let cnt = 0; const seen = new Array(nOut).fill(0);
          for (let m = 0; m < SIZE; m++) { const om = outMask(m); for (let i = 0; i < nOut; i++) seen[i] |= 1 << ((om >> i) & 1); if (om === targetMask) { solved[m] = 1; cnt++; } }
          if (seen.some((s) => s !== 3)) continue;
          const maxFrac = (d < 3 ? 0.5 : d < 6 ? 0.3 : d < 9 ? 0.15 : 0.08) * (attempt > 30 ? 3 : 1);
          if (d >= 3 && cnt > SIZE * maxFrac) continue;
          // locked + coupled switches
          locked = new Array(nIn).fill(false); coupleTo = new Array(nIn).fill(-1);
          const idxs = host.shuffle(Array.from({ length: nIn }, (_, i) => i));
          const nLock = d < 3 ? 0 : d < 6 ? 1 : d < 9 ? 2 : 3;
          for (let i = 0; i < nLock && i < nIn - 3; i++) locked[idxs[i]] = true;
          const free = idxs.filter((i) => !locked[i]);
          const nCouple = d < 5 ? 0 : d < 8.5 ? 1 : d < 11 ? 2 : 3;
          for (let i = 0; i < nCouple && free.length >= 2 * (i + 1) + 1; i++) coupleTo[free[2 * i]] = free[2 * i + 1];
          moveMask = Array.from({ length: nIn }, (_, i) => (1 << i) | (coupleTo[i] >= 0 ? 1 << coupleTo[i] : 0));
          // solved states reachable under locks: restrict
          let lockBits = 0, lockVal = 0; locked.forEach((l, i) => { if (l) { lockBits |= 1 << i; lockVal |= sol & (1 << i); } });
          for (let m = 0; m < SIZE; m++) if (solved[m] && (m & lockBits) !== lockVal) solved[m] = 0;
          // start state
          const minPar = Math.max(1, (d < 3 ? 1 : d < 5 ? 2 : d < 8 ? 3 : d < 11 ? 4 : 5) - (attempt > 30 ? 2 : 0));
          let found = false;
          for (let k = 0; k < 60 && !found; k++) {
            let s = (host.randInt(0, SIZE - 1) & ~lockBits) | lockVal;
            if (solved[s]) continue;
            const r = bfs(s); if (!r || r.dist < minPar) continue;
            state = s; par = r.dist; found = true;
          }
          if (!found) continue;
          budget = d < 4.5 ? Infinity : par + Math.max(2, Math.ceil(par * C.clamp(1.2 - (d - 4) * 0.1, 0.35, 1.2)));
          return true;
        }
        // fallback: simplest valid puzzle
        return false;
      }
      if (!generate()) { // extremely unlikely: loosen and retry once
        generate();
      }

      // ------------------------------------------------------------------ runtime state
      let started = false, over = false, won = false, winT = 0;
      let timeMax = C.clamp(40 + nIn * 6 + nOut * 4 + Lw * 4, 60, 140) * (1 + bonus.time), timeLeft = timeMax;
      let moves = 0, overBudget = 0, shieldFree = 0, freezeT = 0, hintSw = -1, hintT = 0, shakeT = 0, flashT = 0, hintsUsed = 0;
      const val = new Uint8Array(nodes.length), shown = new Uint8Array(nodes.length), flipAt = new Float32Array(nodes.length);
      let tNow = 0, hoverNode = -1, infoT = 0, lastSwShake = -1, swShake = 0;
      const fx = new C.fx.Particles(), txt = new C.fx.Texts();

      function recompute(initial) {
        evalMask(state, vals);
        for (let i = 0; i < nodes.length; i++) {
          if (initial) { val[i] = shown[i] = vals[i]; flipAt[i] = 0; continue; }
          if (vals[i] !== val[i]) {
            // keep displaying the old value until the cascade reaches this layer
            if (tNow >= flipAt[i]) shown[i] = val[i];
            val[i] = vals[i]; flipAt[i] = tNow + 0.06 * nodes[i].layer + 0.02;
          }
        }
      }
      recompute(true);
      const dv = (i) => (tNow >= flipAt[i] ? val[i] : shown[i]);
      const matches = () => outs.reduce((a, id, i) => a + (val[id] === target[i] ? 1 : 0), 0);

      // ------------------------------------------------------------------ DOM
      host.css(`.ll{position:absolute;inset:0;display:flex;flex-direction:column;touch-action:none}.ll-cv{flex:1;min-height:0;position:relative}
        .ll-bar{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;justify-content:space-between;padding:6px 14px;border-top:1px solid var(--ln);background:rgba(25,28,31,.92);font-family:var(--ff-ui);font-size:12px;color:var(--d)}
        .ll-bar b{color:var(--t)}.ll-info{flex:1 1 220px;min-width:0;color:var(--c);font-family:var(--ff-mono);font-size:12px;min-height:16px}
        .ll-bar .over{color:var(--r)}`);
      const wrap = h('div', { class: 'll' }), cvBox = h('div', { class: 'll-cv' });
      const movesEl = h('span'), infoEl = h('div', { class: 'll-info' }, ''), matchEl = h('span');
      wrap.append(cvBox, h('div', { class: 'll-bar' }, movesEl, infoEl, matchEl)); host.root.append(wrap);
      function setInfo(s, secs) { infoEl.textContent = s || ''; infoT = secs || 4; }
      function updBar() {
        const left = budget === Infinity ? '' : ` / <b class="${moves > budget ? 'over' : ''}">${budget}</b>`;
        movesEl.innerHTML = `TOGGLES <b class="${moves > budget ? 'over' : ''}">${moves}</b>${left} · PAR <b>${par}</b>${shieldFree ? ` · <b style="color:var(--c)">⬡ FREE ×${shieldFree}</b>` : ''}`;
        matchEl.innerHTML = `LAMPS <b>${matches()}/${nOut}</b>`;
      }

      // ------------------------------------------------------------------ layout
      let cv, ctx, W = 0, H = 0, portrait = false, pos = [], boxes = [], swR = [], gateBW = 50, gateBH = 28;
      function layout(w, hh) {
        W = w; H = hh; if (!W || !H) return;
        portrait = H > W * 1.02;
        const mg = portrait ? { l: 14, r: 14, t: 54, b: 58 } : { l: 66, r: 44, t: 16, b: 16 };
        const K = layers.length; // layers 0..K-1, plus lamp column => K gaps
        const fl0 = portrait ? mg.t : mg.l, fl1 = (portrait ? H - mg.b : W - mg.r);
        const cr0 = portrait ? mg.l : mg.t, cr1 = portrait ? W - mg.r : H - mg.b;
        const maxW = Math.max(...layers.map((l) => l.length));
        const cell = (cr1 - cr0) / maxW, gap = (fl1 - fl0) / K;
        pos = new Array(nodes.length);
        layers.forEach((L, k) => L.forEach((id, i) => { const c = cr0 + (i + 0.5) * (cr1 - cr0) / L.length, f = fl0 + k * gap; pos[id] = portrait ? { x: c, y: f } : { x: f, y: c }; }));
        // lamp positions follow their gate along the flow axis
        pos.lamps = outs.map((id) => { const p = pos[id]; return portrait ? { x: p.x, y: fl0 + K * gap } : { x: fl0 + K * gap, y: p.y }; });
        if (portrait) { gateBW = C.clamp(cell * 0.88, 30, 70); gateBH = C.clamp(gap * 0.42, 22, 34); }
        else { gateBW = C.clamp(gap * 0.46, 36, 62); gateBH = C.clamp(cell * 0.8, 20, 36); }
        swR = { w: portrait ? C.clamp(cell * 0.84, 22, 46) : C.clamp(mg.l * 0.62, 30, 44), h: portrait ? 20 : C.clamp(cell * 0.8, 15, 26), cell, gap };
        pos.lampR = C.clamp(Math.min(cell, gap) * 0.32, 11, 21);
      }
      cv = host.autoCanvas(cvBox, (w, hh) => layout(w, hh));
      ctx = cv.ctx; const canvas = cv.canvas;

      // ------------------------------------------------------------------ actions
      const swCenter = (i) => pos[i];
      function toggle(i) {
        if (over || won || !host.active) return;
        if (locked[i]) { host.sfx('bad'); C.haptic(20); swShake = 0.3; lastSwShake = i; setInfo(`Switch ${i + 1} is padlocked.`, 3); return; }
        state ^= moveMask[i];
        if (shieldFree > 0) { shieldFree--; setInfo('Aegis: free toggle', 2); }
        else { moves++; if (moves > budget) { overBudget++; host.penalty(1.2, 'over toggle budget'); setInfo('Over budget! Each extra toggle costs trace.', 3); host.sfx('warn'); } }
        if (hintSw === i) hintSw = -1;
        host.sfx('click'); C.haptic(8);
        const p = pos[i]; fx.burst(p.x, p.y, val[i] ? '#4d9cff' : '#3fb96b', 10, 110);
        if (coupleTo[i] >= 0) { const q = pos[coupleTo[i]]; fx.burst(q.x, q.y, COL.vio, 8, 90); setInfo(`Linked: switch ${coupleTo[i] + 1} flipped too`, 2.5); }
        recompute(); updBar();
        if (outs.every((id, k) => vals[id] === target[k])) win();
      }
      function win() {
        if (won) return; won = true; winT = 0; host.sfx('success');
        pos.lamps.forEach((p, i) => fx.burst(p.x, p.y, COL.lamp, 24, 200));
        host.setStatus('LOCK OPEN', 'good');
        host.after(900, () => {
          const eff = C.clamp(par / Math.max(par, moves), 0, 1);
          const sc = C.clamp(0.4 + 0.35 * eff + 0.2 * (timeLeft / timeMax) + 0.05 - 0.03 * overBudget - 0.04 * hintsUsed, 0.3, 1);
          over = true;
          host.finish({ success: true, score: sc, stats: { Toggles: `${moves}/${par} par`, 'Over budget': overBudget, Time: C.fmt.time(timeMax - timeLeft) } });
        });
      }
      function lose(why) { if (over) return; over = true; host.setStatus(why, 'bad'); host.sfx('fail'); host.finish({ success: false, score: 0, stats: { Reason: why, Lamps: `${matches()}/${nOut}` } }); }

      // ------------------------------------------------------------------ input
      function hit(e) {
        const p = host.pointer(e, canvas);
        let best = -1, bd = Infinity;
        for (let i = 0; i < nIn; i++) { const q = pos[i]; const dx = Math.abs(p.x - q.x), dy = Math.abs(p.y - q.y); const lim = portrait ? Math.max(swR.cell * 0.55, 20) : Math.max(swR.cell * 0.55, 14); const dd = portrait ? dx : dy; if (dd < lim && (portrait ? dy < 30 : dx < 44) && dd < bd) { bd = dd; best = i; } }
        if (best >= 0) return { sw: best, p };
        for (let i = nIn; i < nodes.length; i++) { const q = pos[i]; if (Math.abs(p.x - q.x) < gateBW / 2 + 6 && Math.abs(p.y - q.y) < gateBH / 2 + 6) return { gate: i, p }; }
        for (let i = 0; i < outs.length; i++) { const q = pos.lamps[i]; if (Math.hypot(p.x - q.x, p.y - q.y) < pos.lampR + 12) return { lamp: i, p }; }
        return { p };
      }
      function describeGate(i) {
        const n = nodes[i]; const a = dv(n.a), b = n.b >= 0 ? dv(n.b) : null;
        return `${EXPL[n.op]} · now ${n.b >= 0 ? `(${a},${b})` : `(${a})`} → ${val[i]}`;
      }
      host.listen(canvas, 'pointerdown', (e) => {
        if (!host.active) return; e.preventDefault();
        const r = hit(e);
        if (r.sw != null) toggle(r.sw);
        else if (r.gate != null) { setInfo(describeGate(r.gate), 5); host.sfx('tick'); hoverNode = r.gate; }
        else if (r.lamp != null) { setInfo(`Lamp ${r.lamp + 1}: target is ${target[r.lamp] ? 'ON' : 'OFF'}, now ${val[outs[r.lamp]] ? 'ON' : 'OFF'}`, 4); host.sfx('tick'); }
      });
      host.listen(canvas, 'pointermove', (e) => {
        if (!host.active || e.pointerType === 'touch') return;
        const r = hit(e); hoverNode = r.gate != null ? r.gate : (r.sw != null ? r.sw : -1);
        if (r.gate != null) setInfo(describeGate(r.gate), 2);
        canvas.style.cursor = r.sw != null ? (locked[r.sw] ? 'not-allowed' : 'pointer') : 'default';
      });
      host.listen(window, 'keydown', (e) => {
        if (!host.active || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key;
        if (/^[0-9]$/.test(k)) { const i = k === '0' ? 9 : +k - 1; if (i < nIn) { e.preventDefault(); toggle(i); } }
      });

      // ------------------------------------------------------------------ draw
      function wire(p, q, col, w, dash, off) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        if (portrait) { const m = (p.y + q.y) / 2; ctx.bezierCurveTo(p.x, m, q.x, m, q.x, q.y); }
        else { const m = (p.x + q.x) / 2; ctx.bezierCurveTo(m, p.y, m, q.y, q.x, q.y); }
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.lineDashOffset = off || 0; ctx.stroke(); ctx.setLineDash([]);
      }
      const outAnchor = (i) => { const p = pos[i], n = nodes[i]; if (n.k === 'in') return portrait ? { x: p.x, y: p.y + swR.h / 2 } : { x: p.x + swR.w / 2, y: p.y }; return portrait ? { x: p.x, y: p.y + gateBH / 2 } : { x: p.x + gateBW / 2, y: p.y }; };
      const inAnchor = (g, which) => { const p = pos[g.id], two = g.b >= 0, o = two ? (which === 'a' ? -0.24 : 0.24) : 0; return portrait ? { x: p.x + o * gateBW, y: p.y - gateBH / 2 } : { x: p.x - gateBW / 2, y: p.y + o * gateBH }; };
      function roundRect(x, y, w, hh, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r); ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

      function draw(dt, t) {
        tNow = t;
        if (!W || !pos.length) return;
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        if (shakeT > 0) { shakeT -= dt; ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6); }
        // backdrop grid
        ctx.strokeStyle = 'rgba(71,79,89,.18)'; ctx.lineWidth = 1;
        const gs = 32; ctx.beginPath(); for (let x = (t * 6) % gs; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
        // axis captions
        ctx.fillStyle = 'rgba(144,153,166,.55)'; ctx.font = '600 10px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (portrait) { ctx.fillText('SWITCHES', W / 2, 9); ctx.fillText('LAMPS', W / 2, H - 8); } else { ctx.save(); ctx.translate(11, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('SWITCHES', 0, 0); ctx.restore(); }

        // timer
        if (started && !over && !won) {
          if (freezeT > 0) freezeT -= dt; else timeLeft -= dt;
          host.setTimer(timeLeft);
          if (timeLeft <= 0) lose('TIME EXPIRED — LOCK RESET');
        }
        if (infoT > 0) { infoT -= dt; if (infoT <= 0) infoEl.textContent = ''; }
        if (hintT > 0) { hintT -= dt; if (hintT <= 0) hintSw = -1; }
        if (swShake > 0) swShake -= dt;
        if (won) winT += dt;

        // wires
        nodes.forEach((n) => {
          if (n.k !== 'gate') return;
          [['a', n.a], ['b', n.b]].forEach(([w, src]) => {
            if (src < 0) return;
            const p = outAnchor(src), q = inAnchor(n, w), on = dv(src);
            if (on) { wire(p, q, 'rgba(77,156,255,.22)', 5); wire(p, q, COL.on, 2, [5, 9], -t * 48); } else wire(p, q, COL.off, 1.6);
          });
        });
        // gate -> lamp wires
        outs.forEach((id, i) => { const p = outAnchor(id), l = pos.lamps[i], q = portrait ? { x: l.x, y: l.y - pos.lampR } : { x: l.x - pos.lampR, y: l.y }; if (dv(id)) { wire(p, q, 'rgba(63,185,107,.22)', 5); wire(p, q, COL.lamp, 2, [5, 9], -t * 48); } else wire(p, q, COL.off, 1.6); });

        // coupling links
        for (let i = 0; i < nIn; i++) if (coupleTo[i] >= 0) {
          const a = pos[i], b = pos[coupleTo[i]]; ctx.strokeStyle = COL.vio; ctx.fillStyle = COL.vio; ctx.lineWidth = 1.8; ctx.setLineDash([4, 3]);
          ctx.beginPath();
          if (portrait) { const y = a.y - swR.h / 2 - 17; ctx.moveTo(a.x, a.y - swR.h / 2 - 12); ctx.lineTo(a.x, y); ctx.lineTo(b.x, y); ctx.lineTo(b.x, a.y - swR.h / 2 - 12); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(b.x, a.y - swR.h / 2 - 8); ctx.lineTo(b.x - 4, a.y - swR.h / 2 - 14); ctx.lineTo(b.x + 4, a.y - swR.h / 2 - 14); ctx.fill(); }
          else { const x = a.x - swR.w / 2 - 22 - (i % 2) * 0; ctx.moveTo(a.x - swR.w / 2 - 14, a.y); ctx.lineTo(x, a.y); ctx.lineTo(x, b.y); ctx.lineTo(b.x - swR.w / 2 - 14, b.y); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(b.x - swR.w / 2 - 10, b.y); ctx.lineTo(b.x - swR.w / 2 - 16, b.y - 4); ctx.lineTo(b.x - swR.w / 2 - 16, b.y + 4); ctx.fill(); }
          ctx.setLineDash([]);
        }

        // switches
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 0; i < nIn; i++) {
          const p = pos[i], on = dv(i), lk = locked[i], w = swR.w, hh = swR.h, sx = (swShake > 0 && lastSwShake === i) ? Math.sin(t * 90) * 3 : 0;
          const x = p.x - w / 2 + sx, y = p.y - hh / 2;
          const col = lk ? COL.amb : (on ? COL.on : '#4c545f');
          if (on && !lk) { ctx.shadowColor = COL.on; ctx.shadowBlur = 0; }
          roundRect(x, y, w, hh, hh / 2); ctx.fillStyle = on ? 'rgba(77,156,255,.16)' : '#1c1e22'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = lk ? 2 : 1.6; ctx.stroke(); ctx.shadowBlur = 0;
          const kx = on ? x + w - hh / 2 : x + hh / 2;
          if (lk) { ctx.fillStyle = COL.amb; ctx.fillRect(p.x - 5 + sx, p.y - 1, 10, 7); ctx.strokeStyle = COL.amb; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(p.x + sx, p.y - 1, 3.4, Math.PI, 0); ctx.stroke(); }
          else { ctx.beginPath(); ctx.arc(kx, p.y, hh / 2 - 3, 0, 6.3); ctx.fillStyle = on ? '#b4d5ff' : '#66717f'; ctx.fill(); }
          if (!lk) { ctx.fillStyle = on ? '#4d9cff' : '#b7bdc6'; ctx.font = `700 ${Math.max(9, hh - 9)}px system-ui,sans-serif`; ctx.fillText(on ? '1' : '0', on ? x + w * 0.3 : x + w * 0.7, p.y + 0.5); }
          ctx.fillStyle = lk ? COL.amb : COL.dim; ctx.font = '600 11px system-ui,sans-serif';
          if (portrait) ctx.fillText(String(i === 9 ? 0 : i + 1), p.x, p.y - hh / 2 - 6); else ctx.fillText(String(i === 9 ? 0 : i + 1), p.x - w / 2 - 8, p.y);
          if (hintSw === i) { const k = 0.5 + 0.5 * Math.sin(t * 8); ctx.strokeStyle = `rgba(255,181,46,${0.5 + k * 0.5})`; ctx.lineWidth = 2.5; roundRect(x - 5, y - 5, w + 10, hh + 10, hh / 2 + 5); ctx.stroke(); }
        }

        // gates
        ctx.font = `700 ${Math.round(C.clamp(Math.min(gateBH * 0.46, gateBW / 4.2), 9, 13))}px system-ui,sans-serif`;
        for (let i = nIn; i < nodes.length; i++) {
          const n = nodes[i], p = pos[i], on = dv(i), hv = hoverNode === i;
          const x = p.x - gateBW / 2, y = p.y - gateBH / 2;
          if (on) { ctx.shadowColor = COL.on; ctx.shadowBlur = 0; }
          roundRect(x, y, gateBW, gateBH, 6); ctx.fillStyle = on ? 'rgba(77,156,255,.14)' : '#1c1e22'; ctx.fill();
          ctx.strokeStyle = hv ? '#fff' : on ? COL.on : '#474f59'; ctx.lineWidth = hv ? 2 : 1.6; ctx.stroke(); ctx.shadowBlur = 0;
          ctx.fillStyle = on ? '#aed2ff' : '#a7afb9'; ctx.fillText(n.op, p.x, p.y + 0.5);
          // input dots
          [['a', n.a], ['b', n.b]].forEach(([w, s]) => { if (s < 0) return; const q = inAnchor(n, w); ctx.beginPath(); ctx.arc(q.x, q.y, 2.4, 0, 6.3); ctx.fillStyle = dv(s) ? COL.on : '#4c545f'; ctx.fill(); });
        }

        // lamps + targets
        outs.forEach((id, i) => {
          const p = pos.lamps[i], on = dv(id), tg = target[i], ok = (on ? 1 : 0) === tg, R = pos.lampR;
          if (on) { ctx.shadowColor = COL.lamp; ctx.shadowBlur = 0; }
          ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 6.3); ctx.fillStyle = on ? COL.lamp : '#181b1e'; ctx.fill(); ctx.strokeStyle = on ? '#71cf93' : '#4c545f'; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
          // target ring
          ctx.lineWidth = 2.5; ctx.strokeStyle = ok ? COL.lamp : COL.amb; ctx.setLineDash(tg ? [] : [4, 4]);
          ctx.beginPath(); ctx.arc(p.x, p.y, R + 6, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
          ctx.font = '700 10px system-ui,sans-serif'; ctx.fillStyle = ok ? COL.lamp : COL.amb;
          ctx.fillText(`${tg ? 'ON' : 'OFF'}${ok ? ' ✓' : ''}`, p.x, p.y + R + 17);
        });

        if (freezeT > 0) { ctx.fillStyle = 'rgba(77,156,255,.07)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = COL.on; ctx.font = '700 11px system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.fillText(`Chronos ${Math.ceil(freezeT)}s`, W - 8, 12); }
        if (won) { ctx.fillStyle = `rgba(56,255,160,${Math.max(0, 0.18 - winT * 0.18)})`; ctx.fillRect(0, 0, W, H); }
        fx.update(dt); fx.draw(ctx); txt.update(dt); txt.draw(ctx);
        ctx.restore();
      }
      host.loop(draw);
      updBar();

      return {
        start() { started = true; host.setTimer(timeLeft); host.setStatus(C.isTouch ? 'Tap switches · tap a gate to read it' : 'Click switches or press 1-9 · hover gates for rules', ''); },
        tool(id) {
          if (over || won) return false;
          if (id === 'hint') {
            const r = bfs(state); if (!r || r.dist === 0 || r.first < 0) return false;
            hintSw = r.first; hintT = 7; hintsUsed++;
            const p = pos[r.first]; fx.burst(p.x, p.y, COL.amb, 18, 120); host.sfx('good');
            setInfo(`Oracle: flip switch ${r.first + 1}${coupleTo[r.first] >= 0 ? ' (it drags switch ' + (coupleTo[r.first] + 1) + ' along)' : ''} · ${r.dist} toggle${r.dist > 1 ? 's' : ''} from a solution`, 6);
            return true;
          }
          if (id === 'freeze') { freezeT += 10; host.sfx('good'); setInfo('Chronos: the clock is frozen for 10 s', 3); return true; }
          if (id === 'shield') { if (shieldFree >= 6) return false; shieldFree += 3; updBar(); host.sfx('good'); setInfo('Aegis: your next 3 toggles are free', 3); return true; }
          return false;
        },
        onFinish() { over = true; },
        debug: {
          solve() { const r = bfs(state); if (r) { state = r.to; recompute(); updBar(); win(); } },
          fail() { lose('SYSTEM LOCKDOWN'); },
          info() { return { nIn, nOut, layers: layers.map((l) => l.length), par, budget, locked: locked.slice(), coupleTo: coupleTo.slice(), solvedStates: solved.reduce((a, b) => a + b, 0) }; },
          toggle(i) { toggle(i); },
          hintMove() { const r = bfs(state); return r ? r.first : -1; },
          swClient(i) { const r = canvas.getBoundingClientRect(); return { x: r.left + pos[i].x, y: r.top + pos[i].y }; },
        },
      };
    },
  });
})();
