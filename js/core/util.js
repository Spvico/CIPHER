/* CIPHER — shared utilities. Everything hangs off window.CIPHER (classic scripts, works from file://). */
(function () {
  'use strict';
  const C = (window.CIPHER = window.CIPHER || {});
  C.VERSION = '1.0.0';

  // ---------- math ----------
  C.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  C.lerp = (a, b, t) => a + (b - a) * t;
  C.ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  };
  C.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  // ---------- RNG ----------
  C.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  C.hashStr = function (s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  /** Rich seeded RNG: r() float, f(a,b) float, i(a,b) int inclusive, pick(arr), shuffle(arr), chance(p), weighted(items, fn) */
  C.makeRng = function (seed) {
    const r = C.mulberry32(typeof seed === 'string' ? C.hashStr(seed) : seed | 0);
    const o = {
      r,
      f: (a = 0, b = 1) => a + (b - a) * r(),
      i: (a, b) => a + Math.floor(r() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(r() * arr.length)],
      chance: (p) => r() < p,
      shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      weighted: (items, fn) => { let tot = 0; for (const it of items) tot += fn(it); let x = r() * tot; for (const it of items) { x -= fn(it); if (x <= 0) return it; } return items[items.length - 1]; },
    };
    return o;
  };

  // ---------- DOM ----------
  /** h('div', {class:'x', style:{}, onclick:fn, html:'..'}, ...children) */
  C.h = function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs != null && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') { for (const sk in v) { if (sk.startsWith('--')) el.style.setProperty(sk, v[sk]); else el.style[sk] = v[sk]; } }
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };
  C.$ = (sel, root) => (root || document).querySelector(sel);
  C.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  C.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  C.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  // ---------- format ----------
  C.fmt = {
    cr: (n) => '¢' + Math.round(n).toLocaleString('en-US'),
    num: (n) => Math.round(n).toLocaleString('en-US'),
    pct: (n, d = 0) => (n * 100).toFixed(d) + '%',
    time: (sec) => { sec = Math.max(0, Math.ceil(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); },
    pad: (n, w = 2) => String(n).padStart(w, '0'),
  };

  // ---------- events ----------
  const listeners = {};
  C.on = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); return () => C.off(evt, fn); };
  C.off = (evt, fn) => { const l = listeners[evt]; if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } };
  C.emit = (evt, data) => { (listeners[evt] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error('[event ' + evt + ']', e); } }); };


  // ---------- device / layout ----------
  C.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  C.layout = { w: 0, h: 0, compact: false, portrait: false, touch: C.isTouch };
  C.updateLayout = function () {
    const L = C.layout, w = window.innerWidth, hh = window.innerHeight;
    L.w = w; L.h = hh; L.portrait = hh > w; L.compact = w < 900 || hh < 560;
    const b = document.body; if (!b) return;
    b.classList.toggle('compact', L.compact); b.classList.toggle('portrait', L.portrait); b.classList.toggle('touch', C.isTouch);
    C.emit('layout', L);
  };
  window.addEventListener('resize', () => C.updateLayout());
  window.addEventListener('orientationchange', () => setTimeout(() => C.updateLayout(), 120));
  C.haptic = function (ms) { try { if (C.isTouch && navigator.vibrate) navigator.vibrate(ms || 20); } catch (e) { /* ignore */ } };
  document.addEventListener('DOMContentLoaded', () => C.updateLayout());
  C.updateLayout();

  // ---------- toasts ----------
  C.notifs = [];
  C.toast = function (msg, kind, ms, app) {
    let box = document.getElementById('toasts');
    if (!box) { box = C.h('div', { id: 'toasts' }); document.body.append(box); }
    const now = new Date(), hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    C.notifs.unshift({ msg, kind: kind || '', app: app || 'System', time: hhmm });
    if (C.notifs.length > 40) C.notifs.pop();
    C.emit('notif', C.notifs[0]);
    const t = C.h('div', { class: 'toast ' + (kind || ''), onclick: () => { t.classList.add('out'); setTimeout(() => t.remove(), 250); } },
      C.h('div', { class: 'toast-h' }, C.h('i', { class: 'toast-dot' }), C.h('span', app || 'System'), C.h('em', 'now')), C.h('div', { class: 'toast-b' }, msg));
    box.append(t);
    while (box.children.length > (C.layout.compact ? 2 : 4)) box.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms || 4500);
    return t;
  };

  // ---------- shared constants ----------
  /** Per-run tools every minigame must support (see docs/MINIGAME_SPEC.md). */
  C.TOOLS = {
    hint: { id: 'hint', name: 'Oracle', key: 'F1', icon: '◈', desc: 'Reveals useful info / solves a piece of the puzzle.' },
    freeze: { id: 'freeze', name: 'Chronos', key: 'F2', icon: '❄', desc: 'Freezes time / the threat for a few seconds.' },
    shield: { id: 'shield', name: 'Aegis', key: 'F3', icon: '⬡', desc: 'Absorbs the next mistake.' },
  };
  C.TOOL_IDS = ['hint', 'freeze', 'shield'];


  // ---------- tiny canvas FX helpers (particles + floating text) ----------
  C.fx = {
    Particles: class {
      constructor() { this.a = []; }
      burst(x, y, col, n, sp, life, size) {
        n = n || 12; sp = sp || 120; life = life || 0.6; size = size || 3;
        for (let i = 0; i < n; i++) { const an = Math.random() * 6.2832, v = sp * (0.3 + Math.random() * 0.9); this.a.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life, max: life, col, size: size * (0.5 + Math.random()) }); }
        if (this.a.length > 600) this.a.splice(0, this.a.length - 600);
      }
      update(dt) { for (let i = this.a.length - 1; i >= 0; i--) { const p = this.a[i]; p.life -= dt; if (p.life <= 0) { this.a.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy = p.vy * 0.97 + 40 * dt; } }
      draw(ctx) { for (const p of this.a) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.col; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); } ctx.globalAlpha = 1; }
    },
    Texts: class {
      constructor() { this.a = []; }
      add(x, y, txt, col, size, life) { this.a.push({ x, y, txt, col: col || '#fff', size: size || 18, life: life || 0.9, max: life || 0.9 }); }
      update(dt) { for (let i = this.a.length - 1; i >= 0; i--) { const t = this.a[i]; t.life -= dt; t.y -= 38 * dt; if (t.life <= 0) this.a.splice(i, 1); } }
      draw(ctx) { ctx.textAlign = 'center'; for (const t of this.a) { const k = t.life / t.max; ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = t.col; ctx.font = '700 ' + t.size * (1 + (1 - k) * 0.2) + 'px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'; ctx.fillText(t.txt, t.x, t.y); } ctx.globalAlpha = 1; }
    },
  };

  /** score (0..1) -> rank letter + payout multiplier */
  C.rankOf = function (score) {
    if (score >= 0.9) return { letter: 'S', mult: 1.3 };
    if (score >= 0.75) return { letter: 'A', mult: 1.15 };
    if (score >= 0.55) return { letter: 'B', mult: 1.0 };
    if (score >= 0.35) return { letter: 'C', mult: 0.88 };
    return { letter: 'D', mult: 0.75 };
  };
})();
