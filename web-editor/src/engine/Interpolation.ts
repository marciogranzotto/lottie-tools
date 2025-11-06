import type { Keyframe, KeyframeValue } from '../models/Keyframe';

/**
 * Linear interpolation between two values
 * @param start - Starting value
 * @param end - Ending value
 * @param t - Interpolation factor (0-1), clamped automatically
 * @returns Interpolated value
 */
export function interpolateLinear(start: number, end: number, t: number): number {
  // Clamp t to 0-1 range
  const clampedT = Math.max(0, Math.min(1, t));
  return start + (end - start) * clampedT;
}

/**
 * Easing function: ease-in (slow start, accelerates towards end)
 * Uses quadratic easing
 * @param t - Interpolation factor (0-1)
 * @returns Eased value (0-1)
 */
export function easeIn(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped;
}

/**
 * Easing function: ease-out (fast start, decelerates towards end)
 * Uses quadratic easing
 * @param t - Interpolation factor (0-1)
 * @returns Eased value (0-1)
 */
export function easeOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * (2 - clamped);
}

/**
 * Easing function: ease-in-out (slow start, fast middle, slow end)
 * Uses cubic easing
 * @param t - Interpolation factor (0-1)
 * @returns Eased value (0-1)
 */
export function easeInOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.5) {
    return 4 * clamped * clamped * clamped;
  } else {
    return 1 - Math.pow(-2 * clamped + 2, 3) / 2;
  }
}

/**
 * Apply easing function to interpolation factor
 * @param t - Interpolation factor (0-1)
 * @param easing - Easing function name
 * @returns Eased interpolation factor (0-1)
 */
export function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'ease-in':
    case 'easeIn':
      return easeIn(t);
    case 'ease-out':
    case 'easeOut':
      return easeOut(t);
    case 'ease-in-out':
    case 'easeInOut':
      return easeInOut(t);
    case 'linear':
    default:
      return Math.max(0, Math.min(1, t));
  }
}

/**
 * Convert hex color to RGB components
 * @param hex - Hex color string (#RRGGBB or #RGB)
 * @returns Object with r, g, b components (0-255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }

  // Handle 6-digit hex
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Convert RGB components to hex color
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string (#RRGGBB)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolate between two colors
 * @param color1 - Starting color (hex string)
 * @param color2 - Ending color (hex string)
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated color (hex string)
 */
export function interpolateColor(color1: string, color2: string, t: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = interpolateLinear(rgb1.r, rgb2.r, t);
  const g = interpolateLinear(rgb1.g, rgb2.g, t);
  const b = interpolateLinear(rgb1.b, rgb2.b, t);

  return rgbToHex(r, g, b);
}

/**
 * Find the keyframes before and after a given time
 * @param keyframes - Array of keyframes (must be sorted by time)
 * @param time - Time to find bounds for
 * @returns Object with before and after keyframes, or null if not found
 */
export function findKeyframeBounds(
  keyframes: Keyframe[],
  time: number
): { before: Keyframe; after: Keyframe } | null {
  // Handle edge cases
  if (keyframes.length === 0 || keyframes.length === 1) {
    return null;
  }

  // If time is before first keyframe or after last keyframe
  if (time < keyframes[0].time || time > keyframes[keyframes.length - 1].time) {
    return null;
  }

  // Find the surrounding keyframes
  for (let i = 0; i < keyframes.length - 1; i++) {
    const currentKeyframe = keyframes[i];
    const nextKeyframe = keyframes[i + 1];

    // If time exactly matches a keyframe, use it as the start of the next segment
    if (time === nextKeyframe.time && i < keyframes.length - 2) {
      return {
        before: nextKeyframe,
        after: keyframes[i + 2],
      };
    }

    // Find the range that contains the time
    if (time >= currentKeyframe.time && time < nextKeyframe.time) {
      return {
        before: currentKeyframe,
        after: nextKeyframe,
      };
    }

    // Handle the case where time equals the last segment's start
    if (time === currentKeyframe.time && i === keyframes.length - 2) {
      return {
        before: currentKeyframe,
        after: nextKeyframe,
      };
    }
  }

  return null;
}

/**
 * Interpolate between two keyframes at a given time
 * @param keyframe1 - Starting keyframe
 * @param keyframe2 - Ending keyframe
 * @param time - Time to interpolate at
 * @returns Interpolated value
 */
export function interpolateKeyframes(
  keyframe1: Keyframe,
  keyframe2: Keyframe,
  time: number
): number {
  const value1 = typeof keyframe1.value === 'number' ? keyframe1.value : 0;
  const value2 = typeof keyframe2.value === 'number' ? keyframe2.value : 0;

  // Handle exact time matches
  if (time <= keyframe1.time) {
    return value1;
  }
  if (time >= keyframe2.time) {
    return value2;
  }

  // Calculate interpolation factor
  const duration = keyframe2.time - keyframe1.time;
  const elapsed = time - keyframe1.time;
  const t = duration > 0 ? elapsed / duration : 0;

  // Apply easing function from keyframe
  const easedT = applyEasing(t, keyframe1.easing);

  return interpolateLinear(value1, value2, easedT);
}

/**
 * Get the interpolated value at a specific time for a set of keyframes
 * @param keyframes - Array of keyframes
 * @param time - Time to get value at
 * @returns Interpolated value at the given time
 */
export function getValueAtTime(keyframes: Keyframe[], time: number): number {
  // Handle empty array
  if (keyframes.length === 0) {
    return 0;
  }

  // Handle single keyframe
  if (keyframes.length === 1) {
    return typeof keyframes[0].value === 'number' ? keyframes[0].value : 0;
  }

  // Sort keyframes by time (in case they're not sorted)
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

  // If time is before first keyframe, return first value
  if (time <= sortedKeyframes[0].time) {
    return typeof sortedKeyframes[0].value === 'number' ? sortedKeyframes[0].value : 0;
  }

  // If time is after last keyframe, return last value
  if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    const lastValue = sortedKeyframes[sortedKeyframes.length - 1].value;
    return typeof lastValue === 'number' ? lastValue : 0;
  }

  // Find surrounding keyframes and interpolate
  const bounds = findKeyframeBounds(sortedKeyframes, time);
  if (bounds) {
    return interpolateKeyframes(bounds.before, bounds.after, time);
  }

  // Fallback (should never reach here)
  return 0;
}

/**
 * Get the interpolated color value at a specific time for a set of keyframes
 * @param keyframes - Array of keyframes with color values
 * @param time - Time to get color at
 * @returns Interpolated color (hex string) at the given time
 */
export function getColorAtTime(keyframes: Keyframe[], time: number): string {
  // Handle empty array
  if (keyframes.length === 0) {
    return '#000000';
  }

  // Handle single keyframe
  if (keyframes.length === 1) {
    return typeof keyframes[0].value === 'string' ? keyframes[0].value : '#000000';
  }

  // Sort keyframes by time
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

  // If time is before first keyframe, return first value
  if (time <= sortedKeyframes[0].time) {
    return typeof sortedKeyframes[0].value === 'string' ? sortedKeyframes[0].value : '#000000';
  }

  // If time is after last keyframe, return last value
  if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    const lastValue = sortedKeyframes[sortedKeyframes.length - 1].value;
    return typeof lastValue === 'string' ? lastValue : '#000000';
  }

  // Find surrounding keyframes and interpolate
  const bounds = findKeyframeBounds(sortedKeyframes, time);
  if (bounds) {
    const color1 = typeof bounds.before.value === 'string' ? bounds.before.value : '#000000';
    const color2 = typeof bounds.after.value === 'string' ? bounds.after.value : '#000000';

    // Calculate interpolation factor
    const duration = bounds.after.time - bounds.before.time;
    const elapsed = time - bounds.before.time;
    const t = duration > 0 ? elapsed / duration : 0;

    // Apply easing function from keyframe
    const easedT = applyEasing(t, bounds.before.easing);

    return interpolateColor(color1, color2, easedT);
  }

  // Fallback
  return '#000000';
}
