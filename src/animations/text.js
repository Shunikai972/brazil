import { gsap } from 'gsap';
import { splitChars } from '../utils/dom.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';

/** typewriter reveal; returns a tween */
export function typewriter(node, text, { cps = 32, sound = true, caret = false } = {}) {
  const st = { n: 0 };
  node.textContent = '';
  let last = -1;
  return gsap.to(st, {
    n: text.length,
    duration: Math.max(0.05, text.length / cps),
    ease: 'none',
    onUpdate() {
      const k = Math.round(st.n);
      if (k === last) return;
      last = k;
      node.textContent = text.slice(0, k) + (caret && k < text.length ? '▌' : '');
      if (sound && k % 2 === 0) sfx.tick();
    },
  });
}

/** letters fall in like heavy stamps, each with a tiny shake */
export function stampLetters(node, { stagger = 0.07, from = 2.4, sound = true, shake = 0.25 } = {}) {
  const chars = splitChars(node);
  const tl = gsap.timeline();
  chars.forEach((c, i) => {
    const t = i * stagger;
    tl.fromTo(c, { scale: from, opacity: 0, rotation: gsap.utils.random(-14, 14) }, { scale: 1, opacity: 1, rotation: gsap.utils.random(-3, 3), duration: 0.16, ease: 'power4.in' }, t);
    if (c.textContent.trim())
      tl.call(() => {
        if (sound) sfx.stamp();
        stage.shake(shake, 0.18);
      }, null, t + 0.15);
  });
  return tl;
}

/** classic elegant reveal: letters rise from a soft blur */
export function riseLetters(node, { stagger = 0.045, y = 0.6, duration = 1.1, ease = 'expo.out', blur = true } = {}) {
  const chars = splitChars(node);
  const tl = gsap.timeline();
  tl.fromTo(
    chars,
    { yPercent: y * 100, opacity: 0, rotation: 8, filter: blur ? 'blur(8px)' : 'none' },
    { yPercent: 0, opacity: 1, rotation: 0, filter: 'blur(0px)', duration, ease, stagger },
  );
  return { tl, chars };
}

/** scale punch-in with impact */
export function slam(node, { from = 3, rot = -8, sound = 'impact', shake = 0.8, duration = 0.32 } = {}) {
  const tl = gsap.timeline();
  tl.fromTo(node, { scale: from, autoAlpha: 0, rotation: rot }, { scale: 1, autoAlpha: 1, rotation: 0, duration, ease: 'power4.in' });
  tl.call(() => {
    if (sound === 'impact') sfx.impact(0.6);
    else if (sound === 'stamp') sfx.stamp();
    else if (sound === 'boom') sfx.boom();
    stage.shake(shake, 0.35);
  });
  tl.fromTo(node, { scale: 1.08 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
  return tl;
}

/** split a node and make its letters wave forever (returns the tween) */
export function waveLetters(chars, { amp = 0.08, speed = 1.6 } = {}) {
  return gsap.to(chars, {
    yPercent: -amp * 100,
    duration: speed / 2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    stagger: { each: 0.08, from: 'start' },
  });
}
