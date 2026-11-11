/* DECRYPT — cryptanalysis. Recover an intercepted message.
   d<3  Caesar (find the shift)         d3–5 keyword substitution (given letters + frequency panel)
   d5–8 full substitution cryptogram    d8+  Vigenère (per-column key letters + crib words)
   DOM-based UI (works with mouse, keyboard and touch) with a built-in A–Z pad on phones. */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h;
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LINES = [
    'The door is open. Walk in quietly.', 'Trust nothing. Verify everything.', 'Every system has one weak link.', 'The best plan is a patient one.',
    'Silence is the best cover on a wire.', 'Logs only lie when you let them.', 'The firewall blinked and looked away.', 'Patience beats brute force every time.',
    'Ghosts do not leave footprints.', 'A quiet port is a suspicious port.', 'Rotate your keys and rotate them often.', 'People are the oldest protocol of all.',
    'Every lock was built by someone in a hurry.', 'Keep the line open and the lights low.', 'Follow the cable until it stops making sense.',
    'The city runs on code nobody remembers writing.', 'Static on the line means somebody else is listening.', 'Every secret is just a locked door waiting for the right idea.',
    'We move in the gaps between their scheduled scans.', 'Dawn is coming, so finish the job and leave the grid clean.',
    'The password was on a sticky note under the keyboard all along.', 'Meet at the usual relay at midnight and keep the channel quiet.',
    'Their night watch is asleep, so move now before the shift change.', 'The vault accepts only one key, but the guard accepts a convincing smile.',
    'Someone is watching the network, so reroute through three relays and go dark.', 'The admin never changed the factory settings, and that is how we got in.',
    'Every packet tells a story if you know how to read between the headers.', 'Smoke and mirrors hide the real server. Look for the heartbeat in the noise.',
    'A good operator listens more than she types. The network always talks eventually.', 'They fixed the front door last week, but the cellar window is still unlocked.',
    'The old mainframe still trusts anyone who knows the right three letter greeting.', 'Trace detected. Cut the line, change the route, and vanish into the static.',
    'The city sleeps above us while the cables hum below. Stay low and stay fast.', 'Nothing in this building is as secure as the people inside believe it to be.',
    'Tonight the company rotates its master keys. For ninety seconds the old vault and the new vault both stand open. Be ready.',
    'We found their backup machine in a basement across the sea. It has no monitoring, no guard, and a password that is just the word password.',
    'The auditors check the records on Monday. By then every entry must tell the story of an ordinary week in which nothing happened at all.',
    'Once inside, do not rush. Map the network, find the quiet corners, and learn the rhythm of the night shift before you touch anything valuable.',
    'Every wire hums a secret and every secret has a price. The trick is to be the one who listens while everyone else is busy talking.',
    'The relay will stay open for exactly one minute. After that the connection resets and the whole plan goes back into the dark.',
    'Borrow a badge, borrow a smile, and ride the elevator to the server floor. People are the weakest part of any secure building.',
    'Their encryption is strong but their routine is weak. An intern with a spreadsheet is worth a thousand supercomputers.',
    'The signal came from inside the house. Someone on the team has been sharing the access list with the highest bidder for months.',
    'Keep your timing sharp and your exit planned before you enter. Greed is how most of us get caught in the end.',
    'Midnight on the dark market. A new buyer wants the old maps and has already sent half of the payment in untraceable credits.',
    'One misplaced semicolon once brought down a whole power grid. That is how fragile the world is, and why we are never out of work.',
  ].filter((l) => l.length >= 30 && l.length <= 150);
  const COMMON = ('the and of to a in is you that it he was for on are as with his they i at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who its now find long down day did get come made may part over new sound take only little work know place year live me back give most very after thing our just name good sentence man think say great where help through much before line right too mean old any same tell boy follow came want show also around form three small set put end does another well large must big even such because turn here why ask went men read need land different home us move try kind hand picture again change off play air away animal house point page letter mother answer found study still learn should world high every near add food between own below country plant last school father keep tree never start city earth eye light head under story saw left few while along might close something seem next hard open example begin life always those both paper together got group often run important until children side feet car mile night walk white sea began grow took river four carry state once book hear stop without second later miss enough plain girl usual young ready above ever red list though feel talk bird soon body dog family direct leave song door black short class wind question happen complete ship area half rock order fire south problem piece told knew pass since top whole king space heard best hour better true during hundred five remember step early hold west ground interest reach fast sing listen six table travel less morning ten simple several toward war lay against pattern slow center love person money serve appear road map rain rule pull cold notice voice unit power town fine certain fly fall lead cry dark machine note wait plan figure star box field rest correct able done beauty drive stood contain front teach week final gave green quick warm free minute strong special mind behind clear tail produce fact street nothing course stay wheel full force blue object decide surface deep moon island foot system busy test record boat common gold possible plane dry wonder laugh thousand ago ran check game shape hot brought heat snow bring yes distant fill east paint among').split(' ');
  const DICT = new Set(COMMON);
  LINES.forEach((l) => l.toLowerCase().replace(/[^a-z ]/g, '').split(' ').forEach((w) => w && DICT.add(w)));
  const KEYWORDS = ['SILENCE', 'NETWORK', 'PASSKEY', 'GATEWAY', 'MIRROR', 'SHADOW', 'CIRCUIT', 'BINARY', 'MIDNIGHT', 'RELAY'];
  const KEYS = { 3: ['KEY', 'HEX', 'ZED', 'FOX', 'SIX'], 4: ['ROOT', 'BYTE', 'NODE', 'CODE', 'DISK', 'LOCK'], 5: ['TOKEN', 'PROXY', 'SHELL', 'LOGIC', 'ROUTE', 'VIRUS'], 6: ['CIPHER', 'SOCKET', 'KERNEL', 'BUFFER', 'ROUTER', 'SYSTEM'] };
  const KCOL = ['#4d9cff', '#e0a63a', '#a997f6', '#3fb96b', '#d96bb0', '#6cc4e0'];
  const FREQ_EN = 'ETAOINSHRDLU';
  const ENG = { E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0, D: 4.3, L: 4.0, U: 2.8, C: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0, P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.15, X: 0.15, Q: 0.1, Z: 0.07 };

  C.mg.register({
    id: 'decrypt', name: 'DECRYPT', icon: '🔓',
    blurb: 'Crack the intercepted message with a little cryptanalysis.',
    info: {
      goal: 'Recover the original message. Early nodes use a simple shift cipher, later ones a full substitution, and the hardest use a multi-key cipher.',
      controls: ['Click a letter, then type what you think it stands for', 'Every copy of that letter updates together', 'Common letters and short words are your best clues', 'Arrow keys move · Backspace clears · green words are recognised'],
      touch: ['Tap a letter, then use the A–Z pad to guess it', 'Every copy of that letter updates together', 'Common letters and short words are your best clues', 'Green words are recognised'],
    },
    create(host) {
      const d = host.params.difficulty, bonus = host.params.bonus, touch = !!C.isTouch;
      const mode = d < 3 ? 'caesar' : d < 8 ? 'subst' : 'vig', kw = mode === 'subst' && d < 5;
      const target = C.lerp(34, 128, C.clamp((d - 1) / 10, 0, 1));
      const plain = LINES.map((l) => ({ l, s: Math.abs(l.length - target) + host.rand() * 22 })).sort((a, b) => a.s - b.s)[0].l.toUpperCase();
      let shift = 0; const p2c = {}, tmap = {}; let key = [], keyLen = 0;
      if (mode === 'caesar') shift = host.randInt(3, 23);
      else if (mode === 'subst') {
        let perm;
        if (kw) { const k = host.pick(KEYWORDS), seen = new Set(), out = []; for (const c of k + A) if (!seen.has(c)) { seen.add(c); out.push(c); } const off = host.randInt(3, 22); perm = out.slice(off).concat(out.slice(0, off)); }
        else { for (let t = 0; t < 60; t++) { perm = host.shuffle(A.split('')); let fx = 0; for (let i = 0; i < 26; i++) if (perm[i] === A[i]) fx++; if (fx <= 1) break; } }
        A.split('').forEach((p, i) => { p2c[p] = perm[i]; tmap[perm[i]] = p; });
      } else { keyLen = C.clamp(Math.round(3 + (d - 8) * 0.6), 3, 6); key = host.pick(KEYS[keyLen]).split(''); }

      // ---- cells
      const cells = [], words = []; let li = 0;
      plain.split(' ').forEach((w, wi) => { const ws = []; [...w].forEach((ch) => { const isL = ch >= 'A' && ch <= 'Z', cell = { ch, isL, wi, li: isL ? li++ : -1, p: isL ? ch : null }; if (isL) { const pi = A.indexOf(ch); cell.cl = mode === 'caesar' ? A[(pi + shift) % 26] : mode === 'subst' ? p2c[ch] : A[(pi + A.indexOf(key[cell.li % keyLen])) % 26]; cell.ci = A.indexOf(cell.cl); } cells.push(cell); ws.push(cell); }); words.push(ws); });
      const counts = {}; cells.forEach((c) => { if (c.isL) counts[c.cl] = (counts[c.cl] || 0) + 1; });
      const nLetters = li;
      const timeMax = C.lerp(60, 180, (d - 1) / 13) * (mode === 'vig' ? 1.15 : 1) * (1 + bonus.time);
      let timeLeft = timeMax, tMax = timeMax;

      // ---- state
      let shiftG = 0, guess = {}, keyG = new Array(keyLen).fill(0), lockedC = new Set(), lockedK = new Set(), selCell = null, selL = null, selCol = 0, rng = null, lwT = 0, lwWord = -1;
      let started = false, over = false, casc = -1, scrT = 0, freezeT = 0, hintsUsed = 0, timeBonusUsed = 0, srt = 0;
      let given = 0;
      if (mode === 'subst') { given = C.clamp(Math.round(8 - (d - 3) * 1.6), 1, 8); const order = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 11); host.shuffle(order).slice(0, given).forEach((c) => { guess[c] = tmap[c]; lockedC.add(c); }); }
      if (mode === 'subst') selCell = cells.find((c) => c.isL && !lockedC.has(c.cl)) || cells.find((c) => c.isL);
      if (selCell) selL = selCell.cl;
      const cribA = mode === 'vig' ? words[0] : null, cribB = mode === 'vig' && words.length > 2 ? words[words.length - 1] : null;

      // ---- DOM
      host.css(`.dc{position:absolute;inset:0;display:flex;flex-direction:column;touch-action:manipulation}.dc-main{flex:1;min-height:0;overflow-y:auto;padding:12px 14px 16px;display:flex;flex-direction:column;gap:12px;--cw:22px}
        .dc-note{color:var(--d);font-size:12.5px;line-height:1.45}.dc-note b{color:var(--t);font-weight:600}.dc-note .gd{color:var(--a)}
        .dc-txt{display:flex;flex-wrap:wrap;gap:12px 18px;align-content:flex-start;padding:12px;background:var(--p2);border:1px solid var(--ln);border-radius:8px}
        .dc-w{display:flex;gap:2px;border-radius:5px}.dc-w.lw{outline:1px dashed var(--a);outline-offset:3px}
        .dc-cell{width:var(--cw);display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;border-radius:4px;padding:2px 0 3px}.dc-cell .k{height:12px;font:700 11px/12px var(--ff-mono);color:var(--a)}
        .dc-cell .c{font:600 17px/1 var(--ff-mono);color:var(--d)}.dc-cell .p{width:100%;height:24px;display:flex;align-items:center;justify-content:center;border-bottom:2px solid var(--ln2);font:700 17px/1 var(--ff-mono);color:var(--t)}
        .dc-cell.same{background:rgba(77,156,255,.12)}.dc-cell.sel{background:rgba(77,156,255,.26)}.dc-cell.sel .p{border-color:var(--c)}.dc-cell.lk .p{color:var(--a)}.dc-cell.cf .p{color:var(--r);border-color:var(--r)}
        .dc-w.ok .p{color:var(--g)}.dc-cell.pn{width:10px;cursor:default}.dc-cell.pn .c{color:var(--t)}.dc-cell.pn .p{border-color:transparent}.dc-vig .dc-cell .c{color:var(--kc)}
        .dc-cell.fl{animation:dcfl .5s ease-out}@keyframes dcfl{0%{background:rgba(63,185,107,.55)}100%{background:transparent}}
        .dc-box{background:var(--p2);border:1px solid var(--ln);border-radius:8px;padding:10px 12px}.dc-box h4{margin:0 0 8px;font:600 12px var(--ff-ui);color:var(--d)}
        .dc-fq{display:grid;grid-template-columns:repeat(26,1fr);gap:2px;height:96px}.dc-fb{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;cursor:pointer;border-radius:3px;min-width:0}
        .dc-fb .bar{width:68%;background:var(--ln2);min-height:1px;border-radius:2px 2px 0 0}.dc-fb .l{font:600 10px var(--ff-mono);color:var(--d)}.dc-fb .g{font:700 10px/12px var(--ff-mono);color:var(--t);height:12px}.dc-fb.sel{background:rgba(77,156,255,.16)}.dc-fb.sel .bar{background:var(--c)}.dc-fb.lk .g{color:var(--a)}
        .dc-ref{margin-top:8px;font:12px var(--ff-mono);color:var(--dd);word-break:break-word}.dc-ref b{color:var(--d);font-weight:600}
        .dc-strip{display:grid;grid-template-columns:repeat(26,1fr);gap:1px;font:600 12px var(--ff-mono);touch-action:none;cursor:ew-resize;-webkit-user-select:none;user-select:none}.dc-strip div{text-align:center;padding:5px 0}.dc-strip .t{background:var(--p3);color:var(--d)}.dc-strip .b{background:#1c2a3d;color:var(--t)}
        .dc-ctl{display:flex;gap:8px;align-items:center;margin-top:10px}.dc-ctl .btn{min-width:44px;height:38px}.dc-rg{flex:1;height:28px;accent-color:var(--c);margin:0}.dc-rgw{position:relative;flex:1;display:flex;flex-direction:column;justify-content:center}.dc-hl{position:absolute;left:0;bottom:-3px;height:4px;background:var(--a);border-radius:2px;display:none}
        .dc-lab{margin-top:6px;font:13px var(--ff-ui);color:var(--d)}.dc-lab b{color:var(--t);font-family:var(--ff-mono)}
        .dc-vg{display:flex;gap:6px}.dc-kc{flex:1;min-width:0;background:var(--p1);border:1px solid var(--ln);border-top:3px solid var(--kc);border-radius:7px;padding:6px 4px 6px;text-align:center;cursor:pointer}.dc-kc.sel{background:#1f2a3a;border-color:var(--c);border-top-color:var(--kc)}.dc-kc.lk .kl{color:var(--a)}
        .dc-kc .kn{font:11px var(--ff-ui);color:var(--dd)}.dc-kc .kl{font:700 24px/1.15 var(--ff-mono);color:var(--t)}.dc-kc .btn{height:30px;width:100%;min-width:0;padding:0;margin-top:3px}
        .dc-hist{display:grid;grid-template-columns:repeat(26,1fr);gap:1px;height:34px;align-items:end;margin-top:6px}.dc-hist i{display:block;background:var(--ln2);min-height:1px}.dc-hist i.e{background:#7b8896}
        .dc-kb{flex:none;display:flex;flex-direction:column;gap:5px;padding:6px 5px calc(7px + env(safe-area-inset-bottom,0px));background:#15181c;border-top:1px solid var(--ln);-webkit-user-select:none;user-select:none;touch-action:none}
        .dc-kb .r{display:flex;gap:4px;justify-content:center}.dc-kb button{appearance:none;flex:1 1 0;max-width:44px;height:var(--kh,40px);border:0;border-radius:6px;background:#2b3037;color:var(--t);font:600 16px var(--ff-mono);padding:0;touch-action:none}.dc-kb button:active,.dc-kb button.dn{background:var(--acc-bg)}.dc-kb button.fn{background:#222629;color:var(--d)}
        body.compact:not(.portrait) .dc-kb{--kh:27px;gap:3px;padding:3px 5px}body.compact:not(.portrait) .dc-kb button{font-size:13px}body.compact .dc-main{--cw:19px;padding:8px 10px 12px;gap:9px}body.compact .dc-cell .c,body.compact .dc-cell .p{font-size:15px}
        @media(max-width:430px){.dc-main{--cw:19px}}body.compact .dc-fq+.dc-ref{display:none}body.compact .dc-fq{height:72px}body.compact .dc-box{padding:8px 10px}`);
      const wrap = h('div', { class: 'dc' + (mode === 'vig' ? ' dc-vigw' : '') }), main = h('div', { class: 'dc-main' });
      wrap.append(main);
      const cipherName = mode === 'caesar' ? 'Shift cipher' : mode === 'subst' ? (kw ? 'Keyword substitution' : 'Substitution cipher') : `Multi-key cipher (${keyLen} keys)`;
      const noteText = mode === 'caesar' ? '<b>Shift cipher.</b> Every letter was pushed forward by the same amount. Slide the dial until the bottom row reads as English.'
        : mode === 'subst' ? `<b>${cipherName}.</b> Each cipher letter always stands for the same plain letter. <span class="gd">Gold letters are given.</span> Start with the most common letters and short words.`
          : `<b>${cipherName}.</b> The message was encrypted with a ${keyLen}-letter key, so each column uses its own shift. The <span class="gd">gold</span> letters above the first and last word are known plaintext (a crib).`;
      main.append(h('div', { class: 'dc-note', html: noteText }));
      const txt = h('div', { class: 'dc-txt' + (mode === 'vig' ? ' dc-vig' : '') });
      words.forEach((ws, wi) => {
        const wEl = h('div', { class: 'dc-w' }); ws.wEl = wEl;
        ws.forEach((cell) => {
          const el = h('div', { class: 'dc-cell' + (cell.isL ? '' : ' pn') });
          if (mode === 'vig') { el.append(h('div', { class: 'k' })); if (cell.isL) el.style.setProperty('--kc', KCOL[cell.li % keyLen]); }
          cell.cEl = h('div', { class: 'c' }, cell.isL ? cell.cl : cell.ch); cell.pEl = h('div', { class: 'p' });
          el.append(cell.cEl, cell.pEl); cell.el = el; cell.kEl = el.querySelector('.k');
          if (cell.isL) el.addEventListener('click', () => { if (!host.active || casc >= 0) return; if (mode === 'subst') selectCell(cell); else if (mode === 'vig') selectCol(cell.li % keyLen); host.sfx('tick'); });
          wEl.append(el);
        });
        txt.append(wEl);
      });
      if (mode === 'vig') [cribA, cribB].forEach((ws) => { if (ws) ws.filter((c) => c.isL).forEach((c) => { c.kEl.textContent = c.p; }); });
      main.append(txt);

      const T_ = {}; // panel refs
      if (mode === 'caesar') {
        const box = h('div', { class: 'dc-box' }); box.append(h('h4', {}, 'Decoder dial · drag the strip or use the slider'));
        const strip = h('div', { class: 'dc-strip' }); T_.top = []; T_.bot = [];
        for (let i = 0; i < 26; i++) { const t = h('div', { class: 't' }, A[i]); T_.top.push(t); strip.append(t); }
        for (let i = 0; i < 26; i++) { const b = h('div', { class: 'b' }, A[i]); T_.bot.push(b); strip.append(b); }
        let drag = null;
        strip.addEventListener('pointerdown', (e) => { if (!host.active || casc >= 0) return; e.preventDefault(); strip.setPointerCapture(e.pointerId); drag = { x: e.clientX, s: shiftG, cw: strip.getBoundingClientRect().width / 26 }; });
        strip.addEventListener('pointermove', (e) => { if (!drag) return; const k = Math.round((e.clientX - drag.x) / drag.cw); const ns = (((drag.s + k) % 26) + 26) % 26; if (ns !== shiftG) { shiftG = ns; host.sfx('tick'); refresh(); } });
        const end = () => { drag = null; }; strip.addEventListener('pointerup', end); strip.addEventListener('pointercancel', end);
        box.append(strip);
        T_.slider = h('input', { class: 'dc-rg', type: 'range', min: '0', max: '25', value: '0' });
        T_.slider.addEventListener('input', () => { if (!host.active || casc >= 0) return; shiftG = +T_.slider.value; host.sfx('tick'); refresh(); });
        T_.hl = h('div', { class: 'dc-hl' });
        const stepBtn = (lab, dlt) => h('button', { class: 'btn', onclick: () => { if (!host.active || casc >= 0) return; shiftG = (shiftG + dlt + 26) % 26; host.sfx('tick'); refresh(); } }, lab);
        box.append(h('div', { class: 'dc-ctl' }, stepBtn('◀', -1), h('div', { class: 'dc-rgw' }, T_.slider, T_.hl), stepBtn('▶', 1)));
        T_.lab = h('div', { class: 'dc-lab' }); box.append(T_.lab); main.append(box);
      } else if (mode === 'subst') {
        const box = h('div', { class: 'dc-box' }); box.append(h('h4', {}, 'Letter frequency in the ciphertext · tap a bar to select that letter'));
        const fq = h('div', { class: 'dc-fq' }); T_.fb = {}; const mx = Math.max(1, ...Object.values(counts));
        for (let i = 0; i < 26; i++) { const L = A[i], n = counts[L] || 0; const b = h('div', { class: 'dc-fb' }, h('div', { class: 'g' }), h('div', { class: 'bar', style: `height:${Math.max(n ? 4 : 1, Math.round(n / mx * 62))}px` }), h('div', { class: 'l' }, L)); b.addEventListener('click', () => { if (!host.active || casc >= 0) return; const c = cells.find((x) => x.isL && x.cl === L); if (c) { selectCell(c); host.sfx('tick'); } }); T_.fb[L] = b; fq.append(b); }
        box.append(fq); T_.ref = h('div', { class: 'dc-ref' }); box.append(T_.ref); main.append(box);
      } else {
        const box = h('div', { class: 'dc-box' }); box.append(h('h4', {}, 'Key letters · select a column, then type its letter or use ▲ ▼'));
        const vg = h('div', { class: 'dc-vg' }); T_.kc = []; T_.hist = [];
        for (let j = 0; j < keyLen; j++) {
          const up = h('button', { class: 'btn sm', onclick: (e) => { e.stopPropagation(); bumpKey(j, 1); } }, '▲'), dn = h('button', { class: 'btn sm', onclick: (e) => { e.stopPropagation(); bumpKey(j, -1); } }, '▼');
          const hist = h('div', { class: 'dc-hist' }); const bars = []; for (let i = 0; i < 26; i++) { const b = h('i'); bars.push(b); hist.append(b); }
          const card = h('div', { class: 'dc-kc' }, h('div', { class: 'kn' }, 'Key ' + (j + 1)), h('div', { class: 'kl' }, 'A'), up, dn, hist);
          card.style.setProperty('--kc', KCOL[j % KCOL.length]); card.addEventListener('click', () => { if (!host.active || casc >= 0) return; selectCol(j); host.sfx('tick'); });
          T_.kc.push({ card, kl: card.querySelector('.kl'), bars }); vg.append(card);
        }
        box.append(vg); box.append(h('div', { class: 'dc-ref' }, h('b', {}, 'Tip: '), 'a column whose tall bars sit on E, T, A, O is probably decoded correctly (lighter bars mark the common letters).')); main.append(box);
      }

      // on-screen pad
      let kb = null;
      if (touch && mode !== 'caesar') {
        kb = h('div', { class: 'dc-kb' });
        ['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZ'].forEach((r, ri) => { const row = h('div', { class: 'r' }); [...r].forEach((ch) => row.append(padKey(ch, ch))); if (ri === 2) row.append(padKey('⌫', '@bs', 'fn')); kb.append(row); });
        wrap.append(kb);
      }
      function padKey(label, ch, cls) { const b = h('button', { class: cls || '' }, label); b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('dn'); setTimeout(() => b.classList.remove('dn'), 90); press(ch); }); return b; }
      host.root.append(wrap);

      // ---- logic
      const dec = (c) => !c.isL ? null : mode === 'caesar' ? A[(c.ci - shiftG + 26) % 26] : mode === 'subst' ? (guess[c.cl] || null) : A[(c.ci - keyG[c.li % keyLen] + 26) % 26];
      function selectCell(c) { selCell = c; selL = c.cl; refresh(); try { c.el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* ignore */ } }
      function selectCol(j) { selCol = ((j % keyLen) + keyLen) % keyLen; refresh(); }
      function bumpKey(j, dlt) { if (!host.active || casc >= 0 || lockedK.has(j)) return; keyG[j] = (keyG[j] + dlt + 26) % 26; selCol = j; host.sfx('tick'); refresh(); }
      function nextUnassigned(from) {
        const L = cells.filter((c) => c.isL); if (!L.length) return null; const i0 = from ? L.indexOf(from) : -1;
        for (let k = 1; k <= L.length; k++) { const c = L[(i0 + k) % L.length]; if (!guess[c.cl] && !lockedC.has(c.cl)) return c; }
        return null;
      }
      function press(ch) {
        if (!host.active || over || casc >= 0 || !started || scrT < 0.8) return;
        if (mode === 'caesar') { if (ch === '@left') shiftG = (shiftG + 25) % 26; else if (ch === '@right') shiftG = (shiftG + 1) % 26; else return; host.sfx('tick'); refresh(); return; }
        if (mode === 'subst') {
          if (!selCell) return;
          const L = cells.filter((c) => c.isL), i = L.indexOf(selCell);
          if (ch === '@left') { selectCell(L[(i + L.length - 1) % L.length]); return; }
          if (ch === '@right' || ch === '@up' || ch === '@down') { selectCell(L[(i + 1) % L.length]); return; }
          if (ch === '@tab') { const n = nextUnassigned(selCell); if (n) selectCell(n); return; }
          if (lockedC.has(selL)) { host.sfx('bad'); host.setStatus('That letter is given — pick another.', 'warn'); return; }
          if (ch === '@bs') { if (guess[selL]) { delete guess[selL]; host.sfx('tick'); refresh(); } return; }
          if (ch.length === 1 && ch >= 'A' && ch <= 'Z') { guess[selL] = ch; host.sfx('type'); const n = nextUnassigned(selCell); refresh(); if (n && n.cl !== selL) selectCell(n); }
          return;
        }
        if (ch === '@left') { selectCol(selCol - 1); return; } if (ch === '@right') { selectCol(selCol + 1); return; }
        if (ch === '@up') { bumpKey(selCol, 1); return; } if (ch === '@down') { bumpKey(selCol, -1); return; }
        if (lockedK.has(selCol)) { host.sfx('bad'); host.setStatus('That key letter is given.', 'warn'); return; }
        if (ch === '@bs') { keyG[selCol] = 0; refresh(); return; }
        if (ch.length === 1 && ch >= 'A' && ch <= 'Z') { keyG[selCol] = A.indexOf(ch); host.sfx('type'); refresh(); const nx = (selCol + 1) % keyLen; if (nx !== selCol) selectCol(nx); }
      }
      host.listen(window, 'keydown', (e) => {
        if (!host.active || e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key;
        let m = null;
        if (k === 'ArrowLeft') m = '@left'; else if (k === 'ArrowRight') m = '@right'; else if (k === 'ArrowUp') m = '@up'; else if (k === 'ArrowDown') m = '@down'; else if (k === 'Backspace' || k === 'Delete' || k === ' ') m = '@bs'; else if (k === 'Tab') m = '@tab'; else if (k.length === 1 && /[a-zA-Z]/.test(k)) m = k.toUpperCase();
        if (m) { e.preventDefault(); press(m); }
      });

      function refresh() {
        const used = {}; if (mode === 'subst') for (const c in guess) (used[guess[c]] = used[guess[c]] || []).push(c);
        let okWords = 0, allOk = true;
        words.forEach((ws) => { const ls = ws.filter((c) => c.isL); const s = ls.map(dec); const rec = ls.length > 0 && s.every(Boolean) && DICT.has(s.join('').toLowerCase()); if (rec) okWords++; ws.wEl.classList.toggle('ok', rec); });
        cells.forEach((c) => {
          if (!c.isL) return; const g = dec(c); c.pEl.textContent = g || ''; if (g !== c.p) allOk = false;
          const same = mode === 'subst' ? c.cl === selL : mode === 'vig' ? (c.li % keyLen === selCol) : false;
          c.el.classList.toggle('same', same && c !== selCell); c.el.classList.toggle('sel', mode === 'subst' && c === selCell);
          c.el.classList.toggle('lk', mode === 'subst' && lockedC.has(c.cl) || mode === 'vig' && lockedK.has(c.li % keyLen));
          c.el.classList.toggle('cf', mode === 'subst' && !!g && used[g] && used[g].length > 1);
        });
        if (mode === 'caesar') {
          for (let i = 0; i < 26; i++) T_.bot[i].textContent = A[(i - shiftG + 26) % 26];
          T_.slider.value = String(shiftG); T_.lab.innerHTML = `Each letter is moved back by <b>${shiftG}</b>` + (rng ? ` · the answer is between <b>${rng.lo}</b> and <b>${rng.hi}</b>` : '');
          if (rng) { T_.hl.style.display = 'block'; T_.hl.style.left = (rng.lo / 25 * 100) + '%'; T_.hl.style.width = Math.max(3, (rng.hi - rng.lo) / 25 * 100) + '%'; }
        } else if (mode === 'subst') {
          for (const L in T_.fb) { const b = T_.fb[L]; b.classList.toggle('sel', L === selL); b.classList.toggle('lk', lockedC.has(L)); b.querySelector('.g').textContent = guess[L] ? guess[L].toLowerCase() : ''; }
          const unused = [...A].filter((x) => !used[x]);
          T_.ref.innerHTML = `<b>English, most to least common:</b> ${FREQ_EN.split('').join(' ')}<br><b>Plain letters not used yet:</b> ${unused.length ? unused.join(' ') : '—'}`;
        } else {
          T_.kc.forEach((k, j) => { k.kl.textContent = A[keyG[j]]; k.card.classList.toggle('sel', j === selCol); k.card.classList.toggle('lk', lockedK.has(j)); const hs = new Array(26).fill(0); let tot = 0; cells.forEach((c) => { if (c.isL && c.li % keyLen === j) { hs[A.indexOf(dec(c))]++; tot++; } }); const mx = Math.max(1, ...hs); k.bars.forEach((b, i) => { b.style.height = (hs[i] ? 3 + hs[i] / mx * 31 : 1) + 'px'; b.className = 'ENG' in {} ? '' : (ENG[A[i]] > 6 ? 'e' : ''); }); });
        }
        host.setProgress(okWords / words.length);
        if (allOk && !over && casc < 0 && started) beginCascade();
      }
      function beginCascade() { casc = 0; host.sfx('success'); host.setStatus('Message decrypted', 'good'); }
      function timeUp() { over = true; host.sfx('fail'); host.setStatus('Out of time', 'bad'); host.finish({ success: false, score: 0, stats: { Reason: 'Out of time', Cipher: cipherName } }); }

      let flashIdx = 0;
      host.loop((dt) => {
        if (started && !over) {
          if (scrT < 0.8) {
            scrT += dt; const n = Math.floor(scrT / 0.8 * cells.length);
            cells.forEach((c, i) => { if (c.isL) c.cEl.textContent = i < n ? c.cl : A[(Math.random() * 26) | 0]; });
            if (scrT >= 0.8) { cells.forEach((c) => { if (c.isL) c.cEl.textContent = c.cl; }); refresh(); }
          } else if (casc < 0) {
            if (freezeT > 0) freezeT -= dt; else timeLeft -= dt;
            host.setTimer(Math.max(0, timeLeft));
            if (lwT > 0) { lwT -= dt; if (lwT <= 0 && lwWord >= 0) { words[lwWord].wEl.classList.remove('lw'); lwWord = -1; } }
            if (timeLeft <= 0) timeUp();
          }
          if (casc >= 0) {
            casc += dt; const n = Math.min(cells.length, Math.floor(casc / 0.012));
            for (; flashIdx < n; flashIdx++) { cells[flashIdx].el.classList.add('fl'); if (flashIdx % 6 === 0) host.sfx('tick'); }
            if (casc > cells.length * 0.012 + 0.55) {
              over = true;
              const tFrac = C.clamp(timeLeft / tMax, 0, 1), sc = C.clamp(0.4 + 0.5 * tFrac + 0.1 - 0.08 * hintsUsed, 0.3, 1);
              host.finish({ success: true, score: sc, stats: { Cipher: cipherName, Time: Math.round(tMax - timeLeft) + 's', Hints: hintsUsed, Words: words.length, Letters: nLetters } });
            }
          }
        }
      });
      refresh();

      return {
        start() { started = true; host.setTimer(timeMax); host.setStatus(mode === 'caesar' ? 'Slide the dial until the bottom row reads as English' : mode === 'subst' ? (touch ? 'Tap a letter, then pick what it stands for' : 'Click a letter and type its replacement') : 'Pick a key column and set its letter', ''); },
        tool(id) {
          if (over || casc >= 0) return false;
          if (id === 'hint') {
            if (mode === 'caesar') {
              const w = rng ? rng.hi - rng.lo + 1 : 26; const nw = w > 11 ? 11 : w > 5 ? 5 : w > 3 ? 3 : 0; if (!nw) return false;
              const lo0 = rng ? rng.lo : 0, hi0 = rng ? rng.hi : 25; const minLo = Math.max(lo0, shift - nw + 1), maxLo = Math.min(shift, hi0 - nw + 1);
              const lo = host.randInt(minLo, Math.max(minLo, maxLo)); rng = { lo, hi: lo + nw - 1 }; hintsUsed++; host.sfx('good'); host.setStatus(`Oracle: the shift is between ${rng.lo} and ${rng.hi}`, 'good'); refresh(); return true;
            }
            if (mode === 'subst') {
              const cand = Object.keys(counts).filter((c) => !lockedC.has(c) && guess[c] !== tmap[c]).sort((a, b) => counts[b] - counts[a]); if (!cand.length) return false;
              const pickC = cand.slice(0, 5).slice(0, host.randInt(1, Math.min(5, cand.length)));
              const take = [pickC[pickC.length - 1]]; if (cand.length > 1) { const other = host.pick(cand.filter((c) => c !== take[0]).slice(0, 8)); if (other) take.push(other); }
              take.forEach((c) => { guess[c] = tmap[c]; lockedC.add(c); }); hintsUsed++; host.sfx('good'); host.setStatus('Oracle revealed ' + take.map((c) => c + '→' + tmap[c]).join(' and '), 'good'); refresh(); return true;
            }
            const cand = []; for (let j = 0; j < keyLen; j++) if (!lockedK.has(j) && A[keyG[j]] !== key[j]) cand.push(j); if (!cand.length) return false;
            const j = host.pick(cand); keyG[j] = A.indexOf(key[j]); lockedK.add(j); selCol = j; hintsUsed++; host.sfx('good'); host.setStatus(`Oracle revealed key letter ${j + 1}: ${key[j]}`, 'good'); refresh(); return true;
          }
          if (id === 'freeze') { freezeT += 10; host.sfx('good'); host.setStatus('Chronos: timer paused for 10 s', 'good'); return true; }
          if (id === 'shield') {
            if (timeBonusUsed >= 2) return false; timeBonusUsed++; const add = tMax * 0.25; timeLeft += add; tMax += add;
            let bi = -1, bl = 0; words.forEach((ws, i) => { const n = ws.filter((c) => c.isL).length; if (n > bl) { bl = n; bi = i; } });
            if (lwWord >= 0) words[lwWord].wEl.classList.remove('lw'); lwWord = bi; words[bi].wEl.classList.add('lw'); lwT = 12;
            const seen = {}; let nn = 0; const pat = words[bi].filter((c) => c.isL).map((c) => { if (!seen[c.p]) seen[c.p] = ++nn; return seen[c.p]; }).join(' ');
            host.sfx('good'); host.setStatus(`Aegis: +25% time · the longest word (dashed) has ${bl} letters, pattern ${pat}`, 'good'); return true;
          }
          return false;
        },
        onFinish() { over = true; },
        debug: {
          solve() { if (mode === 'caesar') shiftG = shift; else if (mode === 'subst') { for (const c in tmap) guess[c] = tmap[c]; } else keyG = key.map((k) => A.indexOf(k)); refresh(); },
          fail() { timeLeft = 0; if (!started) { started = true; scrT = 1; } },
          info() { return { mode, kw, keyLen, len: plain.length, words: words.length, timeMax, given, touch }; },
          truth() { return { mode, plain, shift, tmap, key: key.join('') }; },
          state() { return { shiftG, guess, keyG, selL, selCol, casc, timeLeft }; },
        },
      };
    },
  });
})();
