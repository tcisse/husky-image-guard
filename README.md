# husky-image-guard

> Un hook Husky pour verifier la taille des images avant un push Git. Empêchez les images trop lourdes d'être poussées dans votre repository.

## Fonctionnalites

- Verifie automatiquement la taille des images avant chaque push
- Bloque le push si une image depasse la limite configuree
- Supporte plusieurs formats : JPG, PNG, GIF, WebP, SVG, BMP, ICO
- Configuration flexible via fichier ou CLI
- Messages d'erreur clairs avec suggestions de solutions

## Installation

```bash
npm install husky-image-guard --save-dev
```

Un fichier `image-guard.config.js` sera automatiquement cree a l'installation.

## Configuration rapide

### 1. Initialiser Husky (si pas deja fait)

```bash
npx husky init
```

### 2. Ajouter le hook pre-push

```bash
echo "npx image-guard" >> .husky/pre-push
```

C'est tout !

## Configuration

### Fichier image-guard.config.js (recommande)

```javascript
module.exports = {
  // Taille maximale autorisee (formats: '500KB', '1MB', '2MB', ou en bytes)
  maxSize: '1MB',

  // Dossiers a verifier (chemins relatifs a la racine du projet)
  directories: [
    'public',
    'assets',
    'src/images'
  ],

  // Extensions de fichiers a verifier (sans le point)
  extensions: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg'
  ]
};
```

### Via package.json

```json
{
  "imageGuard": {
    "maxSize": "500KB",
    "directories": ["public", "assets"],
    "extensions": ["jpg", "jpeg", "png", "gif", "webp"]
  }
}
```

### Via .imageguardrc.json

```json
{
  "maxSize": "1MB",
  "directories": ["public", "assets"],
  "extensions": ["jpg", "jpeg", "png", "gif", "webp", "svg"]
}
```

## Utilisation CLI

```bash
# Verifier les images avec la configuration
npx image-guard

# Initialiser/recreer le fichier de configuration
npx image-guard init

# Initialiser avec les valeurs par defaut (non-interactif)
npx image-guard init --yes

# Specifier une taille max temporaire
npx image-guard --max-size 500KB
npx image-guard --max-size 2MB

# Specifier les dossiers temporairement
npx image-guard --dirs public,assets,images

# Combiner les options
npx image-guard --max-size 500KB --dirs src/images,public

# Aide
npx image-guard --help
```

## Options CLI

| Option | Alias | Description | Exemple |
|--------|-------|-------------|---------|
| `--max-size` | `-s` | Taille maximale autorisee | `500KB`, `1MB`, `1048576` |
| `--dirs` | `-d` | Dossiers a verifier | `public,assets,images` |
| `--extensions` | `-e` | Extensions a verifier | `jpg,png,webp` |
| `--help` | `-h` | Afficher l'aide | |
| `--version` | `-v` | Afficher la version | |

## Commande init

```bash
# Mode interactif (pose des questions)
npx image-guard init

# Mode non-interactif (valeurs par defaut)
npx image-guard init --yes

# Remplacer un fichier existant
npx image-guard init --force
```

## Utilisation programmatique

```javascript
const { checkImages } = require('husky-image-guard');

const result = checkImages({
  maxSize: '500KB',
  directories: ['public', 'assets'],
  extensions: ['jpg', 'png', 'webp']
});

console.log(result);
// {
//   success: false,
//   totalChecked: 10,
//   oversizedFiles: [
//     { path: 'public/hero.jpg', size: 1548576, sizeHuman: '1.48MB' }
//   ]
// }
```

## Exemple de sortie

```
Configuration chargee: image-guard.config.js

Verification de la taille des images...
   Limite: 1.00MB | Dossiers: public, assets | Extensions: jpg, jpeg, png

Verification du dossier: public
  [OK] public/logo.png (45.23KB)
  [OK] public/icon.svg (2.10KB)

Verification du dossier: assets
  [ERREUR] assets/hero-image.jpg (2.34MB)
  [OK] assets/thumbnail.webp (89.00KB)

----------------------------------------
PUSH BLOQUE

Les images suivantes depassent la limite de 1MB:
  - assets/hero-image.jpg (2.34MB)

Solutions possibles:
  1. Compresser les images avec TinyPNG, ImageOptim
  2. Reduire les dimensions des images
  3. Convertir en format WebP pour une meilleure compression
  4. Utiliser: npx @squoosh/cli --webp auto <image>
```

## Integration avec d'autres hooks

### Avec lint-staged

```json
{
  "lint-staged": {
    "*.{jpg,jpeg,png,gif,webp}": "image-guard"
  }
}
```

### Hook pre-commit (au lieu de pre-push)

```bash
echo "npx image-guard" >> .husky/pre-commit
```

## License

MIT
