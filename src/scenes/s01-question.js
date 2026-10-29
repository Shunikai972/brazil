import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { riseLetters, waveLetters } from '../animations/text.js';
import { cracks } from '../animations/transitions.js';
import { heartPath, PALETTE } from '../effects/particles.js';
import { rand, pick, TAU, shuffle } from '../utils/math.js';
import { TEXT } from '../config.js';

/* 01 — "Do you love me?" — a tender question with a NO button that refuses to be pressed. */

const LINES = [
  'KKKKKK NEM TENTA',
  'OPA, CALMA AÍ',
  'ERROU 😭',
  'ESSE BOTÃO NÃO EXISTE',
  'CADÊ O SIM, MULHER?',
  'tá de brincadeira né',
  'erro 404: NÃO não encontrado',
  'o NÃO tá de férias em Paris',
  'sai daqui 😤',
  'quase... só que não',
  'NÃO é uma palavra muito forte',
];
// escalating escape repertoire
const PLAN = ['slide', 'slide', 'teleport', 'shrink', 'slide', 'barata', 'smoke', 'teleport', 'slide', 'die'];

class Sky {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.t = 0;
    this.resize();
    const n = quality.n(160);
    this.stars = Array.from({ length: n }, () => ({ x: rand(), y: rand() ** 1.4, r: rand(0.4, 1.5), ph: rand(TAU), sp: rand(0.6, 2.2) }));
    this.bokeh = Array.from({ length: quality.n(14) }, () => ({ x: rand(), y: rand(0.3, 1), r: rand(0.04, 0.13), vx: rand(-0.006, 0.006), vy: rand(-0.01, -0.003), hue: pick(['255,120,140', '255,190,120', '255,90,110', '250,210,170']), a: rand(0.05, 0.16) }));
    this.hearts = Array.from({ length: quality.n(12) }, () => this.newHeart(true));
    this.shoot = null;
  }
  newHeart(initial) {
    return { x: rand(0.05, 0.95), y: initial ? rand(0.2, 1.1) : 1.08, s: rand(0.018, 0.045), vy: rand(0.018, 0.04), ph: rand(TAU), rot: rand(-0.3, 0.3), a: rand(0.25, 0.6) };
  }
  resize() {
    const dpr = Math.min(quality.cfg.dpr, 1.5);
    this.w = stage.w;
    this.h = stage.h;
    this.dpr = dpr;
    this.c.width = this.w * dpr;
    this.c.height = this.h * dpr;
  }
  frame(dt) {
    this.t += dt;
    const { ctx, w, h, t } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const m = Math.min(w, h);
    for (const b of this.bokeh) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -0.2) b.y = 1.2;
      const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * m);
      g.addColorStop(0, `rgba(${b.hue},${b.a})`);
      g.addColorStop(0.7, `rgba(${b.hue},${b.a * 0.5})`);
      g.addColorStop(1, `rgba(${b.hue},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(b.x * w - b.r * m, b.y * h - b.r * m, b.r * m * 2, b.r * m * 2);
    }
    for (const s of this.stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.sp + s.ph));
      ctx.fillStyle = `rgba(255,240,225,${a.toFixed(2)})`;
      ctx.fillRect(s.x * w, s.y * h * 0.85, s.r, s.r);
    }
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    for (let i = 0; i < this.hearts.length; i++) {
      const hh = this.hearts[i];
      hh.y -= hh.vy * dt;
      if (hh.y < -0.1) this.hearts[i] = this.newHeart(false);
      const x = hh.x * w + Math.sin(t * 0.8 + hh.ph) * m * 0.02;
      const y = hh.y * h;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(hh.rot + Math.sin(t + hh.ph) * 0.15);
      ctx.beginPath();
      heartPath(ctx, 0, 0, hh.s * m);
      ctx.strokeStyle = `rgba(255,143,163,${hh.a})`;
      ctx.stroke();
      ctx.restore();
    }
    // the occasional shooting star
    if (!this.shoot && Math.random() < dt * 0.12) this.shoot = { x: rand(0.1, 0.9), y: rand(0.02, 0.3), age: 0, ang: rand(0.25, 0.6) };
    if (this.shoot) {
      const s = this.shoot;
      s.age += dt;
      const k = s.age / 0.9;
      if (k >= 1) this.shoot = null;
      else {
        const x = (s.x + Math.cos(s.ang) * k * 0.4) * w;
        const y = (s.y + Math.sin(s.ang) * k * 0.4) * h;
        const g = ctx.createLinearGradient(x, y, x - Math.cos(s.ang) * m * 0.15, y - Math.sin(s.ang) * m * 0.15);
        g.addColorStop(0, `rgba(255,245,230,${(1 - k) * 0.9})`);
        g.addColorStop(1, 'rgba(255,245,230,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.cos(s.ang) * m * 0.15, y - Math.sin(s.ang) * m * 0.15);
        ctx.stroke();
      }
    }
  }
}

const HEART_SVG = `<svg viewBox="-55 -52 110 104" aria-hidden="true"><defs>
<radialGradient id="yg" cx="35%" cy="25%" r="85%"><stop offset="0" stop-color="#ff6b83"/><stop offset=".45" stop-color="#e8173a"/><stop offset="1" stop-color="#8e0a24"/></radialGradient></defs>
<path class="yh" d="M0,-20 C0,-50 -50,-50 -50,-18 C-50,12 -8,26 0,50 C8,26 50,12 50,-18 C50,-50 0,-50 0,-20Z" fill="url(#yg)"/>
<path d="M-30,-34 C-40,-30 -42,-20 -40,-12" stroke="rgba(255,255,255,.7)" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`;

const ROACH_SVG = `<svg viewBox="-40 -60 80 120" aria-hidden="true"><g class="legs" stroke="#2b160a" stroke-width="4" stroke-linecap="round" fill="none">
<path class="l1" d="M-12,-14 L-30,-30"/><path class="l2" d="M-14,2 L-34,4"/><path class="l3" d="M-12,18 L-30,36"/>
<path class="r1" d="M12,-14 L30,-30"/><path class="r2" d="M14,2 L34,4"/><path class="r3" d="M12,18 L30,36"/></g>
<path d="M-6,-38 C-14,-60 -22,-64 -30,-66 M6,-38 C14,-60 22,-64 30,-66" stroke="#2b160a" stroke-width="2.5" fill="none"/>
<ellipse cx="0" cy="6" rx="17" ry="34" fill="#5a2c10"/><ellipse cx="0" cy="-32" rx="11" ry="9" fill="#3a1a08"/>
<path d="M0,-24 L0,38" stroke="#2b160a" stroke-width="2"/><ellipse cx="-6" cy="-6" rx="4" ry="10" fill="rgba(255,220,180,.35)"/></svg>`;

export class Question extends Scene {
  static id = 'question';

  async build() {
    const r = this.mount('s-question');
    this.sky = new Sky(el('canvas.q-sky'));
    this.world = el('div.q-world');
    this.kicker = el('p.q-kicker', { text: 'uma pergunta muito séria' });
    this.title = el('h1.q-title', { text: TEXT.question });
    this.scribble = el('div.q-scribble', {
      html: `<svg viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true"><path d="M8,38 C80,22 150,48 230,34 S380,18 450,36 C490,46 520,40 540,30 C548,18 566,14 574,24 C582,14 598,18 592,32 C586,44 568,50 560,56 C552,48 534,42 540,30" /></svg>`,
    });
    this.yes = el('button.q-yes', { type: 'button', 'aria-label': 'YES' }, [el('span.q-yes-heart', { html: HEART_SVG }), el('span.q-yes-label', { text: 'YES' })]);
    this.yesGlow = el('div.q-yes-glow');
    this.yesWrap = el('div.q-yes-wrap', {}, [this.yesGlow, this.yes]);
    this.no = el('button.q-no', { type: 'button', 'aria-label': 'NO' }, [el('span.q-no-lbl', { text: 'no' }), el('span.q-no-ico', { html: '<svg viewBox="0 0 24 22"><path d="M12 5C10 1 3 1 3 7c0 5 6 8 9 13 3-5 9-8 9-13 0-6-7-6-9-2l-2 4 3 3-2 4" /></svg>' })]);
    this.rx = el('div.q-rx');
    this.world.append(el('div.q-center', {}, [this.kicker, this.title, this.scribble]), this.yesWrap);
    r.append(this.sky.c, el('div.q-vignette'), this.world, this.no, this.rx);
    this.lines = shuffle(LINES);
    this.tries = 0;
    this.lastDodge = 0;
    this.dead = false;
    this.locked = true;
    this.noScale = 1;
    this.tick((dt) => !this.frozen && this.sky.frame(dt));
    this.onResize(() => {
      this.sky.resize();
      if (!this.dead) this.placeNo(true);
    });
  }

  placeNo(initial) {
    // layout box of YES (ignores its running scale animation)
    const wr = this.yesWrap.getBoundingClientRect();
    const yw = this.yes.offsetWidth;
    const yh = this.yes.offsetHeight;
    const y = { left: wr.left - yw / 2, right: wr.left + yw / 2, top: wr.top - yh / 2, bottom: wr.top + yh / 2, height: yh };
    const nw = this.no.offsetWidth;
    const nh = this.no.offsetHeight;
    let x;
    let yy;
    if (stage.w - y.right > nw + stage.u * 10) {
      x = y.right + stage.u * 6;
      yy = y.top + y.height / 2 - nh / 2;
    } else {
      x = y.right - nw * 0.2;
      yy = y.bottom + stage.u * 2;
    }
    this.nx = Math.min(stage.w - nw - 10, x);
    this.ny = Math.min(stage.h - nh - 10, yy);
    gsap.set(this.no, { x: this.nx, y: this.ny, rotation: initial ? -6 : 0 });
  }

  run() {
    const { tl: titleIn, chars } = riseLetters(this.title, { stagger: 0.06, duration: 1.4 });
    const tl = this.timeline();
    tl.from(this.root, { opacity: 0, duration: 1.2 }, 0);
    tl.add(titleIn, 0.4);
    tl.from(this.kicker, { opacity: 0, letterSpacing: '0.6em', duration: 1.6, ease: 'expo.out' }, 0.2);
    tl.fromTo(this.scribble.querySelector('path'), { strokeDashoffset: 1400 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 1.4);
    tl.from(this.yes, { scale: 0, rotation: -25, duration: 1.1, ease: 'elastic.out(1, 0.45)' }, 1.9);
    tl.call(() => sfx.pop(0, 1.2), null, 1.95);
    tl.call(() => this.placeNo(true), null, 2.0);
    tl.fromTo(this.no, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, 2.25);
    tl.call(() => {
      this.locked = false;
      this.wave = waveLetters(chars, { amp: 0.045, speed: 2.4 });
      this._tls.push(this.wave);
    }, null, 2.6);
    this.beat = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
    this.beat.to(this.yes, { scale: 1.09, duration: 0.14, ease: 'power2.out' }).to(this.yes, { scale: 1, duration: 0.2, ease: 'power2.in' }).to(this.yes, { scale: 1.06, duration: 0.12 }).to(this.yes, { scale: 1, duration: 0.3, ease: 'power3.out' });
    this.beat.to(this.yesGlow, { opacity: 0.9, scale: 1.25, duration: 0.3, yoyo: true, repeat: 1 }, 0);
    this.beat.delay(3);
    this._tls.push(this.beat);

    // ── NO button evasion ──
    const near = (px, py, extra = 0) => {
      const b = this.no.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const R = Math.max(b.width, b.height) * 0.55 + (quality.touch ? 26 : 70) + extra;
      return Math.hypot(px - cx, py - cy) < R;
    };
    this.listen(this.root, 'pointermove', (e) => {
      if (e.pointerType === 'mouse' && near(e.clientX, e.clientY)) this.dodge(e.clientX, e.clientY);
    });
    this.listen(this.root, 'pointerdown', (e) => {
      if (this.no.contains(e.target) || near(e.clientX, e.clientY, 14)) {
        e.preventDefault();
        this.dodge(e.clientX, e.clientY, true);
      }
    });
    this.listen(this.no, 'click', (e) => {
      e.preventDefault();
      const b = this.no.getBoundingClientRect();
      this.dodge(b.left + b.width / 2, b.top + b.height / 2, true);
    });
    this.listen(this.no, 'focus', () => this.yes.focus());

    return new Promise((resolve) => {
      this.listen(this.yes, 'click', () => {
        if (this.answered) return;
        this.answered = true;
        this.freeze().then(resolve);
      });
    });
  }

  /* ─────────────────────────── evasion ─────────────────────────── */

  target(px, py) {
    const nw = this.no.offsetWidth * this.noScale;
    const nh = this.no.offsetHeight * this.noScale;
    const m = stage.u * 4;
    const top = Math.max(m, 64);
    const yb = this.yes.getBoundingClientRect();
    let best = null;
    let bestD = -1;
    for (let i = 0; i < 24; i++) {
      const x = rand(m, stage.w - nw - m);
      const y = rand(top, stage.h - nh - m);
      const overlapYes = x + nw > yb.left - 10 && x < yb.right + 10 && y + nh > yb.top - 10 && y < yb.bottom + 10;
      if (overlapYes) continue;
      const d = Math.hypot(x + nw / 2 - px, y + nh / 2 - py);
      if (d > bestD) {
        bestD = d;
        best = { x, y };
      }
    }
    return best || { x: m, y: top };
  }

  dodge(px, py, forced = false) {
    if (this.locked || this.dead) return;
    const now = performance.now();
    if (now - this.lastDodge < (forced ? 120 : 260)) return;
    this.lastDodge = now;
    const kind = PLAN[Math.min(this.tries, PLAN.length - 1)];
    this.tries++;
    const b = this.no.getBoundingClientRect();
    const ox = b.left + b.width / 2;
    const oy = b.top + b.height / 2;
    const t = this.target(px, py);
    this[kind](t, ox, oy);
  }

  slide(t, ox, oy) {
    sfx.swish();
    gsap.to(this.no, { x: t.x, y: t.y, rotation: rand(-18, 18), duration: 0.38, ease: 'back.out(1.8)', overwrite: true });
    this.react(ox, oy);
  }

  teleport(t, ox, oy) {
    sfx.poof();
    this.fx.smoke(ox, oy, 12, { size: 60 });
    const tl = gsap.timeline();
    tl.to(this.no, { scale: 0, duration: 0.12, ease: 'power2.in', overwrite: true });
    tl.set(this.no, { x: t.x, y: t.y, rotation: rand(-10, 10) });
    tl.to(this.no, { scale: this.noScale, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    tl.call(() => sfx.pop(0, 1.4), null, 0.15);
    this.react(ox, oy, 'ESSE BOTÃO NÃO EXISTE');
  }

  shrink(t, ox, oy) {
    sfx.slide(false);
    this.noScale = 0.5;
    gsap.to(this.no, { x: t.x, y: t.y, scale: this.noScale, rotation: 0, duration: 0.5, ease: 'power3.out', overwrite: true });
    this.react(ox, oy, 'ERROU 😭');
  }

  smoke(t, ox, oy) {
    this.locked = true;
    sfx.poof();
    this.fx.smoke(ox, oy, 20, { size: 90 });
    this.noScale = 1;
    gsap.to(this.no, { opacity: 0, scale: 1.6, duration: 0.18, overwrite: true });
    this.react(ox, oy, 'CADÊ O SIM, MULHER?');
    // reappears upside down near a corner
    const corner = pick([
      { x: stage.w - this.no.offsetWidth - stage.u * 4, y: Math.max(70, stage.u * 12) },
      { x: stage.u * 4, y: stage.h - this.no.offsetHeight - stage.u * 6 },
      { x: stage.u * 4, y: Math.max(70, stage.u * 12) },
    ]);
    gsap.delayedCall(0.9, () => {
      if (this.answered) return;
      gsap.set(this.no, { x: corner.x, y: corner.y, rotation: 180, scale: 0 });
      gsap.to(this.no, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(3)' });
      sfx.pop(0, 0.9);
      this.locked = false;
    });
  }

  barata(t, ox, oy) {
    this.locked = true;
    gsap.to(this.no, { opacity: 0, scale: 0.3, duration: 0.15, overwrite: true });
    const roach = el('div.q-roach', { html: ROACH_SVG });
    this.root.append(roach);
    const s = stage.u * 9;
    gsap.set(roach, { x: ox - s / 2, y: oy - s * 0.75, width: s, height: s * 1.5 });
    sfx.scuttle(0.9);
    this.react(ox, oy, 'A BARATA VOOU 😱', 'tag');
    const pts = [];
    let x = ox;
    let y = oy;
    for (let i = 0; i < 4; i++) {
      x = Math.max(s, Math.min(stage.w - s, x + rand(-stage.w * 0.3, stage.w * 0.3)));
      y = Math.max(s, Math.min(stage.h - s, y + rand(-stage.h * 0.25, stage.h * 0.25)));
      pts.push({ x: x - s / 2, y: y - s * 0.75 });
    }
    const tl = gsap.timeline({ onComplete: () => roach.remove() });
    let px = ox;
    let py = oy;
    pts.forEach((p) => {
      const ang = (Math.atan2(p.y + s * 0.75 - py, p.x + s / 2 - px) * 180) / Math.PI + 90;
      tl.to(roach, { rotation: ang, duration: 0.06 });
      tl.to(roach, { x: p.x, y: p.y, duration: 0.22, ease: 'none' });
      px = p.x + s / 2;
      py = p.y + s * 0.75;
    });
    // ...and then it FLIES at your face
    tl.call(() => sfx.buzz(0.7));
    tl.to(roach, { scale: 7, rotation: '+=200', x: stage.w / 2 - s / 2, y: stage.h / 2 - s * 0.75, duration: 0.55, ease: 'power2.in' });
    tl.to(roach, { opacity: 0, duration: 0.12 }, '-=0.12');
    tl.call(() => {
      if (this.answered) return;
      const tt = this.target(stage.w / 2, stage.h / 2);
      gsap.set(this.no, { x: tt.x, y: tt.y, rotation: 8, scale: this.noScale });
      gsap.to(this.no, { opacity: 1, duration: 0.3 });
      this.locked = false;
    }, null, '+=0.35');
  }

  die(t, ox, oy) {
    this.locked = true;
    this.dead = true;
    const lbl = this.no.querySelector('.q-no-lbl');
    lbl.textContent = 'x_x';
    this.no.classList.add('dead');
    this.react(ox, oy, 'ok... você venceu', 'bubble');
    const floor = stage.h - this.no.offsetHeight - stage.u * 6;
    const tl = gsap.timeline();
    tl.to(this.no, { rotation: '+=12', duration: 0.06, yoyo: true, repeat: 5, overwrite: true });
    tl.call(() => sfx.sadTrombone());
    tl.to(this.no, { rotation: 90, scale: 1, duration: 0.5, ease: 'power2.in' });
    tl.to(this.no, { y: floor, duration: 0.7, ease: 'bounce.out' }, '<');
    tl.call(() => {
      const nb = this.no.getBoundingClientRect();
      const stone = el('div.q-tomb', { html: '<b>R.I.P.</b><span>botão NÃO</span><small>2026 – 2026<br>ele tentou</small>' });
      this.root.append(stone);
      const sw = stone.offsetWidth;
      gsap.set(stone, { x: Math.min(stage.w - sw - 8, Math.max(8, nb.left + nb.width / 2 - sw / 2)), y: stage.h, opacity: 1 });
      gsap.to(stone, { y: stage.h - stone.offsetHeight + stage.u * 1, duration: 0.9, ease: 'power3.out' });
      const ghost = this.no.cloneNode(true);
      ghost.classList.add('ghost-no');
      this.root.append(ghost);
      gsap.set(ghost, { x: nb.left, y: nb.top, rotation: 0, opacity: 0.7 });
      gsap.to(ghost, { y: nb.top - stage.h * 0.35, x: `+=${stage.u * 6}`, opacity: 0, duration: 2.6, ease: 'sine.out' });
      gsap.to(this.no, { opacity: 0, duration: 0.6 });
    }, null, '+=0.1');
    tl.call(() => this.react(stage.w / 2, stage.h * 0.16, 'só sobrou uma opção 🙂', 'tag'), null, '+=1.2');
    tl.to(this.yes, { scale: 1.18, duration: 0.6, ease: 'elastic.out(1, 0.4)' }, '<');
  }

  react(x, y, forced, style) {
    const text = forced || this.lines[this.tries % this.lines.length];
    const kind = style || pick(['meme', 'tag', 'bubble', 'meme']);
    const node = el(`div.q-react.rx-${kind}`, { text });
    this.rx.append(node);
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const px = Math.min(stage.w - w - 8, Math.max(8, x - w / 2));
    const py = Math.min(stage.h - h - 8, Math.max(60, y - h - stage.u * 6));
    gsap.set(node, { x: px, y: py, rotation: rand(-9, 9) });
    gsap.timeline({ onComplete: () => node.remove() })
      .from(node, { scale: 0, duration: 0.35, ease: 'back.out(3)' })
      .to(node, { y: py - stage.u * 5, duration: 1.4, ease: 'sine.out' }, 0)
      .to(node, { opacity: 0, scale: 0.9, duration: 0.3 }, 1.25);
  }

  /* ─────────────────────────── YES ─────────────────────────── */

  async freeze() {
    this.locked = true;
    this.frozen = true;
    this.root.classList.add('frozen');
    if (this.wave) this.wave.pause();
    this.beat.pause();
    gsap.killTweensOf(this.no);
    sfx.tapeStop();
    audio.stop('romantic', 0.12);
    gsap.to(this.yes, { scale: 1.12, duration: 0.12, ease: 'power2.out' });
    const yb = this.yes.getBoundingClientRect();
    this.ox = yb.left + yb.width / 2;
    this.oy = yb.top + yb.height / 2;
    gsap.to(this.world, { scale: 1.06, transformOrigin: `${this.ox}px ${this.oy}px`, duration: 1.1, ease: 'sine.inOut' });
    gsap.to([this.no, this.rx], { opacity: 0, duration: 0.3 });
    await this.wait(0.5);
    sfx.heartbeat();
    await this.wait(0.6);
  }

  exit() {
    const { ox, oy } = this;
    const fx = this.fx;
    const tl = this.timeline();
    tl.call(() => {
      sfx.impact(1.6);
      sfx.boom();
      stage.shake(1.5, 1.1);
      stage.flash('#fff', 0.35, 0.8);
      fx.ring(ox, oy, { r1: stage.max * 1.4, width: 60, color: '#fff', life: 0.9 });
      fx.ring(ox, oy, { r1: stage.max * 1.1, width: 24, color: '#ff3d6a', life: 1.1 });
      fx.ring(ox, oy, { r1: stage.max * 0.8, width: 12, color: '#ffd36b', life: 1.3 });
      fx.hearts(ox, oy, 70, { power: 1.3, toCamera: true, life: [0.9, 1.5], g: 0, colors: PALETTE.love });
      fx.hearts(ox, oy, 40, { power: 1.6, life: [1, 1.8] });
      fx.sparks(ox, oy, 60, { color: ['#fff', '#ffd36b', '#ff5c7a'], power: 1.5 });
      this.crack = cracks(ox, oy, { spokes: 13 });
    }, null, 0);
    tl.to(this.yes, { scale: 2.4, opacity: 0, duration: 0.35, ease: 'power3.out' }, 0);
    tl.to(this.world, { scale: 1.35, duration: 1.1, ease: 'power2.out' }, 0);
    tl.call(() => stage.cover('#fff', 0.25), null, 0.95);
    tl.to({}, { duration: 0.3 }, 0.95);
    tl.call(() => this.crack.node.remove());
    return this.play(tl);
  }
}
