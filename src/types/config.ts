/**
 * TypeScript type definitions for conversion configuration
 */

/**
 * Main configuration for Lottie to GIF conversion
 */
export interface ConversionConfig {
  /** Input Lottie JSON file path */
  input: string;

  /** Output GIF file path (optional, defaults to output folder with input filename) */
  output?: string;

  /** Frames per second (optional, defaults to source animation FPS) */
  fps?: number;

  /** Output width in pixels (optional, defaults to source width) */
  width?: number;

  /** Output height in pixels (optional, defaults to source height) */
  height?: number;

  /** Scale multiplier for dimensions (e.g., 2 = 2x size, overrides width/height) */
  scaled?: number;

  /** Background color override in hex format (e.g., "FFFFFF" or "FFFFFFFF" with alpha) */
  backgroundColor?: string;

  /** Quality setting 1-100 (optional, default: 80) */
  quality?: number;

  /** Enable dithering for better color representation (optional, default: false) */
  dither?: boolean;

  /** Repeat count for GIF (-1 = loop forever, 0 = no repeat, n = repeat n times, default: -1) */
  repeat?: number;

  /** Enable verbose logging (optional, default: false) */
  verbose?: boolean;

  /** Dry run mode - parse and show settings without converting (optional, default: false) */
  dryRun?: boolean;

  /** Timeout for rendering in milliseconds (optional, default: 60000) */
  timeout?: number;

  /** Progress callback function */
  onProgress?: (progress: ConversionProgress) => void;
}

/**
 * Overall conversion progress information
 */
export interface ConversionProgress {
  /** Current phase of conversion */
  phase: 'parsing' | 'rendering' | 'encoding' | 'complete';

  /** Overall progress percentage (0-100) */
  percentage: number;

  /** Current step description */
  message: string;

  /** Additional details specific to current phase */
  details?: {
    currentFrame?: number;
    totalFrames?: number;
    renderTime?: number;
    encodeTime?: number;
  };
}

/**
 * Result of conversion operation
 */
export interface ConversionResult {
  /** Input file path */
  inputPath: string;

  /** Output file path */
  outputPath: string;

  /** Output file size in bytes */
  fileSize: number;

  /** Total conversion time in milliseconds */
  totalTime: number;

  /** Parsing time in milliseconds */
  parseTime: number;

  /** Rendering time in milliseconds */
  renderTime: number;

  /** Encoding time in milliseconds */
  encodeTime: number;

  /** Source animation metadata */
  source: {
    width: number;
    height: number;
    frameRate: number;
    duration: number;
    totalFrames: number;
  };

  /** Output GIF metadata */
  output: {
    width: number;
    height: number;
    frameRate: number;
    frameCount: number;
    fileSize: number;
  };
}

/**
 * Custom error class for conversion errors
 */
export class ConversionError extends Error {
  constructor(
    message: string,
    public readonly phase: 'parsing' | 'rendering' | 'encoding',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ConversionError';
    Object.setPrototypeOf(this, ConversionError.prototype);
  }
}
