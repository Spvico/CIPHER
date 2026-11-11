/* CIPHER OS — the shell: power-on/boot, login, desktop (taskbar, start menu, tray, notifications) and the phone shell */
(function () {
  'use strict';
  const C = window.CIPHER, D = C.data, h = C.h, ST = C.state, ui = C.ui, fmt = C.fmt, G = ui.G;
  const S = () => ST.get();
  const $ = (id) => document.getElementById(id);
  const ORDER = ['contracts', 'mail', 'terminal', 'rig', 'market', 'skills', 'profile', 'settings'];
  const NAME = (id) => ui.APPS[id].name;
  let sh = null, timers = [], bound = false, lastNewsToast = 0, ncSeen = 0, saveTimer = 0;
  const later = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  // ================================================================= wallpapers (painted once, no animation)
  function paintWall(cv, kind) { ui.paintWall(cv, kind); }
  const wallKind = () => (S() && S().settings.wall) || 0;

  // ================================================================= boot
  const BIOS = ['CipherBIOS 4.2.1   Copyright (C) 2041 Nullsoft Systems Ltd.', 'BIOS date 03/14/41   build 20410314-rc2', '', 'CPU   Quantum-X 8-core @ 4.20 GHz', 'Memory test  16777216K OK', '', 'Primary master   NVMe0  CIPHER-SSD 512GB  [encrypted]', 'Network adapters  eth0 (spoofed)  wlan0 (monitor mode)', '', 'Booting from NVMe0 ...'];
  const KLOG = [['dm', '[    0.000000] Linux version 6.1.0-null (build@cipher) #1 SMP PREEMPT'], ['dm', '[    0.412881] nvme0n1: p1 p2 p3'], ['ok', 'Reached target Local File Systems.'], ['ok', 'Started Encrypted Volume Unlock (vault).'], ['ok', 'Started Network Time Synchronization.'], ['ok', 'Started Onion Router (7 hops).'], ['ok', 'Started MAC Address Spoofing Daemon.'], ['ok', 'Started ICE Breaker Service.'], ['ok', 'Started Trace Sniffer (passive).'], ['wr', 'Heat monitor: no law-enforcement signatures detected'], ['ok', 'Reached target Network is Online.'], ['ok', 'Reached target Graphical Interface.']];
  C.boot = function () {
    const app = $('app'); C.clear(app); clearTimers();
    const q = new URLSearchParams(location.search);
    if (q.get('skip') === '1') { C.audio.init(); showLogin(); return; }
    const go = () => {
      window.removeEventListener('keydown', go); C.audio.init(); C.audio.resume(); C.audio.sfx('boot'); C.clear(app);
      const box = h('div', { id: 'boot' }); app.append(box);
      let skipped = false;
      const skip = () => { if (skipped) return; skipped = true; clearTimers(); window.removeEventListener('keydown', skip); box.removeEventListener('pointerdown', skip); showLogin(); };
      setTimeout(() => { window.addEventListener('keydown', skip); box.addEventListener('pointerdown', skip); }, 400);
      let t = 0; const add = (txt, cls, ms) => { t += ms; later(t, () => { box.append(h('div', { class: 'bl ' + (cls || '') }, txt)); }); };
      BIOS.forEach((l) => add(l, '', l ? 70 : 20));
      t += 260; later(t, () => C.clear(box));
      KLOG.forEach(([k, l]) => { t += k === 'dm' ? 50 : 85; const kk = k, ll = l; later(t, () => { const row = h('div', { class: 'bl' }); if (kk === 'dm') { row.className = 'bl dm'; row.textContent = ll; } else row.append(h('span', { class: kk }, kk === 'ok' ? '[  OK  ] ' : '[ WARN ] '), ll); box.append(row); }); });
      t += 380; later(t, () => { C.clear(app); const mk = ui.glyph(G.logo, 'mark'); mk.setAttribute('fill', '#8fb4f0'); app.append(h('div', { class: 'splash' }, mk, h('div', { class: 'spin' }))); });
      t += 1000; later(t, skip);
    };
    app.append(h('div', { class: 'power' }, h('button', { class: 'power-btn', title: 'Power on', onclick: go }, ui.glyph(G.power)), h('div', {}, C.isTouch ? 'Tap to power on' : 'Press any key to power on')));
    window.addEventListener('keydown', go);
  };

  // ================================================================= login
  function showLogin() {
    clearTimers(); clearInterval(saveTimer); ui.closeAll(); sh = null;
    document.body.classList.remove('app-open');
    const app = $('app'); C.clear(app);
    C.audio.init(); C.audio.music.setMode('title'); try { C.audio.music.start(); } catch (e) { /* needs gesture */ }
    const wall = h('canvas', { id: 'wall' }); paintWall(wall, 0);
    const peek = ST.peek(), now = new Date();
    const time = h('div', { class: 'lg-time' }), date = h('div', { class: 'lg-date' });
    const tick = () => { const d = new Date(); time.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); date.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); };
    tick(); const clockT = setInterval(tick, 10000); timers.push(clockT);
    const card = h('div', { class: 'lg-card' });
    const err = h('div', { class: 'lg-err' });
    const enter = (isNew) => { clearInterval(clockT); C.audio.resume(); C.audio.sfx('levelup'); C.startDesktop(isNew); };
    const signIn = () => {
      const f = card.querySelector('input'); const dots = '••••••••'; let i = f.value.length; f.type = 'password'; f.disabled = true;
      const step = () => { if (i < 8) { f.value = dots.slice(0, ++i); C.audio.sfx('type'); setTimeout(step, 38); } else { if (ST.load()) enter(false); else { err.textContent = 'This profile could not be read.'; f.disabled = false; } } };
      step();
    };
    const showUser = () => {
      C.clear(card);
      const pass = h('input', { type: 'password', placeholder: 'Password', autocomplete: 'off', value: '', onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') signIn(); } });
      card.append(h('div', { class: 'lg-av' }, (peek.handle || '?').charAt(0).toUpperCase()), h('div', { class: 'lg-name' }, peek.handle || 'user'), h('div', { class: 'lg-sub' }, `Level ${peek.level || 1} · Day ${peek.day || 1}`),
        h('div', { class: 'lg-field' }, pass, h('button', { title: 'Sign in', onclick: signIn }, '→')), err,
        h('div', { class: 'lg-links' }, h('button', { class: 'lg-link', onclick: () => showNew(true) }, 'Create new user…'), h('button', { class: 'lg-link', onclick: showImport }, 'Restore backup…')));
      if (!C.isTouch) setTimeout(() => pass.focus(), 40);
    };
    const showNew = (hasOld) => {
      const go = () => { const hdl = (inp.value.trim() || 'NULL').slice(0, 14); const doIt = () => { ST.newGame(hdl); enter(true); }; if (hasOld) ui.modal({ title: 'Replace existing profile?', body: `Creating a new user permanently replaces the profile "${peek.handle}".`, buttons: [{ label: 'Replace', cls: 'dng', value: true }, { label: 'Cancel', value: false }] }).then((v) => v && doIt()); else doIt(); };
      const inp = h('input', { type: 'text', maxlength: 14, placeholder: 'Choose a handle', autocomplete: 'off', onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); } });
      C.clear(card);
      card.append(h('div', { class: 'lg-av', style: { background: '#4a5463' } }, '+'), h('div', { class: 'lg-name' }, hasOld ? 'New user' : 'Welcome to CIPHER OS'), h('div', { class: 'lg-sub' }, 'Pick a handle. It appears on the underground leaderboard.'),
        h('div', { class: 'lg-field' }, inp, h('button', { title: 'Create', onclick: go }, '→')), err,
        h('div', { class: 'lg-links' }, hasOld ? h('button', { class: 'lg-link', onclick: showUser }, 'Cancel') : null, h('button', { class: 'lg-link', onclick: showImport }, 'Restore backup…')));
      if (!C.isTouch) setTimeout(() => inp.focus(), 40);
    };
    const showImport = () => {
      const ta = h('textarea', { rows: 4, style: { width: '100%' }, placeholder: 'Paste your backup code' });
      ui.modal({ title: 'Restore backup', body: ta, buttons: [{ label: 'Restore', cls: 'pri', value: true }, { label: 'Cancel', value: false }] }).then((v) => { if (!v) return; if (ST.importSave(ta.value)) { C.toast('Backup restored', 'good', 3000, 'Login'); const pk = ST.peek(); if (pk) { peek.handle = pk.handle; peek.level = pk.level; peek.day = pk.day; showUser(); } } else err.textContent = 'That backup code is not valid.'; });
    };
    if (peek) showUser(); else showNew(false);
    const power = h('button', { class: 'icon-btn', title: 'Power', onclick: (e) => { const r = e.currentTarget.getBoundingClientRect(); ui.contextMenu(r.left - 100, r.top - 60, [{ label: 'Restart', fn: () => location.reload() }]); } }, ui.glyph(G.power));
    app.append(wall, h('div', { id: 'login' }, time, date, card, h('div', { class: 'lg-foot' }, h('span', 'CIPHER OS 4.2 “nightfall”'), power)));
    if (q().get('autostart') === '1') { ST.newGame('TESTER'); enter(true); }
  }
  const q = () => new URLSearchParams(location.search);
  C.lock = function () { try { ST.save(true); } catch (e) { /* ignore */ } showLogin(); };

  // ================================================================= desktop / phone shell
  C.startDesktop = function (isNew) {
    clearTimers(); clearInterval(saveTimer);
    buildShell();
    bindOnce();
    C.audio.music.setMode('desk');
    saveTimer = setInterval(() => ST.save(true), 20000);
    const open = (id, a) => later(350, () => ui.openApp(id, a));
    if (isNew) { if (!C.layout.compact) { open('mail'); later(700, () => ui.openApp('contracts', { tab: 'story' })); } later(1200, () => C.toast('Welcome to CIPHER OS. Open Gigboard to take your first job.', 'good', 7000, 'Setup')); }
    else if (!C.layout.compact) open('contracts', { tab: 'story' });
  };

  function bindOnce() {
    if (bound) return; bound = true;
    C.on('state', paintAll); C.on('mail', () => { const m = S().mail[0]; paintAll(); if (m && !m.read) C.toast(`${m.from}: ${m.subj}`, '', 5000, 'Mail'); });
    C.on('news', () => { const n = Date.now(); if (n - lastNewsToast > 25000 && S().news[0]) { lastNewsToast = n; C.toast(S().news[0], '', 5500, 'Net News'); } });
    C.on('notif', () => paintAll()); C.on('wins', renderTasks); C.on('wall', () => sh && paintWall(sh.wall, wallKind()));
    let lastCompact = C.layout.compact, rt = 0;
    C.on('layout', () => { clearTimeout(rt); rt = setTimeout(() => { if (!sh) return; if (C.layout.compact !== lastCompact) { lastCompact = C.layout.compact; const open = ui.winList().map((w) => w.id); buildShell(); if (C.layout.compact && open[0]) ui.openApp(open[0]); } else paintWall(sh.wall, wallKind()); }, 150); });
    document.addEventListener('pointerdown', (e) => { if (!sh) return; if (!e.target.closest('#start, #nc, .tb-start, .tb-clock, .tb-bell')) closePops(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sh) { closePops(); ui.closeMenu(); } });
  }

  function buildShell() {
    const app = $('app'); C.clear(app); document.body.classList.remove('app-open');
    const compact = C.layout.compact, os = h('div', { id: 'os' }), wall = h('canvas', { id: 'wall' });
    sh = { compact, os, wall, pops: {} };
    os.append(wall);
    const desk = h('div', { id: 'desk' });
    if (!compact) {
      // desktop icons
      const icons = h('div', { id: 'icons' });
      ORDER.forEach((id) => {
        let lastType = 'mouse';
        const b = h('button', { class: 'dicon', title: NAME(id), onpointerup: (e) => { lastType = e.pointerType; }, onclick: (e) => { icons.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); e.stopPropagation(); if (lastType === 'touch') ui.openApp(id); }, ondblclick: () => ui.openApp(id), onkeydown: (e) => { if (e.key === 'Enter') ui.openApp(id); } }, ui.appIcon(id, 44), h('span', NAME(id)));
        if (id === 'mail') sh.mailBadge = h('i', { class: 'badge' }), b.append(sh.mailBadge);
        if (id === 'skills') sh.skBadge = h('i', { class: 'badge g' }), b.append(sh.skBadge);
        icons.append(b);
      });
      os.addEventListener('click', (e) => { if (!e.target.closest('.dicon')) icons.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); });
      // taskbar
      sh.tasks = h('div', { class: 'tray', style: { gap: '2px', flex: 1, minWidth: 0, overflow: 'hidden' } });
      const start = h('button', { class: 'tb-btn tb-start', title: 'Start', onclick: () => togglePop('start') }, ui.glyph(G.logo, ''));
      start.firstChild.setAttribute('fill', '#8fb4f0'); start.firstChild.setAttribute('stroke', 'none');
      sh.start = start;
      sh.heatB = h('button', { class: 'tb-btn heat lo', onclick: () => ui.openApp('profile') }, ui.glyph(G.shield), (sh.heatT = h('span', '0%')));
      sh.walletB = h('button', { class: 'tb-btn wallet', onclick: () => ui.openApp('market') }, ui.glyph(G.wallet), (sh.walletT = h('span', '¢0')));
      sh.volB = h('button', { class: 'tb-btn', title: 'Music', onclick: () => { const st = S().settings; st.music = st.music > 0 ? 0 : 0.45; ST.applySettings(); ST.save(); paintAll(); } }, (sh.volI = h('span', { style: { display: 'flex' } }, ui.glyph(G.vol))));
      sh.clock = h('button', { class: 'tb-btn tb-clock', onclick: () => togglePop('nc') }, h('span', '--:--'), h('small', ''));
      sh.bell = h('button', { class: 'tb-btn tb-bell', title: 'Notifications', onclick: () => togglePop('nc') }, ui.glyph(G.bell), (sh.bellDot = h('i', { class: 'dot', style: { display: 'none' } })));
      const taskbar = h('div', { id: 'taskbar' }, start, h('i', { class: 'tb-sep' }), sh.tasks, h('div', { class: 'tray' }, sh.heatB, sh.walletB, h('button', { class: 'tb-btn', title: 'Connected via 7 proxies', style: { cursor: 'default' } }, ui.glyph(G.net)), sh.volB, sh.clock, sh.bell));
      os.append(icons, desk, taskbar);
      os.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.win, #taskbar, .pop')) return; e.preventDefault();
        ui.contextMenu(e.clientX, e.clientY, [{ label: 'Open Terminal', fn: () => ui.openApp('terminal') }, { label: 'Open Gigboard', fn: () => ui.openApp('contracts') }, '-', { label: 'Next wallpaper', fn: () => { const st = S().settings; st.wall = ((st.wall || 0) + 1) % ui.WALLS.length; ST.save(); C.emit('wall'); } }, { label: 'Display settings', fn: () => ui.openApp('settings') }, '-', { label: 'Refresh', fn: () => { paintAll(); ui.refreshAll(); } }, { label: 'About CIPHER OS', fn: about }]);
      });
    } else {
      sh.sClock = h('span', '--:--'); sh.sHeat = h('span', { class: 'heat' }, ui.glyph(G.shield)); sh.sNet = h('span', ui.glyph(G.net)); sh.sCr = h('span', '¢0');
      const status = h('div', { id: 'statusbar' }, sh.sClock, h('span', { class: 'sp' }), sh.sCr, sh.sHeat, sh.sNet);
      sh.hmName = h('b'); sh.hmSub = h('small'); sh.hmAv = h('div', { class: 'av' }); sh.hmXp = ui.bar(0, 'c'); sh.hmCr = h('b'); sh.hmHeat = h('b'); sh.hmDay = h('b'); sh.hmNews = h('div', { class: 'hm-news' });
      const home = h('div', { id: 'home' },
        h('div', { class: 'hm-widget' }, h('div', { class: 'hm-prof' }, sh.hmAv, sh.hmName, sh.hmSub), h('div', { style: { margin: '10px 0 0' } }, sh.hmXp), h('div', { class: 'hm-stats' }, h('div', h('small', 'Credits'), sh.hmCr), h('div', h('small', 'Heat'), sh.hmHeat), h('div', h('small', 'Day'), sh.hmDay))),
        h('div', {}, h('div', { class: 'hm-widget', style: { marginBottom: '14px' } }, h('small', { style: { opacity: .7, fontSize: '11px' } }, 'Net News'), sh.hmNews), (sh.grid = h('div', { class: 'hm-grid' }))));
      const DOCK = ['contracts', 'mail', 'terminal', 'market'], dock = h('div', { id: 'dock' });
      ORDER.forEach((id) => { const b = h('button', { class: 'hm-app', onclick: () => ui.openApp(id) }, ui.appIcon(id, 54), h('span', NAME(id))); if (id === 'mail') sh.mailBadge = h('i', { class: 'badge' }), b.append(sh.mailBadge); if (id === 'skills') sh.skBadge = h('i', { class: 'badge g' }), b.append(sh.skBadge); if (DOCK.includes(id)) { b.classList.add('in-dock'); dock.append(b); } else sh.grid.append(b); });
      const nav = h('div', { id: 'navbar' }, h('button', { class: 'nav-pill', title: 'Home', onclick: () => { ui.closeAll(); } }));
      os.append(home, dock, desk, status, nav);
    }
    app.append(os);
    paintWall(wall, wallKind());
    paintAll(); renderTasks();
    const clk = () => { const d = new Date(), t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); if (sh.sClock) sh.sClock.textContent = t; if (sh.clock) { sh.clock.firstChild.textContent = t; sh.clock.lastChild.textContent = 'Day ' + (S() ? S().day : 1); } };
    clk(); timers.push(setInterval(clk, 5000));
    if (compact) timers.push(setInterval(newsRot, 9000)), newsRot();
  }
  let newsI = 0;
  function newsRot() { if (!sh || !sh.hmNews || !S()) return; const pool = S().news.slice(0, 5).concat(D.NEWS); sh.hmNews.textContent = pool[newsI++ % pool.length]; }

  function renderTasks() {
    if (!sh || !sh.tasks) return; C.clear(sh.tasks);
    const open = {}; ui.winList().forEach((w) => { open[w.id] = w; });
    ORDER.forEach((id) => {
      const w = open[id];
      const b = h('button', { class: 'tb-btn tb-task' + (w ? ' opn' : '') + (w && w.focus ? ' focus' : '') + (w && w.min ? ' min' : ''), title: NAME(id), onclick: () => { closePops(); if (w) ui.toggleTask(id); else ui.openApp(id); }, oncontextmenu: (e) => { e.preventDefault(); const r = b.getBoundingClientRect(); ui.contextMenu(r.left, r.top - (w ? 78 : 50), [{ label: 'Open ' + NAME(id), fn: () => ui.openApp(id) }, w ? { label: 'Close window', fn: () => ui.closeApp(id) } : null].filter(Boolean)); } }, ui.appIcon(id, 27));
      if (id === 'mail' && ST.unread()) b.append(h('i', { class: 'badge' }, ST.unread()));
      sh.tasks.append(b);
    });
    if (sh.start) sh.start.classList.toggle('on', !!sh.pops.start);
  }

  function paintAll() {
    const s = S(); if (!sh || !s) return;
    const un = ST.unread(), heat = Math.round(s.heat), hc = heat >= 70 ? 'hi' : heat >= 40 ? 'mid' : 'lo';
    if (sh.mailBadge) { sh.mailBadge.textContent = un || ''; sh.mailBadge.style.display = un ? '' : 'none'; }
    if (sh.skBadge) { sh.skBadge.textContent = s.skillPts || ''; sh.skBadge.style.display = s.skillPts ? '' : 'none'; }
    if (!sh.compact) {
      sh.heatT.textContent = heat + '%'; sh.heatB.className = 'tb-btn heat ' + hc; sh.heatB.title = `Heat ${heat}% — law-enforcement attention`;
      sh.walletT.textContent = fmt.cr(s.credits); sh.walletB.title = 'Wallet';
      sh.volI.replaceChildren(ui.glyph(s.settings.music > 0 ? G.vol : G.mute)); sh.volB.title = s.settings.music > 0 ? 'Music on' : 'Music off';
      sh.bellDot.style.display = C.notifs.length > ncSeen ? '' : 'none';
      sh.clock.lastChild.textContent = 'Day ' + s.day;
    } else {
      sh.sCr.textContent = fmt.cr(s.credits); sh.sHeat.className = 'heat ' + (hc === 'lo' ? '' : hc);
      sh.hmAv.textContent = s.handle.charAt(0).toUpperCase(); sh.hmName.textContent = s.handle; sh.hmSub.textContent = `Level ${s.level}`;
      sh.hmXp.firstChild.style.width = (s.level >= D.MAX_LEVEL ? 100 : (s.xp / D.xpToNext(s.level)) * 100) + '%';
      sh.hmCr.textContent = fmt.cr(s.credits); sh.hmHeat.textContent = heat + '%'; sh.hmHeat.style.color = hc === 'hi' ? '#ff8a8a' : hc === 'mid' ? '#f0c060' : ''; sh.hmDay.textContent = s.day;
    }
    if (sh.pops.start) fillStart(sh.pops.start);
    if (sh.pops.nc) fillNC(sh.pops.nc);
  }

  // ---------------------------------------------------------------- popovers
  function closePops() { if (!sh) return; Object.keys(sh.pops).forEach((k) => { sh.pops[k].remove(); delete sh.pops[k]; }); if (sh.start) sh.start.classList.remove('on'); }
  function togglePop(which) {
    const was = !!sh.pops[which]; closePops(); if (was) return;
    const el = h('div', { class: 'pop', id: which }); sh.pops[which] = el; sh.os.append(el);
    if (which === 'start') { fillStart(el); sh.start.classList.add('on'); setTimeout(() => { const i = el.querySelector('input'); if (i && !C.isTouch) i.focus(); }, 30); }
    else { ncSeen = C.notifs.length; fillNC(el); paintAll(); }
    C.audio.sfx('tick');
  }
  function fillStart(el) {
    const s = S(), prev = el.querySelector('input'), val = prev ? prev.value : '', focused = prev && document.activeElement === prev;
    C.clear(el);
    const input = h('input', { type: 'text', placeholder: 'Search apps', value: val, oninput: () => { fillStart(el); const i = el.querySelector('input'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') { const f = ORDER.find((id) => NAME(id).toLowerCase().includes(input.value.toLowerCase())); if (f) { closePops(); ui.openApp(f); } } } });
    const apps = ORDER.filter((id) => NAME(id).toLowerCase().includes(val.toLowerCase()));
    const mail = s.mail.filter((m) => !m.read).slice(0, 3);
    el.append(...[h('div', { class: 'st-search' }, ui.glyph(G.search), input), h('div', { class: 'st-h' }, h('span', val ? 'Results' : 'Apps')),
      h('div', { class: 'st-apps' }, apps.map((id) => { const b = h('button', { class: 'st-app', onclick: () => { closePops(); ui.openApp(id); } }, ui.appIcon(id, 40), h('span', NAME(id))); if (id === 'mail' && ST.unread()) b.append(h('i', { class: 'badge' }, ST.unread())); return b; })),
      !val && mail.length ? h('div', { class: 'st-h' }, h('span', 'Unread mail')) : null,
      !val && mail.length ? h('div', { class: 'st-recent' }, mail.map((m) => h('button', { class: 'st-rec', onclick: () => { closePops(); ui.openApp('mail'); } }, ui.appIcon('mail', 24), h('span', `${m.from} — ${m.subj}`)))) : null,
      h('div', { class: 'st-foot' }, h('div', { class: 'av' }, s.handle.charAt(0).toUpperCase()), h('div', { class: 'st-user' }, h('b', s.handle), h('small', `Level ${s.level}`), ui.bar(s.level >= D.MAX_LEVEL ? 1 : s.xp / D.xpToNext(s.level), 'c')),
        h('button', { class: 'icon-btn', title: 'Settings', onclick: () => { closePops(); ui.openApp('settings'); } }, ui.appIcon('settings', 20)),
        h('button', { class: 'icon-btn', title: 'Power', onclick: (e) => { const r = e.currentTarget.getBoundingClientRect(); ui.contextMenu(r.left - 120, r.top - 110, [{ label: 'Lock', fn: () => { closePops(); C.lock(); } }, { label: 'Sign out', fn: () => { closePops(); C.lock(); } }, '-', { label: 'Restart', fn: () => { ST.save(true); location.reload(); } }]); } }, ui.glyph(G.power)))].filter(Boolean));
    if (focused) { const i = el.querySelector('input'); i.focus(); i.setSelectionRange(val.length, val.length); }
  }
  function fillNC(el) {
    const s = S(); C.clear(el);
    el.append(h('div', { class: 'nc-h' }, h('span', 'Notifications'), h('button', { class: 'btn sm flat', onclick: () => { C.notifs.length = 0; ncSeen = 0; fillNC(el); paintAll(); } }, 'Clear all')),
      h('div', { class: 'nc-list' }, C.notifs.length ? C.notifs.slice(0, 12).map((n) => h('div', { class: 'nc-item ' + n.kind }, h('header', h('span', n.app), h('span', n.time)), n.msg)) : h('div', { class: 'nc-empty' }, 'No new notifications')),
      h('div', { class: 'nc-news' }, h('h5', 'Net News · Day ' + s.day), s.news.slice(0, 4).map((x) => h('div', x))));
  }

  function about() {
    const hw = S().hw || {}, mk = ui.glyph(G.logo, ''); mk.setAttribute('fill', '#8fb4f0'); mk.setAttribute('width', 44); mk.setAttribute('height', 44);
    ui.modal({ title: 'About CIPHER OS', body: h('div', {}, h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' } }, mk, h('div', {}, h('div', { style: { fontSize: '18px', fontWeight: 600 } }, 'CIPHER OS 4.2 “nightfall”'), h('div', { class: 'dim' }, 'kernel 6.1.0-null · build 2041.11'))),
      h('div', { class: 'kv' }, h('span', 'Operator'), h('b', S().handle)), h('div', { class: 'kv' }, h('span', 'Rig'), h('b', `CPU L${hw.cpu || 1} · RAM L${hw.ram || 1} · NET L${hw.net || 1} · PROXY L${hw.proxy || 1}`)), h('div', { class: 'kv' }, h('span', 'Network'), h('b', 'Onion routed · 7 hops')), h('div', { class: 'kv' }, h('span', 'Uptime'), h('b', `Day ${S().day}`))), buttons: [{ label: 'OK', cls: 'pri', value: true }] });
  }
})();
