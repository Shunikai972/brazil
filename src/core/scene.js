import { gsap } from 'gsap';
import { el } from '../utils/dom.js';
import { stage } from './stage.js';

/**
 * Base class of every scene. Lifecycle (driven by the Director):
 *   build()  -> mounts DOM underneath the current scene, prepares state
 *   prev.exit(this) -> previous scene transitions out (it can see/animate the new one)
 *   run()    -> plays the scene; resolves when the scene is over
 *   destroy()-> kills timelines, tickers, listeners and removes DOM
 */
export class Scene {
  constructor(app) {
    this.app = app;
    this.fx = app.fx;
    this._tls = [];
    this._off = [];
    this.dead = false;
  }

  mount(className) {
    this.root = el(`section.scene.${className}`);
    stage.layer.prepend(this.root);
    return this.root;
  }

  /** GSAP timeline registered for cleanup */
  timeline(vars = {}) {
    const tl = gsap.timeline(vars);
    this._tls.push(tl);
    return tl;
  }

  /** plays a timeline and resolves when it completes */
  play(tl) {
    return new Promise((resolve) => {
      tl.eventCallback('onComplete', resolve);
      if (tl.paused()) tl.play();
    });
  }

  /** per-frame callback (dt in seconds) removed on destroy */
  tick(fn) {
    const f = (time, dtMs) => fn(Math.min(dtMs, 60) / 1000, time);
    gsap.ticker.add(f);
    this._off.push(() => gsap.ticker.remove(f));
    return () => gsap.ticker.remove(f);
  }

  listen(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this._off.push(() => target.removeEventListener(type, fn, opts));
  }

  onResize(fn) {
    this._off.push(stage.onResize(fn));
  }

  /** delay helper bound to GSAP's clock (pauses with the global timeline) */
  wait(seconds) {
    return new Promise((resolve) => {
      const c = gsap.delayedCall(seconds, resolve);
      this._tls.push(c);
    });
  }

  async build() {}
  async run() {}
  async exit() {}

  destroy() {
    this.dead = true;
    this._tls.forEach((t) => t.kill());
    this._off.forEach((f) => f());
    this._tls.length = 0;
    this._off.length = 0;
    if (this.root) {
      gsap.killTweensOf(this.root.querySelectorAll('*'));
      this.root.remove();
    }
  }
}
