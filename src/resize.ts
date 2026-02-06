import * as fs from 'fs';
import { ResizedFile } from './types';
import { formatSize } from './index';

/**
 * Dynamically loads sharp module
 * Returns null if sharp is not installed
 */
export function loadSharp(): any | null {
  try {
    return require('sharp');
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a file extension is resizable
 * SVG, GIF, BMP, ICO are not resizable (lossy or format-specific issues)
 */
export function isResizable(ext: string): boolean {
  const resizableFormats = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'avif'];
  return resizableFormats.includes(ext.toLowerCase());
}

/**
 * Resizes an image to fit under the size limit
 * Uses iterative approach to find optimal dimensions
 */
export async function resizeImage(
  filePath: string,
  currentSize: number,
  maxSizeBytes: number,
  sharp: any
): Promise<ResizedFile | null> {
  try {
    const originalSize = currentSize;
    const originalSizeHuman = formatSize(currentSize);

    // Read image metadata
    const image = sharp(filePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      console.warn(`   Unable to read dimensions for ${filePath}`);
      return null;
    }

    // Calculate initial scale factor
    // Use sqrt because we're scaling both dimensions
    // Multiply by 0.9 to provide some margin
    let scale = Math.sqrt(maxSizeBytes / currentSize) * 0.9;
    const maxIterations = 5;
    let iteration = 0;
    let resizedBuffer: Buffer | null = null;

    while (iteration < maxIterations) {
      const newWidth = Math.floor(metadata.width * scale);
      const newHeight = Math.floor(metadata.height * scale);

      // Resize with high quality settings
      let resizeOp = sharp(filePath)
        .resize(newWidth, newHeight, {
          kernel: 'lanczos3',
          fit: 'inside'
        })
        .withMetadata();

      // Apply format-specific quality settings
      const format = metadata.format?.toLowerCase();
      if (format === 'jpeg' || format === 'jpg') {
        resizeOp = resizeOp.jpeg({ quality: 95, mozjpeg: true });
      } else if (format === 'png') {
        resizeOp = resizeOp.png({ compressionLevel: 9 });
      } else if (format === 'webp') {
        resizeOp = resizeOp.webp({ quality: 95 });
      }

      resizedBuffer = await resizeOp.toBuffer();

      // Check if we're under the limit
      if (resizedBuffer && resizedBuffer.length <= maxSizeBytes) {
        break;
      }

      // Reduce scale for next iteration
      scale *= 0.9;
      iteration++;
    }

    if (!resizedBuffer || resizedBuffer.length > maxSizeBytes) {
      console.warn(`   Failed to resize ${filePath} under limit after ${maxIterations} attempts`);
      return null;
    }

    // Write the resized image back to the file
    fs.writeFileSync(filePath, resizedBuffer);

    const finalSize = resizedBuffer.length;

    return {
      path: filePath,
      originalSize,
      originalSizeHuman,
      newSize: finalSize,
      newSizeHuman: formatSize(finalSize)
    };
  } catch (error) {
    console.warn(`   Error resizing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}
