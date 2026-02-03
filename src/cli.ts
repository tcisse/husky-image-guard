#!/usr/bin/env node

import { checkImages, loadConfig } from './index';
import { CliOptions } from './types';

const args = process.argv.slice(2);

// Check if it's the init command
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
  image-guard - Image size checker for Git hooks

  Usage:
    image-guard [command] [options]

  Commands:
    init                     Initialize configuration file
    (none)                   Check images

  Options:
    -s, --max-size <size>    Maximum size (e.g., 1MB, 500KB, 1048576)
    -d, --dirs <dirs>        Directories to check, comma-separated
    -e, --extensions <exts>  Extensions to check, comma-separated
    -h, --help               Show help
    -v, --version            Show version

  Examples:
    image-guard init                    # Create config file
    image-guard                         # Check with config
    image-guard --max-size 500KB        # Override max size
    image-guard --dirs public,assets    # Override directories
    image-guard -s 2MB -d src/images -e jpg,png,webp

  Configuration:
    Run 'image-guard init' to create the configuration file
    or manually create an image-guard.config.cjs file

  Supported config files:
    - image-guard.config.cjs (recommended for Next.js/ESM)
    - image-guard.config.js
    - image-guard.config.json
    - .imageguardrc.json
    - package.json ("imageGuard" key)
`);
}

// Load configuration
const fileConfig = loadConfig();
const cliConfig = parseArgs(args);

// Merge configurations (CLI > file > default)
const config = { ...fileConfig, ...cliConfig };

// Run the check
const result = checkImages(config);

// Exit with proper code
process.exit(result.success ? 0 : 1);
