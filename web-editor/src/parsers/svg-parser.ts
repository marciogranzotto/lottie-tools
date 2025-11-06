import type {
  AnyElement,
  CircleElement,
  EllipseElement,
  GroupElement,
  PathElement,
  PolygonElement,
  PolylineElement,
  RectElement,
  Style,
  Transform,
} from '../models/Element';
import type { Layer } from '../models/Layer';

/**
 * Result of parsing an SVG
 */
export interface SVGParseResult {
  success: boolean;
  layers: Layer[];
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `el_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse transform attribute
 */
function parseTransform(transformAttr: string | null): Transform {
  const transform: Transform = {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  };

  if (!transformAttr) return transform;

  // Parse translate
  const translateMatch = transformAttr.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
  if (translateMatch) {
    transform.x = parseFloat(translateMatch[1]);
    transform.y = parseFloat(translateMatch[2]);
  }

  // Parse scale
  const scaleMatch = transformAttr.match(/scale\(([-\d.]+)(?:[,\s]+([-\d.]+))?\)/);
  if (scaleMatch) {
    transform.scaleX = parseFloat(scaleMatch[1]);
    transform.scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : transform.scaleX;
  }

  // Parse rotate
  const rotateMatch = transformAttr.match(/rotate\(([-\d.]+)\)/);
  if (rotateMatch) {
    transform.rotation = parseFloat(rotateMatch[1]);
  }

  return transform;
}

/**
 * Parse style attributes
 */
function parseStyle(element: Element): Style {
  const style: Style = {};

  const fill = element.getAttribute('fill');
  if (fill && fill !== 'none') {
    style.fill = fill;
  }

  const stroke = element.getAttribute('stroke');
  if (stroke && stroke !== 'none') {
    style.stroke = stroke;
  }

  const strokeWidth = element.getAttribute('stroke-width');
  if (strokeWidth) {
    style.strokeWidth = parseFloat(strokeWidth);
  }

  const opacity = element.getAttribute('opacity');
  if (opacity) {
    style.opacity = parseFloat(opacity);
  }

  return style;
}

/**
 * Parse a rect element
 */
function parseRect(element: Element): RectElement {
  const id = element.getAttribute('id') || generateId();
  const transform = parseTransform(element.getAttribute('transform'));
  const style = parseStyle(element);

  return {
    id,
    type: 'rect',
    name: `Rect ${id}`,
    transform,
    style,
    x: parseFloat(element.getAttribute('x') || '0'),
    y: parseFloat(element.getAttribute('y') || '0'),
    width: parseFloat(element.getAttribute('width') || '0'),
    height: parseFloat(element.getAttribute('height') || '0'),
    rx: element.getAttribute('rx') ? parseFloat(element.getAttribute('rx')!) : undefined,
    ry: element.getAttribute('ry') ? parseFloat(element.getAttribute('ry')!) : undefined,
  };
}

/**
 * Parse a circle element
 */
function parseCircle(element: Element): CircleElement {
  const id = element.getAttribute('id') || generateId();
  const transform = parseTransform(element.getAttribute('transform'));
  const style = parseStyle(element);

  return {
    id,
    type: 'circle',
    name: `Circle ${id}`,
    transform,
    style,
    cx: parseFloat(element.getAttribute('cx') || '0'),
    cy: parseFloat(element.getAttribute('cy') || '0'),
    r: parseFloat(element.getAttribute('r') || '0'),
  };
}

/**
 * Parse an ellipse element
 */
function parseEllipse(element: Element): EllipseElement {
  const id = element.getAttribute('id') || generateId();
  const transform = parseTransform(element.getAttribute('transform'));
  const style = parseStyle(element);

  return {
    id,
    type: 'ellipse',
    name: `Ellipse ${id}`,
    transform,
    style,
    cx: parseFloat(element.getAttribute('cx') || '0'),
    cy: parseFloat(element.getAttribute('cy') || '0'),
    rx: parseFloat(element.getAttribute('rx') || '0'),
    ry: parseFloat(element.getAttribute('ry') || '0'),
  };
}

/**
 * Parse a path element
 */
function parsePath(element: Element): PathElement {
  const id = element.getAttribute('id') || generateId();
  const transform = parseTransform(element.getAttribute('transform'));
  const style = parseStyle(element);

  return {
    id,
    type: 'path',
    name: `Path ${id}`,
    transform,
    style,
    d: element.getAttribute('d') || '',
  };
}

/**
 * Parse a polygon element
 */
function parsePolygon(element: Element): PolygonElement {
  const id = element.getAttribute('id') || generateId();
  const transform = parseTransform(element.getAttribute('transform'));
  const style = parseStyle(element);

  return {
    id,
    type: 'polygon',
    name: `Polygon ${id}`,
    transform,
    style,
    points: element.getAttribute('points') || '',
  };
}

/**
 * Parse a polyline element
 */
function parsePolyline(element: Element): PolylineElement {
  const id = element.getAttribute('id') || generateId();
  const transform = parseTransform(element.getAttribute('transform'));
  const style = parseStyle(element);

  return {
    id,
    type: 'polyline',
    name: `Polyline ${id}`,
    transform,
    style,
    points: element.getAttribute('points') || '',
  };
}

/**
 * Parse an element recursively
 */
function parseElement(element: Element): AnyElement | null {
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case 'rect':
      return parseRect(element);
    case 'circle':
      return parseCircle(element);
    case 'ellipse':
      return parseEllipse(element);
    case 'path':
      return parsePath(element);
    case 'polygon':
      return parsePolygon(element);
    case 'polyline':
      return parsePolyline(element);
    case 'g':
      return parseGroup(element);
    default:
      return null; // Unsupported element
  }
}

/**
 * Parse a group element
 */
function parseGroup(element: Element): GroupElement {
  const id = element.getAttribute('id') || generateId();
  const transform = parseTransform(element.getAttribute('transform'));
  const style = parseStyle(element);

  const children: AnyElement[] = [];
  Array.from(element.children).forEach((child) => {
    const parsed = parseElement(child as Element);
    if (parsed) {
      children.push(parsed);
    }
  });

  return {
    id,
    type: 'group',
    name: `Group ${id}`,
    transform,
    style,
    children,
  };
}

/**
 * Parse SVG string to layers
 */
export function parseSVG(svgString: string): SVGParseResult {
  try {
    // Parse SVG using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        success: false,
        layers: [],
        error: 'Invalid SVG: ' + parserError.textContent,
      };
    }

    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      return {
        success: false,
        layers: [],
        error: 'No SVG element found',
      };
    }

    // Extract dimensions
    let width: number | undefined;
    let height: number | undefined;

    // Try to get from viewBox first
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/);
      if (parts.length === 4) {
        width = parseFloat(parts[2]);
        height = parseFloat(parts[3]);
      }
    }

    // Fall back to width/height attributes
    if (!width) {
      const widthAttr = svgElement.getAttribute('width');
      if (widthAttr) {
        width = parseFloat(widthAttr);
      }
    }
    if (!height) {
      const heightAttr = svgElement.getAttribute('height');
      if (heightAttr) {
        height = parseFloat(heightAttr);
      }
    }

    // Parse all child elements
    const layers: Layer[] = [];
    Array.from(svgElement.children).forEach((child) => {
      const element = parseElement(child as Element);
      if (element) {
        layers.push({
          id: generateId(),
          name: element.name,
          element,
          visible: true,
          locked: false,
        });
      }
    });

    return {
      success: true,
      layers,
      width,
      height,
    };
  } catch (error) {
    return {
      success: false,
      layers: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
