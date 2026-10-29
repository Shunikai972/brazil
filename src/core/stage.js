import { gsap } from 'gsap';
import { quality } from './quality.js';

/**
 * The full-screen stage: viewport metrics, layers, camera shake and flashes.
 *
 *  #app
 *   ├─ #shake            (camera shake applies here)
 *   │   ├─ #stage        scenes live here (newest scene is prepended => rendered underneath)
 *   │   └─ canvas#fx     global particle layer
 *   ├─ #transition       overlay for cross-scene effects (shards, wipes)
 *   ├─ #flash            full-screen flash
 *   └─ #ui               controls
 */
const $ = (id) => document.getElementById(id);
const resizeFns = new Set();

export const stage = {
  w: window.innerWidth,
  h: window.innerHeight,
  get min() {
    return Math.min(this.w, this.h);
  },
  get max() {
    return Math.max(this.w, this.h);
  },
  get portrait() {
    return this.h >= this.w;
  },
  /** 1 "vmin" in px */
  get u() {
    return Math.min(this.w, this.h) / 100;
  },
  app: $('app'),
  shakeEl: $('shake'),
  layer: $('stage'),
  transition: $('transition'),
  flashEl: $('flash'),
  ui: $('ui'),

  onResize(fn) {
    resizeFns.add(fn);
    return () => resizeFns.delete(fn);
  },

  // ───────── camera shake (decaying noise, ticker driven) ─────────
  _shake: { power: 0, decay: 0, t: 0 },
  shake(power = 1, duration = 0.5) {
    if (quality.reduced) power *= 0.15;
    const s = this._shake;
    s.power = Math.max(s.power, power);
    s.decay = power / Math.max(0.05, duration);
  },

  flash(color = '#fff', duration = 0.6, peak = 1) {
    const el = this.flashEl;
    if (quality.reduced) {
      peak *= 0.5;
      duration *= 1.6;
    }
    gsap.killTweensOf(el);
    el.style.background = color;
    gsap.fromTo(el, { opacity: peak }, { opacity: 0, duration, ease: 'power2.out' });
  },

  /** fully covers the screen with a colour (returns tween) */
  cover(color = '#fff', duration = 0.15) {
    const el = this.flashEl;
    gsap.killTweensOf(el);
    el.style.background = color;
    return gsap.to(el, { opacity: 1, duration, ease: 'power2.in' });
  },
  uncover(duration = 0.5, delay = 0) {
    gsap.killTweensOf(this.flashEl);
    return gsap.to(this.flashEl, { opacity: 0, duration, delay, ease: 'power2.out' });
  },
};

function measure() {
  stage.w = Math.round(window.innerWidth);
  stage.h = Math.round(window.innerHeight);
  const r = document.documentElement.style;
  r.setProperty('--app-w', stage.w + 'px');
  r.setProperty('--app-h', stage.h + 'px');
  document.documentElement.classList.toggle('is-portrait', stage.portrait);
  document.documentElement.classList.toggle('is-landscape', !stage.portrait);
}
measure();

let raf = 0;
function onResize() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    measure();
    resizeFns.forEach((fn) => fn(stage));
  });
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 250));

gsap.ticker.add((time, dtMs) => {
  const s = stage._shake;
  if (s.power <= 0) return;
  const dt = dtMs / 1000;
  s.t += dt;
  s.power = Math.max(0, s.power - s.decay * dt);
  const p = s.power * s.power;
  const u = stage.u;
  const x = (Math.sin(s.t * 71.3) + Math.sin(s.t * 37.1) * 0.6) * p * u * 1.6;
  const y = (Math.cos(s.t * 63.7) + Math.sin(s.t * 29.9) * 0.6) * p * u * 1.6;
  const r = Math.sin(s.t * 47.9) * p * 1.4;
  stage.shakeEl.style.transform = s.power > 0 ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(3)}deg)` : '';
});
