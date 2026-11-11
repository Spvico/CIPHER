/* CIPHER OS — Contracts (job board) and Mail */
(function () {
  'use strict';
  const C = window.CIPHER, D = C.data, h = C.h, ST = C.state, ui = C.ui, fmt = C.fmt, K = ui.kit;
  const S = () => ST.get();
  const fcol = (id) => D.FACTIONS[id].hex;

  // =================================================================== CONTRACTS
  let ctView = 'story', ctFac = 'all', ctSel = null, ctQ = '', ctSort = 'payout', ctDir = -1, ctPane = 'list';

  function loadoutEffective() {
    const s = S(), d = ST.derived(), out = {}; let left = d.loadoutCap;
    D.ITEM_ORDER.forEach((id) => { const n = Math.min(s.loadout[id] || 0, s.items[id] || 0, left); if (n > 0) { out[id] = n; left -= n; } });
    return out;
  }
  function loadoutTotal() { return Object.values(loadoutEffective()).reduce((a, b) => a + b, 0); }

  ui.launchContract = async function (ct) {
    if (C.run.current) return;
    const lo = loadoutEffective();
    ui.closeAll();
    const outcome = await C.run.start(ct, lo);
    ST.ensureBoard();
    if (outcome.raid) await C.run.raid(); else if (outcome.counterTrace) await C.run.counterTrace();
    if (outcome.storyDone === 's7') await ui.ending();
    else if (outcome.storyDone) C.toast('Story mission complete — check your mail', 'good', 4500);
    ST.touch(); C.emit('state');
    ui.openApp('contracts');
  };

  function ctList() {
    const s = S(); ST.ensureBoard();
    const story = C.gen.storyList(s), board = s.board;
    if (ctView === 'story' && !story.length) ctView = 'board';
    let list = ctView === 'story' ? story.slice() : board.slice();
    if (ctView === 'board' && ctFac !== 'all') list = list.filter((c) => c.faction === ctFac);
    const q = ctQ.trim().toLowerCase();
    if (q) list = list.filter((c) => (c.title + ' ' + c.org + ' ' + c.fixer).toLowerCase().includes(q));
    const key = { payout: (c) => c.payout, tier: (c) => c.tier, par: (c) => c.par, heat: (c) => c.heat, title: (c) => c.title.toLowerCase(), org: (c) => c.org.toLowerCase() }[ctSort] || ((c) => c.payout);
    if (ctView === 'board') list.sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * ctDir; });
    return { story, board, list };
  }

  ui.registerApp('contracts', {
    icon: 'contracts', w: 1120, h: 620,
    onOpen(body, arg) { if (arg && arg.tab) { ctView = arg.tab; ctFac = 'all'; } ctPane = 'list'; },
    onBack() { if (C.layout.compact && ctPane === 'detail') { ctPane = 'list'; ui.refresh('contracts'); return true; } return false; },
    menus() {
      const { list } = ctList(), sel = list.find((c) => c.id === ctSel);
      const go = (v, f) => () => { ctView = v; ctFac = f || 'all'; ui.refresh('contracts'); };
      return [
        { label: 'File', items: [{ label: 'Launch breach', disabled: !sel || !!sel.locked, fn: () => sel && ui.launchContract(sel) }] },
        { label: 'View', items: [{ label: 'Story missions', check: true, on: ctView === 'story', fn: go('story') }, { label: 'Job board', check: true, on: ctView === 'board' && ctFac === 'all', fn: go('board') }, '-']
          .concat(Object.keys(D.FACTIONS).map((f) => ({ label: D.FACTIONS[f].name, check: true, on: ctView === 'board' && ctFac === f, fn: go('board', f) })))
          .concat(['-'], [['payout', 'Sort by payout'], ['tier', 'Sort by security tier'], ['par', 'Sort by par time']].map(([k, l]) => ({ label: l, check: true, on: ctSort === k, fn: () => { ctSort = k; ctDir = -1; ui.refresh('contracts'); } }))) },
      ];
    },
    render(body) {
      const s = S(), { story, board, list } = ctList();
      if (!list.find((c) => c.id === ctSel)) ctSel = list[0] && list[0].id;
      const sel = list.find((c) => c.id === ctSel), compact = C.layout.compact;
      if (compact && ctPane === 'detail' && !sel) ctPane = 'list';
      C.clear(body);
      const setView = (v, f) => () => { ctView = v; ctFac = f || 'all'; ctPane = 'list'; ui.refresh('contracts'); };
      const facCount = (f) => board.filter((c) => c.faction === f).length;
      const side = K.side([{ h: 'Gigboard' },
        { icon: 'flag', label: 'Story missions', count: story.length, on: ctView === 'story', fn: setView('story') },
        { icon: 'list', label: 'Job board', count: board.length, on: ctView === 'board' && ctFac === 'all', fn: setView('board') },
        { h: 'Clients' }].concat(Object.keys(D.FACTIONS).map((f) => ({ dot: fcol(f), label: D.FACTIONS[f].name, count: facCount(f), on: ctView === 'board' && ctFac === f, fn: setView('board', f) }))));
      const tool = K.toolbar(
        K.tb('Launch breach', 'bolt', { pri: true, disabled: !sel || !!sel.locked, hideLabelCompact: false, onclick: () => sel && ui.launchContract(sel), cls: 'only-wide' }),
        h('i', { class: 'a-tsep only-wide' }),
        h('span', { class: 'only-compact' }, K.sel([['all', 'All clients']].concat(Object.keys(D.FACTIONS).map((f) => [f, D.FACTIONS[f].name])), ctFac, (v) => { ctFac = v; ctView = 'board'; ui.refresh('contracts'); }, 'a-sel')),
        K.sp(), K.search('Search contracts', ctQ, (v) => { ctQ = v; ui.refresh('contracts'); }, 'ctq'));
      const onSort = (k) => { if (ctSort === k) ctDir = -ctDir; else { ctSort = k; ctDir = (k === 'title' || k === 'org') ? 1 : -1; } ui.refresh('contracts'); };
      const cols = [{ k: 'title', label: 'Contract' }, { k: 'org', label: 'Client', hc: true }, { k: 'tier', label: 'Tier', num: true, hc: true }, { k: 'payout', label: 'Payout', num: true }, { k: 'par', label: 'Par time', num: true, hc: true }, { k: 'heat', label: 'Heat', num: true, hc: true }];
      const rows = list.map((ct) => ({
        sel: ct.id === ctSel, lock: !!ct.locked,
        fn: () => { ctSel = ct.id; ctPane = 'detail'; C.audio.sfx('click'); ui.refresh('contracts'); },
        cells: [
          h('div', { class: 'ct-t' }, h('i', { class: 'fdot', style: { '--fc': fcol(ct.faction) } }), h('div', { class: 'ct-tt' }, h('div', { class: 'ct-n' }, ct.title, ct.story ? K.chip('Story', 'c') : null, ct.elite ? K.chip('Elite', 'm') : null, ct.locked ? K.svg('lock', 'ct-lk') : null), h('div', { class: 'ct-s' }, `${ct.org} · Tier ${ct.tier}`))),
          h('span', { class: 'dim' }, ct.org), 'T' + ct.tier, h('b', { class: 'a' }, fmt.cr(ct.payout)), fmt.time(ct.par), h('span', { class: ct.heat > 20 ? 'r' : 'dim' }, '+' + ct.heat),
        ],
      }));
      const table = list.length ? h('div', { class: 'a-scroll keep-scroll' }, K.table(cols, rows, { sort: ctView === 'board' ? ctSort : null, dir: ctDir, onSort: ctView === 'board' ? onSort : null }))
        : K.empty('flag', ctQ ? 'No matches' : (ctView === 'story' ? 'No story missions yet' : 'The board is empty'), ctView === 'story' ? 'Level up to unlock the next chapter.' : 'Wait a day at the Market for fresh jobs.');
      const main = h('div', { class: 'a-main ct-list' }, table);
      const det = sel ? ctDetail(sel) : h('div', { class: 'ct-det' }, K.empty('flag', 'No contract selected', 'Pick a job from the list.'));
      const cols2 = h('div', { class: 'a-cols view-' + (compact ? ctPane : 'both') }, side, main, det);
      const tabs = K.tabbar([{ icon: 'flag', label: 'Story', count: story.length, on: ctView === 'story', fn: setView('story') }, { icon: 'list', label: 'Job board', count: board.length, on: ctView === 'board', fn: setView('board') }]);
      const status = K.status(`${list.length} contract${list.length === 1 ? '' : 's'}`, `Day ${s.day}`, h('span', {}, 'Heat ', h('b', { class: s.heat > 60 ? 'r' : '' }, Math.round(s.heat))), h('i', { class: 'sp' }), h('span', {}, 'Balance ', h('b', { class: 'a' }, fmt.cr(s.credits))));
      body.append(K.root(compact && ctPane === 'detail' ? null : tool, cols2, compact && ctPane === 'detail' ? null : tabs, status));
      ui.setTitle('contracts', compact && ctPane === 'detail' && sel ? sel.title : (ctView === 'story' ? 'Story missions' : ctFac === 'all' ? 'Job board' : D.FACTIONS[ctFac].name));
    },
  });

  function ctDetail(ct) {
    const s = S(), d = ST.derived(), F = D.FACTIONS[ct.faction];
    const lo = loadoutEffective(), total = loadoutTotal();
    const items = D.ITEM_ORDER.filter((id) => (s.items[id] || 0) > 0);
    const rank = D.repRank(s.rep[ct.faction]);
    const f = (label, val, cls) => h('div', { class: 'ct-f' }, h('small', label), h('b', { class: cls || '' }, val));
    const tools = ST.toolCharges();
    return h('div', { class: 'ct-det' },
      h('div', { class: 'ct-dh', style: { '--fc': F.hex } },
        h('div', { class: 'ct-cl' }, h('i', { class: 'fdot', style: { '--fc': F.hex } }), `${F.name} · ${D.REP_RANKS[rank].name}`),
        h('h3', ct.title), h('div', { class: 'a-sub' }, `${ct.org} · client: ${ct.fixer}`)),
      h('div', { class: 'ct-sec' }, h('p', { class: 'ct-brief' }, '“' + ct.brief + '”')),
      h('div', { class: 'ct-sec' }, h('h5', 'Objective'), h('div', { class: 'ct-obj' }, K.svg('target'), h('span', ct.objText))),
      h('div', { class: 'ct-sec' }, h('h5', 'Details'), h('div', { class: 'ct-fields' },
        f('Payout', fmt.cr(Math.round(ct.payout * d.payMult)), 'a'), f('Experience', '+' + ct.xp + ' xp', 'c'),
        f('Reputation', '+' + ct.rep + ' ' + F.short, 'c'), f('Heat risk', '+' + Math.round(ct.heat * d.heatMult), ct.heat > 20 ? 'r' : 'a'),
        f('Security', 'Tier ' + ct.tier + ' of ' + D.MAX_TIER), f('Par time', fmt.time(ct.par)), ct.boss ? f('Black ICE', ct.boss + ' layers', 'r') : null)),
      h('div', { class: 'ct-sec' }, h('h5', 'Bonus objectives'), ct.bonus.length ? ct.bonus.map((b) => h('div', { class: 'ct-bn' }, K.svg('check'), h('span', D.BONUS[b].text), h('b', { class: 'g' }, '+' + Math.round(D.BONUS[b].mult * 100) + '%'))) : h('div', { class: 'a-sub' }, 'None on this job.')),
      h('div', { class: 'ct-sec' }, h('h5', `Loadout · ${total} of ${d.loadoutCap} slots`),
        items.length ? items.map((id) => {
          const n = lo[id] || 0, it = D.ITEMS[id];
          return h('div', { class: 'ct-lo' }, h('i', { class: 'fdot', style: { '--fc': it.color } }), h('span', it.name), h('span', { class: 'dim' }, `×${s.items[id]}`),
            h('span', { class: 'stp' }, h('button', { class: 'btn sm', disabled: n <= 0, onclick: () => { s.loadout[id] = n - 1; ST.touch(); } }, '−'), h('b', n), h('button', { class: 'btn sm', disabled: total >= d.loadoutCap || n >= s.items[id], onclick: () => { s.loadout[id] = n + 1; ST.touch(); } }, '+')));
        }) : h('div', { class: 'a-sub' }, 'No consumables owned. Buy some in Market.'),
        h('div', { class: 'a-sub', style: { marginTop: '8px' } }, 'Built-in tools: ' + C.TOOL_IDS.map((id) => `${C.TOOLS[id].name} ×${tools[id]}`).join(', '))),
      ct.locked ? h('div', { class: 'ct-sec r' }, ct.locked) : null,
      h('div', { class: 'ct-go' }, h('button', { class: 'btn pri', disabled: !!ct.locked, onclick: () => ui.launchContract(ct) }, 'Launch breach')));
  }

  // =================================================================== MAIL
  let mFolder = 'inbox', mSel = null, mPane = 'list', mQ = '';
  const FOLDERS = [['inbox', 'Inbox', 'inbox'], ['starred', 'Starred', 'star'], ['sent', 'Sent', 'send'], ['archive', 'Archive', 'archive'], ['trash', 'Trash', 'trash']];
  const mfolder = (s, f) => ({
    inbox: s.mail.filter((m) => !m.del && !m.arch), starred: s.mail.filter((m) => m.star && !m.del), sent: s.sent || [],
    archive: s.mail.filter((m) => m.arch && !m.del), trash: s.mail.filter((m) => m.del),
  })[f] || [];
  const whenOf = (s, m) => (m.day === s.day ? 'Today' : m.day === s.day - 1 ? 'Yesterday' : 'Day ' + m.day);
  const preview = (b) => String(b).replace(/\s+/g, ' ').slice(0, 90);
  const REPLIES = ['Got it. Keep your head down and your trace low.', 'Noted. I will be in touch when something worth your time comes up.', 'Message received. Do not email me about this again, use the board.', 'Understood. Watch the heat, it is climbing everywhere.', 'Heard you. Get back to work, hacker.'];

  function compose(o) {
    o = o || {}; const s = S();
    const contacts = Array.from(new Set(s.mail.map((m) => m.from).filter(Boolean)));
    const to = h('input', { type: 'text', value: o.to || '', list: 'ml-contacts', placeholder: 'Name or handle', 'data-fk': 'mto' });
    const subj = h('input', { type: 'text', value: o.subj || '', placeholder: 'Subject', 'data-fk': 'msj' });
    const msg = h('textarea', { rows: 9, placeholder: 'Write your message…' }); msg.value = o.body || '';
    const row = (l, el) => h('label', { class: 'ml-crow' }, h('span', l), el);
    const form = h('div', { class: 'ml-compose' }, h('datalist', { id: 'ml-contacts' }, contacts.map((c) => h('option', { value: c }))), row('To', to), row('Subject', subj), msg);
    ui.modal({ title: 'New message', wide: true, body: form, buttons: [{ label: 'Send', cls: 'pri', value: true }, { label: 'Discard', value: false }] }).then((ok) => {
      if (!ok) return;
      if (!to.value.trim()) { C.toast('Add a recipient first'); compose({ to: to.value, subj: subj.value, body: msg.value }); return; }
      const st = S(); st.sent = st.sent || [];
      const rec = to.value.trim(), sj = subj.value.trim() || '(no subject)';
      st.sent.unshift({ id: ST.uid(), from: st.handle, to: rec, subj: sj, body: msg.value, day: st.day, read: true, sent: true });
      if (st.sent.length > 40) st.sent.length = 40;
      ST.touch(); C.audio.sfx('mail'); C.toast('Message sent');
      if (contacts.some((c) => c.toLowerCase() === rec.toLowerCase())) setTimeout(() => { if (S() === st) ST.sendMail(contacts.find((c) => c.toLowerCase() === rec.toLowerCase()), 'Re: ' + sj, REPLIES[(sj.length + rec.length) % REPLIES.length]); }, 6000);
    });
  }

  ui.registerApp('mail', {
    icon: 'mail', w: 980, h: 600,
    onOpen() { mPane = 'list'; },
    onBack() { if (C.layout.compact && mPane === 'detail') { mPane = 'list'; ui.refresh('mail'); return true; } return false; },
    menus() {
      const s = S(), m = mfolder(s, mFolder).find((x) => x.id === mSel);
      const act = (fn) => () => { if (m) { fn(m); ST.touch(); } };
      return [
        { label: 'File', items: [{ label: 'New message', fn: () => compose() }, { label: 'Mark all as read', fn: () => { s.mail.forEach((x) => { x.read = true; }); ST.touch(); } }, { label: 'Empty trash', disabled: !s.mail.some((x) => x.del), fn: () => { s.mail = s.mail.filter((x) => !x.del); ST.touch(); } }] },
        { label: 'Message', items: [{ label: 'Reply', disabled: !m || m.sent, fn: () => m && replyTo(m) }, { label: m && m.star ? 'Remove star' : 'Star', disabled: !m || m.sent, fn: act((x) => { x.star = !x.star; }) }, { label: 'Archive', disabled: !m || m.sent || m.arch, fn: act((x) => { x.arch = true; x.del = false; }) }, { label: 'Mark as unread', disabled: !m || m.sent, fn: act((x) => { x.read = false; }) }, '-', { label: 'Delete', disabled: !m, fn: () => m && del(m) }] },
        { label: 'View', items: FOLDERS.map(([id, l]) => ({ label: l, check: true, on: mFolder === id, fn: () => { mFolder = id; mSel = null; mPane = 'list'; ui.refresh('mail'); } })) },
      ];
    },
    render(body) {
      const s = S(); s.sent = s.sent || [];
      const compactV = C.layout.compact;
      let list = mfolder(s, mFolder);
      const q = mQ.trim().toLowerCase();
      if (q) list = list.filter((m) => (m.from + ' ' + (m.to || '') + ' ' + m.subj + ' ' + m.body).toLowerCase().includes(q));
      if (!list.find((m) => m.id === mSel)) { mSel = !compactV && list[0] ? list[0].id : (compactV ? null : null); if (compactV) mPane = 'list'; }
      const m = list.find((x) => x.id === mSel);
      if (m && !m.read && !m.sent && !(compactV && mPane === 'list')) { m.read = true; setTimeout(() => ST.touch(), 0); }
      const un = s.mail.filter((x) => !x.read && !x.del && !x.arch).length;
      const counts = { inbox: un || '', starred: '', sent: '', archive: '', trash: '' };
      C.clear(body);
      const pick = (f) => () => { mFolder = f; mSel = null; mPane = 'list'; ui.refresh('mail'); };
      const side = h('nav', { class: 'a-side' }, h('button', { class: 'ml-new', onclick: () => compose() }, K.svg('compose'), 'New message'),
        FOLDERS.map(([id, l, ic]) => h('button', { class: 'a-si' + (mFolder === id ? ' on' : ''), onclick: () => { C.audio.sfx('click'); pick(id)(); } }, K.svg(ic), h('span', { class: 'slb' }, l), counts[id] ? h('span', { class: 'ct' }, counts[id]) : null)));
      const tool = K.toolbar(K.tb('New', 'compose', { pri: true, onclick: () => compose(), cls: 'only-compact' }), K.sp(), K.search('Search mail', mQ, (v) => { mQ = v; ui.refresh('mail'); }, 'mq'));
      const items = list.length ? list.map((x) => {
        const who = x.sent ? 'To: ' + x.to : x.from;
        return h('div', { class: 'ml-item' + (x.id === mSel ? ' sel' : '') + (x.read ? '' : ' unread'), onclick: () => { mSel = x.id; mPane = 'detail'; C.audio.sfx('click'); ui.refresh('mail'); } },
          K.avatar(x.sent ? x.to : x.from, 36),
          h('div', { class: 'tx' }, h('div', { class: 'l1' }, h('span', { class: 'fr' }, who), x.star ? h('span', { class: 'st' }, '★') : null, h('span', { class: 'dt' }, whenOf(s, x))), h('div', { class: 'sj' }, x.subj), h('div', { class: 'pv' }, preview(x.body))));
      }) : [K.empty(mFolder === 'trash' ? 'trash' : 'inbox', q ? 'No results' : mFolder === 'inbox' ? 'Inbox zero' : 'Nothing here', q ? 'Try another search.' : mFolder === 'inbox' ? 'New messages from your clients will land here.' : null)];
      const listEl = h('div', { class: 'ml-list' }, h('div', { class: 'ml-lh' }, h('b', FOLDERS.find((f) => f[0] === mFolder)[1]), h('span', { class: 'dim' }, mFolder === 'inbox' && un ? `${un} unread` : `${list.length} message${list.length === 1 ? '' : 's'}`)), h('div', { class: 'a-scroll keep-scroll' }, items));
      const read = h('div', { class: 'ml-read' }, m ? readPane(s, m) : K.empty('mailopen', 'No message selected', 'Select a message to read it.'));
      const tabs = K.tabbar(FOLDERS.map(([id, l, ic]) => ({ icon: ic, label: l, count: counts[id], on: mFolder === id, fn: pick(id) })));
      const status = K.status(`${list.length} message${list.length === 1 ? '' : 's'}`, `${un} unread`, h('i', { class: 'sp' }), h('span', {}, s.handle + '@cipher'));
      const detailOnly = compactV && mPane === 'detail';
      body.append(K.root(detailOnly ? null : tool, h('div', { class: 'a-cols view-' + (compactV ? mPane : 'both') }, side, listEl, read), detailOnly ? null : tabs, status));
      ui.setTitle('mail', compactV ? (detailOnly ? '' : FOLDERS.find((f) => f[0] === mFolder)[1]) : FOLDERS.find((f) => f[0] === mFolder)[1] + (un && mFolder === 'inbox' ? ` (${un})` : ''));
    },
  });

  function del(m) {
    const s = S();
    if (m.sent) s.sent = s.sent.filter((x) => x.id !== m.id);
    else if (m.del) s.mail = s.mail.filter((x) => x.id !== m.id);
    else { m.del = true; m.arch = false; }
    mSel = null; if (C.layout.compact) mPane = 'list'; ST.touch(); C.audio.sfx('close');
  }
  function replyTo(m) { compose({ to: m.from, subj: /^re:/i.test(m.subj) ? m.subj : 'Re: ' + m.subj, body: '\n\n— ' + m.from + ' wrote:\n' + String(m.body).split('\n').map((l) => '> ' + l).join('\n') }); }

  function readPane(s, m) {
    const mine = !!m.sent;
    const bar = h('div', { class: 'a-tool' },
      mine ? null : K.tb('Reply', 'reply', { onclick: () => replyTo(m) }),
      mine ? null : K.tb(m.arch ? 'Move to inbox' : 'Archive', 'archive', { onclick: () => { m.arch = !m.arch; m.del = false; mSel = null; if (C.layout.compact) mPane = 'list'; ST.touch(); } }),
      K.tb(m.del || mine ? 'Delete forever' : 'Delete', 'trash', { onclick: () => del(m) }),
      K.sp(), mine ? null : K.tb('', 'star', { title: m.star ? 'Remove star' : 'Star', on: !!m.star, onclick: () => { m.star = !m.star; ST.touch(); } }),
      mine ? null : K.tb('', 'mailopen', { title: 'Mark as unread', onclick: () => { m.read = false; mSel = null; if (C.layout.compact) mPane = 'list'; ST.touch(); } }));
    const story = m.tag === 'story';
    return h('div', { class: 'ml-pane' }, bar, h('div', { class: 'a-scroll keep-scroll' },
      h('h2', { class: 'ml-subj' }, m.subj),
      h('div', { class: 'ml-head' }, K.avatar(mine ? m.to : m.from, 40), h('div', { class: 'ml-who' }, h('b', mine ? s.handle : m.from), h('div', { class: 'dim' }, mine ? `to ${m.to}` : `to ${s.handle}`)), h('span', { class: 'dim ml-date' }, whenOf(s, m) + (m.day === s.day ? '' : ''))),
      h('div', { class: 'ml-body' }, m.body),
      story ? h('div', { class: 'ml-card' }, ui.appIcon('contracts', 32), h('div', { style: { flex: 1 } }, h('b', 'Story mission'), h('div', { class: 'dim' }, 'A job from this client is waiting on your board.')), h('button', { class: 'btn pri', onclick: () => ui.openApp('contracts', { tab: 'story' }) }, 'Open Contracts')) : null));
  }

  // =================================================================== ENDING
  ui.ending = function () {
    return ui.modal({ wide: true, title: 'Cipher — core offline', body: h('div', { class: 'ending' }, h('p', 'The core goes dark. Across the city, a million quiet scores flicker out: every flag, every file, every prediction.'), h('p', 'The streets will never know your name. The underground will not forget it.'), h('p', { class: 'a' }, 'Legend-tier contracts are now unlocked (tiers 11+, level permitting). The grind continues. Climb the underground. Master every minigame. Become number one.'), h('p', { class: 'dim' }, 'Thanks for playing CIPHER.')), buttons: [{ label: 'Back to the wire', cls: 'pri', value: true }] });
  };
})();
