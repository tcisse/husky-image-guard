# husky-image-guard

> Un hook Husky pour verifier la taille des images avant un push Git. Empêchez les images trop lourdes d'être poussées dans votre repository.

## Fonctionnalites

- Verifie automatiquement la taille des images avant chaque push
- Bloque le push si une image depasse la limite configuree
- Supporte plusieurs formats : JPG, PNG, GIF, WebP, SVG, BMP, ICO
- Configuration flexible via fichier ou CLI
- Messages d'erreur clairs avec suggestions de solutions
- Compatible avec les projets ESM (Next.js, etc.)

## Installation

### npm
```bash
npm install husky-image-guard --save-dev
```

### pnpm
```bash
pnpm add husky-image-guard -D
```

### yarn
```bash
yarn add husky-image-guard -D
```

### bun
```bash
bun add husky-image-guard -D
```

Un fichier `image-guard.config.cjs` sera automatiquement cree a l'installation.

## Configuration rapide

### 1. Initialiser Husky (si pas deja fait)

| Gestionnaire | Commande |
|--------------|----------|
| npm | `npx husky init` |
| pnpm | `pnpm exec husky init` |
| yarn | `yarn husky init` |
| bun | `bunx husky init` |

### 2. Ajouter le hook pre-push

| Gestionnaire | Commande |
|--------------|----------|
| npm | `echo "npx image-guard" >> .husky/pre-push` |
| pnpm | `echo "pnpm exec image-guard" >> .husky/pre-push` |
| yarn | `echo "yarn image-guard" >> .husky/pre-push` |
| bun | `echo "bunx image-guard" >> .husky/pre-push` |

C'est tout !

## Configuration

### Fichier image-guard.config.cjs (recommande)

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

| Action | npm | pnpm | yarn | bun |
|--------|-----|------|------|-----|
| Verifier les images | `npx image-guard` | `pnpm exec image-guard` | `yarn image-guard` | `bunx image-guard` |
| Initialiser config | `npx image-guard init` | `pnpm exec image-guard init` | `yarn image-guard init` | `bunx image-guard init` |
| Init (non-interactif) | `npx image-guard init --yes` | `pnpm exec image-guard init --yes` | `yarn image-guard init --yes` | `bunx image-guard init --yes` |
| Aide | `npx image-guard --help` | `pnpm exec image-guard --help` | `yarn image-guard --help` | `bunx image-guard --help` |

### Exemples avec options

```bash
# Specifier une taille max temporaire
npx image-guard --max-size 500KB        # npm
pnpm exec image-guard --max-size 500KB  # pnpm
yarn image-guard --max-size 500KB       # yarn
bunx image-guard --max-size 500KB       # bun

# Specifier les dossiers temporairement
npx image-guard --dirs public,assets,images

# Combiner les options
npx image-guard --max-size 500KB --dirs src/images,public -e jpg,png,webp
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

| Option | Description |
|--------|-------------|
| `--yes` ou `-y` | Utiliser les valeurs par defaut (non-interactif) |
| `--force` ou `-f` | Remplacer le fichier de config existant |

## Utilisation programmatique

```typescript
import { checkImages } from 'husky-image-guard';

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
//   ],
//   maxSizeBytes: 512000
// }
```

## Exemple de sortie

```
Configuration chargee: image-guard.config.cjs

Verification de la taille des images...
   Limite: 1.00MB | Dossiers: public, assets | Extensions: jpg, jpeg, png

Verification du dossier: public
  [OK] public/logo.png (45.23KB)
  [OK] public/icon.svg (2.10KB)

Verification du dossier: assets
  [X] assets/hero-image.jpg (2.34MB)
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

| Gestionnaire | Commande |
|--------------|----------|
| npm | `echo "npx image-guard" >> .husky/pre-commit` |
| pnpm | `echo "pnpm exec image-guard" >> .husky/pre-commit` |
| yarn | `echo "yarn image-guard" >> .husky/pre-commit` |
| bun | `echo "bunx image-guard" >> .husky/pre-commit` |

## License

MIT
