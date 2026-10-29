import { gsap } from 'gsap';
import { quality } from '../core/quality.js';
import { stage } from '../core/stage.js';
import { rand, TAU, heartPoint, pick } from '../utils/math.js';

/* ═════════════════════════════ sprites ═════════════════════════════ */

const cache = new Map();
function sprite(key, size, draw) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  cache.set(key, c);
  return c;
}

/** unit heart path centred on (0,0), width 1 */
export function heartPath(ctx, x = 0, y = 0, s = 1) {
  const oy = y - s * 0.5;
  ctx.moveTo(x, oy + s * 0.3);
  ctx.bezierCurveTo(x, oy, x - s * 0.5, oy, x - s * 0.5, oy + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, oy + s * 0.62, x, oy + s * 0.76, x, oy + s);
  ctx.bezierCurveTo(x, oy + s * 0.76, x + s * 0.5, oy + s * 0.62, x + s * 0.5, oy + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, oy, x, oy, x, oy + s * 0.3);
}

export const heartSprite = (color) =>
  sprite('heart' + color, 96, (ctx, s) => {
    ctx.translate(s / 2, s / 2 + 2);
    ctx.beginPath();
    heartPath(ctx, 0, 0, s * 0.86);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = s * 0.035;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.stroke();
    // glossy highlight
    ctx.beginPath();
    ctx.ellipse(-s * 0.2, -s * 0.18, s * 0.09, s * 0.05, -0.7, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  });

export const glowSprite = (color) =>
  sprite('glow' + color, 64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

const smokeSprite = () =>
  sprite('smoke', 64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,250,245,0.9)');
    g.addColorStop(0.5, 'rgba(235,225,225,0.45)');
    g.addColorStop(1, 'rgba(220,210,210,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

export const starSprite = (color) =>
  sprite('star' + color, 64, (ctx, s) => {
    ctx.translate(s / 2, s / 2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? s * 0.08 : s * 0.5;
      const a = (i / 8) * TAU;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.fill();
  });

const petalSprite = (color) =>
  sprite('petal' + color, 48, (ctx, s) => {
    ctx.translate(s / 2, s / 2);
    const g = ctx.createLinearGradient(-s / 2, 0, s / 2, 0);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.42, -s * 0.3, s * 0.3, s * 0.35, 0, s * 0.45);
    ctx.bezierCurveTo(-s * 0.3, s * 0.35, -s * 0.42, -s * 0.3, 0, -s * 0.45);
    ctx.fill();
  });

/* ═════════════════════════════ particles ═════════════════════════════ */

export const K = { HEART: 1, CONFETTI: 2, SPARK: 3, GLOW: 4, SMOKE: 5, IMG: 6, STAR: 7, PETAL: 8, ROCKET: 9, TEXT: 10, SHARD: 11 };

export const PALETTE = {
  love: ['#ff2e4d', '#ff5c7a', '#ff9fb2', '#e8153a', '#ffd1dc'],
  br: ['#009c3b', '#ffdf00', '#002776', '#ffffff'],
  fr: ['#0055a4', '#ffffff', '#ef4135'],
  party: ['#ff2e4d', '#ffdf00', '#009c3b', '#0055a4', '#ffffff', '#ff8a00', '#ff5cc8'],
  gold: ['#ffd36b', '#ffb627', '#fff1c1', '#e8a317'],
};

function fresh() {
  return {
    kind: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, life: 1, age: 0, size: 10, size1: -1,
    rot: 0, vr: 0, a: 1, color: '#fff', img: null, flip: 0, vflip: 0, wob: 0, wobF: 0, wobP: 0,
    add: false, fadeIn: 0, twinkle: 0, trail: 0.035, text: '', font: '', poly: null, data: null,
    onDeath: null, ease: 0, ratio: 1,
  };
}

export class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.active = [];
    this.pool = [];
    this.rings = [];
    this.buckets = new Map();
    this.dirty = true;
    this.paused = false;
    this.resize();
    this._offResize = stage.onResize(() => this.resize());
    this._offQ = quality.onChange(() => this.resize());
    this._tick = (t, dt) => this.frame(Math.min(dt, 50) / 1000);
    gsap.ticker.add(this._tick);
  }

  get max() {
    return quality.cfg.particles;
  }

  resize() {
    const dpr = quality.cfg.dpr;
    const w = this.canvas.clientWidth || stage.w;
    const h = this.canvas.clientHeight || stage.h;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.dirty = true;
  }

  destroy() {
    gsap.ticker.remove(this._tick);
    this._offResize();
    this._offQ();
    this.active.length = 0;
  }

  clear() {
    for (const p of this.active) this.pool.push(p);
    this.active.length = 0;
    this.rings.length = 0;
    this.dirty = true;
  }

  spawn(props) {
    if (this.active.length >= this.max) return null;
    const p = this.pool.pop() || fresh();
    Object.assign(p, fresh(), props);
    if (p.size1 < 0) p.size1 = p.size;
    this.active.push(p);
    return p;
  }

  frame(dt) {
    if (this.paused) return;
    if (!this.active.length && !this.rings.length) {
      if (this.dirty) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.dirty = false;
      }
      return;
    }
    this.update(dt);
    this.render();
    this.dirty = true;
  }

  update(dt) {
    const arr = this.active;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.age += dt;
      if (p.age >= p.life) {
        if (p.onDeath) p.onDeath(p, this);
        arr[i] = arr[arr.length - 1];
        arr.pop();
        this.pool.push(p);
        continue;
      }
      if (p.drag) {
        const k = Math.exp(-p.drag * dt);
        p.vx *= k;
        p.vy *= k;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.wob) p.x += Math.sin(p.age * p.wobF + p.wobP) * p.wob * dt;
      p.rot += p.vr * dt;
      p.flip += p.vflip * dt;
      if (p.kind === K.ROCKET) {
        if (Math.random() < 0.9)
          this.spawn({ kind: K.SPARK, x: p.x + rand(-1, 1), y: p.y + 4, vx: rand(-20, 20), vy: rand(20, 80), life: rand(0.25, 0.5), size: 1.6, color: p.data.trail || '#ffcf7a', add: true, drag: 2, g: 120, trail: 0.02 });
        if (p.vy > -60) {
          p.age = p.life; // explode next frame
          this.explode(p.x, p.y, p.data);
        }
      }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      if (r.age >= r.life) this.rings.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // rings (shockwaves)
    for (const r of this.rings) {
      const k = r.age / r.life;
      const e = 1 - Math.pow(1 - k, 3);
      const rad = r.r0 + (r.r1 - r.r0) * e;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = (1 - k) * r.a;
      ctx.lineWidth = Math.max(0.5, r.width * (1 - k));
      ctx.strokeStyle = r.color;
      ctx.beginPath();
      if (r.squash !== 1) ctx.ellipse(r.x, r.y, rad, rad * r.squash, 0, 0, TAU);
      else ctx.arc(r.x, r.y, rad, 0, TAU);
      ctx.stroke();
      if (r.fill) {
        ctx.globalAlpha = (1 - k) * 0.25 * r.a;
        ctx.fillStyle = r.fill;
        ctx.fill();
      }
    }

    const arr = this.active;
    // pass 1: normal blending
    for (let i = 0; i < arr.length; i++) if (!arr[i].add) this.draw(ctx, arr[i], dpr);
    // pass 2: additive
    ctx.globalCompositeOperation = 'lighter';
    const buckets = this.buckets;
    for (const b of buckets.values()) b.length = 0;
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      if (!p.add) continue;
      if (p.kind === K.SPARK) {
        let a = this.alphaOf(p);
        if (p.twinkle) a *= 0.35 + 0.65 * Math.abs(Math.sin(p.age * p.twinkle + p.wobP));
        if (a < 0.03) continue;
        const lvl = Math.min(4, Math.ceil(a * 4));
        const col = p.age < 0.08 ? '#fff6dc' : p.color;
        const wcls = p.size < 1.6 ? 1 : p.size < 2.6 ? 2 : 3;
        const key = col + '|' + lvl + '|' + wcls;
        let b = buckets.get(key);
        if (!b) buckets.set(key, (b = []));
        b.push(p.x - p.vx * p.trail, p.y - p.vy * p.trail, p.x, p.y);
      } else this.draw(ctx, p, dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    for (const [key, segs] of buckets) {
      if (!segs.length) continue;
      const [col, lvl, wcls] = key.split('|');
      ctx.globalAlpha = +lvl / 4;
      ctx.strokeStyle = col;
      ctx.lineWidth = wcls === '1' ? 1.2 : wcls === '2' ? 2.2 : 3.4;
      ctx.beginPath();
      for (let j = 0; j < segs.length; j += 4) {
        ctx.moveTo(segs[j], segs[j + 1]);
        ctx.lineTo(segs[j + 2], segs[j + 3]);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  alphaOf(p) {
    const k = p.age / p.life;
    let a = p.a;
    if (p.fadeIn && p.age < p.fadeIn) a *= p.age / p.fadeIn;
    if (k > 0.6) a *= 1 - (k - 0.6) / 0.4;
    return a;
  }

  draw(ctx, p, dpr) {
    const k = p.age / p.life;
    const a = this.alphaOf(p);
    if (a <= 0.01) return;
    const size = p.ease ? p.size + (p.size1 - p.size) * Math.pow(k, p.ease) : p.size + (p.size1 - p.size) * k;
    ctx.globalAlpha = a;
    const c = Math.cos(p.rot) * dpr;
    const s = Math.sin(p.rot) * dpr;
    const fx = p.vflip || p.flip ? Math.cos(p.flip) : 1;
    switch (p.kind) {
      case K.CONFETTI: {
        ctx.setTransform(c, s, -s * fx, c * fx, p.x * dpr, p.y * dpr);
        ctx.fillStyle = p.color;
        ctx.fillRect(-size / 2, -size * 0.3, size, size * 0.6);
        break;
      }
      case K.HEART: {
        ctx.setTransform(c * fx, s * fx, -s, c, p.x * dpr, p.y * dpr);
        ctx.drawImage(heartSprite(p.color), -size / 2, -size / 2, size, size);
        break;
      }
      case K.GLOW:
      case K.STAR: {
        ctx.setTransform(c, s, -s, c, p.x * dpr, p.y * dpr);
        ctx.drawImage(p.kind === K.GLOW ? glowSprite(p.color) : starSprite(p.color), -size / 2, -size / 2, size, size);
        break;
      }
      case K.SMOKE: {
        ctx.setTransform(c, s, -s, c, p.x * dpr, p.y * dpr);
        ctx.drawImage(smokeSprite(), -size / 2, -size / 2, size, size);
        break;
      }
      case K.PETAL: {
        ctx.setTransform(c * fx, s * fx, -s, c, p.x * dpr, p.y * dpr);
        ctx.drawImage(petalSprite(p.color), -size / 2, -size / 2, size, size);
        break;
      }
      case K.IMG: {
        if (!p.img) break;
        ctx.setTransform(c * fx, s * fx, -s, c, p.x * dpr, p.y * dpr);
        const w = size * p.ratio;
        ctx.drawImage(p.img, -w / 2, -size / 2, w, size);
        break;
      }
      case K.TEXT: {
        ctx.setTransform(c, s, -s, c, p.x * dpr, p.y * dpr);
        ctx.font = `${size}px ${p.font || 'Lilita One, sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (p.data && p.data.stroke) {
          ctx.lineWidth = size * 0.16;
          ctx.strokeStyle = p.data.stroke;
          ctx.lineJoin = 'round';
          ctx.strokeText(p.text, 0, 0);
        }
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, 0, 0);
        break;
      }
      case K.SHARD: {
        ctx.setTransform(c * fx, s * fx, -s, c, p.x * dpr, p.y * dpr);
        const pts = p.poly;
        ctx.beginPath();
        ctx.moveTo(pts[0] * size, pts[1] * size);
        for (let j = 2; j < pts.length; j += 2) ctx.lineTo(pts[j] * size, pts[j + 1] * size);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.stroke();
        break;
      }
      case K.SPARK: {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * p.trail, p.y - p.vy * p.trail);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        break;
      }
      default:
        break;
    }
  }

  /* ─────────────────────────── emitters ─────────────────────────── */

  ring(x, y, { r0 = 0, r1 = stage.max, life = 0.9, width = 26, color = '#fff', a = 1, fill = null, squash = 1 } = {}) {
    this.rings.push({ x, y, r0, r1, life, width, color, a, fill, squash, age: 0 });
  }

  hearts(x, y, n = 30, { power = 1, colors = PALETTE.love, size = [14, 34], g = 300, life = [1.2, 2.2], spread = TAU, angle = -Math.PI / 2, toCamera = false } = {}) {
    n = quality.n(n);
    const v0 = stage.min * 1.1 * power;
    for (let i = 0; i < n; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = v0 * rand(0.25, 1);
      const sz = rand(size[0], size[1]) * (stage.min / 700 + 0.4);
      this.spawn({
        kind: K.HEART, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g, drag: 1.6,
        life: rand(life[0], life[1]), size: sz, size1: toCamera ? sz * rand(6, 14) : sz, ease: toCamera ? 3 : 0,
        rot: rand(-0.6, 0.6), vr: rand(-3, 3), color: pick(colors), vflip: rand(-6, 6),
      });
    }
  }

  confetti(n = 200, { x = null, y = null, colors = PALETTE.party, power = 1, from = 'top', size = [7, 14], life = [3, 5] } = {}) {
    n = Math.round(quality.n(n) * quality.cfg.confetti * (quality.tier === 'high' ? 1 : 1.3));
    for (let i = 0; i < n; i++) {
      let px, py, vx, vy;
      if (from === 'top') {
        px = rand(-0.05, 1.05) * this.w;
        py = rand(-0.4, -0.02) * this.h;
        vx = rand(-40, 40);
        vy = rand(40, 160);
      } else if (from === 'bottom') {
        px = x ?? rand(0, this.w);
        py = this.h + 10;
        const a = -Math.PI / 2 + rand(-0.5, 0.5);
        const v = stage.h * rand(1.1, 1.9) * power;
        vx = Math.cos(a) * v;
        vy = Math.sin(a) * v;
      } else {
        px = x;
        py = y;
        const a = rand(0, TAU);
        const v = stage.min * rand(0.5, 1.8) * power;
        vx = Math.cos(a) * v;
        vy = Math.sin(a) * v - stage.min * 0.6 * power;
      }
      const sz = rand(size[0], size[1]) * (stage.min / 800 + 0.5);
      this.spawn({
        kind: K.CONFETTI, x: px, y: py, vx, vy, g: 260, drag: from === 'top' ? 0.6 : 1.9,
        life: rand(life[0], life[1]), size: sz, rot: rand(TAU), vr: rand(-7, 7), vflip: rand(5, 14),
        color: pick(colors), wob: rand(20, 70), wobF: rand(2, 5), wobP: rand(TAU),
      });
    }
  }

  sparks(x, y, n = 40, { color = '#ffd36b', power = 1, life = [0.4, 1], g = 500, size = 2, spread = TAU, angle = 0 } = {}) {
    n = quality.n(n);
    for (let i = 0; i < n; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = stage.min * rand(0.3, 1.4) * power;
      this.spawn({ kind: K.SPARK, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g, drag: 2.2, life: rand(life[0], life[1]), size: size * rand(0.6, 1.3), color: Array.isArray(color) ? pick(color) : color, add: true, trail: 0.03 });
    }
  }

  smoke(x, y, n = 14, { size = 80, life = [0.6, 1.2], power = 1, color } = {}) {
    n = quality.n(n);
    for (let i = 0; i < n; i++) {
      const a = rand(TAU);
      const v = rand(30, 160) * power;
      const sz = size * rand(0.5, 1.1) * (stage.min / 700 + 0.3);
      this.spawn({ kind: K.SMOKE, x: x + rand(-10, 10), y: y + rand(-10, 10), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, drag: 2.5, life: rand(life[0], life[1]), size: sz, size1: sz * 2.2, rot: rand(TAU), vr: rand(-1, 1), a: 0.85 });
    }
  }

  glow(x, y, { size = stage.max * 0.6, color = '#ffd9a0', life = 0.5, a = 1 } = {}) {
    this.spawn({ kind: K.GLOW, x, y, size: size * 0.5, size1: size, life, color, add: true, a });
  }

  stars(x, y, n = 12, { color = '#fff3c4', size = [10, 26], spread = stage.min * 0.3, life = [0.5, 1.2] } = {}) {
    n = quality.n(n);
    for (let i = 0; i < n; i++) {
      const sz = rand(size[0], size[1]);
      this.spawn({ kind: K.STAR, x: x + rand(-spread, spread), y: y + rand(-spread, spread), size: sz * 0.2, size1: sz, life: rand(life[0], life[1]), color, add: true, rot: rand(TAU), vr: rand(-2, 2), fadeIn: 0.1 });
    }
  }

  petals(n = 30, { colors = ['#ffb3c6', '#ffd6e0', '#fff0f3', '#ff8fab'], life = [5, 8] } = {}) {
    n = quality.n(n);
    for (let i = 0; i < n; i++) {
      const sz = rand(12, 26) * (stage.min / 700 + 0.5);
      this.spawn({ kind: K.PETAL, x: rand(-0.1, 1.1) * this.w, y: rand(-0.5, -0.05) * this.h, vx: rand(10, 60), vy: rand(30, 90), g: 8, drag: 0.2, life: rand(life[0], life[1]), size: sz, rot: rand(TAU), vr: rand(-2, 2), vflip: rand(2, 6), color: pick(colors), wob: rand(30, 80), wobF: rand(1, 2.5), wobP: rand(TAU), fadeIn: 0.4 });
    }
  }

  images(img, x, y, n = 10, { size = [40, 90], power = 1, g = 900, life = [1.5, 2.5], spread = TAU, angle = -Math.PI / 2 } = {}) {
    if (!img) return;
    n = quality.n(n);
    const ratio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height) || 1;
    for (let i = 0; i < n; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = stage.min * rand(0.6, 1.6) * power;
      this.spawn({ kind: K.IMG, img, ratio, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g, drag: 0.8, life: rand(life[0], life[1]), size: rand(size[0], size[1]) * (stage.min / 700 + 0.4), rot: rand(-0.5, 0.5), vr: rand(-6, 6) });
    }
  }

  text(str, x, y, { size = 40, color = '#fff', stroke = '#000', font, vx = 0, vy = -60, life = 1.6, rot = 0, vr = 0, g = 0 } = {}) {
    return this.spawn({ kind: K.TEXT, text: str, x, y, vx, vy, g, life, size, color, font, rot, vr, data: { stroke }, fadeIn: 0.05 });
  }

  shards(x, y, n = 60, { colors = ['rgba(200,230,255,0.35)', 'rgba(255,255,255,0.25)', 'rgba(180,210,255,0.3)'], power = 1, size = [14, 46] } = {}) {
    n = quality.n(n);
    for (let i = 0; i < n; i++) {
      const pts = [];
      const m = 3 + Math.floor(rand(0, 2));
      for (let j = 0; j < m; j++) {
        const a = (j / m) * TAU + rand(-0.4, 0.4);
        const r = rand(0.35, 0.7);
        pts.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      const a = rand(TAU);
      const v = stage.min * rand(0.4, 2.2) * power;
      this.spawn({ kind: K.SHARD, poly: pts, x: x + rand(-30, 30), y: y + rand(-30, 30), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, g: 1400, drag: 0.4, life: rand(0.8, 1.6), size: rand(size[0], size[1]) * (stage.min / 700 + 0.4), rot: rand(TAU), vr: rand(-12, 12), vflip: rand(4, 12), color: pick(colors) });
    }
  }

  /** launches a rocket from the bottom of the screen that bursts at (x, y) */
  firework(x, y, opts = {}) {
    const startX = x + rand(-stage.w * 0.08, stage.w * 0.08);
    const startY = this.h + 10;
    const g = 520;
    const vy = -Math.sqrt(2 * g * Math.max(40, startY - y));
    const t = -vy / g;
    this.spawn({ kind: K.ROCKET, x: startX, y: startY, vx: (x - startX) / t, vy, g, life: t + 0.5, size: 2, color: '#fff', data: opts });
  }

  explode(x, y, { kind = 'peony', color = '#ff2e4d', color2 = null, n = 110, power = 1, life = 1.7, onBurst = null } = {}) {
    n = quality.n(n);
    const v0 = stage.min * 0.55 * power;
    const colOf = (i) => (color2 && i % 2 ? color2 : Array.isArray(color) ? pick(color) : color);
    if (kind === 'heart') {
      for (let i = 0; i < n; i++) {
        const hp = heartPoint((i / n) * TAU);
        const v = v0 * 0.95 * rand(0.96, 1.04);
        this.spawn({ kind: K.SPARK, x, y, vx: hp.x * v, vy: hp.y * v, g: 60, drag: 1.25, life: life * rand(0.9, 1.15), size: 2.4, color: colOf(i), add: true, trail: 0.05, twinkle: 0 });
      }
    } else if (kind === 'ring') {
      const tilt = rand(-0.6, 0.6);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const vx = Math.cos(a) * v0;
        const vy = Math.sin(a) * v0 * 0.42;
        this.spawn({ kind: K.SPARK, x, y, vx: vx * Math.cos(tilt) - vy * Math.sin(tilt), vy: vx * Math.sin(tilt) + vy * Math.cos(tilt), g: 90, drag: 1.4, life, size: 2.2, color: colOf(i), add: true, trail: 0.04 });
      }
    } else if (kind === 'willow') {
      for (let i = 0; i < n; i++) {
        const a = rand(TAU);
        const u = Math.sqrt(rand());
        this.spawn({ kind: K.SPARK, x, y, vx: Math.cos(a) * v0 * u * 0.8, vy: Math.sin(a) * v0 * u * 0.8, g: 160, drag: 1.5, life: life * 1.8, size: 1.8, color: colOf(i), add: true, trail: 0.09, twinkle: 30, wobP: rand(TAU) });
      }
    } else {
      // peony / glitter: points on a sphere projected => volumetric look
      for (let i = 0; i < n; i++) {
        const u = rand(-1, 1);
        const th = rand(TAU);
        const r = Math.sqrt(1 - u * u);
        const v = v0 * rand(0.92, 1.05);
        this.spawn({ kind: K.SPARK, x, y, vx: r * Math.cos(th) * v, vy: r * Math.sin(th) * v, g: 110, drag: 1.3, life: life * rand(0.85, 1.15), size: 2.2, color: colOf(i), add: true, trail: 0.045, twinkle: kind === 'glitter' ? 26 : 0, wobP: rand(TAU) });
      }
    }
    this.glow(x, y, { size: stage.min * 0.55 * power, color: Array.isArray(color) ? color[0] : color, life: 0.45, a: 0.9 });
    if (onBurst) onBurst(x, y);
  }
}
