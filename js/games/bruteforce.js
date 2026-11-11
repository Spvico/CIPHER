/* BRUTEFORCE — Mastermind-style passcode cracking with deduction aids (entropy meter, auto-notes) */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h;
  const HEX = '0123456789ABCDEF';

  C.mg.register({
    id: 'bruteforce', name: 'BRUTEFORCE', icon: '▣',
    blurb: 'Crack the passcode before the ICE wakes up.',
    info: {
      goal: 'Deduce the hidden glyph code. ◆ = right glyph, right slot.  ◇ = right glyph, wrong slot.',
      touch: ['Tap glyph keys to fill the slots, ⏎ Submit to test a guess', 'Tap NOTES to mark glyphs you have ruled out', 'Watch CANDIDATES: how many codes still fit your clues'],
      controls: ['Type 0-9 / A-F or click a glyph to fill the next slot', 'Backspace removes · Enter submits the guess', 'Click a cell in the NOTES grid (or right-click a glyph) to mark eliminated glyphs', 'Watch the CANDIDATES meter: it shows how many codes still fit your clues'],
    },
    create(host) {
      const d = host.params.difficulty, bonus = host.params.bonus;
      const len = d < 2.5 ? 3 : d < 5.5 ? 4 : d < 8.5 ? 5 : d < 10 ? 5 : 6;
      const n = d >= 10 ? 8 : C.clamp(Math.round(4 + d * 0.6), 5, 10);
      const repeats = d >= 3.5;
      const maxTries = ({ 3: 7, 4: repeats ? 10 : 9, 5: 10, 6: 11 }[len]) + bonus.lives;
      const par = len + (repeats ? 1 : 0);
      let timeLeft = (100 + len * 14 + (repeats ? 20 : 0)) * (1 + bonus.time), timeMax = timeLeft;
      // secret
      const secret = [];
      if (repeats) for (let i = 0; i < len; i++) secret.push(host.randInt(0, n - 1));
      else host.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, len).forEach((v) => secret.push(v));

      const hue = (s) => Math.round((s / n) * 330 + 160) % 360;
      const symCol = (s) => `hsl(${hue(s)} 85% 62%)`;

      host.css(`
        .bf{position:absolute;inset:0;display:grid;grid-template-columns:minmax(300px,1fr) minmax(340px,430px);gap:22px;padding:20px 26px;font-family:var(--ff-mono);}
        .bf canvas.bfbg{position:absolute;inset:0;width:100%;height:100%;opacity:.5;pointer-events:none}
        .bf-col{position:relative;display:flex;flex-direction:column;gap:10px;min-height:0;min-width:0}
        .bf-hist{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:6px;padding-right:6px}
        .bf-row{display:flex;align-items:center;gap:8px;padding:5px 8px;border:1px solid var(--ln);background:rgba(28,30,34,.75);animation:bf-in .25s ease-out}
        .bf-row.empty{opacity:.28;animation:none}
        @keyframes bf-in{from{transform:translateX(-14px);opacity:0}}
        .bf-i{width:26px;color:var(--dd);font-family:var(--ff-ui);font-size:12px}
        .bf-g{width:36px;height:40px;display:flex;align-items:center;justify-content:center;font-family:var(--ff-ui);font-weight:700;font-size:21px;border:1px solid var(--ln2);background:var(--p1);color:#fff;position:relative;transition:transform .12s,box-shadow .12s}
        .bf-g.cur{border-color:var(--c);box-shadow:0 0 12px rgba(77,156,255,.5);cursor:pointer}
        .bf-g.cur.on{background:rgba(77,156,255,.1)}
        .bf-g.lock::after{content:'';position:absolute;right:2px;top:2px;width:6px;height:6px;background:var(--a)}
        .bf-g.pop{animation:bf-pop .18s}
        @keyframes bf-pop{50%{transform:scale(1.18)}}
        .bf-pegs{margin-left:auto;display:grid;grid-template-columns:repeat(${Math.min(len, 6)},14px);gap:3px;font-size:15px;line-height:14px}
        .bf-pegs b{font-weight:400;text-align:center}.bf-ex{color:var(--g);text-shadow:0 0 8px var(--g)}.bf-mi{color:var(--a)}.bf-no{color:var(--dd)}
        .bf-head{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;justify-content:space-between;font-family:var(--ff-ui);font-size:12px;color:var(--d)}
        .bf-head b{color:var(--t)}
        .bf-cur{display:flex;gap:8px;align-items:center;justify-content:center;padding:12px;border:1px solid var(--ln2);background:rgba(25,28,31,.85)}
        .bf-keys{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}
        .bf-k{height:44px;font-family:var(--ff-ui);font-weight:700;font-size:20px;background:var(--p2);border:1px solid var(--ln2);cursor:pointer;color:#fff;position:relative;transition:transform .06s,filter .1s}
        .bf-k:hover{filter:brightness(1.4);transform:translateY(-1px)}.bf-k:active{transform:translateY(1px)}
        .bf-k i{position:absolute;left:0;right:0;bottom:0;height:3px}
        .bf-notes{display:grid;gap:2px;padding:8px;border:1px solid var(--ln);background:rgba(25,28,31,.85);font-size:11px;color:var(--d)}
        .bf-n{display:flex;gap:2px;align-items:center}.bf-n span{width:18px;text-align:center;font-family:var(--ff-ui);font-weight:700}
        .bf-c{width:22px;height:16px;border:1px solid var(--ln);background:var(--p1);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--r);font-size:11px}
        .bf-c.x{background:#24282d;border-color:#3d434c}.bf-c.x::after{content:'✕'}.bf-c.auto{opacity:.55}
        .bf-c.k{background:#2a2e34;border-color:var(--g)}.bf-c.k::after{content:'◆';color:var(--g)}
        .bf-ent{padding:8px 10px;border:1px solid var(--ln);background:rgba(25,28,31,.85)}
        .bf-ent .t{display:flex;justify-content:space-between;font-family:var(--ff-ui);font-size:11px;color:var(--d)}
        .bf-ent b{color:var(--c);font-size:17px}
        .bf-btns{display:flex;gap:8px}
        .bf-shield{color:var(--c);font-family:var(--ff-ui);font-size:11px;}
        .bf-nb{display:none}
        .bf.narrow,.bf.short{grid-template-columns:minmax(0,1fr);padding:8px 10px;gap:8px;overflow:auto;touch-action:pan-y;align-content:start}
        .bf.short{grid-template-columns:minmax(0,1fr) minmax(240px,320px)}
        .bf.narrow .bf-nb,.bf.short .bf-nb{display:inline-flex}
        .bf.narrow .bf-notes,.bf.short .bf-notes{display:none;position:absolute;right:6px;top:6px;z-index:6;max-height:96%;overflow:auto;background:rgba(22,25,28,.97);box-shadow:0 0 30px #000}
        .bf.notes-open .bf-notes{display:grid!important}
        .bf.narrow .bf-hist{max-height:34vh;min-height:100px}.bf.short .bf-hist{max-height:none}
        .bf.narrow .bf-g,.bf.short .bf-g{width:30px;height:34px;font-size:17px}
        .bf.narrow .bf-row,.bf.short .bf-row{padding:3px 6px;gap:5px}
        .bf.narrow .bf-k,.bf.short .bf-k{height:40px}
        .bf.short .bf-cur{padding:6px}.bf.short .bf-keys{gap:4px}.bf.short .bf-k{height:34px;font-size:17px}
        .bf.short .bf-ent,.bf.short .bf-head:nth-of-type(n+3){display:none}
        .bf.win .bf-secret .bf-g{border-color:var(--g);box-shadow:0 0 16px var(--g);color:var(--g)}
      `);

      // --- DOM
      const wrap = h('div', { class: 'bf' });
      const bg = h('canvas', { class: 'bfbg' });
      const hist = h('div', { class: 'bf-hist' });
      const triesEl = h('b'), timeEl = h('b');
      const left = h('div', { class: 'bf-col' },
        h('div', { class: 'bf-head' }, h('span', 'ATTEMPTS ', triesEl), h('span', 'GLYPHS ', h('b', `${len} of ${n}${repeats ? ' (repeats)' : ' (unique)'}`))), hist);
      const curRow = h('div', { class: 'bf-cur' });
      const keys = h('div', { class: 'bf-keys' });
      const notes = h('div', { class: 'bf-notes' });
      const entVal = h('b', '—'), entBar = h('div', { class: 'bar c' }, h('i')), entTxt = h('div', { class: 'dim', style: { fontSize: '11px', marginTop: '4px' } });
      const shieldEl = h('div', { class: 'bf-shield' });
      const submitBtn = h('button', { class: 'btn pri', onclick: () => submit() }, 'Submit ⏎');
      const delBtn = h('button', { class: 'btn', onclick: () => back() }, '⌫');
      const right = h('div', { class: 'bf-col' },
        h('div', { class: 'bf-head' }, h('span', 'CURRENT GUESS'), shieldEl, h('button', { class: 'btn sm bf-nb', onclick: () => wrap.classList.toggle('notes-open') }, 'NOTES')), curRow, keys,
        h('div', { class: 'bf-btns' }, delBtn, submitBtn),
        h('div', { class: 'bf-ent' }, h('div', { class: 't' }, h('span', 'CANDIDATES REMAINING'), entVal), entBar, entTxt),
        h('div', { class: 'bf-head' }, h('span', 'NOTES (click to eliminate)')), notes);
      wrap.append(bg, left, right);
      host.root.append(wrap);

      // --- candidate enumeration (for the entropy meter + hints)
      const total = Math.pow(n, len);
      let cand = null, candN = 0;
      function buildCands() {
        const arr = new Uint8Array(total * len); let c = 0; const cur = new Array(len);
        (function rec(p, used) { if (p === len) { for (let i = 0; i < len; i++) arr[c * len + i] = cur[i]; c++; return; } for (let s = 0; s < n; s++) { if (!repeats && used & (1 << s)) continue; cur[p] = s; rec(p + 1, used | (1 << s)); } })(0, 0);
        cand = arr; candN = c;
      }
      function score(g, s) {
        let ex = 0; const cg = new Array(n).fill(0), cs = new Array(n).fill(0);
        for (let i = 0; i < len; i++) { if (g[i] === s[i]) ex++; else { cg[g[i]]++; cs[s[i]]++; } }
        let mi = 0; for (let k = 0; k < n; k++) mi += Math.min(cg[k], cs[k]);
        return [ex, mi];
      }
      function filterCands(g, ex, mi) {
        let w = 0; const tmp = new Array(len);
        for (let r = 0; r < candN; r++) { for (let i = 0; i < len; i++) tmp[i] = cand[r * len + i]; const sc = score(g, tmp); if (sc[0] === ex && sc[1] === mi) { if (w !== r) for (let i = 0; i < len; i++) cand[w * len + i] = tmp[i]; w++; } }
        candN = w;
      }
      function updateEntropy() {
        if (!cand) buildCands();
        entVal.textContent = candN.toLocaleString();
        const bits = candN > 0 ? Math.log2(candN) : 0, maxBits = Math.log2(total);
        entBar.firstChild.style.width = (maxBits ? (bits / maxBits) * 100 : 0) + '%';
        entTxt.textContent = candN <= 1 ? 'One code left. You have cracked it!' : `≈ ${bits.toFixed(1)} bits of uncertainty`;
        entTxt.style.color = candN <= 1 ? 'var(--g)' : '';
      }

      // --- state
      const guess = new Array(len).fill(-1), locked = new Array(len).fill(false);
      let cursor = 0, tries = 0, over = false, shield = 0, freezeT = 0, started = false;
      const elim = Array.from({ length: n }, () => new Array(len).fill(0)); // 0 none, 1 manual, 2 auto, 3 known-correct
      const history = [];

      function glyph(s, cls) { return h('div', { class: 'bf-g ' + (cls || ''), style: s >= 0 ? { color: symCol(s), textShadow: `0 0 8px ${symCol(s)}` } : {} }, s >= 0 ? HEX[s] : '·'); }
      function renderCur() {
        C.clear(curRow);
        for (let i = 0; i < len; i++) {
          const g = glyph(guess[i], 'cur' + (i === cursor ? ' on' : '') + (locked[i] ? ' lock' : ''));
          g.addEventListener('click', () => { if (!host.active) return; cursor = i; renderCur(); host.sfx('click'); });
          g.addEventListener('contextmenu', (e) => { e.preventDefault(); if (host.active && !locked[i]) { guess[i] = -1; cursor = i; renderCur(); } });
          curRow.append(g);
        }
      }
      function renderKeys() {
        C.clear(keys);
        for (let s = 0; s < n; s++) {
          const b = h('button', { class: 'bf-k', title: 'Glyph ' + HEX[s], style: { color: symCol(s) }, onclick: () => put(s) }, HEX[s], h('i', { style: { background: symCol(s) } }));
          b.addEventListener('contextmenu', (e) => { e.preventDefault(); for (let p = 0; p < len; p++) if (elim[s][p] === 0) elim[s][p] = 1; renderNotes(); host.sfx('tick'); });
          keys.append(b);
        }
      }
      function renderNotes() {
        C.clear(notes); notes.style.gridTemplateColumns = '1fr';
        const hdr = h('div', { class: 'bf-n' }, h('span', ''), Array.from({ length: len }, (_, i) => h('span', '#' + (i + 1))));
        notes.append(hdr);
        for (let s = 0; s < n; s++) {
          const r = h('div', { class: 'bf-n' }, h('span', { style: { color: symCol(s) } }, HEX[s]));
          for (let p = 0; p < len; p++) {
            const v = elim[s][p];
            const c = h('div', { class: 'bf-c' + (v === 1 ? ' x' : v === 2 ? ' x auto' : v === 3 ? ' k' : ''), onclick: () => { if (!host.active || v >= 2) return; elim[s][p] = v ? 0 : 1; renderNotes(); host.sfx('tick'); } });
            r.append(c);
          }
          notes.append(r);
        }
      }
      function renderHistory() {
        C.clear(hist);
        history.forEach((hr, i) => hist.append(histRow(i, hr)));
        for (let i = history.length; i < maxTries; i++) hist.append(h('div', { class: 'bf-row empty' }, h('span', { class: 'bf-i' }, String(i + 1).padStart(2, '0')), Array.from({ length: len }, () => glyph(-1))));
        hist.scrollTop = hist.scrollHeight;
        triesEl.textContent = `${maxTries - tries} / ${maxTries}`;
      }
      function histRow(i, hr) {
        const pegs = h('div', { class: 'bf-pegs' });
        for (let k = 0; k < len; k++) pegs.append(h('b', { class: k < hr.ex ? 'bf-ex' : k < hr.ex + hr.mi ? 'bf-mi' : 'bf-no' }, k < hr.ex ? '◆' : k < hr.ex + hr.mi ? '◇' : '·'));
        return h('div', { class: 'bf-row' }, h('span', { class: 'bf-i' }, String(i + 1).padStart(2, '0')), hr.g.map((s) => glyph(s)), pegs);
      }
      function put(s) {
        if (!host.active) return;
        let p = locked[cursor] ? guess.findIndex((v, i) => v < 0 && !locked[i]) : cursor;
        if (p < 0) p = guess.findIndex((v, i) => !locked[i]);
        if (p < 0) return;
        guess[p] = s; host.sfx('type');
        let nx = p + 1; while (nx < len && locked[nx]) nx++; cursor = Math.min(nx, len - 1);
        renderCur(); const g = curRow.children[p]; if (g) g.classList.add('pop');
      }
      function back() {
        if (!host.active) return;
        let p = cursor; if (guess[p] < 0 || locked[p]) { p = cursor - 1; while (p >= 0 && locked[p]) p--; }
        if (p < 0) return;
        guess[p] = -1; cursor = p; renderCur(); host.sfx('tick');
      }
      function submit() {
        if (!host.active || over) return;
        if (guess.some((v) => v < 0)) { host.setStatus('Fill every slot first.', 'warn'); host.sfx('deny'); return; }
        if (!repeats && new Set(guess).size < len) { host.setStatus('This lock uses unique glyphs: no repeats.', 'warn'); host.sfx('deny'); return; }
        const g = guess.slice(); const [ex, mi] = score(g, secret);
        if (!cand) buildCands();
        if (ex === len) { history.push({ g, ex, mi }); tries++; return win(); }
        filterCands(g, ex, mi);
        history.push({ g, ex, mi });
        // auto-notes: a glyph with zero hits can't be anywhere
        if (ex === 0 && mi === 0) g.forEach((s) => { for (let p = 0; p < len; p++) elim[s][p] = Math.max(elim[s][p], 2); });
        else if (ex === 0) g.forEach((s, p) => { if (elim[s][p] === 0) elim[s][p] = 2; });
        if (shield > 0 && !(ex === len)) { shield--; history.pop(); host.setStatus('Aegis absorbed the failed guess: no attempt lost.', 'good'); host.sfx('good'); }
        else {
          tries++;
          if (history.length > 1) host.penalty(1.5 + 0.3 * len, 'wrong passcode');
          host.sfx(ex > 0 ? 'good' : 'bad');
          host.setStatus(`${ex} in place · ${mi} misplaced`, ex ? 'good' : 'warn');
        }
        for (let i = 0; i < len; i++) if (!locked[i]) guess[i] = -1;
        cursor = guess.findIndex((v, i) => !locked[i]); if (cursor < 0) cursor = 0;
        renderCur(); renderHistory(); renderNotes(); updateEntropy(); updShield();
        if (tries >= maxTries) lose('OUT OF ATTEMPTS');
      }
      function win() {
        over = true; wrap.classList.add('win'); host.sfx('success');
        renderHistory();
        const sec = h('div', { class: 'bf-cur bf-secret' }, secret.map((s) => glyph(s)));
        curRow.replaceWith(sec);
        const att = Math.max(0, 1 - (tries - par) / Math.max(1, maxTries - par));
        const sc = C.clamp(0.7 * att + 0.3 * (timeLeft / timeMax) + (tries <= par ? 0.1 : 0), 0.25, 1);
        host.setStatus('PASSCODE ACCEPTED', 'good');
        host.finish({ success: true, score: sc, stats: { Guesses: `${tries}/${maxTries}`, 'Time left': C.fmt.time(timeLeft), Glyphs: len } });
      }
      function lose(why) {
        over = true; host.sfx('fail'); host.setStatus(why + '. The code was ' + secret.map((s) => HEX[s]).join(' '), 'bad');
        const sec = h('div', { class: 'bf-cur bf-secret' }, secret.map((s) => glyph(s))); curRow.replaceWith(sec);
        host.finish({ success: false, score: 0, stats: { Reason: why, Guesses: `${tries}/${maxTries}` } });
      }
      function updShield() { shieldEl.textContent = shield ? '⬡ Aegis ARMED ×' + shield : freezeT > 0 ? '❄ TIME FROZEN ' + Math.ceil(freezeT) + 's' : ''; }

      host.listen(window, 'keydown', (e) => {
        if (!host.active || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key;
        if (k === 'Enter') { e.preventDefault(); submit(); }
        else if (k === 'Backspace') { e.preventDefault(); back(); }
        else if (k === 'ArrowLeft') { e.preventDefault(); cursor = Math.max(0, cursor - 1); renderCur(); }
        else if (k === 'ArrowRight') { e.preventDefault(); cursor = Math.min(len - 1, cursor + 1); renderCur(); }
        else if (k.length === 1) { const v = HEX.indexOf(k.toUpperCase()); if (v >= 0 && v < n) { e.preventDefault(); put(v); } }
      });

      // background hex rain
      const bctx = bg.getContext('2d'); const cols = [];
      host.loop((dt, t) => {
        if (bg.width !== wrap.clientWidth || bg.height !== wrap.clientHeight) { bg.width = wrap.clientWidth; bg.height = wrap.clientHeight; cols.length = 0; for (let i = 0; i < Math.ceil(bg.width / 20); i++) cols.push(Math.random() * bg.height); }
        bctx.clearRect(0, 0, bg.width, bg.height); bctx.font = '12px monospace'; bctx.fillStyle = 'rgba(63,185,107,.12)';
        for (let i = 0; i < cols.length; i++) { cols[i] += (30 + (i % 5) * 14) * dt; if (cols[i] > bg.height + 60) cols[i] = -20; for (let k = 0; k < 5; k++) bctx.fillText(HEX[(i * 3 + k + Math.floor(t * 3)) & 15], i * 20, cols[i] - k * 14); }
        if (!started || over) return;
        if (freezeT > 0) { freezeT -= dt; updShield(); } else { timeLeft -= dt; }
        host.setTimer(timeLeft);
        if (timeLeft <= 0) lose('TIMEOUT');
      });

      renderCur(); renderKeys(); renderNotes(); renderHistory(); updShield();
      host.onResize((v) => { wrap.classList.toggle('narrow', v.narrow); wrap.classList.toggle('short', v.h < 430 && !v.narrow); });
      setTimeout(updateEntropy, 30);

      return {
        start() { started = true; host.setTimer(timeLeft); host.setStatus(`Crack a ${len}-glyph code. Hit Enter to submit.`); },
        tool(id) {
          if (over) return false;
          if (id === 'hint') {
            const open = []; for (let i = 0; i < len; i++) if (!locked[i]) open.push(i);
            if (open.length <= 1) return false;
            const p = host.pick(open); locked[p] = true; guess[p] = secret[p];
            for (let s = 0; s < n; s++) for (let q = 0; q < len; q++) if (q === p || s === secret[p]) { if (s === secret[p] && q === p) elim[s][q] = 3; else if (q === p || (!repeats)) elim[s][q] = Math.max(elim[s][q], 2); }
            if (!cand) buildCands();
            const w = new Uint8Array(candN * len); let c = 0; for (let r = 0; r < candN; r++) if (cand[r * len + p] === secret[p]) { for (let i = 0; i < len; i++) w[c * len + i] = cand[r * len + i]; c++; }
            cand = w; candN = c; cursor = guess.findIndex((v, i) => !locked[i] && v < 0); if (cursor < 0) cursor = 0;
            renderCur(); renderNotes(); updateEntropy();
            host.setStatus(`Oracle: slot ${p + 1} is ${HEX[secret[p]]}`, 'good'); host.sfx('good'); return true;
          }
          if (id === 'freeze') { freezeT = 10; updShield(); host.setStatus('Chronos: timer frozen for 10 s', 'good'); return true; }
          if (id === 'shield') { if (shield >= 2) return false; shield++; updShield(); host.setStatus('Aegis armed: your next wrong guess is free.', 'good'); return true; }
          return false;
        },
        onFinish() { over = true; },
        destroy() {},
        debug: { solve() { secret.forEach((s, i) => { guess[i] = s; }); tries = Math.max(tries, par); submit(); }, fail() { over = false; tries = maxTries - 1; for (let i = 0; i < len; i++) guess[i] = (secret[i] + 1) % n; if (!repeats) { const g = secret.slice().reverse(); for (let i = 0; i < len; i++) guess[i] = g[i]; if (g.join() === secret.join()) { guess[0] = (secret[0] + 1) % n; } } submit(); if (!host.done) lose('DEBUG'); }, secret },
      };
    },
  });
})();
