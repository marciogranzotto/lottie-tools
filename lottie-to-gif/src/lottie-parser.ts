/**
 * Lottie JSON Parser and Validator
 * Reads and validates Lottie animation files
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  LottieAnimation,
  LottieMetadata,
  ParseResult,
  ValidationError,
  LottieParseError,
} from './types/lottie';

/**
 * Reads a Lottie JSON file from disk
 * @param filePath - Path to the Lottie JSON file
 * @returns Promise resolving to parsed Lottie data
 * @throws LottieParseError if file cannot be read or parsed
 */
export async function readLottieFile(filePath: string): Promise<LottieAnimation> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new LottieParseError(`File not found: ${filePath}`);
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new LottieParseError(`Path is not a file: ${filePath}`);
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse JSON
    let data: any;
    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new LottieParseError(
        `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return data;
  } catch (error) {
    if (error instanceof LottieParseError) {
      throw error;
    }
    throw new LottieParseError(
      `Failed to read Lottie file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validates that the JSON data is a valid Lottie animation
 * @param data - Parsed JSON data
 * @returns Array of validation errors (empty if valid)
 */
export function validateLottieData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Data must be an object',
      value: typeof data,
    });
    return errors;
  }

  // Required fields validation
  const requiredFields = [
    { field: 'v', type: 'string', name: 'version' },
    { field: 'fr', type: 'number', name: 'frame rate' },
    { field: 'w', type: 'number', name: 'width' },
    { field: 'h', type: 'number', name: 'height' },
    { field: 'layers', type: 'object', name: 'layers', isArray: true },
  ];

  for (const { field, type, name, isArray } of requiredFields) {
    if (!(field in data)) {
      errors.push({
        field,
        message: `Missing required field: ${name}`,
      });
    } else {
      const value = data[field];
      if (isArray && !Array.isArray(value)) {
        errors.push({
          field,
          message: `Field '${name}' must be an array`,
          value: typeof value,
        });
      } else if (!isArray && typeof value !== type) {
        errors.push({
          field,
          message: `Field '${name}' must be of type ${type}`,
          value: typeof value,
        });
      }
    }
  }

  // Validate numeric constraints
  if (typeof data.w === 'number' && data.w <= 0) {
    errors.push({
      field: 'w',
      message: 'Width must be greater than 0',
      value: data.w,
    });
  }

  if (typeof data.h === 'number' && data.h <= 0) {
    errors.push({
      field: 'h',
      message: 'Height must be greater than 0',
      value: data.h,
    });
  }

  if (typeof data.fr === 'number' && data.fr <= 0) {
    errors.push({
      field: 'fr',
      message: 'Frame rate must be greater than 0',
      value: data.fr,
    });
  }

  // Validate layers array is not empty
  if (Array.isArray(data.layers) && data.layers.length === 0) {
    errors.push({
      field: 'layers',
      message: 'Layers array cannot be empty',
      value: data.layers.length,
    });
  }

  return errors;
}

/**
 * Extracts metadata from validated Lottie animation data
 * @param data - Validated Lottie animation data
 * @returns Extracted metadata
 */
export function extractMetadata(data: LottieAnimation): LottieMetadata {
  const inPoint = data.ip ?? 0;
  const outPoint = data.op ?? 0;
  const frameRate = data.fr;
  const totalFrames = outPoint - inPoint;
  const duration = totalFrames / frameRate;

  return {
    version: data.v,
    width: data.w,
    height: data.h,
    frameRate,
    inPoint,
    outPoint,
    totalFrames,
    duration,
    name: data.nm,
    backgroundColor: data.bg, // Background color from Lottie JSON
  };
}

/**
 * Parses and validates a Lottie JSON file
 * @param filePath - Path to the Lottie JSON file
 * @returns Promise resolving to parse result with data and metadata
 * @throws LottieParseError if validation fails
 */
export async function parseLottieFile(filePath: string): Promise<ParseResult> {
  // Read the file
  const data = await readLottieFile(filePath);

  // Validate the data
  const validationErrors = validateLottieData(data);
  if (validationErrors.length > 0) {
    throw new LottieParseError('Lottie validation failed', validationErrors);
  }

  // Extract metadata
  const metadata = extractMetadata(data);

  return {
    data,
    metadata,
  };
}

/**
 * Checks if a file is a valid Lottie animation (non-throwing version)
 * @param filePath - Path to the file to check
 * @returns Promise resolving to true if valid, false otherwise
 */
export async function isValidLottieFile(filePath: string): Promise<boolean> {
  try {
    await parseLottieFile(filePath);
    return true;
  } catch {
    return false;
  }
}
