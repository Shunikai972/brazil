# Vos deux photos 📸

Les fichiers utilisés par le site :

| Fichier | Qui |
|---------|-----|
| `assets/couple/me.webp`  | vous (le Français) |
| `assets/couple/her.webp` | elle (la Brésilienne) |

Ils apparaissent dans : le scanner de compatibilité, les cadres dorés du mariage, le passeport,
les cadres géants de la finale et les polaroids de la fin.

## Remplacer une photo

**Option simple** — copiez votre image ici (jpg, png ou webp) puis indiquez son nom dans
[`src/config.js`](../../src/config.js) :

```js
me:  { src: 'assets/couple/me.jpg',  focus: [0.58, 0.43], zoom: 1.55 },
her: { src: 'assets/couple/her.png', focus: [0.41, 0.31], zoom: 1.6 },
```

**Option optimisée** — déposez les originaux nommés `me.*` et `her.*` dans le dossier `photos/`
à la racine, puis :

```bash
python scripts/prepare-images.py --only-couple
```

(Le script les redimensionne et les convertit en WebP légers dans ce dossier.)

## Le cadrage

Les cadres sont ronds/ovales : `focus` indique le point de la photo à centrer (x, y entre 0 et 1,
mesurés depuis le coin haut-gauche — en général le milieu du visage) et `zoom` règle le
resserrement (1 = toute la photo, 2 = très serré).

Pas de photo ? Le site affiche un portrait placeholder dessiné, et tout fonctionne quand même.
