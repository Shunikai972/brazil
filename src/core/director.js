import { gsap } from 'gsap';
import { audio } from '../audio/engine.js';
import { flagify } from '../utils/dom.js';

/**
 * Runs the scenes in order. Each transition is owned by the outgoing scene (exit), which
 * receives the already-mounted incoming scene so it can shatter / wipe / zoom into it.
 */
export class Director {
  constructor(app, scenes) {
    this.app = app;
    this.scenes = scenes;
    this.current = null;
    this.run = 0;
  }

  indexOf(id) {
    return this.scenes.findIndex((S) => S.id === id);
  }

  async start(from = 0) {
    const runId = ++this.run;
    let prev = this.current;
    for (let i = from; i < this.scenes.length; i++) {
      if (runId !== this.run) return;
      const scene = new this.scenes[i](this.app);
      document.documentElement.dataset.scene = this.scenes[i].id;
      await scene.build();
      flagify(scene.root);
      if (runId !== this.run) return scene.destroy();
      if (prev) {
        await prev.exit(scene);
        prev.destroy();
      }
      this.current = scene;
      await scene.run();
      prev = scene;
    }
  }

  /** hard restart from a given scene (used by "replay") */
  async restart(id) {
    this.run++;
    audio.stopAll(0.2);
    this.app.fx.clear();
    gsap.globalTimeline.timeScale(1);
    if (this.current) {
      this.current.destroy();
      this.current = null;
    }
    await this.start(Math.max(0, this.indexOf(id)));
  }
}
