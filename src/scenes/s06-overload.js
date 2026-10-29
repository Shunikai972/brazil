import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { quality } from '../core/quality.js';
import { shatter } from '../animations/transitions.js';
import { rand, pick, TAU, heartPoint, shuffle } from '../utils/math.js';

/* 06 — AmorOS 98 can't handle it: error cascade, a window trail that draws a heart,
   an achievement, a self-clicking button, the blue screen of love. */

const SPAM = [
  ['saudade.exe', 'saudade.exe não está respondendo.'],
  ['Antivírus', 'AMOR DETECTADO. Deseja colocar em quarentena?', ['NÃO', 'NÃO']],
  ['Erro', 'brigadeiro.dll não encontrado.'],
  ['Atualização', 'Atualizando francês para v2.0 (agora com feijoada)'],
  ['Bateria fraca', 'Restam 3% de juízo.'],
  ['Download', 'baixando sotaque_carioca.zip… 99%'],
  ['Aviso', 'Disco C: cheio de fotos dela.'],
  ['Tradutor', '“je t’aime” → “te amo” → “KKKKKKK”'],
  ['Erro fatal', 'Coração em modo turbo. Não desligue.'],
  ['UNO.exe', '+4 AMOR. Você compra 4 corações.'],
  ['Sistema', 'Memória insuficiente para tanto carinho.'],
  ['Netflix', 'Você ainda está apaixonado? [SIM] [SIM]'],
  ['Atenção', 'Um francês está digitando…'],
  ['Erro 418', 'Sou um croissant.'],
  ['Calendário', 'Lembrete: ela é linda (repetir diariamente)'],
  ['Erro', 'Não foi possível parar de sorrir.'],
];

export class Overload extends Scene {
  static id = 'overload';

  async build() {
    const r = this.mount('s-overload');
    this.desk = el('div.ov-desk', {}, [
      el('div.ov-icons', {
        html: ['❤️|Meu Coração', '🗑️|Lixeira<br>(sem ódio)', '🗂️|fotos_dela', '🥐|croissant.exe', '🇧🇷|Brasil.lnk']
          .map((s) => `<div class="ov-icon"><span>${s.split('|')[0]}</span><small>${s.split('|')[1]}</small></div>`)
          .join(''),
      }),
    ]);
    this.trail = el('canvas.ov-trail');
    this.wins = el('div.ov-wins');
    this.task = el('div.ov-task', { html: '<button class="ov-start"><b>❤</b> Iniciar</button><span class="ov-tasks"></span><span class="ov-tray">🔊 🇧🇷🇫🇷 23:59</span>' });
    this.cursor = el('div.ov-cursor', { html: '<svg viewBox="0 0 30 30"><path d="M15 27C9 21 2 17 2 9.5 2 5 5.5 2 9 2c2.6 0 4.6 1.4 6 3.4C16.4 3.4 18.4 2 21 2c3.5 0 7 3 7 7.5C28 17 21 21 15 27z" fill="#ff2e4d" stroke="#fff" stroke-width="2"/></svg>' });
    this.big = el('button.ov-big', { html: '<span>CONFIRM<br>INTERNATIONAL<br>ROMANCE</span>' });
    this.ach = el('div.ov-ach', { html: '<i>🏆</i><div><small>ACHIEVEMENT UNLOCKED</small><b>Brazilian Girlfriend</b><em>+1000G · 0,01% dos jogadores</em></div>' });
    const qr = Array.from({ length: 49 }, () => `<i${Math.random() < 0.5 ? ' class="on"' : ''}></i>`).join('');
    this.bsod = el('div.ov-bsod', {
      html: `<p class="face">:)</p><p class="msg">Seu coração encontrou um problema de <b>AMOR_OVERFLOW</b> e precisa ser reiniciado. Estamos só coletando umas informações sobre ela e, em seguida, vamos reiniciar.</p><p class="pct">100% concluído</p><div class="qr">${qr}</div><p class="code">Código de parada: CRITICAL_CUTENESS_LEVEL</p>`,
    });
    r.append(this.desk, this.trail, this.wins, this.big, this.ach, this.task, this.cursor, this.bsod);
    this.tctx = this.trail.getContext('2d');
    const dpr = Math.min(quality.cfg.dpr, 2);
    this.trail.width = stage.w * dpr;
    this.trail.height = stage.h * dpr;
    this.tctx.scale(dpr, dpr);
    this.z = 10;
  }

  win({ title, body, buttons = ['OK'], icon = '⚠️', cls = '', w } = {}) {
    const node = el('div.w98' + (cls ? '.' + cls : ''), {
      html: `<div class="w98-bar"><span>${title}</span><i>_</i><i>□</i><i class="x">×</i></div>
<div class="w98-body"><span class="w98-ico">${icon}</span><div class="w98-txt">${body}</div></div>
<div class="w98-btns">${buttons.map((b) => `<button>${b}</button>`).join('')}</div>`,
    });
    if (w) node.style.width = w;
    node.style.zIndex = ++this.z;
    this.wins.append(node);
    return node;
  }

  place(node, x, y) {
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    gsap.set(node, { x: Math.max(4, Math.min(stage.w - w - 4, x - w / 2)), y: Math.max(stage.u * 4, Math.min(stage.h - h - 46, y - h / 2)) });
  }

  pop(tl, node, at, sound = 'error') {
    tl.fromTo(node, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'back.out(3)' }, at);
    tl.call(() => (sound === 'error' ? sfx.errorChord() : sfx.beep(rand(500, 1400), 0.05, 0.035)), null, at);
  }

  /** mini window sprite for the trail */
  sprite() {
    const c = document.createElement('canvas');
    const w = Math.round(stage.min * 0.34);
    const h = Math.round(w * 0.55);
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = '#c0c0c0';
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff';
    x.fillRect(0, 0, w, 2);
    x.fillRect(0, 0, 2, h);
    x.fillStyle = '#404040';
    x.fillRect(w - 2, 0, 2, h);
    x.fillRect(0, h - 2, w, 2);
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#9e0b2c');
    g.addColorStop(1, '#ff5c7a');
    x.fillStyle = g;
    x.fillRect(3, 3, w - 6, h * 0.2);
    x.fillStyle = '#fff';
    x.font = `bold ${Math.round(h * 0.13)}px Tahoma, Verdana, sans-serif`;
    x.fillText('coracao.exe', 7, h * 0.16);
    x.fillStyle = '#000';
    x.font = `${Math.round(h * 0.15)}px Tahoma, Verdana, sans-serif`;
    x.fillText('❤ te amo ❤', w * 0.2, h * 0.58);
    x.fillStyle = '#c0c0c0';
    x.strokeStyle = '#404040';
    x.strokeRect(w * 0.38, h * 0.72, w * 0.24, h * 0.18);
    x.fillStyle = '#000';
    x.fillText('OK', w * 0.46, h * 0.86);
    return c;
  }

  run() {
    const W = stage.w;
    const H = stage.h;
    const u = stage.u;
    const portrait = stage.portrait;
    const tl = this.timeline();
    tl.call(() => {
      stage.uncover(0.35);
      audio.play('chip', { cut: true });
      sfx.chime();
    }, null, 0);
    tl.fromTo(this.desk, { filter: 'brightness(3) blur(4px)' }, { filter: 'brightness(1) blur(0px)', duration: 0.5 }, 0);

    const w1 = this.win({ title: 'AmorOS — Aviso', body: '<b class="big">WARNING:<br>GIRL TOO BEAUTIFUL</b><br>O sistema não foi projetado para tanta beleza.', buttons: ['OK', 'OK TAMBÉM'] });
    this.place(w1, W * 0.5, H * (portrait ? 0.22 : 0.28));
    this.pop(tl, w1, 0.45);
    const w2 = this.win({ title: 'francês.exe', icon: '🛑', body: '<b class="big">FRENCH BOY HAS<br>STOPPED WORKING</b><br>Procurando uma solução… <i>(solução: ela)</i>', buttons: ['Fechar o programa'] });
    this.place(w2, W * (portrait ? 0.5 : 0.36), H * (portrait ? 0.42 : 0.5));
    this.pop(tl, w2, 1.05);
    const w3 = this.win({ title: 'Reiniciando…', icon: '💗', body: '<b class="big">RESTARTING HEART.EXE</b><div class="w98-prog"><i></i></div><small class="eta">calculando…</small>', buttons: ['Cancelar'] });
    this.place(w3, W * (portrait ? 0.5 : 0.62), H * (portrait ? 0.62 : 0.64));
    this.pop(tl, w3, 1.65);
    const bar = w3.querySelector('.w98-prog i');
    const eta = w3.querySelector('.eta');
    tl.fromTo(bar, { width: '0%' }, { width: '99%', duration: 0.55, ease: 'power2.out' }, 1.85);
    tl.call(() => (eta.textContent = 'tempo restante: 2 segundos'), null, 1.9);
    tl.call(() => {
      eta.textContent = 'tempo restante: 47 anos';
      sfx.errorChord();
      stage.shake(0.3, 0.2);
    }, null, 2.6);
    tl.to(bar, { width: '12%', duration: 0.15, ease: 'power4.in' }, 2.6);
    tl.to(bar, { width: '100%', duration: 0.4, ease: 'power1.in' }, 3.05);
    tl.call(() => (eta.textContent = 'concluído ✓ (mais ou menos)'), null, 3.45);

    // heart cursor drifts around
    gsap.set(this.cursor, { x: W * 0.8, y: H * 0.8 });
    tl.fromTo(this.cursor, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 1.9);
    tl.to(this.cursor, { x: W * 0.3, y: H * 0.4, duration: 1.2, ease: 'sine.inOut' }, 2.0);

    // cascade of absurd windows
    const list = shuffle(SPAM).slice(0, quality.tier === 'low' ? 9 : quality.tier === 'mid' ? 12 : 16);
    list.forEach(([title, body, btns], i) => {
      const n = this.win({ title, body, buttons: btns || ['OK'], icon: pick(['⚠️', '❗', '💬', '❤️', '🥐', '🇧🇷']), cls: 'small' });
      this.place(n, rand(W * 0.15, W * 0.85), rand(H * 0.12, H * 0.82));
      this.pop(tl, n, 3.2 + i * 0.075, 'blip');
    });

    // window trail draws a heart
    const spr = this.sprite();
    const tr = { k: 0 };
    let last = -1;
    const R = Math.min(W, H) * 0.3;
    tl.to(tr, {
      k: 1,
      duration: 1.5,
      ease: 'none',
      onUpdate: () => {
        const steps = 90;
        const upto = Math.floor(tr.k * steps);
        for (let i = last + 1; i <= upto; i++) {
          const p = heartPoint((i / steps) * TAU);
          this.tctx.drawImage(spr, W / 2 + p.x * R - spr.width / 2, H * 0.47 + p.y * R - spr.height / 2);
        }
        if (upto > last && upto % 4 === 0) sfx.beep(300 + upto * 8, 0.02, 0.02);
        last = upto;
      },
    }, 4.1);
    tl.to(this.wins, { autoAlpha: 0.35, duration: 0.3 }, 4.1);

    // achievement toast
    tl.fromTo(this.ach, { yPercent: 180, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'back.out(1.6)' }, 5.55);
    tl.call(() => sfx.achievement(), null, 5.55);
    tl.to(this.ach, { yPercent: 180, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 7.0);

    // DLC install
    const dlc = this.win({ title: 'Steam do Amor', icon: '⬇️', body: '<b class="big">INSTALLING BRAZILIAN<br>WIFE DLC…</b><div class="w98-prog dlc"><i></i></div><small class="file">feijoada.pak</small>', buttons: ['Instalar mais rápido'], cls: 'dlc' });
    this.place(dlc, W * 0.5, H * (portrait ? 0.26 : 0.3));
    this.pop(tl, dlc, 6.0, 'blip');
    const files = ['feijoada.pak', 'saudade.dll', 'sotaque_carioca.wav', 'brigadeiro.tex', 'praia_de_domingo.map', 'funk_pancadão.ogg', 'paciencia_infinita.cfg'];
    const fileEl = dlc.querySelector('.file');
    files.forEach((f, i) => tl.call(() => (fileEl.textContent = f), null, 6.1 + i * 0.13));
    tl.fromTo(dlc.querySelector('.w98-prog i'), { width: '0%' }, { width: '100%', duration: 1.0, ease: 'none' }, 6.1);

    // the button that presses itself
    tl.fromTo(this.big, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, 7.0);
    tl.call(() => sfx.pop(0, 0.7), null, 7.0);
    tl.to(this.big, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 7.5);
    tl.to(this.cursor, { x: () => W / 2 + this.big.offsetWidth * 0.1, y: () => H * 0.62 + this.big.offsetHeight * 0.1, duration: 0.7, ease: 'power2.inOut' }, 7.4);
    tl.call(() => {
      this.big.classList.add('pressed');
      sfx.click();
      sfx.impact(0.5);
    }, null, 8.2);
    tl.to(this.cursor, { scale: 0.8, duration: 0.08, yoyo: true, repeat: 1 }, 8.2);

    // crash
    tl.call(() => {
      audio.stopAll(0.02);
      sfx.glitch(0.7, 0.09);
      this.root.classList.add('crash');
    }, null, 8.45);
    tl.to(this.wins.children, { x: () => `+=${rand(-30, 30)}`, y: () => `+=${rand(-20, 20)}`, duration: 0.05, repeat: 5, yoyo: true, ease: 'steps(1)' }, 8.45);
    tl.set(this.bsod, { autoAlpha: 1 }, 9.1);
    tl.call(() => {
      this.root.classList.remove('crash');
      sfx.tapeStop();
    }, null, 9.1);
    tl.fromTo(this.bsod.querySelector('.face'), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 }, 9.15);
    tl.to({}, { duration: 1.1 }, 9.2);
    return this.play(tl);
  }

  exit() {
    sfx.impact(1.4);
    stage.flash('#fff', 0.4, 0.6);
    return shatter(this.root, { x: stage.w * 0.5, y: stage.h * 0.45, power: 1.3, crack: true, fx: this.fx, glassColor: ['rgba(0,120,215,0.6)', 'rgba(255,255,255,0.5)', 'rgba(120,190,255,0.5)'] });
  }
}
