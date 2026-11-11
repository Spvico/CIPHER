/* CIPHER OS — Training (skills), Profile and Settings */
(function () {
  'use strict';
  const C = window.CIPHER, D = C.data, h = C.h, ST = C.state, ui = C.ui, fmt = C.fmt, K = ui.kit;
  const S = () => ST.get();

  // =================================================================== TRAINING
  let skView = null;
  const BRICON = { breach: 'bolt', ghost: 'eye', broker: 'coin' };
  ui.registerApp('skills', {
    icon: 'skills', w: 940, h: 620,
    menus() { return [{ label: 'File', items: [{ label: 'Respec all skills', disabled: !Object.keys(S().skills).length, fn: () => ST.respec() }] }, { label: 'View', items: Object.keys(D.BRANCHES).map((b) => ({ label: D.BRANCHES[b].name, check: true, on: skView === b, fn: () => { skView = b; ui.refresh('skills'); } })) }]; },
    render(body) {
      const s = S(); C.clear(body);
      const keys = Object.keys(D.BRANCHES); if (!skView || !D.BRANCHES[skView]) skView = keys[0];
      const B = D.BRANCHES[skView], pts = ST.branchPoints(skView);
      const spent = Object.values(s.skills).reduce((a, b) => a + b, 0);
      const go = (b) => () => { skView = b; ui.refresh('skills'); };
      const side = K.side([{ h: 'Branches' }].concat(keys.map((b) => ({ dot: D.BRANCHES[b].color, label: D.BRANCHES[b].name, count: ST.branchPoints(b) + ' pts', on: skView === b, fn: go(b) }))));
      const tool = K.toolbar(K.chip(`${s.skillPts} skill point${s.skillPts === 1 ? '' : 's'} available`, s.skillPts ? 'a' : ''), K.sp(), K.tb('Respec · ' + fmt.cr(500 + s.level * 100), 'refresh', { disabled: !Object.keys(s.skills).length, onclick: () => ST.respec() }));
      const rows = D.SKILLS.filter((x) => x.br === skView).map((sk) => {
        const r = s.skills[sk.id] || 0, locked = pts < sk.req, can = !locked && r < sk.max && s.skillPts > 0;
        return h('div', { class: 'sk-row' + (locked ? ' lock' : '') + (r >= sk.max ? ' max' : '') }, h('div', { class: 'no' }, r + '/' + sk.max), h('div', { class: 'tx' }, h('b', sk.name), h('p', sk.desc), locked ? h('small', { class: 'r' }, `Needs ${sk.req} points in ${B.name}`) : null),
          h('div', { class: 'ac' }, K.pips(r, sk.max), r < sk.max ? h('button', { class: 'btn' + (can ? ' pri' : ''), disabled: !can, onclick: () => ST.buySkill(sk.id) }, 'Rank up') : K.chip('Mastered', 'g')));
      });
      const banner = h('div', { class: 'sk-banner', style: { '--bc': B.color } }, h('div', { style: { flex: 1 } }, h('h3', B.name), h('p', B.desc)), h('div', { class: 'sk-pts' }, h('small', 'Points in branch'), h('b', pts)));
      const tabs = K.tabbar(keys.map((b) => ({ icon: BRICON[b] || 'tree', label: D.BRANCHES[b].name, count: '', on: skView === b, fn: go(b) })));
      const status = K.status(`${spent} points spent`, `${s.skillPts} available`, h('i', { class: 'sp' }), `Level ${s.level}`);
      body.append(K.root(tool, h('div', { class: 'a-cols' }, side, K.scroll('', banner, h('div', { class: 'sk-list' }, rows))), tabs, status));
      ui.setTitle('skills', B.name);
    },
  });

  // =================================================================== PROFILE
  let pfView = 'overview';
  ui.registerApp('profile', {
    icon: 'profile', w: 940, h: 620,
    menus() { return [{ label: 'View', items: [['overview', 'Overview'], ['mastery', 'Mastery'], ['awards', 'Achievements'], ['ranks', 'Underground']].map(([id, l]) => ({ label: l, check: true, on: pfView === id, fn: () => { pfView = id; ui.refresh('profile'); } })) }]; },
    render(body) {
      const s = S(); C.clear(body);
      const go = (v) => () => { pfView = v; ui.refresh('profile'); };
      const done = Object.keys(s.achievements).length;
      const nav = [['overview', 'Overview', 'user'], ['mastery', 'Mastery', 'target'], ['awards', 'Awards', 'medal'], ['ranks', 'Ranks', 'trophy']];
      const side = K.side([{ h: 'Operator' }, { icon: 'user', label: 'Overview', on: pfView === 'overview', fn: go('overview') }, { h: 'Progress' }, { icon: 'target', label: 'Mastery', on: pfView === 'mastery', fn: go('mastery') }, { icon: 'medal', label: 'Achievements', count: `${done}/${D.ACHIEVEMENTS.length}`, on: pfView === 'awards', fn: go('awards') }, { h: 'Community' }, { icon: 'trophy', label: 'Underground', on: pfView === 'ranks', fn: go('ranks') }]);
      let page;
      if (pfView === 'overview') {
        const st = s.stats, wr = st.done + st.failed ? Math.round((st.done / (st.done + st.failed)) * 100) : 0, rk = ST.updateRank();
        const tile = (l, v, cls) => h('div', { class: 'pf-stat' }, h('small', l), h('b', { class: cls || '' }, v));
        page = h('div', {}, h('div', { class: 'pf-hero' }, K.avatar(s.handle, 68, 'var(--acc-bg)'), h('div', { style: { flex: 1, minWidth: 0 } }, h('h2', s.handle), h('div', { class: 'a-sub' }, `Level ${s.level} · day ${s.day} · rank #${rk} in the underground`), h('div', { style: { margin: '10px 0 4px', maxWidth: '360px' } }, K.bar(s.xp / D.xpToNext(s.level), 'c')), h('div', { class: 'a-sub' }, `${s.xp} / ${D.xpToNext(s.level)} xp to level ${s.level + 1}`))),
          h('div', { class: 'pf-page' },
            h('div', { class: 'pf-stats' }, tile('Credits', fmt.cr(s.credits), 'a'), tile('Contracts done', st.done), tile('Win rate', wr + '%'), tile('S ranks', st.rankS, 'a'), tile('Total earned', fmt.cr(st.earned), 'a'), tile('Peak heat', Math.round(st.maxHeat))),
            h('div', { class: 'rg-sec' }, 'Reputation'),
            h('div', { class: 'pf-box' }, Object.keys(D.FACTIONS).map((f) => { const F = D.FACTIONS[f], rk2 = D.repRank(s.rep[f]), nxt = D.REP_RANKS[rk2 + 1]; return h('div', { class: 'pf-rep' }, h('div', { class: 'l1' }, h('i', { class: 'fdot', style: { '--fc': F.hex } }), h('b', F.name), K.chip(D.REP_RANKS[rk2].name, 'c'), h('span', { class: 'dim', style: { marginLeft: 'auto' } }, s.rep[f] + (nxt ? ' / ' + nxt.at : ''))), K.bar(nxt ? (s.rep[f] - D.REP_RANKS[rk2].at) / (nxt.at - D.REP_RANKS[rk2].at) : 1), h('div', { class: 'a-sub', style: { marginTop: '5px' } }, F.desc + ' · +' + rk2 * 5 + '% payout' + (rk2 >= 3 ? ' · elite contracts' : ''))); })),
            h('div', { class: 'rg-sec' }, 'Career'),
            h('div', { class: 'pf-box pf-two' }, [['Contracts failed', st.failed], ['Times traced', st.traced], ['Nodes breached', st.nodes || 0], ['Loot sold', st.lootSold], ['Zero-days used', st.zerodays], ['Best clean trace', st.bestTrace + '%'], ['Play time', Math.round(st.playSec / 60) + ' min']].map(([k, v]) => K.kv(k, v)))));
      } else if (pfView === 'mastery') {
        page = h('div', { class: 'pf-page' }, h('p', { class: 'a-sub' }, 'Every minigame you play builds mastery: permanent bonuses to time, mistakes allowed and precision in that minigame.'),
          Object.keys(D.GAMES).map((g) => { const G = D.GAMES[g], ms = D.masteryProgress(s.mastery[g] || 0), gs = s.stats.games[g] || { plays: 0, wins: 0, s: 0 };
            return h('div', { class: 'pf-ms' }, h('div', { class: 'ic' }, G.icon), h('div', { class: 'tx' }, h('div', { class: 'l1' }, h('b', G.name), K.chip('Mastery ' + ms.lvl, ms.lvl >= 10 ? 'm' : 'c'), h('span', { class: 'dim', style: { marginLeft: 'auto', fontSize: '12px' } }, `${gs.plays} plays · ${gs.wins} wins · ${gs.s || 0} S`)), K.bar(ms.cur / ms.need, ms.lvl >= 10 ? 'm' : 'c'), h('div', { class: 'a-sub', style: { marginTop: '4px' } }, `${G.desc} · +${ms.lvl * 2}% time · +${ms.lvl * 2}% window · +${Math.floor(ms.lvl / 4)} lives`))); }));
      } else if (pfView === 'awards') {
        page = h('div', { class: 'pf-page' }, h('p', { class: 'a-sub' }, `${done} of ${D.ACHIEVEMENTS.length} unlocked`), h('div', { class: 'pf-ach' }, D.ACHIEVEMENTS.map((a) => { const ok = !!s.achievements[a.id]; return h('div', { class: 'pf-a' + (ok ? ' ok' : '') }, h('div', { class: 'ic' }, K.svg(ok ? 'medal' : 'lock')), h('div', {}, h('b', ok ? a.name : 'Hidden'), h('p', a.desc), h('span', { class: 'a', style: { fontSize: '12px' } }, '+' + fmt.cr(a.reward)))); })));
      } else {
        page = h('div', { class: 'pf-page' }, h('p', { class: 'a-sub' }, 'Score combines earnings, contracts, S ranks, level and story progress. Rivals keep climbing.'), h('div', { class: 'pf-box' }, ST.leaderboard().map((r) => h('div', { class: 'pf-lb' + (r.me ? ' me' : '') }, h('span', { class: 'rk' }, '#' + r.rank), K.avatar(r.name, 28), h('span', { style: { flex: 1 } }, r.name, r.me ? h('span', { class: 'dim' }, '  (you)') : null), h('b', { class: 'a' }, fmt.num(r.score))))));
      }
      const tabs = K.tabbar(nav.map(([id, l, ic]) => ({ icon: ic, label: l, on: pfView === id, fn: go(id) })));
      const status = K.status(`Level ${s.level}`, `${done} achievements`, h('i', { class: 'sp' }), s.handle);
      body.append(K.root(h('div', { class: 'a-cols' }, side, K.scroll('', page)), tabs, status));
      ui.setTitle('profile', nav.find((n) => n[0] === pfView)[1]);
    },
  });

  // =================================================================== SETTINGS
  let stView = 'display';
  ui.registerApp('settings', {
    icon: 'settings', w: 760, h: 580, static: true,
    menus() { return [{ label: 'File', items: [{ label: 'Save now', fn: () => { ST.save(true); C.toast('Saved', 'good'); } }] }, { label: 'View', items: [['display', 'Display'], ['sound', 'Sound'], ['data', 'Save data'], ['about', 'About']].map(([id, l]) => ({ label: l, check: true, on: stView === id, fn: () => { stView = id; ui.refresh('settings'); } })) }]; },
    render(body) {
      const s = S(), st = s.settings; C.clear(body);
      const nav = [['display', 'Display', 'monitor'], ['sound', 'Sound', 'vol'], ['data', 'Save data', 'save'], ['about', 'About', 'info']];
      const go = (v) => () => { stView = v; ui.refresh('settings'); };
      const side = K.side([{ h: 'Settings' }].concat(nav.map(([id, l, ic]) => ({ icon: ic, label: l, on: stView === id, fn: go(id) }))));
      const row = (t, sub, ctl) => h('div', { class: 'st-row' }, h('div', { class: 'tx' }, h('b', t), sub ? h('small', sub) : null), ctl);
      const slider = (key, t, sub) => row(t, sub, h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: st[key], oninput: (e) => { st[key] = +e.target.value; ST.applySettings(); ST.save(); } }));
      let page;
      if (stView === 'display') {
        const cur = st.wall || 0;
        page = h('div', { class: 'st-page' }, h('h2', 'Display'), h('div', { class: 'st-grp-h' }, 'Wallpaper'),
          h('div', { class: 'st-walls' }, ui.WALLS.map((n, i) => { const cv = h('canvas'); const b = h('button', { class: 'st-wall' + (cur === i ? ' on' : ''), onclick: () => { st.wall = i; ST.save(); C.emit('wall'); ui.refresh('settings'); } }, cv, h('span', n)); setTimeout(() => ui.paintWall(cv, i, { w: 320, h: 200 }), 0); return b; })),
          h('div', { class: 'st-grp-h' }, 'Window'),
          h('div', { class: 'st-grp' }, row('Full screen', 'Fill the whole screen with CIPHER OS.', h('button', { class: 'btn', onclick: () => { const d = document, el = d.documentElement; try { if (d.fullscreenElement) d.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => C.toast('Full screen is not available here')); else C.toast('Full screen is not available on this device'); } catch (e) { C.toast('Full screen is not available'); } } }, 'Toggle')),
            row('Screen shake', 'Shake the display on big hits and alarms.', K.switch(!!st.shake, (v) => { st.shake = v; ST.applySettings(); ST.save(); }))));
      } else if (stView === 'sound') {
        page = h('div', { class: 'st-page' }, h('h2', 'Sound'), h('div', { class: 'st-grp' }, slider('master', 'Master volume'), slider('sfx', 'Sound effects', 'Clicks, alerts and minigame feedback.'), slider('music', 'Music', 'Ambient score and the rhythm minigame.'),
          row('Rhythm audio offset', 'Milliseconds. Raise it if beats feel late on Bluetooth speakers.', h('input', { type: 'number', value: st.audioOffset, step: 10, style: { width: '84px' }, onchange: (e) => { st.audioOffset = +e.target.value || 0; ST.save(); } }))));
      } else if (stView === 'data') {
        const ta = h('textarea', { rows: 4, placeholder: 'Paste a save code here to import it', style: { width: '100%' } });
        page = h('div', { class: 'st-page' }, h('h2', 'Save data'), h('div', { class: 'st-grp' }, row('Save now', 'Progress also saves automatically in this browser.', h('button', { class: 'btn', onclick: () => { ST.save(true); C.toast('Saved', 'good'); } }, 'Save')),
          h('div', { class: 'st-row', style: { flexDirection: 'column', alignItems: 'stretch', gap: '8px' } }, h('div', { class: 'tx' }, h('b', 'Backup code'), h('small', 'Export your save as text to move it to another device.')), ta, h('div', { style: { display: 'flex', gap: '8px' } }, h('button', { class: 'btn', onclick: () => { ta.value = ST.exportSave(); ta.select(); C.toast('Save code ready to copy'); } }, 'Export'), h('button', { class: 'btn', onclick: () => { if (ST.importSave(ta.value)) { C.toast('Save imported', 'good'); ui.refreshAll(); } else C.toast('Invalid save code', 'bad'); } }, 'Import')))),
          h('div', { class: 'st-grp-h' }, 'Danger zone'), h('div', { class: 'st-grp' }, row('Erase all progress', 'This cannot be undone.', h('button', { class: 'btn dng', onclick: () => ui.modal({ title: 'Erase save?', body: 'This permanently deletes your progress.', buttons: [{ label: 'Erase', cls: 'dng', value: true }, { label: 'Cancel', value: false }] }).then((v) => { if (v) { ST.wipe(); location.reload(); } }) }, 'Erase…'))));
      } else {
        page = h('div', { class: 'st-page' }, h('h2', 'About'), h('div', { class: 'st-about' }, ui.appIcon('settings', 64), h('div', {}, h('b', { style: { fontSize: '17px' } }, 'CIPHER OS 4.2'), h('div', { class: 'a-sub' }, 'Nightfall release · build 4.2.' + (s.day + 100)), h('div', { class: 'a-sub' }, 'Registered to ' + s.handle))),
          h('div', { class: 'st-grp' }, [['Operator', s.handle], ['Level', s.level], ['Day', s.day], ['Play time', Math.round(s.stats.playSec / 60) + ' min']].map(([k, v]) => h('div', { class: 'st-row' }, h('div', { class: 'tx' }, h('b', k)), h('span', { class: 'dim' }, String(v))))),
          h('div', { class: 'st-grp' }, row('Quit to title', 'Reloads CIPHER OS. Progress is saved.', h('button', { class: 'btn', onclick: () => location.reload() }, 'Quit'))));
      }
      const tabs = K.tabbar(nav.map(([id, l, ic]) => ({ icon: ic, label: l, on: stView === id, fn: go(id) })));
      body.append(K.root(h('div', { class: 'a-cols' }, side, K.scroll('', page)), tabs));
      ui.setTitle('settings', nav.find((n) => n[0] === stView)[1]);
    },
  });
})();
