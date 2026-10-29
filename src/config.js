/**
 * ─────────────────────────────  PERSONALISATION  ─────────────────────────────
 *
 * Your two photos. Replace the files in assets/couple/ (any of .webp .jpg .jpeg .png works,
 * just update `src` below) — or run `python scripts/prepare-images.py --only-couple` after
 * dropping originals named me.* / her.* into photos/.
 *
 * focus = the point of the photo (x, y between 0 and 1) that frames should centre on —
 *         usually the middle of the face. zoom = how tight the round/oval crops are.
 * If a photo is missing, a pretty placeholder portrait is drawn instead.
 */
export const COUPLE = {
  me: {
    src: 'assets/couple/me.webp',
    focus: [0.58, 0.43],
    zoom: 1.55,
    label: 'O FRANCÊS',
  },
  her: {
    src: 'assets/couple/her.webp',
    focus: [0.41, 0.31],
    zoom: 1.6,
    label: 'A BRASILEIRA',
  },
};

/** Small texts you may want to tweak. */
export const TEXT = {
  question: 'Do you love me?',
  title: 'uma pergunta importante ❤️',
};
