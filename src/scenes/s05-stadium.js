import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { slam } from '../animations/text.js';
import { lula } from '../animations/lula.js';
import { flagTexture, drawWavingFlag } from '../effects/flags.js';
import { rand, pick, TAU, heartPoint, mulberry32 } from '../utils/math.js';
import { PALETTE } from '../effects/particles.js';

/* 05 — the World Cup of Love: a night stadium, a parachuting presidential referee,
   a red card for the word "NO", a ball that becomes a heart, floodlights that draw in the sky. */

const PARA = `<svg viewBox="-100 -70 200 150" aria-hidden="true">
<g stroke="#2b2b2b" stroke-width="1.2" fill="none"><path d="M-92,0 L-14,72 M-46,8 L-8,72 M0,10 L0,72 M46,8 L8,72 M92,0 L14,72"/></g>
<path d="M-95,2 C-90,-60 90,-60 95,2 C80,-6 64,-6 48,6 C32,-6 16,-6 0,8 C-16,-6 -32,-6 -48,6 C-64,-6 -80,-6 -95,2Z" fill="#ffdf00"/>
<path d="M-48,6 C-50,-40 -20,-56 0,-58 C-14,-40 -18,-20 0,8 C-16,-6 -32,-6 -48,6Z M48,6 C50,-40 20,-56 0,-58 C14,-40 18,-20 0,8 C16,-6 32,-6 48,6Z" fill="#009c3b"/>
<text x="0" y="-26" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="17" fill="#002776">ÁRBITRO</text></svg>`;

const BALL = `<svg viewBox="-50 -50 100 100" aria-hidden="true"><circle r="48" fill="#fff" stroke="#111" stroke-width="3"/>
<path d="M0,-17 L16,-5 L10,14 L-10,14 L-16,-5Z" fill="#111"/><path d="M0,-17 L0,-46 M16,-5 L42,-14 M10,14 L26,38 M-10,14 L-26,38 M-16,-5 L-42,-14" stroke="#111" stroke-width="3"/>
<path d="M-20,-44 L0,-46 L20,-44 L28,-36 M42,-14 L46,4 L40,22 M26,38 L10,46 L-10,46 L-26,38 M-40,22 L-46,4 L-42,-14 M-28,-36 L-20,-44" stroke="#111" stroke-width="3" fill="none"/></svg>`;

export class Stadium extends Scene {
  static id = 'stadium';

  async build() {
    const r = this.mount('s-stadium');
    this.world = el('div.st-world');
    this.canvas = el('canvas.st-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.board = el('div.st-board', {}, [
      el('p.st-cup', { text: 'COPA DO MUNDO DO AMOR · FINAL' }),
      el('div.st-score', {}, [
        el('span.st-team', { html: '<i class="fl fr"></i>FRA' }),
        (this.sA = el('span.st-num', { html: '<b>0</b>' })),
        el('span.st-x', { text: '×' }),
        (this.sB = el('span.st-num', { html: '<b>0</b>' })),
        el('span.st-team', { html: 'BRA<i class="fl br"></i>' }),
      ]),
      (this.clock = el('p.st-clock', { text: "90+4'" })),
    ]);
    this.para = el('div.st-para', { html: PARA });
    this.ref = lula('official-body', 'st-ref');
    this.whistleTag = el('div.st-tag', { text: 'ÁRBITRO: LULA' });
    this.refWrap = el('div.st-refwrap', {}, [this.para, this.ref, this.whistleTag]);
    this.card = el('div.st-card', { html: '<span>NÃO</span>' });
    this.cardCap = el('p.st-cardcap.meme', { html: "CARTÃO VERMELHO<br>PRO <span>“NÃO”</span>" });
    this.ball = el('div.st-ball', { html: BALL });
    this.heartBall = el('div.st-heartball', { html: '<svg viewBox="-55 -52 110 104"><path d="M0,-20 C0,-50 -50,-50 -50,-18 C-50,12 -8,26 0,50 C8,26 50,12 50,-18 C50,-50 0,-50 0,-20Z" fill="#ff2e4d" stroke="#fff" stroke-width="5"/></svg>' });
    this.gol = el('p.st-gol', { html: 'G<span>O</span><span>O</span><span>O</span><span>O</span><span>O</span>L' });
    this.draw = el('p.st-draw', { text: 'EMPATE ETERNO ❤' });
    this.world.append(this.canvas, this.refWrap, this.ball, this.heartBall, this.board, this.gol, this.draw);
    r.append(this.world, this.card, this.cardCap);

    // crowd seats along elliptical tiers
    const rng = mulberry32(7);
    const n = quality.n(1700);
    const cols = ['#ffdf00', '#ffdf00', '#009c3b', '#1d4fd8', '#ffffff', '#ef4135', '#ffdf00', '#0055a4'];
    this.crowd = Array.from({ length: n }, () => {
      const tier = rng();
      return { a: rng() * Math.PI, tier, c: cols[Math.floor(rng() * cols.length)], ph: rng() * TAU, rise: rng(), flash: 0 };
    });
    this.flags = Array.from({ length: 6 }, (_, i) => ({ a: 0.15 + (i / 5) * (Math.PI - 0.3), tier: 0.3 + rng() * 0.5, kind: i % 2 ? 'fr' : 'br', ph: rng() * 4 }));
    this.st = { rise: 0, beams: 0, heart: 0, heartA: 0 };
    this.time = 0;
    this.resize();
    this.onResize(() => this.resize());
    this.tick((dt) => this.render(dt));
  }

  resize() {
    const dpr = Math.min(quality.cfg.dpr, 1.75);
    this.dpr = dpr;
    this.canvas.width = stage.w * dpr;
    this.canvas.height = stage.h * dpr;
    const W = stage.w;
    const H = stage.h;
    this.geo = {
      horizon: H * 0.5,
      pitchTop: H * 0.5,
      cx: W / 2,
      heartC: { x: W / 2, y: H * 0.22 },
      heartR: Math.min(W, H) * 0.22,
    };
  }

  render(dt) {
    this.time += dt;
    const { ctx, dpr, st } = this;
    const W = stage.w;
    const H = stage.h;
    const t = this.time;
    const g = this.geo;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#02060c');
    sky.addColorStop(1, '#0b2030');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // stands (two elliptical bands)
    const ex = W * 0.75;
    for (let tier = 0; tier < 2; tier++) {
      ctx.fillStyle = tier ? '#0b1218' : '#101a22';
      ctx.beginPath();
      ctx.ellipse(g.cx, g.horizon + H * 0.02, ex + tier * W * 0.12 + W * 0.1, H * (0.28 + tier * 0.1), 0, Math.PI, 0);
      ctx.fill();
    }
    // crowd
    const wave = (a) => Math.sin(a * 6 - t * 5);
    for (const p of this.crowd) {
      const rx = ex + p.tier * W * 0.32;
      const ry = H * (0.2 + p.tier * 0.18);
      let x = g.cx - Math.cos(p.a) * rx;
      let y = g.horizon - Math.sin(p.a) * ry + Math.max(0, wave(p.a)) * -3 * (1 - st.rise);
      if (st.rise) {
        y -= p.rise * st.rise * H * 0.9;
        x += Math.sin(p.ph + t) * st.rise * 20;
      }
      const s = 2.2 + p.tier * 1.8;
      ctx.globalAlpha = st.rise ? Math.max(0, 1 - st.rise * (0.6 + p.rise * 0.6)) : 1;
      ctx.fillStyle = Math.random() < 0.0025 ? '#fff' : p.c;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    // flags in the crowd
    if (st.rise < 0.5)
      for (const f of this.flags) {
        const rx = ex + f.tier * W * 0.32;
        const ry = H * (0.2 + f.tier * 0.18);
        const x = g.cx - Math.cos(f.a) * rx;
        const y = g.horizon - Math.sin(f.a) * ry;
        const fw = Math.min(W, H) * 0.09;
        drawWavingFlag(ctx, flagTexture(f.kind), x, y - fw * 0.9, fw, fw * 0.66, t + f.ph, { strips: 10, amp: 0.1, alpha: 1 - st.rise * 2 });
      }
    // pitch
    const top = g.pitchTop;
    const wTop = W * 0.62;
    const wBot = W * 1.9;
    const stripes = 9;
    for (let i = 0; i < stripes; i++) {
      const y0 = top + ((H - top) * Math.pow(i / stripes, 1.35));
      const y1 = top + ((H - top) * Math.pow((i + 1) / stripes, 1.35));
      const k0 = (y0 - top) / (H - top);
      const k1 = (y1 - top) / (H - top);
      const w0 = wTop + (wBot - wTop) * k0;
      const w1 = wTop + (wBot - wTop) * k1;
      ctx.fillStyle = i % 2 ? '#1f7a33' : '#25913d';
      ctx.beginPath();
      ctx.moveTo(g.cx - w0 / 2, y0);
      ctx.lineTo(g.cx + w0 / 2, y0);
      ctx.lineTo(g.cx + w1 / 2, y1);
      ctx.lineTo(g.cx - w1 / 2, y1);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.cx - wTop / 2, top);
    ctx.lineTo(g.cx + wTop / 2, top);
    ctx.lineTo(g.cx + wBot / 2, H);
    ctx.moveTo(g.cx - wTop / 2, top);
    ctx.lineTo(g.cx - wBot / 2, H);
    const midY = top + (H - top) * 0.42;
    const midW = wTop + (wBot - wTop) * 0.42;
    ctx.moveTo(g.cx - midW / 2, midY);
    ctx.lineTo(g.cx + midW / 2, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(g.cx, midY, midW * 0.13, (H - top) * 0.09, 0, 0, TAU);
    ctx.stroke();
    // far goal
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(g.cx - wTop * 0.08, top - H * 0.035, wTop * 0.16, H * 0.035);
    // floodlights
    const towers = [
      [W * 0.06, H * 0.08],
      [W * 0.94, H * 0.08],
    ];
    ctx.globalCompositeOperation = 'lighter';
    const tracePt = this.heartTrace();
    towers.forEach(([tx, ty], i) => {
      let gx;
      let gy;
      if (st.beams > 0 && tracePt) {
        gx = tracePt.x;
        gy = tracePt.y;
      } else {
        gx = W * (i ? 0.38 : 0.62) + Math.sin(t * 0.7 + i) * W * 0.06;
        gy = H * 0.75;
      }
      const ang = Math.atan2(gy - ty, gx - tx);
      const len = Math.hypot(gx - tx, gy - ty) * 1.15;
      const spread = 0.16;
      const grad = ctx.createLinearGradient(tx, ty, tx + Math.cos(ang) * len, ty + Math.sin(ang) * len);
      grad.addColorStop(0, 'rgba(255,250,225,0.55)');
      grad.addColorStop(1, 'rgba(255,250,225,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(ang - spread) * len, ty + Math.sin(ang - spread) * len);
      ctx.lineTo(tx + Math.cos(ang + spread) * len, ty + Math.sin(ang + spread) * len);
      ctx.fill();
    });
    // the heart painted with light
    if (st.heart > 0) {
      const n = 120;
      const end = Math.floor(n * st.heart);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [lw, a, col] of [
        [18, 0.12, '#ff3d6a'],
        [8, 0.35, '#ff7a9a'],
        [3, 1, '#fff'],
      ]) {
        ctx.beginPath();
        for (let i = 0; i <= end; i++) {
          const p = heartPoint((i / n) * TAU + Math.PI);
          const x = g.heartC.x + p.x * g.heartR;
          const y = g.heartC.y + p.y * g.heartR;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.globalAlpha = a * (st.heartA || 1);
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
    towers.forEach(([tx, ty]) => {
      ctx.fillStyle = '#1a2229';
      ctx.fillRect(tx - 3, ty, 6, H * 0.5);
      ctx.fillStyle = '#fffbe6';
      ctx.shadowColor = '#fffbe6';
      ctx.shadowBlur = 25;
      ctx.fillRect(tx - W * 0.035, ty - H * 0.02, W * 0.07, H * 0.03);
      ctx.shadowBlur = 0;
    });
  }

  heartTrace() {
    if (this.st.heart <= 0) return null;
    const g = this.geo;
    const p = heartPoint(Math.min(1, this.st.heart) * TAU + Math.PI);
    return { x: g.heartC.x + p.x * g.heartR, y: g.heartC.y + p.y * g.heartR };
  }

  flip(numEl, txt) {
    const b = numEl.querySelector('b');
    gsap.timeline()
      .to(b, { rotationX: 90, duration: 0.12, ease: 'power2.in', transformPerspective: 300 })
      .call(() => (b.textContent = txt))
      .fromTo(b, { rotationX: -90 }, { rotationX: 0, duration: 0.22, ease: 'back.out(2)', transformPerspective: 300 });
  }

  run() {
    const W = stage.w;
    const H = stage.h;
    const st = this.st;
    const tl = this.timeline();
    tl.call(() => {
      audio.play('stadium', { cut: true });
      sfx.crowd(11.5, 0.09);
    }, null, 0);
    tl.fromTo(this.world, { scale: 1.18 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0);
    tl.fromTo(this.board, { yPercent: -160 }, { yPercent: 0, duration: 0.7, ease: 'back.out(1.6)' }, 0.3);
    let clockN = 4;
    tl.call(() => {
      this.clockIv = gsap.to({}, { duration: 1.2, repeat: -1, onRepeat: () => (this.clock.textContent = `90+${++clockN}'`) });
      this._tls.push(this.clockIv);
    }, null, 0.5);

    // parachuting presidential referee
    const refH = Math.min(H * 0.34, W * 0.6);
    this.ref.style.height = refH + 'px';
    this.ref.querySelector('img').style.cssText = 'height:100%;width:auto';
    const landY = H * 0.86 - refH;
    gsap.set(this.refWrap, { x: W * 0.5, y: -H * 0.8 });
    tl.call(() => sfx.slide(false), null, 1.0);
    tl.to(this.refWrap, { y: landY, duration: 2.0, ease: 'power1.out' }, 1.0);
    tl.fromTo(this.refWrap, { rotation: -10 }, { rotation: 8, duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 1.0);
    tl.to(this.refWrap, { rotation: 0, duration: 0.2 }, 3.0);
    tl.call(() => {
      sfx.stamp();
      stage.shake(0.5, 0.3);
      this.fx.smoke(W / 2, landY + refH, 10, { size: 60 });
    }, null, 3.0);
    tl.to(this.para, { scaleY: 0.1, y: refH * 0.6, opacity: 0, rotation: 30, duration: 0.5, ease: 'power2.in', transformOrigin: '50% 100%' }, 3.05);
    tl.call(() => sfx.refWhistle(), null, 3.2);
    tl.fromTo(this.whistleTag, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(3)' }, 3.25);

    // red card for the word "NÃO"
    tl.fromTo(this.card, { autoAlpha: 0, x: W * 0.62, y: landY + refH * 0.25, scale: 0.15, rotation: -25 }, { autoAlpha: 1, scale: 0.3, rotation: 10, duration: 0.25, ease: 'back.out(2)' }, 3.8);
    tl.call(() => sfx.refWhistle(), null, 3.85);
    tl.to(this.card, { x: W / 2, y: H * 0.42, scale: 1, rotation: -6, duration: 0.45, ease: 'power3.out' }, 4.1);
    tl.add(slam(this.cardCap, { from: 2, rot: 4, sound: 'stamp', shake: 0.5 }), 4.35);
    tl.call(() => {
      const b = this.card.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      sfx.impact(1.1);
      sfx.shatter(0, 0.2);
      stage.shake(1, 0.5);
      this.fx.shards(cx, cy, 50, { colors: ['#e3001b', '#ff3a4f', '#b00012'], power: 1.2 });
      this.fx.confetti(90, { x: cx, y: cy, from: 'point', power: 1.1 });
      this.card.style.visibility = 'hidden';
    }, null, 5.2);
    tl.to(this.cardCap, { autoAlpha: 0, duration: 0.2 }, 5.2);

    // the ball becomes a heart
    const spotY = H * 0.71;
    const bs = Math.min(W, H) * 0.12;
    gsap.set([this.ball, this.heartBall], { width: bs, height: bs, x: W / 2 - bs / 2, y: -bs });
    tl.to(this.ball, { y: spotY - bs, duration: 0.45, ease: 'bounce.out', rotation: 200 }, 5.4);
    tl.call(() => sfx.boing(0, 0.7), null, 5.6);
    tl.to(this.ball, { scale: 0, rotation: '+=180', duration: 0.25, ease: 'back.in(2)' }, 6.0);
    tl.set(this.heartBall, { y: spotY - bs }, 6.0);
    tl.fromTo(this.heartBall, { scale: 0 }, { scale: 1.2, duration: 0.45, ease: 'elastic.out(1, 0.4)' }, 6.2);
    tl.call(() => {
      sfx.sparkle();
      this.fx.stars(W / 2, spotY - bs / 2, 10, { color: '#ffd1dc' });
    }, null, 6.2);
    // kick → scoreboard
    tl.call(() => {
      sfx.kiss();
      sfx.whoosh(0.4, { from: 400, to: 3000 });
    }, null, 6.75);
    tl.to(this.heartBall, {
      x: W / 2 - bs / 2,
      y: () => this.board.getBoundingClientRect().bottom - bs * 0.6,
      scale: 0.7,
      rotation: 720,
      duration: 0.42,
      ease: 'power2.in',
    }, 6.75);
    tl.call(() => {
      const b = this.board.getBoundingClientRect();
      sfx.impact(1.2);
      sfx.airhorn(0.05);
      sfx.crowd(3, 0.16);
      stage.shake(1.2, 0.6);
      this.fx.hearts(W / 2, b.bottom, 40, { power: 1.3 });
      this.fx.confetti(220, { from: 'top' });
      this.heartBall.style.visibility = 'hidden';
      this.flip(this.sA, '❤');
      this.flip(this.sB, '❤');
    }, null, 7.17);
    tl.fromTo(this.gol, { autoAlpha: 0, scale: 3 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power4.in' }, 7.2);
    tl.fromTo(this.gol.querySelectorAll('span'), { scaleX: 1 }, { scaleX: 1.6, duration: 0.18, yoyo: true, repeat: 5, stagger: 0.05, ease: 'sine.inOut' }, 7.5);
    tl.to(this.gol, { autoAlpha: 0, y: -40, duration: 0.3 }, 8.7);
    tl.fromTo(this.draw, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, 8.0);

    // crowd dissolves, floodlights paint a heart
    tl.to([this.refWrap, this.draw], { autoAlpha: 0, duration: 0.4 }, 8.9);
    tl.to(st, { rise: 1, duration: 1.8, ease: 'power1.in' }, 8.8);
    tl.call(() => this.fx.confetti(120, { from: 'bottom', colors: PALETTE.party }), null, 8.9);
    tl.set(st, { beams: 1 }, 9.0);
    tl.call(() => sfx.riser(1.4, 0.08), null, 9.0);
    tl.to(st, { heart: 1, duration: 1.3, ease: 'power1.inOut' }, 9.0);
    tl.call(() => {
      sfx.chime();
      const g = this.geo;
      this.fx.glow(g.heartC.x, g.heartC.y, { size: g.heartR * 4, color: '#ff7a9a', life: 0.8 });
    }, null, 10.3);
    // camera flies through the heart
    tl.to(this.world, { scale: 9, transformOrigin: () => `${this.geo.heartC.x}px ${this.geo.heartC.y}px`, duration: 1.0, ease: 'power3.in' }, 10.4);
    tl.to(this.board, { autoAlpha: 0, duration: 0.3 }, 10.4);
    tl.call(() => stage.cover('#fff', 0.25), null, 11.1);
    tl.to({}, { duration: 0.3 }, 11.1);
    return this.play(tl);
  }

  exit() {
    audio.stopAll(0.1);
    return Promise.resolve();
  }
}
