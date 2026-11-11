/* INJECT — typing under pressure. Hostile packets drift toward your CORE; type them to destroy them.
   Lock-on typing shooter: first letter locks the closest matching packet, Backspace cancels, Tab/tap picks a target.
   Phones get a built-in on-screen keyboard (letters + symbols) and tap-to-target. Hardware keyboards work everywhere. */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h;
  const COL = { norm: '#dfe6ee', blue: '#4d9cff', g: '#3fb96b', amb: '#e0a63a', r: '#ef5b5b', ice: '#6cc4e0', vio: '#9b87f5', dim: '#6b7380' };
  const WORDS = {
    t1: ['ls', 'cd', 'cat', 'ping', 'host', 'root', 'exit', 'echo', 'grep', 'tail', 'head', 'tcp', 'udp', 'ack', 'syn', 'bash', 'port', 'node', 'hash', 'salt', 'byte', 'ram', 'sql', 'dns', 'log', 'bit', 'key', 'ram', 'disk', 'link'],
    t2: ['netstat', 'router', 'server', 'client', 'tunnel', 'gateway', 'session', 'cookie', 'token', 'script', 'binary', 'compile', 'network', 'uplink', 'relay', 'bridge', 'cache', 'mirror', 'vector', 'matrix', 'module', 'driver', 'syslog', 'timeout', 'sandbox', 'firewall', 'handshake', 'proxy', 'daemon', 'cipher', 'kernel', 'socket', 'buffer', 'packet', 'monitor', 'terminal', 'protocol', 'backup', 'archive'],
    t3: ['ls -la /home', 'cd ~/docs', 'ping -c 4', '0xCAFEBABE', 'ssh -p 22', 'cat notes.txt', 'head -n 5 a.log', 'df -h /', 'uname -a', 'top -n 1', 'mkdir ~/tmp', 'touch a.log', 'wc -l data.csv', 'sort -u list', '192.168.0.1', 'kill -9 1337', 'echo $PATH', 'tar -xzf a.gz', 'grep -i log', '0xBADC0DE', 'chmod 644 a.txt', 'ping 10.0.0.5', 'cd ../src', 'git status', 'git pull', 'ls | wc -l', 'sudo apt update', 'xor 0x5A', 'md5sum a.out', 'tail -f app.log'],
  };
  const KB_L = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'], KB_S = ['1234567890', '-_./:;\'"*~', '#$!@=+&%\\|'];
  const SYMS = new Set('-_./:;\'"*~#$!@=+&%\\|'.split(''));
  const eq = (a, b) => a != null && b != null && a.toLowerCase() === b.toLowerCase();

  C.mg.register({
    id: 'inject', name: 'INJECT', icon: '⌨',
    blurb: 'Type the rogue packets before they reach your core.',
    info: {
      goal: 'Rogue packets drift toward your core. Type a packet to clear it. Hold out until the timer runs out.',
      controls: ['Type the word on a packet: the first letter locks the closest match', 'Backspace cancels a lock · Tab cycles targets', 'Gold bursts kill neighbours · blue-white freezes · RED = trap, never finish it', 'Spaces and symbols count'],
      touch: ['Use the on-screen keyboard · tap a packet to target it', 'Backspace key cancels a lock · ⇥ cycles targets', 'Gold bursts kill neighbours · ice slows · RED = trap, never finish it', 'Tap ?123 for digits and symbols'],
    },
    create(host) {
      const d = host.params.difficulty, bonus = host.params.bonus, touch = !!C.isTouch;
      const fx = new C.fx.Particles(), txt = new C.fx.Texts();
      // ------------------------------------------------------------- tuning
      const T = C.lerp(45, 90, (d - 1) / 13) / (1 + bonus.time * 0.6);
      const fallBase = C.lerp(11.5, 5.2, (d - 1) / 13);        // seconds from spawn to core for a short word
      const spawnEvery = C.lerp(2.2, 0.7, (d - 1) / 13);
      const maxLen = Math.round(4 + d * 1.15);
      const allowDigits = d >= 4, allowSyms = d >= 6.5;
      const dmgBase = 100 / (6 + Math.round(d * 0.35) + bonus.lives * 1.5);   // breaches until death ≈ 6..11
      const okChars = (w) => [...w].every((c) => /[a-zA-Z ]/.test(c) || (allowDigits && /[0-9]/.test(c)) || (allowSyms && SYMS.has(c)) || (allowDigits && /[-._/]/.test(c)));
      let pool = [];
      const addPool = (arr, wt) => arr.forEach((w) => { if (w.length <= maxLen && okChars(w)) for (let i = 0; i < wt; i++) pool.push(w); });
      addPool(WORDS.t1, d < 3 ? 3 : d < 6 ? 1 : 0); addPool(WORDS.t2, d < 2 ? 0 : d < 8 ? 2 : 1); addPool(WORDS.t3, d < 4 ? 0 : d < 7 ? 1 : 3);
      if (pool.length < 8) addPool(WORDS.t1, 2);
      const needsSyms = allowSyms || allowDigits;

      // ------------------------------------------------------------- state
      const packets = []; let nextId = 1, lock = null, started = false, over = false;
      let elapsed = 0, integrity = 100, combo = 0, bestCombo = 0, kills = 0, spawned = 0, spawnedReal = 0, okKeys = 0, allKeys = 0, breaches = 0, trapHits = 0, penaltyCap = 0;
      let freezeT = 0, slowT = 0, overT = 0, overUsed = 0, shieldN = 0, flashBad = 0, shakeT = 0, spawnT = 1.1, tNow = 0, layer = 'L';
      const calmEvery = 15, calmLen = 3.2;

      // ------------------------------------------------------------- DOM
      host.css(`.in{position:absolute;inset:0;display:flex;flex-direction:column;touch-action:manipulation}.in-cv{flex:1;min-height:0;position:relative}
        .in-kb{flex:none;display:flex;flex-direction:column;gap:5px;padding:6px 5px calc(7px + env(safe-area-inset-bottom,0px));background:#15181c;border-top:1px solid var(--ln);-webkit-user-select:none;user-select:none;touch-action:none}
        .in-kb .r{display:flex;gap:4px;justify-content:center}.in-kb button{appearance:none;flex:1 1 0;max-width:46px;height:var(--kh,40px);border:0;border-radius:6px;background:#2b3037;color:var(--t);font:600 16px var(--ff-mono);padding:0;touch-action:none}
        .in-kb button:active,.in-kb button.dn{background:var(--acc-bg)}.in-kb button.nx{box-shadow:inset 0 0 0 2px var(--c)}.in-kb button.fn{background:#222629;color:var(--d);font-size:13px;max-width:none;flex:1.5}.in-kb button.sp{flex:5;max-width:none}
        body.compact:not(.portrait) .in-kb{--kh:30px;gap:3px;padding:3px 5px}body.compact:not(.portrait) .in-kb button{font-size:14px}`);
      const wrap = h('div', { class: 'in' }), cvBox = h('div', { class: 'in-cv' });
      wrap.append(cvBox);
      let kbEl = null; const keyEls = {};
      function buildKb() {
        if (!touch) return;
        kbEl = h('div', { class: 'in-kb' }); wrap.append(kbEl); renderKb();
      }
      function renderKb() {
        if (!kbEl) return; C.clear(kbEl); Object.keys(keyEls).forEach((k) => delete keyEls[k]);
        const rows = layer === 'L' ? KB_L : KB_S;
        const key = (label, ch, cls) => { const b = h('button', { class: cls || '', 'data-ch': ch }, label); b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('dn'); setTimeout(() => b.classList.remove('dn'), 90); press(ch); }); if (ch.length === 1) keyEls[ch.toLowerCase()] = b; return b; };
        rows.forEach((r, i) => { const row = h('div', { class: 'r' }); [...r].forEach((c) => row.append(key(c, c))); if (i === 2 && layer === 'L') { /* keep letters row compact */ } kbEl.append(row); });
        const bottom = h('div', { class: 'r' });
        if (needsSyms) bottom.append(key(layer === 'L' ? '?123' : 'ABC', '@layer', 'fn'));
        bottom.append(key('space', ' ', 'sp'), key('⌫', '@bs', 'fn'), key('⇥', '@tab', 'fn'));
        kbEl.append(bottom); markNext();
      }
      function markNext() {
        if (!kbEl) return; kbEl.querySelectorAll('.nx').forEach((e) => e.classList.remove('nx'));
        if (!lock) return; const c = lock.word[lock.typed]; if (c == null) return;
        const lk = c.toLowerCase(), e = keyEls[lk]; if (e) { e.classList.add('nx'); return; }
        if (c === ' ') { const s = kbEl.querySelector('.sp'); s && s.classList.add('nx'); return; }
        const t = kbEl.querySelector('[data-ch="@layer"]'); t && t.classList.add('nx');
      }

      // ------------------------------------------------------------- layout / projection
      let cv, W = 0, H = 0, horiz = false, lanes = 3, coreP = 0, pad = 14;
      cv = host.autoCanvas(cvBox, (w, hh) => { W = w; H = hh; horiz = W / H > 2.6; lanes = Math.max(2, Math.min(5, Math.floor(H / 38))); });
      host.root.append(wrap); // the canvas parent must be in the DOM before autoCanvas measures, so re-fit after mount
      buildKb();
      cv.canvas.style.touchAction = 'none';
      const ctx = cv.ctx, canvas = cv.canvas;
      const font = () => `600 ${W < 420 ? 15 : 17}px ui-monospace,Menlo,Consolas,monospace`;
      const measure = (w) => { ctx.font = font(); return Math.ceil(ctx.measureText(w).width) + 22; };
      // packet screen position from progress
      function posOf(p) {
        if (horiz) { const x0 = W + 10, x1 = 46; return { x: x0 + (x1 - x0) * p.prog - p.w / 2 + p.w / 2, y: p.lane * (H - 24) / (lanes - 1 || 1) + 12 }; }
        const y0 = -14, y1 = H - 52; return { x: p.x, y: y0 + (y1 - y0) * p.prog };
      }

      // ------------------------------------------------------------- spawning
      function pickWord() {
        let best = null;
        for (let i = 0; i < 8; i++) {
          const w = host.pick(pool); if (!w) break;
          if (packets.some((p) => p.word === w)) continue;
          const clash = d < 5 && packets.some((p) => !p.dead && p.type !== 'trap' && eq(p.word[0], w[0]));
          if (!clash) return w; if (!best) best = w;
        }
        return best || host.pick(pool) || 'ls';
      }
      function spawn() {
        const roll = host.rand();
        let type = 'norm';
        const pBurst = d >= 2 ? 0.07 : 0, pIce = d >= 2 ? 0.05 : 0, pTrap = d >= 3 ? C.lerp(0.04, 0.14, (d - 3) / 11) : 0;
        if (roll < pBurst) type = 'burst'; else if (roll < pBurst + pIce) type = 'ice'; else if (roll < pBurst + pIce + pTrap) type = 'trap';
        let w = pickWord();
        if (type === 'burst' || type === 'ice') w = host.pick(pool.filter((x) => x.length <= 6 && !x.includes(' '))) || w;
        const long = w.includes(' ');
        const p = { id: nextId++, word: w, type, typed: 0, prog: 0, dead: false, w: measure(w), long, lane: 0, x: 0, dying: 0, fall: fallBase * (1 + Math.max(0, w.length - 5) * 0.045) * (long ? 1.1 : 1) };
        if (horiz) { const used = new Set(packets.filter((q) => !q.dead && q.prog < 0.25).map((q) => q.lane)); const free = [...Array(lanes).keys()].filter((l) => !used.has(l)); p.lane = free.length ? host.pick(free) : host.randInt(0, lanes - 1); }
        else { let bx = 0, bs = -1; for (let i = 0; i < 8; i++) { const x = pad + p.w / 2 + host.rand() * Math.max(1, W - 2 * pad - p.w); const near = packets.filter((q) => !q.dead && q.prog < 0.22).reduce((m, q) => Math.min(m, Math.abs(q.x - x) - (q.w + p.w) / 2), 999); if (near > bs) { bs = near; bx = x; } } p.x = bx; }
        packets.push(p); spawned++; if (type !== 'trap') spawnedReal++;
      }

      // ------------------------------------------------------------- actions
      function scoreAdd(n, p) { const mul = (1 + Math.min(2, Math.floor(combo / 5) * 0.25)) * (overT > 0 ? 2 : 1); const v = Math.round(n * mul); const pp = posOf(p); txt.add(pp.x, pp.y - 14, '+' + v, overT > 0 ? COL.amb : COL.g, 13); }
      function killPacket(p, silent) {
        if (p.dead) return; p.dead = true; p.dying = 0.3; if (lock === p) { lock = null; markNext(); }
        const pp = posOf(p), col = p.type === 'burst' ? COL.amb : p.type === 'ice' ? COL.ice : p.type === 'trap' ? COL.r : COL.g;
        fx.burst(pp.x, pp.y, col, 14 + p.word.length, 150);
        if (p.type === 'trap') return;
        kills++; combo++; bestCombo = Math.max(bestCombo, combo); scoreAdd(10 + p.word.length, p);
        if (!silent) host.sfx(p.type === 'burst' ? 'hit' : 'good');
        if (combo === 15 && overT <= 0) { overT = 8; overUsed++; host.sfx('success'); txt.add(W / 2, H * 0.3, 'OVERDRIVE ×2', COL.amb, 22); }
      }
      function kill(p) {
        if (p.type === 'trap') { trapHits++; combo = 0; integrity = Math.max(0, integrity - 12); host.penalty(3, 'typed a honeypot'); host.sfx('bad'); C.haptic(30); shakeT = 0.3; flashBad = 0.3; const pp = posOf(p); txt.add(pp.x, pp.y, 'TRAP!', COL.r, 16); killPacket(p); checkDead(); return; }
        killPacket(p);
        if (p.type === 'burst') { const pp = posOf(p), R = Math.max(W, H) * (horiz ? 0.22 : 0.26); packets.forEach((q) => { if (q.dead || q.type === 'trap') return; const qq = posOf(q); if (Math.hypot(qq.x - pp.x, qq.y - pp.y) < R) killPacket(q, true); }); host.sfx('zap'); shakeT = 0.18; }
        if (p.type === 'ice') { slowT = 4.5; txt.add(W / 2, H * 0.4, 'SLOWED', COL.ice, 18); host.sfx('good'); }
        host.setStatus(`${kills} destroyed`, 'good');
      }
      function miss(why) {
        allKeys++; combo = 0; flashBad = 0.18; host.sfx('bad'); C.haptic(8);
        if (penaltyCap < 4) { penaltyCap += 0.5; host.penalty(0.5, why || 'mistype'); }
        if (lock) { lock.typed = lock.typed; }
      }
      function checkDead() { if (integrity <= 0 && !over) { over = true; host.setStatus('CORE BREACHED', 'bad'); host.sfx('fail'); host.finish({ success: false, score: 0, stats: { Reason: 'Core destroyed', Destroyed: kills, Breaches: breaches } }); } }
      function setLock(p) { if (lock && lock !== p) lock.typed = 0; lock = p; if (p) p.typed = 0; markNext(); }
      function press(ch) {
        if (!host.active || over) return;
        if (ch === '@layer') { layer = layer === 'L' ? 'S' : 'L'; renderKb(); host.sfx('tick'); return; }
        if (ch === '@bs') { if (lock) { lock.typed = 0; lock = null; markNext(); host.sfx('tick'); } return; }
        if (ch === '@tab') { cycle(); return; }
        allKeys++;
        if (lock) {
          if (eq(ch, lock.word[lock.typed])) { lock.typed++; okKeys++; host.sfx('type'); if (lock.typed >= lock.word.length) kill(lock); else markNext(); }
          else { allKeys--; miss('mistype'); }
          return;
        }
        let best = null; packets.forEach((p) => { if (!p.dead && eq(ch, p.word[0]) && (!best || p.prog > best.prog)) best = p; });
        if (best) { lock = best; best.typed = 1; okKeys++; host.sfx('type'); if (best.word.length === 1) kill(best); else markNext(); }
        else { allKeys--; miss('mistype'); }
      }
      function cycle() {
        const live = packets.filter((p) => !p.dead && p.type !== 'trap').sort((a, b) => b.prog - a.prog); if (!live.length) return;
        const i = lock ? live.indexOf(lock) : -1; setLock(live[(i + 1) % live.length]); host.sfx('tick');
      }
      function breach(p) {
        p.dead = true; if (lock === p) { lock = null; markNext(); }
        const pp = posOf(p);
        if (p.type === 'trap') { fx.burst(pp.x, pp.y, COL.dim, 8, 60); return; }
        if (p.type === 'ice') { fx.burst(pp.x, pp.y, COL.ice, 8, 60); return; }
        combo = 0;
        if (shieldN > 0) { shieldN--; txt.add(pp.x, pp.y - 10, 'ABSORBED', COL.blue, 14); fx.burst(pp.x, pp.y, COL.blue, 16, 150); host.sfx('good'); return; }
        breaches++; integrity = Math.max(0, integrity - dmgBase * (p.long ? 1.4 : p.type === 'burst' ? 0.7 : 1)); shakeT = 0.28; flashBad = 0.25;
        host.penalty(1.5, 'core breach'); host.sfx('bad'); C.haptic(40); fx.burst(pp.x, pp.y, COL.r, 20, 190); txt.add(pp.x, pp.y - 10, 'BREACH', COL.r, 15);
        checkDead();
      }

      // ------------------------------------------------------------- input
      host.listen(window, 'keydown', (e) => {
        if (!host.active || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === 'Backspace') { e.preventDefault(); press('@bs'); }
        else if (e.key === 'Tab') { e.preventDefault(); press('@tab'); }
        else if (e.key.length === 1) { e.preventDefault(); press(e.key); }
      });
      host.listen(canvas, 'pointerdown', (e) => {
        if (!host.active) return; e.preventDefault();
        const pt = host.pointer(e, canvas); let best = null, bd = 44 * 44;
        packets.forEach((p) => { if (p.dead) return; const q = posOf(p), dx = Math.max(0, Math.abs(pt.x - q.x) - p.w / 2), dy = Math.max(0, Math.abs(pt.y - q.y) - 14), dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = p; } });
        if (best) { setLock(best); host.sfx('tick'); }
      });

      // ------------------------------------------------------------- frame
      function draw(dt, t) {
        tNow = t; if (!W) return;
        ctx.clearRect(0, 0, W, H);
        // sim
        if (started && !over) {
          elapsed += dt;
          host.setTimer(Math.max(0, T - elapsed)); host.setProgress(Math.min(1, elapsed / T));
          const calm = (elapsed % calmEvery) > calmEvery - calmLen && elapsed < T * 0.85, surge = elapsed > T * 0.85;
          if (freezeT > 0) freezeT -= dt; if (slowT > 0) slowT -= dt; if (overT > 0) { overT -= dt; if (overT <= 0) { combo = 0; txt.add(W / 2, H * 0.3, 'OVERDRIVE END', COL.dim, 15); } }
          const speedMul = freezeT > 0 ? 0 : (slowT > 0 ? 0.3 : 1) * (overT > 0 ? 0.6 : 1) * (surge ? 1.12 : 1);
          spawnT -= dt * (freezeT > 0 ? 0.25 : 1);
          if (spawnT <= 0 && elapsed < T - 4) { spawn(); spawnT = spawnEvery * (calm ? 2.8 : 1) * (surge ? 0.58 : 1) * (0.8 + host.rand() * 0.4); if (!calm && d >= 6 && host.rand() < 0.18) spawnT *= 0.35; }
          packets.forEach((p) => { if (!p.dead) { p.prog += dt / p.fall * speedMul; if (p.prog >= 1) breach(p); } });
          if (elapsed >= T && !over) {
            over = true;
            const acc = allKeys ? okKeys / allKeys : 1, kr = spawnedReal ? kills / spawnedReal : 1, wpm = (okKeys / 5) / (T / 60);
            const wf = C.clamp(wpm / (24 + d * 4), 0, 1);
            const sc = C.clamp(0.22 + 0.28 * acc + 0.26 * kr + 0.12 * (integrity / 100) + 0.12 * wf + 0.02 * overUsed - 0.04 * trapHits, 0.3, 1);
            host.sfx('success'); host.setStatus('CORE HELD', 'good');
            host.finish({ success: true, score: sc, stats: { Destroyed: `${kills}/${spawnedReal}`, Accuracy: Math.round(acc * 100) + '%', WPM: Math.round(wpm), 'Best combo': bestCombo, Integrity: Math.round(integrity) + '%' } });
          }
        }
        for (let i = packets.length - 1; i >= 0; i--) { const p = packets[i]; if (p.dead) { p.dying -= dt; if (p.dying <= 0 && p.prog >= 0) packets.splice(i, 1); } }
        if (shakeT > 0) shakeT -= dt; if (flashBad > 0) flashBad -= dt;
        // render
        ctx.save();
        if (shakeT > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
        ctx.strokeStyle = 'rgba(70,80,92,.22)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = (t * (horiz ? 20 : 0)) % 36; x < W; x += 36) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = (horiz ? 0 : (t * 20) % 36); y < H; y += 36) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
        // core
        const ci = integrity / 100, ccol = ci > 0.6 ? COL.g : ci > 0.3 ? COL.amb : COL.r;
        if (horiz) { ctx.fillStyle = '#15191e'; ctx.fillRect(0, 0, 30, H); ctx.fillStyle = ccol; ctx.fillRect(26, H * (1 - ci), 4, H * ci); ctx.fillStyle = '#2b3037'; ctx.fillRect(30, 0, 1, H); ctx.save(); ctx.translate(15, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = COL.dim; ctx.font = '600 10px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CORE ' + Math.round(integrity) + '%', 0, 3); ctx.restore(); }
        else { ctx.fillStyle = '#15191e'; ctx.fillRect(0, H - 30, W, 30); ctx.fillStyle = '#2b3037'; ctx.fillRect(0, H - 30, W, 1); ctx.fillStyle = ccol; ctx.fillRect(0, H - 4, W * ci, 4); ctx.fillStyle = COL.dim; ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('CORE ' + Math.round(integrity) + '%', 10, H - 13); if (shieldN) { ctx.fillStyle = COL.blue; ctx.textAlign = 'right'; ctx.fillText('SHIELD ×' + shieldN, W - 10, H - 13); } }
        if (horiz && shieldN) { ctx.fillStyle = COL.blue; ctx.font = '600 10px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('SHIELD ×' + shieldN, 38, H - 6); }
        // packets
        ctx.textBaseline = 'middle';
        packets.forEach((p) => {
          const q = posOf(p), isL = lock === p; let a = p.dead ? Math.max(0, p.dying / 0.3) : 1;
          const bw = p.w, bh = 28, x = q.x - bw / 2, y = q.y - bh / 2;
          const col = p.type === 'burst' ? COL.amb : p.type === 'ice' ? COL.ice : p.type === 'trap' ? COL.r : p.long ? COL.vio : COL.blue;
          ctx.globalAlpha = a * (freezeT > 0 ? 0.8 : 1);
          if (isL && lock) { ctx.strokeStyle = 'rgba(223,230,238,.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); if (horiz) { ctx.moveTo(30, H / 2); ctx.lineTo(q.x - bw / 2, q.y); } else { ctx.moveTo(W / 2, H - 30); ctx.lineTo(q.x, q.y + bh / 2); } ctx.stroke(); ctx.setLineDash([]); }
          ctx.fillStyle = p.type === 'trap' ? '#2a1618' : p.type === 'burst' ? '#2c2412' : p.type === 'ice' ? '#132530' : '#1c2128';
          ctx.strokeStyle = col; ctx.lineWidth = isL ? 2.2 : 1.2;
          ctx.beginPath(); const r = 6; ctx.moveTo(x + r, y); ctx.arcTo(x + bw, y, x + bw, y + bh, r); ctx.arcTo(x + bw, y + bh, x, y + bh, r); ctx.arcTo(x, y + bh, x, y, r); ctx.arcTo(x, y, x + bw, y, r); ctx.closePath(); ctx.fill(); ctx.stroke();
          if (p.type === 'trap') { ctx.fillStyle = COL.r; ctx.font = '700 9px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('TRAP', x + 4, y - 6); }
          else if (p.type === 'burst') { ctx.fillStyle = COL.amb; ctx.font = '700 9px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('BURST', x + 4, y - 6); }
          else if (p.type === 'ice') { ctx.fillStyle = COL.ice; ctx.font = '700 9px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('FREEZE', x + 4, y - 6); }
          ctx.font = font(); ctx.textAlign = 'left'; let cx = x + 11;
          for (let i = 0; i < p.word.length; i++) { const ch = p.word[i]; ctx.fillStyle = i < p.typed ? COL.g : (p.type === 'trap' ? '#f09a9a' : COL.norm); ctx.fillText(ch, cx, q.y + 1); cx += ctx.measureText(ch).width; }
          if (isL) { const cur = cx; ctx.fillStyle = COL.amb; if (Math.sin(t * 12) > -0.3 && p.typed < p.word.length) ctx.fillRect(x + 11 + ctx.measureText(p.word.slice(0, p.typed)).width, q.y + 9, ctx.measureText(p.word[p.typed] || ' ').width, 2); }
          ctx.globalAlpha = 1;
        });
        // HUD overlays
        const wpm = elapsed > 3 ? Math.round((okKeys / 5) / (elapsed / 60)) : 0, acc = allKeys ? Math.round(okKeys / allKeys * 100) : 100;
        ctx.fillStyle = 'rgba(154,162,173,.9)'; ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`WPM ${wpm}   ACC ${acc}%   COMBO ×${combo}`, horiz ? 40 : 10, 16);
        if (overT > 0) { ctx.fillStyle = COL.amb; ctx.textAlign = 'right'; ctx.fillText(`OVERDRIVE ${overT.toFixed(1)}s`, W - 10, 16); ctx.fillStyle = 'rgba(224,166,58,.07)'; ctx.fillRect(0, 0, W, H); }
        if (freezeT > 0) { ctx.fillStyle = 'rgba(108,196,224,.08)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = COL.ice; ctx.textAlign = 'right'; ctx.fillText(`Chronos ${Math.ceil(freezeT)}s`, W - 10, overT > 0 ? 30 : 16); }
        if (slowT > 0) { ctx.fillStyle = COL.ice; ctx.textAlign = 'center'; ctx.fillText('SLOWED', W / 2, 16); }
        if (flashBad > 0) { ctx.strokeStyle = `rgba(239,91,91,${flashBad * 2.4})`; ctx.lineWidth = 4; ctx.strokeRect(2, 2, W - 4, H - 4); }
        if (!started) { ctx.fillStyle = 'rgba(154,162,173,.7)'; ctx.textAlign = 'center'; ctx.font = '600 13px system-ui,sans-serif'; ctx.fillText('Get ready…', W / 2, H / 2); }
        fx.update(dt); fx.draw(ctx); txt.update(dt); txt.draw(ctx);
        ctx.restore();
      }
      host.loop(draw);

      return {
        start() { started = true; host.setTimer(T); host.setStatus(touch ? 'Tap a packet or just start typing' : 'Type the words on the packets', ''); },
        tool(id) {
          if (over) return false;
          if (id === 'hint') {
            const live = packets.filter((p) => !p.dead && p.type !== 'trap' && p.type !== 'ice').sort((a, b) => b.prog - a.prog); if (!live.length) return false;
            const p = live[0]; host.sfx('zap'); txt.add(posOf(p).x, posOf(p).y - 18, 'Oracle', COL.amb, 13); kill(p); return true;
          }
          if (id === 'freeze') { freezeT += 6; host.sfx('good'); host.setStatus('Chronos: all packets frozen 6 s', 'good'); return true; }
          if (id === 'shield') { if (shieldN >= 2) return false; shieldN = Math.min(2, shieldN + 2); host.sfx('good'); host.setStatus('Aegis: the next 2 breaches are absorbed', 'good'); return true; }
          return false;
        },
        onFinish() { over = true; },
        debug: {
          solve() { for (let i = 0; i < 4; i++) { elapsed = T; } },
          fail() { integrity = 0; checkDead(); },
          info() { return { T, fallBase, spawnEvery, maxLen, pool: new Set(pool).size, dmgBase, horiz, touch, packets: packets.length }; },
          state() { return { packets: packets.filter((p) => !p.dead).map((p) => ({ w: p.word, type: p.type, prog: p.prog })), lock: lock && lock.word, integrity, kills }; },
          type(s) { [...s].forEach((c) => press(c)); },
        },
      };
    },
  });
})();
