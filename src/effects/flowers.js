import { TAU, mulberry32 } from '../utils/math.js';

/* Procedural floral arch, painted once into an offscreen canvas (roses, leaves, baby's breath). */

const ROSES = [
  [350, 80, 82],
  [345, 85, 70],
  [10, 70, 88],
  [35, 90, 85],
  [0, 0, 97],
  [340, 70, 60],
];

function rose(ctx, x, y, r, [h, s, l], rnd) {
  const a0 = rnd() * TAU;
  for (let i = 0; i < 7; i++) {
    const a = a0 + (i / 7) * TAU;
    ctx.fillStyle = `hsl(${h},${s}%,${l - 12}%)`;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.56, r * 0.4, a, 0, TAU);
    ctx.fill();
  }
  const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.1, x, y, r * 0.75);
  g.addColorStop(0, `hsl(${h},${s}%,${Math.min(98, l + 8)}%)`);
  g.addColorStop(1, `hsl(${h},${s}%,${l - 6}%)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.68, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `hsla(${h},${s}%,${l - 30}%,0.55)`;
  ctx.lineWidth = Math.max(1, r * 0.07);
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.arc(x + Math.cos(a0 + k) * r * 0.04, y + Math.sin(a0 + k) * r * 0.04, r * (0.55 - k * 0.12), a0 + k * 1.3, a0 + k * 1.3 + 3.6);
    ctx.stroke();
  }
}

function leaf(ctx, x, y, len, ang, rnd) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = rnd() < 0.5 ? '#4f8a43' : '#3c7134';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,255,200,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len * 0.9, 0);
  ctx.stroke();
  ctx.restore();
}

/** w, h in css px. Returns a canvas (dpr-scaled) with the arch on a transparent background. */
export function paintArch(w, h, dpr = 1.5) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const rnd = mulberry32(2026);
  const m = Math.min(w, h);
  const cx = w / 2;
  const rx = w * 0.42;
  const ry = h * 0.86;
  const base = h;
  const pt = (t) => ({ x: cx - Math.cos(t) * rx, y: base - Math.sin(t) * ry });
  // vine
  ctx.strokeStyle = '#3c5a2e';
  ctx.lineWidth = m * 0.012;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const p = pt((i / 60) * Math.PI);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  const N = 85;
  // leaves first, flowers on top
  for (let i = 0; i < N * 2; i++) {
    const t = rnd() * Math.PI;
    const p = pt(t);
    leaf(ctx, p.x + (rnd() - 0.5) * m * 0.05, p.y + (rnd() - 0.5) * m * 0.05, m * (0.03 + rnd() * 0.035), rnd() * TAU, rnd);
  }
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI + (rnd() - 0.5) * 0.05;
    const p = pt(t);
    const big = rnd() < 0.35;
    rose(ctx, p.x + (rnd() - 0.5) * m * 0.04, p.y + (rnd() - 0.5) * m * 0.04, m * (big ? 0.03 : 0.018) * (0.8 + rnd() * 0.5), ROSES[Math.floor(rnd() * ROSES.length)], rnd);
  }
  // baby's breath
  ctx.fillStyle = 'rgba(255,255,250,0.95)';
  for (let i = 0; i < N * 3; i++) {
    const p = pt(rnd() * Math.PI);
    ctx.beginPath();
    ctx.arc(p.x + (rnd() - 0.5) * m * 0.08, p.y + (rnd() - 0.5) * m * 0.08, m * 0.003 + rnd() * m * 0.003, 0, TAU);
    ctx.fill();
  }
  // hanging garlands
  for (let g = 0; g < 7; g++) {
    const p = pt(0.35 + (g / 6) * (Math.PI - 0.7));
    const len = m * (0.05 + rnd() * 0.08);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = k % 2 ? 'rgba(255,240,245,0.95)' : 'rgba(255,190,205,0.95)';
      ctx.beginPath();
      ctx.arc(p.x, p.y + (k / 4) * len, m * 0.006, 0, TAU);
      ctx.fill();
    }
  }
  return c;
}
