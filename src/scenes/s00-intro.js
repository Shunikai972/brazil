import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';

/* 00 — a sealed letter. The tap that opens it also unlocks audio for the whole film. */
export class Intro extends Scene {
  static id = 'intro';

  async build() {
    const r = this.mount('s-intro');
    this.notif = el('p.intro-notif', { html: '<span class="dot"></span> 1 nova mensagem · <b>Paris → Brasil</b>' });
    this.env = el('div.envelope', {}, [
      el('div.env-back'),
      (this.letter = el('div.letter', {}, [el('p.letter-txt', { html: 'tenho uma<br><em>pergunta</em><br>pra você' })])),
      el('div.env-front', {}, [
        el('p.env-to', { html: 'Para: <span>a brasileira mais linda</span>' }),
        el('div.env-stamp', {}, [el('span', { text: '❤' }), el('small', { text: 'CORREIO DO AMOR' })]),
        el('div.env-postmark', { text: 'PARIS · 2026' }),
      ]),
      (this.flap = el('div.env-flap')),
      (this.seal = el('div.seal', {}, [el('span', { text: 'FR♥BR' })])),
    ]);
    this.wrap = el('div.env-wrap', {}, [this.env]);
    this.cta = el('p.intro-cta', { text: 'toque para abrir' });
    this.hint = el('p.intro-hint', { text: '🔊 com som, por favor' });
    r.append(el('div.intro-glow'), this.notif, this.wrap, this.cta, this.hint);
  }

  run() {
    const tl = this.timeline();
    tl.from(this.notif, { y: -40, opacity: 0, duration: 0.8, ease: 'expo.out' }, 0.1);
    tl.from(this.env, { y: stage.h * 0.4, rotation: 18, opacity: 0, duration: 1.4, ease: 'expo.out' }, 0.2);
    tl.from([this.cta, this.hint], { opacity: 0, y: 12, duration: 0.8, stagger: 0.15 }, 1.0);
    this.float = gsap.to(this.env, { y: '-=10', rotation: 1.5, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.6 });
    this._tls.push(this.float);
    this.pulse = gsap.to(this.cta, { opacity: 0.35, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });
    this._tls.push(this.pulse);
    return new Promise((resolve) => {
      const go = (e) => {
        if (e.target.closest && e.target.closest('#ui')) return;
        this.root.removeEventListener('pointerdown', go);
        audio.unlock();
        resolve();
      };
      this.listen(this.root, 'pointerdown', go);
      this.listen(window, 'keydown', (e) => (e.key === 'Enter' || e.key === ' ') && go(e));
    });
  }

  exit(next) {
    audio.play('romantic', { fadeIn: 2.5 });
    sfx.pop(0, 0.8);
    this.float.kill();
    this.pulse.kill();
    const tl = this.timeline();
    const rect = this.seal.getBoundingClientRect();
    tl.to([this.cta, this.hint, this.notif], { opacity: 0, duration: 0.3 }, 0);
    tl.to(this.seal, { scale: 1.25, duration: 0.12, ease: 'power2.out' }, 0);
    tl.call(() => {
      sfx.stamp();
      this.fx.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, { color: ['#c3122f', '#ff4060', '#7a0a1e'], power: 0.6, g: 900 });
    }, null, 0.12);
    tl.to(this.seal, { scale: 0.2, opacity: 0, rotation: 90, duration: 0.3, ease: 'power3.in' }, 0.12);
    tl.to(this.flap, { rotationX: 180, transformPerspective: 900, duration: 0.7, ease: 'power2.inOut' }, 0.25);
    tl.set(this.flap, { zIndex: 0 }, 0.6);
    tl.call(() => sfx.sparkle(0, 7), null, 0.55);
    tl.to(this.letter, { yPercent: -62, duration: 0.8, ease: 'power3.out' }, 0.75);
    tl.to(this.env, { y: stage.h * 0.08, duration: 0.8, ease: 'power3.out' }, 0.75);
    // the letter flies into the camera and the night behind it is the next scene
    tl.set(this.letter, { zIndex: 9 }, 1.5);
    tl.to(this.letter, { scale: 9, yPercent: -40, opacity: 0, duration: 0.9, ease: 'power3.in' }, 1.5);
    tl.to(this.env, { scale: 0.6, y: stage.h * 0.6, opacity: 0, duration: 0.8, ease: 'power3.in' }, 1.5);
    tl.to(this.root, { opacity: 0, duration: 0.5 }, 1.95);
    return this.play(tl);
  }
}
