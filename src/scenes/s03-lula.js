import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el, splitChars } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import * as I from '../audio/instruments.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { typewriter, slam } from '../animations/text.js';
import { lula, head, echo } from '../animations/lula.js';
import { shatter } from '../animations/transitions.js';
import { img } from '../core/assets.js';
import { rand, pick } from '../utils/math.js';
import { PALETTE } from '../effects/particles.js';

/* 03 — Lula enters the chat. Telenovela credits, absurd fly-bys, a freeze frame, a giant face,
   a DVD-logo bounce, a synchronised mini-Lula army and the official stamp. */

const BEAT = 60 / 130;

export class LulaScene extends Scene {
  static id = 'lula';

  async build() {
    const r = this.mount('s-lula');
    this.burst = el('div.lu-burst');
    this.credits = el('div.lu-credits', {}, [
      el('p.lu-small', { text: 'e com a participação especialíssima de' }),
      (this.name = el('p.lu-name', { text: 'Luiz Inácio Lula da Silva' })),
    ]);
    this.actors = el('div.lu-actors');
    this.army = el('div.lu-army');
    this.freezeCap = el('div.lu-freeze', {}, [el('p.lu-ff', { text: '*freeze frame*' }), (this.ffText = el('p.lu-sub'))]);
    this.caption = el('p.lu-caption.meme');
    this.doc = el('div.lu-doc', {
      html: `<header><span class="crest">❦</span><b>REPÚBLICA FEDERATIVA DO AMOR</b><small>Ministério do Amor · Secretaria de Assuntos Internacionais do Coração</small></header>
<dl><dt>Processo nº</dt><dd>2026/❤-BR-FR</dd><dt>Assunto</dt><dd>namoro internacional Brasil 🇧🇷 × França 🇫🇷</dd><dt>Requerente</dt><dd>um francês muito apaixonado</dd><dt>Parecer</dt><dd class="scrawl">o rapaz parece gente boa</dd></dl>
<footer>Brasília, hoje · assinatura: <i>L.</i></footer>`,
    });
    this.stamp = el('div.lu-stamp', { html: 'CASAMENTO<br>APROVADO <span>✓</span>' });
    this.foot = el('p.lu-foot', { html: 'APROVADO PELO MINISTÉRIO DO AMOR*<small>*ministério fictício. obviamente.</small>' });
    r.append(this.burst, el('div.lu-vignette'), this.credits, this.army, this.actors, this.doc, this.stamp, this.foot, this.caption, this.freezeCap, el('div.lu-frame'));
    this.cleanups = [];
  }

  actor(kind, variant, h) {
    const a = kind === 'head' ? head(variant) : lula(variant);
    a.style.height = h + 'px';
    a.style.width = 'auto';
    a.querySelector('img').style.height = '100%';
    a.querySelector('img').style.width = 'auto';
    this.actors.append(a);
    return a;
  }

  /** an actor crossing the screen at absurd speed, spinning */
  flyBy(tl, at, variant, from, to, { dur = 0.42, spin = 720, h = stage.min * 0.55 } = {}) {
    const a = this.actor('lula', variant, h);
    gsap.set(a, { x: from[0], y: from[1], xPercent: -50, yPercent: -50, rotation: 0, visibility: 'hidden' });
    tl.call(() => {
      a.style.visibility = 'visible';
      this.cleanups.push(echo(a, { count: 5, lag: 1, opacity: 0.45 }));
      sfx.whoosh(dur + 0.1, { gain: 0.3, from: 250, to: 3200, panFrom: from[0] < to[0] ? -0.9 : 0.9, panTo: from[0] < to[0] ? 0.9 : -0.9 });
    }, null, at);
    tl.fromTo(a, { x: from[0], y: from[1], rotation: 0 }, { x: to[0], y: to[1], rotation: spin, duration: dur, ease: 'none' }, at);
    tl.set(a, { visibility: 'hidden' }, at + dur);
    return a;
  }

  run() {
    const W = stage.w;
    const H = stage.h;
    const m = stage.min;
    const tl = this.timeline();
    const E = audio;

    // ── telenovela credits ──
    const nameChars = splitChars(this.name);
    tl.call(() => {
      const t = E.now + 0.02;
      if (E.ready) {
        I.strings(E, t, [50, 62, 66, 69], 2.4, { gain: 0.035, attack: 0.6 });
        I.bell(E, t + 0.4, 81, 0.05);
        I.bell(E, t + 0.9, 86, 0.04);
      }
    }, null, 0.05);
    tl.fromTo(this.credits.querySelector('.lu-small'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 0.1);
    tl.fromTo(nameChars, { opacity: 0, y: 14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.035 }, 0.5);

    // ── SCRATCH → fly-bys ──
    tl.call(() => {
      sfx.scratch();
      audio.play('funk', { cut: true });
      this.root.classList.add('party');
      stage.flash('#ffdf00', 0.3, 0.6);
    }, null, 2.0);
    tl.fromTo(this.burst, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'expo.out' }, 2.0);
    this.flyBy(tl, 2.05, 'official-body', [-m * 0.4, H * 0.5], [W + m * 0.4, H * 0.46], { spin: 900 });
    nameChars.forEach((c) => {
      tl.to(c, { x: rand(-W * 0.6, W * 0.6), y: rand(-H * 0.5, H * 0.5), rotation: rand(-540, 540), opacity: 0, duration: 0.7, ease: 'power3.out' }, 2.18 + rand(0, 0.1));
    });
    tl.to(this.credits.querySelector('.lu-small'), { y: -H * 0.4, rotation: -30, opacity: 0, duration: 0.5, ease: 'power3.out' }, 2.2);
    this.flyBy(tl, 2.55, 'jersey-full', [W + m * 0.3, -m * 0.2], [-m * 0.3, H + m * 0.2], { spin: -620, dur: 0.4 });
    this.flyBy(tl, 2.98, 'cap-thumb', [W * 0.5, -m * 0.4], [W * 0.5, H + m * 0.4], { spin: 540, dur: 0.36, h: m * 0.5 });

    // ── FREEZE FRAME ──
    const lf = this.actor('lula', 'laugh', m * 0.62);
    gsap.set(lf, { xPercent: -50, yPercent: -50, x: -m * 0.4, y: H * 0.9, rotation: -30, visibility: 'hidden' });
    tl.set(lf, { visibility: 'visible' }, 3.35);
    tl.call(() => sfx.whoosh(0.3, { gain: 0.25 }), null, 3.35);
    tl.to(lf, { x: W * 0.46, y: H * 0.47, rotation: 14, duration: 0.3, ease: 'power1.out' }, 3.35);
    tl.call(() => {
      sfx.scratch();
      audio.stopAll(0.02);
      this.root.classList.add('frozen');
    }, null, 3.65);
    tl.fromTo(this.freezeCap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 3.7);
    tl.add(typewriter(this.ffText, 'Você deve estar se perguntando: o que o Lula tá fazendo aqui?', { cps: 34 }), 4.05);
    tl.to(this.freezeCap, { autoAlpha: 0, duration: 0.15 }, 6.1);
    tl.call(() => this.root.classList.remove('frozen'), null, 6.15);
    tl.set(lf, { visibility: 'hidden' }, 6.15);

    // ── giant face ──
    const big = this.actor('lula', 'official-face', H * 0.9);
    gsap.set(big, { xPercent: -50, yPercent: -50, x: W / 2, y: H * 0.55, scale: 0.05, visibility: 'hidden' });
    tl.set(big, { visibility: 'visible' }, 6.15);
    tl.call(() => {
      sfx.boom();
      sfx.impact(0.8);
      stage.shake(1.2, 0.7);
      audio.play('funk', { cut: true });
    }, null, 6.2);
    tl.to(big, { scale: Math.max(1.7, (W / (H * 0.9)) * 1.9), y: H * 0.68, duration: 0.28, ease: 'expo.out' }, 6.15);
    tl.call(() => {
      this.caption.textContent = 'ELE VEIO APROVAR O NAMORO.';
    }, null, 6.4);
    tl.add(slam(this.caption, { from: 2.4, rot: -6, sound: 'stamp', shake: 0.6 }), 6.4);
    tl.to(big, { scale: 1.9 * Math.max(1, W / (H * 0.9)), duration: 0.9, ease: 'none' }, 6.45);
    tl.to(this.caption, { autoAlpha: 0, duration: 0.15 }, 7.35);

    // ── DVD bounce ──
    const ball = this.actor('lula', 'jersey-full', m * 0.24);
    const bh = m * 0.24;
    const bw = bh * 0.45;
    gsap.set(ball, { x: W / 2 - bw / 2, y: H / 2 - bh / 2, visibility: 'hidden', transformOrigin: '50% 50%' });
    tl.to(big, { scale: 0.05, rotation: 360, duration: 0.3, ease: 'power3.in' }, 7.4);
    tl.set(big, { visibility: 'hidden' }, 7.7);
    tl.set(ball, { visibility: 'visible' }, 7.7);
    tl.call(() => sfx.pop(0, 0.8), null, 7.7);
    const pts = [
      [W - bw, H * 0.28, 'v'],
      [W * 0.55, 0, 'h'],
      [0, H * 0.42, 'v'],
      [W * 0.38, H - bh, 'h'],
      [W - bw, H * 0.62, 'v'],
      [W * 0.6, H - bh, 'h'],
      [0, H - bh, 'corner'],
    ];
    let t = 7.75;
    pts.forEach(([x, y, wall], i) => {
      const d = i === pts.length - 1 ? 0.42 : 0.28;
      tl.to(ball, { x, y, rotation: `+=${rand(120, 260)}`, duration: d, ease: 'none' }, t);
      t += d;
      const sq = wall === 'v' ? { scaleX: 0.6, scaleY: 1.3 } : { scaleX: 1.35, scaleY: 0.65 };
      tl.to(ball, { ...sq, duration: 0.05, yoyo: true, repeat: 1 }, t - 0.02);
      tl.call(() => sfx.boing(0, 0.8 + i * 0.12), null, t - 0.02);
    });
    tl.call(() => {
      sfx.airhorn();
      stage.shake(0.8, 0.5);
      this.fx.confetti(120, { x: bw, y: H - bh / 2, from: 'point', power: 1.3 });
      this.caption.textContent = 'CORNER HIT!!!';
    }, null, t);
    tl.add(slam(this.caption, { from: 3, rot: 8, sound: null, shake: 0.4 }), t);
    tl.to(this.caption, { autoAlpha: 0, duration: 0.15 }, t + 0.8);

    // ── the army ──
    const armyAt = 6.2 + Math.ceil((t + 0.75 - 6.2) / BEAT) * BEAT;
    this.buildArmy(tl, armyAt, ball);

    // ── the official document + stamp ──
    const docAt = armyAt + BEAT * 8;
    const thumbs = this.actor('lula', 'jersey-thumbs', Math.min(H * 0.5, W * 0.95));
    gsap.set(thumbs, { xPercent: -50, x: W / 2, y: H, visibility: 'hidden' });
    tl.set(thumbs, { visibility: 'visible' }, docAt);
    tl.to(thumbs, { y: H - Math.min(H * 0.5, W * 0.95) * 0.98, duration: 0.5, ease: 'back.out(1.4)' }, docAt);
    tl.fromTo(this.doc, { autoAlpha: 0, yPercent: 80, rotation: 12 }, { autoAlpha: 1, yPercent: 0, rotation: -3, duration: 0.55, ease: 'back.out(1.5)' }, docAt + 0.1);
    tl.call(() => sfx.whoosh(0.4), null, docAt + 0.1);
    tl.fromTo(this.stamp, { autoAlpha: 0, scale: 3.2, rotation: -30 }, { autoAlpha: 1, scale: 1, rotation: -12, duration: 0.22, ease: 'power4.in' }, docAt + 0.85);
    tl.call(() => {
      sfx.stamp();
      sfx.impact(0.7);
      stage.shake(1, 0.4);
      const b = this.stamp.getBoundingClientRect();
      this.fx.sparks(b.left + b.width / 2, b.top + b.height / 2, 50, { color: ['#c4001f', '#8a0016', '#ff2b4a'], power: 0.9, g: 1400, size: 3 });
    }, null, docAt + 1.07);
    tl.fromTo(this.foot, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4 }, docAt + 1.3);
    tl.call(() => sfx.ding(), null, docAt + 1.3);

    // ── the punch (head rushes into the lens) ──
    const punchAt = docAt + 2.6;
    this.punchHead = this.actor('head', 'official-face', m * 0.3);
    gsap.set(this.punchHead, { xPercent: -50, yPercent: -50, x: W / 2, y: H / 2, scale: 0.2, visibility: 'hidden' });
    tl.set(this.punchHead, { visibility: 'visible' }, punchAt);
    tl.call(() => sfx.riser(0.5, 0.1), null, punchAt);
    tl.to(this.punchHead, { scale: 5.5, rotation: -8, duration: 0.5, ease: 'power4.in' }, punchAt);
    tl.to({}, { duration: 0.01 }, punchAt + 0.5);
    return this.play(tl);
  }

  buildArmy(tl, at, ball) {
    const W = stage.w;
    const H = stage.h;
    const portrait = stage.portrait;
    const cols = portrait ? 4 : 7;
    const rows = portrait ? 5 : 3;
    const cw = W / cols;
    const ch = (H * 0.86) / rows;
    const hgt = Math.min(ch * 0.92, cw * 1.9);
    const cells = [];
    const hues = ['h0', 'h1', 'h2', 'h3'];
    for (let rI = 0; rI < rows; rI++) {
      for (let c = 0; c < cols; c++) {
        const d = el('div.lu-soldier.' + hues[(rI + c) % 4], {}, [el('img', { src: img('lula/jersey-full').src, alt: '' })]);
        d.style.height = hgt + 'px';
        d.style.left = c * cw + cw / 2 + 'px';
        d.style.top = H * 0.08 + rI * ch + (ch - hgt) + 'px';
        this.army.append(d);
        cells.push(d);
      }
    }
    const center = cells[Math.floor(rows / 2) * cols + Math.floor(cols / 2)];
    const glasses = el('div.lu-glasses', { html: '<svg viewBox="0 0 60 14"><path d="M0 0h60v4h-2v4h-2v3h-2v3H40v-3h-2V8h-2V4h-6v4h-2v3h-2v3H12v-3h-2V8H8V4H0z" fill="#111"/><path d="M12 4h4v2h-4zM40 4h4v2h-4z" fill="#fff"/></svg>' });
    center.append(glasses);
    tl.set(ball, { visibility: 'hidden' }, at);
    tl.set(this.army, { visibility: 'visible' }, at);
    tl.fromTo(cells, { scale: 0, xPercent: -50 }, { scale: 1, xPercent: -50, duration: 0.35, ease: 'back.out(3)', stagger: { each: 0.02, from: 'end' } }, at);
    tl.call(() => sfx.sparkle(0, 8), null, at);
    // dance: 8 beats in sync with the funk
    for (let b = 0; b < 7; b++) {
      const bt = at + BEAT * (b + 0.5);
      tl.to(cells, { y: -ch * 0.08, rotation: b % 2 ? 9 : -9, scaleY: 1.08, scaleX: 0.94, duration: BEAT * 0.45, ease: 'power2.out', transformOrigin: '50% 100%' }, bt);
      tl.to(cells, { y: 0, scaleY: 0.92, scaleX: 1.06, duration: BEAT * 0.4, ease: 'power2.in' }, bt + BEAT * 0.45);
      tl.call(() => {
        cells.forEach((c) => {
          const k = hues.findIndex((h) => c.classList.contains(h));
          c.classList.remove(hues[k]);
          c.classList.add(hues[(k + 1) % 4]);
        });
        if (b === 3) this.army.classList.add('rgb');
      }, null, bt + BEAT * 0.45);
    }
    tl.fromTo(glasses, { y: -H * 0.6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: BEAT * 2, ease: 'none' }, at + BEAT * 3.5);
    tl.call(() => {
      sfx.pop(0, 0.6);
      this.caption.textContent = 'DEAL WITH IT 😎';
    }, null, at + BEAT * 5.5);
    tl.add(slam(this.caption, { from: 2, rot: -4, sound: null, shake: 0.3 }), at + BEAT * 5.5);
    tl.to(this.caption, { autoAlpha: 0, duration: 0.15 }, at + BEAT * 7.4);
    // collapse into the centre
    tl.to(cells, { left: W / 2, top: H / 2, scale: 0, rotation: () => rand(-360, 360), duration: 0.35, ease: 'power3.in', stagger: 0.008 }, at + BEAT * 7.6);
    tl.call(() => sfx.whoosh(0.35, { from: 3000, to: 300 }), null, at + BEAT * 7.6);
  }

  exit(next) {
    this.cleanups.forEach((f) => f());
    audio.stopAll(0.1);
    sfx.impact(1.3);
    return shatter(this.root, { x: stage.w / 2, y: stage.h / 2, power: 1.2, fx: this.fx });
  }

  destroy() {
    this.cleanups.forEach((f) => f());
    super.destroy();
  }
}
