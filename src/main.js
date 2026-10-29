import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/anton/400.css';
import '@fontsource/lilita-one/400.css';
import '@fontsource/vt323/400.css';
import '@fontsource/press-start-2p/400.css';
import '@fontsource/great-vibes/400.css';

import './styles/base.css';
import './styles/s00-intro.css';
import './styles/s01-question.css';
import './styles/s02-breaking.css';
import './styles/s03-lula.css';
import './styles/s04-scanner.css';
import './styles/s05-stadium.css';
import './styles/s06-overload.css';
import './styles/s07-wedding.css';
import './styles/s08-honeymoon.css';
import './styles/s09-fakeend.css';
import './styles/s10-finale.css';
import './styles/s11-credits.css';

import { gsap } from 'gsap';
import { audio } from './audio/engine.js';
import './audio/music.js';
import { stage } from './core/stage.js';
import { quality } from './core/quality.js';
import { preload } from './core/assets.js';
import { Particles } from './effects/particles.js';
import { Director } from './core/director.js';
import { SCENES } from './scenes/index.js';
import { el } from './utils/dom.js';

const app = { stage, quality, audio };
app.fx = new Particles(document.getElementById('fx'));
app.director = new Director(app, SCENES);
window.__app = app;
window.gsap = gsap;

/* ───────────── controls ───────────── */
const btnSound = document.getElementById('btn-sound');
const btnMotion = document.getElementById('btn-motion');
btnSound.addEventListener('click', (e) => {
  e.stopPropagation();
  const m = !audio.muted;
  if (!audio.ready) audio.unlock();
  audio.setMuted(m);
  btnSound.setAttribute('aria-pressed', String(m));
  btnSound.setAttribute('aria-label', m ? 'Som desligado' : 'Som ligado');
});
btnMotion.setAttribute('aria-pressed', String(quality.reduced));
btnMotion.addEventListener('click', (e) => {
  e.stopPropagation();
  quality.setReduced(!quality.reduced);
  btnMotion.setAttribute('aria-pressed', String(quality.reduced));
});

/* no pinch-zoom / rubber band on iOS */
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => !e.target.closest?.('.cr-lic-box') && e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());

/* ───────────── boot ───────────── */
async function fontsReady() {
  const fams = ['400 40px "Instrument Serif"', 'italic 400 40px "Instrument Serif"', '40px "Anton"', '40px "Lilita One"', '40px "VT323"', '20px "Press Start 2P"', '40px "Great Vibes"'];
  const all = Promise.all(fams.map((f) => document.fonts.load(f, 'AaÃçé!')));
  await Promise.race([all, new Promise((r) => setTimeout(r, 5000))]).catch(() => {});
}

function tapToStart() {
  return new Promise((resolve) => {
    const b = el('button.debug-start', { text: '▶ toque para começar' });
    Object.assign(b.style, { position: 'absolute', inset: '0', zIndex: 95, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: '22px' });
    b.addEventListener('click', () => {
      audio.unlock();
      b.remove();
      resolve();
    });
    stage.app.append(b);
  });
}

async function boot() {
  const loader = document.getElementById('loader');
  const pct = loader.querySelector('.loader-pct');
  let fp = 0;
  let ip = 0;
  const upd = () => (pct.textContent = Math.round((fp * 0.25 + ip * 0.75) * 100) + '%');
  await Promise.all([
    fontsReady().then(() => {
      fp = 1;
      upd();
    }),
    preload((p) => {
      ip = p;
      upd();
    }),
  ]);
  // warm up the 3D module (wedding rings) in the background
  import('./effects/rings3d.js').catch(() => {});
  loader.classList.add('gone');
  setTimeout(() => loader.remove(), 800);
  document.getElementById('ui').classList.add('on');

  const params = new URLSearchParams(location.search);
  const start = params.get('scene');
  if (start && app.director.indexOf(start) >= 0) {
    if (!params.has('auto')) await tapToStart();
    else audio.unlock();
    app.director.start(app.director.indexOf(start));
  } else app.director.start(0);
}

gsap.config({ force3D: true });
boot();
