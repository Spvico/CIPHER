/* CIPHER — procedural audio: synthesized SFX + adaptive generative music. No assets, all WebAudio. */
(function () {
  'use strict';
  const C = window.CIPHER;
  const A = (C.audio = {
    ctx: null, master: null, sfxBus: null, musicBus: null, duckBus: null, delayIn: null,
    vol: { master: 0.8, sfx: 0.8, music: 0.45 },
  });

  A.init = function () {
    if (A.ctx) return A.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      const ctx = new AC();
      A.ctx = ctx;
      A.master = ctx.createGain();
      A.comp = ctx.createDynamicsCompressor();
      A.comp.threshold.value = -14; A.comp.ratio.value = 5; A.comp.attack.value = 0.004; A.comp.release.value = 0.18;
      A.sfxBus = ctx.createGain();
      A.musicBus = ctx.createGain();
      A.duckBus = ctx.createGain();
      A.sfxBus.connect(A.master);
      A.musicBus.connect(A.duckBus);
      A.duckBus.connect(A.master);
      A.master.connect(A.comp);
      A.comp.connect(ctx.destination);
      // feedback delay for music
      const d = ctx.createDelay(1); d.delayTime.value = 0.3;
      const fb = ctx.createGain(); fb.gain.value = 0.38;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      A.delayIn = ctx.createGain(); A.delayIn.gain.value = 1;
      A.delayIn.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(A.musicBus);
      // noise buffer
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      A.noiseBuf = buf;
      A.applyVolumes();
    } catch (e) { A.ctx = null; }
    return A.ctx;
  };
  A.resume = function () { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); };
  A.applyVolumes = function () {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    A.master.gain.setTargetAtTime(A.vol.master, t, 0.02);
    A.sfxBus.gain.setTargetAtTime(A.vol.sfx, t, 0.02);
    A.musicBus.gain.setTargetAtTime(A.vol.music, t, 0.02);
  };
  A.setVolume = function (k, v) { A.vol[k] = C.clamp(v, 0, 1); A.applyVolumes(); };
  A.duck = function (on) { if (A.ctx) A.duckBus.gain.setTargetAtTime(on ? 0.0001 : 1, A.ctx.currentTime, 0.12); };

  // ---------- primitives ----------
  function tone(o) {
    const ctx = A.ctx; if (!ctx) return;
    const t = ctx.currentTime + (o.delay || 0);
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + o.dur);
    const v = o.vol == null ? 0.15 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(o.bus || A.sfxBus);
    osc.start(t); osc.stop(t + o.dur + 0.05);
  }
  function noise(o) {
    const ctx = A.ctx; if (!ctx || !A.noiseBuf) return;
    const t = ctx.currentTime + (o.delay || 0);
    const src = ctx.createBufferSource(); src.buffer = A.noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    f.Q.value = o.q || 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol == null ? 0.1 : o.vol), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.bus || A.sfxBus);
    src.start(t, Math.random()); src.stop(t + o.dur + 0.05);
  }
  A.tone = tone; A.noise = noise;

  const last = {};
  const SFX = {
    click: () => tone({ f: 1300, f2: 800, dur: 0.045, vol: 0.07, type: 'square' }),
    blip: () => tone({ f: 660, dur: 0.06, vol: 0.07, type: 'square' }),
    tick: () => tone({ f: 1900, dur: 0.02, vol: 0.05, type: 'triangle' }),
    type: () => noise({ dur: 0.025, f: 3500, ft: 'highpass', vol: 0.06 }),
    good: () => { tone({ f: 660, dur: 0.09, vol: 0.1, type: 'triangle' }); tone({ f: 990, dur: 0.14, vol: 0.1, type: 'triangle', delay: 0.07 }); },
    bad: () => { tone({ f: 150, f2: 70, dur: 0.26, vol: 0.2, type: 'sawtooth' }); noise({ dur: 0.15, f: 400, vol: 0.1 }); },
    warn: () => { tone({ f: 260, dur: 0.12, vol: 0.12, type: 'square' }); tone({ f: 260, dur: 0.12, vol: 0.12, type: 'square', delay: 0.18 }); },
    success: () => [523, 659, 784, 1047].forEach((f, i) => tone({ f, dur: 0.18, vol: 0.11, type: 'triangle', delay: i * 0.075 })),
    fail: () => { tone({ f: 440, f2: 90, dur: 0.7, vol: 0.18, type: 'sawtooth' }); noise({ dur: 0.5, f: 800, f2: 120, vol: 0.12 }); },
    alert: () => { for (let i = 0; i < 3; i++) { tone({ f: 880, dur: 0.1, vol: 0.12, type: 'square', delay: i * 0.22 }); tone({ f: 620, dur: 0.1, vol: 0.12, type: 'square', delay: i * 0.22 + 0.11 }); } },
    coin: () => { tone({ f: 1318, dur: 0.07, vol: 0.09, type: 'square' }); tone({ f: 1760, dur: 0.22, vol: 0.09, type: 'square', delay: 0.07 }); },
    levelup: () => [392, 494, 587, 784, 988, 1175].forEach((f, i) => tone({ f, dur: 0.3, vol: 0.1, type: 'triangle', delay: i * 0.08 })),
    whoosh: () => noise({ dur: 0.35, f: 300, f2: 3500, q: 1.2, vol: 0.12 }),
    boot: () => { tone({ f: 70, f2: 900, dur: 1.1, vol: 0.12, type: 'sawtooth' }); noise({ dur: 0.9, f: 200, f2: 5000, vol: 0.06 }); },
    open: () => tone({ f: 420, f2: 840, dur: 0.09, vol: 0.07, type: 'square' }),
    close: () => tone({ f: 840, f2: 420, dur: 0.09, vol: 0.07, type: 'square' }),
    hit: () => { tone({ f: 170, f2: 40, dur: 0.16, vol: 0.35, type: 'sine' }); noise({ dur: 0.07, f: 1800, vol: 0.08 }); },
    zap: () => tone({ f: 1900, f2: 180, dur: 0.18, vol: 0.12, type: 'sawtooth' }),
    glitch: () => { for (let i = 0; i < 4; i++) noise({ dur: 0.04, f: 500 + Math.random() * 4000, vol: 0.1, delay: i * 0.05 }); },
    buy: () => { tone({ f: 880, dur: 0.05, vol: 0.09, type: 'square' }); tone({ f: 1175, dur: 0.05, vol: 0.09, type: 'square', delay: 0.05 }); tone({ f: 1568, dur: 0.12, vol: 0.09, type: 'square', delay: 0.1 }); },
    deny: () => { tone({ f: 200, dur: 0.09, vol: 0.12, type: 'square' }); tone({ f: 150, dur: 0.13, vol: 0.12, type: 'square', delay: 0.09 }); },
    node: () => { tone({ f: 330, f2: 660, dur: 0.12, vol: 0.09, type: 'triangle' }); noise({ dur: 0.1, f: 2500, vol: 0.04 }); },
    mail: () => { tone({ f: 988, dur: 0.1, vol: 0.08, type: 'sine' }); tone({ f: 1319, dur: 0.2, vol: 0.08, type: 'sine', delay: 0.1 }); },
  };
  A.sfx = function (name) {
    if (!A.ctx || !SFX[name]) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 22) return;
    last[name] = now;
    try { SFX[name](); } catch (e) { /* ignore */ }
  };

  // ---------- adaptive music ----------
  const M = (A.music = { on: false, mode: 'title', target: 0, intensity: 0.1, _timer: null, _step: 0, _next: 0 });
  const PROG = [
    { root: 55.0, ch: [0, 3, 7, 10] },   // Am7
    { root: 43.65, ch: [0, 4, 7, 11] },  // Fmaj7
    { root: 65.41, ch: [0, 4, 7, 11] },  // Cmaj7
    { root: 49.0, ch: [0, 4, 7, 10] },   // G7
  ];
  const ARP = [0, 2, 1, 3, 2, 1, 3, 2, 0, 3, 1, 2, 3, 1, 2, 0];
  const BASS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
  const MODES = { title: { min: 0.0, max: 0.22 }, desk: { min: 0.22, max: 0.4 }, run: { min: 0.4, max: 1.0 } };
  const hz = (root, semis, oct) => root * Math.pow(2, semis / 12 + oct);

  function mTone(f, t, dur, type, vol, cutoff, send) {
    const ctx = A.ctx;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cutoff, t); fl.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff * 0.35), t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(A.musicBus); if (send) g.connect(A.delayIn);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function mKick(t, v) {
    const ctx = A.ctx; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g); g.connect(A.musicBus); o.start(t); o.stop(t + 0.22);
  }
  function mNoise(t, dur, f, ft, v) {
    const ctx = A.ctx; if (!A.noiseBuf) return;
    const s = ctx.createBufferSource(); s.buffer = A.noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = ft; fl.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(A.musicBus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function mPad(ch, t, dur, I) {
    const ctx = A.ctx;
    const notes = [0, 1, 2].map((k) => hz(ch.root, ch.ch[k], 2));
    notes.forEach((f, k) => [-7, 7].forEach((det) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 600 + I * 900;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(A.musicBus); o.start(t); o.stop(t + dur + 0.05);
    }));
  }
  function playStep(s, t, spb) {
    const bar = (s >> 4) & 3, st = s & 15, ch = PROG[bar], I = M.intensity;
    if (st === 0) mPad(ch, t, spb * 16, I);
    if (I > 0.12 && (st === 0 || st === 8 || (I > 0.55 && (st === 6 || st === 14)) || (I > 0.8 && st === 11))) mKick(t, 0.3 + 0.25 * I);
    if (I > 0.3 && (st === 4 || st === 12)) mNoise(t, 0.12, 1800, 'bandpass', 0.05 + 0.04 * I);
    if (I > 0.18 && (st % 2 === 0 || I > 0.65)) mNoise(t, 0.035, 8000, 'highpass', st % 4 === 2 ? 0.05 : 0.024);
    if (I > 0.1 && BASS[st]) mTone(hz(ch.root, 0, st === 8 ? 1 : 0), t, spb * 2.6, 'sawtooth', 0.11, 380 + I * 700, false);
    const arpOn = M.mode === 'title' ? st % 4 === 0 : I > 0.06 && (I > 0.5 || st % 2 === 0);
    if (arpOn) {
      const semis = ch.ch[ARP[st] % 4] + (ARP[st] > 1 ? 12 : 0);
      mTone(hz(ch.root, semis, 2 + (bar === 3 && st > 11 ? 1 : 0)), t, spb * 1.6, 'square', 0.028 + 0.02 * I, 1500 + I * 2600, true);
    }
  }
  function tick() {
    const ctx = A.ctx; if (!ctx || !M.on) return;
    const m = MODES[M.mode] || MODES.desk;
    M.intensity += (m.min + (m.max - m.min) * M.target - M.intensity) * 0.08;
    const spb = 60 / (82 + M.intensity * 52) / 4;
    if (M._next < ctx.currentTime) M._next = ctx.currentTime + 0.05;
    while (M._next < ctx.currentTime + 0.22) { playStep(M._step, M._next, spb); M._next += spb; M._step = (M._step + 1) % 64; }
  }
  M.start = function () { if (!A.ctx || M.on) return; M.on = true; M._next = 0; M._timer = setInterval(tick, 45); };
  M.stop = function () { M.on = false; clearInterval(M._timer); };
  M.setMode = function (mode) { M.mode = mode; if (mode !== 'run') M.target = 0.5; };
  M.setIntensity = function (x) { M.target = C.clamp(x, 0, 1); };
})();
