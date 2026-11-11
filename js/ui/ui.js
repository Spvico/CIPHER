/* CIPHER OS — UI kit: app icons, dialogs, context menu, window manager (desktop windows / phone activities) */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h;
  const ui = (C.ui = {});

  // ---------------------------------------------------------------- icons
  ui.ICONS = {
    contracts: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4M8.5 10h7M8.5 14h7M8.5 18h4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    terminal: '<path d="M6 8l4 4-4 4M12.5 16.5H18"/>',
    rig: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/>',
    market: '<path d="M4.5 8.5h15l-1.2 11.5H5.7zM8.5 8.5V7a3.5 3.5 0 017 0v1.5"/>',
    skills: '<circle cx="12" cy="5.5" r="2.2"/><circle cx="5.5" cy="18.5" r="2.2"/><circle cx="18.5" cy="18.5" r="2.2"/><path d="M12 7.7v5.3M12 13l-5 4M12 13l5 4"/>',
    profile: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.6-3.8 3.5-5.8 7.2-5.8s6.6 2 7.2 5.8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7"/><circle cx="12" cy="12" r="6.3"/>',
  };
  ui.APPS = {
    contracts: { name: 'Gigboard', color: '#3573d6' },
    mail: { name: 'Dispatch', color: '#d4573b' },
    terminal: { name: 'Terminal', color: '#2a2e35' },
    rig: { name: 'Rigkit', color: '#7566cc' },
    market: { name: 'Bazaar', color: '#1d8f84' },
    skills: { name: 'Dojo', color: '#3b9a5b' },
    profile: { name: 'Operator', color: '#cf8727' },
    settings: { name: 'Settings', color: '#656c78' },
  };
  const SVGNS = 'http://www.w3.org/2000/svg';
  ui.icon = (name) => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ico-svg'); s.innerHTML = ui.ICONS[name] || ''; return s; };
  ui.appIcon = (id, size) => {
    const a = ui.APPS[id] || { color: '#555' }, wrap = h('span', { class: 'appico' });
    if (size) wrap.style.setProperty('--s', size + 'px');
    const term = id === 'terminal';
    wrap.innerHTML = `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="11.5" fill="${a.color}"/>${term ? '<rect x=".75" y=".75" width="46.5" height="46.5" rx="10.8" fill="none" stroke="#454c57" stroke-width="1.5"/>' : '<rect width="48" height="22" rx="11.5" fill="#fff" opacity=".07"/>'}<g transform="translate(9 9) scale(1.25)" fill="none" stroke="${term ? '#5ad17d' : '#fff'}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ui.ICONS[id] || ''}</g></svg>`;
    return wrap;
  };
  ui.glyph = (path, cls) => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', cls || ''); s.innerHTML = path; return s; };
  ui.G = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>', power: '<path d="M12 3v8"/><path d="M6.5 6.8a8 8 0 1011 0"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.7-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.8-7.5-9.5V6z"/>', wallet: '<path d="M4 7.5A2.5 2.5 0 016.5 5H19v3"/><path d="M4 7.5V17a2 2 0 002 2h13.5a.5.5 0 00.5-.5V8.5a.5.5 0 00-.5-.5H6.5A2.5 2.5 0 014 7.5z"/><circle cx="16.5" cy="13.5" r="1" fill="currentColor"/>',
    net: '<path d="M3 9.5a14 14 0 0118 0M6 13a9 9 0 0112 0M9 16.4a4.2 4.2 0 016 0"/><circle cx="12" cy="19.5" r=".8" fill="currentColor"/>', vol: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4.5 4.5 0 010 6M18 6.5a8 8 0 010 11"/>', mute: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 2h-15z"/><path d="M10 21h4"/>', back: '<path d="M15 5l-7 7 7 7"/>', restart: '<path d="M20 12a8 8 0 11-2.6-5.9"/><path d="M20 4v5h-5"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    logo: '<path fill-rule="evenodd" d="M6.5 10.5h11a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19v-7a1.5 1.5 0 011.5-1.5zM8 10.5V8a4 4 0 118 0v2.5h-2V8a2 2 0 10-4 0v2.5zM12 14.2a1.5 1.5 0 00-.75 2.8v1.5h1.5V17A1.5 1.5 0 0012 14.2z"/>',
  };
  const fixCaps = (s) => (typeof s === 'string' && s.length > 3 && s === s.toUpperCase() && /[A-Z]/.test(s)) ? s.charAt(0) + s.slice(1).toLowerCase() : s;

  // ---------------------------------------------------------------- dialog
  ui.modal = function (o) {
    return new Promise((resolve) => {
      const btns = (o.buttons && o.buttons.length ? o.buttons : [{ label: 'OK', value: true, cls: 'pri' }]);
      let el;
      const done = (v) => { window.removeEventListener('keydown', kh, true); el.remove(); resolve(v); };
      const kh = (ev) => {
        if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName) && ev.key === 'Enter' && ev.target.tagName !== 'INPUT') return;
        if (ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); done(btns[0].value); }
        else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); done(btns[btns.length - 1].value); }
      };
      const ordered = btns.slice().reverse();
      el = h('div', { class: 'dlg-back' }, h('div', { class: 'dlg' + (o.wide ? ' wide' : ''), role: 'dialog' },
        h('div', { class: 'dlg-bar' }, h('span', fixCaps(o.title || 'Message')), h('button', { title: 'Close', onclick: () => done(btns[btns.length - 1].value) }, '✕')),
        h('div', { class: 'dlg-body' }, o.body ? (typeof o.body === 'string' ? h('p', o.body) : o.body) : null),
        h('div', { class: 'dlg-foot' }, ordered.map((b) => h('button', { class: 'btn ' + (b.cls || ''), onclick: () => done(b.value) }, b.label)))));
      document.body.append(el);
      setTimeout(() => window.addEventListener('keydown', kh, true), 50);
    });
  };

  // ---------------------------------------------------------------- context menu
  ui.closeMenu = () => { const m = document.getElementById('ctx'); if (m) m.remove(); };
  ui.contextMenu = function (x, y, items) {
    ui.closeMenu();
    const m = h('div', { id: 'ctx' }, items.map((it) => it === '-' ? h('hr') : h('button', { disabled: it.disabled ? true : null, class: it.check ? 'chk' + (it.on ? ' on' : '') : '', onclick: () => { ui.closeMenu(); it.fn && it.fn(); } }, h('span', it.label), it.key ? h('kbd', it.key) : null)));
    document.body.append(m);
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(4, Math.min(x, window.innerWidth - r.width - 4)) + 'px'; m.style.top = Math.max(4, Math.min(y, window.innerHeight - r.height - 4)) + 'px';
    setTimeout(() => { const off = (e) => { if (!m.contains(e.target)) { ui.closeMenu(); window.removeEventListener('pointerdown', off, true); } }; window.addEventListener('pointerdown', off, true); }, 0);
  };

  // ---------------------------------------------------------------- window manager
  const apps = {}, wins = {}, geom = {};
  let zTop = 50, cascade = 0;
  ui.registerApp = (id, def) => { apps[id] = def; };
  ui.apps = apps;
  const deskEl = () => document.getElementById('desk');
  const changed = () => C.emit('wins');
  const CTL = {
    min: '<svg viewBox="0 0 12 12"><path d="M1.5 6.5h9"/></svg>', max: '<svg viewBox="0 0 12 12"><rect x="1.8" y="1.8" width="8.4" height="8.4" rx="1"/></svg>',
    rest: '<svg viewBox="0 0 12 12"><path d="M3.5 3.5h7v7h-7z M1.5 8.5v-7h7"/></svg>', cls: '<svg viewBox="0 0 12 12"><path d="M1.8 1.8l8.4 8.4M10.2 1.8l-8.4 8.4"/></svg>',
  };
  ui.openApp = function (id, arg) {
    const def = apps[id]; if (!def) return;
    let w = wins[id];
    if (w) { if (w.el.classList.contains('min')) { w.el.classList.remove('min'); } focus(id); if (def.onOpen) def.onOpen(w.body, arg); refresh(id); changed(); return w; }
    const compact = C.layout.compact;
    if (compact) Object.keys(wins).forEach((k) => { if (k !== id) closeNow(k); });
    const desk = deskEl(), dw = desk.clientWidth, dh = desk.clientHeight;
    const g = geom[id] || (() => {
      const W = Math.min(def.w || 860, dw - 40), H = Math.min(def.h || 560, dh - 24);
      let x = Math.round((dw - W) / 2) + ((cascade % 6) - 2) * 26, y = Math.round((dh - H) / 2) + ((cascade % 6) - 2) * 22; cascade++;
      x = Math.max(8, Math.min(x, dw - W - 8)); y = Math.max(6, Math.min(y, dh - H - 6));
      return { x, y, w: W, h: H, max: false };
    })();
    const body = h('div', { class: 'win-body' });
    const titleEl = h('span', { class: 'win-title' }), menuEl = (!compact && def.menus) ? h('div', { class: 'win-menu' }) : null;
    const el = h('div', { class: 'win' + (g.max ? ' max' : ''), id: 'win-' + id, 'data-app': id, style: { left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px' } },
      h('div', { class: 'win-bar', onpointerdown: (ev) => startDrag(ev, id), ondblclick: (ev) => { if (!ev.target.closest('button') && !C.layout.compact) toggleMax(id); } },
        h('button', { class: 'win-back', title: 'Back', onclick: () => { const ww = wins[id]; if (ww && ww.def.onBack && ww.def.onBack()) return; ui.closeApp(id); } }, ui.glyph(ui.G.back)),
        ui.appIcon(id, 17), titleEl,
        h('div', { class: 'win-ctl' },
          h('button', { class: 'min', title: 'Minimize', onclick: () => minimize(id), html: CTL.min }),
          h('button', { class: 'mx', title: 'Maximize', onclick: () => toggleMax(id), html: g.max ? CTL.rest : CTL.max }),
          h('button', { class: 'cls', title: 'Close', onclick: () => ui.closeApp(id), html: CTL.cls }))),
      menuEl,
      body,
      ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((d) => h('div', { class: 'rz ' + d, onpointerdown: (ev) => startResize(ev, id, d) })));
    el.addEventListener('pointerdown', () => focus(id), true);
    desk.append(el);
    w = wins[id] = { el, body, def, titleEl, menuEl, sub: '' };
    setTitle(id, '');
    if (menuEl) buildMenu(id);
    C.audio.sfx('open');
    focus(id);
    if (def.onOpen) def.onOpen(body, arg);
    refresh(id);
    document.body.classList.toggle('app-open', compact);
    changed();
    return w;
  };
  function setTitle(id, sub) {
    const w = wins[id]; if (!w) return; w.sub = sub || ''; const nm = (ui.APPS[id] || {}).name || id;
    w.titleEl.textContent = w.sub ? (C.layout.compact ? w.sub : `${w.sub} — ${nm}`) : nm;
  }
  ui.setTitle = setTitle;
  function composeMenus(id) {
    const w = wins[id]; const nm = (ui.APPS[id] || {}).name || id;
    const menus = (w.def.menus ? w.def.menus() : []).map((m) => ({ label: m.label, items: m.items.slice() }));
    const file = menus.find((x) => x.label === 'File') || (menus.unshift({ label: 'File', items: [] }), menus[0]);
    file.items = file.items.concat(file.items.length ? ['-'] : [], [{ label: 'Close window', fn: () => ui.closeApp(id) }]);
    menus.push({ label: 'Help', items: [{ label: 'About ' + nm, fn: () => ui.modal({ title: 'About ' + nm, body: h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center' } }, ui.appIcon(id, 52), h('div', {}, h('div', { style: { fontWeight: 600, fontSize: '15px' } }, nm), h('div', { class: 'dim' }, 'CIPHER OS 4.2 component · version 4.2.' + (id.length + 1)))), buttons: [{ label: 'OK', cls: 'pri', value: true }] }) }] });
    return menus;
  }
  function buildMenu(id) {
    const w = wins[id]; if (!w || !w.menuEl) return; C.clear(w.menuEl);
    const show = (b, label) => { const m = composeMenus(id).find((x) => x.label === label); if (!m) return; const r = b.getBoundingClientRect(); Array.from(w.menuEl.children).forEach((x) => x.classList.toggle('on', x === b)); ui.contextMenu(r.left, r.bottom + 1, m.items); const c = document.getElementById('ctx'); if (c) c.dataset.owner = label; };
    composeMenus(id).forEach((m) => {
      const b = h('button', { class: 'mb' }, m.label); let was = false;
      b.addEventListener('pointerdown', () => { const c = document.getElementById('ctx'); was = !!(c && c.dataset.owner === m.label); });
      b.addEventListener('click', () => { if (was) { ui.closeMenu(); b.classList.remove('on'); } else show(b, m.label); });
      b.addEventListener('pointerenter', () => { const c = document.getElementById('ctx'); if (c && c.dataset.owner && c.dataset.owner !== m.label) show(b, m.label); });
      w.menuEl.append(b);
    });
    const clr = () => { if (!w.menuEl.isConnected) { document.removeEventListener('pointerup', hook, true); return; } if (!document.getElementById('ctx')) Array.from(w.menuEl.children).forEach((x) => x.classList.remove('on')); };
    const hook = () => setTimeout(clr, 0);
    document.addEventListener('pointerup', hook, true);
  }
  ui.rebuildMenu = buildMenu;
  function closeNow(id) { const w = wins[id]; if (!w) return; if (w.def.onClose) w.def.onClose(); w.el.remove(); delete wins[id]; }
  ui.closeApp = function (id) { if (!wins[id]) return; closeNow(id); C.audio.sfx('close'); document.body.classList.toggle('app-open', C.layout.compact && Object.keys(wins).length > 0); changed(); };
  ui.closeAll = () => { Object.keys(wins).forEach(closeNow); document.body.classList.remove('app-open'); changed(); };
  function focus(id) {
    const w = wins[id]; if (!w) return;
    if (!w.el.classList.contains('focus')) { w.el.style.zIndex = ++zTop; Object.values(wins).forEach((o) => o.el.classList.toggle('focus', o === w)); changed(); }
    else w.el.style.zIndex = ++zTop;
  }
  function minimize(id) {
    const w = wins[id]; if (!w) return; w.el.classList.add('min'); w.el.classList.remove('focus'); C.audio.sfx('close');
    const next = Object.keys(wins).filter((k) => !wins[k].el.classList.contains('min')).sort((a, b) => (+wins[b].el.style.zIndex) - (+wins[a].el.style.zIndex))[0]; if (next) focus(next); changed();
  }
  function toggleMax(id) {
    const w = wins[id]; if (!w) return; const el = w.el, on = !el.classList.contains('max');
    if (on) { const r = el.getBoundingClientRect(), dr = deskEl().getBoundingClientRect(); geom[id] = { x: r.left - dr.left, y: r.top - dr.top, w: r.width, h: r.height, max: false }; }
    el.classList.toggle('max', on);
    if (!on && geom[id]) Object.assign(el.style, { left: geom[id].x + 'px', top: geom[id].y + 'px', width: geom[id].w + 'px', height: geom[id].h + 'px' });
    el.querySelector('.mx').innerHTML = on ? CTL.rest : CTL.max; if (w.def.onResize) w.def.onResize(); changed();
  }
  ui.winList = () => Object.keys(wins).map((id) => ({ id, title: ((ui.APPS[id] || {}).name || id), min: wins[id].el.classList.contains('min'), focus: wins[id].el.classList.contains('focus') }));
  ui.toggleTask = (id) => { const w = wins[id]; if (!w) return; if (w.el.classList.contains('min')) { w.el.classList.remove('min'); focus(id); changed(); } else if (w.el.classList.contains('focus')) minimize(id); else focus(id); };
  function refresh(id) {
    const w = wins[id]; if (!w || !w.def.render) return;
    const sc = Array.from(w.body.querySelectorAll('.keep-scroll')).map((e) => e.scrollTop);
    const ae = document.activeElement, fk = ae && w.body.contains(ae) && ae.dataset ? ae.dataset.fk : null, caret = fk && ae.selectionStart != null ? [ae.selectionStart, ae.selectionEnd] : null;
    w.def.render(w.body);
    Array.from(w.body.querySelectorAll('.keep-scroll')).forEach((e, i) => { if (sc[i]) e.scrollTop = sc[i]; });
    if (fk) { const ne = w.body.querySelector('[data-fk="' + fk + '"]'); if (ne) { ne.focus(); try { if (caret) ne.setSelectionRange(caret[0], caret[1]); } catch (e) { /* not a text field */ } } }
  }
  ui.refresh = refresh;
  ui.refreshAll = () => Object.keys(wins).forEach((id) => { if (!apps[id].static) refresh(id); });
  ui.isOpen = (id) => !!wins[id];
  ui.focusedId = () => Object.keys(wins).find((k) => wins[k].el.classList.contains('focus'));
  C.on('layout', () => { if (C.layout.compact) { const ids = Object.keys(wins); ids.slice(0, -1).forEach((k) => closeNow(k)); document.body.classList.toggle('app-open', ids.length > 0); changed(); } });

  let snapEl = null;
  function snapZone(e) { const dr = deskEl().getBoundingClientRect(); if (e.clientY - dr.top < 5) return 'max'; if (e.clientX - dr.left < 5) return 'l'; if (dr.right - e.clientX < 5) return 'r'; return null; }
  function startDrag(ev, id) {
    if (ev.target.closest('button') || C.layout.compact || ev.button > 0) return;
    const w = wins[id]; if (!w) return; focus(id);
    const el = w.el, desk = deskEl(), dr = desk.getBoundingClientRect(); let r = el.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top, moved = false;
    const mv = (e) => {
      if (!moved && Math.hypot(e.clientX - ev.clientX, e.clientY - ev.clientY) < 3) return; moved = true;
      if (el.classList.contains('max')) { // grab-to-restore
        const g = geom[id] || { w: 760, h: 520 }; el.classList.remove('max'); el.style.width = g.w + 'px'; el.style.height = g.h + 'px'; el.querySelector('.mx').innerHTML = CTL.max; dx = g.w * ((e.clientX - dr.left) / dr.width); dy = 16;
      }
      el.style.left = C.clamp(e.clientX - dr.left - dx, -el.offsetWidth + 120, dr.width - 80) + 'px'; el.style.top = C.clamp(e.clientY - dr.top - dy, 0, dr.height - 40) + 'px';
      const z = snapZone(e);
      if (z) { if (!snapEl) { snapEl = h('div', { class: 'snap-prev' }); desk.append(snapEl); } Object.assign(snapEl.style, z === 'max' ? { left: '4px', top: '4px', width: dr.width - 8 + 'px', height: dr.height - 8 + 'px' } : { left: (z === 'l' ? 4 : dr.width / 2 + 2) + 'px', top: '4px', width: dr.width / 2 - 6 + 'px', height: dr.height - 8 + 'px' }); }
      else if (snapEl) { snapEl.remove(); snapEl = null; }
    };
    const up = (e) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (snapEl) { snapEl.remove(); snapEl = null; }
      if (!moved) return;
      const z = snapZone(e);
      if (z) {
        const rr = el.getBoundingClientRect(); geom[id] = { x: rr.left - dr.left, y: rr.top - dr.top, w: rr.width, h: rr.height, max: false };
        if (z === 'max') { el.classList.add('max'); el.querySelector('.mx').innerHTML = CTL.rest; }
        else Object.assign(el.style, { left: (z === 'l' ? 0 : dr.width / 2) + 'px', top: '0px', width: dr.width / 2 + 'px', height: dr.height + 'px' });
        if (w.def.onResize) w.def.onResize();
      } else geom[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, max: false };
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  function startResize(ev, id, d) {
    if (C.layout.compact) return; const w = wins[id]; if (!w) return; ev.preventDefault(); ev.stopPropagation(); focus(id);
    const el = w.el, sx = ev.clientX, sy = ev.clientY, x0 = el.offsetLeft, y0 = el.offsetTop, w0 = el.offsetWidth, h0 = el.offsetHeight, MINW = 380, MINH = 260;
    const mv = (e) => {
      let x = x0, y = y0, ww = w0, hh = h0; const dx = e.clientX - sx, dy = e.clientY - sy;
      if (d.includes('e')) ww = Math.max(MINW, w0 + dx); if (d.includes('s')) hh = Math.max(MINH, h0 + dy);
      if (d.includes('w')) { ww = Math.max(MINW, w0 - dx); x = x0 + (w0 - ww); } if (d.includes('n')) { hh = Math.max(MINH, h0 - dy); y = Math.max(0, y0 + (h0 - hh)); hh = h0 + (y0 - y); }
      Object.assign(el.style, { left: x + 'px', top: y + 'px', width: ww + 'px', height: hh + 'px' }); if (w.def.onResize) w.def.onResize();
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); geom[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, max: false }; };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  let rq = 0;
  const sched = () => { if (rq) return; rq = requestAnimationFrame(() => { rq = 0; ui.refreshAll(); }); };
  C.on('state', sched); C.on('mail', sched);

  // ---------------------------------------------------------------- helpers
  ui.pips = (n, max, cls) => { const p = h('div', { class: 'pips ' + (cls || '') }); for (let i = 1; i <= max; i++) p.append(h('i', { class: i <= n ? 'on' : '' })); return p; };
  ui.bar = (frac, cls) => h('div', { class: 'bar ' + (cls || '') }, h('i', { style: { width: C.clamp(frac, 0, 1) * 100 + '%' } }));
  ui.row = (k, v, cls) => h('div', { class: 'kv' }, h('span', k), h('b', { class: cls || '' }, v));
})();
