# husky-image-guard

[![npm version](https://img.shields.io/npm/v/husky-image-guard.svg)](https://www.npmjs.com/package/husky-image-guard)
[![GitHub](https://img.shields.io/github/license/tcisse/husky-image-guard)](https://github.com/tcisse/husky-image-guard)

> A Husky hook to check image sizes before a Git push. Prevent oversized images from being pushed to your repository.

GitHub: https://github.com/tcisse/husky-image-guard

## Features

- Automatically checks image sizes before each push
- Blocks push if an image exceeds the configured limit
- Supports multiple formats: JPG, PNG, GIF, WebP, SVG, BMP, ICO
- Flexible configuration via file or CLI
- Clear error messages with solution suggestions
- Compatible with ESM projects (Next.js, etc.)

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

An `image-guard.config.cjs` file will be automatically created on installation.

## Quick Setup

### 1. Initialize Husky (if not already done)

| Package Manager | Command |
|-----------------|---------|
| npm | `npx husky init` |
| pnpm | `pnpm exec husky init` |
| yarn | `yarn husky init` |
| bun | `bunx husky init` |

### 2. Add the pre-push hook

| Package Manager | Command |
|-----------------|---------|
| npm | `echo "npx image-guard" >> .husky/pre-push` |
| pnpm | `echo "pnpm exec image-guard" >> .husky/pre-push` |
| yarn | `echo "yarn image-guard" >> .husky/pre-push` |
| bun | `echo "bunx image-guard" >> .husky/pre-push` |

That's it!

## Configuration

### image-guard.config.cjs file (recommended)

```javascript
module.exports = {
  // Maximum allowed size (formats: '500KB', '1MB', '2MB', or in bytes)
  maxSize: '1MB',

  // Directories to check (paths relative to project root)
  directories: [
    'public',
    'assets',
    'src/images'
  ],

  // File extensions to check (without the dot)
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

## CLI Usage

| Action | npm | pnpm | yarn | bun |
|--------|-----|------|------|-----|
| Check images | `npx image-guard` | `pnpm exec image-guard` | `yarn image-guard` | `bunx image-guard` |
| Initialize config | `npx image-guard init` | `pnpm exec image-guard init` | `yarn image-guard init` | `bunx image-guard init` |
| Init (non-interactive) | `npx image-guard init --yes` | `pnpm exec image-guard init --yes` | `yarn image-guard init --yes` | `bunx image-guard init --yes` |
| Help | `npx image-guard --help` | `pnpm exec image-guard --help` | `yarn image-guard --help` | `bunx image-guard --help` |

### Examples with options

```bash
# Specify temporary max size
npx image-guard --max-size 500KB        # npm
pnpm exec image-guard --max-size 500KB  # pnpm
yarn image-guard --max-size 500KB       # yarn
bunx image-guard --max-size 500KB       # bun

# Specify directories temporarily
npx image-guard --dirs public,assets,images

# Combine options
npx image-guard --max-size 500KB --dirs src/images,public -e jpg,png,webp
```

## CLI Options

| Option | Alias | Description | Example |
|--------|-------|-------------|---------|
| `--max-size` | `-s` | Maximum allowed size | `500KB`, `1MB`, `1048576` |
| `--dirs` | `-d` | Directories to check | `public,assets,images` |
| `--extensions` | `-e` | Extensions to check | `jpg,png,webp` |
| `--help` | `-h` | Show help | |
| `--version` | `-v` | Show version | |

## init Command

| Option | Description |
|--------|-------------|
| `--yes` or `-y` | Use default values (non-interactive) |
| `--force` or `-f` | Replace existing config file |

## Programmatic Usage

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

## Example Output

```
Configuration loaded from: image-guard.config.cjs

Checking image sizes...
   Limit: 1.00MB | Directories: public, assets | Extensions: jpg, jpeg, png

Checking directory: public
  [OK] public/logo.png (45.23KB)
  [OK] public/icon.svg (2.10KB)

Checking directory: assets
  [X] assets/hero-image.jpg (2.34MB)
  [OK] assets/thumbnail.webp (89.00KB)

----------------------------------------
PUSH BLOCKED

The following images exceed the 1MB limit:
  - assets/hero-image.jpg (2.34MB)

Possible solutions:
  1. Compress images with TinyPNG, ImageOptim
  2. Reduce image dimensions
  3. Convert to WebP format for better compression
  4. Use: npx @squoosh/cli --webp auto <image>
```

## Integration with other hooks

### With lint-staged

```json
{
  "lint-staged": {
    "*.{jpg,jpeg,png,gif,webp}": "image-guard"
  }
}
```

### pre-commit hook (instead of pre-push)

| Package Manager | Command |
|-----------------|---------|
| npm | `echo "npx image-guard" >> .husky/pre-commit` |
| pnpm | `echo "pnpm exec image-guard" >> .husky/pre-commit` |
| yarn | `echo "yarn image-guard" >> .husky/pre-commit` |
| bun | `echo "bunx image-guard" >> .husky/pre-commit` |

## License

MIT
