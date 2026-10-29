import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { typewriter, slam } from '../animations/text.js';
import { head } from '../animations/lula.js';
import { slashWipe } from '../animations/transitions.js';
import { portrait, layoutPortraits } from '../core/assets.js';
import { rand, pick, TAU } from '../utils/math.js';

/* 04 — LOVE-SCAN v9.9: a very scientific compatibility analysis that ends in a meltdown. */

const GAUGE = `<svg viewBox="-110 -110 220 220" aria-hidden="true">
<circle class="g-ticks" r="100"/><circle class="g-track" r="84"/><circle class="g-arc" r="84"/>
<circle class="g-dash" r="70"/><circle class="g-dash2" r="58"/></svg>`;

const RIVAL = `<svg viewBox="0 0 40 60" aria-hidden="true"><circle cx="20" cy="14" r="10"/><path d="M2 58c0-16 8-26 18-26s18 10 18 26z"/><text x="20" y="19" text-anchor="middle">?</text></svg>`;

export class Scanner extends Scene {
  static id = 'scanner';

  async build() {
    const r = this.mount('s-scanner');
    const slot = (who, cls, title) => {
      const s = el(`div.sc-slot.${cls}`, {}, [
        el('div.sc-frame', {}, [
          portrait(who, { cls: 'sc-photo', zoom: 1.35 }),
          el('div.sc-mesh'),
          el('div.sc-reticle', { html: '<i></i><b></b>' }),
          el('div.sc-laser'),
          el('span.sc-corner.tl'),
          el('span.sc-corner.tr'),
          el('span.sc-corner.bl'),
          el('span.sc-corner.br'),
        ]),
        el('p.sc-id', { text: title }),
        el('p.sc-det'),
        el('ul.sc-tags'),
      ]);
      return s;
    };
    this.a = slot('me', 'a', 'SUJEITO A · FR');
    this.b = slot('her', 'b', 'SUJEITO B · BR');
    this.pct = el('p.sc-pct', { text: '0%' });
    this.pctLabel = el('p.sc-pct-label', { text: 'COMPATIBILIDADE' });
    this.gauge = el('div.sc-gauge', { html: GAUGE }, [this.pct, this.pctLabel]);
    this.log = el('div.sc-log');
    this.osc = el('canvas.sc-osc');
    this.rivals = el('div.sc-rivals', {}, [el('p', { text: 'CONCORRÊNCIA' }), el('div.sc-rival-row', { html: RIVAL.repeat(4) })]);
    this.error = el('div.sc-error', { html: '<b>ERROR</b><span>TOO MUCH LOVE</span><small>coração.exe superaqueceu · 🔥 9.999 °C</small>' });
    this.crt = el('div.sc-crt', {}, [
      el('div.sc-grid'),
      el('header.sc-top', { html: '<span class="rec"></span>LOVE-SCAN™ v9.9 <em>· laboratório franco-brasileiro de ciências do coração</em>' }),
      el('div.sc-main', {}, [this.a, this.gauge, this.b]),
      this.rivals,
      this.log,
      this.osc,
      this.error,
      el('div.sc-scan'),
    ]);
    this.heat = el('div.sc-heat');
    r.append(this.crt, this.heat);
    this.level = 0.2;
    this.chaos = 0;
    this.t = 0;
    this.octx = this.osc.getContext('2d');
    this.tick((dt) => this.drawOsc(dt));
    requestAnimationFrame(() => layoutPortraits(r));
    this.onResize(() => layoutPortraits(r));
  }

  drawOsc(dt) {
    this.t += dt;
    const c = this.osc;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (!w) return;
    const dpr = Math.min(quality.cfg.dpr, 2);
    if (c.width !== Math.round(w * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = this.octx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const lines = [
      ['#39ff88', 1, 0],
      ['#ff4fa3', 1.7, 1.3],
    ];
    for (const [col, f, ph] of lines) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const u = x / w;
        let y = Math.sin(u * TAU * 3 * f + this.t * 6 + ph) * this.level + Math.sin(u * TAU * 11 + this.t * 13) * 0.08 * this.level;
        if (this.chaos) y += (Math.random() - 0.5) * this.chaos;
        const py = h / 2 + y * h * 0.4;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = col;
      ctx.shadowBlur = 8;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  logLine(tl, at, text, cls = '') {
    const p = el('p' + (cls ? '.' + cls : ''));
    tl.call(() => {
      this.log.append(p);
      while (this.log.children.length > 4) this.log.firstChild.remove();
    }, null, at);
    tl.add(typewriter(p, '> ' + text, { cps: 60, sound: false }), at);
  }

  scan(tl, at, slot, title, tags, color) {
    const laser = slot.querySelector('.sc-laser');
    const ret = slot.querySelector('.sc-reticle');
    const photo = slot.querySelector('.sc-photo');
    tl.fromTo(laser, { top: '0%', autoAlpha: 1 }, { top: '100%', duration: 0.85, ease: 'sine.inOut', yoyo: true, repeat: 1 }, at);
    tl.set(laser, { autoAlpha: 0 }, at + 1.7);
    for (let i = 0; i < 6; i++) tl.call(() => sfx.beep(900 + i * 120, 0.04, 0.03), null, at + i * 0.25);
    tl.fromTo(ret, { scale: 2.2, rotation: -90, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }, at + 0.6);
    tl.call(() => {
      ret.classList.add('lock');
      photo.classList.add('on');
      sfx.beep(1760, 0.18, 0.05);
    }, null, at + 1.6);
    const det = slot.querySelector('.sc-det');
    det.style.color = color;
    tl.add(typewriter(det, title, { cps: 40 }), at + 1.65);
    tl.fromTo(det, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, at + 1.65);
    const ul = slot.querySelector('.sc-tags');
    tags.forEach((txt, i) => {
      const li = el('li');
      ul.append(li);
      tl.add(typewriter(li, txt, { cps: 55, sound: false }), at + 2.0 + i * 0.28);
      tl.call(() => sfx.beep(600 + i * 200, 0.03, 0.025), null, at + 2.0 + i * 0.28);
    });
  }

  count(tl, at, from, to, dur, fmt = (v) => Math.round(v) + '%') {
    const o = { v: from };
    tl.to(o, {
      v: to,
      duration: dur,
      ease: 'power2.out',
      onUpdate: () => {
        this.pct.textContent = fmt(o.v);
        const arc = this.gauge.querySelector('.g-arc');
        arc.style.strokeDashoffset = 528 * (1 - Math.min(o.v, 100) / 100);
      },
    }, at);
  }

  run() {
    const tl = this.timeline();
    const W = stage.w;
    const H = stage.h;
    tl.call(() => {
      audio.play('scanner', { cut: true, params: { glitch: 0 } });
      sfx.zap();
    }, null, 0);
    tl.fromTo(this.crt, { scaleY: 0.01, scaleX: 0.6, filter: 'brightness(4)' }, { scaleY: 1, scaleX: 1, filter: 'brightness(1)', duration: 0.45, ease: 'expo.out' }, 0);
    this.logLine(tl, 0.35, 'iniciando LOVE-SCAN v9.9…');
    tl.fromTo(this.a, { xPercent: -140, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }, 0.5);
    tl.fromTo(this.b, { xPercent: 140, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }, 0.6);
    tl.fromTo(this.gauge, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'back.out(2)' }, 0.75);
    this.logLine(tl, 0.9, 'analisando sujeito A…');
    this.scan(tl, 0.95, this.a, 'FRENCH GUY DETECTED', ['NERD FRANCÊS DETECTADO', 'croissants por dia: 3', 'sotaque: fofo ✓'], '#7fc4ff');
    this.logLine(tl, 2.2, 'analisando sujeito B…');
    this.scan(tl, 2.25, this.b, 'BRAZILIAN GIRL DETECTED', ['beleza: ERRO (valor alto demais)', 'nível de KKKKK: crítico', 'brigadeiro: 100%'], '#ffe066');
    tl.to(this, { level: 0.5, duration: 1 }, 2.5);
    // rivals
    this.logLine(tl, 4.35, 'eliminando a concorrência…');
    tl.fromTo(this.rivals, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 4.4);
    const rv = this.rivals.querySelectorAll('svg');
    rv.forEach((s, i) => {
      tl.call(() => {
        s.classList.add('x');
        sfx.zap();
      }, null, 4.65 + i * 0.16);
    });
    tl.call(() => {
      this.rivals.classList.add('done');
      sfx.stamp();
    }, null, 5.35);
    tl.to(this.rivals, { autoAlpha: 0, duration: 0.25 }, 6.0);
    // compatibility
    this.logLine(tl, 5.55, 'CALCULATING LOVE COMPATIBILITY…', 'hot');
    tl.call(() => this.gauge.classList.add('active'), null, 5.6);
    this.count(tl, 5.7, 0, 27, 0.6);
    tl.call(() => (this.pctLabel.textContent = 'hmm…'), null, 6.3);
    this.count(tl, 6.65, 27, 86, 0.5);
    tl.call(() => (this.pctLabel.textContent = 'oooh 👀'), null, 7.15);
    tl.to(this, { level: 0.8, duration: 0.5 }, 6.65);
    this.count(tl, 7.45, 86, 100, 0.4);
    tl.call(() => {
      this.pctLabel.textContent = 'MATCH PERFEITO';
      this.gauge.classList.add('full');
      sfx.ding();
      this.fx.stars(W / 2, this.gauge.getBoundingClientRect().top + this.gauge.offsetHeight / 2, 14, { color: '#9dffc4' });
    }, null, 7.85);
    // ... and then it breaks
    const glitchStep = (at, text, bpm, g) => {
      tl.call(() => {
        this.pct.textContent = text;
        this.gauge.classList.add('broken');
        sfx.glitch(0.25);
        stage.shake(0.4 + g * 0.6, 0.3);
        const tr = audio.track('scanner');
        if (tr) {
          tr.bpm = bpm;
          tr.params.glitch = g;
        }
        this.chaos = g * 0.9;
      }, null, at);
      tl.fromTo(this.pct, { scale: 1.6, skewX: -20 }, { scale: 1, skewX: 0, duration: 0.25, ease: 'back.out(3)' }, at);
    };
    glitchStep(8.35, '999%', 150, 0.3);
    tl.call(() => (this.pctLabel.textContent = 'peraí'), null, 8.4);
    glitchStep(8.8, '999999%', 170, 0.6);
    glitchStep(9.2, '∞%', 200, 1);
    tl.call(() => (this.pctLabel.textContent = 'SOCORRO'), null, 9.25);
    tl.call(() => {
      sfx.alarm(5);
      this.root.classList.add('overheat');
      this.fx.text('9', W * 0.5, H * 0.45, { size: 60, color: '#ff4f6d', vx: -300, vy: -400, g: 900, life: 1.2, font: 'VT323' });
    }, null, 9.55);
    tl.add(slam(this.error, { from: 2.6, rot: -5, sound: 'impact', shake: 1 }), 9.6);
    tl.fromTo(this.heat, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 9.6);
    tl.call(() => {
      const g = this.gauge.getBoundingClientRect();
      const cx = g.left + g.width / 2;
      const cy = g.top + g.height / 2;
      for (let i = 0; i < 14; i++) this.fx.text(pick(['9', '∞', '%', '9', '❤']), cx, cy, { size: rand(30, 70), color: pick(['#39ff88', '#ff4fa3', '#ffe066']), vx: rand(-700, 700), vy: rand(-900, -200), g: 1400, life: 1.5, font: 'VT323', rot: rand(-1, 1), vr: rand(-8, 8) });
      this.fx.smoke(cx, cy, 16, { size: 120, power: 1.5 });
      sfx.poof();
    }, null, 10.0);
    // Lula meteor
    const met = head('official-face', 'sc-meteor');
    met.style.height = stage.min * 0.28 + 'px';
    met.querySelector('img').style.height = '100%';
    met.querySelector('img').style.width = 'auto';
    this.crt.append(met);
    gsap.set(met, { xPercent: -50, yPercent: -50, x: W * 1.15, y: -H * 0.2, rotation: -40, visibility: 'hidden' });
    tl.set(met, { visibility: 'visible' }, 10.45);
    tl.call(() => {
      sfx.whoosh(0.6, { gain: 0.35, from: 2000, to: 200, panFrom: 0.9, panTo: 0 });
      this.trail = this.tick(() => {
        const x = gsap.getProperty(met, 'x');
        const y = gsap.getProperty(met, 'y');
        this.fx.sparks(x, y, 6, { color: ['#ffd36b', '#ff7b2b', '#ff3d3d', '#fff'], power: 0.25, g: -200, life: [0.3, 0.7], size: 3.5 });
        if (Math.random() < 0.5) this.fx.smoke(x, y, 1, { size: 70 });
      });
    }, null, 10.45);
    const g = () => this.gauge.getBoundingClientRect();
    tl.to(met, { x: () => g().left + g().width / 2, y: () => g().top + g().height / 2, rotation: 200, duration: 0.55, ease: 'power2.in' }, 10.45);
    tl.call(() => {
      if (this.trail) this.trail();
      const b = g();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      sfx.impact(1.8);
      sfx.boom();
      stage.shake(1.6, 0.9);
      stage.flash('#fff', 0.5, 1);
      this.fx.ring(cx, cy, { r1: stage.max, width: 40, color: '#ffb347', life: 0.8 });
      this.fx.sparks(cx, cy, 120, { color: ['#fff', '#ffd36b', '#ff7b2b', '#ff3d6a'], power: 2 });
      this.fx.hearts(cx, cy, 40, { power: 1.6 });
      met.style.visibility = 'hidden';
    }, null, 11.0);
    tl.to({}, { duration: 0.35 }, 11.0);
    return this.play(tl);
  }

  exit() {
    audio.stopAll(0.2);
    sfx.whoosh(0.6, { from: 300, to: 2400 });
    // the wipe outlives this scene (it lives in #transition): resolve once the screen is covered
    const tl = slashWipe({ color: '#ffdf00', color2: '#009c3b', duration: 0.8, onCovered: () => (this.root.style.visibility = 'hidden') });
    return new Promise((res) => tl.call(res, null, 'covered'));
  }
}
