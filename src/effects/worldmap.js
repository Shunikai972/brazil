import world from '../data/world.json';
import { TAU, mulberry32, insideHeart, lerp } from '../utils/math.js';
import { quality } from '../core/quality.js';

/* Dot-matrix planet (Natural Earth data, public domain): flat TV-news map + rotating globe
   that can morph into a heart. */

const D = world.dots;
const N = D.length / 3;

export const PLACES = {
  rio: [-43.2, -22.9],
  brasilia: [-47.9, -15.8],
  paris: [2.35, 48.86],
  guiana: [-53.1, 3.9],
};

export class DotMap {
  /** region in degrees; the drawing rect should keep roughly the same aspect (plate carrée) */
  constructor({ top = 84, bottom = -58, west = -180, east = 180 } = {}) {
    this.top = top;
    this.bottom = bottom;
    this.west = west;
    this.east = east;
  }
  get aspect() {
    return (this.east - this.west) / (this.top - this.bottom);
  }
  project(lon, lat, r) {
    return {
      x: r.x + ((lon - this.west) / (this.east - this.west)) * r.w,
      y: r.y + ((this.top - lat) / (this.top - this.bottom)) * r.h,
    };
  }
  inside(lon, lat) {
    return lon >= this.west - 2 && lon <= this.east + 2 && lat <= this.top + 2 && lat >= this.bottom - 2;
  }
  /**
   * r = {x, y, w, h}. opts.hl(flag, t) returns a colour for flagged dots (1 France, 2 Brazil).
   */
  draw(ctx, r, t, { color = 'rgba(255,220,220,0.35)', size = null, hl = null, focus = null, reveal = 1 } = {}) {
    const s = size ?? Math.max(1.2, (r.w / (this.east - this.west)) * 1.25);
    const skip = quality.tier === 'low' ? 2 : 1;
    ctx.fillStyle = color;
    for (let i = 0; i < N; i += skip) {
      const f = D[i * 3 + 2];
      if (f) continue;
      const lon = D[i * 3];
      const lat = D[i * 3 + 1];
      if (!this.inside(lon, lat)) continue;
      if (reveal < 1 && (lon - this.west) / (this.east - this.west) > reveal) continue;
      const p = this.project(lon, lat, r);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    for (let i = 0; i < N; i++) {
      const f = D[i * 3 + 2];
      if (!f) continue;
      if (!this.inside(D[i * 3], D[i * 3 + 1])) continue;
      const p = this.project(D[i * 3], D[i * 3 + 1], r);
      const col = hl ? hl(f, t) : '#fff';
      if (!col) continue;
      ctx.fillStyle = col;
      const k = focus === f ? 1.9 : 1.35;
      ctx.fillRect(p.x - (s * k) / 2, p.y - (s * k) / 2, s * k, s * k);
    }
  }

  /** draws an outline ring list (lon,lat flat arrays) */
  outline(ctx, rings, r, style) {
    ctx.save();
    Object.assign(ctx, style);
    for (const ring of rings) {
      ctx.beginPath();
      for (let i = 0; i < ring.length; i += 2) {
        const p = this.project(ring[i], ring[i + 1], r);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  /** point at u (0..1) on the lifted arc from a to b ([lon,lat]) */
  arcPoint(a, b, r, u, lift = 0.35) {
    const A = this.project(a[0], a[1], r);
    const B = this.project(b[0], b[1], r);
    const C = { x: (A.x + B.x) / 2, y: Math.min(A.y, B.y) - Math.hypot(B.x - A.x, B.y - A.y) * lift };
    return {
      x: (1 - u) * (1 - u) * A.x + 2 * (1 - u) * u * C.x + u * u * B.x,
      y: (1 - u) * (1 - u) * A.y + 2 * (1 - u) * u * C.y + u * u * B.y,
    };
  }

  /** glowing laser arc from a to b ([lon,lat]); progress 0..1 */
  laser(ctx, a, b, r, progress, { color = '#ff3d7f', width = 4, lift = 0.35, time = 0 } = {}) {
    if (progress <= 0) return null;
    const pt = (u) => this.arcPoint(a, b, r, u, lift);
    const steps = 48;
    const n = Math.max(2, Math.ceil(steps * progress));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const [lw, al] of [
      [width * 5, 0.12],
      [width * 2.4, 0.3],
      [width, 1],
    ]) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const p = pt((i / n) * progress);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = al === 1 ? '#fff' : color;
      ctx.globalAlpha = al;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    const head = pt(progress);
    const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, width * 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.9 + Math.sin(time * 40) * 0.1;
    ctx.fillStyle = g;
    ctx.fillRect(head.x - width * 8, head.y - width * 8, width * 16, width * 16);
    ctx.restore();
    return head;
  }
}

export class DotGlobe {
  constructor() {
    // heart targets for the morph (deterministic)
    const rnd = mulberry32(42);
    this.heart = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      let x;
      let y;
      do {
        x = rnd() * 2 - 1;
        y = rnd() * 2 - 1.05;
      } while (!insideHeart(x, y));
      this.heart[i * 2] = x;
      this.heart[i * 2 + 1] = y;
    }
  }

  /**
   * cx, cy, R in px; lon0 rotation (degrees); morph 0..1 (sphere -> heart)
   */
  draw(ctx, cx, cy, R, lon0, { tilt = 18, morph = 0, time = 0, land = '#ffe9d6', fr = '#5aa9ff', br = '#ffe066', heartColor = '#ff3d6a', ocean = true } = {}) {
    const tr = (tilt * Math.PI) / 180;
    const ct = Math.cos(tr);
    const st = Math.sin(tr);
    if (ocean && morph < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - morph;
      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
      g.addColorStop(0, '#2a6fb0');
      g.addColorStop(0.7, '#123a6b');
      g.addColorStop(1, '#0a1f3d');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();
      const a = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.25);
      a.addColorStop(0, 'rgba(140,200,255,0.45)');
      a.addColorStop(1, 'rgba(140,200,255,0)');
      ctx.fillStyle = a;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.25, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    const skip = quality.tier === 'low' ? 2 : 1;
    const s0 = Math.max(1.2, R / 95);
    for (let i = 0; i < N; i += skip) {
      const lon = ((D[i * 3] - lon0) * Math.PI) / 180;
      const lat = (D[i * 3 + 1] * Math.PI) / 180;
      const f = D[i * 3 + 2];
      const cl = Math.cos(lat);
      const x = cl * Math.sin(lon);
      const y0 = Math.sin(lat);
      const z0 = cl * Math.cos(lon);
      const y = -(ct * y0 - st * z0);
      const z = st * y0 + ct * z0;
      const vis = z > 0 ? 1 : morph;
      if (vis <= 0.02) continue;
      const hx = this.heart[i * 2];
      const hy = this.heart[i * 2 + 1];
      const m = morph * morph * (3 - 2 * morph);
      const px = cx + lerp(x * R, hx * R * 1.15, m);
      const py = cy + lerp(y * R, hy * R * 1.15, m);
      const s = s0 * (0.55 + 0.45 * Math.max(z, 0)) * (1 + m * 0.4);
      ctx.globalAlpha = Math.min(1, vis) * (0.55 + 0.45 * Math.max(z, m));
      ctx.fillStyle = m > 0.5 ? (f ? '#fff' : heartColor) : f === 1 ? fr : f === 2 ? br : land;
      ctx.fillRect(px - s / 2, py - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
}
