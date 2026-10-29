import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { head } from '../animations/lula.js';
import { portrait, layoutPortraits } from '../core/assets.js';
import { DotMap, DotGlobe, PLACES } from '../effects/worldmap.js';
import { PALETTE } from '../effects/particles.js';
import { rand } from '../utils/math.js';

/* 08 — the honeymoon montage: impossible postcards cut like a cartoon. */

const EIFFEL = `<svg class="eiffel" viewBox="0 0 100 160" aria-hidden="true">
<path d="M49 0h2l1.2 26h2.2l2.6 30h4l5 34h5l13 70h-14c-3-18-10-30-20-30s-17 12-20 30H16l13-70h5l5-34h4l2.6-30h2.2z" />
<rect x="40" y="54" width="20" height="3"/><rect x="31" y="88" width="38" height="4"/><rect x="47" y="24" width="6" height="3"/>
</svg>`;
const CROISSANT = `<svg viewBox="0 0 220 120" aria-hidden="true"><defs><linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7c66b"/><stop offset=".6" stop-color="#c9781f"/><stop offset="1" stop-color="#8a4a12"/></linearGradient></defs>
<g fill="url(#cr)" stroke="#7a3d0c" stroke-width="3">
<path d="M14 92 C6 70 20 48 40 52 C46 70 38 88 14 92Z"/><path d="M40 52 C46 28 70 18 86 30 C88 54 72 70 46 72 Z"/>
<path d="M84 30 C96 6 128 4 140 22 C140 50 120 64 92 62Z" /><path d="M138 22 C156 16 178 32 180 52 C170 70 148 70 132 58Z"/>
<path d="M178 50 C200 54 214 74 206 94 C186 92 172 80 172 64Z"/></g>
<path d="M60 40 q8 10 4 24 M108 22 q10 14 2 32 M152 34 q8 10 2 24" stroke="#fff3c4" stroke-width="3" fill="none" opacity=".6"/></svg>`;
const PLANE = `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 6c5 0 7 8 7 16v28l44 22v10l-44-12v24l12 9v8l-19-6-19 6v-8l12-9V70L9 82V72l44-22V22c0-8 2-16 7-16z" fill="#fff" stroke="#c9d6e6" stroke-width="2"/><path d="M60 10c3 0 4 4 4 8h-8c0-4 1-8 4-8z" fill="#7fb2e5"/><circle cx="60" cy="58" r="5" fill="#ff2e4d"/></svg>`;
const CASE = `<svg viewBox="0 0 200 170" aria-hidden="true"><rect x="70" y="4" width="60" height="26" rx="10" fill="none" stroke="#5a2a14" stroke-width="10"/>
<rect x="6" y="26" width="188" height="136" rx="18" fill="#c8452c"/><rect x="6" y="26" width="188" height="136" rx="18" fill="none" stroke="#7a2412" stroke-width="5"/>
<rect x="40" y="26" width="12" height="136" fill="#9a2f1c"/><rect x="148" y="26" width="12" height="136" fill="#9a2f1c"/>
<circle cx="100" cy="70" r="24" fill="#fff3c4"/><text x="100" y="77" text-anchor="middle" font-family="Anton, Impact" font-size="17" fill="#0055a4">PARIS</text>
<rect x="64" y="104" width="76" height="34" rx="6" fill="#ffdf00" transform="rotate(-8 100 120)"/><text x="100" y="128" text-anchor="middle" font-family="Anton, Impact" font-size="20" fill="#009c3b" transform="rotate(-8 100 120)">RIO ❤</text>
<circle cx="168" cy="140" r="12" fill="#ff8fab"/><text x="168" y="145" text-anchor="middle" font-size="14">❤</text></svg>`;

export class Honeymoon extends Scene {
  static id = 'honeymoon';

  async build() {
    const r = this.mount('s-honeymoon');
    const W = stage.w;
    const H = stage.h;
    // A — Paris
    this.paris = el('div.hm-shot.hm-paris', { html: `<div class="hm-stars"></div>${EIFFEL}<svg class="bunting" viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div class="hm-card"><b>PARIS 🇫🇷</b><small>agora com bandeirinhas</small></div>` });
    this.buildBunting(this.paris.querySelector('.bunting'));
    // B — Rio
    this.rio = el('div.hm-shot.hm-rio', {
      html: `<div class="hm-sun"></div><svg class="hm-hills" viewBox="0 0 1000 300" preserveAspectRatio="none"><path d="M0 300 L0 230 C80 220 140 240 200 230 C260 160 300 120 340 125 C380 128 400 190 430 300Z M520 300 C560 160 610 40 690 34 C770 30 820 160 880 300Z M600 300 L1000 300 L1000 250 C960 240 920 250 900 300Z" /><path d="M340 128 L690 40" stroke-width="2" fill="none"/></svg><div class="hm-sea"></div><div class="hm-croissant">${CROISSANT}<span>BONJOUR, RIO!</span></div><div class="hm-card"><b>RIO DE JANEIRO 🇧🇷</b><small>agora com croissant voador</small></div>`,
    });
    // C — flight / boss fight
    this.mapCanvas = el('canvas.hm-map');
    this.plane = el('div.hm-plane', { html: PLANE });
    this.hitch = head('cap-thumb', 'hm-hitch');
    this.flight = el('div.hm-shot.hm-flight', {}, [
      this.mapCanvas,
      this.plane,
      this.hitch,
      el('div.hm-boss', { html: '<p>BOSS FINAL: <b>A DISTÂNCIA</b></p><div class="hp"><i></i></div><span class="km">9.163 km</span>' }),
      el('p.hm-ko', { text: 'K.O.!' }),
      el('p.hm-tchau.meme', { text: 'tchau!' }),
    ]);
    // D — passport
    this.passport = el('div.hm-shot.hm-pass', {}, [
      el('div.pp', {}, [
        el('p.pp-h', { html: 'REPÚBLICA FEDERATIVA DO AMOR<br><small>PASSAPORTE · PASSEPORT</small>' }),
        el('div.pp-photos', {}, [portrait('me', { cls: 'pp-ph', zoom: 1.7 }), portrait('her', { cls: 'pp-ph', zoom: 1.8 })]),
        el('dl.pp-f', { html: '<dt>Titulares</dt><dd>o casal do século</dd><dt>Nacionalidade</dt><dd>🇧🇷 + 🇫🇷</dd><dt>Validade</dt><dd>pra sempre</dd>' }),
        el('div.pp-mrz', { text: 'P<BRAFRA<<AMOR<<INTERNACIONAL<<<<<<<<<<<<<' }),
        el('div.st1', { text: 'AMOR INTERNACIONAL' }),
        el('div.st2', { html: 'GRU ✈ CDG<br><small>ENTRADA AUTORIZADA</small>' }),
        el('div.st3', { html: 'APROVADO<br>❤' }),
      ]),
    ]);
    // E — suitcase
    this.suit = el('div.hm-shot.hm-case', { html: `<div class="case">${CASE}</div><p class="hm-lbl meme">bagagem: 23 kg de saudade</p>` });
    // F — earth → heart
    this.earthCanvas = el('canvas.hm-earth');
    this.earth = el('div.hm-shot.hm-globe', {}, [this.earthCanvas, el('p.hm-world', { html: 'o mundo ficou pequeno<br><em>pra nós dois</em>' })]);
    r.append(this.earth, this.suit, this.passport, this.flight, this.rio, this.paris);
    [this.rio, this.flight, this.passport, this.suit, this.earth].forEach((s) => gsap.set(s, { autoAlpha: 0 }));
    requestAnimationFrame(() => layoutPortraits(r));

    this.map = new DotMap({ top: 62, bottom: -40, west: -78, east: 24 });
    this.globe = new DotGlobe();
    this.st = { plane: 0, globeMorph: 0, globeOn: 0, mapOn: 0 };
    this.lon = 30;
    this.dpr = Math.min(quality.cfg.dpr, 2);
    for (const c of [this.mapCanvas, this.earthCanvas]) {
      c.width = W * this.dpr;
      c.height = H * this.dpr;
    }
    const portraitMode = stage.portrait;
    let mw = W * (portraitMode ? 1.15 : 0.8);
    let mh = mw / this.map.aspect;
    if (mh > H * 0.8) {
      mh = H * 0.8;
      mw = mh * this.map.aspect;
    }
    this.mapRect = { x: (W - mw) / 2, y: (H - mh) / 2 + H * 0.04, w: mw, h: mh };
    this.tick((dt) => this.draw(dt));
  }

  buildBunting(svgEl) {
    const lines = [
      [[50, 18], [8, 70], [26, 52]],
      [[50, 18], [92, 70], [74, 52]],
      [[50, 40], [0, 92], [20, 78]],
      [[50, 40], [100, 92], [80, 78]],
    ];
    const cols = ['#009c3b', '#ffdf00', '#002776', '#ffffff', '#ffdf00'];
    let html = '';
    lines.forEach(([a, b, c], li) => {
      html += `<path d="M${a[0]} ${a[1]} Q${c[0]} ${c[1] + 14} ${b[0]} ${b[1]}" stroke="#3a2a2a" stroke-width=".4" fill="none"/>`;
      for (let i = 1; i < 12; i++) {
        const t = i / 12;
        const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0];
        const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * (c[1] + 14) + t * t * b[1];
        html += `<path d="M${x - 1.6} ${y} L${x + 1.6} ${y} L${x} ${y + 4.2}Z" fill="${cols[(i + li) % cols.length]}"/>`;
      }
    });
    svgEl.innerHTML = html;
  }

  draw(dt) {
    const W = stage.w;
    const H = stage.h;
    const d = this.dpr;
    if (this.st.mapOn) {
      const ctx = this.mapCanvas.getContext('2d');
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, W, H);
      this.map.draw(ctx, this.mapRect, 0, { color: 'rgba(90,60,40,0.55)', hl: (f) => (f === 1 ? '#0055a4' : '#009c3b') });
      const k = this.st.plane;
      const head = this.map.laser(ctx, PLACES.paris, PLACES.rio, this.mapRect, Math.max(0.001, k), { color: '#ff2e4d', width: Math.max(2, stage.u * 0.5), lift: 0.3 });
      if (head) {
        // plane follows the head of the trail
        const next = this.map.arcPoint(PLACES.paris, PLACES.rio, this.mapRect, Math.min(1, k + 0.01), 0.3);
        const ang = next ? Math.atan2(next.y - head.y, next.x - head.x) : Math.PI / 2;
        gsap.set(this.plane, { x: head.x, y: head.y, rotation: (ang * 180) / Math.PI + 90 });
        this.planePos = head;
        this.planeAng = ang;
      }
    }
    if (this.st.globeOn) {
      const ctx = this.earthCanvas.getContext('2d');
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, W, H);
      this.lon -= dt * 40 * (1 - this.st.globeMorph * 0.9);
      const R = Math.min(W, H) * 0.3;
      this.globe.draw(ctx, W / 2, H * 0.46, R, this.lon, { morph: this.st.globeMorph, time: 0 });
    }
  }

  run() {
    const W = stage.w;
    const H = stage.h;
    const tl = this.timeline();
    const st = this.st;
    // A — Paris
    tl.call(() => {
      audio.play('musette', { cut: true });
      sfx.whoosh(0.4);
    }, null, 0);
    tl.fromTo(this.paris, { autoAlpha: 0, scale: 1.3 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'expo.out' }, 0);
    tl.fromTo(this.paris.querySelector('.eiffel'), { yPercent: 18 }, { yPercent: 0, duration: 2.2, ease: 'sine.out' }, 0);
    tl.fromTo(this.paris.querySelectorAll('.bunting path'), { scale: 0, transformOrigin: '50% 0%' }, { scale: 1, duration: 0.3, stagger: 0.012, ease: 'back.out(3)' }, 0.35);
    tl.fromTo(this.paris.querySelector('.hm-card'), { autoAlpha: 0, rotation: -14, scale: 0.6 }, { autoAlpha: 1, rotation: -4, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 0.5);
    // whip pan to Rio
    tl.call(() => {
      sfx.whoosh(0.35, { from: 3000, to: 400, panFrom: 0.8, panTo: -0.8 });
      audio.play('bossa', { cut: true });
    }, null, 2.05);
    tl.to(this.paris, { xPercent: -100, skewX: 12, filter: 'blur(6px)', duration: 0.3, ease: 'power3.in' }, 2.0);
    tl.set(this.paris, { autoAlpha: 0 }, 2.31);
    tl.fromTo(this.rio, { autoAlpha: 1, xPercent: 100, skewX: 12, filter: 'blur(6px)' }, { xPercent: 0, skewX: 0, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }, 2.2);
    tl.fromTo(this.rio.querySelector('.hm-croissant'), { x: -W * 0.9, rotation: -12 }, { x: W * 1.1, rotation: 8, duration: 2.0, ease: 'none' }, 2.3);
    tl.call(() => sfx.whoosh(1.5, { gain: 0.14, from: 200, to: 900 }), null, 2.5);
    tl.fromTo(this.rio.querySelector('.hm-card'), { autoAlpha: 0, rotation: 14, scale: 0.6 }, { autoAlpha: 1, rotation: 4, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 2.6);

    // C — flight, boss fight
    tl.to(this.rio, { scale: 2.5, autoAlpha: 0, duration: 0.4, ease: 'power3.in' }, 4.1);
    tl.fromTo(this.flight, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'expo.out' }, 4.2);
    tl.set(st, { mapOn: 1 }, 4.2);
    const boss = this.flight.querySelector('.hm-boss');
    tl.fromTo(boss, { yPercent: -200 }, { yPercent: 0, duration: 0.4, ease: 'back.out(2)' }, 4.35);
    tl.call(() => sfx.alarm(2), null, 4.35);
    const hs = stage.min * 0.12;
    this.hitch.style.height = hs + 'px';
    this.hitch.querySelector('img').style.cssText = 'height:100%;width:auto';
    tl.to(st, {
      plane: 1,
      duration: 2.4,
      ease: 'power1.inOut',
      onUpdate: () => {
        const k = st.plane;
        boss.querySelector('.hp i').style.width = (1 - k) * 100 + '%';
        boss.querySelector('.km').textContent = Math.round(9163 * (1 - k)).toLocaleString('pt-BR') + ' km';
        if (this.planePos && k < 0.48) {
          const back = 0.5 * stage.min * 0.1;
          gsap.set(this.hitch, { x: this.planePos.x - Math.cos(this.planeAng) * back * 2, y: this.planePos.y - Math.sin(this.planeAng) * back * 2, rotation: Math.sin(k * 60) * 25, xPercent: -50, yPercent: -50 });
        }
        if (this.planePos && Math.random() < 0.35) this.fx.hearts(this.planePos.x, this.planePos.y, 1, { power: 0.08, g: -40, size: [8, 14], life: [0.6, 1] });
      },
    }, 4.55);
    tl.fromTo(this.plane, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 4.55);
    tl.fromTo(this.hitch, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 4.6);
    // Lula gets blown off the plane
    const tchau = this.flight.querySelector('.hm-tchau');
    tl.call(() => {
      sfx.slide(false);
      gsap.to(this.hitch, { x: `+=${rand(-W * 0.3, W * 0.3)}`, y: H + hs, rotation: 900, duration: 1.1, ease: 'power2.in' });
      gsap.set(tchau, { x: this.planePos ? this.planePos.x : W / 2, y: this.planePos ? this.planePos.y : H / 2 });
    }, null, 5.75);
    tl.fromTo(tchau, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, 5.8);
    tl.to(tchau, { autoAlpha: 0, duration: 0.2 }, 6.5);
    tl.call(() => {
      sfx.impact(0.8);
      sfx.ding();
      const p = this.planePos || { x: W / 2, y: H / 2 };
      this.fx.hearts(p.x, p.y, 30, { power: 0.9 });
      this.fx.sparks(p.x, p.y, 40, { color: ['#fff', '#ffd36b', '#ff2e4d'] });
    }, null, 6.95);
    tl.fromTo(this.flight.querySelector('.hm-ko'), { autoAlpha: 0, scale: 3, rotation: -12 }, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.28, ease: 'power4.in' }, 6.95);

    // D — passport stamps
    tl.to(this.flight, { yPercent: -100, duration: 0.3, ease: 'power3.in' }, 7.5);
    tl.set(this.flight, { autoAlpha: 0 }, 7.81);
    tl.set(st, { mapOn: 0 }, 7.8);
    tl.fromTo(this.passport, { autoAlpha: 1, yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'power3.out' }, 7.6);
    tl.call(() => sfx.whoosh(0.3), null, 7.55);
    const stamps = this.passport.querySelectorAll('.st1, .st2, .st3');
    stamps.forEach((s, i) => {
      const at = 8.1 + i * 0.32;
      tl.fromTo(s, { autoAlpha: 0, scale: 2.6 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'power4.in' }, at);
      tl.call(() => {
        sfx.stamp();
        stage.shake(0.35, 0.15);
      }, null, at + 0.14);
    });

    // E — suitcase explodes
    tl.set(this.passport, { autoAlpha: 0 }, 9.35);
    tl.set(this.suit, { autoAlpha: 1 }, 9.35);
    tl.call(() => stage.flash('#fff', 0.2, 0.6), null, 9.35);
    const cs = this.suit.querySelector('.case');
    tl.fromTo(cs, { scale: 0.5, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2)' }, 9.35);
    tl.to(cs, { scaleX: 1.12, scaleY: 0.9, rotation: 3, duration: 0.09, yoyo: true, repeat: 5 }, 9.7);
    tl.call(() => sfx.boing(0, 1.3), null, 9.7);
    tl.call(() => {
      const b = cs.getBoundingClientRect();
      const x = b.left + b.width / 2;
      const y = b.top + b.height / 2;
      sfx.impact(1);
      sfx.pop();
      stage.shake(0.9, 0.4);
      this.fx.confetti(220, { x, y, from: 'point', power: 1.5 });
      this.fx.hearts(x, y, 40, { power: 1.4 });
      cs.style.visibility = 'hidden';
    }, null, 10.25);
    tl.to(this.suit.querySelector('.hm-lbl'), { autoAlpha: 0, duration: 0.2 }, 10.25);

    // F — the planet becomes a heart
    tl.set(this.suit, { autoAlpha: 0 }, 10.5);
    tl.set(st, { globeOn: 1 }, 10.4);
    tl.fromTo(this.earth, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 10.4);
    tl.fromTo(this.earthCanvas, { scale: 0.4 }, { scale: 1, duration: 1.0, ease: 'expo.out' }, 10.4);
    tl.call(() => sfx.riser(1.2, 0.06), null, 11.1);
    tl.to(st, { globeMorph: 1, duration: 1.4, ease: 'power2.inOut' }, 11.3);
    tl.call(() => {
      sfx.chime();
      this.fx.glow(W / 2, H * 0.46, { size: stage.min * 1.2, color: '#ff7a9a', life: 1 });
    }, null, 12.6);
    tl.fromTo(this.earth.querySelector('.hm-world'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 12.4);
    tl.to({}, { duration: 1.3 }, 12.9);
    return this.play(tl);
  }

  exit() {
    audio.stop('bossa', 1.2);
    const tl = this.timeline();
    tl.to(this.root, { autoAlpha: 0, duration: 1.0, ease: 'power2.in' });
    return this.play(tl);
  }
}
