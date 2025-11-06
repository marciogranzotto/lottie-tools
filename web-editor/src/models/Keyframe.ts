/**
 * Property types that can be animated
 */
export type AnimatableProperty =
  | 'x'
  | 'y'
  | 'scaleX'
  | 'scaleY'
  | 'rotation'
  | 'opacity';

/**
 * Easing function types
 */
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

/**
 * Value type for keyframes (can be number or string for colors)
 */
export type KeyframeValue = number | string;

/**
 * Keyframe represents a single animation keyframe
 */
export interface Keyframe {
  id: string;
  time: number; // Time in seconds
  property: AnimatableProperty;
  value: KeyframeValue;
  easing: EasingType;
}

/**
 * Animation track for a specific property of a layer
 */
export interface PropertyTrack {
  layerId: string;
  property: AnimatableProperty;
  keyframes: Keyframe[];
}

/**
 * Complete animation data for the project
 */
export interface Animation {
  tracks: PropertyTrack[];
  duration: number; // Total duration in seconds
  fps: number; // Frames per second
  loop: boolean;
}
