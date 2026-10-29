import { img } from '../core/assets.js';
import { TAU } from '../utils/math.js';

/* Flag textures (offscreen canvases) and a cloth-like waving renderer. */

const tex = new Map();

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** 'br' | 'fr' | 'love' (the impossible fused flag: "AMOR E CROISSANT") */
export function flagTexture(kind) {
  if (tex.has(kind)) return tex.get(kind);
  const W = 900;
  const H = kind === 'fr' ? 600 : 630;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  if (kind === 'fr') {
    ['#0055A4', '#FFFFFF', '#EF4135'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect((i * W) / 3, 0, W / 3 + 1, H);
    });
  } else if (kind === 'br') {
    const im = img('flag/br');
    if (im) ctx.drawImage(im, 0, 0, W, H);
    else drawBrazil(ctx, W, H, 'ORDEM E PROGRESSO');
  } else {
    // French tricolour background + Brazilian lozenge and globe, new motto
    ['#0055A4', '#FFFFFF', '#EF4135'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect((i * W) / 3, 0, W / 3 + 1, H);
    });
    drawBrazil(ctx, W, H, 'AMOR E CROISSANT', true);
  }
  tex.set(kind, c);
  return c;
}

function drawBrazil(ctx, W, H, motto, overlay = false) {
  if (!overlay) {
    ctx.fillStyle = '#009C3B';
    ctx.fillRect(0, 0, W, H);
  }
  const m = W * 0.085;
  ctx.fillStyle = '#FFDF00';
  ctx.beginPath();
  ctx.moveTo(m, H / 2);
  ctx.lineTo(W / 2, m * 0.9);
  ctx.lineTo(W - m, H / 2);
  ctx.lineTo(W / 2, H - m * 0.9);
  ctx.closePath();
  ctx.fill();
  if (overlay) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#009C3B';
    ctx.stroke();
  }
  const r = H * 0.25;
  ctx.fillStyle = '#002776';
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, r, 0, TAU);
  ctx.fill();
  // stars
  ctx.fillStyle = '#fff';
  const rng = mul(7);
  for (let i = 0; i < 27; i++) {
    const a = rng() * TAU;
    const d = Math.sqrt(rng()) * r * 0.85;
    const x = W / 2 + Math.cos(a) * d;
    const y = H / 2 + Math.sin(a) * d;
    if (y < H / 2 - r * 0.25 && y > H / 2 - r * 0.6) continue;
    star(ctx, x, y, r * (0.025 + rng() * 0.03));
  }
  // motto band
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, r, 0, TAU);
  ctx.clip();
  ctx.lineWidth = overlay ? r * 0.3 : r * 0.2;
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.arc(W / 2 - r * 0.12, H / 2 + r * 1.55, r * 1.95, -Math.PI * 0.82, -Math.PI * 0.18);
  ctx.stroke();
  ctx.restore();
  // curved text
  ctx.save();
  ctx.fillStyle = '#009C3B';
  ctx.font = `bold ${Math.round(r * (overlay ? 0.2 : 0.13))}px "Lilita One", "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = W / 2 - r * 0.12;
  const cy = H / 2 + r * 1.55;
  const R = r * 1.95;
  const span = overlay ? 0.62 : 0.5;
  const chars = Array.from(motto);
  chars.forEach((ch, i) => {
    const a = -Math.PI / 2 - span / 2 + (span * (i + 0.5)) / chars.length + 0.06;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function star(ctx, x, y, s) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? s * 0.45 : s;
    const a = (i / 10) * TAU - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.fill();
}

function mul(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/**
 * Draws a waving flag: the texture is sliced in vertical strips displaced by a travelling
 * sine wave (amplitude grows away from the pole) and shaded by the wave slope.
 */
export function drawWavingFlag(ctx, texture, x, y, w, h, time, { amp = 0.06, freq = 2.2, speed = 5, strips = 36, pole = true, alpha = 1, shade = 0.35 } = {}) {
  const tw = texture.width;
  const th = texture.height;
  const sw = w / strips;
  const A = h * amp;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < strips; i++) {
    const u = i / strips;
    const fall = pole ? u : 1;
    const ph = u * freq * TAU - time * speed;
    const dy = Math.sin(ph) * A * fall;
    const slope = Math.cos(ph) * fall;
    const sx = (i * tw) / strips;
    const squeeze = 1 - Math.abs(slope) * 0.04;
    ctx.drawImage(texture, sx, 0, tw / strips + 1, th, x + i * sw, y + dy + (h * (1 - squeeze)) / 2, sw + 1, h * squeeze);
    if (shade) {
      ctx.fillStyle = slope > 0 ? `rgba(0,0,0,${(slope * shade * 0.6).toFixed(3)})` : `rgba(255,255,255,${(-slope * shade * 0.5).toFixed(3)})`;
      ctx.fillRect(x + i * sw, y + dy + (h * (1 - squeeze)) / 2, sw + 1, h * squeeze);
    }
  }
  if (pole) {
    ctx.fillStyle = '#d8d2c4';
    ctx.fillRect(x - h * 0.04, y - h * 0.08, h * 0.04, h * 1.9);
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(x - h * 0.02, y - h * 0.1, h * 0.045, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
