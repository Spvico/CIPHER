/* CIPHER OS — Terminal, Rig and Market */
(function () {
  'use strict';
  const C = window.CIPHER, D = C.data, h = C.h, ST = C.state, ui = C.ui, fmt = C.fmt, K = ui.kit;
  const S = () => ST.get();

  // =================================================================== TERMINAL
  const term = { lines: [], hist: [], hi: 0, size: 13 };
  const userOf = () => ((S() && S().handle) || 'ghost').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'ghost';
  const motd = () => [{ t: 'CIPHER OS 4.2 nightfall (tty1)', k: 'hd' }, { t: `Last login: day ${S().day} on console`, k: 'dim' }, { t: 'Type "help" for a list of commands, press Tab to complete.', k: 'dim' }, { t: '', k: '' }];
  const prompt = (u) => [h('span', { class: 'ps' }, u + '@cipher'), h('span', { class: 'pc' }, ':'), h('span', { class: 'pd' }, '~'), h('span', { class: 'pc' }, '$ ')];

  ui.registerApp('terminal', {
    icon: 'terminal', w: 800, h: 500, static: true,
    menus() {
      return [
        { label: 'Shell', items: [{ label: 'Clear screen', fn: () => { term.lines = motd(); ui.refresh('terminal'); } }, { label: 'Export save code', fn: () => { term.lines.push({ t: 'save code:', k: 'dim' }, { t: ST.exportSave(), k: '' }); ui.refresh('terminal'); } }] },
        { label: 'View', items: [{ label: 'Larger text', fn: () => { term.size = Math.min(22, term.size + 1); ui.refresh('terminal'); } }, { label: 'Smaller text', fn: () => { term.size = Math.max(10, term.size - 1); ui.refresh('terminal'); } }, { label: 'Reset zoom', fn: () => { term.size = 13; ui.refresh('terminal'); } }] },
      ];
    },
    render(body) {
      const u = userOf();
      if (!term.lines.length) term.lines = motd();
      C.clear(body);
      const out = h('div', { class: 'tm-out keep-scroll', style: { fontSize: term.size + 'px' } });
      const inp = h('input', { class: 'tm-in', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', 'data-fk': 'tin', enterkeyhint: 'go' });
      const paint = () => {
        C.clear(out);
        term.lines.forEach((l) => out.append(l.k === 'cmd' ? h('div', { class: 'tl' }, prompt(l.u), h('span', { class: 'tc' }, l.t)) : h('div', { class: 'tl ' + (l.k || '') }, l.t || ' ')));
        out.scrollTop = out.scrollHeight;
      };
      const print = (t, k) => { (Array.isArray(t) ? t : String(t).split('\n')).forEach((x) => term.lines.push({ t: x, k })); if (term.lines.length > 400) term.lines.splice(0, 120); paint(); };
      const submit = () => {
        const v = inp.value.trim(); inp.value = '';
        term.lines.push({ k: 'cmd', u, t: v }); if (!v) { paint(); return; }
        term.hist.push(v); term.hi = term.hist.length;
        const [c, ...args] = v.split(/\s+/); const fn = TCMD[c.toLowerCase()];
        if (!fn) print(`${c}: command not found`, 'r'); else { try { const r = fn(args, print); if (r) print(r); else paint(); } catch (e) { print('error: ' + e.message, 'r'); } }
        C.audio.sfx('type');
      };
      inp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') submit();
        else if (e.key === 'ArrowUp') { term.hi = Math.max(0, term.hi - 1); inp.value = term.hist[term.hi] || ''; e.preventDefault(); }
        else if (e.key === 'ArrowDown') { term.hi = Math.min(term.hist.length, term.hi + 1); inp.value = term.hist[term.hi] || ''; e.preventDefault(); }
        else if (e.key === 'Tab') {
          e.preventDefault(); const v = inp.value; if (/\s/.test(v)) return;
          const m = Object.keys(TCMD).filter((k) => k.startsWith(v.toLowerCase())).sort();
          if (m.length === 1) inp.value = m[0] + ' ';
          else if (m.length > 1) { let p = m[0]; m.forEach((k) => { while (!k.startsWith(p)) p = p.slice(0, -1); }); inp.value = p; term.lines.push({ k: 'cmd', u, t: v }); print(m.join('   '), 'dim'); }
        } else if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); term.lines = []; ui.refresh('terminal'); }
        else if (e.ctrlKey && e.key.toLowerCase() === 'c') { e.preventDefault(); term.lines.push({ k: 'cmd', u, t: inp.value + '^C' }); inp.value = ''; paint(); }
        else C.audio.sfx('tick');
      });
      const chips = h('div', { class: 'tm-chips' }, ['help', 'status', 'contracts', 'inv', 'sell', 'rank', 'news', 'clear'].map((c) => h('button', { onclick: () => { inp.value = c; submit(); } }, c)));
      const tabs = h('div', { class: 'tm-tabs' }, h('div', { class: 'tm-tab' }, K.svg('terminal'), h('span', `${u}@cipher: ~`), h('b', { class: 'tm-x' }, '×')), h('span', { class: 'tm-plus' }, '+'));
      body.append(h('div', { class: 'a-root tm-root' }, tabs, out, chips, h('div', { class: 'tm-line' }, prompt(u), inp)));
      if (!C.isTouch) body.addEventListener('mousedown', (e) => { if (!e.target.closest('button') && !window.getSelection().toString()) setTimeout(() => inp.focus(), 0); });
      paint(); if (!C.isTouch) setTimeout(() => inp.focus(), 50);
      ui.setTitle('terminal', `${u}@cipher: ~`);
    },
  });
  const TCMD = {
    help: () => ['commands:', '  status        your profile', '  contracts     list the job board', '  launch <n>    open job n from the board', '  story         current story mission', '  inv           inventory & loot', '  sell          sell all loot at the fence', '  rig           hardware & programs', '  mastery       minigame mastery', '  rank          underground leaderboard', '  news          latest headlines', '  nmap <host>   scan a host (for fun)', '  ls, cat, ping, whoami, date, clear, export'],
    status: () => { const s = S(); return [`handle   ${s.handle}`, `level    ${s.level}  (${s.xp}/${D.xpToNext(s.level)} xp)  skill pts: ${s.skillPts}`, `credits  ${fmt.cr(s.credits)}`, `heat     ${Math.round(s.heat)}/100`, `day      ${s.day}`, 'rep      ' + Object.keys(D.FACTIONS).map((f) => `${D.FACTIONS[f].short}:${s.rep[f]}`).join('  ')]; },
    contracts: () => { ST.ensureBoard(); return S().board.map((c, i) => `${String(i + 1).padStart(2)}. T${c.tier} ${c.title.padEnd(26)} ${c.org.padEnd(24)} ${fmt.cr(c.payout)}`); },
    launch: (a) => { const c = S().board[+a[0] - 1]; if (!c) return 'usage: launch <n>   (see "contracts")'; ui.openApp('contracts', { tab: 'board' }); return `Opening ${c.title}...`; },
    story: () => { const l = C.gen.storyList(S()); return l.length ? [`${l[0].title} — ${l[0].org}`, l[0].objText, l[0].locked || 'available now'] : 'No story mission available.'; },
    inv: () => { const s = S(); return ['consumables:', ...D.ITEM_ORDER.map((id) => `  ${D.ITEMS[id].name.padEnd(18)} x${s.items[id] || 0}`), `loot: ${s.loot.length} items worth ~${fmt.cr(s.loot.reduce((a, l) => a + ST.lootValue(l), 0))}`]; },
    sell: () => { const t = ST.sellLoot('all'); return t ? `Sold all loot for ${fmt.cr(t)}.` : 'Nothing to sell.'; },
    rig: () => { const s = S(); return [...Object.keys(D.HARDWARE).map((k) => `${D.HARDWARE[k].name.padEnd(14)} L${s.hw[k]}  ${D.HARDWARE[k].fx(s.hw[k])}`), ...Object.keys(D.SOFTWARE).map((k) => `${D.SOFTWARE[k].name.padEnd(14)} L${s.sw[k]}`)]; },
    mastery: () => Object.keys(D.GAMES).map((g) => `${D.GAMES[g].name.padEnd(16)} M${ST.masteryLvl(g)}  plays:${((S().stats.games[g] || {}).plays) || 0}`),
    rank: () => ST.leaderboard().slice(0, 8).map((r) => `#${String(r.rank).padStart(2)} ${r.name.padEnd(14)} ${r.score}${r.me ? '  <- you' : ''}`),
    news: () => (S().news.length ? S().news.slice(0, 6) : ['No news today.']),
    whoami: () => S().handle, date: () => 'cycle ' + S().day + ' of the long night',
    ping: (a) => ['PING ' + (a[0] || 'localhost') + ': 64 bytes, time=' + (8 + Math.random() * 40).toFixed(1) + 'ms', 'TTL=57 — no packet loss. suspiciously good.'],
    nmap: (a) => { const t = a[0] || '10.0.0.1'; return [`Starting scan of ${t}`, '22/tcp   open  ssh      (outdated)', '80/tcp   open  http     (default password: admin)', '443/tcp  open  https    (certificate expired)', '3306/tcp open  mysql    (why is this public?)', 'Done. This is fine.']; },
    ls: () => ['contracts/  loot/  notes.txt  do_not_open.enc'], cat: (a) => (a[0] === 'notes.txt' ? 'remember: never hack from home. also, buy milk.' : a[0] === 'do_not_open.enc' ? 'ENCRYPTED: 8f3a... (try the Decrypt minigame)' : 'cat: ' + (a[0] || '') + ': No such file or directory'),
    sudo: () => 'nice try. you are not in the sudoers file. this incident will be reported.',
    matrix: () => { document.body.classList.toggle('matrix'); return 'wake up, ' + S().handle + '...'; },
    export: () => ['save code (copy it):', ST.exportSave()], clear: () => { term.lines = []; ui.refresh('terminal'); },
  };

  // =================================================================== RIG
  let rgView = 'overview';
  const HWICON = { cpu: 'cpu', ram: 'ram', net: 'net', proxy: 'proxy' };
  const SWICON = { hint: 'sparkle', freeze: 'clock', shield: 'shield' };
  const rigScore = (s) => Object.keys(D.HARDWARE).reduce((a, k) => a + s.hw[k] * 100, 0) + Object.keys(D.SOFTWARE).reduce((a, k) => a + (s.sw[k] || 0) * 60, 0);

  const PC = '<svg viewBox="0 0 92 70" class="pc"><rect x="26" y="4" width="40" height="62" rx="5" fill="var(--p3)" stroke="var(--ln2)"/><rect x="31" y="10" width="30" height="5" rx="2" fill="var(--bg2)"/><circle cx="46" cy="36" r="11" fill="var(--bg2)" stroke="var(--ln2)"/><g stroke="var(--c)" stroke-width="1.6" stroke-linecap="round"><path d="M46 28v16M38 36h16M40.3 30.3l11.4 11.4M51.7 30.3L40.3 41.7"/></g><circle cx="46" cy="36" r="2" fill="var(--c)"/><circle cx="34" cy="58" r="1.6" fill="#4ac27a"/><rect x="40" y="56.5" width="20" height="3" rx="1.5" fill="var(--bg2)"/><path d="M5 62h16M71 62h16M10 54h11M71 54h11" stroke="var(--ln2)" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function liveChart(cv) {
    const hist = [[], []]; for (let i = 0; i < 90; i++) { hist[0].push(0.35); hist[1].push(0.3); }
    let t = 0, last = 0;
    for (let i = 0; i < 90; i++) { t += 0.12; hist[0][i] = C.clamp(0.42 + Math.sin(t * 0.7) * 0.18 + (Math.random() - 0.5) * 0.14, 0.05, 0.95); hist[1][i] = C.clamp(0.3 + Math.sin(t * 0.4 + 1) * 0.12 + (Math.random() - 0.5) * 0.2, 0.05, 0.95); }
    const frame = (now) => {
      if (!cv.isConnected) return;
      requestAnimationFrame(frame);
      if (now - last < 120) return; last = now; t += 0.12;
      const W = cv.clientWidth || 300, H = cv.clientHeight || 110, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      hist[0].push(C.clamp(0.42 + Math.sin(t * 0.7) * 0.18 + (Math.random() - 0.5) * 0.14, 0.05, 0.95)); hist[1].push(C.clamp(0.3 + Math.sin(t * 0.4 + 1) * 0.12 + (Math.random() - 0.5) * 0.2, 0.05, 0.95));
      hist.forEach((a) => { if (a.length > 90) a.shift(); });
      const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const cs = getComputedStyle(cv), ln = cs.getPropertyValue('--ln').trim() || '#333', c1 = cs.getPropertyValue('--c').trim() || '#99f', c2 = '#4ac27a';
      ctx.strokeStyle = ln; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(0, (H * i) / 4); ctx.lineTo(W, (H * i) / 4); } ctx.stroke();
      [[hist[0], c1], [hist[1], c2]].forEach(([a, col]) => {
        ctx.beginPath(); a.forEach((v, i) => { const x = (i / 89) * W, y = H - v * H; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke(); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.globalAlpha = 0.1; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
      });
    };
    requestAnimationFrame(frame);
  }

  ui.registerApp('rig', {
    icon: 'rig', w: 940, h: 620,
    onBack() { return false; },
    menus() { return [{ label: 'View', items: [['overview', 'Overview'], ['hardware', 'Hardware'], ['programs', 'Programs']].map(([id, l]) => ({ label: l, check: true, on: rgView === id, fn: () => { rgView = id; ui.refresh('rig'); } })) }]; },
    render(body) {
      const s = S(), d = ST.derived(); C.clear(body);
      const go = (v) => () => { rgView = v; ui.refresh('rig'); };
      const nav = [['overview', 'Overview', 'monitor'], ['hardware', 'Hardware', 'cpu'], ['programs', 'Programs', 'pkg']];
      const side = K.side([{ h: 'This rig' }].concat(nav.map(([id, l, ic]) => ({ icon: ic, label: l, on: rgView === id, fn: go(id) }))));
      let page;
      if (rgView === 'overview') {
        const gauge = (l, v, frac, cls) => h('div', { class: 'rg-gauge' }, h('small', l), h('b', v), K.bar(frac, cls));
        page = h('div', { class: 'rg-page' },
          h('div', { class: 'rg-hero' }, h('span', { html: PC }), h('div', { style: { flex: 1, minWidth: 0 } }, h('h3', s.handle + "'s rig"), h('div', { class: 'a-sub' }, `Rig rating ${rigScore(s)} · ${Object.keys(D.HARDWARE).map((k) => `${D.HARDWARE[k].name} L${s.hw[k]}`).join(' · ')}`))),
          h('div', { class: 'rg-sec' }, 'Performance'),
          h('div', { class: 'rg-grid' }, gauge('Time bonus', '+' + Math.round(d.timeBonus * 100) + '%', d.timeBonus / 0.6, 'c'), gauge('Extra lives', '+' + d.lives, d.lives / 6, 'g'), gauge('Precision window', '+' + Math.round(d.window * 100) + '%', d.window / 0.6, 'c'),
            gauge('Ambient trace', '×' + d.ambientMult.toFixed(2), 1 - d.ambientMult, 'g'), gauge('Mistake trace', '×' + d.mistakeMult.toFixed(2), 1 - d.mistakeMult, 'g'), gauge('Loadout slots', String(d.loadoutCap), d.loadoutCap / 8, 'a')),
          h('div', { class: 'rg-sec' }, 'Live activity (simulated)'),
          h('div', { class: 'rg-chart' }, h('canvas', { id: 'rg-live' })));
      } else if (rgView === 'hardware') {
        page = h('div', { class: 'rg-page' }, h('div', { class: 'rg-sec' }, 'Permanent upgrades'), Object.keys(D.HARDWARE).map((id) => {
          const H = D.HARDWARE[id], l = s.hw[id], maxed = l >= H.max, req = D.HW_REQ_LEVEL[l + 1], price = ST.hwPrice(id);
          return h('div', { class: 'rg-dev' }, h('div', { class: 'di' }, K.svg(HWICON[id] || 'cpu')),
            h('div', { class: 'tx' }, h('b', H.name), h('p', H.desc), h('div', { class: 'rg-fx' }, h('span', { class: 'g' }, H.fx(l)), maxed ? null : h('span', { class: 'dim' }, '  →  '), maxed ? null : h('span', { class: 'c' }, H.fx(l + 1)))),
            h('div', { class: 'ac' }, K.pips(l, H.max), maxed ? K.chip('Maxed', 'g') : h('button', { class: 'btn', disabled: s.credits < price || s.level < req, onclick: () => ST.buyHardware(id) }, 'Upgrade · ' + fmt.cr(price)), !maxed && s.level < req ? h('small', { class: 'r' }, 'Needs level ' + req) : null));
        }));
      } else {
        page = h('div', { class: 'rg-page' }, h('div', { class: 'rg-sec' }, 'Installed programs · charges refill every breach'), C.TOOL_IDS.map((id) => {
          const SW = D.SOFTWARE[id], T = C.TOOLS[id], l = s.sw[id] || 0, maxed = l >= D.SW_MAX, req = D.SW_REQ_LEVEL[l + 1], price = ST.swPrice(id), ch = (x) => (x > 0 ? D.SW_CHARGES[x] + d.toolBonus : 0);
          return h('div', { class: 'rg-dev' }, h('div', { class: 'di' }, K.svg(SWICON[id] || 'pkg')),
            h('div', { class: 'tx' }, h('b', SW.name, ' ', h('span', { class: 'dim', style: { fontWeight: 400 } }, l ? 'v' + l + '.0' : 'not installed')), h('p', SW.desc + ' Hotkey ' + T.key + '.'), h('div', { class: 'rg-fx' }, h('span', { class: 'g' }, ch(l) + ' charges per run'), maxed ? null : h('span', { class: 'dim' }, '  →  '), maxed ? null : h('span', { class: 'c' }, ch(l + 1) + ''))),
            h('div', { class: 'ac' }, K.pips(l, D.SW_MAX), maxed ? K.chip('Latest version', 'g') : h('button', { class: 'btn' + (l ? '' : ' pri'), disabled: s.credits < price || s.level < req, onclick: () => ST.buySoftware(id) }, (l ? 'Update · ' : 'Install · ') + fmt.cr(price)), !maxed && s.level < req ? h('small', { class: 'r' }, 'Needs level ' + req) : null));
        }));
      }
      const tabs = K.tabbar(nav.map(([id, l, ic]) => ({ icon: ic, label: l, on: rgView === id, fn: go(id) })));
      const status = K.status(`Rig rating ${rigScore(s)}`, `Level ${s.level}`, h('i', { class: 'sp' }), h('span', {}, 'Balance ', h('b', { class: 'a' }, fmt.cr(s.credits))));
      body.append(K.root(h('div', { class: 'a-cols' }, side, K.scroll('', page)), tabs, status));
      ui.setTitle('rig', nav.find((n) => n[0] === rgView)[1]);
      const cv = body.querySelector('#rg-live'); if (cv) liveChart(cv);
    },
  });

  // =================================================================== MARKET
  let mkView = 'shop', mkQ = '', mkSel = new Set(), mkSort = 'value', mkDir = -1;
  const ITEMICON = { scrubber: 'sparkle', decoy: 'target', scanner: 'eye', overclock: 'bolt', zeroday: 'flame' };
  const trendTxt = (t) => (t > 0 ? '▲' : t < 0 ? '▼' : '–');

  ui.registerApp('market', {
    icon: 'market', w: 960, h: 620,
    menus() { const s = S(); return [{ label: 'File', items: [{ label: 'Sell all loot', disabled: !s.loot.length, fn: () => { const t = ST.sellLoot('all'); mkSel.clear(); C.toast('Sold everything for ' + fmt.cr(t), 'good'); } }] }, { label: 'View', items: [['shop', 'Darknet shop'], ['services', 'Services'], ['fence', 'Sell loot'], ['prices', 'Price board']].map(([id, l]) => ({ label: l, check: true, on: mkView === id, fn: () => { mkView = id; ui.refresh('market'); } })) }]; },
    render(body) {
      const s = S(); C.clear(body);
      const lootVal = s.loot.reduce((a, l) => a + ST.lootValue(l), 0);
      const go = (v) => () => { mkView = v; ui.refresh('market'); };
      const nav = [['shop', 'Darknet shop', 'bag', ''], ['services', 'Services', 'wrench', ''], ['fence', 'Sell loot', 'box', s.loot.length || ''], ['prices', 'Price board', 'chart', '']];
      const side = K.side([{ h: 'Buy' }, { icon: 'bag', label: 'Darknet shop', on: mkView === 'shop', fn: go('shop') }, { icon: 'wrench', label: 'Services', on: mkView === 'services', fn: go('services') }, { h: 'Sell' }, { icon: 'box', label: 'Sell loot', count: s.loot.length || '', on: mkView === 'fence', fn: go('fence') }, { icon: 'chart', label: 'Price board', on: mkView === 'prices', fn: go('prices') }]);
      let tool = null, main;
      if (mkView === 'shop') {
        const q = mkQ.trim().toLowerCase();
        const items = D.ITEM_ORDER.filter((id) => !q || D.ITEMS[id].name.toLowerCase().includes(q));
        tool = K.toolbar(K.sp(), K.search('Search the shop', mkQ, (v) => { mkQ = v; ui.refresh('market'); }, 'mkq'));
        main = K.scroll('', h('div', { class: 'mk-hero' }, h('div', { style: { flex: 1 } }, h('h3', 'Darknet shop'), h('p', 'Consumables for your next breach. Bring them in your loadout.')), h('div', { class: 'mk-bal' }, h('small', 'Your balance'), h('b', fmt.cr(s.credits)))),
          h('div', { class: 'mk-grid' }, items.map((id) => {
            const it = D.ITEMS[id], locked = s.level < it.req, p = ST.itemPrice(id);
            return h('div', { class: 'mk-card' + (locked ? ' lock' : '') }, h('div', { class: 'top' }, h('div', { class: 'ic', style: { background: `color-mix(in srgb, ${it.color} 62%, #14181a)` } }, K.svg(ITEMICON[id] || 'box')), h('div', {}, h('b', it.name), h('div', { class: 'dim', style: { fontSize: '12px' } }, 'Owned: ' + (s.items[id] || 0)))), h('p', it.desc),
              locked ? h('div', { class: 'buy' }, K.chip('Unlocks at level ' + it.req, 'r')) : h('div', { class: 'buy' }, h('button', { class: 'btn pri', disabled: s.credits < p, onclick: () => ST.buyItem(id, 1) }, 'Buy · ' + fmt.cr(p)), h('button', { class: 'btn', disabled: s.credits < p * 5, onclick: () => ST.buyItem(id, 5) }, '×5')));
          })));
      } else if (mkView === 'services') {
        const lcost = 600 + s.level * 90;
        main = K.scroll('', h('div', { class: 'mk-sv' },
          h('div', { class: 'mk-card wide' }, h('div', { class: 'top' }, h('div', { class: 'ic', style: { background: '#2a7d74' } }, K.svg('flame')), h('div', {}, h('b', 'Launder your trail'), h('div', { class: 'dim', style: { fontSize: '12px' } }, 'Current heat ' + Math.round(s.heat) + ' of 100'))), h('p', 'A contact scrubs your footprints from the usual places. Heat −25.'), K.bar(s.heat / 100, s.heat > 60 ? 'r' : 'a'), h('div', { class: 'buy' }, h('button', { class: 'btn pri', disabled: s.heat < 5 || s.credits < lcost, onclick: () => ST.launder() }, 'Launder · ' + fmt.cr(lcost)))),
          h('div', { class: 'mk-card wide' }, h('div', { class: 'top' }, h('div', { class: 'ic', style: { background: '#3a6d9c' } }, K.svg('calendar')), h('div', {}, h('b', 'Lay low for a day'), h('div', { class: 'dim', style: { fontSize: '12px' } }, 'Today is day ' + s.day))), h('p', 'Skip a day: heat −6, loot prices drift and the contract board refreshes.'), h('div', { class: 'buy' }, h('button', { class: 'btn', onclick: () => { ST.nextDay(1); C.toast('A day passes in the shadows.'); } }, 'Wait one day')))));
      } else if (mkView === 'fence') {
        for (const id of Array.from(mkSel)) if (!s.loot.find((l) => l.id === id)) mkSel.delete(id);
        const key = { value: (l) => ST.lootValue(l), name: (l) => l.name, tier: (l) => l.tier }[mkSort] || ((l) => ST.lootValue(l));
        const rows = s.loot.slice().sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * mkDir; });
        const selVal = rows.filter((l) => mkSel.has(l.id)).reduce((a, l) => a + ST.lootValue(l), 0);
        const allSel = rows.length && rows.every((l) => mkSel.has(l.id));
        tool = K.toolbar(K.tb(mkSel.size ? `Sell selected (${mkSel.size})` : 'Sell selected', 'coin', { pri: true, disabled: !mkSel.size, onclick: () => { const t = ST.sellLoot(Array.from(mkSel)); mkSel.clear(); C.toast('Sold for ' + fmt.cr(t), 'good'); } }), K.tb('Sell all', 'box', { disabled: !rows.length, onclick: () => { const t = ST.sellLoot('all'); mkSel.clear(); C.toast('Sold everything for ' + fmt.cr(t), 'good'); } }), K.sp(), h('span', { class: 'dim only-wide' }, mkSel.size ? `Selected ~${fmt.cr(selVal)}` : `Total ~${fmt.cr(lootVal)}`));
        const cb = (checked, fn) => { const i = h('input', { type: 'checkbox', class: 'a-cb', onclick: (e) => e.stopPropagation(), onchange: fn }); i.checked = !!checked; return i; };
        const onSort = (k) => { if (mkSort === k) mkDir = -mkDir; else { mkSort = k; mkDir = k === 'name' ? 1 : -1; } ui.refresh('market'); };
        const cols = [{ label: '' }, { k: 'name', label: 'Item' }, { label: 'Category', hc: true }, { k: 'tier', label: 'Tier', num: true, hc: true }, { label: 'Base', num: true, hc: true }, { label: 'Market', num: true, hc: true }, { k: 'value', label: 'Value', num: true }];
        const trs = rows.map((l) => { const m = s.market[l.cat] || 1, tr = s.trend[l.cat] || 0; return { sel: mkSel.has(l.id), fn: () => { if (mkSel.has(l.id)) mkSel.delete(l.id); else mkSel.add(l.id); ui.refresh('market'); }, cells: [cb(mkSel.has(l.id), () => { if (mkSel.has(l.id)) mkSel.delete(l.id); else mkSel.add(l.id); ui.refresh('market'); }), h('div', {}, h('div', l.name), h('div', { class: 'a-sub only-compact' }, `Tier ${l.tier} · ×${m.toFixed(2)} ${trendTxt(tr)}`)), h('span', { class: 'dim' }, (D.LOOT_BY_CAT[l.cat] || {}).name || l.cat), 'T' + l.tier, fmt.cr(l.value), h('span', { class: m >= 1.15 ? 'g' : m < 0.8 ? 'r' : '' }, '×' + m.toFixed(2) + ' ' + trendTxt(tr)), h('b', { class: 'a' }, fmt.cr(ST.lootValue(l)))] }; });
        main = rows.length ? h('div', { class: 'a-scroll keep-scroll' }, K.table(cols, trs, { sort: mkSort, dir: mkDir, onSort }), h('div', { class: 'a-sub', style: { padding: '10px 12px' } }, 'Tip: hold items until their category price spikes. Safehouse raids seize stored loot.'))
          : K.empty('box', 'No loot to sell', 'Breach loot nodes during contracts. They show up here.');
        if (rows.length) tool.insertBefore(h('label', { class: 'a-all' }, cb(allSel, (e) => { if (e.target.checked) rows.forEach((l) => mkSel.add(l.id)); else mkSel.clear(); ui.refresh('market'); }), h('span', 'All')), tool.firstChild);
      } else {
        main = K.scroll('', h('div', { class: 'mk-px' }, h('h3', { class: 'a-h' }, 'Loot price board'), h('p', { class: 'a-sub' }, 'Multiplier applied to base value. Prices drift every day.'),
          D.LOOT.map((l) => { const m = s.market[l.cat] || 1, tr = s.trend[l.cat] || 0; return h('div', { class: 'mk-tick' }, h('div', { style: { flex: 1, minWidth: 0 } }, h('div', l.name), K.bar((m - 0.5) / 1.6, m >= 1.15 ? 'g' : m < 0.8 ? 'r' : 'a')), h('b', { class: m >= 1.15 ? 'g' : m < 0.8 ? 'r' : '' }, '×' + m.toFixed(2)), h('span', { class: tr > 0 ? 'g' : tr < 0 ? 'r' : 'dim', style: { width: '16px', textAlign: 'center' } }, trendTxt(tr))); })));
      }
      const tabs = K.tabbar(nav.map(([id, l, ic, ct]) => ({ icon: ic, label: id === 'fence' ? 'Sell' : id === 'prices' ? 'Prices' : id === 'shop' ? 'Shop' : l, count: ct, on: mkView === id, fn: go(id) })));
      const status = K.status(h('span', {}, 'Balance ', h('b', { class: 'a' }, fmt.cr(s.credits))), `${s.loot.length} loot item${s.loot.length === 1 ? '' : 's'} (~${fmt.cr(lootVal)})`, h('i', { class: 'sp' }), `Day ${s.day}`);
      body.append(K.root(tool, h('div', { class: 'a-cols' }, side, h('div', { class: 'a-main' }, main)), tabs, status));
      ui.setTitle('market', nav.find((n) => n[0] === mkView)[1]);
    },
  });
})();
