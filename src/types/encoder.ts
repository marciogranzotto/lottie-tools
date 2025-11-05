/**
 * TypeScript type definitions for GIF encoder
 */

import { RenderedFrame } from './renderer';

/**
 * Configuration options for GIF encoding
 */
export interface EncodeOptions {
  /** Output file path for the GIF */
  outputPath: string;

  /** Array of rendered frames to encode */
  frames: RenderedFrame[];

  /** Frame rate (frames per second) */
  fps: number;

  /** Quality setting (1-100, higher is better but larger file size) */
  quality?: number;

  /** Enable dithering for better color representation (default: false) */
  dither?: boolean;

  /** Repeat count (-1 = loop forever, 0 = no repeat, n = repeat n times) */
  repeat?: number;

  /** Background color in CSS format (e.g., "#FFFFFF", "transparent") */
  backgroundColor?: string;

  /** Progress callback function */
  onProgress?: (progress: EncodeProgress) => void;
}

/**
 * Progress information during encoding
 */
export interface EncodeProgress {
  /** Current frame being encoded */
  currentFrame: number;

  /** Total number of frames */
  totalFrames: number;

  /** Progress percentage (0-100) */
  percentage: number;

  /** Current phase of encoding */
  phase: 'initializing' | 'encoding' | 'finalizing' | 'writing';
}

/**
 * Result of encoding operation
 */
export interface EncodeResult {
  /** Output file path */
  outputPath: string;

  /** File size in bytes */
  fileSize: number;

  /** Total encoding time in milliseconds */
  encodeTime: number;

  /** Number of frames encoded */
  frameCount: number;

  /** Frame rate used */
  fps: number;

  /** Output dimensions */
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Custom error class for encoding errors
 */
export class EncodeError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'EncodeError';
    Object.setPrototypeOf(this, EncodeError.prototype);
  }
}
