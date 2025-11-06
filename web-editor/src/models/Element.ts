/**
 * Element types supported in the animation
 */
export type ElementType = 'rect' | 'circle' | 'ellipse' | 'path' | 'polygon' | 'polyline' | 'group';

/**
 * Transform data for positioning, scaling, and rotating elements
 */
export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // degrees
}

/**
 * Style properties for visual appearance
 */
export interface Style {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

/**
 * Base element interface
 */
export interface Element {
  id: string;
  type: ElementType;
  name: string;
  transform: Transform;
  style: Style;
}

/**
 * Rectangle element
 */
export interface RectElement extends Element {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number; // border radius x
  ry?: number; // border radius y
}

/**
 * Circle element
 */
export interface CircleElement extends Element {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

/**
 * Ellipse element
 */
export interface EllipseElement extends Element {
  type: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * Path element (complex shapes)
 */
export interface PathElement extends Element {
  type: 'path';
  d: string; // path data
}

/**
 * Polygon element
 */
export interface PolygonElement extends Element {
  type: 'polygon';
  points: string;
}

/**
 * Polyline element
 */
export interface PolylineElement extends Element {
  type: 'polyline';
  points: string;
}

/**
 * Union type for all element types (declared before GroupElement to resolve circular reference)
 */
export type AnyElement =
  | RectElement
  | CircleElement
  | EllipseElement
  | PathElement
  | PolygonElement
  | PolylineElement
  | GroupElement;

/**
 * Group element (container for other elements)
 */
export interface GroupElement extends Element {
  type: 'group';
  children: AnyElement[];
}
