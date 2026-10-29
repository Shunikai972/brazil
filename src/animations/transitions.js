import { gsap } from 'gsap';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { el, svg } from '../utils/dom.js';
import { rand, TAU } from '../utils/math.js';
import { sfx } from '../audio/sfx.js';

/* Cross-scene transitions. They draw in #transition so the outgoing scene can be destroyed
   while its pieces are still flying. */

/** clones a scene root, copying canvas pixels (cloneNode leaves canvases blank) */
function cloneScene(root) {
  const c = root.cloneNode(true);
  const src = root.querySelectorAll('canvas');
  const dst = c.querySelectorAll('canvas');
  src.forEach((s, i) => {
    try {
      dst[i].getContext('2d').drawImage(s, 0, 0);
    } catch (_) {}
  });
  c.style.pointerEvents = 'none';
  return c;
}

/** SVG crack lines radiating from (x, y). Returns { node, tl } */
export function cracks(x, y, { spokes = 11, color = 'rgba(255,255,255,0.95)', parent = stage.transition } = {}) {
  const w = stage.w;
  const h = stage.h;
  const root = svg('svg', { class: 'cracks', viewBox: `0 0 ${w} ${h}`, width: w, height: h });
  const g = svg('g', { fill: 'none', stroke: color, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const shadow = svg('g', { fill: 'none', stroke: 'rgba(0,0,0,0.35)', 'stroke-linecap': 'round', transform: 'translate(1.5,2)' });
  root.append(shadow, g);
  const reach = Math.hypot(w, h);
  const rays = [];
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * TAU + rand(-0.25, 0.25);
    const pts = [[x, y]];
    let r = 0;
    let ang = a;
    while (r < reach) {
      r += rand(25, 70) * (stage.min / 500);
      ang += rand(-0.18, 0.18);
      pts.push([x + Math.cos(ang) * r, y + Math.sin(ang) * r]);
    }
    rays.push(pts);
  }
  const paths = [];
  const add = (d, width) => {
    const p = svg('path', { d, 'stroke-width': width });
    const ps = svg('path', { d, 'stroke-width': width });
    g.append(p);
    shadow.append(ps);
    paths.push(p, ps);
  };
  rays.forEach((pts) => add('M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L'), rand(1.2, 2.6)));
  // concentric connections
  for (let ring = 1; ring < 4; ring++) {
    for (let i = 0; i < rays.length; i++) {
      if (Math.random() < 0.35) continue;
      const a = rays[i][Math.min(rays[i].length - 1, ring * 2)];
      const b = rays[(i + 1) % rays.length][Math.min(rays[(i + 1) % rays.length].length - 1, ring * 2 + (Math.random() < 0.5 ? 1 : 0))];
      const mx = (a[0] + b[0]) / 2 + rand(-12, 12);
      const my = (a[1] + b[1]) / 2 + rand(-12, 12);
      add(`M${a[0].toFixed(1)},${a[1].toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`, rand(0.8, 1.6));
    }
  }
  // impact star
  const star = svg('circle', { cx: x, cy: y, r: stage.min * 0.02, fill: 'rgba(255,255,255,0.85)' });
  g.append(star);
  parent.append(root);
  paths.forEach((p) => {
    const len = p.getTotalLength ? p.getTotalLength() : 2000;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  const tl = gsap.timeline();
  tl.to(paths, { strokeDashoffset: 0, duration: 0.22, ease: 'power3.out', stagger: { each: 0.004, from: 'start' } });
  tl.from(star, { scale: 0, transformOrigin: `${x}px ${y}px`, duration: 0.1 }, 0);
  return { node: root, tl };
}

/**
 * Breaks the outgoing scene into glass shards that fly at the camera and fall,
 * revealing whatever is underneath. Resolves once the shards are gone.
 */
export function shatter(root, { x = stage.w / 2, y = stage.h / 2, power = 1, crack = true, fx = null, glassColor } = {}) {
  return new Promise((resolve) => {
    const w = stage.w;
    const h = stage.h;
    const spokes = quality.tier === 'low' ? 7 : quality.tier === 'mid' ? 9 : 12;
    const rings = quality.tier === 'high' ? 3 : 2;
    const reach = Math.hypot(w, h) * 1.05;
    const angles = [];
    for (let i = 0; i < spokes; i++) angles.push((i / spokes) * TAU + rand(-0.2, 0.2));
    const radii = angles.map(() => {
      const r = [0];
      for (let k = 1; k <= rings; k++) r.push((k / (rings + 0.6)) * reach * rand(0.75, 1.1) * 0.6);
      r.push(reach);
      return r;
    });
    const layer = el('div.shards');
    stage.transition.append(layer);
    const pieces = [];
    for (let i = 0; i < spokes; i++) {
      const j2 = (i + 1) % spokes;
      for (let k = 0; k < radii[i].length - 1; k++) {
        const pts = [
          [x + Math.cos(angles[i]) * radii[i][k], y + Math.sin(angles[i]) * radii[i][k]],
          [x + Math.cos(angles[j2]) * radii[j2][k], y + Math.sin(angles[j2]) * radii[j2][k]],
          [x + Math.cos(angles[j2]) * radii[j2][k + 1], y + Math.sin(angles[j2]) * radii[j2][k + 1]],
          [x + Math.cos(angles[i]) * radii[i][k + 1], y + Math.sin(angles[i]) * radii[i][k + 1]],
        ];
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const [px, py] of pts) {
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        }
        minX = Math.max(0, Math.floor(minX));
        minY = Math.max(0, Math.floor(minY));
        maxX = Math.min(w, Math.ceil(maxX));
        maxY = Math.min(h, Math.ceil(maxY));
        if (maxX - minX < 2 || maxY - minY < 2) continue;
        const box = el('div.shard', { style: { left: minX + 'px', top: minY + 'px', width: maxX - minX + 'px', height: maxY - minY + 'px' } });
        box.style.clipPath = `polygon(${pts.map(([px, py]) => `${(px - minX).toFixed(1)}px ${(py - minY).toFixed(1)}px`).join(',')})`;
        const inner = cloneScene(root);
        inner.classList.add('shard-inner');
        inner.style.left = -minX + 'px';
        inner.style.top = -minY + 'px';
        inner.style.width = w + 'px';
        inner.style.height = h + 'px';
        box.append(inner, el('div.shard-glint'));
        layer.append(box);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        pieces.push({ box, cx, cy, ring: k });
      }
    }
    root.style.visibility = 'hidden';
    const tl = gsap.timeline({
      onComplete: () => {
        layer.remove();
        resolve();
      },
    });
    let crackNode = null;
    if (crack) {
      const c = cracks(x, y, { parent: layer });
      crackNode = c.node;
      tl.add(c.tl, 0);
      tl.call(() => sfx.shatter(0, 0.12), null, 0);
    }
    const t0 = crack ? 0.32 : 0;
    tl.call(() => {
      sfx.shatter(0, 0.22);
      stage.shake(0.7 * power, 0.5);
      if (fx) fx.shards(x, y, 70 * power, glassColor ? { colors: glassColor } : {});
    }, null, t0);
    if (crackNode) tl.to(crackNode, { opacity: 0, duration: 0.2 }, t0);
    pieces.forEach((p) => {
      const dx = p.cx - x;
      const dy = p.cy - y;
      const d = Math.hypot(dx, dy) || 1;
      const push = (stage.min * rand(0.25, 0.7) * power) / (1 + p.ring * 0.4);
      tl.to(
        p.box,
        {
          x: (dx / d) * push + rand(-30, 30),
          y: (dy / d) * push * 0.6 + stage.h * rand(0.7, 1.3),
          z: rand(80, 380) * power,
          rotationX: rand(-70, 70),
          rotationY: rand(-80, 80),
          rotation: rand(-50, 50),
          duration: rand(0.9, 1.3),
          ease: 'power2.in',
        },
        t0 + p.ring * 0.03 + rand(0, 0.05),
      );
      tl.to(p.box, { opacity: 0, duration: 0.3 }, t0 + 0.75 + rand(0, 0.25));
    });
  });
}

/** heart-shaped iris (cartoon "that's all folks"). close=true covers the screen with color */
export function heartIris({ close = true, color = '#000', x = stage.w / 2, y = stage.h / 2, duration = 0.9, parent = stage.transition } = {}) {
  const w = stage.w;
  const h = stage.h;
  const id = 'iris' + Math.floor(Math.random() * 1e6);
  const s = svg('svg', { class: 'iris', viewBox: `0 0 ${w} ${h}`, width: w, height: h });
  const heart = svg('path', { d: 'M0,-0.2 C0,-0.5 -0.5,-0.5 -0.5,-0.2 C-0.5,0.12 0,0.26 0,0.5 C0,0.26 0.5,0.12 0.5,-0.2 C0.5,-0.5 0,-0.5 0,-0.2Z', fill: 'black' });
  const g = svg('g', {}, heart);
  const mask = svg('mask', { id }, [svg('rect', { x: 0, y: 0, width: w, height: h, fill: 'white' }), g]);
  s.append(svg('defs', {}, mask), svg('rect', { x: 0, y: 0, width: w, height: h, fill: color, mask: `url(#${id})` }));
  parent.append(s);
  const big = Math.hypot(w, h) * 2.6;
  const state = { s: close ? big : 0.001 };
  const apply = () => g.setAttribute('transform', `translate(${x},${y}) scale(${state.s})`);
  apply();
  const tl = gsap.timeline();
  tl.to(state, { s: close ? 0.001 : big, duration, ease: close ? 'power3.in' : 'power3.out', onUpdate: apply });
  if (!close) tl.call(() => s.remove());
  return { node: s, tl };
}

/** diagonal slash wipe. Returns timeline with label "covered" */
export function slashWipe({ color = '#ffdf00', color2 = '#009c3b', duration = 0.7, onCovered } = {}) {
  const wrap = el('div.slash-wipe');
  const a = el('div.slash', { style: { background: color } });
  const b = el('div.slash', { style: { background: color2 } });
  wrap.append(b, a);
  stage.transition.append(wrap);
  const tl = gsap.timeline({ onComplete: () => wrap.remove() });
  tl.fromTo([b, a], { xPercent: -130 }, { xPercent: 0, duration: duration * 0.45, ease: 'power3.in', stagger: 0.06 });
  tl.addLabel('covered');
  if (onCovered) tl.call(onCovered);
  tl.to([a, b], { xPercent: 130, duration: duration * 0.55, ease: 'power3.out', stagger: 0.06 }, '+=0.05');
  return tl;
}
