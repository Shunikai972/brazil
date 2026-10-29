import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { lula, head, face } from '../animations/lula.js';
import { portrait, layoutPortraits } from '../core/assets.js';
import { flagTexture, drawWavingFlag } from '../effects/flags.js';
import { PALETTE } from '../effects/particles.js';
import { rand, pick, TAU } from '../utils/math.js';

/* 10 — FESTA BRASILEIRA. The browser turns into an international wedding festival. */

const BPM = 128;
const B = 60 / BPM;
const FW_COLORS = [['#ff2e4d', '#ffd1dc'], ['#ffdf00', '#fff'], ['#009c3b', '#ffdf00'], ['#0055a4', '#fff'], ['#ef4135', '#fff'], ['#ff5cc8', '#ffd36b'], ['#7fffd4', '#fff']];

export class Finale extends Scene {
  static id = 'finale';

  async build() {
    const r = this.mount('s-finale');
    const W = stage.w;
    const H = stage.h;
    this.canvas = el('canvas.fn-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.planet = el('div.fn-planet', {}, [el('div.fn-ring.back'), face('official-body', 'fn-face'), el('div.fn-ring.front'), el('span.fn-pl', { text: 'PLANETA LULA' })]);
    this.couple = el('div.fn-couple', {}, [
      el('div.fn-frame', {}, [portrait('me', { cls: 'fn-photo', zoom: 1.35 })]),
      el('div.fn-heartmid', { html: '<svg viewBox="-55 -52 110 104"><path d="M0,-20 C0,-50 -50,-50 -50,-18 C-50,12 -8,26 0,50 C8,26 50,12 50,-18 C50,-50 0,-50 0,-20Z"/></svg>' }),
      el('div.fn-frame', {}, [portrait('her', { cls: 'fn-photo', zoom: 1.4 })]),
    ]);
    this.halo = el('div.fn-halo', { html: '<svg viewBox="-60 -56 120 112" aria-hidden="true"><path d="M0,-20 C0,-52 -54,-52 -54,-18 C-54,14 -8,28 0,54 C8,28 54,14 54,-18 C54,-52 0,-52 0,-20Z"/></svg>' });
    this.orbiters = ['jersey-full', 'cap-thumb', 'laugh', 'jersey-thumbs', 'fists'].map((v) => head(v, 'fn-orb'));
    this.orbit = el('div.fn-orbit', {}, this.orbiters);
    this.throwers = (stage.portrait ? [0.34, 0.66] : [0.14, 0.86]).map((x) => {
      const t = lula('jersey-full', 'fn-thrower');
      t.dataset.x = x;
      return t;
    });
    this.texts = [
      el('p.fn-t.t1', { html: 'BRASIL <span>❤</span> FRANÇA' }),
      el('p.fn-t.t2', { html: 'THE MOST<br>INTERNATIONAL<br>LOVE STORY EVER' }),
      el('p.fn-t.t3', { html: 'CASAMENTO<br>DO SÉCULO' }),
      el('p.fn-t.t4', { html: '999999%<br><small>COMPATIBILITY</small>' }),
    ];
    this.white = el('div.fn-white');
    this.forever = el('p.fn-forever', { html: 'Brasil <span>❤</span> França<br><small>pra sempre (ou até o próximo surto criativo)</small>' });
    r.append(el('div.fn-sky'), this.canvas, this.planet, this.halo, this.couple, this.orbit, ...this.throwers, ...this.texts, this.forever, this.white);
    this.st = { flags: 0, lasers: 0, orbit: 0, t: 0 };
    this.resize();
    this.onResize(() => this.resize());
    requestAnimationFrame(() => layoutPortraits(r));
    // place throwers below the screen
    this.throwers.forEach((t) => {
      const h = stage.min * 0.3;
      t.style.height = h + 'px';
      t.querySelector('img').style.cssText = 'height:100%;width:auto';
      gsap.set(t, { xPercent: -50, x: W * +t.dataset.x, y: H + 10 });
    });
    this.orbiters.forEach((o) => {
      const h = stage.min * 0.1;
      o.style.height = h + 'px';
      o.querySelector('img').style.cssText = 'height:100%;width:auto';
      gsap.set(o, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    });
    this.tick((dt) => this.render(dt));
  }

  resize() {
    const dpr = Math.min(quality.cfg.dpr, 1.75);
    this.dpr = dpr;
    this.canvas.width = stage.w * dpr;
    this.canvas.height = stage.h * dpr;
  }

  coupleCenter() {
    const b = this.couple.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height };
  }

  render(dt) {
    const st = this.st;
    st.t += dt;
    const t = st.t;
    const { ctx, dpr } = this;
    const W = stage.w;
    const H = stage.h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // lasers
    if (st.lasers > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const sources = [
        [0, H],
        [W, H],
        [W * 0.3, H],
        [W * 0.7, H],
      ];
      sources.forEach(([x, y], i) => {
        const a = -Math.PI / 2 + Math.sin(t * (1.2 + i * 0.3) + i * 1.7) * 0.75 + (i === 0 ? 0.45 : i === 1 ? -0.45 : 0);
        const len = Math.hypot(W, H);
        const x2 = x + Math.cos(a) * len;
        const y2 = y + Math.sin(a) * len;
        const hue = (t * 90 + i * 70) % 360;
        for (const [lw, al] of [
          [14, 0.08],
          [5, 0.22],
          [1.6, 0.9],
        ]) {
          ctx.strokeStyle = `hsla(${hue},100%,${al > 0.5 ? 85 : 60}%,${al * st.lasers})`;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    // flags rising on poles
    if (st.flags > 0) {
      const portrait = stage.portrait;
      const fw = portrait ? W * 0.3 : Math.min(W * 0.26, H * 0.3);
      const fh = fw * 0.66;
      const rest = portrait ? H * 0.72 : H * 0.62 - fh;
      const y = H + (rest - H) * st.flags;
      drawWavingFlag(ctx, flagTexture('br'), W * 0.05, y, fw, fh, t, { amp: 0.08, speed: 6 });
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      drawWavingFlag(ctx, flagTexture('fr'), W * 0.05, y, fw, fh, t + 1, { amp: 0.08, speed: 6 });
      ctx.restore();
    }
    // mini Lulas in orbit around the couple
    if (st.orbit > 0) {
      const c = this.coupleCenter();
      const rx = c.w * 0.62;
      const ry = c.h * 0.75;
      this.orbiters.forEach((o, i) => {
        const a = t * 1.4 + (i / this.orbiters.length) * TAU;
        const depth = Math.sin(a);
        gsap.set(o, { x: c.x + Math.cos(a) * rx, y: c.y + depth * ry * 0.35 - ry * 0.1, scale: 0.75 + (depth + 1) * 0.25, rotation: Math.sin(t * 6 + i) * 15, zIndex: depth > 0 ? 6 : 2, autoAlpha: st.orbit });
      });
    }
  }

  firework(kind, x, y, colors, power = 1) {
    const [c1, c2] = colors || pick(FW_COLORS);
    this.fx.firework(x, y, { kind, color: c1, color2: c2, power, n: kind === 'heart' ? 150 : 120, trail: c1 });
    gsap.delayedCall(0.95, () => sfx.fwBoom(0.25 + power * 0.08));
    sfx.fwLaunch();
  }

  run() {
    const W = stage.w;
    const H = stage.h;
    const tl = this.timeline();
    const st = this.st;
    // the call to the party
    tl.call(() => {
      stage.uncover(0.15);
      sfx.apitoCall();
    }, null, 0);
    const t0 = 1.0;
    tl.call(() => {
      audio.play('festa', { cut: true });
      sfx.airhorn();
      sfx.impact(1.2);
      stage.flash('#fff', 0.5, 0.9);
      stage.shake(1.1, 0.6);
      this.fx.confetti(320, { from: 'bottom', power: 1.1 });
      this.fx.confetti(200, { from: 'top' });
    }, null, t0);
    tl.fromTo(this.root.querySelector('.fn-sky'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, t0);
    tl.to(st, { lasers: 1, flags: 1, duration: 1.2, ease: 'power2.out' }, t0);
    tl.fromTo(this.planet, { autoAlpha: 0, scale: 0.2, rotation: -90 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.2, ease: 'back.out(1.4)' }, t0 + B);
    tl.fromTo(this.couple, { autoAlpha: 0, y: H * 0.4, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.5)' }, t0 + B * 2);
    tl.to(st, { orbit: 1, duration: 0.6 }, t0 + B * 4);

    // fireworks on the beat
    const bars = 5;
    for (let b = 0; b < bars * 4; b++) {
      const at = t0 + b * B;
      const side = b % 2 ? 0.72 : 0.28;
      const kind = b % 8 === 7 ? 'heart' : pick(['peony', 'glitter', 'ring', 'willow', 'peony']);
      tl.call(() => this.firework(kind, W * (side + rand(-0.12, 0.12)), H * rand(0.12, 0.34)), null, at - 0.95);
      if (b % 4 === 0 && b > 0) tl.call(() => this.fx.confetti(90, { from: 'top' }), null, at);
      if (b % 4 === 2) tl.call(() => this.fx.hearts(W * rand(0.2, 0.8), H, 18, { power: 1.4, angle: -Math.PI / 2, spread: 0.7 }), null, at);
    }
    // giant kinetic texts, one per bar
    const bar = 4 * B;
    const ins = [
      (n) => gsap.fromTo(n, { autoAlpha: 0, scale: 3.2, rotation: -12 }, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.3, ease: 'power4.in' }),
      (n) => gsap.fromTo(n, { autoAlpha: 0, xPercent: -120, skewX: -25 }, { autoAlpha: 1, xPercent: 0, skewX: 0, duration: 0.4, ease: 'expo.out' }),
      (n) => gsap.fromTo(n, { autoAlpha: 0, rotationX: 90, transformPerspective: 600 }, { autoAlpha: 1, rotationX: 0, duration: 0.5, ease: 'back.out(2)' }),
      (n) => gsap.fromTo(n, { autoAlpha: 0, scale: 0.2, rotation: 25 }, { autoAlpha: 1, scale: 1, rotation: 4, duration: 0.5, ease: 'elastic.out(1, 0.45)' }),
    ];
    this.texts.forEach((n, i) => {
      const at = t0 + i * bar + B * 0.02;
      tl.call(() => {
        this._tls.push(ins[i](n));
        sfx.impact(0.5);
        stage.shake(0.5, 0.25);
      }, null, at);
      tl.to(n, { scale: 1.06, duration: B / 2, yoyo: true, repeat: 5, ease: 'sine.inOut' }, at + 0.5);
      tl.to(n, { autoAlpha: 0, scale: 1.4, duration: 0.25, ease: 'power2.in' }, at + bar - 0.3);
    });
    // heart-throwing Lulas
    this.throwers.forEach((tw, i) => {
      const at = t0 + bar * 1.5 + i * B;
      tl.to(tw, { y: H - stage.min * 0.27, duration: 0.4, ease: 'back.out(2)' }, at);
      for (let k = 0; k < 4; k++) {
        const tt = at + 0.5 + k * B * 2;
        tl.to(tw, { rotation: i ? 18 : -18, duration: B * 0.5, yoyo: true, repeat: 1, transformOrigin: '50% 100%' }, tt);
        tl.call(() => {
          const b = tw.getBoundingClientRect();
          this.fx.hearts(b.left + b.width / 2, b.top + b.height * 0.2, 14, { power: 1.2, angle: -Math.PI / 2 + (i ? -0.35 : 0.35), spread: 0.5, g: 500 });
          sfx.pop(0, 1.2);
        }, null, tt + B * 0.5);
      }
      tl.to(tw, { y: H + 10, duration: 0.4, ease: 'power2.in' }, t0 + bar * 4.3);
    });

    // CLIMAX — heart firework around the photos, white detonation, pull back
    const climax = t0 + bars * bar - 0.4;
    tl.call(() => {
      const c = this.coupleCenter();
      sfx.riser(1, 0.1);
      this.fx.firework(c.x, c.y - c.h * 0.05, { kind: 'heart', color: '#ff2e4d', color2: '#ffd36b', power: 2.0, n: 260, life: 2.2, trail: '#fff' });
      gsap.delayedCall(0.95, () => {
        sfx.fwBoom(0.5);
        sfx.impact(1.5);
        stage.shake(1.2, 0.7);
      });
    }, null, climax - 1.0);
    tl.call(() => {
      for (let i = 0; i < 6; i++) this.firework(pick(['peony', 'glitter', 'willow']), W * (0.1 + i * 0.16), H * rand(0.1, 0.3));
    }, null, climax - 0.9);
    tl.fromTo(this.white, { autoAlpha: 0, scale: 0.05 }, { autoAlpha: 1, scale: 1.6, duration: 0.9, ease: 'power2.in' }, climax + 0.6);
    tl.call(() => {
      sfx.boom();
      audio.track('festa') && (audio.track('festa').params.brass = false);
      this.texts.forEach((n) => gsap.set(n, { autoAlpha: 0 }));
      st.lasers = 0.35;
      this.fx.clear();
    }, null, climax + 1.5);
    // final composition revealed as the camera pulls back
    tl.set(this.root, { scale: 1.35 }, climax + 1.5);
    tl.set(this.halo, { autoAlpha: 1 }, climax + 1.5);
    tl.set(this.forever, { autoAlpha: 1 }, climax + 1.5);
    tl.to(this.white, { autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, climax + 1.6);
    tl.to(this.root, { scale: 1, duration: 2.4, ease: 'power3.out' }, climax + 1.6);
    tl.call(() => {
      this.fx.stars(W / 2, H / 2, 30, { color: '#fff3c4', spread: stage.min * 0.5 });
      this.fx.petals(30, { colors: ['#ffd36b', '#fff', '#ffb3c6'] });
    }, null, climax + 2.2);
    tl.to({}, { duration: 2.6 }, climax + 2.4);
    return this.play(tl);
  }

  exit() {
    audio.stop('festa', 2.2);
    const tl = this.timeline();
    tl.to(this.root, { autoAlpha: 0, duration: 1.2, ease: 'power2.inOut' });
    return this.play(tl);
  }
}
