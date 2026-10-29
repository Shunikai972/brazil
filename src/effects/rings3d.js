import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  TorusGeometry,
  OctahedronGeometry,
  MeshStandardMaterial,
  Mesh,
  Group,
  PMREMGenerator,
  DirectionalLight,
  ACESFilmicToneMapping,
  SRGBColorSpace,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Two real 3D gold wedding rings (PBR metal + environment reflections) rendered in a
 * transparent canvas. state.spread: 1 = apart & spinning freely, 0 = interlocked.
 * state.x / state.y: centre in viewport fractions; state.size: ring radius in px.
 */
export function createRings(canvas, { dpr = 1.5 } = {}) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', premultipliedAlpha: true });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  const sun = new DirectionalLight(0xffd7a0, 2.2);
  sun.position.set(2, 3, 4);
  scene.add(sun);

  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const gold = new MeshStandardMaterial({ color: 0xffc55c, metalness: 1, roughness: 0.16, envMapIntensity: 1.35 });
  const roseGold = new MeshStandardMaterial({ color: 0xffb08a, metalness: 1, roughness: 0.2, envMapIntensity: 1.35 });
  const geo = new TorusGeometry(1, 0.17, 48, 128);
  const ringA = new Mesh(geo, gold);
  const ringB = new Mesh(geo, roseGold);
  const gem = new Mesh(new OctahedronGeometry(0.26, 0), new MeshStandardMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0, envMapIntensity: 4, flatShading: true }));
  gem.position.set(0, 1.22, 0);
  gem.scale.set(1, 1.25, 1);
  ringA.add(gem);
  const group = new Group();
  group.add(ringA, ringB);
  scene.add(group);

  const state = { x: 0.5, y: 0.35, size: 60, spread: 1, spin: 0, turn: 0, alpha: 1 };
  let w = 1;
  let h = 1;

  function resize(width, height) {
    w = width;
    h = height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function render() {
    if (state.alpha <= 0) {
      canvas.style.opacity = 0;
      return;
    }
    canvas.style.opacity = state.alpha;
    const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const pxToWorld = visH / h;
    const s = state.size * pxToWorld;
    group.scale.setScalar(s);
    group.position.set((state.x - 0.5) * w * pxToWorld, -(state.y - 0.5) * h * pxToWorld, 0);
    const sp = state.spread;
    ringA.position.set(-0.5 - sp * 2.4, sp * 0.6, 0);
    ringB.position.set(0.5 + sp * 2.4, -sp * 0.6, 0);
    ringA.rotation.set(0.25 * sp + state.spin * 0.7 * sp, state.spin * sp, 0);
    ringB.rotation.set(Math.PI / 2 + state.spin * 0.9 * sp, state.spin * 1.2 * sp, 0.3 * sp);
    group.rotation.set(0.25, state.turn, 0);
    gem.rotation.y = state.spin * 2;
    renderer.render(scene, camera);
  }

  function dispose() {
    geo.dispose();
    gold.dispose();
    roseGold.dispose();
    gem.geometry.dispose();
    gem.material.dispose();
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  return { state, resize, render, dispose, three: true };
}

/** 2D fallback (no WebGL): two gilded ellipses turning in pseudo-3D */
export function createRings2D(canvas, { dpr = 1.5 } = {}) {
  const ctx = canvas.getContext('2d');
  const state = { x: 0.5, y: 0.35, size: 60, spread: 1, spin: 0, turn: 0, alpha: 1 };
  let w = 1;
  let h = 1;
  const ring = (cx, cy, r, ang, col) => {
    const k = Math.abs(Math.cos(ang));
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, '#fff1c1');
    g.addColorStop(0.4, col);
    g.addColorStop(0.7, '#8a5a12');
    g.addColorStop(1, '#ffe08a');
    ctx.strokeStyle = g;
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(2, r * k), r, 0, 0, Math.PI * 2);
    ctx.stroke();
  };
  return {
    state,
    three: false,
    resize(width, height) {
      w = width;
      h = height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    },
    render() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (state.alpha <= 0) return;
      ctx.globalAlpha = state.alpha;
      const cx = state.x * w;
      const cy = state.y * h;
      const r = state.size;
      const off = r * (0.5 + state.spread * 2.4);
      ring(cx - off, cy, r, state.spin * state.spread + state.turn, '#ffc55c');
      ring(cx + off, cy, r, state.spin * 1.2 * state.spread + state.turn + Math.PI / 2, '#ffb08a');
    },
    dispose() {},
  };
}
