/* CIPHER OS — app kit: the small set of real-app building blocks (toolbar, sidebar, tab bar, status bar, search, avatars, switches).
   Every desktop app is composed from these so they behave like one family of software with different personalities. */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h, ui = C.ui;
  const K = (ui.kit = {});
  const SVGNS = 'http://www.w3.org/2000/svg';

  // 24px stroke glyphs
  K.I = {
    inbox: '<path d="M3.5 13.5l2.4-7a2 2 0 011.9-1.4h8.4a2 2 0 011.9 1.4l2.4 7"/><path d="M3.5 13.5V18a1.5 1.5 0 001.5 1.5h14a1.5 1.5 0 001.5-1.5v-4.5h-5.2a3.3 3.3 0 01-6.6 0z"/>',
    star: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
    send: '<path d="M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V18a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 18V8.5M10 12.5h4"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.8 12a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.4l.8-12M10 11v6M14 11v6"/>',
    compose: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 00-3-3L5 17z"/><path d="M14.5 7.5l3 3"/>',
    reply: '<path d="M9.5 5L4 10.5 9.5 16M4 10.5h9a6.5 6.5 0 016.5 6.5v1.5"/>',
    mailopen: '<path d="M3.5 10l8.5-6 8.5 6v8.5a1.5 1.5 0 01-1.5 1.5h-14a1.5 1.5 0 01-1.5-1.5z"/><path d="M3.5 10l8.5 6 8.5-6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    refresh: '<path d="M20 12a8 8 0 11-2.6-5.9"/><path d="M20 4v5h-5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', chevR: '<path d="M9 5l7 7-7 7"/>', chevD: '<path d="M5 9l7 7 7-7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>', list: '<path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>',
    bolt: '<path d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12z"/>', clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.7 9.6a3.2 3.2 0 100 4.8M12 6.8v10.4"/>', target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
    user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.6-3.8 3.5-5.8 7.2-5.8s6.6 2 7.2 5.8"/>',
    users: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.5-3.3 2.8-5 5.5-5s5 1.7 5.5 5M16 6.3a3 3 0 010 5.6M17.5 14.3c1.7.6 2.8 2.3 3 4.7"/>',
    trophy: '<path d="M8 4.5h8v5a4 4 0 01-8 0zM8 6.5H4.5c0 3 1.3 4.5 3.5 4.7M16 6.5h3.5c0 3-1.3 4.5-3.5 4.7M12 13.5V17M8.5 20h7M10 17h4"/>',
    medal: '<circle cx="12" cy="14.5" r="5"/><path d="M8.5 10L6.5 3.5h4M15.5 10l2-6.5h-4"/>',
    chart: '<path d="M4.5 20V4M4.5 20H20M8.5 16v-4M12.5 16V8M16.5 16v-6"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/>',
    ram: '<rect x="3" y="7.5" width="18" height="8" rx="1.5"/><path d="M7 15.5V19M11 15.5V19M15 15.5V19M7 10.5v2M11 10.5v2M15 10.5v2M18.2 10.5v2"/>',
    disk: '<rect x="4" y="4.5" width="16" height="15" rx="2"/><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r=".6"/>',
    net: '<path d="M3 9.5a14 14 0 0118 0M6 13a9 9 0 0112 0M9 16.4a4.2 4.2 0 016 0"/><circle cx="12" cy="19.5" r=".8"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.7-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.8-7.5-9.5V6z"/>', proxy: '<circle cx="5.5" cy="12" r="2"/><circle cx="18.5" cy="12" r="2"/><circle cx="12" cy="5.5" r="2"/><path d="M7.4 11.2l3-4M16.6 11.2l-3-4M7.5 12h9"/>',
    download: '<path d="M12 4v11M7.5 11L12 15.5 16.5 11M5 19.5h14"/>', up: '<path d="M12 19V8M7.5 12.5L12 8l4.5 4.5M5 4.5h14"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.4"/>', vol: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4.5 4.5 0 010 6M18 6.5a8 8 0 010 11"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>', save: '<path d="M5 4.5h11l3.5 3.5V19a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V5a.5.5 0 01.5-.5z"/><path d="M8 4.5v4.5h7V4.5M8 19.5v-6h8v6"/>',
    key: '<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5L19 4M16 7l2.5 2.5"/>', keyboard: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17.5 10.5h.01M7.5 14h9"/>',
    bag: '<path d="M4.5 8.5h15l-1.2 11.5H5.7zM8.5 8.5V7a3.5 3.5 0 017 0v1.5"/>', tag: '<path d="M3.5 12.3V4.5a1 1 0 011-1h7.8l8.2 8.2a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0z"/><circle cx="8" cy="8" r="1.3"/>',
    box: '<path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4zM3.5 7.5L12 11.5l8.5-4M12 11.5v9"/>', cart: '<path d="M3 4.5h2.5l2 11h10.5l2-8H6.5"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
    cap: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.5v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5M21.5 9.5V15"/>', tree: '<circle cx="12" cy="5.5" r="2.2"/><circle cx="5.5" cy="18.5" r="2.2"/><circle cx="18.5" cy="18.5" r="2.2"/><path d="M12 7.7v5.3M12 13l-5 4M12 13l5 4"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4.5v5M6 14.5v5"/>', flame: '<path d="M12 3.5c.5 3.5 4.5 5 4.5 9.5a4.5 4.5 0 01-9 0c0-1.7.7-2.7 1.7-3.7.2 1.2.8 1.8 1.5 2 0-3 .3-5 1.3-7.8z"/>',
    layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5zM3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>', calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    sort: '<path d="M7 4.5v15M7 19.5L3.5 16M7 19.5L10.5 16M17 19.5v-15M17 4.5L13.5 8M17 4.5L20.5 8"/>', filter: '<path d="M4 5.5h16l-6 7.5v5.5l-4 1.5V13z"/>',
    terminal: '<path d="M6 8l4 4-4 4M12.5 16.5H18"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>', eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    wrench: '<path d="M14.5 6a4 4 0 005.2 5.2l-9 9a2.2 2.2 0 01-3.1-3.1l9-9A4 4 0 0014.5 6z"/>', power: '<path d="M12 3v8"/><path d="M6.5 6.8a8 8 0 1011 0"/>', pkg: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v6M9 11.5l3 3 3-3"/>',
    sparkle: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/>', copy: '<rect x="8" y="8" width="11.5" height="11.5" rx="2"/><path d="M15.5 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7.5a2 2 0 002 2h2"/>',
    fullscreen: '<path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15"/>', restoreIcon: '<path d="M4 12a8 8 0 018-8"/>',
  };

  K.svg = (path, cls) => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); if (cls) s.setAttribute('class', cls); s.innerHTML = K.I[path] || path || ''; return s; };
  K.nice = (s) => String(s == null ? '' : s);

  // deterministic, calm avatar colours
  const AV = ['#5b8def', '#e0765a', '#3fa58e', '#a07be0', '#d29a3a', '#d6648f', '#4eaabd', '#7e9a3d'];
  K.avColor = (name) => { let n = 0; String(name).split('').forEach((c) => { n = (n * 31 + c.charCodeAt(0)) >>> 0; }); return AV[n % AV.length]; };
  K.initials = (name) => { const p = String(name).replace(/[^A-Za-z0-9 ._-]/g, '').split(/[ ._-]+/).filter(Boolean); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0] || '')[1] || '')).toUpperCase(); };
  K.avatar = (name, size, color) => h('span', { class: 'a-av', style: { '--s': (size || 34) + 'px', background: color || K.avColor(name) } }, K.initials(name));

  // toolbar pieces
  K.tb = (label, icon, o) => {
    o = o || {};
    return h('button', { class: 'a-tb' + (o.pri ? ' pri' : '') + (o.on ? ' on' : '') + (label ? '' : ' ico') + (o.cls ? ' ' + o.cls : ''), title: o.title || label || '', disabled: o.disabled ? true : null, onclick: o.onclick },
      icon ? K.svg(icon) : null, label ? h('span', { class: o.hideLabelCompact ? 'only-wide' : '' }, label) : null);
  };
  K.tsep = () => h('i', { class: 'a-tsep' });
  K.sp = () => h('i', { class: 'sp' });
  K.toolbar = (...kids) => h('div', { class: 'a-tool' }, kids);
  K.search = (ph, value, oninput, fk) => {
    const inp = h('input', { type: 'text', placeholder: ph, value: value || '', 'data-fk': fk || 'q', spellcheck: 'false', autocomplete: 'off', oninput: (e) => oninput(e.target.value) });
    inp.addEventListener('keydown', (e) => e.stopPropagation());
    return h('label', { class: 'a-search' }, K.svg('search'), inp);
  };
  K.status = (...kids) => h('div', { class: 'a-status' }, kids.map((k) => (typeof k === 'string' ? h('span', k) : k)));
  K.chip = (t, cls) => h('span', { class: 'a-chip ' + (cls || '') }, t);
  K.bar = (frac, cls) => h('div', { class: 'a-bar ' + (cls || '') }, h('i', { style: { width: Math.round(C.clamp(frac, 0, 1) * 1000) / 10 + '%' } }));
  K.kv = (k, v, cls) => h('div', { class: 'a-kv' }, h('span', k), h('b', { class: cls || '' }, v));
  K.switch = (on, fn) => { const b = h('button', { class: 'a-switch' + (on ? ' on' : ''), role: 'switch', 'aria-checked': on ? 'true' : 'false', onclick: () => { on = !on; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); fn(on); } }); return b; };
  K.pips = (n, max) => { const p = h('div', { class: 'rg-pip' }); for (let i = 1; i <= max; i++) p.append(h('i', { class: i <= n ? 'on' : '' })); return p; };
  K.empty = (icon, title, sub) => h('div', { class: 'a-empty' }, K.svg(icon), h('b', title), sub ? h('span', sub) : null);

  // side navigation. items: {h:'Header'} | {id,icon,label,count,dot,on,fn}
  K.side = (items) => h('nav', { class: 'a-side' }, items.map((it) => it.h ? h('h6', it.h) : h('button', { class: 'a-si' + (it.on ? ' on' : ''), onclick: () => { C.audio.sfx('click'); it.fn(); } },
    it.dot ? h('i', { class: 'dot', style: { background: it.dot } }) : K.svg(it.icon), h('span', { class: 'slb' }, it.label), it.count != null && it.count !== '' ? h('span', { class: 'ct' }, it.count) : null)));
  // bottom tab bar (phone only, shown via CSS)
  K.tabbar = (items) => h('nav', { class: 'a-tabbar' }, items.map((it) => h('button', { class: it.on ? 'on' : '', onclick: () => { C.audio.sfx('click'); it.fn(); } }, K.svg(it.icon), h('span', it.label), it.count ? h('i', { class: 'ct' }, it.count) : null)));
  K.root = (...kids) => h('div', { class: 'a-root' }, kids);
  K.cols = (cls, ...kids) => h('div', { class: 'a-cols ' + (cls || '') }, kids);
  K.main = (...kids) => h('div', { class: 'a-main' }, kids);
  K.scroll = (cls, ...kids) => h('div', { class: 'a-scroll keep-scroll ' + (cls || '') }, kids);
  K.page = (...kids) => K.scroll('', ...kids);
  K.sel = (opts, value, fn, cls) => h('select', { class: cls || '', onchange: (e) => fn(e.target.value) }, opts.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) ? true : null }, l)));

  // sortable table helper: cols [{k,label,cls,hc,num}], rows [{id,cells:[node...],cls}]
  K.table = (cols, rows, o) => {
    o = o || {};
    return h('table', { class: 'a-tbl' }, h('thead', h('tr', cols.map((c) => h('th', { class: (c.hc ? 'hc ' : '') + (c.num ? 'num ' : '') + (o.sort === c.k ? 'sort' : ''), onclick: c.k && o.onSort ? () => o.onSort(c.k) : null }, c.label, o.sort === c.k ? h('span', { style: { marginLeft: '4px', color: 'var(--c)' } }, o.dir < 0 ? '▾' : '▴') : null)))),
      h('tbody', rows.map((r) => h('tr', { class: 'trow' + (r.sel ? ' sel' : '') + (r.lock ? ' lock' : ''), onclick: r.fn }, r.cells.map((c, i) => h('td', { class: (cols[i] && cols[i].hc ? 'hc ' : '') + (cols[i] && cols[i].num ? 'num ' : '') + (cols[i] && cols[i].wrap ? 'wrap' : '') }, c))))));
  };
})();
