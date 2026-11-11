/* CIPHER — procedural contracts & network generation */
(function () {
  'use strict';
  const C = window.CIPHER, D = C.data;
  const G = (C.gen = {});
  const TYPE_SHORT = { gateway: 'gw', relay: 'rly', auth: 'auth', database: 'db', vault: 'vlt', grid: 'ctl', comms: 'log', core: 'core' };

  const orgFor = (rng, tier) => {
    let pool = D.ORGS.filter((o) => tier >= o.t[0] && tier <= o.t[1]);
    if (!pool.length) pool = D.ORGS.filter((o) => tier >= o.t[0]);
    return rng.pick(pool.length ? pool : D.ORGS);
  };
  const objFor = (rng, kind, ind) => {
    if (kind === 'steal') { const f = rng.pick(D.FILES[ind] || D.FILES.tech); return `Exfiltrate "${f}"`; }
    if (kind === 'wipe') return `Erase the ${rng.pick(D.RECORDS)}`;
    if (kind === 'sabotage') return `Disable the ${rng.pick(D.SYSTEMS)}`;
    return `Plant a backdoor in the ${rng.pick(D.PLANTS)}`;
  };

  G.slug = (org) => org.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')[0].slice(0, 8);

  G.makeContract = function (rng, tier, faction, S, opts) {
    opts = opts || {};
    const F = D.FACTIONS[faction];
    const org = opts.orgDef || orgFor(rng, tier);
    const kind = opts.kind || rng.weighted([['steal', 5], ['wipe', 2], ['sabotage', 2], ['plant', 2]], (x) => x[1])[0];
    const objText = opts.objText || objFor(rng, kind, org.ind);
    const kindMult = { steal: 1, wipe: 0.92, sabotage: 1.1, plant: 1.05 }[kind];
    const rank = S ? D.repRank(S.rep[faction]) : 0;
    const elite = !!opts.elite;
    const nodeEst = 6 + Math.floor(tier * 0.75) + 1;
    const payout = Math.round(D.payBase(tier) * F.pay * kindMult * (1 + 0.05 * rank) * (elite ? 1.45 : 1) * rng.f(0.92, 1.12) / 5) * 5;
    const bonusPool = rng.shuffle(['silent', 'fast', 'flawless', 'greedy']);
    const bonus = bonusPool.slice(0, tier >= 4 ? 2 : 1);
    const brief = rng.pick(D.BRIEFS[faction]).replace('{org}', org.n).replace('{obj}', objText);
    return {
      id: 'c' + (S ? S.nextId++ : rng.i(1000, 9999)), seed: rng.i(1, 2e9), story: null, tier, faction, fixer: rng.pick(D.FIXERS[faction]),
      title: (elite ? 'ELITE: ' : '') + rng.pick(D.TITLES[kind]), org: org.n, ind: org.ind, objKind: kind, objText, brief,
      payout, rep: Math.round(6 + tier * 3.2 + (elite ? 8 : 0)), xp: Math.round(60 + 45 * tier + (elite ? 60 : 0)), heat: Math.round((4 + tier * 1.7) * F.heat + (elite ? 5 : 0)),
      bonus, par: 150 + nodeEst * 26 + tier * 6, boss: 0, elite, expires: S ? S.day + 1 : 99,
    };
  };

  G.storyContract = function (def, S) {
    const rng = C.makeRng(C.hashStr(def.id));
    const org = D.ORGS.find((o) => o.n === def.org) || { n: def.org, ind: 'defense', t: [1, 12] };
    const F = D.FACTIONS[def.faction];
    const ct = G.makeContract(rng, def.tier, def.faction, null, { orgDef: org, kind: def.objKind, objText: def.objText });
    ct.id = 'story-' + def.id; ct.story = def.id; ct.title = def.title; ct.fixer = def.fixer; ct.brief = def.brief;
    ct.payout = Math.round(D.payBase(def.tier) * F.pay * 1.5 / 10) * 10; ct.xp = Math.round(ct.xp * 1.6); ct.rep = Math.round(ct.rep * 1.8);
    ct.boss = def.boss || 0; ct.tutorial = !!def.tutorial; ct.expires = 9999; ct.minLevel = def.minLevel;
    if (def.tutorial) ct.bonus = ['flawless'];
    ct.par += (ct.boss ? 160 : 0);
    return ct;
  };

  /** Story missions currently visible (available + one locked teaser) */
  G.storyList = function (S) {
    const out = [];
    for (const def of D.STORY) {
      const done = S.story.done.includes(def.id);
      if (done) continue;
      const prevOk = !def.after || S.story.done.includes(def.after);
      if (!prevOk) break;
      const ct = G.storyContract(def, S);
      ct.locked = S.level < def.minLevel ? `Requires level ${def.minLevel}` : null;
      out.push(ct);
      break;
    }
    return out;
  };

  G.board = function (S) {
    const rng = C.makeRng((S.day * 7919 + C.hashStr(S.handle)) >>> 0);
    const maxT = C.state ? C.state.maxTier() : 1;
    const list = [];
    const facs = ['syndicate', 'meridian', 'lumen'];
    const count = 7;
    for (let i = 0; i < count; i++) {
      const fac = i < 3 ? facs[i] : rng.pick(facs);
      const lo = Math.max(1, maxT - 2);
      let tier = rng.weighted(Array.from({ length: maxT - lo + 1 }, (_, k) => lo + k), (t) => 1 + (t - lo) * 1.3);
      const rank = D.repRank(S.rep[fac]);
      const elite = rank >= 3 && rng.chance(0.4);
      if (elite) tier = Math.min(D.MAX_TIER, tier + 1);
      list.push(G.makeContract(rng, tier, fac, S, { elite }));
    }
    list.sort((a, b) => a.tier - b.tier);
    return list;
  };

  // ------------------------------------------------------------------ network
  G.network = function (ct) {
    const rng = C.makeRng(ct.seed);
    const tier = ct.tier;
    const registered = C.mg ? C.mg.list().map((g) => g.id) : Object.keys(D.GAMES);
    let n = 5 + Math.floor(tier * 0.75) + rng.i(0, 2) + (ct.boss ? 2 : 0);
    let L = C.clamp(3 + Math.floor(tier / 3) + (ct.boss ? 1 : 0), 3, 6);
    if (ct.tutorial) { n = 6; L = 2; }
    n = C.clamp(n, 6, 15);

    // objectives count
    let P = tier >= 8 ? rng.i(1, 3) : tier >= 5 ? rng.i(1, 2) : 1;
    if (ct.boss || ct.tutorial) P = 1;

    const counts = new Array(L).fill(1);
    counts[L - 1] = P;
    let rem = n - 1 - counts.reduce((a, b) => a + b, 0);
    let guard = 0;
    while (rem > 0 && guard++ < 200) {
      const i = rng.i(0, L - 1);
      if (counts[i] < (i === L - 1 ? 3 : 3)) { counts[i]++; rem--; }
    }
    if (ct.tutorial) { counts[0] = 2; counts[1] = 3; }

    const nodes = [];
    const layers = [[]];
    const mk = (layer, type) => {
      const nd = { id: 'n' + nodes.length, type, layer, x: 0, y: 0, name: '', diff: 1, state: 'hidden', obj: null, loot: null, games: [], stage: 0, stages: 1, stageGames: null, attempts: 0, seed: rng.i(1, 2e9) };
      nodes.push(nd); (layers[layer] = layers[layer] || []).push(nd); return nd;
    };
    mk(0, 'gateway');
    for (let l = 1; l <= L; l++) {
      for (let j = 0; j < counts[l - 1]; j++) {
        let type;
        if (l === L && j < P) {
          const pool = { steal: ['database', 'vault'], sabotage: ['grid'], wipe: ['comms', 'database'], plant: ['auth', 'grid'] }[ct.objKind];
          type = rng.pick(pool);
        } else if (l === 1) type = rng.pick(['relay', 'auth', 'relay', 'comms']);
        else type = rng.pick(['auth', 'comms', 'relay', 'grid', 'database', 'vault']);
        mk(l, type);
      }
    }
    if (ct.tutorial) {
      layers[1][0].type = 'auth'; layers[1][1].type = 'relay';
      layers[2][0].type = 'database'; layers[2][1].type = 'comms'; layers[2][2].type = 'auth';
    }
    // objectives
    const last = layers[L];
    for (let j = 0; j < P; j++) last[j].obj = 'primary';
    if (ct.boss) { last[0].type = 'core'; last[0].stages = ct.boss; }

    // edges
    const edges = [];
    const has = (a, b) => edges.some((e) => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
    const link = (a, b) => { if (a !== b && !has(a, b)) edges.push([a, b]); };
    for (let l = 1; l <= L; l++) {
      layers[l].forEach((nd) => link(rng.pick(layers[l - 1]).id, nd.id));
      layers[l - 1].forEach((nd) => { if (!edges.some((e) => e[0] === nd.id)) link(nd.id, rng.pick(layers[l]).id); });
      layers[l].forEach((nd) => { if (rng.chance(0.35)) link(rng.pick(layers[l - 1]).id, nd.id); });
      if (layers[l].length > 1 && rng.chance(0.3)) { const a = rng.i(0, layers[l].length - 2); link(layers[l][a].id, layers[l][a + 1].id); }
    }

    // loot
    const lootCandidates = nodes.filter((nd) => !nd.obj && nd.type !== 'gateway' && ['database', 'vault', 'comms', 'auth', 'grid'].includes(nd.type));
    let lootN = Math.min(lootCandidates.length, ct.tutorial ? 1 : rng.i(1, 1 + Math.floor(tier / 4) + 1));
    rng.shuffle(lootCandidates).slice(0, Math.max(1, lootN)).forEach((nd) => {
      const lt = rng.pick(D.LOOT);
      nd.loot = { cat: lt.cat, name: `${ct.org.split(' ')[0]} ${lt.name}`, value: Math.round(D.payBase(tier) * 0.38 * lt.base * rng.f(0.8, 1.35) / 5) * 5, tier };
    });
    if (ct.tutorial) { layers[2][1].loot = { cat: 'records', name: 'Café Customer Records', value: 140, tier: 1 }; }

    // names, difficulty, positions
    const slug = G.slug(ct.org);
    nodes.forEach((nd, idx) => {
      nd.name = `${slug}-${TYPE_SHORT[nd.type]}-${String(idx + 1).padStart(2, '0')}`;
      const base = 0.8 + tier * 0.85 + nd.layer * 0.3 + (nd.obj ? 0.7 : 0) + rng.f(-0.4, 0.4);
      nd.diff = C.clamp(nd.type === 'gateway' ? base * 0.8 - 0.3 : nd.type === 'core' ? base + 1.2 : base, 1, 13);
      if (ct.tutorial) nd.diff = C.clamp(1 + nd.layer * 0.4, 1, 2);
      const T = D.NODE_TYPES[nd.type];
      nd.games = T.games.filter((g) => registered.includes(g));
      if (!nd.games.length && nd.type !== 'core') nd.games = registered.slice(0, 2);
      if (nd.type === 'core') {
        const pool = rng.shuffle(registered.slice());
        nd.stageGames = pool.slice(0, nd.stages);
      }
    });
    layers.forEach((arr, l) => {
      arr.forEach((nd, j) => {
        nd.x = (l + 0.5) / (L + 1) + rng.f(-0.025, 0.025);
        const cnt = arr.length;
        nd.y = cnt === 1 ? 0.5 + rng.f(-0.12, 0.12) : (j + 1) / (cnt + 1) + rng.f(-0.06, 0.06);
        nd.y = C.clamp(nd.y, 0.1, 0.9);
      });
    });
    nodes[0].state = 'seen';
    // bonus objective sanity
    const bonus = ct.bonus.filter((b) => b !== 'greedy' || nodes.some((nd) => nd.loot));
    return { nodes, edges, bonus, layers: L + 1 };
  };
})();
