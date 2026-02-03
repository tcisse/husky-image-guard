#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { ImageGuardConfig, InitOptions } from './types';

const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m'
};

const CONFIG_FILENAME = 'image-guard.config.cjs';

const defaultConfig: ImageGuardConfig = {
  maxSize: '1MB',
  directories: ['public', 'assets'],
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
};

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateConfigContent(config: ImageGuardConfig): string {
  return `/**
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
  maxSize: '${config.maxSize}',

  /**
   * Dossiers a analyser pour les images
   * Chemins relatifs a la racine du projet
   */
  directories: [
    ${config.directories.map(d => `'${d}'`).join(',\n    ')}
  ],

  /**
   * Extensions de fichiers a verifier
   * Sans le point (ex: 'jpg' et non '.jpg')
   */
  extensions: [
    ${config.extensions.map(e => `'${e}'`).join(',\n    ')}
  ]
};
`;
}

async function interactiveSetup(): Promise<ImageGuardConfig> {
  const rl = createReadlineInterface();

  console.log(`\n${colors.cyan}Configuration de husky-image-guard${colors.reset}\n`);
  console.log(`${colors.yellow}Repondez aux questions suivantes (appuyez sur Entree pour garder la valeur par defaut)${colors.reset}\n`);

  try {
    const maxSizeInput = await question(
      rl,
      `${colors.cyan}?${colors.reset} Taille maximale des images ${colors.yellow}(${defaultConfig.maxSize})${colors.reset}: `
    );
    const maxSize = maxSizeInput.trim() || defaultConfig.maxSize;

    const dirsInput = await question(
      rl,
      `${colors.cyan}?${colors.reset} Dossiers a verifier (separes par des virgules) ${colors.yellow}(${defaultConfig.directories.join(', ')})${colors.reset}: `
    );
    const directories = dirsInput.trim()
      ? dirsInput.split(',').map(d => d.trim())
      : defaultConfig.directories;

    const extsInput = await question(
      rl,
      `${colors.cyan}?${colors.reset} Extensions a verifier (separees par des virgules) ${colors.yellow}(${defaultConfig.extensions.join(', ')})${colors.reset}: `
    );
    const extensions = extsInput.trim()
      ? extsInput.split(',').map(e => e.trim().toLowerCase().replace('.', ''))
      : defaultConfig.extensions;

    rl.close();

    return { maxSize, directories, extensions };
  } catch (error) {
    rl.close();
    throw error;
  }
}

async function init(options: InitOptions = {}): Promise<boolean> {
  const configPath = path.resolve(process.cwd(), CONFIG_FILENAME);

  // Verifier si le fichier existe deja
  if (fs.existsSync(configPath) && !options.force) {
    console.log(`${colors.yellow}Le fichier ${CONFIG_FILENAME} existe deja.${colors.reset}`);
    console.log(`   Utilisez ${colors.cyan}--force${colors.reset} pour le remplacer.\n`);
    return false;
  }

  let config: ImageGuardConfig;

  // Mode interactif ou valeurs par defaut
  if (options.interactive !== false && process.stdin.isTTY) {
    config = await interactiveSetup();
  } else {
    config = defaultConfig;
  }

  // Generer le fichier de configuration
  const configContent = generateConfigContent(config);
  fs.writeFileSync(configPath, configContent, 'utf8');

  console.log(`\n${colors.green}Fichier ${CONFIG_FILENAME} cree avec succes !${colors.reset}\n`);
  console.log(`${colors.cyan}Configuration:${colors.reset}`);
  console.log(`   - Taille max: ${colors.yellow}${config.maxSize}${colors.reset}`);
  console.log(`   - Dossiers: ${colors.yellow}${config.directories.join(', ')}${colors.reset}`);
  console.log(`   - Extensions: ${colors.yellow}${config.extensions.join(', ')}${colors.reset}\n`);

  console.log(`${colors.cyan}Prochaines etapes:${colors.reset}`);
  console.log(`   1. Modifiez ${colors.yellow}${CONFIG_FILENAME}${colors.reset} selon vos besoins`);
  console.log(`   2. Ajoutez le hook Husky:`);
  console.log(`      ${colors.green}echo "npx image-guard" >> .husky/pre-push${colors.reset}\n`);

  return true;
}

// Parser les arguments
const args = process.argv.slice(2);
const options: InitOptions = {
  force: args.includes('--force') || args.includes('-f'),
  interactive: !args.includes('--yes') && !args.includes('-y')
};

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  ${colors.cyan}image-guard init${colors.reset} - Initialiser la configuration

  Usage:
    npx image-guard init [options]

  Options:
    -y, --yes      Utiliser les valeurs par defaut (non-interactif)
    -f, --force    Remplacer le fichier de config existant
    -h, --help     Afficher l'aide

  Exemples:
    npx image-guard init           # Mode interactif
    npx image-guard init --yes     # Valeurs par defaut
    npx image-guard init --force   # Remplacer la config existante
`);
  process.exit(0);
}

// Executer l'initialisation
init(options)
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error(`${colors.red}Erreur: ${error.message}${colors.reset}`);
    process.exit(1);
  });
