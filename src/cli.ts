#!/usr/bin/env node

import { checkImages, loadConfig } from './index';
import { CliOptions } from './types';

const args = process.argv.slice(2);

// Verifier si c'est la commande init
if (args[0] === 'init') {
  require('./init');
  process.exit(0);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--max-size' || arg === '-s') {
      options.maxSize = args[++i];
    }

    if (arg === '--dirs' || arg === '-d') {
      options.directories = args[++i].split(',').map(d => d.trim());
    }

    if (arg === '--extensions' || arg === '-e') {
      options.extensions = args[++i].split(',').map(e => e.trim());
    }

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }

    if (arg === '--version' || arg === '-v') {
      const pkg = require('../package.json');
      console.log(pkg.version);
      process.exit(0);
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
  image-guard - Verificateur de taille d'images pour Git hooks

  Usage:
    image-guard [command] [options]

  Commandes:
    init                     Initialiser le fichier de configuration
    (aucune)                 Verifier les images

  Options:
    -s, --max-size <size>    Taille maximale (ex: 1MB, 500KB, 1048576)
    -d, --dirs <dirs>        Dossiers a verifier, separes par des virgules
    -e, --extensions <exts>  Extensions a verifier, separees par des virgules
    -h, --help               Afficher l'aide
    -v, --version            Afficher la version

  Exemples:
    image-guard init                    # Creer le fichier de config
    image-guard                         # Verifier avec la config
    image-guard --max-size 500KB        # Override la taille max
    image-guard --dirs public,assets    # Override les dossiers
    image-guard -s 2MB -d src/images -e jpg,png,webp

  Configuration:
    Lancez 'image-guard init' pour creer le fichier de configuration
    ou creez manuellement un fichier image-guard.config.cjs

  Fichiers de config supportes:
    - image-guard.config.cjs (recommande pour Next.js/ESM)
    - image-guard.config.js
    - image-guard.config.json
    - .imageguardrc.json
    - package.json (cle "imageGuard")
`);
}

// Charger la configuration
const fileConfig = loadConfig();
const cliConfig = parseArgs(args);

// Fusionner les configurations (CLI > fichier > defaut)
const config = { ...fileConfig, ...cliConfig };

// Executer la verification
const result = checkImages(config);

// Quitter avec le bon code
process.exit(result.success ? 0 : 1);
