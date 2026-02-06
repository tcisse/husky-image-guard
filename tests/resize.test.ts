import * as fs from 'fs';
import * as path from 'path';
import { loadSharp, isResizable, resizeImage } from '../src/resize';
import { resizeOversizedImages } from '../src/index';
import { OversizedFile } from '../src/types';

describe('resize module', () => {
  describe('isResizable', () => {
    it('should return true for resizable formats', () => {
      expect(isResizable('jpg')).toBe(true);
      expect(isResizable('jpeg')).toBe(true);
      expect(isResizable('png')).toBe(true);
      expect(isResizable('webp')).toBe(true);
      expect(isResizable('tiff')).toBe(true);
      expect(isResizable('avif')).toBe(true);
    });

    it('should return true for uppercase extensions', () => {
      expect(isResizable('JPG')).toBe(true);
      expect(isResizable('PNG')).toBe(true);
      expect(isResizable('WEBP')).toBe(true);
    });

    it('should return false for non-resizable formats', () => {
      expect(isResizable('svg')).toBe(false);
      expect(isResizable('gif')).toBe(false);
      expect(isResizable('bmp')).toBe(false);
      expect(isResizable('ico')).toBe(false);
    });
  });

  describe('loadSharp', () => {
    it('should load sharp if available', () => {
      const sharp = loadSharp();
      // Sharp should be available in devDependencies
      expect(sharp).not.toBeNull();
      expect(typeof sharp).toBe('function');
    });
  });

  describe('resizeImage', () => {
    const testDir = path.join(process.cwd(), 'test-resize');
    let sharp: any;

    beforeAll(() => {
      sharp = loadSharp();
      if (!sharp) {
        throw new Error('Sharp is required for resize tests. Install with: npm install --save-dev sharp');
      }

      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterAll(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should resize a JPEG image to fit under size limit', async () => {
      // Create a test JPEG image that's over 100KB
      const testImagePath = path.join(testDir, 'test.jpg');
      const largeBuffer = await sharp({
        create: {
          width: 2000,
          height: 2000,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
        .jpeg()
        .toBuffer();

      fs.writeFileSync(testImagePath, largeBuffer);
      const originalSize = fs.statSync(testImagePath).size;

      // Resize to fit under 50KB
      const maxSize = 50 * 1024;
      const result = await resizeImage(testImagePath, originalSize, maxSize, sharp);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.path).toBe(testImagePath);
        expect(result.originalSize).toBe(originalSize);
        expect(result.newSize).toBeLessThan(maxSize);
        expect(result.newSize).toBeGreaterThan(0);

        // Verify file was actually written
        const newFileSize = fs.statSync(testImagePath).size;
        expect(newFileSize).toBe(result.newSize);
        expect(newFileSize).toBeLessThan(originalSize);
      }
    });

    it('should resize a PNG image to fit under size limit', async () => {
      const testImagePath = path.join(testDir, 'test.png');
      const largeBuffer = await sharp({
        create: {
          width: 1500,
          height: 1500,
          channels: 4,
          background: { r: 0, g: 255, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer();

      fs.writeFileSync(testImagePath, largeBuffer);
      const originalSize = fs.statSync(testImagePath).size;

      const maxSize = 100 * 1024;
      const result = await resizeImage(testImagePath, originalSize, maxSize, sharp);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.newSize).toBeLessThan(maxSize);
        expect(result.newSize).toBeGreaterThan(0);
      }
    });

    it('should preserve metadata when resizing', async () => {
      const testImagePath = path.join(testDir, 'metadata.jpg');
      const largeBuffer = await sharp({
        create: {
          width: 3000,
          height: 3000,
          channels: 3,
          background: { r: 0, g: 0, b: 255 }
        }
      })
        .jpeg()
        .toBuffer();

      fs.writeFileSync(testImagePath, largeBuffer);
      const originalSize = fs.statSync(testImagePath).size;

      const maxSize = 30 * 1024;
      const result = await resizeImage(testImagePath, originalSize, maxSize, sharp);

      expect(result).not.toBeNull();

      // Verify the resized image can still be read by sharp and dimensions were reduced
      const metadata = await sharp(testImagePath).metadata();
      expect(metadata.format).toBe('jpeg');
      expect(metadata.width).toBeLessThan(3000);
      expect(metadata.height).toBeLessThan(3000);
    });

    it('should return null if image cannot be resized under limit', async () => {
      const testImagePath = path.join(testDir, 'impossible.jpg');
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .jpeg()
        .toBuffer();

      fs.writeFileSync(testImagePath, buffer);
      const originalSize = fs.statSync(testImagePath).size;

      // Try to resize to an impossibly small size
      const result = await resizeImage(testImagePath, originalSize, 100, sharp);

      // Should fail after max iterations
      expect(result).toBeNull();
    });

    it('should handle corrupt or invalid images gracefully', async () => {
      const testImagePath = path.join(testDir, 'corrupt.jpg');
      fs.writeFileSync(testImagePath, Buffer.from('not a valid image'));

      const result = await resizeImage(testImagePath, 100, 50, sharp);
      expect(result).toBeNull();
    });
  });

  describe('resizeOversizedImages', () => {
    const testDir = path.join(process.cwd(), 'test-resize-integration');
    let sharp: any;

    beforeAll(() => {
      sharp = loadSharp();
      if (!sharp) {
        throw new Error('Sharp is required for resize tests');
      }

      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      jest.spyOn(console, 'log').mockImplementation();
    });

    afterAll(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      jest.restoreAllMocks();
    });

    it('should resize multiple oversized images', async () => {
      // Create two oversized JPEG images
      const image1Path = path.join(testDir, 'image1.jpg');
      const image2Path = path.join(testDir, 'image2.jpg');

      const buffer1 = await sharp({
        create: {
          width: 2000,
          height: 2000,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
        .jpeg({ quality: 80 })
        .toBuffer();

      const buffer2 = await sharp({
        create: {
          width: 1800,
          height: 1800,
          channels: 3,
          background: { r: 0, g: 255, b: 0 }
        }
      })
        .jpeg({ quality: 80 })
        .toBuffer();

      fs.writeFileSync(image1Path, buffer1);
      fs.writeFileSync(image2Path, buffer2);

      const oversizedFiles: OversizedFile[] = [
        {
          path: image1Path,
          size: buffer1.length,
          sizeHuman: `${(buffer1.length / 1024).toFixed(2)}KB`
        },
        {
          path: image2Path,
          size: buffer2.length,
          sizeHuman: `${(buffer2.length / 1024).toFixed(2)}KB`
        }
      ];

      const maxSize = 50 * 1024;
      const result = await resizeOversizedImages(oversizedFiles, maxSize);

      expect(result.resizedFiles).toHaveLength(2);
      expect(result.failedFiles).toHaveLength(0);

      // Verify both files were resized
      expect(result.resizedFiles.length).toBe(2);
      result.resizedFiles.forEach(file => {
        expect(file.newSize).toBeLessThanOrEqual(maxSize);
        expect(file.newSize).toBeGreaterThan(0);
      });
    }, 15000);

    it('should skip non-resizable formats', async () => {
      const oversizedFiles: OversizedFile[] = [
        {
          path: path.join(testDir, 'test.svg'),
          size: 100 * 1024,
          sizeHuman: '100KB'
        },
        {
          path: path.join(testDir, 'test.gif'),
          size: 150 * 1024,
          sizeHuman: '150KB'
        }
      ];

      const result = await resizeOversizedImages(oversizedFiles, 50 * 1024);

      expect(result.resizedFiles).toHaveLength(0);
      expect(result.failedFiles).toHaveLength(2);
    });

    it('should handle mix of resizable and non-resizable formats', async () => {
      const jpegPath = path.join(testDir, 'mixed.jpg');
      const buffer = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .jpeg()
        .toBuffer();

      fs.writeFileSync(jpegPath, buffer);

      const oversizedFiles: OversizedFile[] = [
        {
          path: jpegPath,
          size: buffer.length,
          sizeHuman: `${(buffer.length / 1024).toFixed(2)}KB`
        },
        {
          path: path.join(testDir, 'test.gif'),
          size: 100 * 1024,
          sizeHuman: '100KB'
        }
      ];

      const result = await resizeOversizedImages(oversizedFiles, 50 * 1024);

      expect(result.resizedFiles).toHaveLength(1);
      expect(result.failedFiles).toHaveLength(1);
      expect(result.failedFiles[0].path).toContain('gif');
    });
  });
});
