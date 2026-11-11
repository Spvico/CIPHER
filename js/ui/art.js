/* CIPHER OS — artwork: application icons (hand-built layered SVG) and wallpapers (painted once on a canvas). */
(function () {
  'use strict';
  const C = window.CIPHER, h = C.h, ui = C.ui;

  // ------------------------------------------------------------------ app icons
  function gear(cx, cy, r1, r2, teeth, w1, w2) {
    const P = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
    const step = 360 / teeth; w1 = w1 || 0.30; w2 = w2 || 0.17;
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const a = i * step, pts = [P(r1, a - step * w1), P(r2, a - step * w2), P(r2, a + step * w2), P(r1, a + step * w1)];
      pts.forEach((p, j) => { d += (i === 0 && j === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); });
    }
    return d + 'Z';
  }
  const lg = (id, c, x2, y2) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 === undefined ? 0 : x2}" y2="${y2 === undefined ? 1 : y2}">${c.map((s, i) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;
  const rg = (id, c, cx, cy, r) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${c.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`;

  // each icon: base gradient (3 stops) and a function that returns { defs, body } for a unique id prefix k
  const ART = {
    contracts: {
      g: ['#6eaaff', '#2f65d6', '#1a3f9e'],
      art: (k) => ({
        defs: lg(k + 'a', [[0, '#9a6a3f'], [1, '#5c3a1c']]) + lg(k + 'b', [[0, '#ffffff'], [1, '#e2e8f3']]) + lg(k + 'c', [[0, '#fafbfd'], [0.5, '#c4ccda'], [1, '#8c96a8']]) + lg(k + 'd', [[0, '#ff7a68'], [1, '#c1271b']]) +
          `<clipPath id="${k}p"><rect x="18" y="15" width="28" height="38" rx="2"/></clipPath>`,
        body: `<rect x="12.5" y="8.5" width="39" height="48" rx="5" fill="url(#${k}a)"/><rect x="12.5" y="8.5" width="39" height="48" rx="5" fill="none" stroke="#2c1708" stroke-opacity=".5" stroke-width=".8"/>` +
          `<rect x="18" y="15" width="28" height="38" rx="2" fill="url(#${k}b)"/>` +
          `<g clip-path="url(#${k}p)"><path d="M18 15h28v3H18z" fill="#fff" opacity=".6"/></g>` +
          `<path d="M21.5 23.5h13" stroke="#2f5fc0" stroke-width="2.6" stroke-linecap="round"/><path d="M38 23.5h5" stroke="#b5c0d6" stroke-width="2.6" stroke-linecap="round"/>` +
          `<g fill="none" stroke="#9aa7c0" stroke-width="1"><rect x="21" y="29" width="5" height="5" rx="1"/><rect x="21" y="37" width="5" height="5" rx="1"/></g>` +
          `<g fill="none" stroke="#25a060" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21.8 31.6l1.7 1.8 3.6-4.2"/><path d="M21.8 39.6l1.7 1.8 3.6-4.2"/></g>` +
          `<g stroke="#b3bed3" stroke-width="2.2" stroke-linecap="round"><path d="M30 31.5h12M30 39.5h9"/></g>` +
          `<path d="M21 48c1.7-3.6 3-3.8 3.6-.4s1.8 2.7 3-.9 2.2 1.8 3.4.2" fill="none" stroke="#2f5fc0" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 51h17" stroke="#c4cddd" stroke-width="1"/>` +
          // clip
          `<path d="M24.5 12.5c0-2.2 1.3-3.6 3.2-3.6h8.6c1.9 0 3.2 1.4 3.2 3.6v4.2H24.5z" fill="url(#${k}c)" stroke="#6b7586" stroke-width=".8"/><rect x="28" y="11" width="8" height="3.2" rx="1.6" fill="#59627a" opacity=".85"/><path d="M25.5 12.4h13" stroke="#fff" stroke-opacity=".7" stroke-width=".8"/>` +
          // seal
          `<path d="M39.5 51.5l-3.4 9 4.6-2 2 4.4 2.4-9.6z" fill="#b1241a"/><path d="M47.5 51.5l3.6 9-4.6-2-2 4.4-2.6-9.4z" fill="#d23a2c"/>` +
          `<path d="${gear(44, 47, 7.2, 9.4, 12, 0.34, 0.2)}" fill="url(#${k}d)" stroke="#8d1a11" stroke-width=".7"/><circle cx="44" cy="47" r="6" fill="none" stroke="#ffd0c8" stroke-opacity=".7" stroke-width=".9"/><path d="M41 47.2l2.2 2.3 4-4.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      }),
    },
    mail: {
      g: ['#ff9370', '#e4482d', '#b0281a'],
      art: (k) => ({
        defs: lg(k + 'a', [[0, '#dfe4ef'], [1, '#b9c1d3']]) + lg(k + 'b', [[0, '#ffffff'], [1, '#e9edf5']]) + lg(k + 'c', [[0, '#ffffff'], [1, '#d6dce9']]) + lg(k + 'd', [[0, '#f3f5fa'], [1, '#c5ccdc']]),
        body: `<path d="M9 21L32 3.5 55 21z" fill="url(#${k}a)" stroke="#aab3c7" stroke-width=".7" stroke-linejoin="round"/><rect x="9" y="19" width="46" height="31" rx="4.5" fill="#c6cddd"/>` +
          `<rect x="14.5" y="9" width="35" height="29" rx="2" fill="url(#${k}b)" stroke="#d3d9e6" stroke-width=".7"/>` +
          `<g stroke-linecap="round" stroke-width="2"><path d="M19 15.5h14" stroke="#3b4a6b"/><path d="M19 20.5h24M19 25h20M19 29.5h16" stroke="#b7c0d4"/></g><rect x="40" y="12.5" width="6" height="7" rx="1" fill="none" stroke="#e2573d" stroke-width="1.3" stroke-dasharray="1.3 1"/>` +
          `<path d="M9 23L32 41 55 23V45.5a4.5 4.5 0 01-4.5 4.5h-37A4.5 4.5 0 019 45.5z" fill="url(#${k}c)"/>` +
          `<path d="M9 49.4L26 35.6M55 49.4L38 35.6" stroke="#c9d0df" stroke-width="1" stroke-linecap="round" fill="none"/>` +
          `<path d="M9.4 23.4L32 41 54.6 23.4" fill="none" stroke="#a5aec3" stroke-width="1.1" stroke-linejoin="round"/><path d="M10 24.6L32 42 54 24.6" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width=".9"/>`,
      }),
    },
    terminal: {
      g: ['#3c424a', '#181b1f'],
      art: () => ({ defs: '', body: '<rect x="9" y="12" width="46" height="40" rx="6.5" fill="#0a0c0b" stroke="#454d48" stroke-width="1.5"/><path d="M9.7 21h44.6" stroke="#2c332f" stroke-width="1.5"/><circle cx="15.5" cy="16.6" r="1.9" fill="#ff6b61"/><circle cx="21.5" cy="16.6" r="1.9" fill="#f7c24f"/><circle cx="27.5" cy="16.6" r="1.9" fill="#4fd06b"/><path d="M17 30l7.5 5.5-7.5 5.5" fill="none" stroke="#5ad17d" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 42.5h12" stroke="#5ad17d" stroke-width="3.4" stroke-linecap="round"/>' }),
    },
    rig: {
      g: ['#aa9cff', '#5f4dd6', '#33248f'],
      art: (k) => ({
        defs: lg(k + 'a', [[0, '#fff3bd'], [0.5, '#e0b24f'], [1, '#a97a24']], 1, 0) + lg(k + 'b', [[0, '#646b8a'], [1, '#232740']]) + lg(k + 'c', [[0, '#eef0fa'], [1, '#9ba3c0']]) + lg(k + 'd', [[0, '#2a3050'], [1, '#0f1224']]) + lg(k + 'e', [[0, '#8bf6ff'], [1, '#3f8cff']]) +
          lg(k + 'f', [[0, '#fff3bd'], [0.5, '#e0b24f'], [1, '#a97a24']]),
        body: `<g fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h7l3 3h5M3 50h8l3-3h4M61 14h-7l-3 3h-5M61 50h-8l-3-3h-4M14 3v7l3 3M50 3v7l-3 3M14 61v-7l3-3M50 61v-7l-3-3"/></g><g fill="#fff" fill-opacity=".22"><circle cx="3" cy="14" r="1.2"/><circle cx="3" cy="50" r="1.2"/><circle cx="61" cy="14" r="1.2"/><circle cx="61" cy="50" r="1.2"/></g>` +
          `<g fill="url(#${k}f)" stroke="#6e4f12" stroke-opacity=".55" stroke-width=".5">` + [22, 28.5, 35, 41.5].map((x) => `<rect x="${x - 1.5}" y="8" width="3" height="8" rx="1"/><rect x="${x - 1.5}" y="48" width="3" height="8" rx="1"/>`).join('') + '</g>' +
          `<g fill="url(#${k}a)" stroke="#6e4f12" stroke-opacity=".55" stroke-width=".5">` + [22, 28.5, 35, 41.5].map((y) => `<rect x="8" y="${y - 1.5}" width="8" height="3" rx="1"/><rect x="48" y="${y - 1.5}" width="8" height="3" rx="1"/>`).join('') + '</g>' +
          `<rect x="14.5" y="14.5" width="35" height="35" rx="5.5" fill="url(#${k}b)" stroke="#9ba2c4" stroke-opacity=".8" stroke-width=".8"/>` +
          `<rect x="19" y="19" width="26" height="26" rx="3.2" fill="url(#${k}c)" stroke="#fff" stroke-opacity=".7" stroke-width=".8"/><rect x="19.4" y="19.4" width="25.2" height="25.2" rx="3" fill="none" stroke="#6c7494" stroke-opacity=".45" stroke-width=".7"/>` +
          `<rect x="24.5" y="24.5" width="15" height="15" rx="2" fill="url(#${k}d)" stroke="#4a5280" stroke-width=".8"/><rect x="27" y="27" width="10" height="10" rx="1.2" fill="url(#${k}e)"/><path d="M29.7 27v10M32 27v10M34.3 27v10M27 29.7h10M27 32h10M27 34.3h10" stroke="#0c1a3a" stroke-opacity=".35" stroke-width=".45"/>` +
          `<path d="M17.2 22.6l0-3.4a2 2 0 012-2h3.4z" fill="#f0c35a" transform="translate(0 0)"/><path d="M21 21.2h4.5M21 24h2.5" stroke="#6c7494" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round"/>`,
      }),
    },
    market: {
      g: ['#52e4cb', '#1ba592', '#0a5d62'],
      art: (k) => ({
        defs: lg(k + 'a', [[0, '#ffffff'], [1, '#cfe2e2']]) + lg(k + 'b', [[0, '#eef5f5'], [1, '#bcd0d0']]) + rg(k + 'c', [[0, '#fff3ae'], [0.55, '#f2b82e'], [1, '#b87610']], 0.35, 0.3, 0.9) + lg(k + 'd', [[0, '#ffe58a'], [1, '#c4830f']]),
        body: `<path d="M16 25.5h32l3 27.2a3.4 3.4 0 01-3.4 3.8H16.4a3.4 3.4 0 01-3.4-3.8z" fill="url(#${k}a)" stroke="#8fb0b0" stroke-width=".7" stroke-linejoin="round"/>` +
          `<path d="M16 25.5h32l.5 4.4h-33z" fill="url(#${k}b)"/><path d="M15.5 29.9h33" stroke="#9ab9b9" stroke-width=".7"/><path d="M13.4 53.2l3.4-.4" stroke="#fff" stroke-opacity="0"/>` +
          `<path d="M22 27.5v-4.5a10 10 0 0120 0v4.5" fill="none" stroke="#0b5559" stroke-width="3.5" stroke-linecap="round"/><path d="M22 27.5v-4.5a10 10 0 0120 0v4.5" fill="none" stroke="#f1dfa8" stroke-width="2.4" stroke-linecap="round"/><path d="M22 27.5v-4.5a10 10 0 0120 0v4.5" fill="none" stroke="#b79a52" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1.1 1.3" opacity=".7"/>` +
          `<circle cx="22" cy="27.6" r="1.6" fill="#0b5559"/><circle cx="42" cy="27.6" r="1.6" fill="#0b5559"/>` +
          `<rect x="18.5" y="40" width="14" height="9.5" rx="1.8" fill="#1ba592" opacity=".92"/><path d="M21 43.6h9M21 46.4h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="19.9" cy="41.5" r=".8" fill="#fff" opacity=".8"/>` +
          `<circle cx="44" cy="45" r="12" fill="url(#${k}c)" stroke="#9a620a" stroke-width=".9"/><circle cx="44" cy="45" r="9.6" fill="none" stroke="#b5760f" stroke-width="1"/><circle cx="44" cy="45" r="10.6" fill="none" stroke="#fff3b0" stroke-opacity=".75" stroke-width=".7"/>` +
          `<path d="M44 38.6l5.6 3.2v6.4L44 51.4l-5.6-3.2v-6.4z" fill="none" stroke="#a5680a" stroke-width="1.7" stroke-linejoin="round"/><path d="M44 42.4l2.4 1.4v2.8L44 48l-2.4-1.4v-2.8z" fill="#a5680a"/><path d="M36.4 38a10 10 0 015.6-5" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/>`,
      }),
    },
    skills: {
      g: ['#72e68f', '#2ea858', '#156d37'],
      art: (k) => ({
        defs: lg(k + 'a', [[0, '#465064'], [1, '#161b26']]) + lg(k + 'b', [[0, '#363f50'], [1, '#0d1118']], 1, 0) + lg(k + 'c', [[0, '#ffeeb0'], [1, '#d99f19']]) + lg(k + 'd', [[0, '#ffe9a0'], [1, '#c98f12']], 1, 0),
        body: `<path d="M16 31.5v10.2c0 5 7 8.8 16 8.8s16-3.8 16-8.8V31.5L32 38z" fill="url(#${k}b)" stroke="#0b0f15" stroke-opacity=".5" stroke-width=".7" stroke-linejoin="round"/><path d="M17.4 42.5c3.4 3.4 9 5 14.6 5s11.2-1.6 14.6-5" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1"/>` +
          `<path d="M32 11.5L59 24.5 32 37.5 5 24.5z" fill="url(#${k}a)" stroke="#0b0f15" stroke-opacity=".55" stroke-width=".8" stroke-linejoin="round"/><path d="M32 12.6L57 24.4M32 12.6L7 24.4" fill="none" stroke="#9aa8c4" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/><path d="M32 37L10.4 26.6" stroke="#fff" stroke-opacity=".1" stroke-width="1"/>` +
          `<path d="M32 24.5L50.5 30.4V45" fill="none" stroke="#9c6a0f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 24.5L50.5 30.4V45" fill="none" stroke="url(#${k}d)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
          `<path d="M48.2 44.5h4.6l1.2 9h-7z" fill="url(#${k}c)" stroke="#9c6a0f" stroke-width=".6" stroke-linejoin="round"/><path d="M49.2 47v6.4M50.5 47v6.4M51.8 47v6.4" stroke="#9c6a0f" stroke-opacity=".55" stroke-width=".5"/><circle cx="50.5" cy="44.6" r="1.7" fill="url(#${k}c)" stroke="#9c6a0f" stroke-width=".5"/>` +
          `<circle cx="32" cy="24.5" r="2.6" fill="url(#${k}c)" stroke="#9c6a0f" stroke-width=".6"/>`,
      }),
    },
    profile: {
      g: ['#ffd480', '#f29b27', '#b25a0a'],
      art: (k) => ({
        defs: lg(k + 'a', [[0, '#ffffff'], [1, '#dde3ef']]) + lg(k + 'b', [[0, '#86bbff'], [1, '#3868d4']]) + lg(k + 'c', [[0, '#ffe08a'], [1, '#c98a14']], 1, 1) + lg(k + 'd', [[0, '#ffb04a'], [1, '#e8730f']], 1, 0) + `<clipPath id="${k}p"><rect x="19" y="21.5" width="14.5" height="17.5" rx="2"/></clipPath><clipPath id="${k}q"><rect x="13" y="8" width="38" height="48" rx="4.2"/></clipPath>`,
        body: `<g transform="rotate(-5 32 32)"><rect x="13" y="8" width="38" height="48" rx="4.2" fill="url(#${k}a)" stroke="#a8b0c2" stroke-width=".7"/>` +
          `<g clip-path="url(#${k}q)"><rect x="13" y="50" width="38" height="6" fill="url(#${k}d)"/><rect x="13" y="8" width="38" height="10" fill="#cdd5e6" opacity=".55"/></g>` +
          `<rect x="26" y="10.8" width="12" height="3.8" rx="1.9" fill="#8b94aa"/><rect x="26.6" y="11.3" width="10.8" height="2.8" rx="1.4" fill="#4a5268"/>` +
          `<rect x="19" y="21.5" width="14.5" height="17.5" rx="2" fill="url(#${k}b)"/><g clip-path="url(#${k}p)"><circle cx="26.2" cy="28.4" r="3.8" fill="#eef4ff"/><path d="M18 40c0-6 3.4-8.6 8.2-8.6s8.2 2.6 8.2 8.6z" fill="#eef4ff"/><path d="M19 21.5h14.5v4H19z" fill="#fff" opacity=".18"/></g><rect x="19" y="21.5" width="14.5" height="17.5" rx="2" fill="none" stroke="#2d55b4" stroke-opacity=".5" stroke-width=".7"/>` +
          `<g stroke-linecap="round" stroke-width="2.1"><path d="M36.5 24h8" stroke="#2c3858"/><path d="M36.5 28.5h6M36.5 33h8" stroke="#b6c0d6"/></g>` +
          `<rect x="37" y="35.2" width="7.6" height="5.4" rx="1.2" fill="url(#${k}c)" stroke="#9a6a0e" stroke-width=".5"/><path d="M37 38h7.6M40.8 35.2v5.4" stroke="#9a6a0e" stroke-opacity=".6" stroke-width=".5"/>` +
          `<path d="M19 43.5h26" stroke="#9aa5be" stroke-width="1.6" stroke-linecap="round"/><path d="M19 47h25" stroke="#2a3350" stroke-width="3.6" stroke-dasharray="1 .8 2.2 1 .8 .7 1.6 .9 1 1.4 2 .8 1 .7 1.8 1 .8 .9 1.4 .8 1.2 1 .6 .6"/></g>`,
      }),
    },
    settings: {
      g: ['#b5bdc9', '#69727f', '#363d49'],
      art: (k) => ({
        defs: lg(k + 'a', [[0, '#ffffff'], [0.45, '#bdc4cf'], [1, '#6f7889']], 1, 1) + lg(k + 'b', [[0, '#f4f6fa'], [1, '#a2abba']]) + lg(k + 'c', [[0, '#1d2128'], [1, '#434b58']]) + rg(k + 'd', [[0, '#ffffff', 0.6], [1, '#ffffff', 0]], 0.3, 0.25, 0.7),
        body: `<path d="${gear(32, 32, 17.6, 23.6, 10, 0.31, 0.15)}" fill="url(#${k}a)" stroke="#434b59" stroke-opacity=".7" stroke-width=".9" stroke-linejoin="round"/>` +
          `<circle cx="32" cy="32" r="16.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9"/><circle cx="32" cy="32" r="14.4" fill="url(#${k}b)" stroke="#7d8696" stroke-width=".8"/><circle cx="32" cy="32" r="14.4" fill="url(#${k}d)"/>` +
          `<g fill="#4c5565" stroke="#fff" stroke-opacity=".55" stroke-width=".5">` + [0, 90, 180, 270].map((a) => `<circle cx="${(32 + 9.9 * Math.cos((a + 45) * Math.PI / 180)).toFixed(2)}" cy="${(32 + 9.9 * Math.sin((a + 45) * Math.PI / 180)).toFixed(2)}" r="1.5"/>`).join('') + '</g>' +
          `<circle cx="32" cy="32" r="6.4" fill="url(#${k}c)" stroke="#6a7384" stroke-width="1"/><circle cx="32" cy="32" r="6.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".6" stroke-dasharray="0 21 19.2"/>`,
      }),
    },
  };
  let gid = 0;
  ui.ART = ART;
  ui.appIcon = (id, size) => {
    const a = ART[id] || { g: ['#777', '#444'], art: () => ({ defs: '', body: '' }) }, wrap = h('span', { class: 'appico' }), k = 'ag' + (++gid) + '_', art = a.art(k), g = a.g;
    if (size) wrap.style.setProperty('--s', size + 'px');
    const stops = g.length === 3 ? `<stop offset="0" stop-color="${g[0]}"/><stop offset=".55" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/>` : `<stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/>`;
    wrap.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs>` +
      `<linearGradient id="${k}bg" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>` +
      `<linearGradient id="${k}hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${k}lo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>` +
      `<radialGradient id="${k}gl" cx=".5" cy="1.1" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      `<filter id="${k}sh" x="-25%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.25" flood-color="#000" flood-opacity=".42"/></filter>${art.defs}</defs>` +
      `<rect width="64" height="64" rx="14.5" fill="url(#${k}bg)"/><rect width="64" height="64" rx="14.5" fill="url(#${k}gl)"/><rect width="64" height="64" rx="14.5" fill="url(#${k}lo)"/>` +
      `<path d="M0 29V14.5A14.5 14.5 0 0114.5 0h35A14.5 14.5 0 0164 14.5V29c-10 4.800-22 6.500-32 6.500S10 33.800 0 29z" fill="url(#${k}hi)"/>` +
      (id === 'terminal' ? art.body : `<g filter="url(#${k}sh)">${art.body}</g>`) +
      `<rect x=".5" y=".5" width="63" height="63" rx="14" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1"/><rect x="1.3" y="1.3" width="61.4" height="61.4" rx="13.4" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".9"/></svg>`;
    return wrap;
  };

  // ------------------------------------------------------------------ wallpapers
  ui.WALLS = ['Silk', 'Aurora', 'Night city', 'Dusk ridge'];
  const rng = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  function grain(ctx, W, H, amt) {
    const t = document.createElement('canvas'); t.width = t.height = 160; const tc = t.getContext('2d'), id = tc.createImageData(160, 160), r = rng(5);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255 | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = r() * amt | 0; }
    tc.putImageData(id, 0, 0); ctx.fillStyle = ctx.createPattern(t, 'repeat'); ctx.fillRect(0, 0, W, H);
  }
  function blob(ctx, x, y, r, rgb, a0, sy) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, sy || 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${rgb},${a0})`); g.addColorStop(0.5, `rgba(${rgb},${a0 * 0.4})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  // a silk ribbon: a wavy band whose two edges follow different phases, shaded across its width
  function ribbon(ctx, W, H, o) {
    const n = 90, top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = -W * 0.1 + u * W * 1.2, ph = u * 6.2832;
      const c = o.y * H + o.amp * H * (Math.sin(ph * o.f1 + o.p1) + 0.55 * Math.sin(ph * o.f2 + o.p2)) + o.tilt * H * (u - 0.5);
      const th = o.th * H * (0.55 + 0.45 * Math.sin(ph * o.f3 + o.p3));
      top.push([x, c - th]); bot.push([x, c + th]);
    }
    ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); for (let i = n; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath();
    ctx.save(); ctx.clip();
    const step = 2, yAt = (arr, x) => { const f = (x + W * 0.1) / (W * 1.2) * n, i = Math.max(0, Math.min(n - 1, Math.floor(f))), t = f - i; return arr[i][1] * (1 - t) + arr[i + 1][1] * t; };
    for (let x = 0; x < W; x += step) {
      const yt = yAt(top, x + step / 2), yb = yAt(bot, x + step / 2), gx = ctx.createLinearGradient(0, yt, 0, yb);
      gx.addColorStop(0, `rgba(${o.c0},${o.a * 0.12})`); gx.addColorStop(0.3, `rgba(${o.c1},${o.a})`); gx.addColorStop(0.72, `rgba(${o.c2},${o.a * 0.7})`); gx.addColorStop(1, `rgba(${o.c2},0)`);
      ctx.fillStyle = gx; ctx.fillRect(x, yt - 1, step, yb - yt + 2);
    }
    ctx.restore();
    ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.strokeStyle = `rgba(${o.c3},${Math.min(1, o.a * 0.9)})`; ctx.lineWidth = Math.max(1, H * 0.0018); ctx.stroke();
  }
  function stars(ctx, W, H, r, n, lim) {
    for (let i = 0; i < n; i++) { const big = r() < 0.08; ctx.fillStyle = `rgba(225,238,255,${0.2 + r() * 0.7})`; const s = big ? 2 : 1; ctx.fillRect(r() * W, r() * H * lim, s, s); }
  }
  ui.paintWall = function (cv, kind, sz) {
    const IW = sz ? sz.w : window.innerWidth, IH = sz ? sz.h : window.innerHeight;
    const dpr = sz ? 1 : Math.min(2, window.devicePixelRatio || 1), k = Math.min(dpr, 1500 / Math.max(1, IW)), W = cv.width = Math.max(2, Math.round(IW * k)), H = cv.height = Math.max(2, Math.round(IH * k)), ctx = cv.getContext('2d'), r = rng(11 + kind * 17), S = Math.max(W, H);
    if (kind === 0) { // silk — deep indigo field with glowing magenta / violet / cyan ribbons
      const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0a0a2e'); bg.addColorStop(0.5, '#1c0c4a'); bg.addColorStop(1, '#0a1240'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';
      blob(ctx, W * 0.82, H * 0.12, S * 0.55, '36,170,255', 0.62, 0.85);
      blob(ctx, W * 0.18, H * 0.95, S * 0.62, '236,50,150', 0.66, 0.8);
      blob(ctx, W * 0.55, H * 0.55, S * 0.5, '112,64,255', 0.5, 0.7);
      blob(ctx, W * 0.98, H * 0.98, S * 0.36, '255,120,64', 0.5, 0.8);
      const rb = [
        { y: 0.60, amp: 0.10, f1: 0.8, f2: 1.9, f3: 1.3, p1: 0.4, p2: 1.2, p3: 0.5, tilt: -0.28, th: 0.11, c0: '90,50,255', c1: '150,90,255', c2: '236,60,160', c3: '255,170,235', a: 0.7 },
        { y: 0.68, amp: 0.09, f1: 0.9, f2: 2.2, f3: 1.1, p1: 1.6, p2: 0.2, p3: 2.1, tilt: -0.22, th: 0.09, c0: '40,150,255', c1: '60,190,255', c2: '110,80,255', c3: '170,235,255', a: 0.62 },
        { y: 0.50, amp: 0.08, f1: 1.0, f2: 2.4, f3: 0.9, p1: 2.7, p2: 3.1, p3: 1.2, tilt: -0.3, th: 0.07, c0: '255,90,150', c1: '255,120,120', c2: '255,150,70', c3: '255,210,190', a: 0.5 },
        { y: 0.78, amp: 0.07, f1: 0.8, f2: 2.0, f3: 1.4, p1: 3.6, p2: 0.9, p3: 3.4, tilt: -0.18, th: 0.08, c0: '70,60,230', c1: '100,100,255', c2: '60,200,230', c3: '190,210,255', a: 0.5 },
        { y: 0.40, amp: 0.06, f1: 1.1, f2: 2.6, f3: 1.0, p1: 4.4, p2: 1.7, p3: 0.2, tilt: -0.26, th: 0.05, c0: '120,80,255', c1: '170,110,255', c2: '220,80,200', c3: '235,200,255', a: 0.42 },
      ];
      rb.forEach((o) => ribbon(ctx, W, H, o));
      ctx.globalCompositeOperation = 'source-over';
      const dk = ctx.createLinearGradient(0, 0, W * 0.5, 0); dk.addColorStop(0, 'rgba(4,4,22,.42)'); dk.addColorStop(1, 'rgba(4,4,22,0)'); ctx.fillStyle = dk; ctx.fillRect(0, 0, W, H);
      const v = ctx.createRadialGradient(W / 2, H / 2, S * 0.3, W / 2, H / 2, S * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,10,.42)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    } else if (kind === 1) { // aurora over a lake
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#03060f'); bg.addColorStop(0.55, '#0a1a2c'); bg.addColorStop(0.78, '#0e2a34'); bg.addColorStop(1, '#06141a'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      stars(ctx, W, H, r, 260, 0.62);
      ctx.globalCompositeOperation = 'screen';
      const cols = [[70, 255, 170], [40, 190, 255], [170, 90, 255], [255, 80, 190]];
      for (let b = 0; b < 4; b++) {
        const [cr, cg, cb] = cols[b], base = H * (0.24 + b * 0.075), p1 = r() * 6, p2 = r() * 6, amp = H * (0.07 + r() * 0.05);
        for (let x = 0; x < W; x += 2) {
          const u = x / W * 6.2832, y = base + amp * (Math.sin(u * 0.8 + p1) + 0.5 * Math.sin(u * 2.1 + p2)), len = H * (0.26 + 0.14 * Math.sin(u * 3 + p2 * 2)), a0 = 0.34 - b * 0.05;
          const g = ctx.createLinearGradient(0, y - len, 0, y + len * 0.25); g.addColorStop(0, `rgba(${cr},${cg},${cb},0)`); g.addColorStop(0.72, `rgba(${cr},${cg},${cb},${a0})`); g.addColorStop(0.86, `rgba(${cr},${cg},${cb},${a0 * 1.25})`); g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`); ctx.fillStyle = g; ctx.fillRect(x, y - len, 2, len * 1.25);
        }
      }
      // lake reflection of the glow
      const lk = ctx.createLinearGradient(0, H * 0.78, 0, H); lk.addColorStop(0, 'rgba(60,230,170,.22)'); lk.addColorStop(1, 'rgba(60,140,230,.04)'); ctx.fillStyle = lk; ctx.fillRect(0, H * 0.78, W, H * 0.22);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#04090d'; ctx.beginPath(); ctx.moveTo(0, H * 0.8);
      for (let x = 0; x <= W; x += 6) { const u = x / W * 6.2832; ctx.lineTo(x, H * 0.77 - H * 0.05 * (Math.sin(u * 1.7 + 1) + 0.6 * Math.sin(u * 4.3 + 2) + 0.3 * Math.sin(u * 9 + 4))); }
      ctx.lineTo(W, H * 0.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#071820'; ctx.fillRect(0, H * 0.8, W, H * 0.2);
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 40; i++) { const y = H * (0.81 + r() * 0.18), x = r() * W; ctx.fillStyle = `rgba(110,240,200,${0.04 + r() * 0.08})`; ctx.fillRect(x, y, S * (0.02 + r() * 0.07), 1.2); }
      ctx.globalCompositeOperation = 'source-over';
    } else if (kind === 2) { // night city — haze, three skyline layers, lit windows
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#080a24'); sky.addColorStop(0.45, '#2a1450'); sky.addColorStop(0.72, '#a02f6e'); sky.addColorStop(0.9, '#f0764f'); sky.addColorStop(1, '#ffb066'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      stars(ctx, W, H, r, 90, 0.4);
      ctx.globalCompositeOperation = 'screen'; blob(ctx, W * 0.7, H * 0.78, S * 0.5, '255,150,110', 0.4, 0.6); ctx.globalCompositeOperation = 'source-over';
      const layers = [
        { base: 0.80, hmin: 0.10, hmax: 0.34, wmin: 0.025, wmax: 0.055, col: ['#3a2554', '#2a1b44'], win: 0.0, hz: 0.18 },
        { base: 0.86, hmin: 0.10, hmax: 0.40, wmin: 0.03, wmax: 0.065, col: ['#231a45', '#171236'], win: 0.5, hz: 0.1 },
        { base: 1.0, hmin: 0.12, hmax: 0.52, wmin: 0.035, wmax: 0.08, col: ['#120e2c', '#0a0720'], win: 1, hz: 0 },
      ];
      layers.forEach((L, li) => {
        let x = -S * 0.01;
        while (x < W) {
          const bw = S * (L.wmin + r() * (L.wmax - L.wmin)), bh = H * (L.hmin + Math.pow(r(), 1.6) * (L.hmax - L.hmin)), top = H * L.base - bh;
          const g = ctx.createLinearGradient(0, top, 0, H * L.base); g.addColorStop(0, L.col[0]); g.addColorStop(1, L.col[1]); ctx.fillStyle = g; ctx.fillRect(x, top, bw + 1, H - top);
          if (r() < 0.3) { ctx.fillRect(x + bw * 0.4, top - H * 0.04, 2, H * 0.04); if (li > 0) { ctx.fillStyle = 'rgba(255,70,70,.9)'; ctx.fillRect(x + bw * 0.4 - 1, top - H * 0.04 - 2, 4, 3); } }
          if (L.win > 0) {
            const cw = Math.max(2, S * 0.0045), gap = cw * 2.3;
            for (let yy = top + gap; yy < H * L.base - gap * 0.5; yy += gap) for (let xx = x + gap * 0.6; xx < x + bw - cw; xx += gap) {
              if (r() < 0.34 * L.win) { const t = r(); ctx.fillStyle = t < 0.6 ? `rgba(255,214,130,${0.55 + r() * 0.4})` : t < 0.85 ? `rgba(130,230,255,${0.5 + r() * 0.4})` : `rgba(255,150,210,${0.5 + r() * 0.4})`; ctx.fillRect(xx, yy, cw, cw * 1.25); }
            }
          }
          x += bw + S * 0.002;
        }
        if (L.hz) { const hz = ctx.createLinearGradient(0, H * 0.55, 0, H); hz.addColorStop(0, 'rgba(255,120,120,0)'); hz.addColorStop(1, `rgba(255,140,110,${L.hz})`); ctx.fillStyle = hz; ctx.fillRect(0, H * 0.55, W, H * 0.45); }
      });
      const dk = ctx.createLinearGradient(0, 0, W * 0.45, 0); dk.addColorStop(0, 'rgba(6,4,22,.4)'); dk.addColorStop(1, 'rgba(6,4,22,0)'); ctx.fillStyle = dk; ctx.fillRect(0, 0, W, H);
    } else { // dusk ridge
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1230'); g.addColorStop(0.35, '#35305e'); g.addColorStop(0.6, '#b55a73'); g.addColorStop(0.78, '#f09a68'); g.addColorStop(1, '#f6c27a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen'; blob(ctx, W * 0.72, H * 0.72, S * 0.42, '255,176,110', 0.55, 0.7); ctx.globalCompositeOperation = 'source-over';
      stars(ctx, W, H, r, 110, 0.36);
      const sx = W * 0.72, sy = H * 0.7, sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, S * 0.04); sg.addColorStop(0, 'rgba(255,244,214,.95)'); sg.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = sg; ctx.fillRect(sx - S * 0.05, sy - S * 0.05, S * 0.1, S * 0.1);
      ['#8a4a63', '#6a3d5c', '#4a2f55', '#2f2349', '#1a1433'].forEach((col, i) => {
        const base = H * (0.62 + i * 0.07), amp = H * (0.085 - i * 0.009), p1 = r() * 6, p2 = r() * 6, p3 = r() * 6, f = 1 + i * 0.35;
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 5) { const u = x / W * 6.2832; ctx.lineTo(x, base + amp * (Math.sin(u * 0.9 * f + p1) + 0.55 * Math.sin(u * 2.3 * f + p2) + 0.25 * Math.sin(u * 5.1 * f + p3))); }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        const mh = ctx.createLinearGradient(0, base - amp * 1.6, 0, base + amp * 2); mh.addColorStop(0, 'rgba(255,160,120,.0)'); mh.addColorStop(1, 'rgba(255,170,130,.18)'); ctx.fillStyle = mh; ctx.fill();
      });
      const dk = ctx.createLinearGradient(0, 0, W * 0.45, 0); dk.addColorStop(0, 'rgba(8,6,26,.36)'); dk.addColorStop(1, 'rgba(8,6,26,0)'); ctx.fillStyle = dk; ctx.fillRect(0, 0, W, H);
    }
    grain(ctx, W, H, 13);
  };
})();
