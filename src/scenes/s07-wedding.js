import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { slam } from '../animations/text.js';
import { lula } from '../animations/lula.js';
import { heartIris } from '../animations/transitions.js';
import { portrait, layoutPortraits, src } from '../core/assets.js';
import { paintArch } from '../effects/flowers.js';
import { PALETTE } from '../effects/particles.js';
import { rand, TAU } from '../utils/math.js';

/* 07 — the wedding of the century. Golden hour, flowers, real 3D rings… and an officiant
   who is much, much too big. */

const DOVE = `<svg viewBox="0 0 120 80" aria-hidden="true"><g class="wing back"><path d="M58 38 C48 14 30 4 12 2 C26 14 34 26 44 40Z" fill="#e9e4dc"/></g>
<path d="M18 46 C30 36 52 34 70 38 C82 30 94 30 100 36 C96 38 94 40 96 44 C88 50 74 56 56 56 C44 60 30 60 14 66 C20 58 22 52 18 46Z" fill="#fff"/>
<circle cx="92" cy="37" r="1.8" fill="#222"/><path d="M100 36 L108 38 L100 40Z" fill="#f2a33a"/>
<g class="wing front"><path d="M60 40 C56 14 70 0 92 -2 C84 12 78 26 72 42Z" fill="#fff"/></g></svg>`;

const VEIL = `<svg viewBox="0 0 200 220" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs>
<path d="M100 6 C60 6 30 30 22 70 C14 120 6 170 2 216 C30 200 46 206 60 212 C50 160 52 110 64 70 C74 44 86 36 100 34 C114 36 126 44 136 70 C148 110 150 160 140 212 C154 206 170 200 198 216 C194 170 186 120 178 70 C170 30 140 6 100 6Z" fill="url(#vg)"/>
<path d="M2 216 C30 200 46 206 60 212 M140 212 C154 206 170 200 198 216" stroke="#fff" stroke-width="2" stroke-dasharray="2 4" fill="none" opacity=".8"/></svg>`;

const CROWN = `<svg viewBox="0 0 160 40" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => {
  const x = 10 + i * 17.5;
  const y = 22 - Math.sin((i / 8) * Math.PI) * 10;
  const c = ['#ffd1dc', '#fff', '#ff8fab', '#fff3c4'][i % 4];
  return `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/><circle cx="${x}" cy="${y}" r="3" fill="#f0c35a"/><path d="M${x + 6} ${y + 6} q6 2 10 -2" stroke="#4f8a43" stroke-width="3" fill="none"/>`;
}).join('')}</svg>`;

const BOW = `<svg viewBox="0 0 100 46" aria-hidden="true"><path d="M50 23 L8 4 C2 2 0 6 0 12 L0 34 C0 40 2 44 8 42Z M50 23 L92 4 C98 2 100 6 100 12 L100 34 C100 40 98 44 92 42Z" fill="#141414"/><rect x="40" y="13" width="20" height="20" rx="5" fill="#2a2a2a"/></svg>`;

const ORN = `<svg viewBox="0 0 120 40" aria-hidden="true"><path d="M60 36 C52 22 36 22 30 30 C24 38 12 36 8 26 C16 30 22 26 24 18 C28 6 46 6 54 16 C56 10 58 6 60 2 C62 6 64 10 66 16 C74 6 92 6 96 18 C98 26 104 30 112 26 C108 36 96 38 90 30 C84 22 68 22 60 36Z" fill="url(#og)"/><defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f0c35a"/><stop offset="1" stop-color="#9c6a14"/></linearGradient></defs></svg>`;

const FAR = `<svg viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
<path d="M115 200 L128 120 L132 120 L136 60 L139 60 L141 4 L143 60 L146 60 L150 120 L154 120 L167 200 L158 200 C152 168 130 168 124 200Z" />
<path d="M760 200 C770 150 790 120 812 118 C828 116 838 150 846 200Z M830 200 C850 90 880 40 910 42 C940 44 960 110 975 200Z"/>
<path d="M812 120 L912 46" stroke-width="1.2" fill="none"/><rect x="858" y="80" width="7" height="5"/></svg>`;

export class Wedding extends Scene {
  static id = 'wedding';

  async build() {
    const r = this.mount('s-wedding');
    const W = stage.w;
    const H = stage.h;
    const portraitMode = stage.portrait;
    this.world = el('div.wd-world');
    this.sky = el('div.wd-sky', {}, [el('div.wd-rays'), el('div.wd-sun')]);
    this.far = el('div.wd-far', { html: FAR });
    this.sea = el('div.wd-sea');
    const archW = portraitMode ? W * 1.04 : Math.min(W * 0.62, H * 0.95);
    const archH = archW * (portraitMode ? 0.95 : 0.78);
    const arch = paintArch(archW, archH, Math.min(quality.cfg.dpr, 1.5));
    arch.className = 'wd-arch';
    arch.style.width = archW + 'px';
    arch.style.height = archH + 'px';
    arch.style.left = (W - archW) / 2 + 'px';
    arch.style.top = H * 0.84 - archH + 'px';
    this.arch = arch;
    this.bokeh = el('div.wd-bokeh', { html: Array.from({ length: 9 }, () => '<i></i>').join('') });

    const frame = (who, extra) =>
      el(`div.wd-frame.${who}`, {}, [
        el('div.wd-gold', {}, [portrait(who, { cls: 'wd-photo' })]),
        el('div.wd-orn.top', { html: ORN }),
        el('div.wd-orn.bot', { html: ORN }),
        ...extra,
        el('p.wd-plate', { text: who === 'me' ? 'ele 🇫🇷' : 'ela 🇧🇷' }),
      ]);
    this.fMe = frame('me', [el('div.wd-bow', { html: BOW })]);
    this.fHer = frame('her', [el('div.wd-veil', { html: VEIL }), el('div.wd-crown', { html: CROWN })]);
    this.couple = el('div.wd-couple', {}, [this.fMe, this.fHer]);
    this.ringsCanvas = el('canvas.wd-rings');
    this.lula = lula('official-body', 'wd-lula');
    this.fists = lula('fists', 'wd-fists');
    this.lectern = el('div.wd-lectern', { html: '<div class="mic"></div><div class="top"></div><div class="seal">❤<small>MINISTÉRIO<br>DO AMOR</small></div>' });
    this.doc = el('div.wd-doc', { html: '<b>CERTIDÃO DE CASAMENTO</b><small>internacional · Brasil × França · válida em todo o universo</small>' });
    this.world.append(this.sky, this.far, this.sea, this.bokeh, this.arch, this.couple, this.lula, this.fists, this.lectern, this.doc, this.ringsCanvas);

    this.title = el('div.wd-title', { html: '<p class="t1">O Casamento do Século</p><p class="t2">Brasil 🇧🇷 &amp; França 🇫🇷 · 2026</p>' });
    this.declare = el('div.wd-declare', { html: '<p>EU VOS DECLARO<span class="dots">...</span></p>' });
    this.closeup = el('div.wd-closeup');
    this.closeup.style.backgroundImage = `url("${src('face/official-body')}")`;
    this.casados = el('p.wd-casados.meme', { html: '...CASADOS <span class="k">KKKKKKK</span>' });
    this.stamp = el('div.wd-stamp', { html: 'APROVADO 🇧🇷🇫🇷' });
    this.doves = el('div.wd-doves', { html: Array.from({ length: 6 }, () => `<div class="dove">${DOVE}</div>`).join('') });
    this.whats = el('div.wd-whats', { html: '<span>Lula saiu</span>' });
    r.append(this.world, this.doves, this.title, this.declare, this.closeup, this.casados, this.stamp, this.whats);

    // layout
    const fw = portraitMode ? W * 0.36 : Math.min(H * 0.3, W * 0.19);
    this.fw = fw;
    [this.fMe, this.fHer].forEach((f) => {
      f.style.width = fw + 'px';
      f.style.height = fw * 1.3 + 'px';
    });
    this.d = portraitMode ? W * 0.23 : fw * 0.85;
    this.coupleY = portraitMode ? H * 0.56 : H * 0.55;
    const lh = portraitMode ? H * 1.0 : H * 1.12;
    this.lula.style.height = lh + 'px';
    this.lula.querySelector('img').style.cssText = 'height:100%;width:auto';
    this.lulaTop = portraitMode ? H * 0.05 : H * 0.02;
    gsap.set(this.lula, { left: '50%', xPercent: -50, y: H * 1.05, visibility: 'hidden' });
    const fwid = portraitMode ? W * 1.2 : Math.min(W * 0.75, H * 1.1);
    this.fists.style.width = fwid + 'px';
    this.fists.querySelector('img').style.cssText = 'width:100%;height:auto';
    gsap.set(this.fists, { left: '50%', xPercent: -50, y: H * 0.76 - fwid / 1.46, visibility: 'hidden' });
    gsap.set(this.lectern, { yPercent: 110 });
    requestAnimationFrame(() => layoutPortraits(r));

    // rings (three.js, lazily loaded; 2D fallback)
    const dpr = Math.min(quality.cfg.dpr, quality.tier === 'low' ? 1 : 2);
    try {
      const mod = await import('../effects/rings3d.js');
      try {
        this.rings = mod.createRings(this.ringsCanvas, { dpr });
      } catch (e) {
        this.rings = mod.createRings2D(this.ringsCanvas, { dpr });
      }
    } catch (e) {
      this.rings = null;
    }
    if (this.rings) {
      this.rings.resize(W, H);
      Object.assign(this.rings.state, { x: 0.5, y: portraitMode ? 0.33 : 0.3, size: stage.min * 0.11, spread: 1, alpha: 0 });
    }
    this.orbit = { a: 0 };
    this.placeCouple(0, 1);
    this.tick((dt) => {
      if (!this.rings) return;
      this.rings.state.spin += dt * 2.2;
      this.rings.state.turn += dt * 0.8;
      this.rings.render();
    });
  }

  /** places the two frames on a circle around the centre (orbit angle a, radians) */
  placeCouple(a, spreadK = 1) {
    const W = stage.w;
    const items = [
      [this.fMe, Math.PI + a],
      [this.fHer, a],
    ];
    items.forEach(([f, phi]) => {
      const depth = Math.sin(phi);
      gsap.set(f, {
        x: W / 2 + Math.cos(phi) * this.d * spreadK - this.fw / 2,
        y: this.coupleY - this.fw * 0.65,
        scale: 1 + depth * 0.22,
        rotationY: (-a * 180) / Math.PI * 0.7,
        zIndex: depth > 0 ? 3 : 2,
        transformPerspective: 900,
      });
    });
    gsap.set(this.sky, { x: -a * stage.w * 0.06 });
    gsap.set(this.far, { x: -a * stage.w * 0.12 });
    gsap.set(this.arch, { x: -a * stage.w * 0.32 });
  }

  run() {
    const W = stage.w;
    const H = stage.h;
    const tl = this.timeline();
    const R = this.rings ? this.rings.state : { spread: 1, alpha: 0, size: 0, y: 0 };

    tl.call(() => {
      stage.flash('#fff3dc', 1.4, 0.85);
      audio.play('bridal', { cut: true, fadeIn: 0.6 });
    }, null, 0);
    tl.fromTo(this.world, { scale: 1.06 }, { scale: 1, duration: 8, ease: 'sine.out' }, 0);
    tl.fromTo(this.title.children, { autoAlpha: 0, y: 24, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.4, stagger: 0.4, ease: 'expo.out' }, 0.4);
    tl.to(this.title, { autoAlpha: 0, y: -20, duration: 0.8 }, 3.6);
    tl.call(() => this.fx.petals(22), null, 0.8);
    tl.call(() => this.fx.petals(18), null, 4.2);

    // frames glide in from both sides
    const glide = { k: 0 };
    tl.fromTo(glide, { k: 0 }, {
      k: 1,
      duration: 2.6,
      ease: 'power3.out',
      onUpdate: () => {
        const off = (1 - glide.k) * W * 0.8;
        this.placeCouple(0, 1);
        gsap.set(this.fMe, { x: `-=${off}`, rotationY: (1 - glide.k) * 50 });
        gsap.set(this.fHer, { x: `+=${off}`, rotationY: -(1 - glide.k) * 50 });
      },
    }, 0.9);
    tl.fromTo([this.fMe, this.fHer], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0.9);
    tl.call(() => sfx.sparkle(0, 6), null, 2.6);

    // rings descend, spin, interlock, flash
    tl.fromTo(R, { alpha: 0, y: -0.1 }, { alpha: 1, y: stage.portrait ? 0.33 : 0.3, duration: 1.6, ease: 'power2.out' }, 3.2);
    tl.to(R, { spread: 0, duration: 2.2, ease: 'power2.inOut' }, 3.9);
    tl.call(() => {
      const x = W * 0.5;
      const y = H * (stage.portrait ? 0.33 : 0.3);
      sfx.chime();
      sfx.sparkle(0.1, 8);
      this.fx.glow(x, y, { size: stage.min * 1.1, color: '#ffe3a0', life: 0.9 });
      this.fx.stars(x, y, 18, { color: '#fff3c4', spread: stage.min * 0.16 });
    }, null, 6.1);
    tl.call(() => {
      const x = W * 0.5;
      const y = H * (stage.portrait ? 0.33 : 0.3);
      this.fx.explode(x, y, { kind: 'heart', color: PALETTE.gold, n: 130, power: 0.75, life: 1.8 });
    }, null, 6.35);
    tl.to(R, { size: stage.min * 0.075, duration: 1.2, ease: 'power2.inOut' }, 6.4);

    // ...and then: LULA rises from the ground
    tl.call(() => {
      audio.stop('bridal', 0.5);
      sfx.timpaniHit(38);
      sfx.riser(1.1, 0.07);
    }, null, 7.1);
    tl.call(() => sfx.timpaniHit(36), null, 7.6);
    tl.to(R, { alpha: 0, duration: 0.4 }, 7.2);
    tl.to([this.fMe], { x: `-=${W * 0.28}`, scale: 0.8, duration: 0.8, ease: 'power3.inOut' }, 7.3);
    tl.to([this.fHer], { x: `+=${W * 0.28}`, scale: 0.8, duration: 0.8, ease: 'power3.inOut' }, 7.3);
    tl.set(this.lula, { visibility: 'visible' }, 7.4);
    tl.to(this.lula, { y: this.lulaTop, duration: 1.1, ease: 'back.out(1.2)' }, 7.4);
    tl.to(this.lectern, { yPercent: 0, duration: 0.9, ease: 'power3.out' }, 7.5);
    tl.call(() => {
      sfx.impact(0.9);
      stage.shake(0.9, 0.6);
    }, null, 8.2);
    tl.fromTo(this.doc, { autoAlpha: 0, scale: 0.4, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: -4, duration: 0.5, ease: 'back.out(2)' }, 8.4);

    // EU VOS DECLARO...
    tl.call(() => audio.play('declare', { cut: true }), null, 8.7);
    tl.fromTo(this.declare, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 8.8);
    tl.fromTo(this.declare.querySelector('p'), { letterSpacing: '0.6em', opacity: 0 }, { letterSpacing: '0.14em', opacity: 1, duration: 1.4, ease: 'expo.out' }, 8.8);
    tl.fromTo(this.declare.querySelectorAll('.dots'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 9.6);
    // dramatic silence, slow push-in towards his face
    tl.to(this.world, { scale: 1.45, transformOrigin: () => `${W / 2}px ${this.lulaTop + H * 0.12}px`, duration: 2.6, ease: 'sine.inOut' }, 8.9);
    tl.call(() => audio.stop('declare', 0.15), null, 10.2);
    tl.call(() => sfx.cricket(0, 2), null, 10.45);
    // telenovela zoom: dun dun DUN
    tl.set(this.closeup, { autoAlpha: 1, scale: 1 }, 11.6);
    tl.set(this.declare, { autoAlpha: 0 }, 11.6);
    [0, 0.26, 0.52].forEach((d, i) => {
      tl.set(this.closeup, { scale: [1, 1.35, 1.85][i] }, 11.6 + d);
      tl.call(() => {
        sfx.boom();
        stage.flash('#ff2040', 0.2, 0.3 + i * 0.15);
        stage.shake(0.4 + i * 0.3, 0.25);
      }, null, 11.6 + d);
    });

    // ...CASADOS KKKKKKK
    const at = 12.5;
    tl.set(this.closeup, { autoAlpha: 0 }, at);
    tl.set(this.world, { scale: 1 }, at);
    tl.set(this.lula, { visibility: 'hidden' }, at);
    tl.set(this.doc, { autoAlpha: 0 }, at);
    tl.set(this.fists, { visibility: 'visible' }, at);
    tl.call(() => {
      audio.play('fanfare', { cut: true });
      sfx.airhorn(0.1);
      this.fx.confetti(260, { from: 'top', colors: ['#ffd36b', '#fff', '#ffb3c6', '#ff2e4d', '#fff1c1'] });
      this.fx.hearts(W / 2, H * 0.45, 50, { power: 1.4 });
    }, null, at);
    tl.add(slam(this.casados, { from: 2.8, rot: -8, sound: 'impact', shake: 1.1 }), at);
    const ks = this.casados.querySelector('.k');
    tl.fromTo(ks, { width: '0.6em' }, { width: 'auto', duration: 0.6, ease: 'steps(6)' }, at + 0.3);
    tl.fromTo(this.stamp, { autoAlpha: 0, scale: 3, rotation: 20 }, { autoAlpha: 1, scale: 1, rotation: 8, duration: 0.22, ease: 'power4.in' }, at + 0.8);
    tl.call(() => {
      sfx.stamp();
      stage.shake(0.8, 0.3);
    }, null, at + 1.02);
    tl.call(() => this.flyDoves(), null, at + 0.6);
    tl.call(() => this.fx.petals(40), null, at + 0.6);
    tl.to([this.casados, this.stamp], { autoAlpha: 0, scale: 0.9, duration: 0.35 }, at + 2.3);

    // circular travelling around the two portraits
    const orbitAt = at + 2.2;
    tl.set(this.fists, { zIndex: 1 }, orbitAt - 0.2);
    tl.to(this.fists, { y: `-=${H * 0.16}`, scale: 0.6, filter: 'brightness(0.85)', duration: 0.7, ease: 'power2.inOut' }, orbitAt - 0.2);
    const o = { a: -0.65, k: 0 };
    tl.to(o, { k: 1, duration: 0.6, ease: 'power2.out', onUpdate: () => this.placeCouple(o.a * o.k, 0.8 + 0.2 * o.k) }, orbitAt);
    tl.to(o, { a: 0.65, duration: 3.0, ease: 'sine.inOut', onUpdate: () => this.placeCouple(o.a * o.k, 1) }, orbitAt + 0.3);
    tl.call(() => {
      this.fx.stars(W / 2, this.coupleY - this.fw * 0.3, 16, { color: '#fff3c4', spread: this.fw * 1.4 });
      sfx.sparkle();
    }, null, orbitAt + 1.2);
    tl.to(this.lectern, { yPercent: 110, duration: 0.6, ease: 'power2.in' }, orbitAt + 0.4);

    // Lula leaves (rocket mode) — "Lula saiu"
    const leave = orbitAt + 2.4;
    tl.to(this.fists, { scaleY: 0.78, scaleX: 0.95, transformOrigin: '50% 100%', duration: 0.25, ease: 'power2.out' }, leave);
    tl.call(() => {
      sfx.whoosh(0.8, { from: 150, to: 3000, gain: 0.3 });
      sfx.fwLaunch();
      const b = this.fists.getBoundingClientRect();
      this.rocket = this.tick(() => {
        const bb = this.fists.getBoundingClientRect();
        this.fx.smoke(bb.left + bb.width / 2, bb.bottom - bb.height * 0.1, 2, { size: 70, power: 0.6 });
        this.fx.sparks(bb.left + bb.width / 2, bb.bottom - bb.height * 0.1, 4, { color: ['#ffd36b', '#ff7b2b'], angle: Math.PI / 2, spread: 0.8, power: 0.6 });
      });
      this.fx.smoke(b.left + b.width / 2, b.bottom, 14, { size: 100 });
    }, null, leave + 0.25);
    tl.to(this.fists, { y: -H * 1.6, rotation: 12, scaleY: 1.25, scaleX: 0.85, duration: 0.9, ease: 'power3.in' }, leave + 0.25);
    tl.call(() => this.rocket && this.rocket(), null, leave + 1.15);
    tl.fromTo(this.whats, { autoAlpha: 0, y: 20, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' }, leave + 0.9);
    tl.call(() => sfx.pop(0, 1.3), null, leave + 0.9);
    tl.to({}, { duration: 1.4 }, leave + 1.2);
    return this.play(tl);
  }

  flyDoves() {
    const W = stage.w;
    const H = stage.h;
    sfx.whoosh(1.2, { gain: 0.12, from: 600, to: 2400 });
    [...this.doves.children].forEach((d, i) => {
      const s = stage.min * rand(0.12, 0.2);
      d.style.width = s + 'px';
      const y0 = H * rand(0.55, 0.9);
      gsap.fromTo(d, { x: -s * 1.5 - i * 30, y: y0, rotation: -10, autoAlpha: 1 }, { x: W + s, y: y0 - H * rand(0.4, 0.75), rotation: -18, duration: rand(2.2, 3), ease: 'sine.in', delay: i * 0.12 });
    });
  }

  exit() {
    audio.stop('fanfare', 1.2);
    const close = heartIris({ close: true, color: '#fff7ec', x: stage.w / 2, y: this.coupleY - this.fw * 0.2, duration: 0.9 });
    // once closed, a second iris opens on the next scene (it lives in #transition, outliving this one)
    return new Promise((res) =>
      close.tl.eventCallback('onComplete', () => {
        heartIris({ close: false, color: '#fff7ec', duration: 1.0 });
        close.node.remove();
        res();
      }),
    );
  }

  destroy() {
    if (this.rocket) this.rocket();
    if (this.rings) this.rings.dispose();
    super.destroy();
  }
}
