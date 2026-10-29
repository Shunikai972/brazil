import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { stampLetters, slam } from '../animations/text.js';
import { DotMap, PLACES } from '../effects/worldmap.js';
import { flagTexture, drawWavingFlag } from '../effects/flags.js';
import world from '../data/world.json';
import { PALETTE } from '../effects/particles.js';

/* 02 — PLANTÃO: Brazilian-TV breaking news, a laser across the Atlantic, two flags collide. */

const TICKER = [
  'UMA BRASILEIRA DISSE SIM A UM FRANCÊS',
  'ESPECIALISTAS NÃO SABEM EXPLICAR',
  'FRANCÊS SEGUE EM ESTADO DE CHOQUE',
  'BOLSA DE VALORES DO AMOR SOBE 9.000%',
  'PADARIAS DE PARIS ESGOTAM PÃO DE QUEIJO',
  'BRIGADEIRO É DECLARADO PATRIMÔNIO DA FRANÇA',
  'TORCIDA COMEMORA NA AVENIDA PAULISTA',
];

export class Breaking extends Scene {
  static id = 'breaking';

  async build() {
    const r = this.mount('s-breaking');
    this.canvas = el('canvas.bn-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.title = el('h1.bn-title', {}, [el('span.bn-l1', { text: 'BREAKING' }), el('span.bn-l2', { text: 'NEWS' })]);
    this.sirens = [el('div.bn-siren.left'), el('div.bn-siren.right')];
    this.sub = el('div.bn-sub', {}, [el('p.bar.b1', { text: 'UMA BRASILEIRA' }), el('p.bar.b2', { text: 'DISSE SIM' }), el('p.bar.b3', { text: 'A UM FRANCÊS' })]);
    this.drill = el('p.bn-drill', { 'data-text': 'THIS IS NOT A DRILL.', text: 'THIS IS NOT A DRILL.' });
    this.headline = el('div.bn-headline', {}, [this.sirens[0], this.title, this.sirens[1], this.sub, this.drill]);
    this.ident = el('div.bn-ident', {}, [
      el('div.bn-globe', {}, [el('div.bn-ring.r1'), el('div.bn-ring.r2'), el('div.bn-shine')]),
      el('p.bn-plantao', { text: 'PLANTÃO' }),
      el('p.bn-channel', { html: 'TV <b>CORAÇÃO</b>' }),
    ]);
    this.lblBR = el('div.bn-label.br', { html: '<b>BRASIL</b><span>ela 🇧🇷</span>' });
    this.lblFR = el('div.bn-label.fr', { html: '<b>FRANÇA</b><span>ele 🇫🇷</span>' });
    this.fact = el('div.bn-fact', { html: '<b>CURIOSIDADE</b>A França faz fronteira com o Brasil.<br><small>(é sério: Guiana Francesa. era o destino.)</small>' });
    this.newflag = el('div.bn-newflag', { html: '<b>NOVA BANDEIRA OFICIAL*</b><small>*provisória, aguardando aprovação do Lula</small>' });
    const items = TICKER.map((t) => `<span>${t}</span><i>●</i>`).join('');
    this.hud = el('div.bn-hud', {}, [
      el('div.bn-live', { html: '<i></i>AO VIVO' }),
      el('div.bn-bug', { html: 'TV<b>❤</b>' }),
      el('div.bn-ticker', {}, [el('div.bn-urgente', { text: 'URGENTE' }), el('div.bn-crawl', {}, [el('div.bn-track', { html: items + items })])]),
    ]);
    r.append(el('div.bn-bg'), el('div.bn-beams', {}, [el('div.beam'), el('div.beam b2')]), this.canvas, this.headline, this.lblBR, this.lblFR, this.fact, this.newflag, this.ident, this.hud, el('div.bn-scan'));

    this.map = new DotMap({ top: 66, bottom: -42, west: -88, east: 30 });
    this.st = { map: 0, mapScale: 1, mapAlpha: 1, laser: 0, flags: 0, flagsAlpha: 0, hybrid: 0, blink: 0 };
    this.time = 0;
    this.resize();
    this.onResize(() => this.resize());
    this.tick((dt) => this.draw(dt));
  }

  resize() {
    const dpr = Math.min(quality.cfg.dpr, 2);
    this.canvas.width = stage.w * dpr;
    this.canvas.height = stage.h * dpr;
    this.dpr = dpr;
    const portrait = stage.portrait;
    const maxW = stage.w * (portrait ? 0.96 : 0.62);
    const maxH = stage.h * (portrait ? 0.52 : 0.7);
    let w = maxW;
    let h = w / this.map.aspect;
    if (h > maxH) {
      h = maxH;
      w = h * this.map.aspect;
    }
    this.mapRect = { x: (stage.w - w) / 2, y: stage.h * (portrait ? 0.22 : 0.16), w, h };
    if (this._labelsPlaced) this.placeLabels();
  }

  placeLabels() {
    this._labelsPlaced = true;
    const br = this.map.project(-52, -8, this.mapRect);
    const fr = this.map.project(2.5, 47, this.mapRect);
    const clampX = (node, x) => {
      const hw = node.offsetWidth / 2 + 8;
      return Math.min(stage.w - hw, Math.max(hw, x));
    };
    gsap.set(this.lblBR, { x: clampX(this.lblBR, br.x), y: br.y });
    gsap.set(this.lblFR, { x: clampX(this.lblFR, fr.x), y: fr.y });
  }

  draw(dt) {
    this.time += dt;
    const { ctx, st, dpr } = this;
    const W = stage.w;
    const H = stage.h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const t = this.time;
    if (st.map > 0 && st.mapAlpha > 0) {
      const r = this.mapRect;
      ctx.save();
      ctx.globalAlpha = st.mapAlpha;
      const cx = r.x + r.w * 0.55;
      const cy = r.y + r.h * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(st.mapScale, st.mapScale);
      ctx.translate(-cx, -cy);
      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      for (let lon = -80; lon <= 30; lon += 20) {
        const a = this.map.project(lon, this.map.top, r);
        const b = this.map.project(lon, this.map.bottom, r);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let lat = -40; lat <= 60; lat += 20) {
        const a = this.map.project(this.map.west, lat, r);
        const b = this.map.project(this.map.east, lat, r);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const on = Math.sin(t * 9) > 0;
      this.map.draw(ctx, r, t, {
        color: 'rgba(255,225,215,0.5)',
        reveal: st.map,
        hl: (f) => (st.blink ? (f === 1 ? (on ? '#7fc4ff' : '#fff') : on ? '#ffe066' : '#3dff8b') : 'rgba(255,225,215,0.5)'),
      });
      if (st.blink) {
        const o = { lineWidth: 2, strokeStyle: on ? '#ffe066' : '#3dff8b', lineJoin: 'round' };
        this.map.outline(ctx, world.brazil, r, o);
        this.map.outline(ctx, world.france, r, { ...o, strokeStyle: on ? '#7fc4ff' : '#fff' });
      }
      const head = this.map.laser(ctx, PLACES.rio, PLACES.paris, r, st.laser, { color: '#ff3d8b', width: Math.max(2.5, stage.u * 0.7), time: t, lift: 0.28 });
      if (head) this.laserHead = head;
      ctx.restore();
    }
    if (st.flagsAlpha > 0) {
      const fw = Math.min(W * 0.46, H * 0.42);
      const fh = fw * 0.66;
      const y = H * 0.5 - fh / 2;
      const k = st.flags;
      const lx = -fw + (W / 2 - fw * 0.92 + fw) * k;
      const rx = W - (W / 2 - fw * 0.08) * k;
      drawWavingFlag(ctx, flagTexture('br'), lx, y + Math.sin(t * 3) * 6, fw, fh, t, { alpha: st.flagsAlpha, pole: false, amp: 0.05 });
      drawWavingFlag(ctx, flagTexture('fr'), rx, y - Math.sin(t * 3) * 6, fw, fh, t + 1, { alpha: st.flagsAlpha, pole: false, amp: 0.05 });
    }
    if (st.hybrid > 0) {
      const fw = Math.min(W * 0.8, H * 0.6 * 1.43);
      const fh = fw * 0.7;
      ctx.save();
      ctx.translate(W / 2, H * 0.47);
      ctx.scale(st.hybrid, st.hybrid);
      drawWavingFlag(ctx, flagTexture('love'), -fw / 2, -fh / 2, fw, fh, t, { amp: 0.07, freq: 1.6, speed: 4.5, pole: true });
      ctx.restore();
    }
  }

  run() {
    const st = this.st;
    const tl = this.timeline();
    const W = stage.w;
    const H = stage.h;
    tl.call(() => {
      stage.uncover(0.25);
      stage.flash('#ff1530', 0.6, 0.9);
      audio.play('news', { cut: true });
      sfx.siren(3.4, 0.05);
      sfx.impact(0.8);
    }, null, 0);
    tl.fromTo(this.sirens, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', stagger: 0.1 }, 0.05);
    tl.add(stampLetters(this.title.querySelector('.bn-l1'), { stagger: 0.055, shake: 0.3 }), 0.05);
    tl.add(stampLetters(this.title.querySelector('.bn-l2'), { stagger: 0.08, from: 3.2, shake: 0.5 }), 0.62);
    tl.fromTo(this.sub.children, { xPercent: -120, skewX: -18 }, { xPercent: 0, skewX: -8, duration: 0.42, ease: 'expo.out', stagger: 0.12 }, 1.25);
    tl.call(() => sfx.whoosh(0.4), null, 1.25);
    tl.add(slam(this.drill, { from: 2.4, rot: 6, sound: 'impact', shake: 0.9 }), 2.2);
    tl.call(() => this.drill.classList.add('glitch'), null, 2.55);
    // headline away, channel ident
    tl.to(this.headline, { yPercent: -30, scale: 0.6, opacity: 0, duration: 0.45, ease: 'power3.in' }, 3.15);
    tl.call(() => {
      sfx.whoosh(0.5, { from: 300, to: 4000 });
      sfx.chime(0.25);
    }, null, 3.2);
    tl.fromTo(this.ident, { autoAlpha: 0, scale: 0.2, rotation: -40 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.6)' }, 3.3);
    tl.fromTo(this.ident.querySelector('.bn-plantao'), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'expo.out' }, 3.75);
    tl.to(this.ident, { scale: 0.18, x: -W * 0.36, y: -H * 0.4, autoAlpha: 0, duration: 0.5, ease: 'power3.in' }, 4.55);
    // world map
    tl.to(st, { map: 1, duration: 0.9, ease: 'power1.inOut' }, 4.75);
    tl.call(() => {
      st.blink = 1;
      this.placeLabels();
      sfx.beep(880, 0.08);
      sfx.beep(1320, 0.08, 0.05, 0.12);
    }, null, 5.5);
    tl.fromTo([this.lblBR, this.lblFR], { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(3)', stagger: 0.15 }, 5.55);
    tl.fromTo(this.fact, { autoAlpha: 0, y: 30, rotation: -4 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.5, ease: 'back.out(2)' }, 5.9);
    tl.call(() => sfx.pop(), null, 5.9);
    tl.call(() => sfx.zap(), null, 6.7);
    tl.call(() => sfx.riser(0.9, 0.08), null, 6.7);
    tl.to(st, { laser: 1, duration: 0.95, ease: 'power2.in' }, 6.7);
    tl.call(() => {
      const r = this.mapRect;
      const p = this.map.project(PLACES.paris[0], PLACES.paris[1], r);
      sfx.impact(0.9);
      stage.shake(0.8, 0.5);
      this.fx.ring(p.x, p.y, { r1: stage.min * 0.5, width: 10, color: '#ff3d8b', life: 0.8 });
      this.fx.sparks(p.x, p.y, 40, { color: ['#fff', '#ff3d8b', '#ffd36b'], power: 0.9 });
      this.fx.hearts(p.x, p.y, 16, { power: 0.6 });
    }, null, 7.65);
    tl.to([this.lblBR, this.lblFR, this.fact], { autoAlpha: 0, scale: 0.8, duration: 0.3 }, 7.9);
    tl.to(st, { mapScale: 4, mapAlpha: 0, duration: 0.7, ease: 'power3.in' }, 7.95);
    // flags collide
    tl.call(() => sfx.whoosh(0.5, { from: 200, to: 2000 }), null, 8.3);
    tl.set(st, { flagsAlpha: 1 }, 8.3);
    tl.to(st, { flags: 1, duration: 0.55, ease: 'power3.in' }, 8.3);
    tl.call(() => {
      sfx.impact(1.4);
      sfx.boom();
      stage.shake(1.3, 0.8);
      stage.flash('#fff', 0.5, 1);
      st.flagsAlpha = 0;
      this.fx.explode(W / 2, H * 0.5, { kind: 'heart', color: ['#ff2e4d', '#ffdf00', '#0055a4', '#009c3b', '#fff'], n: 220, power: 1.25, life: 1.6 });
      this.fx.hearts(W / 2, H * 0.5, 50, { power: 1.4, toCamera: true, g: 0, life: [0.8, 1.3] });
      this.fx.confetti(140, { x: W / 2, y: H / 2, from: 'point', colors: [...PALETTE.br, ...PALETTE.fr], power: 1.2 });
    }, null, 8.85);
    tl.to(st, { hybrid: 1, duration: 0.9, ease: 'elastic.out(1, 0.5)' }, 9.0);
    tl.fromTo(this.newflag, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(2)' }, 9.35);
    tl.call(() => sfx.chime(), null, 9.35);
    tl.to({}, { duration: 1.3 }, 9.6);
    return this.play(tl);
  }

  exit() {
    // old CRT switch-off: squash to a line, then a dot, then black
    const tl = this.timeline();
    tl.call(() => {
      audio.stopAll(0.05);
      sfx.zap();
    });
    tl.to(this.root, { scaleY: 0.006, filter: 'brightness(3)', duration: 0.18, ease: 'power3.in' });
    tl.to(this.root, { scaleX: 0, duration: 0.16, ease: 'power3.in' });
    tl.to({}, { duration: 0.35 });
    return this.play(tl);
  }
}
