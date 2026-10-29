import { gsap } from 'gsap';
import { Scene } from '../core/scene.js';
import { el } from '../utils/dom.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { stage } from '../core/stage.js';
import { head } from '../animations/lula.js';
import { portrait, layoutPortraits } from '../core/assets.js';

/* 11 — after the chaos: credits, then the only serious screen of the whole film. */

const ROLL = [
  ['uma produção', 'de um francês apaixonado'],
  ['direção, roteiro e efeitos especiais', 'ele mesmo (sem dormir)'],
  ['estrela principal', 'você ❤'],
  ['participação especialíssima', 'Lula (sem autorização) 🙏'],
  ['ministério do amor', 'totalmente fictício'],
  ['trilha sonora', 'sintetizada à mão, nota por nota'],
  ['nenhum botão NÃO foi ferido durante as filmagens', '…mentira, foi sim 💔'],
  ['agradecimentos', 'ao croissant, ao brigadeiro e à Guiana Francesa'],
];

export class Credits extends Scene {
  static id = 'credits';

  async build() {
    const r = this.mount('s-credits');
    this.roll = el('div.cr-roll', {
      html: ROLL.map(([a, b]) => `<p><small>${a}</small><b>${b}</b></p>`).join('') + '<p class="cr-end">FIM <em>(de verdade agora)</em></p>',
    });
    this.final = el('div.cr-final', {}, [
      el('div.cr-pics', {}, [
        el('div.cr-polaroid.l', {}, [portrait('me', { cls: 'cr-photo', zoom: 1.3 }), el('span', { text: 'ele' })]),
        el('div.cr-heart', { html: '<svg viewBox="-55 -52 110 104"><path d="M0,-20 C0,-50 -50,-50 -50,-18 C-50,12 -8,26 0,50 C8,26 50,12 50,-18 C50,-50 0,-50 0,-20Z"/></svg>' }),
        el('div.cr-polaroid.r', {}, [portrait('her', { cls: 'cr-photo', zoom: 1.35 }), el('span', { text: 'ela' })]),
      ]),
      el('p.cr-l1', { text: 'Tá, mas falando sério...' }),
      el('p.cr-l2', { text: 'Você é muito especial ❤️' }),
      el('p.cr-l3', { text: 'Essa foi provavelmente a declaração de amor mais brasileira que você já recebeu de um francês KKKKK' }),
      (this.replay = el('button.cr-replay', { type: 'button', text: 'REPLAY THE CHAOS 🔁' })),
      (this.licBtn = el('button.cr-licbtn', { type: 'button', text: 'créditos & licenças' })),
    ]);
    this.tiny = head('jersey-thumbs', 'cr-tiny');
    this.lic = el('div.cr-lic', { role: 'dialog', 'aria-label': 'Créditos e licenças' });
    r.append(el('div.cr-stars'), this.roll, this.final, this.tiny, this.lic);
    gsap.set(this.tiny, { y: stage.h + 400 });
    requestAnimationFrame(() => layoutPortraits(r));
    this.fillLicenses();
  }

  async fillLicenses() {
    let rows = '';
    try {
      const res = await fetch('assets/lula/credits.json');
      const data = await res.json();
      rows = Object.values(data)
        .map((d) => `<li><a href="${d.page}" target="_blank" rel="noopener">${decodeURIComponent(d.page.split('File:')[1] || 'Wikimedia Commons').replace(/_/g, ' ')}</a> — ${d.artist} — ${d.license}</li>`)
        .join('');
    } catch (_) {}
    this.lic.innerHTML = `<div class="cr-lic-box"><h2>Créditos & licenças</h2>
<p>Fotos do presidente Lula: Wikimedia Commons, recortadas (fundo removido, contorno branco). Uso paródico e afetuoso — nenhuma afiliação ou declaração real.</p><ul>${rows}</ul>
<p>Bandeira do Brasil: domínio público (Wikimedia Commons). Mapa-múndi: Natural Earth (domínio público) via world-atlas.</p>
<p>Fontes: Instrument Serif, Anton, Lilita One, VT323, Press Start 2P, Great Vibes — SIL Open Font License.</p>
<p>Música e efeitos: sintetizados em tempo real (Web Audio). Marcha nupcial “Bridal Chorus” — R. Wagner, 1850, domínio público.</p>
<button type="button" class="cr-close">fechar</button></div>`;
    this.lic.querySelector('.cr-close').addEventListener('click', () => this.lic.classList.remove('open'));
  }

  run() {
    const H = stage.h;
    const tl = this.timeline();
    tl.call(() => audio.play('credits', { fadeIn: 2 }), null, 0.2);
    tl.fromTo(this.root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0);
    const rh = () => this.roll.offsetHeight;
    tl.fromTo(this.roll, { y: H }, { y: () => -rh() - 20, duration: 9, ease: 'none' }, 0.3);
    tl.fromTo(this.final, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 9.0);
    const pics = this.final.querySelectorAll('.cr-polaroid');
    tl.fromTo(pics[0], { x: -stage.w * 0.6, rotation: -30 }, { x: 0, rotation: -7, duration: 1.1, ease: 'expo.out' }, 9.1);
    tl.fromTo(pics[1], { x: stage.w * 0.6, rotation: 30 }, { x: 0, rotation: 6, duration: 1.1, ease: 'expo.out' }, 9.2);
    tl.fromTo(this.final.querySelector('.cr-heart'), { scale: 0 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)' }, 9.9);
    tl.call(() => sfx.sparkle(0, 5), null, 9.9);
    tl.fromTo(this.final.querySelector('.cr-l1'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out' }, 10.6);
    tl.fromTo(this.final.querySelector('.cr-l2'), { autoAlpha: 0, y: 14, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out' }, 12.0);
    tl.fromTo(this.final.querySelector('.cr-l3'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 14.2);
    tl.fromTo([this.replay, this.licBtn], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'back.out(2)' }, 15.6);
    // one last tiny Lula waves from the corner
    const th = stage.min * 0.16;
    this.tiny.style.height = th + 'px';
    this.tiny.querySelector('img').style.cssText = 'height:100%;width:auto';
    gsap.set(this.tiny, { x: stage.w - th * 0.95, y: H + 4, rotation: -20 });
    tl.to(this.tiny, { y: H - th * 0.7, duration: 0.6, ease: 'back.out(2)' }, 17.0);
    tl.call(() => sfx.pop(0, 1.5), null, 17.1);
    tl.to(this.tiny, { rotation: 0, duration: 0.18, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 17.6);
    tl.to(this.tiny, { y: H + 4, duration: 0.4, ease: 'power2.in' }, 18.9);

    this.listen(this.licBtn, 'click', () => this.lic.classList.add('open'));
    return new Promise(() => {
      this.listen(this.replay, 'click', () => {
        sfx.pop();
        audio.stop('credits', 0.3);
        stage.cover('#000', 0.3);
        gsap.delayedCall(0.35, () => {
          stage.uncover(0.6, 0.2);
          this.app.director.restart('question');
        });
      });
    });
  }
}
