import { midi } from './engine.js';

/* Synth voices & drums. Every function schedules one note at AudioContext time `t`.
   `dest` is a track output (music) or undefined (sfx bus). Frequencies are in Hz unless the
   parameter is called `note` (MIDI number). */

export function musicBox(E, t, note, gain = 0.15, dest, verb = 0.55) {
  const f = midi(note);
  const g = E.gain(0);
  E.out(g, dest, verb);
  E.env(g, t, gain, 0.003, 1.6);
  const partials = [
    [1, 1],
    [2, 0.28],
    [4.2, 0.08],
    [6.1, 0.03],
  ];
  for (const [m, a] of partials) {
    const o = E.osc('sine', f * m);
    const pg = E.gain(a, g);
    o.connect(pg);
    o.start(t);
    o.stop(t + 1.8);
  }
}

export function bell(E, t, note, gain = 0.12, dest, dur = 2.2, verb = 0.5, ratio = 3.5) {
  const f = midi(note);
  const car = E.osc('sine', f);
  const mod = E.osc('sine', f * ratio);
  const mg = E.gain(f * 2.2);
  mg.gain.setValueAtTime(f * 2.2, t);
  mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.7);
  mod.connect(mg).connect(car.frequency);
  const g = E.gain(0);
  E.out(g, dest, verb);
  E.env(g, t, gain, 0.002, dur);
  car.connect(g);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.1);
  mod.stop(t + dur + 0.1);
}

export function pad(E, t, notes, dur, { gain = 0.05, cutoff = 1100, type = 'sawtooth', attack = 0.6, release = 1.2, detune = 9, verb = 0.6, dest } = {}) {
  const g = E.gain(0);
  const lp = E.filter('lowpass', cutoff, 0.5, g);
  E.out(g, dest, verb);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, t + Math.max(attack, dur - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  for (const n of notes) {
    for (const d of [-detune, detune]) {
      const o = E.osc(type, midi(n), lp);
      o.detune.value = d;
      o.start(t);
      o.stop(t + dur + release + 0.1);
    }
  }
}

export function strings(E, t, notes, dur, { gain = 0.045, cutoff = 2400, attack = 0.25, release = 0.9, tremolo = 0, dest, verb = 0.65 } = {}) {
  const g = E.gain(0);
  const lp = E.filter('lowpass', cutoff, 0.6, g);
  E.out(g, dest, verb);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, t + Math.max(attack, dur - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  const vib = E.osc('sine', 5.3);
  const vg = E.gain(5);
  vib.connect(vg);
  vib.start(t);
  vib.stop(t + dur + release + 0.1);
  let target = lp;
  if (tremolo) {
    const trem = E.gain(0.6, lp);
    const lfo = E.osc('square', tremolo);
    const lg = E.gain(0.4);
    lfo.connect(lg).connect(trem.gain);
    lfo.start(t);
    lfo.stop(t + dur + release + 0.1);
    target = trem;
  }
  for (const n of notes) {
    for (const d of [-7, 0, 7]) {
      const o = E.osc('sawtooth', midi(n), target);
      o.detune.value = d;
      vg.connect(o.detune);
      o.start(t);
      o.stop(t + dur + release + 0.1);
    }
  }
}

/** expressive monophonic lead (violin / brass / flute depending on options) */
export function lead(E, t, note, dur, { type = 'sawtooth', gain = 0.08, cutoff = 2600, attack = 0.06, release = 0.35, vibrato = 6, verb = 0.5, dest, octaveDouble = 0 } = {}) {
  const f = midi(note);
  const g = E.gain(0);
  const lp = E.filter('lowpass', cutoff, 0.8, g);
  E.out(g, dest, verb);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain * 0.85, t + Math.max(attack, dur - 0.02));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  const vib = E.osc('sine', 5.6);
  const vg = E.gain(0);
  vg.gain.setValueAtTime(0, t);
  vg.gain.linearRampToValueAtTime(vibrato, t + Math.min(0.35, dur));
  vib.connect(vg);
  const voices = octaveDouble ? [1, 2] : [1];
  for (const m of voices) {
    const o = E.osc(type, f * m, lp);
    if (m === 2) o.type = 'triangle';
    vg.connect(o.detune);
    o.start(t);
    o.stop(t + dur + release + 0.1);
  }
  vib.start(t);
  vib.stop(t + dur + release + 0.1);
}

export function brass(E, t, notes, dur, { gain = 0.07, dest, verb = 0.3, bright = 3200 } = {}) {
  const g = E.gain(0);
  const lp = E.filter('lowpass', 500, 1.2, g);
  E.out(g, dest, verb);
  lp.frequency.setValueAtTime(500, t);
  lp.frequency.exponentialRampToValueAtTime(bright, t + 0.05);
  lp.frequency.exponentialRampToValueAtTime(bright * 0.45, t + 0.05 + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.setValueAtTime(gain * 0.8, t + dur);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.18);
  for (const n of notes) {
    for (const d of [-6, 6]) {
      const o = E.osc('sawtooth', midi(n), lp);
      o.detune.value = d;
      o.start(t);
      o.stop(t + dur + 0.25);
    }
  }
}

/** plucked string (nylon guitar / harp) */
export function pluck(E, t, note, { gain = 0.12, decay = 0.9, bright = 3500, dest, verb = 0.35 } = {}) {
  const f = midi(note);
  const g = E.gain(0);
  const lp = E.filter('lowpass', bright, 0.9, g);
  E.out(g, dest, verb);
  lp.frequency.setValueAtTime(bright, t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + decay * 0.6);
  E.env(g, t, gain, 0.003, decay);
  const o1 = E.osc('triangle', f, lp);
  const o2 = E.osc('sawtooth', f * 1.002);
  o2.connect(E.gain(0.25, lp));
  o1.start(t);
  o2.start(t);
  o1.stop(t + decay + 0.1);
  o2.stop(t + decay + 0.1);
}

/** French musette accordion: three reeds slightly detuned => that wobbly café sound */
export function accordion(E, t, notes, dur, { gain = 0.05, dest, verb = 0.25 } = {}) {
  const g = E.gain(0);
  const bp = E.filter('lowpass', 2600, 0.7, g);
  E.out(g, dest, verb);
  E.ahr(g, t, gain, 0.03, Math.max(0.01, dur - 0.06), 0.08);
  for (const n of [].concat(notes)) {
    for (const d of [-14, 0, 15]) {
      const o = E.osc('square', midi(n), bp);
      o.detune.value = d;
      o.start(t);
      o.stop(t + dur + 0.15);
    }
  }
}

export function chip(E, t, note, dur, { type = 'square', gain = 0.05, dest } = {}) {
  const g = E.gain(0);
  E.out(g, dest, 0.12);
  E.ahr(g, t, gain, 0.003, Math.max(0.01, dur * 0.7), dur * 0.3 + 0.02);
  const o = E.osc(type, midi(note), g);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function bass(E, t, note, dur, { gain = 0.16, type = 'sawtooth', cutoff = 420, dest, glide = 0 } = {}) {
  const f = midi(note);
  const g = E.gain(0);
  const lp = E.filter('lowpass', cutoff, 2, g);
  E.out(g, dest, 0);
  E.ahr(g, t, gain, 0.006, Math.max(0.02, dur - 0.05), 0.08);
  const o = E.osc(type, glide ? f * glide : f, lp);
  if (glide) o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
  const sub = E.osc('sine', f, g);
  o.start(t);
  sub.start(t);
  o.stop(t + dur + 0.1);
  sub.stop(t + dur + 0.1);
}

/* ─────────────────────────────── drums ─────────────────────────────── */

export function kick(E, t, gain = 0.5, dest, { from = 150, to = 42, decay = 0.38 } = {}) {
  const g = E.gain(0);
  E.out(g, dest);
  E.env(g, t, gain, 0.002, decay);
  const o = E.osc('sine', from, g);
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + 0.11);
  o.start(t);
  o.stop(t + decay + 0.05);
  const c = E.gain(0);
  E.out(c, dest);
  E.env(c, t, gain * 0.25, 0.001, 0.015);
  E.noise(E.filter('highpass', 3000, 0.7, c), t, 0.03);
}

export function snare(E, t, gain = 0.22, dest, { tone = 190, decay = 0.16, verb = 0.12 } = {}) {
  const g = E.gain(0);
  E.out(g, dest, verb);
  E.env(g, t, gain, 0.001, decay);
  E.noise(E.filter('highpass', 1400, 0.7, g), t, decay + 0.05);
  const b = E.gain(0);
  E.out(b, dest);
  E.env(b, t, gain * 0.7, 0.001, 0.08);
  const o = E.osc('triangle', tone, b);
  o.start(t);
  o.stop(t + 0.12);
}

export function hat(E, t, gain = 0.06, dest, open = false) {
  const g = E.gain(0);
  E.out(g, dest);
  E.env(g, t, gain, 0.001, open ? 0.22 : 0.035);
  E.noise(E.filter('highpass', 7600, 0.8, g), t, open ? 0.3 : 0.06);
}

export function clap(E, t, gain = 0.2, dest) {
  const g = E.gain(0);
  E.out(g, dest, 0.25);
  const bp = E.filter('bandpass', 1300, 1.2, g);
  const p = g.gain;
  p.setValueAtTime(0.0001, t);
  for (let i = 0; i < 3; i++) {
    p.linearRampToValueAtTime(gain, t + i * 0.011 + 0.001);
    p.linearRampToValueAtTime(gain * 0.2, t + i * 0.011 + 0.009);
  }
  p.linearRampToValueAtTime(gain, t + 0.035);
  p.exponentialRampToValueAtTime(0.0001, t + 0.22);
  E.noise(bp, t, 0.25);
}

export function surdo(E, t, freq = 58, gain = 0.45, dest, muted = false) {
  const g = E.gain(0);
  E.out(g, dest, 0.12);
  E.env(g, t, gain, 0.003, muted ? 0.16 : 0.75);
  const o = E.osc('sine', freq * 1.5, g);
  o.frequency.setValueAtTime(freq * 1.5, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
  o.start(t);
  o.stop(t + 0.9);
  const n = E.gain(0);
  E.out(n, dest);
  E.env(n, t, gain * 0.35, 0.001, 0.05);
  E.noise(E.filter('lowpass', 900, 0.7, n), t, 0.08);
}

export function tamborim(E, t, gain = 0.11, dest) {
  const g = E.gain(0);
  E.out(g, dest, 0.1);
  E.env(g, t, gain, 0.001, 0.07);
  const o = E.osc('triangle', 820, g);
  o.frequency.setValueAtTime(980, t);
  o.frequency.exponentialRampToValueAtTime(760, t + 0.04);
  o.start(t);
  o.stop(t + 0.1);
  E.noise(E.filter('highpass', 4000, 0.7, g), t, 0.03);
}

export function agogo(E, t, high = true, gain = 0.07, dest) {
  const f = high ? 1180 : 820;
  const g = E.gain(0);
  E.out(g, dest, 0.2);
  E.env(g, t, gain, 0.001, 0.32);
  for (const [m, a] of [
    [1, 1],
    [2.68, 0.35],
  ]) {
    const o = E.osc('sine', f * m);
    o.connect(E.gain(a, g));
    o.start(t);
    o.stop(t + 0.4);
  }
}

export function shaker(E, t, gain = 0.04, dest) {
  const g = E.gain(0);
  E.out(g, dest);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  E.noise(E.filter('bandpass', 6500, 1.1, g), t, 0.09);
}

export function rim(E, t, gain = 0.08, dest) {
  const g = E.gain(0);
  E.out(g, dest, 0.15);
  E.env(g, t, gain, 0.001, 0.045);
  const o = E.osc('square', 1700, E.filter('bandpass', 1900, 3, g));
  o.start(t);
  o.stop(t + 0.06);
}

export function timpani(E, t, note = 38, gain = 0.4, dest) {
  const f = midi(note);
  const g = E.gain(0);
  E.out(g, dest, 0.5);
  E.env(g, t, gain, 0.004, 1.4);
  const o = E.osc('sine', f * 1.05, g);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.1);
  const o2 = E.osc('sine', f * 1.5, E.gain(0.3, g));
  o.start(t);
  o2.start(t);
  o.stop(t + 1.5);
  o2.stop(t + 1.5);
  const n = E.gain(0);
  E.out(n, dest);
  E.env(n, t, gain * 0.4, 0.002, 0.12);
  E.noise(E.filter('lowpass', 700, 0.7, n), t, 0.15);
}

export function cymbal(E, t, gain = 0.12, dest, dur = 2.2) {
  const g = E.gain(0);
  E.out(g, dest, 0.4);
  E.env(g, t, gain, 0.003, dur);
  E.noise(E.filter('highpass', 5200, 0.6, g), t, dur);
  const b = E.gain(0);
  E.out(b, dest);
  E.env(b, t, gain * 0.6, 0.002, dur * 0.4);
  E.noise(E.filter('bandpass', 8200, 4, b), t, dur * 0.5);
}

/** the cuíca: that squeaky "uh-UH" of samba */
export function cuica(E, t, up = true, gain = 0.1, dest) {
  const g = E.gain(0);
  E.out(g, dest, 0.2);
  const bp = E.filter('bandpass', 1100, 3, g);
  const o = E.osc('sawtooth', 300, bp);
  const [a, b] = up ? [320, 640] : [620, 330];
  o.frequency.setValueAtTime(a, t);
  o.frequency.exponentialRampToValueAtTime(b, t + 0.13);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.start(t);
  o.stop(t + 0.22);
}

/** samba whistle (no pea): pure shrill tone. With trill => referee pea whistle. */
export function whistle(E, t, dur = 0.2, { gain = 0.07, freq = 2950, trill = 0, dest } = {}) {
  const g = E.gain(0);
  E.out(g, dest, 0.25);
  E.ahr(g, t, gain, 0.012, Math.max(0.01, dur - 0.03), 0.04);
  const o = E.osc('sine', freq, g);
  if (trill) {
    const lfo = E.osc('square', trill);
    const lg = E.gain(freq * 0.06);
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.1);
  }
  const breath = E.gain(0);
  E.out(breath, dest);
  E.ahr(breath, t, gain * 0.25, 0.01, Math.max(0.01, dur - 0.03), 0.03);
  E.noise(E.filter('bandpass', freq, 2, breath), t, dur + 0.05);
  o.start(t);
  o.stop(t + dur + 0.08);
}
