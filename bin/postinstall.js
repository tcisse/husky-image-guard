#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m'
};

// Trouver le répertoire racine du projet (là où se trouve le package.json de l'utilisateur)
function findProjectRoot() {
  // Remonter jusqu'à trouver un package.json qui n'est pas celui du package
  let currentDir = process.cwd();

  // Si on est dans node_modules, remonter
  if (currentDir.includes('node_modules')) {
    const parts = currentDir.split('node_modules');
    currentDir = parts[0];
  }

  return currentDir;
}

const projectRoot = findProjectRoot();
const configPath = path.join(projectRoot, 'image-guard.config.js');

// Ne pas créer le fichier si on est dans le développement du package lui-même
const isPackageDev = process.env.npm_lifecycle_event === 'prepare' ||
                     projectRoot.includes('husky-image-guard');

if (isPackageDev) {
  process.exit(0);
}

// Vérifier si un fichier de config existe déjà
const configFiles = [
  'image-guard.config.js',
  'image-guard.config.json',
  '.imageguardrc',
  '.imageguardrc.json'
];

const hasExistingConfig = configFiles.some(file =>
  fs.existsSync(path.join(projectRoot, file))
);

// Vérifier si imageGuard est dans package.json
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
  console.log(`\n${colors.cyan}🖼️  husky-image-guard${colors.reset}`);
  console.log(`${colors.green}   Configuration existante détectée ✓${colors.reset}\n`);
  process.exit(0);
}

// Créer le fichier de configuration par défaut
const defaultConfigContent = `/**
 * Configuration pour husky-image-guard
 * Documentation: https://github.com/your-username/husky-image-guard
 */

module.exports = {
  /**
   * Taille maximale autorisée pour les images
   * Formats supportés: '500KB', '1MB', '2MB', ou en bytes (1048576)
   */
  maxSize: '1MB',

  /**
   * Dossiers à analyser pour les images
   * Chemins relatifs à la racine du projet
   */
  directories: [
    'public',
    'assets',
    // Ajoutez vos dossiers ici
    // 'src/images',
    // 'static',
  ],

  /**
   * Extensions de fichiers à vérifier
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
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.green}  🖼️  husky-image-guard installé avec succès !${colors.reset}
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

  ${colors.yellow}Fichier créé:${colors.reset} image-guard.config.js

  ${colors.cyan}📋 Prochaines étapes:${colors.reset}

  1. ${colors.yellow}Configurez vos dossiers${colors.reset} dans image-guard.config.js:
     - Modifiez ${colors.green}directories${colors.reset} avec vos chemins d'images
     - Ajustez ${colors.green}maxSize${colors.reset} selon vos besoins
     - Personnalisez ${colors.green}extensions${colors.reset} si nécessaire

  2. ${colors.yellow}Ajoutez le hook Husky${colors.reset}:
     ${colors.green}echo "npx image-guard" >> .husky/pre-push${colors.reset}

  3. ${colors.yellow}Testez la configuration${colors.reset}:
     ${colors.green}npx image-guard${colors.reset}

${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`);
} catch (error) {
  // Silencieux en cas d'erreur (permissions, etc.)
  console.log(`\n${colors.cyan}🖼️  husky-image-guard${colors.reset}`);
  console.log(`${colors.yellow}   Lancez 'npx image-guard init' pour créer la configuration${colors.reset}\n`);
}
