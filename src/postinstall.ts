#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

const colors = {
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m'
};

function findProjectRoot(): string {
  let currentDir = process.cwd();

  if (currentDir.includes('node_modules')) {
    const parts = currentDir.split('node_modules');
    currentDir = parts[0];
  }

  return currentDir;
}

const projectRoot = findProjectRoot();
const configPath = path.join(projectRoot, 'image-guard.config.cjs');

const isPackageDev = process.env.npm_lifecycle_event === 'prepare' ||
                     projectRoot.includes('husky-image-guard');

if (isPackageDev) {
  process.exit(0);
}

const configFiles = [
  'image-guard.config.cjs',
  'image-guard.config.js',
  'image-guard.config.json',
  '.imageguardrc',
  '.imageguardrc.json'
];

const hasExistingConfig = configFiles.some(file =>
  fs.existsSync(path.join(projectRoot, file))
);

let hasPackageJsonConfig = false;
const packageJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    hasPackageJsonConfig = !!packageJson.imageGuard;
  } catch (e) {
    // Ignorer les erreurs de parsing
  }
}

if (hasExistingConfig || hasPackageJsonConfig) {
  console.log(`\n${colors.cyan}husky-image-guard${colors.reset}`);
  console.log(`${colors.green}   Configuration existante detectee${colors.reset}\n`);
  process.exit(0);
}

const defaultConfigContent = `/**
 * Configuration pour husky-image-guard
 * Documentation: https://www.npmjs.com/package/husky-image-guard
 *
 * Ce fichier utilise l'extension .cjs pour compatibilite avec les projets ESM
 * (Next.js, projets avec "type": "module" dans package.json)
 */

module.exports = {
  /**
   * Taille maximale autorisee pour les images
   * Formats supportes: '500KB', '1MB', '2MB', ou en bytes (1048576)
   */
  maxSize: '1MB',

  /**
   * Dossiers a analyser pour les images
   * Chemins relatifs a la racine du projet
   */
  directories: [
    'public',
    'assets',
    // Ajoutez vos dossiers ici
    // 'src/images',
    // 'static',
  ],

  /**
   * Extensions de fichiers a verifier
   * Sans le point (ex: 'jpg' et non '.jpg')
   */
  extensions: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'bmp',
    'ico'
  ]
};
`;

try {
  fs.writeFileSync(configPath, defaultConfigContent, 'utf8');

  console.log(`
${colors.cyan}----------------------------------------------------${colors.reset}
${colors.green}  husky-image-guard installe avec succes !${colors.reset}
${colors.cyan}----------------------------------------------------${colors.reset}

  ${colors.yellow}Fichier cree:${colors.reset} image-guard.config.cjs

  ${colors.cyan}Prochaines etapes:${colors.reset}

  1. ${colors.yellow}Configurez vos dossiers${colors.reset} dans image-guard.config.cjs:
     - Modifiez ${colors.green}directories${colors.reset} avec vos chemins d'images
     - Ajustez ${colors.green}maxSize${colors.reset} selon vos besoins
     - Personnalisez ${colors.green}extensions${colors.reset} si necessaire

  2. ${colors.yellow}Ajoutez le hook Husky${colors.reset}:
     ${colors.green}echo "npx image-guard" >> .husky/pre-push${colors.reset}

  3. ${colors.yellow}Testez la configuration${colors.reset}:
     ${colors.green}npx image-guard${colors.reset}

${colors.cyan}----------------------------------------------------${colors.reset}
`);
} catch (error) {
  console.log(`\n${colors.cyan}husky-image-guard${colors.reset}`);
  console.log(`${colors.yellow}   Lancez 'npx image-guard init' pour creer la configuration${colors.reset}\n`);
}
