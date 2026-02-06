import * as fs from 'fs';
import * as path from 'path';
import { parseSize, formatSize, checkImages, loadConfig, defaultConfig } from '../src/index';

describe('parseSize', () => {
  it('should parse bytes correctly', () => {
    expect(parseSize(1024)).toBe(1024);
    expect(parseSize('1024')).toBe(1024);
    expect(parseSize('1024B')).toBe(1024);
  });

  it('should parse kilobytes correctly', () => {
    expect(parseSize('1KB')).toBe(1024);
    expect(parseSize('2KB')).toBe(2048);
    expect(parseSize('0.5KB')).toBe(512);
  });

  it('should parse megabytes correctly', () => {
    expect(parseSize('1MB')).toBe(1048576);
    expect(parseSize('2MB')).toBe(2097152);
    expect(parseSize('0.5MB')).toBe(524288);
  });

  it('should parse gigabytes correctly', () => {
    expect(parseSize('1GB')).toBe(1073741824);
    expect(parseSize('2GB')).toBe(2147483648);
  });

  it('should handle case insensitivity', () => {
    expect(parseSize('1mb')).toBe(1048576);
    expect(parseSize('1Mb')).toBe(1048576);
    expect(parseSize('1MB')).toBe(1048576);
  });

  it('should handle whitespace', () => {
    expect(parseSize(' 1MB ')).toBe(1048576);
    expect(parseSize('1 MB')).toBe(1048576);
  });

  it('should return default 1MB for invalid formats', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    expect(parseSize('invalid')).toBe(1048576);
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});

describe('formatSize', () => {
  it('should format bytes correctly', () => {
    expect(formatSize(0)).toBe('0B');
    expect(formatSize(512)).toBe('512B');
    expect(formatSize(1023)).toBe('1023B');
  });

  it('should format kilobytes correctly', () => {
    expect(formatSize(1024)).toBe('1.00KB');
    expect(formatSize(2048)).toBe('2.00KB');
    expect(formatSize(1536)).toBe('1.50KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatSize(1048576)).toBe('1.00MB');
    expect(formatSize(2097152)).toBe('2.00MB');
    expect(formatSize(1572864)).toBe('1.50MB');
  });

  it('should format gigabytes correctly', () => {
    expect(formatSize(1073741824)).toBe('1.00GB');
    expect(formatSize(2147483648)).toBe('2.00GB');
  });
});

describe('checkImages', () => {
  const testDir = path.join(process.cwd(), 'test-images');
  const publicDir = path.join(testDir, 'public');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    jest.restoreAllMocks();
  });

  it('should pass when all images are under size limit', () => {
    const smallImagePath = path.join(publicDir, 'small.jpg');
    fs.writeFileSync(smallImagePath, Buffer.alloc(500 * 1024));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    const result = checkImages({
      maxSize: '1MB',
      directories: ['public'],
      extensions: ['jpg']
    });

    process.chdir(originalCwd);

    expect(result.success).toBe(true);
    expect(result.totalChecked).toBe(1);
    expect(result.oversizedFiles).toHaveLength(0);
    expect(result.resizedFiles).toHaveLength(0);
  });

  it('should fail when images exceed size limit', () => {
    const largeImagePath = path.join(publicDir, 'large.jpg');
    fs.writeFileSync(largeImagePath, Buffer.alloc(2 * 1024 * 1024));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    const result = checkImages({
      maxSize: '1MB',
      directories: ['public'],
      extensions: ['jpg']
    });

    process.chdir(originalCwd);

    expect(result.success).toBe(false);
    expect(result.totalChecked).toBe(1);
    expect(result.oversizedFiles).toHaveLength(1);
    expect(result.oversizedFiles[0].path).toContain('large.jpg');
    expect(result.resizedFiles).toHaveLength(0);
  });

  it('should check multiple directories', () => {
    const assetsDir = path.join(testDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    fs.writeFileSync(path.join(publicDir, 'image1.jpg'), Buffer.alloc(500 * 1024));
    fs.writeFileSync(path.join(assetsDir, 'image2.png'), Buffer.alloc(500 * 1024));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    const result = checkImages({
      maxSize: '1MB',
      directories: ['public', 'assets'],
      extensions: ['jpg', 'png']
    });

    process.chdir(originalCwd);

    expect(result.success).toBe(true);
    expect(result.totalChecked).toBe(2);
    expect(result.resizedFiles).toHaveLength(0);
  });

  it('should filter by extensions', () => {
    fs.writeFileSync(path.join(publicDir, 'image.jpg'), Buffer.alloc(500 * 1024));
    fs.writeFileSync(path.join(publicDir, 'image.png'), Buffer.alloc(500 * 1024));
    fs.writeFileSync(path.join(publicDir, 'image.gif'), Buffer.alloc(500 * 1024));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    const result = checkImages({
      maxSize: '1MB',
      directories: ['public'],
      extensions: ['jpg', 'png']
    });

    process.chdir(originalCwd);

    expect(result.success).toBe(true);
    expect(result.totalChecked).toBe(2);
    expect(result.resizedFiles).toHaveLength(0);
  });

  it('should handle non-existent directories gracefully', () => {
    const originalCwd = process.cwd();
    process.chdir(testDir);

    const result = checkImages({
      maxSize: '1MB',
      directories: ['nonexistent'],
      extensions: ['jpg']
    });

    process.chdir(originalCwd);

    expect(result.success).toBe(true);
    expect(result.totalChecked).toBe(0);
    expect(result.resizedFiles).toHaveLength(0);
  });

  it('should check images recursively in subdirectories', () => {
    const subDir = path.join(publicDir, 'subfolder');
    fs.mkdirSync(subDir, { recursive: true });

    fs.writeFileSync(path.join(publicDir, 'image1.jpg'), Buffer.alloc(500 * 1024));
    fs.writeFileSync(path.join(subDir, 'image2.jpg'), Buffer.alloc(500 * 1024));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    const result = checkImages({
      maxSize: '1MB',
      directories: ['public'],
      extensions: ['jpg']
    });

    process.chdir(originalCwd);

    expect(result.success).toBe(true);
    expect(result.totalChecked).toBe(2);
    expect(result.resizedFiles).toHaveLength(0);
  });

  it('should use default config when no config provided', () => {
    const result = checkImages();
    expect(result.maxSizeBytes).toBe(parseSize(defaultConfig.maxSize));
    expect(result.resizedFiles).toHaveLength(0);
  });

  it('should include mode in default config', () => {
    expect(defaultConfig.mode).toBe('block');
  });
});

describe('loadConfig', () => {
  const testDir = path.join(process.cwd(), 'test-config');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    jest.restoreAllMocks();
  });

  it('should load config from image-guard.config.cjs', () => {
    const configPath = path.join(testDir, 'image-guard.config.cjs');
    const config = {
      maxSize: '500KB',
      directories: ['public'],
      extensions: ['jpg', 'png']
    };

    fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config)}`);

    const originalCwd = process.cwd();
    process.chdir(testDir);

    const loadedConfig = loadConfig();

    process.chdir(originalCwd);

    expect(loadedConfig.maxSize).toBe('500KB');
    expect(loadedConfig.directories).toEqual(['public']);
  });

  it('should load config from .imageguardrc.json', () => {
    const configPath = path.join(testDir, '.imageguardrc.json');
    const config = {
      maxSize: '2MB',
      directories: ['assets'],
      extensions: ['webp']
    };

    fs.writeFileSync(configPath, JSON.stringify(config));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    const loadedConfig = loadConfig();

    process.chdir(originalCwd);

    expect(loadedConfig.maxSize).toBe('2MB');
    expect(loadedConfig.directories).toEqual(['assets']);
  });

  it('should load config from package.json imageGuard field', () => {
    const packageJsonPath = path.join(testDir, 'package.json');
    const packageJson = {
      name: 'test',
      imageGuard: {
        maxSize: '3MB',
        directories: ['images'],
        extensions: ['svg']
      }
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    const loadedConfig = loadConfig();

    process.chdir(originalCwd);

    expect(loadedConfig.maxSize).toBe('3MB');
    expect(loadedConfig.directories).toEqual(['images']);
  });

  it('should return empty config when no config file exists', () => {
    const originalCwd = process.cwd();
    process.chdir(testDir);

    const loadedConfig = loadConfig();

    process.chdir(originalCwd);

    expect(loadedConfig).toEqual({});
  });
});
