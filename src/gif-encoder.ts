/**
 * GIF Encoder
 * Converts rendered frames to animated GIF format
 */

import GIFEncoder from 'gif-encoder-2';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';
import {
  EncodeOptions,
  EncodeResult,
  EncodeProgress,
  EncodeError,
} from './types/encoder';

/**
 * Encodes rendered frames into an animated GIF file
 * @param options - Encoding configuration options
 * @returns Promise resolving to encode result
 */
export async function encodeToGif(options: EncodeOptions): Promise<EncodeResult> {
  const startTime = Date.now();

  try {
    const {
      outputPath,
      frames,
      fps,
      quality = 80,
      dither = false,
      repeat = -1, // Loop forever by default
      backgroundColor,
      onProgress,
    } = options;

    // Validate inputs
    if (!frames || frames.length === 0) {
      throw new EncodeError('No frames provided for encoding');
    }

    if (fps <= 0) {
      throw new EncodeError('FPS must be greater than 0');
    }

    // Get dimensions from first frame
    const width = frames[0].width;
    const height = frames[0].height;

    // Report progress: initializing
    if (onProgress) {
      onProgress({
        currentFrame: 0,
        totalFrames: frames.length,
        percentage: 0,
        phase: 'initializing',
      });
    }

    // Initialize GIF encoder
    const encoder = new GIFEncoder(width, height, 'neuquant', true);

    // Create write stream
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(outputPath);
    encoder.createReadStream().pipe(writeStream);

    // Configure encoder
    encoder.start();
    encoder.setRepeat(repeat); // -1 = loop forever, 0 = no repeat
    encoder.setDelay(Math.round(1000 / fps)); // Delay in milliseconds between frames
    encoder.setQuality(Math.max(1, Math.min(100 - quality, 20))); // Lower = better (inverted)

    // Enable transparency for transparent backgrounds
    if (backgroundColor === 'transparent') {
      // Set transparent color to black (0x000000)
      // The encoder will automatically detect pixels with alpha=0 and map them to this color index
      encoder.setTransparent(0x000000);
    }

    if (dither) {
      encoder.setThreshold(0); // Enable dithering
    }

    // Encode each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];

      // Report progress: encoding
      if (onProgress) {
        onProgress({
          currentFrame: i + 1,
          totalFrames: frames.length,
          percentage: ((i + 1) / frames.length) * 90, // Reserve 10% for finalization
          phase: 'encoding',
        });
      }

      // Decode PNG buffer to RGBA data
      const png = PNG.sync.read(frame.buffer);

      // Add frame to GIF
      encoder.addFrame(png.data);
    }

    // Report progress: finalizing
    if (onProgress) {
      onProgress({
        currentFrame: frames.length,
        totalFrames: frames.length,
        percentage: 95,
        phase: 'finalizing',
      });
    }

    // Finalize GIF
    encoder.finish();

    // Wait for write to complete
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (error) => reject(error));
    });

    // Report progress: writing
    if (onProgress) {
      onProgress({
        currentFrame: frames.length,
        totalFrames: frames.length,
        percentage: 100,
        phase: 'writing',
      });
    }

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSize = stats.size;

    const encodeTime = Date.now() - startTime;

    return {
      outputPath,
      fileSize,
      encodeTime,
      frameCount: frames.length,
      fps,
      dimensions: { width, height },
    };
  } catch (error) {
    throw new EncodeError(
      `Failed to encode GIF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Encodes frames to GIF with streaming support (memory efficient for large animations)
 * @param options - Encoding configuration options
 * @returns Promise resolving to encode result
 */
export async function encodeToGifStreaming(options: EncodeOptions): Promise<EncodeResult> {
  // For now, use the same implementation
  // In the future, this could process frames one at a time from disk
  return encodeToGif(options);
}
