/**
 * TypeScript type definitions for Lottie JSON structure
 * Based on Bodymovin/Lottie specification
 */

/**
 * Main Lottie animation data structure
 */
export interface LottieAnimation {
  v: string;           // Lottie version (e.g., "5.7.0")
  fr: number;          // Frame rate (frames per second)
  ip: number;          // In Point (start frame)
  op: number;          // Out Point (end frame)
  w: number;           // Width in pixels
  h: number;           // Height in pixels
  nm?: string;         // Name
  ddd?: number;        // 3D flag
  bg?: string;         // Background color (hex format, e.g., "#FFFFFF")
  assets?: any[];      // Assets array
  layers: any[];       // Layers array
  markers?: any[];     // Markers
  meta?: {             // Metadata
    g?: string;        // Generator
    [key: string]: any;
  };
  [key: string]: any;  // Allow additional properties
}

/**
 * Parsed animation metadata extracted from Lottie JSON
 */
export interface LottieMetadata {
  version: string;     // Lottie version
  width: number;       // Animation width in pixels
  height: number;      // Animation height in pixels
  frameRate: number;   // Frames per second
  inPoint: number;     // Start frame
  outPoint: number;    // End frame
  duration: number;    // Duration in seconds
  totalFrames: number; // Total number of frames
  name?: string;       // Animation name (if provided)
  backgroundColor?: string; // Background color (hex format, null if transparent)
}

/**
 * Result of parsing a Lottie file
 */
export interface ParseResult {
  data: LottieAnimation;     // Raw Lottie JSON data
  metadata: LottieMetadata;  // Extracted metadata
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;       // Field that failed validation
  message: string;     // Error message
  value?: any;         // Actual value (if relevant)
}

/**
 * Custom error class for Lottie parsing errors
 */
export class LottieParseError extends Error {
  public readonly errors?: ValidationError[];

  constructor(message: string, errors?: ValidationError[]) {
    super(message);
    this.name = 'LottieParseError';
    this.errors = errors;
    Object.setPrototypeOf(this, LottieParseError.prototype);
  }
}
