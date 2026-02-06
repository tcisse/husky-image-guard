import * as fs from 'fs';
import * as path from 'path';
import { ImageGuardConfig, OversizedFile, CheckResult, ResizedFile } from './types';
import { loadSharp, isResizable, resizeImage } from './resize';

// ANSI colors for terminal
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m'
};

// Default configuration
export const defaultConfig: ImageGuardConfig = {
  maxSize: '1MB',
  directories: ['public', 'assets'],
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
  mode: 'block'
};

/**
 * Converts a human-readable size to bytes
 */
export function parseSize(size: string | number): number {
  if (typeof size === 'number') {
    return size;
  }

  const sizeStr = size.toString().toUpperCase().trim();
  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);

  if (!match) {
    console.warn(`Invalid size format: ${size}. Using default 1MB.`);
    return 1 * 1024 * 1024;
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };

  return Math.floor(value * (multipliers[unit] || 1));
}

/**
 * Formats bytes to human-readable size
 */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  } else if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  }
  return `${bytes}B`;
}

/**
 * Recursively retrieves all files from a directory
 */
function getFilesRecursively(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase().slice(1);
      if (extensions.includes(ext.toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Normalizes extensions (removes dots, converts to lowercase)
 */
function normalizeExtensions(extensions: string[]): string[] {
  return extensions.map(ext => ext.toLowerCase().replace(/^\./, ''));
}

/**
 * Checks image sizes
 */
export function checkImages(config: Partial<ImageGuardConfig> = {}): CheckResult {
  const options: ImageGuardConfig = { ...defaultConfig, ...config };

  const maxSizeBytes = parseSize(options.maxSize);
  const directories = options.directories;
  const extensions = normalizeExtensions(options.extensions);

  console.log(`${colors.yellow}Checking image sizes...${colors.reset}`);
  console.log(`   Limit: ${formatSize(maxSizeBytes)} | Directories: ${directories.join(', ')} | Extensions: ${extensions.join(', ')}\n`);

  const oversizedFiles: OversizedFile[] = [];
  let totalChecked = 0;
  let dirsFound = 0;

  for (const dir of directories) {
    const dirPath = path.resolve(process.cwd(), dir);

    if (fs.existsSync(dirPath)) {
      dirsFound++;
      console.log(`Checking directory: ${colors.yellow}${dir}${colors.reset}`);

      const files = getFilesRecursively(dirPath, extensions);

      if (files.length === 0) {
        console.log(`   ${colors.yellow}(no images found)${colors.reset}`);
      }

      for (const file of files) {
        const stats = fs.statSync(file);
        const fileSize = stats.size;
        const relativePath = path.relative(process.cwd(), file);
        const sizeHuman = formatSize(fileSize);

        totalChecked++;

        if (fileSize > maxSizeBytes) {
          console.log(`  ${colors.red}[X] ${relativePath} (${sizeHuman})${colors.reset}`);
          oversizedFiles.push({ path: relativePath, size: fileSize, sizeHuman });
        } else {
          console.log(`  ${colors.green}[OK] ${relativePath} (${sizeHuman})${colors.reset}`);
        }
      }

      console.log('');
    }
  }

  if (dirsFound === 0) {
    console.log(`${colors.yellow}None of the configured directories exist: ${directories.join(', ')}${colors.reset}\n`);
  }

  console.log('----------------------------------------');

  if (oversizedFiles.length > 0) {
    console.log(`${colors.red}PUSH BLOCKED${colors.reset}\n`);
    console.log(`${colors.red}The following images exceed the ${formatSize(maxSizeBytes)} limit:${colors.reset}`);

    for (const file of oversizedFiles) {
      console.log(`  ${colors.red}- ${file.path} (${file.sizeHuman})${colors.reset}`);
    }

    console.log(`\n${colors.yellow}Possible solutions:${colors.reset}`);
    console.log('  1. Compress images with TinyPNG, ImageOptim');
    console.log('  2. Reduce image dimensions');
    console.log('  3. Convert to WebP format for better compression');
    console.log('  4. Use: npx @squoosh/cli --webp auto <image>\n');

    return {
      success: false,
      totalChecked,
      oversizedFiles,
      maxSizeBytes,
      resizedFiles: []
    };
  }

  console.log(`${colors.green}All images are compliant (< ${formatSize(maxSizeBytes)})${colors.reset}`);
  console.log(`   ${totalChecked} image(s) checked\n`);

  return {
    success: true,
    totalChecked,
    oversizedFiles: [],
    maxSizeBytes,
    resizedFiles: []
  };
}

/**
 * Resizes oversized images to fit under the size limit
 */
export async function resizeOversizedImages(
  oversizedFiles: OversizedFile[],
  maxSizeBytes: number
): Promise<{ resizedFiles: ResizedFile[], failedFiles: OversizedFile[] }> {
  const sharp = loadSharp();

  if (!sharp) {
    console.log(`\n${colors.yellow}Sharp library not installed.${colors.reset}`);
    console.log(`To use resize mode, install sharp:`);
    console.log(`  ${colors.green}npm install --save-dev sharp${colors.reset}\n`);
    console.log(`Falling back to block mode...\n`);
    return { resizedFiles: [], failedFiles: oversizedFiles };
  }

  const resizedFiles: ResizedFile[] = [];
  const failedFiles: OversizedFile[] = [];

  console.log(`\n${colors.yellow}Resizing oversized images...${colors.reset}\n`);

  for (const file of oversizedFiles) {
    const ext = path.extname(file.path).toLowerCase().slice(1);

    if (!isResizable(ext)) {
      console.log(`  ${colors.yellow}[SKIP] ${file.path} (${ext.toUpperCase()} not resizable)${colors.reset}`);
      failedFiles.push(file);
      continue;
    }

    console.log(`  ${colors.cyan}[RESIZE] ${file.path} (${file.sizeHuman})...${colors.reset}`);

    const result = await resizeImage(
      path.resolve(process.cwd(), file.path),
      file.size,
      maxSizeBytes,
      sharp
    );

    if (result) {
      console.log(`  ${colors.green}[OK] Resized to ${result.newSizeHuman} (saved ${formatSize(result.originalSize - result.newSize)})${colors.reset}`);
      resizedFiles.push(result);
    } else {
      console.log(`  ${colors.red}[FAILED] Could not resize ${file.path}${colors.reset}`);
      failedFiles.push(file);
    }
  }

  // Print summary
  console.log('\n----------------------------------------');

  if (resizedFiles.length > 0) {
    console.log(`${colors.green}IMAGES RESIZED${colors.reset}\n`);
    console.log(`${colors.green}Successfully resized ${resizedFiles.length} image(s):${colors.reset}\n`);

    for (const file of resizedFiles) {
      const relativePath = path.relative(process.cwd(), file.path);
      console.log(`  ${colors.green}- ${relativePath}${colors.reset}`);
      console.log(`    ${colors.yellow}${file.originalSizeHuman} → ${file.newSizeHuman}${colors.reset}`);
    }

    console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
    console.log(`  1. Review the resized images to ensure quality is acceptable`);
    console.log(`  2. Stage the changes: ${colors.green}git add .${colors.reset}`);
    console.log(`  3. Amend your commit: ${colors.green}git commit --amend --no-edit${colors.reset}`);
    console.log(`  4. Push again: ${colors.green}git push${colors.reset}\n`);
  }

  if (failedFiles.length > 0) {
    console.log(`${colors.red}RESIZE FAILED${colors.reset}\n`);
    console.log(`${colors.red}Could not resize ${failedFiles.length} image(s):${colors.reset}\n`);

    for (const file of failedFiles) {
      console.log(`  ${colors.red}- ${file.path} (${file.sizeHuman})${colors.reset}`);
    }

    console.log(`\n${colors.yellow}Manual action required:${colors.reset}`);
    console.log('  1. Compress images with TinyPNG, ImageOptim');
    console.log('  2. Further reduce image dimensions');
    console.log('  3. Convert to WebP format for better compression\n');
  }

  return { resizedFiles, failedFiles };
}

/**
 * Loads configuration from a file
 */
export function loadConfig(): Partial<ImageGuardConfig> {
  const configPaths = [
    'image-guard.config.cjs',
    'image-guard.config.js',
    'image-guard.config.json',
    '.imageguardrc',
    '.imageguardrc.json'
  ];

  for (const configPath of configPaths) {
    const fullPath = path.resolve(process.cwd(), configPath);

    if (fs.existsSync(fullPath)) {
      console.log(`Configuration loaded from: ${configPath}\n`);

      if (configPath.endsWith('.js') || configPath.endsWith('.cjs')) {
        delete require.cache[fullPath];
        return require(fullPath);
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(content);
      }
    }
  }

  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.imageGuard) {
      console.log(`Configuration loaded from: package.json\n`);
      return packageJson.imageGuard;
    }
  }

  return {};
}
