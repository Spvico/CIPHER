/* CIPHER — player state, derived stats, progression, save/load */
(function () {
  'use strict';
  const C = window.CIPHER, D = C.data;
  const KEY = 'cipher.save.v1';
  const ST = (C.state = {});
  let S = null;
  let saveTimer = 0;

  function freshStats() {
    return { done: 0, failed: 0, traced: 0, nodes: 0, nodeFails: 0, rankS: 0, rankA: 0, earned: 0, lootSold: 0, zerodays: 0, bestTrace: 100, maxHeat: 0, bestRank: 0, games: {}, playSec: 0, counterTrace: 0 };
  }
  function fresh(handle) {
    return {
      v: 1, handle: handle || 'NULL', created: Date.now(), day: 1,
      credits: 600, xp: 0, level: 1, skillPts: 0, heat: 0,
      rep: { syndicate: 0, meridian: 0, lumen: 0 },
      hw: { cpu: 1, ram: 1, net: 1, proxy: 1 },
      sw: { hint: 1, freeze: 0, shield: 0 },
      skills: {},
      items: { scrubber: 2, decoy: 1, scanner: 1, overclock: 0, zeroday: 0 },
      loadout: { scrubber: 1, decoy: 0, scanner: 1 },
      loot: [], market: {}, trend: {},
      board: [], boardDay: 0, story: { done: [], active: null },
      mail: [], news: [], mastery: {}, achievements: {}, seen: { games: {}, tips: {} },
      stats: freshStats(), lastRank: 0, nextId: 1,
      settings: { master: 0.8, sfx: 0.8, music: 0.45, wall: 0, shake: true, audioOffset: 0 },
    };
  }

  ST.get = () => S;
  ST.has = () => { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
  ST.uid = () => S.nextId++;

  function migrate(s) {
    const f = fresh(s.handle);
    Object.keys(f).forEach((k) => { if (s[k] == null) s[k] = f[k]; });
    ['settings', 'stats', 'hw', 'sw', 'rep', 'items'].forEach((k) => { s[k] = Object.assign({}, f[k], s[k]); });
    s.seen = Object.assign({ games: {}, tips: {} }, s.seen);
    return s;
  }

  ST.newGame = function (handle) {
    S = fresh((handle || 'NULL').slice(0, 14));
    D.LOOT.forEach((l) => { S.market[l.cat] = 1; S.trend[l.cat] = 0; });
    ST.rollMarket(true);
    ST.sendMail(D.WELCOME.from, D.WELCOME.subj, D.WELCOME.body, { tag: 'story' });
    ST.ensureBoard();
    ST.applySettings();
    ST.save(true);
    C.emit('state');
    return S;
  };
  ST.peek = function () { try { const j = JSON.parse(localStorage.getItem(KEY)); return j ? { handle: j.handle, level: j.level, day: j.day } : null; } catch (e) { return null; } };
  ST.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      S = migrate(JSON.parse(raw));
      ST.ensureBoard();
      ST.applySettings();
      C.emit('state');
      return S;
    } catch (e) { console.warn('load failed', e); return null; }
  };
  ST.save = function (now) {
    if (!S) return;
    const doSave = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } };
    if (now) { doSave(); return; }
    clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 400);
  };
  ST.wipe = function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } S = null; };
  ST.exportSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  ST.importSave = function (txt) {
    try { const s = JSON.parse(decodeURIComponent(escape(atob(txt.trim())))); if (!s || s.v !== 1) return false; S = migrate(s); ST.save(true); ST.applySettings(); C.emit('state'); return true; }
    catch (e) { return false; }
  };
  ST.applySettings = function () {
    const a = C.audio, st = S.settings;
    a.vol.master = st.master; a.vol.sfx = st.sfx; a.vol.music = st.music; a.applyVolumes();
  };
  ST.touch = function () { ST.checkAch(); ST.save(); C.emit('state'); };

  // ---------------------------------------------------------------- derived
  ST.derived = function () {
    const s = S, sk = (id) => s.skills[id] || 0, hw = s.hw;
    return {
      timeBonus: 0.05 * (hw.cpu - 1) + 0.04 * sk('overclocker'),
      lives: sk('second_chance'),
      window: 0.06 * sk('deep_focus'),
      toolBonus: sk('toolsmith'),
      ambientMult: (1 - 0.07 * (hw.net - 1)) * (1 - 0.07 * sk('low_profile')),
      mistakeMult: Math.max(0.3, 1 - 0.06 * (hw.proxy - 1)) * (1 - 0.08 * sk('scrub_pro')),
      heatMult: Math.max(0.2, 1 - 0.07 * (hw.proxy - 1)) * (1 - 0.18 * sk('log_cleaner')),
      lootMult: 1 + 0.15 * sk('hoarder'),
      fenceMult: 1 + 0.07 * sk('fence'),
      payMult: 1 + 0.04 * sk('negotiator'),
      repMult: 1 + 0.2 * sk('networker'),
      shopMult: 1 - 0.05 * sk('haggler'),
      loadoutCap: 1 + hw.ram,
      perf: [0, 0.05, 0.08, 0.12][sk('perfectionist')] || 0,
      cleanExit: sk('clean_exit'),
      lastGasp: sk('last_gasp') > 0,
    };
  };
  ST.toolCharges = function () {
    const d = ST.derived(), out = {};
    C.TOOL_IDS.forEach((id) => { const l = S.sw[id] || 0; out[id] = l > 0 ? D.SW_CHARGES[l] + d.toolBonus : 0; });
    return out;
  };
  ST.masteryLvl = (g) => D.masteryLevel(S.mastery[g] || 0);
  /** bonuses handed to a minigame (global progression + that game's mastery) */
  ST.gameBonus = function (g) {
    const d = ST.derived(), ml = ST.masteryLvl(g);
    return { time: d.timeBonus + 0.02 * ml, lives: d.lives + Math.floor(ml / 4), window: d.window + 0.02 * ml };
  };
  ST.addMastery = function (g, success, rank) {
    const gain = success ? 10 + ({ S: 20, A: 12, B: 6, C: 3, D: 1 }[rank] || 0) : 3;
    const before = ST.masteryLvl(g);
    S.mastery[g] = (S.mastery[g] || 0) + gain;
    const after = ST.masteryLvl(g);
    if (after > before) { C.toast(`${D.GAMES[g].name} MASTERY LEVEL ${after}`, 'good'); C.audio.sfx('levelup'); }
    return gain;
  };
  ST.maxTier = function () {
    let t = 1;
    for (let i = 1; i <= D.MAX_TIER; i++) if (S.level >= D.TIER_LEVEL[i]) t = i;
    if (t > 10 && S.story.done.length < 8) t = 10;
    return t;
  };

  // ---------------------------------------------------------------- economy
  ST.addCredits = function (n) {
    S.credits = Math.max(0, Math.round(S.credits + n));
    if (n > 0) S.stats.earned += n;
    C.emit('credits', n);
  };
  ST.spend = function (n) { if (S.credits < n) { C.audio.sfx('deny'); return false; } S.credits -= n; C.emit('credits', -n); ST.touch(); return true; };
  ST.addXP = function (n) {
    n = Math.round(n); let gained = 0;
    S.xp += n;
    while (S.level < D.MAX_LEVEL && S.xp >= D.xpToNext(S.level)) { S.xp -= D.xpToNext(S.level); S.level++; S.skillPts++; gained++; }
    if (S.level >= D.MAX_LEVEL) S.xp = 0;
    if (gained) { C.audio.sfx('levelup'); C.toast(`Level up! You are now level ${S.level}. +${gained} skill point${gained > 1 ? 's' : ''}`, 'good', 5000); C.emit('levelup', S.level); }
    return gained;
  };
  ST.addHeat = function (n) { S.heat = C.clamp(S.heat + n, 0, 100); S.stats.maxHeat = Math.max(S.stats.maxHeat, S.heat); };
  ST.addRep = function (fac, n) {
    const d = ST.derived(), F = D.FACTIONS[fac];
    const amt = n > 0 ? n * d.repMult * (F.repBonus || 1) : n;
    const before = D.repRank(S.rep[fac]);
    S.rep[fac] = Math.max(0, Math.round(S.rep[fac] + amt));
    const after = D.repRank(S.rep[fac]);
    if (after > before) C.toast(`${F.name}: rank up — ${D.REP_RANKS[after].name}`, 'good', 4500);
    return Math.round(amt);
  };

  // ---------------------------------------------------------------- loot & market
  ST.rollMarket = function (init) {
    const r = Math.random;
    D.LOOT.forEach((l) => {
      const m = S.market[l.cat] || 1;
      let n = m * (0.8 + r() * 0.42) + (1 - m) * 0.14;
      n = C.clamp(n, 0.55, 1.9);
      S.trend[l.cat] = init ? 0 : Math.sign(n - m);
      S.market[l.cat] = n;
    });
  };
  ST.lootValue = (it) => Math.round(it.value * (S.market[it.cat] || 1) * ST.derived().fenceMult);
  ST.addLoot = function (it) { S.loot.push(Object.assign({ id: ST.uid(), day: S.day }, it)); };
  ST.sellLoot = function (ids) {
    let tot = 0, n = 0;
    S.loot = S.loot.filter((it) => { if (ids === 'all' || ids.includes(it.id)) { tot += ST.lootValue(it); n++; return false; } return true; });
    if (tot) { ST.addCredits(tot); S.stats.lootSold += n; C.audio.sfx('coin'); ST.touch(); }
    return tot;
  };

  // ---------------------------------------------------------------- items / upgrades
  ST.itemPrice = (id) => Math.round(D.ITEMS[id].price * ST.derived().shopMult);
  ST.buyItem = function (id, n) {
    n = n || 1; const cost = ST.itemPrice(id) * n;
    if (S.level < D.ITEMS[id].req) return false;
    if (!ST.spend(cost)) return false;
    S.items[id] = (S.items[id] || 0) + n; C.audio.sfx('buy'); ST.touch(); return true;
  };
  ST.buyHardware = function (id) {
    const l = S.hw[id], H = D.HARDWARE[id];
    if (l >= H.max) return false;
    if (S.level < D.HW_REQ_LEVEL[l + 1]) { C.toast(`Requires level ${D.HW_REQ_LEVEL[l + 1]}`, 'bad'); C.audio.sfx('deny'); return false; }
    if (!ST.spend(Math.round(D.hwCost(id, l) * ST.derived().shopMult))) return false;
    S.hw[id]++; C.audio.sfx('buy'); C.toast(`${H.name} upgraded to level ${S.hw[id]}`, 'good'); ST.touch(); return true;
  };
  ST.hwPrice = (id) => Math.round(D.hwCost(id, S.hw[id]) * ST.derived().shopMult);
  ST.swPrice = (id) => Math.round(D.swCost(id, S.sw[id]) * ST.derived().shopMult);
  ST.buySoftware = function (id) {
    const l = S.sw[id];
    if (l >= D.SW_MAX) return false;
    if (S.level < D.SW_REQ_LEVEL[l + 1]) { C.toast(`Requires level ${D.SW_REQ_LEVEL[l + 1]}`, 'bad'); C.audio.sfx('deny'); return false; }
    if (!ST.spend(ST.swPrice(id))) return false;
    S.sw[id]++; C.audio.sfx('buy'); C.toast(`${D.SOFTWARE[id].name} → level ${S.sw[id]}`, 'good'); ST.touch(); return true;
  };
  ST.buySkill = function (id) {
    const sk = D.SKILL_BY_ID[id], cur = S.skills[id] || 0;
    if (cur >= sk.max || S.skillPts < 1) return false;
    if (ST.branchPoints(sk.br) < sk.req) return false;
    S.skillPts--; S.skills[id] = cur + 1; C.audio.sfx('good'); ST.touch(); return true;
  };
  ST.branchPoints = (br) => D.SKILLS.filter((s) => s.br === br).reduce((a, s) => a + (S.skills[s.id] || 0), 0);
  ST.respec = function () {
    const cost = 500 + S.level * 100;
    const pts = Object.values(S.skills).reduce((a, b) => a + b, 0);
    if (!pts) return false;
    if (!ST.spend(cost)) return false;
    S.skills = {}; S.skillPts += pts; ST.touch(); return true;
  };
  ST.launder = function () {
    const cost = 600 + S.level * 90;
    if (S.heat < 5) return false;
    if (!ST.spend(cost)) return false;
    ST.addHeat(-25); C.audio.sfx('good'); ST.touch(); return true;
  };

  // ---------------------------------------------------------------- mail & news
  ST.sendMail = function (from, subj, body, extra) {
    S.mail.unshift(Object.assign({ id: ST.uid(), from, subj, body, day: S.day, read: false }, extra || {}));
    if (S.mail.length > 80) S.mail.length = 80;
    C.audio.sfx('mail'); C.emit('mail');
  };
  ST.unread = () => S.mail.filter((m) => !m.read && !m.del && !m.arch).length;
  ST.pushNews = function (txt) { S.news.unshift(txt); if (S.news.length > 12) S.news.length = 12; C.emit('news'); };

  // ---------------------------------------------------------------- days & board
  ST.ensureBoard = function () {
    if (!S.board.length || S.boardDay !== S.day) { S.board = C.gen.board(S); S.boardDay = S.day; }
  };
  ST.nextDay = function (n) {
    n = n || 1;
    for (let i = 0; i < n; i++) { S.day++; ST.addHeat(-6); ST.rollMarket(); }
    S.board = C.gen.board(S); S.boardDay = S.day;
    ST.touch();
  };

  // ---------------------------------------------------------------- leaderboard
  ST.score = () => Math.round(S.stats.earned * 0.02 + S.stats.done * 60 + S.stats.rankS * 30 + S.level * 150 + S.story.done.length * 500);
  ST.leaderboard = function () {
    const rng = C.makeRng(7777);
    const rows = D.RIVALS.map((n, i) => ({ name: n, score: Math.round(36000 * Math.pow(0.82, i) * (1 + S.day * 0.003) * (0.92 + rng.r() * 0.16)), rival: true }));
    rows.push({ name: S.handle, score: ST.score(), me: true });
    rows.sort((a, b) => b.score - a.score);
    rows.forEach((r, i) => { r.rank = i + 1; });
    return rows;
  };
  ST.updateRank = function () {
    const rows = ST.leaderboard(), me = rows.find((r) => r.me);
    if (S.lastRank && me.rank < S.lastRank) {
      const passed = rows[me.rank];
      C.toast(`UNDERGROUND RANK #${me.rank}${passed ? ' — you passed ' + passed.name : ''}`, 'good', 4500);
    }
    S.lastRank = me.rank;
    if (!S.stats.bestRank || me.rank < S.stats.bestRank) S.stats.bestRank = me.rank;
    return me.rank;
  };

  // ---------------------------------------------------------------- achievements
  ST.checkAch = function () {
    if (!S) return;
    D.ACHIEVEMENTS.forEach((a) => {
      if (S.achievements[a.id]) return;
      let ok = false; try { ok = a.test(S); } catch (e) { ok = false; }
      if (ok) {
        S.achievements[a.id] = S.day; S.credits += a.reward; S.stats.earned += a.reward;
        C.toast(`Achievement unlocked: ${a.name}  (+${C.fmt.cr(a.reward)})`, 'ach', 5200); C.audio.sfx('levelup');
      }
    });
  };
})();
