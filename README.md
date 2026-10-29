# 🇧🇷❤️🇫🇷 Brasil ama França — *Romantic Chaos / Brazilian Meme Cinema*

Un mini-film interactif plein écran (~2 minutes après le « YES ») : une demande romantique
adorable qui dégénère en plantão de TV, Lula en roue libre, scanner de compatibilité qui
explose, finale de Coupe du monde, crash d'AmorOS 98, mariage au coucher du soleil, lune de
miel en montage cartoon, fausse fin… et un festival de feux d'artifice.

Tout est animé (GSAP + Canvas 2D + Three.js pour les alliances), et **toute la musique et les
bruitages sont synthétisés en direct** (Web Audio) : 0 fichier audio, 0 problème de licence.

---

## Lancer en local

```bash
npm install
npm run dev          # http://localhost:5173 (aussi accessible depuis le téléphone sur le même Wi-Fi)
```

Build de production (dossier `dist/`, 100 % statique) :

```bash
npm run build
npm run preview
```

## Où mettre vos deux photos

Voir **[assets/couple/README.md](assets/couple/README.md)**. En bref : remplacez
`assets/couple/me.webp` (vous) et `assets/couple/her.webp` (elle), puis ajustez le point de
cadrage du visage dans [`src/config.js`](src/config.js). Si une photo manque, un portrait
placeholder est dessiné automatiquement.

## Déployer (pour lui envoyer un lien)

**GitHub Pages (déjà configuré)** — le workflow `.github/workflows/deploy.yml` construit et
publie le site à chaque push sur `main`. Une seule fois :
*GitHub → repo → Settings → Pages → Build and deployment → Source : **GitHub Actions***.
Le lien sera : `https://<utilisateur>.github.io/<repo>/` (ici `https://shunikai972.github.io/brazil/`).

> ⚠️ Le dépôt est public : vos photos (et le site) sont visibles par toute personne qui a le
> lien ou qui parcourt le repo.

**Netlify (glisser-déposer)** — `npm run build`, puis déposer le dossier `dist/` sur
<https://app.netlify.com/drop>. Fonctionne aussi tel quel sur Vercel, Cloudflare Pages, etc.
(chemins relatifs, aucune configuration serveur).

## Le storyboard

| # | Scène | Ce qui se passe |
|---|-------|-----------------|
| 0 | `intro` | Une lettre scellée « Paris → Brasil ». Le toucher débloque le son. |
| 1 | `question` | *Do you love me?* — le bouton NO glisse, se téléporte, rétrécit, se transforme en **barata voadora**, part en fumée… puis meurt (pierre tombale incluse). YES → silence → onde de choc, écran fissuré. |
| 2 | `breaking` | PLANTÃO TV CORAÇÃO, sirènes, bandeau URGENTE, carte du monde en points, laser rose Rio → Paris, la France *a vraiment* une frontière avec le Brésil, collision des drapeaux → drapeau « AMOR E CROISSANT ». |
| 3 | `lula` | Générique de novela « participação especialíssima », Lula traverse l'écran en tournant, *freeze frame* « você deve estar se perguntando… », visage géant, rebond façon logo DVD (CORNER HIT), armée de mini-Lula qui danse en rythme, lunettes *deal with it*, document officiel tamponné **CASAMENTO APROVADO**, coup de poing dans l'écran. |
| 4 | `scanner` | LOVE-SCAN v9.9 : FRENCH GUY / BRAZILIAN GIRL DETECTED, concurrents éliminés, 0 → 27 → 86 → 100 → 999 % → ∞ %, ERROR: TOO MUCH LOVE, surchauffe, Lula-météorite. |
| 5 | `stadium` | Finale de la Coupe du monde de l'amour, Lula arbitre en parachute, carton rouge « NÃO », ballon → cœur, GOOOOL, score ❤ × ❤, la foule s'envole, les projecteurs dessinent un cœur, la caméra le traverse. |
| 6 | `overload` | AmorOS 98 : WARNING: GIRL TOO BEAUTIFUL, cascade d'erreurs, traînée de fenêtres en forme de cœur, *Achievement unlocked*, INSTALLING BRAZILIAN WIFE DLC, bouton qui se clique tout seul, écran bleu de l'amour qui vole en éclats. |
| 7 | `wedding` | Coucher de soleil (tour Eiffel + Pão de Açúcar à l'horizon), arche de fleurs procédurale, cadres dorés, marche nuptiale, **alliances 3D** qui s'enlacent… Lula surgit du sol, beaucoup trop grand : « EU VOS DECLARO… » (grillons) zoom dramatique « …CASADOS KKKKKKK ». Colombes, travelling circulaire, Lula décolle en fusée — *Lula saiu*. |
| 8 | `honeymoon` | Paris avec bandeirinhas, Rio et son croissant volant, le boss final « A DISTÂNCIA » (Lula accroché à l'avion), passeport tamponné, valise qui explose, la Terre devient un cœur. |
| 9 | `fakeend` | *And they lived happily ever after…* — silence — **WAIT.** — *One more thing.* — une tête de Lula, un gros bouton rouge. |
| 10 | `finale` | FESTA BRASILEIRA : batucada + apito + airhorn, feux d'artifice synchronisés sur le tempo, lasers, Planeta Lula, mini-Lula en orbite, Lula lanceurs de cœurs, cœur de feu d'artifice autour des photos, détonation blanche, plan final. |
| 11 | `credits` | Générique, puis l'écran sérieux : « Tá, mas falando sério… Você é muito especial ❤️ », et **REPLAY THE CHAOS 🔁**. |

## Options utiles (paramètres d'URL)

- `?scene=wedding` — démarre directement à une scène (id du tableau ci-dessus). Ajouter `&auto` pour sauter l'écran « toque para começar ».
- `?quality=low|mid|high` — force le niveau d'effets (sinon détection auto + baisse automatique si le FPS chute).
- `?reduced` — mode mouvement réduit (aussi activable avec le bouton 〰 en haut à droite, et automatique si l'appareil le demande). Le bouton 🔊 coupe le son.

## Architecture

```
index.html
src/
  main.js              boot : polices, préchargement, contrôles, Director
  config.js            ← vos photos + cadrage (le seul fichier à personnaliser)
  core/                stage (viewport, safe-areas, shake, flash), scene (cycle de vie),
                       director (enchaînement + transitions), assets (préchargement), quality
  scenes/              une classe par scène : build() → run() → exit(next) → destroy()
  animations/          typographie animée, Lula (stickers, échos, squash & stretch), transitions
                       (verre brisé en vrai DOM, fissures SVG, iris en cœur, wipes)
  effects/             particules canvas (pool, feux d'artifice, confettis, cœurs…), drapeaux
                       ondulants, carte/globe en points, arche de fleurs, alliances Three.js
  audio/               moteur Web Audio, instruments (boîte à musique, cordes, cuíca, surdo,
                       apito…), bruitages, pistes séquencées (une par scène)
  styles/              base + une feuille par scène
  data/world.json      carte du monde en points (généré par `npm run map`)
assets/
  lula/  couple/  flags/  sfx/  music/
scripts/
  fetch-lula.py        télécharge les photos de Lula (Wikimedia Commons) + licences
  prepare-images.py    détourage (rembg), contour sticker, recadrages, optimisation WebP
  build-map.mjs        génère src/data/world.json (Natural Earth)
```

Chaque scène construit une timeline GSAP maîtresse (pas de `setTimeout` en cascade) ; la
musique est séquencée à la double-croche par le moteur audio et les moments forts (feux
d'artifice, danse de l'armée de Lula, textes de la finale) sont placés en temps de beat.

## Crédits & licences

Voir **[ATTRIBUTIONS.md](ATTRIBUTIONS.md)** (également consultable dans le site : écran final →
« créditos & licenças »).
