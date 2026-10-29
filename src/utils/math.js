export const TAU = Math.PI * 2;

export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => clamp((v - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Point on the classic parametric heart, normalised to roughly [-1, 1]. y grows downward. */
export function heartPoint(t) {
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x: x / 17, y: -y / 17 };
}

/** n points evenly spread along the heart outline. */
export function heartOutline(n) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(heartPoint((i / n) * TAU));
  return pts;
}

/** Random point inside the heart (rejection sampling). */
export function heartFill() {
  for (let k = 0; k < 40; k++) {
    const x = rand(-1, 1);
    const y = rand(-1.05, 0.85);
    if (insideHeart(x, y)) return { x, y };
  }
  return { x: 0, y: 0 };
}
export function insideHeart(x, y) {
  // implicit heart: (x^2 + y'^2 - 1)^3 - x^2 y'^3 <= 0 with y flipped / scaled
  const X = x * 1.15;
  const Y = -y * 1.15 + 0.15;
  const a = X * X + Y * Y - 1;
  return a * a * a - X * X * Y * Y * Y <= 0;
}

/** Deterministic PRNG for repeatable layouts. */
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
