/* CIPHER — minigame registry + host. Provides the overlay (HUD, tools, intro/result cards) and the
   `host` API every minigame is built against. See docs/MINIGAME_SPEC.md. */
(function () {
  'use strict';
  const C = window.CIPHER;
  const h = C.h;
  const reg = {};

  const mg = (C.mg = {
    register(def) { reg[def.id] = def; },
    get: (id) => reg[id],
    list: () => Object.values(reg),
    current: null,
  });

  mg.play = function (id, userOpts) {
    const def = reg[id];
    if (!def) return Promise.reject(new Error('Unknown minigame: ' + id));
    const opts = Object.assign({
      difficulty: 3, seed: (Math.random() * 1e9) | 0,
      node: { name: 'test-node', type: 'relay', label: 'TEST NODE' },
      bonus: {}, tools: {}, firstTime: true, skipIntro: false, autoClose: false,
      getTrace: null, addTrace: null, onTool: null, audioOffset: 0,
    }, userOpts || {});
    opts.bonus = Object.assign({ time: 0, lives: 0, window: 0 }, opts.bonus);
    opts.tools = Object.assign({ hint: 0, freeze: 0, shield: 0 }, opts.tools);
    opts.difficulty = C.clamp(opts.difficulty, 1, 14);
    let localTrace = 0;
    const getTrace = opts.getTrace || (() => localTrace);
    const addTrace = opts.addTrace || ((n) => { localTrace = Math.min(100, localTrace + n); });

    let resolveFn;
    const promise = new Promise((res) => { resolveFn = res; });

    // ---------- DOM ----------
    const el = {};
    const overlay = h('div', { class: 'mg-overlay' },
      (el.frame = h('div', { class: 'mg-frame' },
        h('div', { class: 'mg-head' },
          h('button', { class: 'mg-x', title: 'Abort', 'aria-label': 'Abort', onclick: () => askAbort() }, '✕'),
          (el.title = h('div', { class: 'mg-title' }, (def.icon || '▣') + ' ' + def.name, h('small', '// ' + (opts.node.label || '') + (opts.node.name ? ' · ' + opts.node.name : '')))),
          h('div', { class: 'mg-hud' },
            (el.trace = h('div', { class: 'mg-trace' }, h('span', { class: 'lb' }, 'Trace'), h('div', { class: 'bar r' }, (el.traceFill = h('i'))), (el.traceVal = h('b', '0%')))),
            (el.timer = h('div', { class: 'mg-timer', style: { display: 'none' } })),
            (el.lives = h('div', { class: 'mg-lives', style: { display: 'none' } })))),
        h('div', { class: 'mg-prog' }, (el.prog = h('i'))),
        (el.stage = h('div', { class: 'mg-stage' })),
        h('div', { class: 'mg-foot' },
          (el.status = h('div', { class: 'mg-status' })),
          (el.tools = h('div', { class: 'mg-tools' })),
          (el.abortBtn = h('button', { class: 'btn sm', onclick: () => askAbort() }, C.isTouch ? '✕ Abort' : 'Esc · Abort'))))));
    document.body.append(overlay);

    // ---------- state ----------
    const cleanups = [];
    const loops = new Set();
    let phase = 'intro', done = false, closed = false, result = null, inst = null, t = 0, startedAt = 0, activeCard = null, resultShown = false;

    const rng = C.makeRng(opts.seed);
    const host = {
      root: el.stage,
      params: { touch: C.isTouch, difficulty: opts.difficulty, seed: opts.seed, node: opts.node, bonus: opts.bonus, tools: opts.tools, audioOffset: opts.audioOffset },
      rng, rand: rng.r, randInt: rng.i, pick: rng.pick, shuffle: rng.shuffle,
      started: false, paused: false, done: false,
      audio: C.audio,
      get active() { return host.started && !host.paused && !host.done; },
      get time() { return t; },
      sfx: (n) => C.audio.sfx(n),
      view() { const r = el.stage.getBoundingClientRect(); return { w: r.width, h: r.height, portrait: r.height > r.width * 1.05, narrow: r.width < 760 }; },
      onResize(fn) {
        const call = () => { try { fn(host.view()); } catch (e) { console.error(e); } };
        if (window.ResizeObserver) { const ro = new ResizeObserver(call); ro.observe(el.stage); cleanups.push(() => ro.disconnect()); } else host.listen(window, 'resize', call);
        call();
      },
      makeCanvas(w, hh, parent) {
        parent = parent || el.stage;
        const c = document.createElement('canvas');
        c._lw = w; c._lh = hh;
        const ctx = c.getContext('2d');
        parent.appendChild(c);
        let lastKey = '';
        const fit = () => {
          const r = parent.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const s = Math.min(r.width / w, r.height / hh);
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const key = Math.floor(w * s) + 'x' + Math.floor(hh * s) + '@' + dpr;
          if (key === lastKey) return;
          lastKey = key;
          c.style.width = Math.floor(w * s) + 'px';
          c.style.height = Math.floor(hh * s) + 'px';
          c.width = Math.max(1, Math.round(w * s * dpr));
          c.height = Math.max(1, Math.round(hh * s * dpr));
          ctx.setTransform((c.width / w), 0, 0, (c.height / hh), 0, 0);
          c.dispatchEvent(new Event('fit'));
        };
        fit();
        if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe(parent); cleanups.push(() => ro.disconnect()); }
        else { host.listen(window, 'resize', fit); }
        return { canvas: c, ctx, w, h: hh };
      },
      // Canvas whose logical size == its parent's CSS size (1 unit = 1 CSS px). Calls onSize(w,h) on creation and every resize,
      // so games recompute their layout (portrait/landscape, phones...). Returns {canvas, ctx, w, h} (w/h are live).
      autoCanvas(parent, onSize) {
        parent = parent || el.stage;
        const c = document.createElement('canvas'), ctx = c.getContext('2d');
        c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;touch-action:none;-webkit-user-select:none;user-select:none';
        parent.appendChild(c);
        const o = { canvas: c, ctx, w: 0, h: 0, dpr: 0 };
        const fit = () => {
          const r = parent.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const w = Math.max(1, Math.floor(r.width)), hh = Math.max(1, Math.floor(r.height)), dpr = Math.min(2, window.devicePixelRatio || 1);
          if (w === o.w && hh === o.h && dpr === o.dpr) return;
          o.w = w; o.h = hh; o.dpr = dpr; c._lw = w; c._lh = hh;
          c.width = Math.round(w * dpr); c.height = Math.round(hh * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          if (onSize) { try { onSize(w, hh, o); } catch (e) { console.error(e); } }
        };
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        fit();
        if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe(parent); cleanups.push(() => ro.disconnect()); }
        else host.listen(window, 'resize', fit);
        return o;
      },
      pointer(ev, canvas) {
        const r = canvas.getBoundingClientRect();
        return { x: (ev.clientX - r.left) * canvas._lw / r.width, y: (ev.clientY - r.top) * canvas._lh / r.height };
      },
      css(text) {
        const s = document.createElement('style'); s.textContent = text; document.head.appendChild(s);
        cleanups.push(() => s.remove());
      },
      listen(target, type, fn, o) { target.addEventListener(type, fn, o); cleanups.push(() => target.removeEventListener(type, fn, o)); },
      loop(fn) { loops.add(fn); return () => loops.delete(fn); },
      after(ms, fn) { const id = setTimeout(() => { if (!closed) fn(); }, ms); cleanups.push(() => clearTimeout(id)); return () => clearTimeout(id); },
      penalty(n, why) {
        if (done || closed) return;
        n = Math.max(0, +n || 0);
        addTrace(n, why || ''); C.haptic(25);
        el.frame.classList.remove('hit'); void el.frame.offsetWidth; el.frame.classList.add('hit');
      },
      setStatus(text, kind) { el.status.textContent = text || ''; el.status.className = 'mg-status ' + (kind || ''); },
      setProgress(f) { el.prog.style.width = (C.clamp(f, 0, 1) * 100).toFixed(1) + '%'; },
      setTimer(sec) {
        if (sec == null) { el.timer.style.display = 'none'; return; }
        el.timer.style.display = '';
        el.timer.textContent = C.fmt.time(sec);
        el.timer.classList.toggle('low', sec <= 10 && host.started && !host.done);
      },
      setLives(n, max) {
        if (n == null) { el.lives.style.display = 'none'; return; }
        el.lives.style.display = '';
        C.clear(el.lives);
        for (let i = 0; i < (max == null ? n : max); i++) el.lives.append(h('span', { class: i < n ? '' : 'off' }, '♥'));
      },
      finish(res) { finish(res); },
    };

    // ---------- tools ----------
    const toolBtns = {};
    C.TOOL_IDS.forEach((tid) => {
      const T = C.TOOLS[tid];
      const cnt = h('span', { class: 'cnt' }, String(opts.tools[tid] || 0));
      const b = h('button', { class: 'btn sm mg-tool', title: T.name + ' — ' + T.desc, onclick: () => useTool(tid) }, h('span', { class: 'kbd' }, T.key), h('span', { class: 'ti' }, T.icon), h('span', { class: 'nm' }, T.name), cnt);
      toolBtns[tid] = { b, cnt };
      el.tools.append(b);
    });
    function refreshTools() {
      C.TOOL_IDS.forEach((tid) => {
        const n = opts.tools[tid] || 0;
        toolBtns[tid].cnt.textContent = String(n);
        toolBtns[tid].b.disabled = n <= 0 || !host.active;
      });
    }
    function useTool(tid) {
      if (!host.active || !inst || (opts.tools[tid] || 0) <= 0) return;
      let ok = false;
      try { ok = !!(inst.tool && inst.tool(tid)); } catch (e) { console.error(e); }
      const b = toolBtns[tid].b;
      b.classList.remove('used', 'nope'); void b.offsetWidth;
      if (ok) { opts.tools[tid]--; b.classList.add('used'); C.audio.sfx('zap'); if (opts.onTool) opts.onTool(tid); }
      else { b.classList.add('nope'); C.audio.sfx('deny'); }
      refreshTools();
    }

    // ---------- cards ----------
    function showCard(cls, inner) {
      hideCard();
      activeCard = h('div', { class: 'mg-card ' + (cls || '') }, h('div', { class: 'mg-card-in' }, inner));
      el.stage.append(activeCard);
    }
    function hideCard() { if (activeCard) { activeCard.remove(); activeCard = null; } }

    function showIntro() {
      const info = def.info || {};
      const n = Math.round(C.clamp(opts.difficulty, 1, 10));
      const pips = h('div', { class: 'pips' }); for (let i = 1; i <= 10; i++) pips.append(h('i', { class: i <= n ? 'on' : '' }));
      showCard('intro', [
        h('h2', (def.icon || '▣') + ' ' + def.name),
        h('p', { class: 'blurb' }, def.blurb || ''),
        info.goal ? h('p', { class: 'goal' }, info.goal) : null,
        opts.firstTime && (C.isTouch && info.touch ? info.touch : info.controls) ? h('ul', (C.isTouch && info.touch ? info.touch : info.controls).map((c) => h('li', c))) : null,
        pips,
        h('div', { class: 'row' }, h('button', { class: 'btn pri lg', onclick: beginPlay }, C.isTouch ? 'Start' : 'Start · Enter'), h('button', { class: 'btn', onclick: () => abortNow(false) }, C.isTouch ? 'Back' : 'Back · Esc')),
      ]);
    }

    function askAbort() {
      if (phase !== 'play' || done) return;
      phase = 'confirm'; host.paused = true;
      showCard('lose', [
        h('h2', 'ABORT NODE?'),
        h('p', { class: 'blurb' }, 'Dropping the connection counts as a failed breach.'),
        h('div', { class: 'row' }, h('button', { class: 'btn dng', onclick: () => abortNow(true) }, C.isTouch ? 'Abort' : 'Abort · Enter'), h('button', { class: 'btn', onclick: resumePlay }, C.isTouch ? 'Resume' : 'Resume · Esc')),
      ]);
    }
    function resumePlay() { if (phase !== 'confirm') return; hideCard(); phase = 'play'; host.paused = false; refreshTools(); }
    function abortNow(wasPlaying) {
      if (done) return;
      done = true; host.done = true;
      result = { success: false, score: 0, rank: 'F', rankMult: 0, stats: {}, aborted: true, traced: false, time: t };
      closeOverlay();
    }

    function beginPlay() {
      if (phase !== 'intro') return;
      phase = 'play'; hideCard(); host.started = true; startedAt = performance.now();
      try { inst.start(); } catch (e) { console.error(e); }
      refreshTools();
      C.audio.sfx('blip');
    }

    function finish(res) {
      if (done) return;
      done = true; host.done = true;
      res = Object.assign({ success: false, score: 0, stats: {} }, res || {});
      res.score = C.clamp(+res.score || 0, 0, 1);
      if (res.success && res.score <= 0) res.score = 0.5;
      const rk = res.success ? C.rankOf(res.score) : { letter: 'F', mult: 0 };
      result = { success: !!res.success, score: res.score, rank: rk.letter, rankMult: rk.mult, stats: res.stats || {}, aborted: false, traced: !!res.traced, time: t };
      refreshTools();
      try { if (inst && inst.onFinish) inst.onFinish(result); } catch (e) { console.error(e); }
      setTimeout(showResult, result.success ? 900 : 700);
    }

    function showResult() {
      if (closed) return;
      phase = 'result'; resultShown = true;
      const r = result;
      const stats = Object.entries(r.stats || {}).slice(0, 6);
      const head = r.traced ? 'TRACE COMPLETE' : r.success ? 'ACCESS GRANTED' : 'ACCESS DENIED';
      const sub = r.traced ? 'Your connection was traced and terminated.' : r.success ? 'Node compromised.' : 'The node held. Alarms are ringing.';
      C.audio.sfx(r.success ? 'success' : 'fail');
      showCard(r.success ? 'win' : 'lose', [
        h('h2', head),
        h('p', { class: 'blurb' }, sub),
        r.success ? h('div', { class: 'mg-rank ' + r.rank }, r.rank) : null,
        h('div', { class: 'mg-stats' },
          r.success ? h('div', h('span', 'Performance'), h('b', Math.round(r.score * 100) + '%')) : null,
          h('div', h('span', 'Time'), h('b', C.fmt.time(r.time))),
          stats.map(([k, v]) => h('div', h('span', k), h('b', typeof v === 'number' ? (Math.round(v * 100) / 100).toString() : String(v))))),
        h('div', { class: 'row' }, h('button', { class: 'btn pri lg', onclick: closeOverlay }, (C.isTouch ? 'Continue' : 'Continue · Enter'))),
      ]);
      if (opts.autoClose) setTimeout(closeOverlay, 700);
    }

    function closeOverlay() {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
      try { if (inst && inst.destroy) inst.destroy(); } catch (e) { console.error(e); }
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      if (def.music) C.audio.duck(false);
      if (mg.current && mg.current.host === host) mg.current = null;
      if (!result) result = { success: false, score: 0, rank: 'F', rankMult: 0, stats: {}, aborted: true, traced: false, time: t };
      resolveFn(result);
    }

    // ---------- keyboard (capture, so minigames never see Esc / F-keys / intro Enter) ----------
    function onKey(e) {
      const k = e.key;
      if (phase === 'result') { if (k === 'Enter' || k === ' ') { e.preventDefault(); e.stopPropagation(); closeOverlay(); } return; }
      if (phase === 'intro') {
        if (k === 'Enter') beginPlay(); else if (k === 'Escape') abortNow(false); else return;
        e.preventDefault(); e.stopPropagation(); return;
      }
      if (phase === 'confirm') {
        if (k === 'Enter') abortNow(true); else if (k === 'Escape') resumePlay(); else return;
        e.preventDefault(); e.stopPropagation(); return;
      }
      if (phase === 'play') {
        if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); askAbort(); return; }
        if (k === 'F1' || k === 'F2' || k === 'F3') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) useTool(C.TOOL_IDS[+k[1] - 1]); }
      }
    }
    window.addEventListener('keydown', onKey, true);

    // ---------- frame loop ----------
    let raf = 0, last = performance.now();
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const tr = C.clamp(getTrace(), 0, 100);
      el.traceFill.style.width = tr + '%';
      el.traceVal.textContent = Math.floor(tr) + '%';
      el.trace.classList.toggle('hot', tr >= 80);
      if (tr >= 100 && !done && phase !== 'result') {
        phase = 'result';
        done = true; host.done = true;
        result = { success: false, score: 0, rank: 'F', rankMult: 0, stats: {}, aborted: false, traced: true, time: t };
        try { if (inst && inst.onFinish) inst.onFinish(result); } catch (e) { console.error(e); }
        showResult();
      }
      if (host.paused) return;
      if (host.started && !host.done) t += dt;
      loops.forEach((fn) => { try { fn(dt, t); } catch (e) { console.error(e); loops.delete(fn); } });
      if (host.started && !host.done) { /* minigames drive their own timers via setTimer */ }
    }

    // ---------- go ----------
    try { inst = def.create(host); }
    catch (e) {
      console.error(e);
      el.stage.append(h('div', { style: { color: 'var(--r)', padding: '30px' } }, 'Minigame failed to load: ' + e.message));
      inst = null;
    }
    mg.current = { host, get inst() { return inst; }, opts, finish };
    if (def.music) C.audio.duck(true);
    refreshTools();
    raf = requestAnimationFrame(frame);
    if (opts.skipIntro) setTimeout(beginPlay, 30); else showIntro();
    promise.cancel = () => { if (!closed) { done = true; host.done = true; if (!result) result = { success: false, score: 0, rank: 'F', rankMult: 0, stats: {}, aborted: true, traced: false, time: t }; closeOverlay(); } };
    return promise;
  };
})();
