#!/usr/bin/env node

const { checkImages, loadConfig } = require('../src/index.js');

// Parser les arguments de la ligne de commande
const args = process.argv.slice(2);

// Vérifier si c'est la commande init
if (args[0] === 'init') {
  require('./init.js');
  return;
}

function parseArgs(args) {
  const options = {};

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

function showHelp() {
  console.log(`
  🖼️  image-guard - Vérificateur de taille d'images pour Git hooks

  Usage:
    image-guard [command] [options]

  Commandes:
    init                     Initialiser le fichier de configuration
    (aucune)                 Vérifier les images

  Options:
    -s, --max-size <size>    Taille maximale (ex: 1MB, 500KB, 1048576)
    -d, --dirs <dirs>        Dossiers à vérifier, séparés par des virgules
    -e, --extensions <exts>  Extensions à vérifier, séparées par des virgules
    -h, --help               Afficher l'aide
    -v, --version            Afficher la version

  Exemples:
    image-guard init                    # Créer le fichier de config
    image-guard                         # Vérifier avec la config
    image-guard --max-size 500KB        # Override la taille max
    image-guard --dirs public,assets    # Override les dossiers
    image-guard -s 2MB -d src/images -e jpg,png,webp

  Configuration:
    Lancez 'image-guard init' pour créer le fichier de configuration
    ou créez manuellement un fichier image-guard.config.js

  Fichiers de config supportés:
    - image-guard.config.js (recommandé)
    - image-guard.config.json
    - .imageguardrc.json
    - package.json (clé "imageGuard")
`);
}

// Charger la configuration
const fileConfig = loadConfig();
const cliConfig = parseArgs(args);

// Fusionner les configurations (CLI > fichier > défaut)
const config = { ...fileConfig, ...cliConfig };

// Exécuter la vérification
const result = checkImages(config);

// Quitter avec le bon code
process.exit(result.success ? 0 : 1);
