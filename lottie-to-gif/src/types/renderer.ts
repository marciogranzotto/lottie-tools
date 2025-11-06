/**
 * TypeScript type definitions for Lottie renderer
 */

import { LottieAnimation } from './lottie';

/**
 * Configuration options for rendering
 */
export interface RenderOptions {
  /** Lottie animation data */
  animationData: LottieAnimation;

  /** Output width in pixels (defaults to animation width) */
  width?: number;

  /** Output height in pixels (defaults to animation height) */
  height?: number;

  /** Frames per second (defaults to animation frame rate) */
  fps?: number;

  /** Background color in CSS format (e.g., "#FFFFFF", "rgba(255,255,255,0.5)", or "transparent") */
  backgroundColor?: string;

  /** Timeout for rendering in milliseconds (default: 60000) */
  timeout?: number;

  /** Progress callback function */
  onProgress?: (progress: RenderProgress) => void;
}

/**
 * Progress information during rendering
 */
export interface RenderProgress {
  /** Current frame number being rendered */
  currentFrame: number;

  /** Total number of frames to render */
  totalFrames: number;

  /** Progress percentage (0-100) */
  percentage: number;

  /** Current time in the animation (seconds) */
  currentTime: number;

  /** Total duration (seconds) */
  totalDuration: number;
}

/**
 * A single rendered frame
 */
export interface RenderedFrame {
  /** Frame number (0-indexed) */
  frameNumber: number;

  /** Time in animation (seconds) */
  time: number;

  /** Image data as PNG buffer */
  buffer: Buffer;

  /** Width in pixels */
  width: number;

  /** Height in pixels */
  height: number;
}

/**
 * Result of rendering operation
 */
export interface RenderResult {
  /** Array of rendered frames */
  frames: RenderedFrame[];

  /** Total number of frames rendered */
  frameCount: number;

  /** Rendering duration in milliseconds */
  renderTime: number;

  /** Output dimensions */
  dimensions: {
    width: number;
    height: number;
  };

  /** Frame rate used */
  fps: number;
}

/**
 * Custom error class for rendering errors
 */
export class RenderError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RenderError';
    Object.setPrototypeOf(this, RenderError.prototype);
  }
}
