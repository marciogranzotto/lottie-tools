/**
 * Lottie to GIF Converter
 * Main orchestrator that coordinates parsing, rendering, and encoding
 */

import * as path from 'path';
import * as fs from 'fs';
import { parseLottieFile } from './lottie-parser';
import { renderAnimation } from './renderer';
import { encodeToGif } from './gif-encoder';
import {
  ConversionConfig,
  ConversionResult,
  ConversionProgress,
  ConversionError,
} from './types/config';

/**
 * Logger utility for verbose output
 */
class Logger {
  constructor(private verbose: boolean) {}

  log(message: string): void {
    if (this.verbose) {
      console.log(`[lottie-to-gif] ${message}`);
    }
  }

  error(message: string, error?: Error): void {
    console.error(`[lottie-to-gif] ERROR: ${message}`);
    if (error && this.verbose) {
      console.error(error);
    }
  }
}

/**
 * Converts hex color to CSS format
 * @param hex - Hex color string (e.g., "FFFFFF" or "FFFFFFFF") or CSS keyword (e.g., "transparent")
 * @returns CSS color string
 */
function hexToCSS(hex: string): string {
  // Handle CSS color keywords
  if (hex.toLowerCase() === 'transparent') {
    return 'transparent';
  }

  // Remove # if present
  hex = hex.replace(/^#/, '');

  if (hex.length === 6) {
    // RGB format: RRGGBB
    return `#${hex}`;
  } else if (hex.length === 8) {
    // RGBA format: RRGGBBAA
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  } else {
    // Invalid format, return as-is with # prefix
    return `#${hex}`;
  }
}

/**
 * Converts a Lottie JSON animation to an animated GIF file
 * @param config - Conversion configuration
 * @returns Promise resolving to conversion result
 */
export async function convertLottieToGif(config: ConversionConfig): Promise<ConversionResult> {
  const startTime = Date.now();
  const logger = new Logger(config.verbose || config.dryRun || false);
  let parseTime = 0;
  let renderTime = 0;
  let encodeTime = 0;

  try {
    // Validate input file
    if (!fs.existsSync(config.input)) {
      throw new ConversionError(`Input file not found: ${config.input}`, 'parsing');
    }

    // Determine output path
    let outputPath: string;
    if (config.output) {
      outputPath = config.output;
    } else {
      // Default: output to 'output/' folder with same filename
      const inputBasename = path.basename(config.input).replace(/\.json$/i, '.gif');
      outputPath = path.join('output', inputBasename);

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        logger.log(`Created output directory: ${outputDir}`);
      }
    }
    logger.log(`Converting: ${config.input} → ${outputPath}`);

    // Report progress: parsing
    if (config.onProgress) {
      config.onProgress({
        phase: 'parsing',
        percentage: 0,
        message: 'Parsing Lottie file...',
      });
    }

    // Phase 1: Parse Lottie file
    logger.log('Phase 1: Parsing Lottie file...');
    const parseStart = Date.now();
    let parseResult;
    try {
      parseResult = await parseLottieFile(config.input);
      parseTime = Date.now() - parseStart;
      logger.log(`  ✓ Parsed: ${parseResult.metadata.width}x${parseResult.metadata.height}, ${parseResult.metadata.frameRate}fps, ${parseResult.metadata.duration.toFixed(2)}s`);
    } catch (error) {
      throw new ConversionError(
        `Failed to parse Lottie file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'parsing',
        error instanceof Error ? error : undefined
      );
    }

    // Extract configuration with defaults
    let width: number;
    let height: number;

    // Handle scaled option
    if (config.scaled) {
      width = Math.round(parseResult.metadata.width * config.scaled);
      height = Math.round(parseResult.metadata.height * config.scaled);
    } else {
      width = config.width || parseResult.metadata.width;
      height = config.height || parseResult.metadata.height;
    }

    const fps = config.fps || parseResult.metadata.frameRate;
    const quality = config.quality !== undefined ? config.quality : 80;
    const dither = config.dither !== undefined ? config.dither : false;
    const repeat = config.repeat !== undefined ? config.repeat : -1;
    const timeout = config.timeout || 60000;

    // Determine background color
    let backgroundColor: string | undefined;
    if (config.backgroundColor) {
      // Convert hex format to CSS format
      backgroundColor = hexToCSS(config.backgroundColor);
    } else if (parseResult.metadata.backgroundColor) {
      // Use Lottie's background color if available
      backgroundColor = parseResult.metadata.backgroundColor;
    } else {
      // Default to transparent
      backgroundColor = 'transparent';
    }

    // Calculate expected frame count
    const expectedFrames = Math.ceil(
      (parseResult.metadata.totalFrames * fps) / parseResult.metadata.frameRate
    );

    // Dry run mode: show settings and exit without converting
    if (config.dryRun) {
      const dryRunTime = Date.now() - startTime;
      logger.log('');
      logger.log('=== DRY RUN MODE ===');
      logger.log(`Input: ${config.input}`);
      logger.log(`Output: ${outputPath}`);
      logger.log('');
      logger.log('Source Animation:');
      logger.log(`  Dimensions: ${parseResult.metadata.width}x${parseResult.metadata.height}`);
      logger.log(`  Frame Rate: ${parseResult.metadata.frameRate} fps`);
      logger.log(`  Duration: ${parseResult.metadata.duration.toFixed(2)}s`);
      logger.log(`  Total Frames: ${parseResult.metadata.totalFrames}`);
      if (parseResult.metadata.backgroundColor) {
        logger.log(`  Background Color: ${parseResult.metadata.backgroundColor}`);
      }
      logger.log('');
      logger.log('Output Settings:');
      logger.log(`  Dimensions: ${width}x${height}${config.scaled ? ` (${config.scaled}x scale)` : ''}`);
      logger.log(`  Frame Rate: ${fps} fps`);
      logger.log(`  Frame Count: ${expectedFrames}`);
      logger.log(`  Background: ${backgroundColor}`);
      logger.log(`  Quality: ${quality}`);
      logger.log(`  Dithering: ${dither ? 'enabled' : 'disabled'}`);
      logger.log(`  Loop: ${repeat === -1 ? 'forever' : repeat === 0 ? 'once' : `${repeat + 1} times`}`);
      logger.log('');
      logger.log('Estimated Processing:');
      logger.log(`  Rendering: ~${(expectedFrames * 0.1).toFixed(1)}s (${expectedFrames} frames)`);
      logger.log(`  Encoding: ~${(expectedFrames * 0.01).toFixed(1)}s`);
      logger.log(`  Total: ~${((expectedFrames * 0.11) + 0.5).toFixed(1)}s`);
      logger.log('');
      logger.log(`✓ Dry run completed in ${(dryRunTime / 1000).toFixed(2)}s`);
      logger.log('');

      // Return a dry-run result
      return {
        inputPath: config.input,
        outputPath,
        fileSize: 0,
        totalTime: dryRunTime,
        parseTime,
        renderTime: 0,
        encodeTime: 0,
        source: {
          width: parseResult.metadata.width,
          height: parseResult.metadata.height,
          frameRate: parseResult.metadata.frameRate,
          duration: parseResult.metadata.duration,
          totalFrames: parseResult.metadata.totalFrames,
        },
        output: {
          width,
          height,
          frameRate: fps,
          frameCount: expectedFrames,
          fileSize: 0,
        },
      };
    }

    // Report progress: rendering
    if (config.onProgress) {
      config.onProgress({
        phase: 'rendering',
        percentage: 10,
        message: `Rendering ${expectedFrames} frames...`,
        details: {
          totalFrames: expectedFrames,
        },
      });
    }

    // Phase 2: Render animation frames
    logger.log(`Phase 2: Rendering ${expectedFrames} frames at ${fps}fps...`);
    if (backgroundColor && backgroundColor !== 'transparent') {
      logger.log(`  Using background color: ${backgroundColor}`);
    }
    const renderStart = Date.now();
    let renderResult;
    try {
      renderResult = await renderAnimation({
        animationData: parseResult.data,
        width,
        height,
        fps,
        backgroundColor,
        timeout,
        onProgress: (renderProgress) => {
          if (config.onProgress) {
            config.onProgress({
              phase: 'rendering',
              percentage: 10 + (renderProgress.percentage * 0.6), // 10-70%
              message: `Rendering frame ${renderProgress.currentFrame}/${renderProgress.totalFrames}...`,
              details: {
                currentFrame: renderProgress.currentFrame,
                totalFrames: renderProgress.totalFrames,
              },
            });
          }
        },
      });
      renderTime = Date.now() - renderStart;
      logger.log(`  ✓ Rendered ${renderResult.frameCount} frames in ${(renderTime / 1000).toFixed(2)}s`);
    } catch (error) {
      throw new ConversionError(
        `Failed to render animation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'rendering',
        error instanceof Error ? error : undefined
      );
    }

    // Report progress: encoding
    if (config.onProgress) {
      config.onProgress({
        phase: 'encoding',
        percentage: 70,
        message: 'Encoding to GIF...',
        details: {
          totalFrames: renderResult.frameCount,
        },
      });
    }

    // Phase 3: Encode to GIF
    logger.log('Phase 3: Encoding to GIF...');
    const encodeStart = Date.now();
    let encodeResult;
    try {
      encodeResult = await encodeToGif({
        outputPath,
        frames: renderResult.frames,
        fps: renderResult.fps,
        quality,
        dither,
        repeat,
        backgroundColor,
        onProgress: (encodeProgress) => {
          if (config.onProgress) {
            config.onProgress({
              phase: 'encoding',
              percentage: 70 + (encodeProgress.percentage * 0.3), // 70-100%
              message: `Encoding: ${encodeProgress.phase}...`,
              details: {
                currentFrame: encodeProgress.currentFrame,
                totalFrames: encodeProgress.totalFrames,
              },
            });
          }
        },
      });
      encodeTime = Date.now() - encodeStart;
      logger.log(`  ✓ Encoded to GIF in ${(encodeTime / 1000).toFixed(2)}s`);
      logger.log(`  ✓ Output: ${encodeResult.outputPath} (${(encodeResult.fileSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      throw new ConversionError(
        `Failed to encode GIF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'encoding',
        error instanceof Error ? error : undefined
      );
    }

    // Report progress: complete
    if (config.onProgress) {
      config.onProgress({
        phase: 'complete',
        percentage: 100,
        message: 'Conversion complete!',
        details: {
          renderTime,
          encodeTime,
        },
      });
    }

    const totalTime = Date.now() - startTime;
    logger.log(`✓ Total time: ${(totalTime / 1000).toFixed(2)}s`);

    return {
      inputPath: config.input,
      outputPath: encodeResult.outputPath,
      fileSize: encodeResult.fileSize,
      totalTime,
      parseTime,
      renderTime,
      encodeTime,
      source: {
        width: parseResult.metadata.width,
        height: parseResult.metadata.height,
        frameRate: parseResult.metadata.frameRate,
        duration: parseResult.metadata.duration,
        totalFrames: parseResult.metadata.totalFrames,
      },
      output: {
        width: encodeResult.dimensions.width,
        height: encodeResult.dimensions.height,
        frameRate: encodeResult.fps,
        frameCount: encodeResult.frameCount,
        fileSize: encodeResult.fileSize,
      },
    };
  } catch (error) {
    // Log error
    if (error instanceof ConversionError) {
      logger.error(`Conversion failed during ${error.phase} phase: ${error.message}`, error.cause);
    } else {
      logger.error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Re-throw
    throw error;
  }
}

/**
 * Validates conversion configuration
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: ConversionConfig): void {
  if (!config.input) {
    throw new Error('Input file path is required');
  }

  if (config.fps !== undefined && config.fps <= 0) {
    throw new Error('FPS must be greater than 0');
  }

  if (config.width !== undefined && config.width <= 0) {
    throw new Error('Width must be greater than 0');
  }

  if (config.height !== undefined && config.height <= 0) {
    throw new Error('Height must be greater than 0');
  }

  if (config.quality !== undefined && (config.quality < 1 || config.quality > 100)) {
    throw new Error('Quality must be between 1 and 100');
  }

  if (config.timeout !== undefined && config.timeout <= 0) {
    throw new Error('Timeout must be greater than 0');
  }
}
