/**
 * TypeScript type definitions for Lottie JSON format
 * Based on Lottie/Bodymovin specification
 */

// Keyframe for animated properties
export interface LottieKeyframe {
  t: number;  // Time (frame number)
  s: number[] | number;  // Start value
  e?: number[] | number; // End value (for bezier)
  i?: { x: number[]; y: number[] }; // In tangent (easing)
  o?: { x: number[]; y: number[] }; // Out tangent (easing)
  h?: 1; // Hold frame (no interpolation)
}

// Animated property
export interface LottieAnimatedProperty {
  a: 0 | 1;  // 0 = not animated, 1 = animated
  k: number | number[] | LottieKeyframe[];  // Value or keyframes
}

// Transform properties (ks)
export interface LottieTransform {
  p: LottieAnimatedProperty;  // Position [x, y]
  a: LottieAnimatedProperty;  // Anchor point [x, y]
  s: LottieAnimatedProperty;  // Scale [x%, y%]
  r: LottieAnimatedProperty;  // Rotation (degrees)
  o: LottieAnimatedProperty;  // Opacity (0-100)
}

// Shape types
export type LottieShapeType = 'rc' | 'el' | 'sr' | 'sh' | 'fl' | 'st' | 'tr' | 'gr';

// Base shape
export interface LottieShape {
  ty: LottieShapeType;
  nm: string;  // Name
  hd?: boolean; // Hidden
}

// Rectangle shape
export interface LottieRectShape extends LottieShape {
  ty: 'rc';
  p: LottieAnimatedProperty;  // Position
  s: LottieAnimatedProperty;  // Size [width, height]
  r: LottieAnimatedProperty;  // Roundness
}

// Ellipse shape
export interface LottieEllipseShape extends LottieShape {
  ty: 'el';
  p: LottieAnimatedProperty;  // Position (center)
  s: LottieAnimatedProperty;  // Size [width, height]
}

// Path shape
export interface LottiePathShape extends LottieShape {
  ty: 'sh';
  ks: LottieAnimatedProperty;  // Path data
}

// Fill shape
export interface LottieFillShape extends LottieShape {
  ty: 'fl';
  c: LottieAnimatedProperty;  // Color [r, g, b, a] (normalized 0-1)
  o: LottieAnimatedProperty;  // Opacity (0-100)
}

// Stroke shape
export interface LottieStrokeShape extends LottieShape {
  ty: 'st';
  c: LottieAnimatedProperty;  // Color [r, g, b, a] (normalized 0-1)
  o: LottieAnimatedProperty;  // Opacity (0-100)
  w: LottieAnimatedProperty;  // Width
  lc: 1 | 2 | 3;  // Line cap (1=butt, 2=round, 3=square)
  lj: 1 | 2 | 3;  // Line join (1=miter, 2=round, 3=bevel)
}

// Transform for groups
export interface LottieTransformShape extends LottieShape {
  ty: 'tr';
  p: LottieAnimatedProperty;
  a: LottieAnimatedProperty;
  s: LottieAnimatedProperty;
  r: LottieAnimatedProperty;
  o: LottieAnimatedProperty;
}

// Group shape
export interface LottieGroupShape extends LottieShape {
  ty: 'gr';
  it: (LottieShape | LottieRectShape | LottieEllipseShape | LottiePathShape | LottieFillShape | LottieStrokeShape | LottieTransformShape)[];
  np: number;  // Number of properties
}

// Layer types
export type LottieLayerType = 0 | 1 | 2 | 3 | 4 | 5;

// Base layer
export interface LottieLayer {
  ty: LottieLayerType;  // 0=precomp, 1=solid, 2=image, 3=null, 4=shape, 5=text
  nm: string;           // Name
  ind: number;          // Index
  ip: number;           // In point (start frame)
  op: number;           // Out point (end frame)
  st: number;           // Start time
  ks: LottieTransform;  // Transform
  ao?: number;          // Auto-orient
  ddd?: 0 | 1;          // 3D layer
  parent?: number;      // Parent layer index
}

// Shape layer (type 4)
export interface LottieShapeLayer extends LottieLayer {
  ty: 4;
  shapes: (LottieShape | LottieRectShape | LottieEllipseShape | LottiePathShape | LottieFillShape | LottieStrokeShape | LottieGroupShape)[];
}

// Main composition
export interface LottieAnimation {
  v: string;         // Bodymovin version
  fr: number;        // Frame rate
  ip: number;        // In point (start frame)
  op: number;        // Out point (end frame)
  w: number;         // Width
  h: number;         // Height
  nm?: string;       // Name
  ddd?: 0 | 1;       // 3D
  assets?: any[];    // External assets
  layers: LottieLayer[];
}
