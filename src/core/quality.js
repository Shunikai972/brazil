import { gsap } from 'gsap';

/**
 * Device quality tier + reduced-motion preference. The tier drives particle budgets and canvas
 * resolution, and is lowered automatically if the frame rate collapses.
 */
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)').matches;
const cores = navigator.hardwareConcurrency || 4;
const mem = navigator.deviceMemory || 4;
const small = Math.min(window.innerWidth, window.innerHeight) < 600;

const TIERS = {
  high: { dpr: Math.min(window.devicePixelRatio || 1, 2), particles: 2600, confetti: 1 },
  mid: { dpr: Math.min(window.devicePixelRatio || 1, 1.5), particles: 1500, confetti: 0.65 },
  low: { dpr: 1, particles: 700, confetti: 0.35 },
};

let tier = cores <= 2 || mem <= 2 ? 'low' : coarse || small || cores <= 4 ? 'mid' : 'high';
const params = new URLSearchParams(location.search);
if (TIERS[params.get('quality')]) tier = params.get('quality');

const listeners = new Set();

export const quality = {
  touch: coarse,
  get tier() {
    return tier;
  },
  get cfg() {
    return TIERS[tier];
  },
  reduced: mqReduce.matches || params.has('reduced'),
  setReduced(v) {
    this.reduced = v;
    document.documentElement.classList.toggle('reduced', v);
    listeners.forEach((fn) => fn());
  },
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** scales a particle count to the current tier */
  n(count) {
    const k = tier === 'high' ? 1 : tier === 'mid' ? 0.6 : 0.32;
    return Math.max(1, Math.round(count * k * (this.reduced ? 0.5 : 1)));
  },
};
document.documentElement.classList.toggle('reduced', quality.reduced);

// FPS watchdog: two consecutive slow windows => drop one tier
let frames = 0;
let acc = 0;
let strikes = 0;
gsap.ticker.add((time, dt) => {
  if (document.hidden) return;
  acc += dt;
  frames++;
  if (frames < 90) return;
  const avg = acc / frames;
  frames = 0;
  acc = 0;
  if (avg > 26) strikes++;
  else strikes = Math.max(0, strikes - 1);
  if (strikes >= 2 && tier !== 'low') {
    tier = tier === 'high' ? 'mid' : 'low';
    strikes = 0;
    listeners.forEach((fn) => fn());
  }
});
