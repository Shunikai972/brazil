import { COUPLE } from '../config.js';
import { el, loadImage } from '../utils/dom.js';

/* Image registry + preloader. Every key maps to a local file (nothing external at runtime). */

const LULA = ['jersey-full', 'jersey-thumbs', 'official-body', 'official-face', 'laugh', 'cap-thumb', 'fists'];
const HEADS = ['official-face', 'jersey-thumbs', 'jersey-full', 'laugh', 'cap-thumb', 'fists'];
const FACES = ['official-body'];

export const MANIFEST = {
  'flag/br': 'assets/flags/brazil.svg',
  'flag/fr': 'assets/flags/france.svg',
};
LULA.forEach((k) => (MANIFEST['lula/' + k] = `assets/lula/${k}.webp`));
HEADS.forEach((k) => (MANIFEST['head/' + k] = `assets/lula/head-${k}.webp`));
FACES.forEach((k) => (MANIFEST['face/' + k] = `assets/lula/face-${k}.webp`));
MANIFEST['couple/me'] = COUPLE.me.src;
MANIFEST['couple/her'] = COUPLE.her.src;

const store = new Map();

export function src(key) {
  const im = store.get(key);
  return im ? im.src : MANIFEST[key];
}
export function img(key) {
  return store.get(key) || null;
}

/** <img> element for a key (cloned from the decoded cache) */
export function imgEl(key, cls = '') {
  const i = el('img' + (cls ? '.' + cls.split(' ').join('.') : ''), { src: src(key), alt: '', draggable: false });
  return i;
}

export async function preload(onProgress = () => {}) {
  const keys = Object.keys(MANIFEST);
  let done = 0;
  await Promise.all(
    keys.map(async (k) => {
      let im = await loadImage(MANIFEST[k]);
      if (!im && k.startsWith('couple/')) im = await placeholder(k.split('/')[1]);
      if (im) {
        try {
          await im.decode();
        } catch (_) {}
        store.set(k, im);
      }
      onProgress(++done / keys.length);
    }),
  );
}

/** Painted placeholder portrait used when a couple photo is missing. */
async function placeholder(who) {
  const c = document.createElement('canvas');
  c.width = 720;
  c.height = 1280;
  const ctx = c.getContext('2d');
  const her = who === 'her';
  const g = ctx.createLinearGradient(0, 0, 0, 1280);
  g.addColorStop(0, her ? '#ffb3c1' : '#9fc5ff');
  g.addColorStop(1, her ? '#ff4d6d' : '#2b59c3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 720, 1280);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(360, 470, 170, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(360, 1050, 330, 330, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#1a0710';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(her ? 'FOTO DELA' : 'SUA FOTO', 360, 1180);
  ctx.font = '36px sans-serif';
  ctx.fillText(`assets/couple/${who}.webp`, 360, 1235);
  return loadImage(c.toDataURL('image/png'));
}

/**
 * A photo frame filled with one of the couple photos, centred on its focus point.
 * Call layoutPortraits(root) after the element is in the DOM (and on resize).
 */
export function portrait(who, { zoom, cls = '' } = {}) {
  const p = el('div.portrait' + (cls ? '.' + cls.split(' ').join('.') : ''), { dataset: { who, zoom: zoom ?? COUPLE[who].zoom } });
  p.style.backgroundImage = `url("${src('couple/' + who)}")`;
  return p;
}

export function layoutPortraits(root) {
  root.querySelectorAll('.portrait').forEach((p) => {
    const who = p.dataset.who;
    const im = img('couple/' + who);
    if (!im) return;
    const W = p.clientWidth;
    const H = p.clientHeight;
    if (!W || !H) return;
    const iw = im.naturalWidth || im.width;
    const ih = im.naturalHeight || im.height;
    const [fx, fy] = COUPLE[who].focus;
    const s = Math.max(W / iw, H / ih) * parseFloat(p.dataset.zoom || 1);
    const bw = iw * s;
    const bh = ih * s;
    let x = W / 2 - fx * bw;
    let y = H / 2 - fy * bh;
    x = Math.min(0, Math.max(W - bw, x));
    y = Math.min(0, Math.max(H - bh, y));
    p.style.backgroundSize = `${bw.toFixed(1)}px ${bh.toFixed(1)}px`;
    p.style.backgroundPosition = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  });
}
