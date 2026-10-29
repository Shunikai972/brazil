/**
 * Procedural audio engine. Every sound of the experience is synthesised live with the Web Audio
 * API (no samples => no licensing issues, ~0 KB of downloads).
 *
 *   music bus ─┐
 *   sfx bus  ──┼─> master ─> compressor ─> speakers
 *   reverb   ──┘
 */
export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

class Engine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.tracks = new Set();
    this.defs = {};
    this._timer = null;
  }

  get ready() {
    return !!this.ctx;
  }
  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** Must be called from a user gesture (tap / click). */
  unlock() {
    if (!this.ctx) this._create();
    if (navigator.audioSession) {
      try {
        navigator.audioSession.type = 'playback'; // iOS: play even with the silent switch on
      } catch (_) {}
    }
    if (this.ctx.state !== 'running') this.ctx.resume();
    // iOS needs a sound started inside the gesture
    const b = this.ctx.createBuffer(1, 1, 22050);
    const s = this.ctx.createBufferSource();
    s.buffer = b;
    s.connect(this.ctx.destination);
    s.start(0);
    return this.ctx.resume();
  }

  _create() {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = (this.ctx = new AC({ latencyHint: 'interactive' }));
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    this.master.connect(comp).connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.75;
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.85;
    this.sfxBus.connect(this.master);

    // algorithmic reverb: decaying stereo noise impulse response
    const len = Math.floor(ctx.sampleRate * 2.6);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    this.verb = ctx.createConvolver();
    this.verb.buffer = ir;
    this.verbSend = ctx.createGain();
    this.verbSend.gain.value = 0.9;
    const verbOut = ctx.createGain();
    verbOut.gain.value = 0.55;
    this.verbSend.connect(this.verb).connect(verbOut).connect(this.master);

    // shared white noise
    const nlen = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, nlen, ctx.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;

    // soft clipper for impacts
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      curve[i] = Math.tanh(x * 3.2);
    }
    this.drive = curve;

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else if (!this._userPaused) this.ctx.resume();
    });
  }

  setMuted(m) {
    this.muted = m;
    if (!this.ctx) return;
    const g = this.master.gain;
    g.cancelScheduledValues(this.now);
    g.setTargetAtTime(m ? 0 : 0.9, this.now, 0.05);
  }

  pause() {
    this._userPaused = true;
    this.ctx && this.ctx.suspend();
  }
  resume() {
    this._userPaused = false;
    this.ctx && this.ctx.resume();
  }

  // ───────────────────────────── building blocks ─────────────────────────────

  gain(v = 1, dest) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    if (dest) g.connect(dest);
    return g;
  }
  osc(type, freq, dest) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    if (dest) o.connect(dest);
    return o;
  }
  filter(type, freq, q = 0.7, dest) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    if (dest) f.connect(dest);
    return f;
  }
  noise(dest, t, dur) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    if (dest) s.connect(dest);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.05);
    return s;
  }
  pan(v, dest) {
    if (!this.ctx.createStereoPanner) return this.gain(1, dest);
    const p = this.ctx.createStereoPanner();
    p.pan.value = v;
    if (dest) p.connect(dest);
    return p;
  }
  shaper(dest) {
    const w = this.ctx.createWaveShaper();
    w.curve = this.drive;
    if (dest) w.connect(dest);
    return w;
  }
  /** attack / exponential decay envelope on a gain node */
  env(g, t, peak, a, d, sustainLevel = 0.0001) {
    const p = g.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.exponentialRampToValueAtTime(Math.max(sustainLevel, 0.0001), t + a + d);
  }
  /** attack / hold / release envelope */
  ahr(g, t, peak, a, hold, r) {
    const p = g.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.setValueAtTime(peak, t + a + hold);
    p.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
  }
  /** routes a voice to its destination + reverb send */
  out(node, dest, verb = 0) {
    node.connect(dest || this.sfxBus);
    if (verb > 0) {
      const s = this.gain(verb, this.verbSend);
      node.connect(s);
    }
    return node;
  }

  // ───────────────────────────── music scheduler ─────────────────────────────

  define(name, def) {
    this.defs[name] = def;
  }

  /**
   * Starts a sequenced track. Returns the AudioContext time of its first step (use it to align
   * visuals). Unless {layer: true}, other playing tracks are faded out.
   */
  play(name, opts = {}) {
    if (!this.ctx) return 0;
    const def = this.defs[name];
    if (!def) return this.now;
    if (!opts.layer) this.stopAll(opts.cut ? 0.02 : opts.fadeOthers ?? 0.25);
    const t0 = this.now + (opts.delay || 0) + 0.04;
    const out = this.gain(0, this.musicBus);
    const vol = opts.volume ?? def.volume ?? 1;
    out.gain.setValueAtTime(0.0001, this.now);
    if (opts.fadeIn) {
      out.gain.setValueAtTime(0.0001, t0);
      out.gain.exponentialRampToValueAtTime(vol, t0 + opts.fadeIn);
    } else out.gain.setValueAtTime(vol, t0);
    const track = {
      name,
      def,
      out,
      bpm: opts.bpm || def.bpm,
      stepsPerBeat: def.stepsPerBeat || 4,
      step: 0,
      next: t0,
      t0,
      params: { ...(def.params || {}), ...(opts.params || {}) },
      alive: true,
    };
    this.tracks.add(track);
    this._ensureTimer();
    return t0;
  }

  /** time (seconds) of one beat for the given track/bpm */
  beat(bpm) {
    return 60 / bpm;
  }

  track(name) {
    for (const t of this.tracks) if (t.name === name && t.alive) return t;
    return null;
  }

  stop(name, fade = 0.3) {
    for (const t of this.tracks) if (t.name === name) this._kill(t, fade);
  }
  stopAll(fade = 0.3) {
    for (const t of this.tracks) this._kill(t, fade);
  }
  _kill(t, fade) {
    if (!t.alive) return;
    t.alive = false;
    const g = t.out.gain;
    const now = this.now;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(g.value, 0.0001), now);
    g.exponentialRampToValueAtTime(0.0001, now + Math.max(0.01, fade));
    setTimeout(() => {
      try {
        t.out.disconnect();
      } catch (_) {}
      this.tracks.delete(t);
    }, (fade + 2.5) * 1000);
  }

  _ensureTimer() {
    if (this._timer) return;
    this._timer = setInterval(() => this._schedule(), 25);
  }
  _schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const horizon = this.now + 0.12;
    let any = false;
    for (const t of this.tracks) {
      if (!t.alive) continue;
      any = true;
      if (t.next < this.now - 0.08) t.next = this.now + 0.01; // resumed after a pause: skip ahead
      while (t.next < horizon && t.alive) {
        try {
          t.def.step(this, t, t.step, t.next);
        } catch (e) {
          console.warn(e);
        }
        t.next += 60 / t.bpm / t.stepsPerBeat;
        t.step++;
        if (t.def.length && !t.def.loop && t.step >= t.def.length) this._kill(t, t.def.tail ?? 2);
      }
    }
    if (!any && this.tracks.size === 0) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}

export const audio = new Engine();
