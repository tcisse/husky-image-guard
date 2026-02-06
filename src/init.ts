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
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
  mode: 'block'
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
 * Configuration for husky-image-guard
 * Documentation: https://www.npmjs.com/package/husky-image-guard
 *
 * This file uses the .cjs extension for compatibility with ESM projects
 * (Next.js, projects with "type": "module" in package.json)
 */

module.exports = {
  /**
   * Maximum allowed size for images
   * Supported formats: '500KB', '1MB', '2MB', or in bytes (1048576)
   */
  maxSize: '${config.maxSize}',

  /**
   * Directories to scan for images
   * Paths relative to project root
   */
  directories: [
    ${config.directories.map(d => `'${d}'`).join(',\n    ')}
  ],

  /**
   * File extensions to check
   * Without the dot (e.g., 'jpg' not '.jpg')
   */
  extensions: [
    ${config.extensions.map(e => `'${e}'`).join(',\n    ')}
  ],

  /**
   * Mode: 'block' or 'resize'
   * - block: Block push if images exceed size limit (default)
   * - resize: Automatically resize oversized images to fit limit
   *   (requires 'sharp' package: npm install --save-dev sharp)
   */
  mode: '${config.mode}'
};
`;
}

async function interactiveSetup(): Promise<ImageGuardConfig> {
  const rl = createReadlineInterface();

  console.log(`\n${colors.cyan}husky-image-guard configuration${colors.reset}\n`);
  console.log(`${colors.yellow}Answer the following questions (press Enter to keep default value)${colors.reset}\n`);

  try {
    const maxSizeInput = await question(
      rl,
      `${colors.cyan}?${colors.reset} Maximum image size ${colors.yellow}(${defaultConfig.maxSize})${colors.reset}: `
    );
    const maxSize = maxSizeInput.trim() || defaultConfig.maxSize;

    const dirsInput = await question(
      rl,
      `${colors.cyan}?${colors.reset} Directories to check (comma-separated) ${colors.yellow}(${defaultConfig.directories.join(', ')})${colors.reset}: `
    );
    const directories = dirsInput.trim()
      ? dirsInput.split(',').map(d => d.trim())
      : defaultConfig.directories;

    const extsInput = await question(
      rl,
      `${colors.cyan}?${colors.reset} Extensions to check (comma-separated) ${colors.yellow}(${defaultConfig.extensions.join(', ')})${colors.reset}: `
    );
    const extensions = extsInput.trim()
      ? extsInput.split(',').map(e => e.trim().toLowerCase().replace('.', ''))
      : defaultConfig.extensions;

    const modeInput = await question(
      rl,
      `${colors.cyan}?${colors.reset} Mode (block/resize) ${colors.yellow}(${defaultConfig.mode})${colors.reset}: `
    );
    let mode: 'block' | 'resize' = defaultConfig.mode;
    if (modeInput.trim()) {
      const inputMode = modeInput.trim().toLowerCase();
      if (inputMode === 'block' || inputMode === 'resize') {
        mode = inputMode;
      } else {
        console.log(`${colors.yellow}Invalid mode, using default: ${defaultConfig.mode}${colors.reset}`);
      }
    }

    rl.close();

    return { maxSize, directories, extensions, mode };
  } catch (error) {
    rl.close();
    throw error;
  }
}

async function init(options: InitOptions = {}): Promise<boolean> {
  const configPath = path.resolve(process.cwd(), CONFIG_FILENAME);

  // Check if file already exists
  if (fs.existsSync(configPath) && !options.force) {
    console.log(`${colors.yellow}The ${CONFIG_FILENAME} file already exists.${colors.reset}`);
    console.log(`   Use ${colors.cyan}--force${colors.reset} to replace it.\n`);
    return false;
  }

  let config: ImageGuardConfig;

  // Interactive mode or default values
  if (options.interactive !== false && process.stdin.isTTY) {
    config = await interactiveSetup();
  } else {
    config = defaultConfig;
  }

  // Generate configuration file
  const configContent = generateConfigContent(config);
  fs.writeFileSync(configPath, configContent, 'utf8');

  console.log(`\n${colors.green}${CONFIG_FILENAME} file created successfully!${colors.reset}\n`);
  console.log(`${colors.cyan}Configuration:${colors.reset}`);
  console.log(`   - Max size: ${colors.yellow}${config.maxSize}${colors.reset}`);
  console.log(`   - Directories: ${colors.yellow}${config.directories.join(', ')}${colors.reset}`);
  console.log(`   - Extensions: ${colors.yellow}${config.extensions.join(', ')}${colors.reset}`);
  console.log(`   - Mode: ${colors.yellow}${config.mode}${colors.reset}\n`);

  console.log(`${colors.cyan}Next steps:${colors.reset}`);
  console.log(`   1. Modify ${colors.yellow}${CONFIG_FILENAME}${colors.reset} according to your needs`);
  console.log(`   2. Add the Husky hook:`);
  console.log(`      ${colors.green}echo "npx image-guard" >> .husky/pre-push${colors.reset}\n`);

  return true;
}

// Parse arguments
const args = process.argv.slice(2);
const options: InitOptions = {
  force: args.includes('--force') || args.includes('-f'),
  interactive: !args.includes('--yes') && !args.includes('-y')
};

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  ${colors.cyan}image-guard init${colors.reset} - Initialize configuration

  Usage:
    npx image-guard init [options]

  Options:
    -y, --yes      Use default values (non-interactive)
    -f, --force    Replace existing config file
    -h, --help     Show help

  Examples:
    npx image-guard init           # Interactive mode
    npx image-guard init --yes     # Default values
    npx image-guard init --force   # Replace existing config
`);
  process.exit(0);
}

// Run initialization
init(options)
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
