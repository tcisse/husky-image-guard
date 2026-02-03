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
    // Ignore parsing errors
  }
}

if (hasExistingConfig || hasPackageJsonConfig) {
  console.log(`\n${colors.cyan}husky-image-guard${colors.reset}`);
  console.log(`${colors.green}   Existing configuration detected${colors.reset}\n`);
  process.exit(0);
}

const defaultConfigContent = `/**
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
  maxSize: '1MB',

  /**
   * Directories to scan for images
   * Paths relative to project root
   */
  directories: [
    'public',
    'assets',
    // Add your directories here
    // 'src/images',
    // 'static',
  ],

  /**
   * File extensions to check
   * Without the dot (e.g., 'jpg' not '.jpg')
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
${colors.green}  husky-image-guard installed successfully!${colors.reset}
${colors.cyan}----------------------------------------------------${colors.reset}

  ${colors.yellow}File created:${colors.reset} image-guard.config.cjs

  ${colors.cyan}Next steps:${colors.reset}

  1. ${colors.yellow}Configure your directories${colors.reset} in image-guard.config.cjs:
     - Modify ${colors.green}directories${colors.reset} with your image paths
     - Adjust ${colors.green}maxSize${colors.reset} according to your needs
     - Customize ${colors.green}extensions${colors.reset} if necessary

  2. ${colors.yellow}Add the Husky hook${colors.reset}:
     ${colors.green}echo "npx image-guard" >> .husky/pre-push${colors.reset}

  3. ${colors.yellow}Test the configuration${colors.reset}:
     ${colors.green}npx image-guard${colors.reset}

${colors.cyan}----------------------------------------------------${colors.reset}
`);
} catch (error) {
  console.log(`\n${colors.cyan}husky-image-guard${colors.reset}`);
  console.log(`${colors.yellow}   Run 'npx image-guard init' to create the configuration${colors.reset}\n`);
}
