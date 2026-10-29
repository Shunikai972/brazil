import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el, splitChars } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import * as I from '../audio/instruments.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { typewriter } from '../animations/text.js';
import { head } from '../animations/lula.js';

/* 09 — the fake ending. Silence. Wait. One more thing. */

export class FakeEnd extends Scene {
  static id = 'fakeend';

  async build() {
    const r = this.mount('s-fakeend');
    this.film = el('div.fe-film', {}, [el('i.s1'), el('i.s2'), el('i.s3')]);
    this.ever = el('p.fe-ever', { text: 'And they lived happily ever after...' });
    this.fim = el('div.fe-fim', { html: '<span>fim</span>' });
    this.wait = el('p.fe-wait', { text: 'WAIT.' });
    this.one = el('p.fe-one');
    this.btn = el('button.fe-btn', { type: 'button', 'aria-label': 'FESTA BRASILEIRA' }, [el('span.dome'), el('span.base'), el('span.lbl', { text: 'FESTA BRASILEIRA' })]);
    this.head = head('laugh', 'fe-head');
    r.append(this.film, this.ever, this.fim, this.wait, this.one, this.btn, this.head);
    gsap.set(this.head, { autoAlpha: 0 });
  }

  run() {
    const W = stage.w;
    const H = stage.h;
    const tl = this.timeline();
    const chars = splitChars(this.ever);
    tl.call(() => {
      if (audio.ready) {
        const t = audio.now + 0.05;
        I.pad(audio, t, [50, 57, 62, 66], 3.6, { gain: 0.03, type: 'triangle', cutoff: 1200, attack: 1.2, release: 2 });
        I.musicBox(audio, t + 0.3, 74, 0.08);
        I.musicBox(audio, t + 0.9, 78, 0.07);
        I.musicBox(audio, t + 1.5, 81, 0.07);
        I.musicBox(audio, t + 2.3, 86, 0.06);
      }
    }, null, 0.1);
    tl.fromTo(chars, { opacity: 0, filter: 'blur(5px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.045, ease: 'power2.out' }, 0.2);
    tl.fromTo(this.fim, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'expo.out' }, 1.9);
    // ...silence (the comedic pause)
    const waitAt = 5.6;
    tl.call(() => {
      sfx.scratch();
      sfx.boom();
      stage.shake(1, 0.4);
      this.root.classList.add('burn');
    }, null, waitAt);
    tl.set([this.ever, this.fim, this.film], { autoAlpha: 0 }, waitAt);
    tl.fromTo(this.wait, { autoAlpha: 0, scale: 2.2 }, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'power4.in' }, waitAt);
    tl.to(this.wait, { autoAlpha: 0, duration: 0.1 }, waitAt + 0.95);
    tl.set(this.one, { autoAlpha: 1 }, waitAt + 1.15);
    tl.add(typewriter(this.one, 'One more thing.', { cps: 14, sound: true }), waitAt + 1.15);

    // a small head appears from the bottom and stares at you
    const hh = stage.min * 0.34;
    this.head.style.height = hh + 'px';
    this.head.querySelector('img').style.cssText = 'height:100%;width:auto';
    gsap.set(this.head, { xPercent: -50, x: W * 0.32, y: H + 10 });
    const peekAt = waitAt + 2.6;
    tl.to(this.one, { autoAlpha: 0, duration: 0.3 }, peekAt - 0.2);
    tl.set(this.head, { autoAlpha: 1 }, peekAt);
    tl.call(() => sfx.slide(true), null, peekAt);
    tl.to(this.head, { y: H - hh * 0.62, duration: 1.0, ease: 'power2.out' }, peekAt);
    tl.to(this.head, { rotation: -12, duration: 0.25, ease: 'sine.inOut' }, peekAt + 1.1);
    tl.to(this.head, { rotation: 10, duration: 0.3, ease: 'sine.inOut' }, peekAt + 1.4);
    tl.to(this.head, { scaleY: 1.12, duration: 0.08, yoyo: true, repeat: 3, transformOrigin: '50% 100%' }, peekAt + 1.75);
    tl.call(() => sfx.boing(0, 1.4), null, peekAt + 1.75);
    // THE button
    tl.fromTo(this.btn, { autoAlpha: 0, y: H * 0.3, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, peekAt + 1.3);
    tl.call(() => {
      sfx.pop(0, 0.6);
      this.armed = true;
    }, null, peekAt + 1.4);
    const hitAt = peekAt + 2.6;
    tl.to(this.head, { rotation: 0, duration: 0.15 }, hitAt - 0.3);
    tl.to(this.head, { y: () => this.btn.getBoundingClientRect().top - hh * 0.75, x: () => this.btn.getBoundingClientRect().left + this.btn.offsetWidth / 2, duration: 0.35, ease: 'power2.in' }, hitAt);
    tl.call(() => this.press(), null, hitAt + 0.35);
    return new Promise((resolve) => {
      this.done = resolve;
      this.listen(this.btn, 'click', () => {
        if (!this.armed || this.pressed) return;
        tl.pause();
        this.press();
      });
    });
  }

  press() {
    if (this.pressed) return;
    this.pressed = true;
    this.btn.classList.add('down');
    sfx.click();
    sfx.stamp();
    stage.shake(0.6, 0.3);
    gsap.to(this.head, { y: '+=30', duration: 0.12, yoyo: true, repeat: 1 });
    gsap.delayedCall(0.45, () => this.done());
  }

  exit() {
    stage.cover('#fff', 0.08);
    return new Promise((r) => gsap.delayedCall(0.1, r));
  }
}
