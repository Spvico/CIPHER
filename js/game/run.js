/* CIPHER — the breach run: network map, trace simulation, node breaching, settlement */
(function () {
  'use strict';
  const C = window.CIPHER, D = C.data, h = C.h, ST = C.state;
  const R = (C.run = { current: null });
  const S = () => ST.get();
  const PHASES = [{ id: 'STEALTH', at: 0, mult: 1, cls: 'g' }, { id: 'ALERT', at: 50, mult: 1.5, cls: 'a' }, { id: 'LOCKDOWN', at: 80, mult: 2.2, cls: 'r' }];
  const phaseOf = (t) => (t >= 80 ? PHASES[2] : t >= 50 ? PHASES[1] : PHASES[0]);

  // ------------------------------------------------------------------ start
  R.start = function (ct, loadout) {
    const s = S(), d = ST.derived();
    const net = C.gen.network(ct);
    ct = Object.assign({}, ct); ct.bonus = net.bonus;
    const items = {};
    D.ITEM_ORDER.forEach((id) => { const n = Math.min((loadout && loadout[id]) || 0, s.items[id] || 0); if (n > 0) { items[id] = n; s.items[id] -= n; } });
    const run = (R.current = {
      ct, net, d, trace: 0, time: 0, items, tools: ST.toolCharges(), loot: [], nodeScores: [], aOrS: 0, fails: 0, streak: 0, maxStreak: 0,
      xpNodes: 0, decoyT: 0, overclock: false, sel: null, hover: null, inGame: false, ended: false, lastGasp: d.lastGasp, scanned: false,
      objDone: 0, objTotal: net.nodes.filter((n) => n.obj === 'primary').length, log: [], parts: [], rings: [], activeMg: null, tips: {}, peakTrace: 0, nodesBreached: 0,
    });
    s.stats.runs = (s.stats.runs || 0) + 1;
    buildUI(run);
    C.audio.music.setMode('run'); C.audio.music.setIntensity(0);
    say(run, `Connection established to ${ct.org.toUpperCase()}.`, 'sys');
    say(run, `Objective: ${ct.objText}.`, 'sys');
    if (ct.tutorial) tip(run, 'start', 'TIP: Click the glowing gateway node on the map, then pick an approach to BREACH it.');
    else say(run, 'Select the gateway to begin.', 'sys');
    run.select(run.net.nodes[0].id);
    run.lastTick = performance.now();
    run.timer = setInterval(() => tick(run), 100);
    run.raf = requestAnimationFrame((t) => frame(run, t));
    return new Promise((res) => { run.resolve = res; });
  };

  function say(run, txt, kind) {
    run.log.push({ txt, kind: kind || 'sys', t: run.time });
    if (run.log.length > 80) run.log.shift();
    if (run.el) {
      const line = h('div', { class: 'ln ' + (kind || 'sys') }, h('span', { class: 'ts' }, C.fmt.time(run.time)), ' ' + txt);
      run.el.log.append(line);
      while (run.el.log.children.length > 60) run.el.log.firstChild.remove();
      run.el.log.scrollTop = run.el.log.scrollHeight;
    }
  }
  function tip(run, key, txt) { if (run.ct.tutorial && !run.tips[key]) { run.tips[key] = 1; say(run, txt, 'tip'); } }

  // ------------------------------------------------------------------ trace
  function bump(run, n) {
    if (run.ended) return;
    run.trace = Math.max(0, run.trace + n);
    if (run.trace >= 100 && run.lastGasp) {
      run.lastGasp = false; run.trace = 55;
      say(run, 'LAST GASP: trace dumped to 55%.', 'good'); C.toast('LAST GASP saved you!', 'good'); C.audio.sfx('levelup');
    }
    run.peakTrace = Math.max(run.peakTrace, run.trace);
  }
  function addTrace(run, n, why) {
    const ph = phaseOf(run.trace);
    const v = n * run.d.mistakeMult * (ph.id === 'LOCKDOWN' ? 1.25 : 1);
    bump(run, v);
    if (v >= 3) say(run, `Trace +${v.toFixed(1)}%${why ? ' — ' + why : ''}`, 'warn');
  }
  function ambient(run) {
    const ph = phaseOf(run.trace);
    return (0.055 + 0.011 * run.ct.tier) * run.d.ambientMult * (1 + S().heat / 200) * ph.mult * (run.inGame ? 0.5 : 1);
  }
  function tick(run) {
    if (run.ended) return;
    const now = performance.now(), dt = Math.min(0.5, (now - run.lastTick) / 1000); run.lastTick = now;
    run.time += dt;
    const before = phaseOf(run.trace).id;
    if (run.decoyT > 0) run.decoyT -= dt; else bump(run, ambient(run) * dt);
    const after = phaseOf(run.trace).id;
    if (after !== before) {
      if (after === 'ALERT') { say(run, 'ALERT: sysadmin is hunting for you. Ambient trace rising.', 'warn'); C.audio.sfx('warn'); }
      else if (after === 'LOCKDOWN') { say(run, 'LOCKDOWN: ICE hardened. Nodes are harder to breach!', 'bad'); C.audio.sfx('alert'); C.toast('Lockdown — nodes harder, trace faster', 'bad'); }
      else say(run, 'Trace falling. Back to STEALTH.', 'good');
    }
    C.audio.music.setIntensity(run.trace / 100);
    updateHUD(run);
    if (run.trace >= 100 && !run.activeMg) end(run, 'traced');
  }

  // ------------------------------------------------------------------ UI
  function buildUI(run) {
    const ct = run.ct, e = (run.el = {});
    const F = D.FACTIONS[ct.faction];
    const root = (e.root = h('div', { class: 'run' },
      h('div', { class: 'run-top' },
        h('div', { class: 'run-title' }, h('b', ct.title), h('small', ' // ' + ct.org + ' · TIER ' + ct.tier + ' · '), h('small', { style: { color: F.hex } }, F.short)),
        h('div', { class: 'run-trace' }, h('label', 'Trace'), h('div', { class: 'bar r big' }, (e.tfill = h('i')), h('span', { class: 'tk', style: { left: '50%' } }), h('span', { class: 'tk', style: { left: '80%' } })), (e.tval = h('b', '0%')), (e.phase = h('em', 'STEALTH'))),
        h('div', { class: 'run-stat' }, h('label', 'Time'), (e.time = h('b', '00:00'))),
        h('div', { class: 'run-stat' }, h('label', 'Loot'), (e.loot = h('b', '¢0')))),
      h('div', { class: 'run-body' },
        h('div', { class: 'run-left' },
          h('div', { class: 'rbox' }, h('h4', 'Objectives'), (e.obj = h('div', { class: 'objs' }))),
          h('div', { class: 'rbox grow' }, h('h4', 'System log'), (e.log = h('div', { class: 'log' })))),
        h('div', { class: 'run-map' }, (e.cv = h('canvas')), (e.mini = h('div', { class: 'run-mini' })), (e.tt = h('div', { class: 'tt', style: { display: 'none' } })), (e.flash = h('div', { class: 'run-flash' }))),
        h('div', { class: 'run-right' }, (e.panel = h('div', { class: 'npanel' })))),
      h('div', { class: 'run-bottom' },
        h('button', { class: 'btn sm logbtn', onclick: () => e.root.classList.toggle('showlog') }, 'Log'),
        h('div', { class: 'items' }, h('span', { class: 'dim up lbl' }, 'Loadout'), (e.items = h('div', { class: 'row' }))),
        h('div', { class: 'tools-info' }, (e.tools = h('span', { class: 'dim' }))),
        (e.extract = h('button', { class: 'btn pri', onclick: () => tryExtract(run) }, 'Extract')))));
    document.body.append(root);
    e.ctx = e.cv.getContext('2d');
    const fit = () => {
      const r = e.cv.parentElement.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      e.W = r.width; e.H = r.height; e.dpr = dpr;
      e.cv.style.width = r.width + 'px'; e.cv.style.height = r.height + 'px'; e.cv.width = Math.round(r.width * dpr); e.cv.height = Math.round(r.height * dpr);
    };
    fit(); e.ro = new ResizeObserver(fit); e.ro.observe(e.cv.parentElement);
    e.cv.addEventListener('mousemove', (ev) => onMove(run, ev));
    e.cv.addEventListener('mouseleave', () => { run.hover = null; e.tt.style.display = 'none'; });
    e.cv.addEventListener('click', (ev) => { const n = nodeAt(run, ev); if (n) run.select(n.id); });
    e.cv.style.touchAction = 'manipulation';
    run.keyHandler = (ev) => {
      if (run.inGame || run.ended || document.querySelector('.modal')) return;
      if (/^[1-9]$/.test(ev.key) && run.sel) { const btn = e.panel.querySelectorAll('.appr')[+ev.key - 1]; if (btn) btn.click(); }
      else if (ev.key.toLowerCase() === 'e' && !ev.ctrlKey) tryExtract(run);
    };
    window.addEventListener('keydown', run.keyHandler);
    run.select = (id) => { run.sel = id; C.audio.sfx('click'); renderPanel(run); };
    renderItems(run); renderObjectives(run); updateHUD(run);
  }

  function updateHUD(run) {
    const e = run.el, t = C.clamp(run.trace, 0, 100), ph = phaseOf(t);
    e.tfill.style.width = t + '%'; e.tval.textContent = Math.floor(t) + '%'; e.phase.textContent = ph.id.charAt(0) + ph.id.slice(1).toLowerCase() + (run.decoyT > 0 ? ' · decoy ' + Math.ceil(run.decoyT) + 's' : '');
    e.phase.className = ph.cls; e.root.dataset.phase = ph.id;
    e.time.textContent = C.fmt.time(run.time);
    e.loot.textContent = C.fmt.cr(run.loot.reduce((a, l) => a + l.value, 0));
    const tl = run.tools;
    e.tools.textContent = C.TOOL_IDS.map((id) => `${C.TOOLS[id].name} ×${tl[id]}`).join('   ');
    renderObjectives(run, true);
  }

  function renderObjectives(run) {
    const e = run.el, ct = run.ct, wrap = e.obj; C.clear(wrap);
    e.mini.textContent = `★ ${ct.objText} (${run.objDone}/${run.objTotal})`; e.mini.classList.toggle('ok', run.objDone >= run.objTotal);
    wrap.append(h('div', { class: 'ob' + (run.objDone >= run.objTotal ? ' ok' : '') }, h('span', { class: 'ck' }, run.objDone >= run.objTotal ? '✓' : '★'), ` ${ct.objText} (${run.objDone}/${run.objTotal})`));
    const lootNodes = run.net.nodes.filter((n) => n.loot), lootGot = lootNodes.filter((n) => n.state === 'breached').length;
    ct.bonus.forEach((b) => {
      let ok, extra = '';
      if (b === 'silent') ok = run.trace < 40; else if (b === 'fast') { ok = run.time <= ct.par; extra = ` (${C.fmt.time(ct.par)})`; } else if (b === 'flawless') ok = run.fails === 0; else { ok = lootGot === lootNodes.length; extra = ` (${lootGot}/${lootNodes.length})`; }
      wrap.append(h('div', { class: 'ob bonus' + (ok ? ' ok' : ' bad') }, h('span', { class: 'ck' }, ok ? '✓' : '✗'), ` +${Math.round(D.BONUS[b].mult * 100)}% ${D.BONUS[b].text}${extra}`));
    });
  }

  function renderItems(run) {
    const e = run.el; C.clear(e.items);
    const ids = D.ITEM_ORDER.filter((id) => (run.items[id] || 0) > 0);
    if (!ids.length) e.items.append(h('span', { class: 'dim' }, 'no consumables'));
    ids.forEach((id) => {
      const it = D.ITEMS[id];
      e.items.append(h('button', { class: 'btn sm', title: it.desc, style: { '--bt': it.color, '--bc': it.color }, onclick: () => useItem(run, id) }, it.name, h('span', { class: 'cnt' }, '×' + run.items[id])));
    });
  }

  function renderPanel(run) {
    const e = run.el, p = e.panel; C.clear(p);
    const nd = run.net.nodes.find((n) => n.id === run.sel);
    if (!nd) { p.append(h('div', { class: 'dim' }, 'Select a node.')); return; }
    const T = D.NODE_TYPES[nd.type];
    const diff = Math.round(C.clamp(nd.diff + (phaseOf(run.trace).id === 'LOCKDOWN' ? 1.5 : 0), 1, 10));
    const pips = h('div', { class: 'pips' }); for (let i = 1; i <= 10; i++) pips.append(h('i', { class: i <= diff ? 'on' : '' }));
    p.append(h('div', { class: 'nhead', style: { '--nc': T.color } }, h('b', T.label), h('small', nd.name)));
    const tags = h('div', { class: 'tags' });
    if (nd.obj) tags.append(h('span', { class: 'tag a' }, '★ OBJECTIVE'));
    if (nd.loot) tags.append(h('span', { class: 'tag g' }, run.scanned || nd.state === 'breached' ? '¢ LOOT ~' + C.fmt.num(nd.loot.value) : '¢ LOOT'));
    if (nd.type === 'core') tags.append(h('span', { class: 'tag r' }, 'Black ICE ' + (nd.stage + 1) + '/' + nd.stages));
    p.append(tags, h('div', { class: 'ndiff' }, h('span', { class: 'dim' }, 'ICE level'), pips));
    if (nd.state === 'breached') { p.append(h('div', { class: 'nstate g' }, '✓ COMPROMISED' + (nd.rank ? ' · RANK ' + nd.rank : ''))); return; }
    const routed = nd.state === 'seen' && (nd.type === 'gateway' || run.net.edges.some((ed) => (ed[0] === nd.id && by(run, ed[1]).state === 'breached') || (ed[1] === nd.id && by(run, ed[0]).state === 'breached')));
    if (!routed) { p.append(h('div', { class: 'nstate dim' }, 'NO ROUTE — breach a connected node first.')); return; }
    p.append(h('div', { class: 'dim up small' }, 'Choose approach'));
    const games = nd.type === 'core' ? [nd.stageGames[nd.stage]] : nd.games;
    games.forEach((g, i) => {
      const G = D.GAMES[g], ml = ST.masteryLvl(g);
      p.append(h('button', { class: 'appr', onclick: () => startNode(run, nd, g) },
        h('span', { class: 'ico' }, G.icon), h('span', { class: 'ai' }, h('b', G.name), h('small', G.desc)), h('span', { class: 'mast' }, 'M' + ml), h('span', { class: 'kbd' }, String(i + 1))));
    });
    if ((run.items.zeroday || 0) > 0) p.append(h('button', { class: 'btn sm dng', style: { marginTop: '10px' }, onclick: () => zeroDay(run, nd) }, '⚡ Use Zero-Day (×' + run.items.zeroday + ')'));
    if (!S().seen.tips.firstNode) { p.append(h('div', { class: 'hintbox' }, 'Each approach is a different minigame. Pick the one you are best at — mastery levels give permanent bonuses.')); }
  }
  const by = (run, id) => run.net.nodes.find((n) => n.id === id);

  // ------------------------------------------------------------------ items
  function useItem(run, id) {
    if (run.ended || run.inGame || !(run.items[id] > 0)) return;
    if (id === 'scrubber') { run.items[id]--; bump(run, -20); run.trace = Math.max(0, run.trace); say(run, 'Trace scrubbed: -20%.', 'good'); C.audio.sfx('good'); }
    else if (id === 'decoy') { run.items[id]--; run.decoyT = 30; say(run, 'Decoy beacon deployed: trace frozen for 30s.', 'good'); C.audio.sfx('good'); }
    else if (id === 'scanner') {
      run.items[id]--; run.scanned = true;
      run.net.nodes.forEach((n) => { if (n.state === 'hidden') n.state = 'seen'; });
      say(run, 'Net scan complete: topology revealed.', 'good'); C.audio.sfx('whoosh'); renderPanel(run);
    } else if (id === 'overclock') { if (run.overclock) return; run.items[id]--; run.overclock = true; say(run, 'Overclock armed: next breach +30% time, +1 life.', 'good'); C.audio.sfx('good'); }
    else if (id === 'zeroday') { const nd = by(run, run.sel); if (nd) zeroDay(run, nd); return; }
    renderItems(run); updateHUD(run);
  }
  function zeroDay(run, nd) {
    if (run.ended || run.inGame || nd.state === 'breached' || !(run.items.zeroday > 0)) return;
    run.items.zeroday--; S().stats.zerodays++;
    say(run, `ZERO-DAY: ${nd.name} compromised instantly.`, 'good'); C.audio.sfx('zap');
    onNodeSuccess(run, nd, { score: 0.45, rank: 'C', rankMult: 0.88 }, null, true);
    renderItems(run);
  }

  // ------------------------------------------------------------------ breach flow
  function startNode(run, nd, gameId) {
    if (run.ended || run.inGame) return;
    if (!C.mg.get(gameId)) { C.toast('Minigame ' + gameId + ' is not installed', 'bad'); return; }
    run.inGame = true;
    const s = S();
    const bonus = ST.gameBonus(gameId);
    if (run.overclock) { bonus.time += 0.3; bonus.lives += 1; run.overclock = false; say(run, 'Overclock engaged.', 'good'); }
    const diff = C.clamp(nd.diff + (phaseOf(run.trace).id === 'LOCKDOWN' ? 1.5 : 0) + (nd.type === 'core' ? nd.stage * 0.6 : 0), 1, 13);
    const firstTime = !s.seen.games[gameId];
    s.seen.games[gameId] = true; s.seen.tips.firstNode = true;
    say(run, `Breaching ${nd.name} via ${D.GAMES[gameId].name}...`, 'sys');
    C.audio.sfx('whoosh');
    const p = C.mg.play(gameId, {
      difficulty: diff, seed: nd.seed + nd.attempts * 977 + nd.stage * 31,
      node: { name: nd.name, type: nd.type, label: D.NODE_TYPES[nd.type].label + (nd.type === 'core' ? ` ${nd.stage + 1}/${nd.stages}` : '') },
      bonus, tools: Object.assign({}, run.tools), firstTime, audioOffset: s.settings.audioOffset,
      getTrace: () => run.trace, addTrace: (n, why) => addTrace(run, n, why), onTool: (id) => { run.tools[id] = Math.max(0, run.tools[id] - 1); },
    });
    run.activeMg = p;
    p.then((res) => {
      run.activeMg = null; run.inGame = false;
      if (run.ended) return;
      run.lastTick = performance.now();
      C.audio.music.setMode('run');
      handleResult(run, nd, gameId, res);
    });
  }

  function handleResult(run, nd, gameId, res) {
    const s = S(), gs = (s.stats.games[gameId] = s.stats.games[gameId] || { plays: 0, wins: 0, s: 0 });
    gs.plays++;
    if (res.traced || run.trace >= 100) { s.stats.playSec += res.time || 0; end(run, 'traced'); return; }
    s.stats.playSec += res.time || 0;
    ST.addMastery(gameId, res.success, res.rank);
    if (res.success) {
      gs.wins++;
      if (res.rank === 'S') { s.stats.rankS++; gs.s++; } else if (res.rank === 'A') s.stats.rankA++;
      onNodeSuccess(run, nd, res, gameId, false);
    } else {
      run.fails++; run.streak = 0; nd.attempts++; s.stats.nodeFails++;
      const pen = (res.aborted ? 4 : 7) + run.ct.tier * 0.9;
      bump(run, pen);
      say(run, `${res.aborted ? 'Connection dropped' : 'Breach failed'} at ${nd.name}. Trace +${pen.toFixed(1)}%.`, 'bad');
      C.audio.sfx('bad'); shake(run);
      if (run.ct.tutorial) tip(run, 'fail', 'TIP: Failing a node just costs trace. You can retry, or try a different approach.');
    }
    renderPanel(run); renderObjectives(run); updateHUD(run);
    ST.touch();
  }

  function onNodeSuccess(run, nd, res, gameId, skipped) {
    const ct = run.ct;
    if (nd.type === 'core' && nd.stage + 1 < nd.stages) {
      nd.stage++; nd.attempts = 0;
      say(run, `BLACK ICE layer ${nd.stage}/${nd.stages} shattered. Something deeper stirs...`, 'warn');
      C.audio.sfx('success'); ringFx(run, nd, '#ef5b5b'); run.nodeScores.push(res.score);
      renderPanel(run); updateHUD(run); return;
    }
    nd.state = 'breached'; nd.rank = res.rank; run.nodesBreached++;
    run.net.edges.forEach((ed) => { const o = ed[0] === nd.id ? ed[1] : ed[1] === nd.id ? ed[0] : null; if (o) { const on = by(run, o); if (on.state === 'hidden') on.state = 'seen'; } });
    const bonusStreak = ++run.streak; run.maxStreak = Math.max(run.maxStreak, bonusStreak);
    run.nodeScores.push(res.score); if (res.rank === 'S' || res.rank === 'A') run.aOrS++;
    const xp = Math.round((6 + ct.tier * 3.2) * (0.6 + res.score * 0.8) * (skipped ? 0.4 : 1) * (1 + (res.rank === 'S' || res.rank === 'A' ? run.d.perf : 0)));
    run.xpNodes += xp;
    say(run, `${nd.name} COMPROMISED${gameId ? ' — rank ' + res.rank : ''}. +${xp} xp${bonusStreak >= 3 ? ' · streak x' + bonusStreak : ''}`, 'good');
    C.audio.sfx('node'); ringFx(run, nd, D.NODE_TYPES[nd.type].color);
    if (nd.loot) {
      const val = Math.round(nd.loot.value * run.d.lootMult * (0.85 + 0.3 * res.score));
      run.loot.push(Object.assign({}, nd.loot, { value: val }));
      say(run, `LOOT: ${nd.loot.name} (${C.fmt.cr(val)})`, 'good'); C.audio.sfx('coin');
    }
    if (nd.obj === 'primary') {
      run.objDone++;
      say(run, `OBJECTIVE ACHIEVED (${run.objDone}/${run.objTotal}).`, 'good');
      if (run.objDone >= run.objTotal) { say(run, 'All objectives complete. EXTRACT now, or loot more at your own risk.', 'tip'); run.el.extract.classList.add('go'); C.audio.sfx('success'); }
    }
    if (ct.tutorial) {
      if (run.nodesBreached === 1) tip(run, 'n1', 'TIP: New nodes appeared. Breach your way toward the ★ OBJECTIVE. Dim nodes show what is next.');
      tip(run, 'trace', 'TIP: TRACE rises over time and with every mistake. Hit 100% and you are burned. Watch the bar up top.');
    }
    renderPanel(run); renderObjectives(run); updateHUD(run);
    ST.touch();
  }

  function tryExtract(run) {
    if (run.ended || run.inGame) return;
    const done = run.objDone >= run.objTotal;
    if (done) { end(run, 'success'); return; }
    const d = run.d, keep = [0.25, 0.6, 1][d.cleanExit || 0];
    C.ui.modal({ title: 'ABORT CONTRACT?', body: `Objectives are incomplete. You will fail this contract${d.cleanExit >= 2 ? '' : ' and lose reputation'}. You keep ${Math.round(keep * 100)}% of the loot you grabbed.`, buttons: [{ label: 'Abort', cls: 'dng', value: true }, { label: 'Keep hacking', value: false }] }).then((v) => { if (v && !run.ended) end(run, 'abort'); });
  }

  // ------------------------------------------------------------------ canvas
  function isPortraitMap(run) { return run.el.H > run.el.W * 1.1; }
  function nodePos(run, nd) {
    const e = run.el, pad = e.W < 640 ? 38 : 54;
    return isPortraitMap(run) ? { x: pad + nd.y * (e.W - pad * 2), y: pad + nd.x * (e.H - pad * 2) } : { x: pad + nd.x * (e.W - pad * 2), y: pad + nd.y * (e.H - pad * 2) };
  }
  function nodeScale(run) { return C.clamp(Math.min(run.el.W, run.el.H) / 520, 0.72, 1); }
  function nodeAt(run, ev) {
    const r = run.el.cv.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
    let best = null, bd = C.isTouch ? 42 : 30;
    run.net.nodes.forEach((n) => { if (n.state === 'hidden') return; const p = nodePos(run, n), dd = Math.hypot(p.x - mx, p.y - my); if (dd < bd) { bd = dd; best = n; } });
    return best;
  }
  function onMove(run, ev) {
    const n = nodeAt(run, ev), e = run.el;
    run.hover = n ? n.id : null; e.cv.style.cursor = n ? 'pointer' : 'default';
    if (n) {
      const T = D.NODE_TYPES[n.type];
      e.tt.style.display = ''; e.tt.style.left = ev.offsetX + 16 + 'px'; e.tt.style.top = ev.offsetY + 12 + 'px';
      e.tt.innerHTML = `<b style="color:${T.color}">${T.label}</b><br>${C.esc(n.name)}<br>ICE ${n.diff.toFixed(1)}${n.obj ? ' · ★' : ''}${n.loot ? ' · ¢' : ''}`;
    } else e.tt.style.display = 'none';
  }
  function ringFx(run, nd, color) { const p = nodePos(run, nd); run.rings.push({ x: p.x, y: p.y, r: 10, a: 1, c: color }); for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; run.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: color }); } }
  function shake(run) { const f = run.el.flash; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); if (S().settings.shake) { run.el.root.classList.remove('shk'); void run.el.root.offsetWidth; run.el.root.classList.add('shk'); } }

  function shapePath(ctx, shape, x, y, r) {
    ctx.beginPath();
    const poly = (n, rot, rr) => { for (let i = 0; i < n; i++) { const a = rot + (i / n) * 6.2832; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); };
    if (shape === 'hex') poly(6, 0, r);
    else if (shape === 'circle') ctx.arc(x, y, r * 0.9, 0, 6.2832);
    else if (shape === 'diamond') poly(4, 0, r * 1.1);
    else if (shape === 'key') { const q = r * 0.85; ctx.rect(x - q, y - q, q * 2, q * 2); }
    else if (shape === 'db') { for (let i = -1; i <= 1; i++) ctx.rect(x - r * 0.8, y + i * r * 0.62 - r * 0.22, r * 1.6, r * 0.44); }
    else if (shape === 'lock') { ctx.rect(x - r * 0.8, y - r * 0.2, r * 1.6, r * 1.1); ctx.moveTo(x - r * 0.5, y - r * 0.2); ctx.arc(x, y - r * 0.2, r * 0.5, Math.PI, 0); }
    else if (shape === 'bolt') { ctx.moveTo(x + r * 0.2, y - r); ctx.lineTo(x - r * 0.7, y + r * 0.1); ctx.lineTo(x - r * 0.05, y + r * 0.1); ctx.lineTo(x - r * 0.25, y + r); ctx.lineTo(x + r * 0.7, y - r * 0.15); ctx.lineTo(x + r * 0.05, y - r * 0.15); ctx.closePath(); }
    else if (shape === 'star') { for (let i = 0; i < 16; i++) { const a = -1.5708 + (i / 16) * 6.2832, rr = i % 2 ? r * 0.62 : r * 1.25; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); }
  }

  function frame(run, now) {
    if (run.ended) return;
    run.raf = requestAnimationFrame((t) => frame(run, t));
    if (run.inGame) return;
    const e = run.el, ctx = e.ctx, W = e.W, H = e.H, t = now / 1000;
    ctx.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // background grid
    ctx.strokeStyle = 'rgba(71,79,89,.22)'; ctx.lineWidth = 1;
    const gs = 40, ox = (t * 4) % gs;
    ctx.beginPath(); for (let x = -ox; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
    const ph = phaseOf(run.trace);
    // edges
    run.net.edges.forEach((ed, i) => {
      const a = by(run, ed[0]), b = by(run, ed[1]);
      if (a.state === 'hidden' || b.state === 'hidden') return;
      const pa = nodePos(run, a), pb = nodePos(run, b), on = a.state === 'breached' && b.state === 'breached', half = a.state === 'breached' || b.state === 'breached';
      ctx.strokeStyle = on ? 'rgba(77,156,255,.8)' : half ? 'rgba(77,156,255,.4)' : 'rgba(144,153,166,.25)';
      ctx.lineWidth = on ? 2 : 1.2; ctx.setLineDash(on ? [] : [5, 6]); ctx.lineDashOffset = -t * 18;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.setLineDash([]);
      if (half) { const k = (t * 0.5 + i * 0.37) % 1, from = a.state === 'breached' ? pa : pb, to = from === pa ? pb : pa; ctx.fillStyle = on ? '#4d9cff' : 'rgba(77,156,255,.7)'; ctx.fillRect(from.x + (to.x - from.x) * k - 2, from.y + (to.y - from.y) * k - 2, 4, 4); }
    });
    // nodes
    run.net.nodes.forEach((nd) => {
      if (nd.state === 'hidden') return;
      const T = D.NODE_TYPES[nd.type], p = nodePos(run, nd), r = (nd.type === 'core' ? 27 : 20) * nodeScale(run), br = nd.state === 'breached', sel = run.sel === nd.id, hov = run.hover === nd.id;
      const route = !br && (nd.type === 'gateway' || run.net.edges.some((ed) => (ed[0] === nd.id && by(run, ed[1]).state === 'breached') || (ed[1] === nd.id && by(run, ed[0]).state === 'breached')));
      ctx.save();
      ctx.shadowColor = T.color; ctx.shadowBlur = 0;
      shapePath(ctx, T.shape, p.x, p.y, r);
      ctx.fillStyle = br ? T.color + '55' : 'rgba(22,25,28,.92)'; ctx.fill();
      ctx.lineWidth = sel || hov ? 3 : 2; ctx.strokeStyle = br ? T.color : route ? T.color : T.color + '77'; ctx.stroke();
      ctx.restore();
      if (br) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p.x - 6, p.y); ctx.lineTo(p.x - 1.5, p.y + 5); ctx.lineTo(p.x + 7, p.y - 6); ctx.stroke(); }
      if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 5]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.arc(p.x, p.y, r + 9, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); }
      if (nd.obj && !br) { ctx.fillStyle = '#e0a63a'; ctx.font = '700 17px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = '#e0a63a'; ctx.shadowBlur = 0; ctx.fillText('★', p.x, p.y - r - 8 - Math.sin(t * 3) * 2); ctx.shadowBlur = 0; }
      if (nd.loot && !br && (run.scanned || true)) { ctx.fillStyle = '#3fb96b'; ctx.font = '700 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('¢', p.x + r + 6, p.y - r + 4); }
      ctx.fillStyle = br ? 'rgba(155,200,255,.75)' : 'rgba(155,200,255,.55)'; ctx.font = '500 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
      if (!C.layout.compact || sel || nd.obj) ctx.fillText(nd.name.split('-').slice(1).join('-'), p.x, p.y + r + 15);
      if (nd.type === 'core' && !br) { ctx.fillStyle = '#ef5b5b'; ctx.fillText(`ICE ${nd.stage + 1}/${nd.stages}`, p.x, p.y + r + 27); }
    });
    // fx
    run.rings = run.rings.filter((q) => { q.r += 140 / 60; q.a -= 0.025; if (q.a <= 0) return false; ctx.strokeStyle = q.c; ctx.globalAlpha = q.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1; return true; });
    run.parts = run.parts.filter((q) => { q.x += q.vx / 60; q.y += q.vy / 60; q.vx *= 0.96; q.vy *= 0.96; q.life -= 0.02; if (q.life <= 0) return false; ctx.globalAlpha = q.life; ctx.fillStyle = q.c; ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3); ctx.globalAlpha = 1; return true; });
    // alert vignette
    if (ph.id !== 'STEALTH') { const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); const a = ph.id === 'LOCKDOWN' ? 0.28 + Math.sin(t * 6) * 0.1 : 0.14; g.addColorStop(0, 'rgba(239,91,91,0)'); g.addColorStop(1, `rgba(255,40,60,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  }

  // ------------------------------------------------------------------ end & settlement
  function end(run, status) {
    if (run.ended) return;
    run.ended = true;
    clearInterval(run.timer); cancelAnimationFrame(run.raf);
    window.removeEventListener('keydown', run.keyHandler);
    if (run.activeMg && run.activeMg.cancel) run.activeMg.cancel();
    run.el.ro.disconnect();
    C.audio.music.setMode('desk'); C.audio.music.setIntensity(0);
    const outcome = settle(run, status);
    showResults(run, outcome);
  }

  function settle(run, status) {
    const s = S(), ct = run.ct, d = run.d, F = D.FACTIONS[ct.faction];
    const out = { status, ct, loot: [], bonus: [], levelUps: 0, time: run.time, trace: run.trace, nodes: run.nodesBreached, counterTrace: false, raid: false, storyDone: null };
    // return unused consumables
    Object.keys(run.items).forEach((id) => { s.items[id] = (s.items[id] || 0) + run.items[id]; });
    const lootAll = run.loot;
    if (status === 'success') {
      const avg = run.nodeScores.length ? run.nodeScores.reduce((a, b) => a + b, 0) / run.nodeScores.length : 0.5;
      const perfFrac = run.nodesBreached ? run.aOrS / run.nodesBreached : 0;
      const streakMult = 1 + 0.03 * Math.min(run.maxStreak, 6);
      const base = ct.payout * (0.85 + 0.3 * avg) * streakMult * d.payMult * (1 + d.perf * perfFrac);
      let bsum = 0;
      ct.bonus.forEach((b) => {
        const lootNodes = run.net.nodes.filter((n) => n.loot);
        const ok = b === 'silent' ? run.trace < 40 : b === 'fast' ? run.time <= ct.par : b === 'flawless' ? run.fails === 0 : lootNodes.every((n) => n.state === 'breached');
        out.bonus.push({ id: b, ok }); if (ok) bsum += D.BONUS[b].mult;
      });
      out.base = Math.round(base); out.bonusAmt = Math.round(base * bsum); out.avg = avg; out.streakMult = streakMult;
      out.payout = out.base + out.bonusAmt;
      ST.addCredits(out.payout);
      out.xp = Math.round(ct.xp * (0.9 + 0.2 * avg) * (1 + 0.1 * out.bonus.filter((b) => b.ok).length) + run.xpNodes);
      out.rep = ST.addRep(ct.faction, ct.rep * (1 + 0.1 * out.bonus.filter((b) => b.ok).length));
      out.heat = Math.round(ct.heat * d.heatMult * (1 + run.trace / 200));
      ST.addHeat(out.heat);
      out.loot = lootAll; lootAll.forEach((l) => ST.addLoot(l));
      s.stats.done++; s.stats.bestTrace = Math.min(s.stats.bestTrace, Math.round(run.trace));
      out.levelUps = ST.addXP(out.xp);
      ST.pushNews(`${ct.org} confirms "unauthorized access" to its network`);
      if (ct.story && !s.story.done.includes(ct.story)) {
        s.story.done.push(ct.story);
        const def = D.STORY.find((x) => x.id === ct.story);
        if (def && def.done) ST.sendMail(def.done.from, def.done.subj, def.done.body, { tag: 'story' });
        out.storyDone = ct.story;
      } else if (Math.random() < 0.4) ST.sendMail(ct.fixer, 'RE: ' + ct.title, C.makeRng(Date.now()).pick(D.DEBRIEF[ct.faction].ok) + `\n\nPayment: ${C.fmt.cr(out.payout)}.`);
    } else if (status === 'abort') {
      const keep = [0.25, 0.6, 1][d.cleanExit || 0];
      out.loot = lootAll.map((l) => Object.assign({}, l, { value: Math.round(l.value * keep) })); out.loot.forEach((l) => ST.addLoot(l));
      out.heat = Math.round(ct.heat * 0.4 * d.heatMult); ST.addHeat(out.heat);
      out.rep = d.cleanExit >= 2 ? 0 : ST.addRep(ct.faction, -Math.round(ct.rep * 0.5));
      out.xp = run.xpNodes; out.levelUps = ST.addXP(out.xp); s.stats.failed++;
    } else {
      out.heat = Math.round(ct.heat * 2 * d.heatMult + 8); ST.addHeat(out.heat);
      out.rep = ST.addRep(ct.faction, -Math.round(ct.rep * 0.6));
      out.fee = Math.min(Math.round(s.credits * 0.04), 400 * ct.tier + 300); ST.addCredits(-out.fee);
      out.xp = Math.round(run.xpNodes * 0.5); out.levelUps = ST.addXP(out.xp);
      s.stats.traced++; s.stats.failed++;
      ST.pushNews(`Hacker traced at ${ct.org}: "${s.handle}" wanted for questioning`);
      if (Math.random() < 0.6) ST.sendMail(ct.fixer, 'RE: ' + ct.title, C.makeRng(Date.now()).pick(D.DEBRIEF[ct.faction].bad));
    }
    s.stats.maxHeat = Math.max(s.stats.maxHeat, s.heat);
    ST.nextDay(1);
    ST.updateRank();
    // heat consequences
    if (s.heat >= 100) out.raid = true;
    else if (s.heat >= 60 && Math.random() < (s.heat - 45) / 100) out.counterTrace = true;
    ST.touch(); ST.save(true);
    return out;
  }

  function showResults(run, o) {
    const ct = o.ct, e = run.el;
    const head = { success: 'Contract complete', abort: 'Contract aborted', traced: 'Traced' }[o.status];
    const cls = o.status === 'success' ? 'win' : 'lose';
    C.audio.sfx(o.status === 'success' ? 'success' : 'fail');
    const row = (k, v, c) => h('div', { class: 'rr' }, h('span', k), h('b', { class: c || '' }, v));
    const card = h('div', { class: 'modal run-result ' + cls },
      h('div', { class: 'modal-in wide' },
        h('h2', head), h('p', { class: 'dim' }, `${ct.title} · ${ct.org}`),
        h('div', { class: 'rgrid' },
          h('div', o.status === 'success' ? [
            row('Contract payout', C.fmt.cr(o.base), 'a'),
            o.bonus.map((b) => row(`Bonus: ${D.BONUS[b.id].name}`, b.ok ? '+' + C.fmt.cr(o.base * D.BONUS[b.id].mult) : '—', b.ok ? 'g' : 'dim')),
            o.streakMult > 1 ? row('Streak bonus', 'x' + o.streakMult.toFixed(2), 'g') : null,
            row('Total', C.fmt.cr(o.payout), 'a big'),
          ] : o.status === 'abort' ? [row('Contract payout', 'forfeited', 'r'), o.rep ? row('Reputation', o.rep, 'r') : null]
            : [row('Contract payout', 'lost', 'r'), row('Legal fees', '-' + C.fmt.cr(o.fee), 'r'), row('Reputation', o.rep, 'r'), row('All unsold loot', 'seized', 'r')]),
          h('div', [
            row('Experience', '+' + o.xp + ' xp', 'c'), o.status === 'success' ? row('Reputation', '+' + o.rep + ' ' + D.FACTIONS[ct.faction].short, 'c') : null,
            row('Heat', '+' + o.heat, o.heat > 15 ? 'r' : 'a'), row('Nodes breached', o.nodes), row('Time', C.fmt.time(o.time)), row('Final trace', Math.floor(o.trace) + '%'),
          ])),
        o.loot.length ? h('div', { class: 'lootbox' }, h('h4', 'Loot acquired — sell it in Bazaar'), o.loot.map((l) => h('div', { class: 'lootrow' }, h('span', l.name), h('b', { class: 'g' }, C.fmt.cr(l.value))))) : null,
        o.levelUps ? h('div', { class: 'lvlup' }, 'Level up! +' + o.levelUps + ' skill point' + (o.levelUps > 1 ? 's' : '')) : null,
        h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } }, h('button', { class: 'btn pri lg', id: 'run-continue', onclick: close }, 'Continue · Enter'))));
    document.body.append(card);
    function close() { card.remove(); window.removeEventListener('keydown', kh, true); e.root.remove(); R.current = null; run.resolve(o); }
    function kh(ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); close(); } }
    setTimeout(() => window.addEventListener('keydown', kh, true), 350);
  }

  // ------------------------------------------------------------------ counter-trace event
  R.counterTrace = function () {
    const s = S(); const reg = C.mg.list().map((g) => g.id);
    if (!reg.length) return Promise.resolve(true);
    const g = reg[Math.floor(Math.random() * reg.length)];
    return C.ui.modal({ title: 'COUNTER-INTRUSION!', body: `Heat is critical (${Math.round(s.heat)}). Investigators are tracing YOUR rig back to your address. Fight them off in a ${D.GAMES[g].name} duel, with no trace meter, but fail and they seize assets.`, buttons: [{ label: 'Defend!', cls: 'pri', value: true }] }).then(() => {
      let trace = 0;
      const dif = C.clamp(2 + s.heat / 13 + s.level * 0.08, 2, 11);
      return C.mg.play(g, { difficulty: dif, seed: Date.now() % 1e9, node: { name: 'Your rig', type: 'core', label: 'Counter-trace' }, bonus: ST.gameBonus(g), tools: ST.toolCharges(), firstTime: !s.seen.games[g], getTrace: () => trace, addTrace: (n) => { trace = Math.min(99, trace + n * 0.3); } });
    }).then((res) => {
      s.stats.counterTrace++;
      if (res.success) { ST.addHeat(-30); const xp = 40 + s.level * 12; ST.addXP(xp); C.toast(`Counter-trace defeated! Heat -30, +${xp} xp`, 'good', 4500); }
      else { const loss = Math.round(s.credits * 0.15); ST.addCredits(-loss); ST.addHeat(-12); C.toast(`They seized ${C.fmt.cr(loss)} from your accounts.`, 'bad', 5000); }
      ST.touch();
      return res.success;
    });
  };
  R.raid = function () {
    const s = S();
    const loss = Math.round(s.credits * 0.25); ST.addCredits(-loss);
    const lost = Math.floor(s.loot.length / 2); s.loot.splice(0, lost);
    s.heat = 40; ST.touch();
    return C.ui.modal({ title: 'Safehouse raided', body: `Heat hit 100. The raid took ${C.fmt.cr(loss)} and ${lost} piece${lost === 1 ? '' : 's'} of stored loot. You slipped out the back window. Heat reset to 40. Launder your trail before it happens again.`, buttons: [{ label: 'Damn.', cls: 'dng', value: 1 }] });
  };
})();
