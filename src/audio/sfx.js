import { audio as E } from './engine.js';
import * as I from './instruments.js';

/* One-shot sound effects. All functions are safe to call before audio is unlocked (no-op). */

const T = (dt = 0) => E.now + 0.01 + dt;
const ok = () => E.ready && !E.muted;
const rnd = (a, b) => a + Math.random() * (b - a);

export const sfx = {
  /** huge cinematic hit: sub drop + noise burst + saturation */
  impact(size = 1, dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    const sh = E.shaper(g);
    E.out(g, undefined, 0.35 * size);
    E.env(g, t, 0.55 * size, 0.003, 1.2 + size * 0.6);
    const o = E.osc('sine', 120, sh);
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.9);
    o.start(t);
    o.stop(t + 2.2);
    const n = E.gain(0);
    E.out(n, undefined, 0.5 * size);
    E.env(n, t, 0.45 * size, 0.002, 0.7 * size);
    const lp = E.filter('lowpass', 2400, 0.6, n);
    lp.frequency.setValueAtTime(5000, t);
    lp.frequency.exponentialRampToValueAtTime(200, t + 0.8);
    E.noise(lp, t, 1);
  },

  /** the meme "boom" */
  boom(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    const sh = E.shaper(g);
    E.out(g, undefined, 0.45);
    E.env(g, t, 0.6, 0.004, 1.6);
    const o = E.osc('sine', 62, sh);
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 1.2);
    const o2 = E.osc('triangle', 124, E.gain(0.35, sh));
    o2.frequency.exponentialRampToValueAtTime(92, t + 1.2);
    o.start(t);
    o2.start(t);
    o.stop(t + 1.8);
    o2.stop(t + 1.8);
  },

  whoosh(dur = 0.45, { gain = 0.22, from = 400, to = 2600, panFrom = -0.8, panTo = 0.8, dt = 0 } = {}) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    const p = E.pan(panFrom);
    p.connect(g);
    E.out(g, undefined, 0.15);
    if (p.pan) {
      p.pan.setValueAtTime(panFrom, t);
      p.pan.linearRampToValueAtTime(panTo, t + dur);
    }
    const bp = E.filter('bandpass', from, 1.4, p);
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(to, t + dur * 0.7);
    bp.frequency.exponentialRampToValueAtTime(to * 0.6, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    E.noise(bp, t, dur + 0.05);
  },

  swish(dt = 0) {
    this.whoosh(0.18, { gain: 0.12, from: 1500, to: 5000, dt });
  },

  siren(dur = 3, gain = 0.06, dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.3);
    E.ahr(g, t, gain, 0.15, Math.max(0.01, dur - 0.5), 0.35);
    const lp = E.filter('lowpass', 2600, 0.7, g);
    const lfo = E.osc('triangle', 0.9);
    const lg = E.gain(320);
    lfo.connect(lg);
    for (const [type, base, det] of [
      ['sawtooth', 920, 0],
      ['square', 925, 12],
    ]) {
      const o = E.osc(type, base, E.gain(type === 'square' ? 0.4 : 1, lp));
      o.detune.value = det;
      lg.connect(o.frequency);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
    lfo.start(t);
    lfo.stop(t + dur + 0.1);
  },

  stamp(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    I.kick(E, t, 0.6, undefined, { from: 110, to: 45, decay: 0.25 });
    const g = E.gain(0);
    E.out(g, undefined, 0.25);
    E.env(g, t, 0.35, 0.001, 0.12);
    E.noise(E.filter('bandpass', 900, 0.8, g), t, 0.14);
  },

  boing(dt = 0, pitch = 1) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.15);
    E.env(g, t, 0.16, 0.004, 0.55);
    const o = E.osc('sine', 190 * pitch, g);
    o.frequency.setValueAtTime(170 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(330 * pitch, t + 0.45);
    const lfo = E.osc('sine', 17);
    const lg = E.gain(90 * pitch);
    lg.gain.setValueAtTime(90 * pitch, t);
    lg.gain.exponentialRampToValueAtTime(1, t + 0.5);
    lfo.connect(lg).connect(o.frequency);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.6);
    lfo.stop(t + 0.6);
  },

  pop(dt = 0, pitch = 1) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.1);
    E.env(g, t, 0.2, 0.002, 0.08);
    const o = E.osc('sine', 380 * pitch, g);
    o.frequency.exponentialRampToValueAtTime(1100 * pitch, t + 0.06);
    o.start(t);
    o.stop(t + 0.1);
  },

  poof(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.3);
    E.env(g, t, 0.3, 0.01, 0.45);
    const lp = E.filter('lowpass', 2200, 0.6, g);
    lp.frequency.exponentialRampToValueAtTime(260, t + 0.45);
    E.noise(lp, t, 0.5);
  },

  beep(freq = 1200, dur = 0.07, gain = 0.05, dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.05);
    E.ahr(g, t, gain, 0.002, dur, 0.02);
    const o = E.osc('square', freq, E.filter('lowpass', 3500, 0.7, g));
    o.start(t);
    o.stop(t + dur + 0.05);
  },

  tick(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g);
    E.env(g, t, 0.06, 0.001, 0.02);
    E.noise(E.filter('highpass', 3000, 0.7, g), t, 0.03);
  },

  glitch(dur = 0.4, gain = 0.07, dt = 0) {
    if (!ok()) return;
    let t = T(dt);
    const end = t + dur;
    while (t < end) {
      const d = rnd(0.015, 0.06);
      const g = E.gain(0);
      E.out(g);
      E.ahr(g, t, gain * rnd(0.5, 1), 0.001, d, 0.005);
      if (Math.random() < 0.5) {
        const o = E.osc(Math.random() < 0.5 ? 'square' : 'sawtooth', rnd(80, 2400), g);
        o.start(t);
        o.stop(t + d + 0.02);
      } else E.noise(E.filter('bandpass', rnd(500, 6000), 2, g), t, d + 0.02);
      t += d + rnd(0, 0.03);
    }
  },

  scratch(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.1);
    const bp = E.filter('bandpass', 800, 2.2, g);
    const f = bp.frequency;
    const steps = [
      [0, 300],
      [0.09, 2600],
      [0.17, 500],
      [0.27, 3200],
      [0.4, 250],
    ];
    for (const [d, v] of steps) f.linearRampToValueAtTime(v, t + d);
    const p = g.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(0.4, t + 0.02);
    p.linearRampToValueAtTime(0.1, t + 0.15);
    p.linearRampToValueAtTime(0.45, t + 0.2);
    p.exponentialRampToValueAtTime(0.0001, t + 0.42);
    E.noise(bp, t, 0.45);
  },

  /** music suddenly slows down and dies ("tape stop") */
  tapeStop(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g);
    E.env(g, t, 0.12, 0.005, 0.6);
    const o = E.osc('sawtooth', 220, E.filter('lowpass', 900, 1, g));
    o.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    o.start(t);
    o.stop(t + 0.7);
  },

  ding(dt = 0) {
    if (!ok()) return;
    I.bell(E, T(dt), 88, 0.12, undefined, 1.6, 0.4, 2);
    I.bell(E, T(dt + 0.12), 95, 0.1, undefined, 1.8, 0.4, 2);
  },

  achievement(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    [76, 83, 88].forEach((n, i) => I.musicBox(E, t + i * 0.07, n, 0.12, undefined, 0.4));
    I.pad(E, t, [64, 71, 76], 0.6, { gain: 0.04, attack: 0.05, release: 0.8, cutoff: 3000, type: 'triangle' });
  },

  errorChord(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    for (const [n, d] of [
      [79, 0],
      [74, 0],
      [72, 0.14],
      [67, 0.14],
    ]) {
      const g = E.gain(0);
      E.out(g, undefined, 0.15);
      E.ahr(g, t + d, 0.05, 0.004, 0.1, 0.25);
      const o = E.osc('triangle', 440 * Math.pow(2, (n - 69) / 12), g);
      o.start(t + d);
      o.stop(t + d + 0.45);
    }
  },

  crowd(dur = 4, gain = 0.12, dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.4);
    E.ahr(g, t, gain, 0.6, Math.max(0.01, dur - 1.4), 0.8);
    for (const f of [380, 720, 1300, 2300]) {
      const bp = E.filter('bandpass', f, 1.6);
      const am = E.gain(0.5, g);
      bp.connect(am);
      const lfo = E.osc('sine', rnd(0.3, 1.4));
      const lg = E.gain(0.35);
      lfo.connect(lg).connect(am.gain);
      lfo.start(t);
      lfo.stop(t + dur + 0.1);
      E.noise(bp, t, dur);
    }
  },

  refWhistle(dt = 0) {
    if (!ok()) return;
    I.whistle(E, T(dt), 0.12, { gain: 0.08, freq: 3150, trill: 34 });
    I.whistle(E, T(dt + 0.2), 0.7, { gain: 0.09, freq: 3150, trill: 34 });
  },

  apitoCall(dt = 0) {
    if (!ok()) return;
    I.whistle(E, T(dt), 0.11, { gain: 0.06, freq: 2900 });
    I.whistle(E, T(dt + 0.18), 0.11, { gain: 0.06, freq: 2900 });
    I.whistle(E, T(dt + 0.36), 0.5, { gain: 0.07, freq: 3100, trill: 26 });
  },

  cricket(dt = 0, reps = 2) {
    if (!ok()) return;
    let t = T(dt);
    for (let r = 0; r < reps; r++) {
      for (let i = 0; i < 3; i++) {
        const g = E.gain(0);
        E.out(g, undefined, 0.4);
        E.ahr(g, t, 0.035, 0.004, 0.025, 0.01);
        const o = E.osc('sine', 4600, g);
        o.start(t);
        o.stop(t + 0.05);
        t += 0.055;
      }
      t += 0.45;
    }
  },

  fwLaunch(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.2);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    const o = E.osc('sine', 700, g);
    o.frequency.exponentialRampToValueAtTime(2300, t + 1.0);
    o.start(t);
    o.stop(t + 1.2);
    const n = E.gain(0);
    E.out(n);
    E.ahr(n, t, 0.04, 0.05, 0.6, 0.3);
    E.noise(E.filter('highpass', 2500, 0.7, n), t, 1);
  },

  fwBoom(gain = 0.35, dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    const p = E.pan(rnd(-0.7, 0.7), g);
    E.out(g, undefined, 0.6);
    E.env(g, t, gain, 0.003, 1.3);
    const lp = E.filter('lowpass', 1500, 0.6, p);
    lp.frequency.exponentialRampToValueAtTime(180, t + 1);
    E.noise(lp, t, 1.4);
    I.kick(E, t, gain * 0.8, undefined, { from: 90, to: 35, decay: 0.5 });
    this.crackle(0.9, dt + 0.25, gain * 0.15);
  },

  crackle(dur = 1, dt = 0, gain = 0.05) {
    if (!ok()) return;
    const t0 = T(dt);
    const n = Math.floor(dur * 34);
    for (let i = 0; i < n; i++) {
      const t = t0 + Math.random() * dur;
      const g = E.gain(0);
      E.out(g);
      E.env(g, t, gain * rnd(0.3, 1), 0.001, 0.012);
      E.noise(E.filter('highpass', rnd(2000, 7000), 0.8, g), t, 0.02);
    }
  },

  airhorn(dt = 0) {
    if (!ok()) return;
    const pattern = [
      [0, 0.12],
      [0.17, 0.12],
      [0.34, 0.62],
    ];
    for (const [d, len] of pattern) {
      const t = T(dt + d);
      const g = E.gain(0);
      E.out(g, undefined, 0.2);
      E.ahr(g, t, 0.06, 0.008, len, 0.06);
      const pk = E.filter('peaking', 1800, 1, g);
      pk.gain.value = 8;
      for (const [f, det] of [
        [466, 0],
        [466, 14],
        [699, -8],
        [932, 6],
      ]) {
        const o = E.osc('sawtooth', f, pk);
        o.detune.value = det;
        o.start(t);
        o.stop(t + len + 0.1);
      }
    }
  },

  shatter(dt = 0, gain = 0.2) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.3);
    E.env(g, t, gain, 0.001, 0.35);
    E.noise(E.filter('highpass', 3200, 0.7, g), t, 0.4);
    for (let i = 0; i < 16; i++) {
      const tt = t + Math.random() * 0.4;
      const p = E.gain(0);
      E.out(p, undefined, 0.3);
      E.env(p, tt, gain * 0.25 * rnd(0.3, 1), 0.001, rnd(0.08, 0.4));
      const o = E.osc('sine', rnd(2400, 7200), p);
      o.start(tt);
      o.stop(tt + 0.45);
    }
  },

  riser(dur = 1.5, gain = 0.12, dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    const bp = E.filter('bandpass', 300, 1.5, g);
    bp.frequency.exponentialRampToValueAtTime(7000, t + dur);
    E.noise(bp, t, dur + 0.1);
    const o = E.osc('sawtooth', 110, E.gain(0.25, E.filter('lowpass', 2000, 0.7, g)));
    o.frequency.exponentialRampToValueAtTime(880, t + dur);
    o.start(t);
    o.stop(t + dur + 0.1);
  },

  heartbeat(dt = 0) {
    if (!ok()) return;
    I.kick(E, T(dt), 0.45, undefined, { from: 80, to: 40, decay: 0.2 });
    I.kick(E, T(dt + 0.22), 0.35, undefined, { from: 70, to: 38, decay: 0.25 });
  },

  sparkle(dt = 0, n = 6) {
    if (!ok()) return;
    const notes = [86, 90, 93, 98, 93, 95, 100, 102];
    for (let i = 0; i < n; i++) I.musicBox(E, T(dt + i * 0.055), notes[i % notes.length], 0.05, undefined, 0.6);
  },

  slide(up = true, dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.2);
    E.ahr(g, t, 0.08, 0.02, 0.45, 0.08);
    const o = E.osc('sine', up ? 500 : 1700, g);
    o.frequency.exponentialRampToValueAtTime(up ? 1700 : 450, t + 0.5);
    const lfo = E.osc('sine', 7);
    const lg = E.gain(25);
    lfo.connect(lg).connect(o.frequency);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.6);
    lfo.stop(t + 0.6);
  },

  zap(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.2);
    E.env(g, t, 0.07, 0.002, 0.25);
    const o = E.osc('square', 2200, E.filter('lowpass', 4000, 0.7, g));
    o.frequency.exponentialRampToValueAtTime(140, t + 0.25);
    o.start(t);
    o.stop(t + 0.3);
  },

  click(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g);
    E.env(g, t, 0.12, 0.001, 0.03);
    const o = E.osc('square', 2400, E.filter('bandpass', 2600, 2, g));
    o.start(t);
    o.stop(t + 0.04);
  },

  alarm(reps = 4, dt = 0) {
    if (!ok()) return;
    for (let i = 0; i < reps; i++) {
      const t = T(dt + i * 0.36);
      const g = E.gain(0);
      E.out(g, undefined, 0.1);
      E.ahr(g, t, 0.045, 0.005, 0.15, 0.03);
      const o = E.osc('square', i % 2 ? 554 : 698, E.filter('lowpass', 2500, 0.7, g));
      o.start(t);
      o.stop(t + 0.22);
    }
  },

  drumroll(dur = 1.5, dt = 0) {
    if (!ok()) return;
    const t0 = T(dt);
    const n = Math.floor(dur * 22);
    for (let i = 0; i < n; i++) {
      const k = i / n;
      I.snare(E, t0 + i * (dur / n), 0.04 + k * 0.12, undefined, { decay: 0.08, verb: 0.15 });
    }
  },

  timpaniHit(note = 38, dt = 0) {
    if (!ok()) return;
    I.timpani(E, T(dt), note, 0.5);
  },

  cymbal(dt = 0, gain = 0.14) {
    if (!ok()) return;
    I.cymbal(E, T(dt), gain);
  },

  cuica(dt = 0) {
    if (!ok()) return;
    I.cuica(E, T(dt), true, 0.12);
    I.cuica(E, T(dt + 0.2), false, 0.12);
  },

  sadTrombone(dt = 0) {
    if (!ok()) return;
    const notes = [
      [62, 0, 0.32],
      [61, 0.36, 0.32],
      [60, 0.72, 0.32],
      [59, 1.08, 1.1],
    ];
    for (const [n, d, len] of notes) {
      const t = T(dt + d);
      const g = E.gain(0);
      E.out(g, undefined, 0.2);
      E.ahr(g, t, 0.07, 0.03, len, 0.15);
      const lp = E.filter('lowpass', 1400, 1.5, g);
      const o = E.osc('sawtooth', 440 * Math.pow(2, (n - 12 - 69) / 12), lp);
      if (len > 0.5) {
        const lfo = E.osc('sine', 6);
        const lg = E.gain(9);
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t + 0.2);
        lfo.stop(t + len + 0.2);
      }
      o.start(t);
      o.stop(t + len + 0.2);
    }
  },

  buzz(dur = 0.8, dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.1);
    E.ahr(g, t, 0.05, 0.05, dur, 0.1);
    const o = E.osc('sawtooth', 165, E.filter('bandpass', 900, 1.2, g));
    const lfo = E.osc('sine', 38);
    const lg = E.gain(40);
    lfo.connect(lg).connect(o.frequency);
    o.start(t);
    lfo.start(t);
    o.stop(t + dur + 0.2);
    lfo.stop(t + dur + 0.2);
  },

  scuttle(dur = 0.6, dt = 0) {
    if (!ok()) return;
    const n = Math.floor(dur * 28);
    for (let i = 0; i < n; i++) {
      const t = T(dt + (i / n) * dur + Math.random() * 0.01);
      const g = E.gain(0);
      E.out(g);
      E.env(g, t, 0.05, 0.001, 0.015);
      E.noise(E.filter('bandpass', 2600 + Math.random() * 1500, 3, g), t, 0.02);
    }
  },

  chime(dt = 0) {
    if (!ok()) return;
    [72, 79, 84, 88].forEach((n, i) => I.bell(E, T(dt + i * 0.09), n, 0.06, undefined, 1.8, 0.5, 2));
  },

  kiss(dt = 0) {
    if (!ok()) return;
    const t = T(dt);
    const g = E.gain(0);
    E.out(g, undefined, 0.25);
    E.ahr(g, t, 0.18, 0.005, 0.03, 0.08);
    const bp = E.filter('bandpass', 1500, 4, g);
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
    E.noise(bp, t, 0.12);
    this.pop(dt + 0.05, 1.4);
  },
};
