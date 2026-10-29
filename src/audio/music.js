import { audio } from './engine.js';
import * as I from './instruments.js';

/* Sequenced tracks. step(E, track, i, t) is called for every step (16th note by default)
   slightly ahead of time by the scheduler. All melodies are original, except the Bridal Chorus
   (Wagner, 1850 — public domain). */

const sd = (tr) => 60 / tr.bpm / tr.stepsPerBeat; // step duration in seconds

/* ─────────────── 1. ROMANTIC — music box lullaby (D major) ─────────────── */
const ROM_CHORDS = [
  [62, 66, 69],
  [59, 62, 66],
  [55, 59, 62],
  [57, 61, 64],
  [62, 66, 69],
  [59, 62, 66],
  [52, 55, 59],
  [57, 61, 64, 67],
];
const ROM_MEL = [
  [[0, 78], [6, 76], [8, 74], [12, 81]],
  [[0, 78], [8, 74], [12, 71]],
  [[0, 74], [4, 76], [8, 78], [12, 79]],
  [[0, 81], [8, 76]],
  [[0, 78], [6, 81], [8, 86], [14, 85]],
  [[0, 83], [8, 78]],
  [[0, 79], [4, 78], [8, 76], [12, 74]],
  [[0, 76], [8, 73], [12, 76]],
];
function romanticStep(E, tr, i, t) {
  const b = Math.floor(i / 16) % 8;
  const s = i % 16;
  const ch = ROM_CHORDS[b];
  const beat = 60 / tr.bpm;
  const soft = tr.params.soft;
  if (s === 0) {
    I.pad(E, t, ch, beat * 4, { gain: soft ? 0.022 : 0.032, cutoff: 950, type: 'triangle', attack: 0.9, release: 1.6, dest: tr.out });
    if (!soft) I.bass(E, t, ch[0] - 24, beat * 1.8, { gain: 0.09, type: 'sine', cutoff: 280, dest: tr.out });
  }
  if (s === 8 && !soft) I.bass(E, t, ch[2] - 24, beat * 1.8, { gain: 0.07, type: 'sine', cutoff: 280, dest: tr.out });
  if (s % 2 === 0) {
    const arp = [ch[0], ch[2], ch[1] + 12, ch[2], ch[0] + 12, ch[2], ch[1] + 12, ch[2] + 12];
    I.musicBox(E, t, arp[s / 2], soft ? 0.045 : 0.06, tr.out, 0.5);
  }
  // melody enters on the second pass of the intro bar
  if (i >= 16 || soft) for (const [st, n] of ROM_MEL[b]) if (st === s) I.musicBox(E, t, n, soft ? 0.12 : 0.15, tr.out, 0.6);
}
audio.define('romantic', { bpm: 74, loop: true, length: 128, step: romanticStep });
audio.define('credits', { bpm: 64, loop: true, length: 128, params: { soft: true }, volume: 0.85, step: romanticStep });

/* ─────────────── 2. NEWS — urgent newsroom sting (D minor) ─────────────── */
const DM = [62, 65, 69];
const BB = [58, 62, 65];
const CM = [60, 64, 67];
const AM = [57, 61, 64];
audio.define('news', {
  bpm: 124,
  loop: true,
  length: 64,
  step(E, tr, i, t) {
    const b = Math.floor(i / 16) % 4;
    const s = i % 16;
    const d = sd(tr);
    if (s === 0) I.timpani(E, t, 38, 0.4, tr.out);
    if (s === 10 && b % 2 === 1) I.timpani(E, t, 38, 0.3, tr.out);
    const stabs = b === 3 ? [[0, DM, 2], [4, AM, 10]] : [[0, DM, 2], [3, DM, 2], [6, DM, 3], [10, BB, 2], [12, CM, 3]];
    for (const [st, ch, len] of stabs) if (st === s) I.brass(E, t, ch.concat(ch[0] - 12), d * len, { gain: 0.05, dest: tr.out, bright: 2600 });
    I.hat(E, t, s % 2 ? 0.018 : 0.04, tr.out);
    if (s % 2 === 0) I.bass(E, t, (b === 2 ? 34 : b === 3 ? 33 : 38), d * 1.6, { gain: 0.1, cutoff: 380, dest: tr.out });
    if (s === 4 || s === 12) I.snare(E, t, 0.1, tr.out);
    if (b === 0 && [0, 2, 4, 7].includes(s)) I.bell(E, t, [86, 81, 86, 89][[0, 2, 4, 7].indexOf(s)], 0.04, tr.out, 0.8, 0.3, 3);
  },
});

/* ─────────────── 3. FUNK — tamborzão-ish carioca groove ─────────────── */
audio.define('funk', {
  bpm: 130,
  loop: true,
  length: 32,
  step(E, tr, i, t) {
    const s = i % 16;
    const b = Math.floor(i / 16) % 2;
    const d = sd(tr);
    const kicks = b ? [0, 3, 7, 10, 14] : [0, 3, 7, 10];
    if (kicks.includes(s)) {
      I.kick(E, t, 0.5, tr.out, { from: 160, to: 45, decay: 0.32 });
      I.bass(E, t, s === 10 ? 41 : 38, d * 2.2, { gain: 0.12, type: 'square', cutoff: 260, glide: 1.6, dest: tr.out });
    }
    if (s === 4 || s === 12) I.clap(E, t, 0.18, tr.out);
    if ([2, 5, 8, 11, 14].includes(s)) I.surdo(E, t, s % 3 === 2 ? 150 : 112, 0.18, tr.out, true);
    if (s % 4 === 2) I.hat(E, t, 0.05, tr.out);
    if (b === 1 && s === 13) I.cuica(E, t, true, 0.09, tr.out);
    if (b === 0 && s === 15) I.cuica(E, t, false, 0.07, tr.out);
  },
});

/* ─────────────── 4. SCANNER — sci-fi arpeggiator (A minor) ─────────────── */
const SC_CH = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];
audio.define('scanner', {
  bpm: 136,
  loop: true,
  length: 32,
  params: { glitch: 0 },
  step(E, tr, i, t) {
    const s = i % 32;
    const ch = SC_CH[Math.floor(s / 8)];
    const d = sd(tr);
    const g = tr.params.glitch;
    let n = ch[[0, 1, 2, 1][s % 4]] + 12 + (s % 8 >= 4 ? 12 : 0);
    if (g && Math.random() < g * 0.5) n += [12, -12, 7, 19][Math.floor(Math.random() * 4)];
    I.chip(E, t, n, d * 0.9, { gain: 0.035, type: s % 2 ? 'square' : 'sawtooth', dest: tr.out });
    if (s % 8 === 0) I.kick(E, t, 0.42, tr.out);
    if (s % 16 === 8) I.clap(E, t, 0.12, tr.out);
    if (s % 2 === 1) I.hat(E, t, 0.03, tr.out);
    if (s % 4 === 0) I.bass(E, t, ch[0] - 12, d * 3, { gain: 0.1, cutoff: 500, dest: tr.out });
    if (g > 0.5 && Math.random() < 0.3) I.chip(E, t, 96 + Math.floor(Math.random() * 12), d * 0.5, { gain: 0.03, dest: tr.out });
  },
});

/* ─────────────── 5. STADIUM — surdo + crowd claps ─────────────── */
audio.define('stadium', {
  bpm: 112,
  loop: true,
  length: 16,
  step(E, tr, i, t) {
    const s = i % 16;
    if (s === 0 || s === 8) I.surdo(E, t, 52, 0.5, tr.out);
    if ([0, 6, 12].includes(s)) {
      I.clap(E, t, 0.16, tr.out);
      I.clap(E, t + 0.012, 0.1, tr.out);
    }
    if (s % 4 === 2) I.shaker(E, t, 0.03, tr.out);
  },
});

/* ─────────────── 6. CHIP — 8-bit system overload (C major) ─────────────── */
const CHIP_MEL = [
  [84, 88, 91, 88, 93, 91, 88, 86],
  [84, 84, 86, 88, 86, 0, 84, 0],
  [88, 91, 93, 91, 96, 95, 93, 91],
  [93, 91, 88, 86, 84, 0, 0, 0],
];
const CHIP_BASS = [48, 43, 41, 43];
audio.define('chip', {
  bpm: 150,
  loop: true,
  length: 64,
  step(E, tr, i, t) {
    const b = Math.floor(i / 16) % 4;
    const s = i % 16;
    const d = sd(tr);
    if (s % 2 === 0) {
      const n = CHIP_MEL[b][s / 2];
      if (n) I.chip(E, t, n, d * 1.7, { gain: 0.035, dest: tr.out });
      I.chip(E, t, CHIP_BASS[b] + (s % 4 === 2 ? 7 : 0), d * 1.6, { type: 'triangle', gain: 0.09, dest: tr.out });
    }
    if (s % 4 === 0) I.kick(E, t, 0.3, tr.out, { from: 200, to: 60, decay: 0.15 });
    if (s % 8 === 4) I.snare(E, t, 0.09, tr.out, { decay: 0.1, verb: 0 });
    if (s % 2 === 1) I.hat(E, t, 0.025, tr.out);
  },
});

/* ─────────────── 7. WEDDING — Bridal Chorus (Wagner, public domain), D major ─────────────── */
const BRIDAL = [
  [0, 69, 4], [4, 74, 3], [7, 74, 1], [8, 74, 8],
  [16, 69, 4], [20, 76, 3], [23, 73, 1], [24, 74, 8],
  [32, 69, 4], [36, 74, 3], [39, 79, 1], [40, 79, 4], [44, 78, 3], [47, 76, 1],
  [48, 74, 3], [51, 73, 1], [52, 74, 3], [55, 76, 1], [56, 69, 8],
];
const BRIDAL_CH = [
  [62, 66, 69], [62, 66, 69],
  [57, 61, 64, 67], [62, 66, 69],
  [55, 59, 62], [62, 66, 69],
  [57, 61, 64], [57, 61, 64, 67],
];
audio.define('bridal', {
  bpm: 78,
  loop: true,
  length: 64,
  step(E, tr, i, t) {
    const s = i % 64;
    const d = sd(tr);
    const half = Math.floor(s / 8);
    const ch = BRIDAL_CH[half];
    if (s % 8 === 0) {
      I.strings(E, t, ch.map((n) => n - 12), d * 8, { gain: 0.03, attack: 0.35, release: 1, dest: tr.out });
      I.bass(E, t, ch[0] - 24, d * 7.5, { gain: 0.08, type: 'sawtooth', cutoff: 520, dest: tr.out });
    }
    if (s % 16 === 0) I.bell(E, t, 86, 0.035, tr.out, 2.5, 0.6);
    if (s % 2 === 0) {
      const harp = [ch[0] - 12, ch[1] - 12, ch[2] - 12, ch[0], ch[1], ch[2], ch[0] + 12, ch[1] + 12];
      I.pluck(E, t, harp[(s % 16) / 2], { gain: 0.06, decay: 1.4, bright: 4000, dest: tr.out, verb: 0.6 });
    }
    for (const [st, n, len] of BRIDAL) if (st === s) I.lead(E, t, n, d * len * 0.94, { gain: 0.065, cutoff: 2600, vibrato: 9, attack: 0.07, dest: tr.out, octaveDouble: 1, verb: 0.7 });
  },
});

/** the "EU VOS DECLARO..." suspense: tremolo strings + timpani roll */
audio.define('declare', {
  bpm: 60,
  loop: true,
  length: 16,
  step(E, tr, i, t) {
    const d = sd(tr);
    if (i % 16 === 0) I.strings(E, t, [45, 57, 61, 64, 67], d * 16, { gain: 0.035 + Math.min(i / 64, 1) * 0.02, tremolo: 11, attack: 1.5, dest: tr.out });
    I.timpani(E, t, 33, 0.05 + Math.min(i / 48, 1) * 0.12, tr.out);
    I.timpani(E, t + d / 2, 33, 0.04 + Math.min(i / 48, 1) * 0.1, tr.out);
  },
});

/** triumphant fanfare (8th-note triplets) then a festive orchestral march loop */
const FANF = [
  [0, 74], [1, 74], [2, 74], [3, 74, 3],
  [6, 74], [7, 74], [8, 74], [9, 78, 3],
  [12, 78], [13, 78], [14, 78], [15, 81, 3],
  [18, 81], [19, 81], [20, 81], [21, 86, 3],
];
const MARCH = [
  [62, 66, 69], [55, 59, 62], [57, 61, 64], [62, 66, 69],
];
audio.define('fanfare', {
  bpm: 112,
  stepsPerBeat: 3,
  loop: true,
  length: 72,
  step(E, tr, i, t) {
    const d = sd(tr);
    if (i < 24) {
      for (const [st, n, len] of FANF) if (st === i) I.brass(E, t, [n, n - 12], d * (len || 0.8), { gain: 0.07, dest: tr.out, bright: 3600 });
      if (i % 3 === 0) I.timpani(E, t, 38, 0.15 + i / 80, tr.out);
      return;
    }
    const k = (i - 24) % 48;
    const ch = MARCH[Math.floor(k / 12)];
    if (i === 24) {
      I.cymbal(E, t, 0.16, tr.out, 3);
      I.timpani(E, t, 38, 0.5, tr.out);
    }
    if (k % 12 === 0) {
      I.strings(E, t, ch, d * 12, { gain: 0.04, attack: 0.05, dest: tr.out });
      I.brass(E, t, ch.concat(ch[0] + 12), d * 2, { gain: 0.06, dest: tr.out });
      I.bell(E, t, ch[2] + 24, 0.04, tr.out, 1.5);
      I.bass(E, t, ch[0] - 24, d * 5, { gain: 0.11, cutoff: 500, dest: tr.out });
    }
    if (k % 12 === 6) {
      I.brass(E, t, ch, d * 1.5, { gain: 0.045, dest: tr.out });
      I.bass(E, t, ch[2] - 24, d * 5, { gain: 0.09, cutoff: 500, dest: tr.out });
    }
    if (k % 3 === 0) I.snare(E, t, k % 6 === 0 ? 0.12 : 0.06, tr.out, { decay: 0.1 });
    if (k % 6 === 0) I.kick(E, t, 0.3, tr.out);
  },
});

/* ─────────────── 8a. MUSETTE — Parisian accordion waltz (A minor, 3/4) ─────────────── */
const MUS_MEL = [
  [[0, 76, 2], [2, 81, 1], [3, 84, 1], [4, 83, 1], [5, 81, 1]],
  [[0, 80, 3], [3, 76, 1], [4, 77, 1], [5, 80, 1]],
  [[0, 81, 2], [2, 83, 1], [3, 84, 1], [4, 86, 1], [5, 88, 1]],
  [[0, 86, 1], [1, 84, 1], [2, 83, 1], [3, 80, 1], [4, 81, 2]],
];
const MUS_CH = [
  [45, [57, 60, 64]],
  [40, [56, 59, 62, 64]],
  [45, [57, 60, 64]],
  [40, [56, 59, 64]],
];
audio.define('musette', {
  bpm: 176,
  stepsPerBeat: 2,
  loop: true,
  length: 24,
  step(E, tr, i, t) {
    const b = Math.floor(i / 6) % 4;
    const s = i % 6;
    const d = sd(tr);
    const [root, ch] = MUS_CH[b];
    if (s === 0) I.bass(E, t, root, d * 1.6, { gain: 0.11, type: 'triangle', cutoff: 700, dest: tr.out });
    if (s === 2 || s === 4) I.accordion(E, t, ch, d * 0.9, { gain: 0.022, dest: tr.out });
    for (const [st, n, len] of MUS_MEL[b]) if (st === s) I.accordion(E, t, [n], d * len * 0.95, { gain: 0.05, dest: tr.out });
  },
});

/* ─────────────── 8b. BOSSA — Rio sunset groove (D major 7ths) ─────────────── */
const BOSSA_CH = [
  [50, [62, 66, 69, 73]],
  [47, [59, 62, 66, 69]],
  [52, [55, 59, 62, 64]],
  [45, [55, 61, 64, 67]],
];
audio.define('bossa', {
  bpm: 132,
  loop: true,
  length: 64,
  step(E, tr, i, t) {
    const b = Math.floor(i / 16) % 4;
    const s = i % 16;
    const [root, ch] = BOSSA_CH[b];
    if ([0, 3, 6, 10, 13].includes(s)) ch.forEach((n, k) => I.pluck(E, t + k * 0.012, n, { gain: 0.05, decay: 0.5, bright: 2400, dest: tr.out, verb: 0.3 }));
    if (s === 0 || s === 8) I.pluck(E, t, root - 12, { gain: 0.13, decay: 0.8, bright: 900, dest: tr.out, verb: 0.1 });
    if (s === 6 || s === 14) I.pluck(E, t, root - 5, { gain: 0.1, decay: 0.6, bright: 900, dest: tr.out, verb: 0.1 });
    I.shaker(E, t, s % 4 === 2 ? 0.035 : 0.018, tr.out);
    if ([0, 3, 6, 10, 12].includes(s)) I.rim(E, t, 0.05, tr.out);
    if (s === 0) I.kick(E, t, 0.25, tr.out, { from: 110, to: 50, decay: 0.25 });
  },
});

/* ─────────────── 10. FESTA — full samba batucada + brass (D major) ─────────────── */
const FESTA_MEL = [
  [[0, 74, 2], [3, 78, 1], [4, 81, 2], [6, 78, 2], [10, 81, 1], [11, 83, 1], [12, 81, 4]],
  [[0, 83, 2], [3, 79, 1], [4, 83, 2], [6, 86, 2], [10, 83, 1], [11, 81, 1], [12, 79, 4]],
  [[0, 81, 2], [3, 76, 1], [4, 81, 2], [6, 85, 2], [10, 88, 1], [11, 86, 1], [12, 85, 4]],
  [[0, 86, 3], [3, 85, 1], [4, 83, 2], [6, 81, 2], [8, 78, 2], [10, 81, 2], [12, 74, 4]],
];
const FESTA_ROOT = [38, 43, 45, 38];
const FESTA_CH = [[62, 66, 69], [59, 62, 67], [61, 64, 69], [62, 66, 69]];
const TELECO = [0, 2, 3, 5, 6, 8, 10, 11, 13, 14];
const CAIXA_ACC = [0, 3, 6, 8, 11, 14];
audio.define('festa', {
  bpm: 128,
  loop: true,
  length: 64,
  params: { brass: true },
  step(E, tr, i, t) {
    const b = Math.floor(i / 16) % 4;
    const s = i % 16;
    const d = sd(tr);
    const o = tr.out;
    // surdos: segunda (1&3), primeira (2&4, strongest), cortador syncopations
    if (s === 0 || s === 8) I.surdo(E, t, 74, 0.32, o, true);
    if (s === 4 || s === 12) I.surdo(E, t, 55, 0.5, o);
    if ([2, 6, 7, 10, 14].includes(s) && (b % 2 || s !== 7)) I.surdo(E, t, 96, 0.2, o, true);
    if (s === 0 || s === 8) I.kick(E, t, 0.35, o);
    I.snare(E, t, CAIXA_ACC.includes(s) ? 0.09 : 0.035, o, { tone: 260, decay: 0.07, verb: 0.05 });
    if (TELECO.includes(s)) I.tamborim(E, t, 0.07, o);
    if ([0, 3, 8, 11].includes(s)) I.agogo(E, t, true, 0.045, o);
    if ([6, 14].includes(s)) I.agogo(E, t, false, 0.045, o);
    I.shaker(E, t, s % 4 === 3 ? 0.04 : 0.02, o);
    if (s === 4 || s === 12) I.clap(E, t, 0.1, o);
    // bass
    const r = FESTA_ROOT[b];
    const bl = { 0: r, 3: r + 12, 6: r, 8: r + 7, 11: r + 12, 12: r, 14: r + 7 };
    if (bl[s] !== undefined) I.bass(E, t, bl[s], d * 1.8, { gain: 0.12, cutoff: 600, dest: o });
    // brass riff + stabs
    if (tr.params.brass) {
      for (const [st, n, len] of FESTA_MEL[b]) if (st === s) I.brass(E, t, [n, n - 12], d * len * 0.9, { gain: 0.045, dest: o, bright: 3400 });
      if (s === 14) I.brass(E, t, FESTA_CH[(b + 1) % 4], d * 1.5, { gain: 0.035, dest: o });
    }
    if (b === 3 && (s === 12 || s === 14)) I.whistle(E, t, 0.09, { gain: 0.045, freq: 2950, dest: o });
  },
});
