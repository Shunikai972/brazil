import { gsap } from 'gsap';
import { el } from '../utils/dom.js';
import { src } from '../core/assets.js';

/* Lula, the actor. Cut-out stickers + helpers for cartoon motion. */

/** full cut-out ('jersey-full', 'official-body', ...) */
export function lula(variant, cls = '') {
  const wrap = el('div.lula.sticker' + (cls ? '.' + cls.split(' ').join('.') : ''));
  wrap.append(el('img', { src: src('lula/' + variant), alt: '', draggable: false }));
  return wrap;
}

/** head-only sticker */
export function head(variant, cls = '') {
  const wrap = el('div.lula.lula-head.sticker' + (cls ? '.' + cls.split(' ').join('.') : ''));
  wrap.append(el('img', { src: src('head/' + variant), alt: '', draggable: false }));
  return wrap;
}

/** round photo crop of the face */
export function face(variant, cls = '') {
  const d = el('div.lula-face' + (cls ? '.' + cls.split(' ').join('.') : ''));
  d.style.backgroundImage = `url("${src('face/' + variant)}")`;
  return d;
}

/**
 * After-Effects style echo: ghost copies replay the target's transform a few frames late.
 * The target must be absolutely positioned. Returns a function that removes the ghosts.
 */
export function echo(target, { count = 4, lag = 2, opacity = 0.5 } = {}) {
  const hist = [];
  const ghosts = [];
  for (let i = 0; i < count; i++) {
    const g = target.cloneNode(true);
    g.classList.add('ghost');
    g.style.opacity = 0;
    g.style.pointerEvents = 'none';
    target.parentNode.insertBefore(g, target);
    ghosts.push(g);
  }
  const keys = ['x', 'y', 'xPercent', 'yPercent', 'rotation', 'scaleX', 'scaleY'];
  const tick = () => {
    const s = {};
    for (const k of keys) s[k] = gsap.getProperty(target, k);
    s.o = +gsap.getProperty(target, 'opacity');
    s.v = target.style.visibility !== 'hidden';
    hist.unshift(s);
    if (hist.length > count * lag + 1) hist.pop();
    ghosts.forEach((g, i) => {
      const h = hist[(i + 1) * lag];
      if (!h || !h.v) {
        g.style.opacity = 0;
        return;
      }
      gsap.set(g, { x: h.x, y: h.y, xPercent: h.xPercent, yPercent: h.yPercent, rotation: h.rotation, scaleX: h.scaleX, scaleY: h.scaleY, opacity: h.o * opacity * (1 - i / count) });
    });
  };
  gsap.ticker.add(tick);
  return () => {
    gsap.ticker.remove(tick);
    ghosts.forEach((g) => g.remove());
  };
}

/** squash & stretch hop (adds to the given timeline) */
export function hop(tl, node, at, { height = 60, dur = 0.42, squash = 0.25 } = {}) {
  tl.to(node, { scaleY: 1 - squash, scaleX: 1 + squash, duration: dur * 0.18, ease: 'power2.out', transformOrigin: '50% 100%' }, at);
  tl.to(node, { y: `-=${height}`, scaleY: 1 + squash * 0.8, scaleX: 1 - squash * 0.6, duration: dur * 0.4, ease: 'power2.out' }, at + dur * 0.18);
  tl.to(node, { y: `+=${height}`, scaleY: 1, scaleX: 1, duration: dur * 0.42, ease: 'power2.in' }, at + dur * 0.58);
  return tl;
}
