import type { Project } from '../models/Project';
import type { Layer } from '../models/Layer';
import type { Keyframe } from '../models/Keyframe';
import type {
  LottieAnimation,
  LottieShapeLayer,
  LottieTransform,
  LottieAnimatedProperty,
  LottieKeyframe,
  LottieRectShape,
  LottieEllipseShape,
  LottiePathShape,
  LottieGroupShape,
  LottieFillShape,
  LottieStrokeShape,
  LottieTransformShape,
} from '../models/LottieTypes';
import { svgPathToLottiePath } from '../utils/svg-to-lottie-path';

export class LottieExporter {
  /**
   * Convert easing string to Lottie bezier tangents
   * Returns easing handles in Lottie format with x and y arrays
   */
  private static getEasingTangents(easing: string): {
    i: { x: number[]; y: number[] };
    o: { x: number[]; y: number[] };
  } {
    // Normalize easing string
    const normalizedEasing = easing.toLowerCase().replace(/-/g, '');

    switch (normalizedEasing) {
      case 'linear':
        // Linear: straight interpolation from current to next
        return {
          o: { x: [0, 0], y: [0, 0] },
          i: { x: [1, 1], y: [1, 1] },
        };

      case 'easein':
      case 'esin':
        // Cubic ease-in: starts slow, ends fast
        return {
          o: { x: [0.42, 0.42], y: [0, 0] },
          i: { x: [1, 1], y: [1, 1] },
        };

      case 'easeout':
      case 'esout':
        // Cubic ease-out: starts fast, ends slow
        return {
          o: { x: [0, 0], y: [0, 0] },
          i: { x: [0.58, 0.58], y: [1, 1] },
        };

      case 'easeinout':
      case 'esinout':
        // Cubic ease-in-out: slow start, fast middle, slow end
        return {
          o: { x: [0.333, 0.333], y: [0, 0] },
          i: { x: [0.667, 0.667], y: [1, 1] },
        };

      default:
        // Unknown easing, default to linear
        return {
          o: { x: [0, 0], y: [0, 0] },
          i: { x: [1, 1], y: [1, 1] },
        };
    }
  }

  /**
   * Export a Project to Lottie JSON format
   */
  static exportToLottie(project: Project): LottieAnimation {
    const frameCount = Math.ceil(project.duration * project.fps);

    const lottieAnimation: LottieAnimation = {
      v: '5.5.7',  // Bodymovin version
      fr: project.fps,
      ip: 0,       // Start frame
      op: frameCount,
      w: project.width,
      h: project.height,
      nm: project.name,
      ddd: 0,      // Not 3D
      assets: [],
      layers: project.layers.map((layer, index) =>
        this.convertLayer(layer, index, project.keyframes, project.fps, frameCount)
      ),
    };

    return lottieAnimation;
  }

  /**
   * Convert a Layer to a Lottie layer
   */
  private static convertLayer(
    layer: Layer,
    index: number,
    allKeyframes: Keyframe[],
    fps: number,
    frameCount: number
  ): LottieShapeLayer {
    // Get keyframes for this layer
    const layerKeyframes = allKeyframes.filter(
      (kf: any) => kf.layerId === layer.id
    );

    const lottieLayer: LottieShapeLayer = {
      ty: 4,  // Shape layer
      nm: layer.name,
      ind: index + 1,
      ip: 0,
      op: frameCount,
      st: 0,
      ks: this.convertTransform(layer, layerKeyframes, fps),
      shapes: this.convertShapes(layer, layerKeyframes, fps),
    };

    return lottieLayer;
  }

  /**
   * Convert transform properties (position, rotation, scale, opacity)
   */
  private static convertTransform(
    layer: Layer,
    keyframes: Keyframe[],
    fps: number
  ): LottieTransform {
    const transform = layer.element.transform;
    const style = layer.element.style;
    const element = layer.element;

    // Calculate center point for anchor
    let centerX = 0;
    let centerY = 0;

    if (element.type === 'rect') {
      centerX = element.x + element.width / 2;
      centerY = element.y + element.height / 2;
    } else if (element.type === 'circle') {
      centerX = element.cx;
      centerY = element.cy;
    } else if (element.type === 'ellipse') {
      centerX = element.cx;
      centerY = element.cy;
    } else if (element.type === 'path') {
      // For paths, calculate bounding box center
      const pathData = svgPathToLottiePath(element.d);
      if (pathData.v.length > 0) {
        const xs = pathData.v.map(v => v[0]);
        const ys = pathData.v.map(v => v[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        centerX = (minX + maxX) / 2;
        centerY = (minY + maxY) / 2;
      }
    }

    // Position = transform + center offset
    const posX = transform.x + centerX;
    const posY = transform.y + centerY;

    return {
      p: this.convertPositionProperty(posX, posY, keyframes, 'x', 'y', fps),
      a: { a: 0, k: [centerX, centerY] },  // Anchor at shape center
      s: this.convertScaleProperty(transform.scaleX, transform.scaleY, keyframes, fps),
      r: this.convertRotationProperty(transform.rotation, keyframes, fps),
      o: this.convertOpacityProperty(style.opacity ?? 1, keyframes, fps),
    };
  }

  /**
   * Convert position property (combines x and y)
   */
  private static convertPositionProperty(
    defaultX: number,
    defaultY: number,
    keyframes: Keyframe[],
    xProp: string,
    yProp: string,
    fps: number
  ): LottieAnimatedProperty {
    const xKeyframes = keyframes.filter(kf => kf.property === xProp);
    const yKeyframes = keyframes.filter(kf => kf.property === yProp);

    if (xKeyframes.length === 0 && yKeyframes.length === 0) {
      // Not animated
      return { a: 0, k: [defaultX, defaultY] };
    }

    // Animated - combine x and y keyframes
    const allTimes = new Set([
      ...xKeyframes.map(kf => kf.time),
      ...yKeyframes.map(kf => kf.time),
    ]);

    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

    const lottieKeyframes: LottieKeyframe[] = sortedTimes.map((time, index) => {
      const xKf = xKeyframes.find(kf => kf.time === time);
      const yKf = yKeyframes.find(kf => kf.time === time);

      const xValue = xKf ? (typeof xKf.value === 'number' ? xKf.value : defaultX) : defaultX;
      const yValue = yKf ? (typeof yKf.value === 'number' ? yKf.value : defaultY) : defaultY;

      // Get easing from first keyframe that has one
      const easing = (xKf?.easing || yKf?.easing || 'linear');
      const tangents = this.getEasingTangents(easing);

      const keyframe: LottieKeyframe = {
        t: Math.round(time * fps),  // Convert seconds to frames
        s: [xValue, yValue],
      };

      // Add end value for interpolation (if not last keyframe)
      if (index < sortedTimes.length - 1) {
        const nextTime = sortedTimes[index + 1];
        const nextXKf = xKeyframes.find(kf => kf.time === nextTime);
        const nextYKf = yKeyframes.find(kf => kf.time === nextTime);
        const nextX = nextXKf ? (typeof nextXKf.value === 'number' ? nextXKf.value : xValue) : xValue;
        const nextY = nextYKf ? (typeof nextYKf.value === 'number' ? nextYKf.value : yValue) : yValue;
        keyframe.e = [nextX, nextY];
      }

      // Add easing tangents (always present now)
      keyframe.i = tangents.i;
      keyframe.o = tangents.o;

      return keyframe;
    });

    return { a: 1, k: lottieKeyframes };
  }

  /**
   * Convert scale property (as percentage)
   */
  private static convertScaleProperty(
    defaultScaleX: number,
    defaultScaleY: number,
    keyframes: Keyframe[],
    fps: number
  ): LottieAnimatedProperty {
    const scaleXKfs = keyframes.filter(kf => kf.property === 'scaleX');
    const scaleYKfs = keyframes.filter(kf => kf.property === 'scaleY');

    if (scaleXKfs.length === 0 && scaleYKfs.length === 0) {
      // Not animated - convert to percentage
      return { a: 0, k: [defaultScaleX * 100, defaultScaleY * 100] };
    }

    // Animated
    const allTimes = new Set([
      ...scaleXKfs.map(kf => kf.time),
      ...scaleYKfs.map(kf => kf.time),
    ]);

    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

    const lottieKeyframes: LottieKeyframe[] = sortedTimes.map((time, index) => {
      const xKf = scaleXKfs.find(kf => kf.time === time);
      const yKf = scaleYKfs.find(kf => kf.time === time);

      const xValue = xKf ? (typeof xKf.value === 'number' ? xKf.value : defaultScaleX) : defaultScaleX;
      const yValue = yKf ? (typeof yKf.value === 'number' ? yKf.value : defaultScaleY) : defaultScaleY;

      const easing = (xKf?.easing || yKf?.easing || 'linear');
      const tangents = this.getEasingTangents(easing);

      const keyframe: LottieKeyframe = {
        t: Math.round(time * fps),
        s: [xValue * 100, yValue * 100],  // Convert to percentage
      };

      // Add end value for interpolation
      if (index < sortedTimes.length - 1) {
        const nextTime = sortedTimes[index + 1];
        const nextXKf = scaleXKfs.find(kf => kf.time === nextTime);
        const nextYKf = scaleYKfs.find(kf => kf.time === nextTime);
        const nextX = nextXKf ? (typeof nextXKf.value === 'number' ? nextXKf.value : xValue) : xValue;
        const nextY = nextYKf ? (typeof nextYKf.value === 'number' ? nextYKf.value : yValue) : yValue;
        keyframe.e = [nextX * 100, nextY * 100];
      }

      // Add easing tangents (always present now)
      keyframe.i = tangents.i;
      keyframe.o = tangents.o;

      return keyframe;
    });

    return { a: 1, k: lottieKeyframes };
  }

  /**
   * Convert rotation property
   */
  private static convertRotationProperty(
    defaultRotation: number,
    keyframes: Keyframe[],
    fps: number
  ): LottieAnimatedProperty {
    const rotationKfs = keyframes.filter(kf => kf.property === 'rotation');

    if (rotationKfs.length === 0) {
      return { a: 0, k: defaultRotation };
    }

    const lottieKeyframes: LottieKeyframe[] = rotationKfs.map((kf, index) => {
      const value = typeof kf.value === 'number' ? kf.value : defaultRotation;
      const tangents = this.getEasingTangents(kf.easing || 'linear');

      const keyframe: LottieKeyframe = {
        t: Math.round(kf.time * fps),
        s: [value],
      };

      // Add end value
      if (index < rotationKfs.length - 1) {
        const nextValue = typeof rotationKfs[index + 1].value === 'number'
          ? rotationKfs[index + 1].value
          : value;
        keyframe.e = [nextValue];
      }

      // Add easing tangents (always present now)
      keyframe.i = tangents.i;
      keyframe.o = tangents.o;

      return keyframe;
    });

    return { a: 1, k: lottieKeyframes };
  }

  /**
   * Convert opacity property (0-1 to 0-100)
   */
  private static convertOpacityProperty(
    defaultOpacity: number,
    keyframes: Keyframe[],
    fps: number
  ): LottieAnimatedProperty {
    const opacityKfs = keyframes.filter(kf => kf.property === 'opacity');

    if (opacityKfs.length === 0) {
      return { a: 0, k: defaultOpacity * 100 };
    }

    const lottieKeyframes: LottieKeyframe[] = opacityKfs.map((kf, index) => {
      const value = typeof kf.value === 'number' ? kf.value * 100 : defaultOpacity * 100;
      const tangents = this.getEasingTangents(kf.easing || 'linear');

      const keyframe: LottieKeyframe = {
        t: Math.round(kf.time * fps),
        s: [value],
      };

      // Add end value
      if (index < opacityKfs.length - 1) {
        const nextValue = typeof opacityKfs[index + 1].value === 'number'
          ? opacityKfs[index + 1].value * 100
          : value;
        keyframe.e = [nextValue];
      }

      // Add easing tangents (always present now)
      keyframe.i = tangents.i;
      keyframe.o = tangents.o;

      return keyframe;
    });

    return { a: 1, k: lottieKeyframes };
  }

  /**
   * Convert color property (hex to normalized RGB array with animation)
   * Per Lottie spec: all keyframes except the last need i/o tangents
   */
  private static convertColorProperty(
    defaultColor: string,
    keyframes: Keyframe[],
    propertyName: string,
    fps: number
  ): LottieAnimatedProperty {
    const colorKfs = keyframes.filter(kf => kf.property === propertyName);

    if (colorKfs.length === 0) {
      // Not animated - Lottie uses 3-value RGB array [r, g, b], not RGBA
      const rgb = this.hexToRgb(defaultColor);
      return { a: 0, k: [rgb.r / 255, rgb.g / 255, rgb.b / 255] };
    }

    // Animated - all keyframes except last need easing handles
    const lottieKeyframes: any[] = colorKfs.map((kf, index) => {
      const colorValue = typeof kf.value === 'string' ? kf.value : defaultColor;
      const rgb = this.hexToRgb(colorValue);

      const keyframe: any = {
        t: Math.round(kf.time * fps),
        s: [rgb.r / 255, rgb.g / 255, rgb.b / 255],
      };

      // Add easing handles to all keyframes except the last
      if (index < colorKfs.length - 1) {
        const tangents = this.getEasingTangents(kf.easing || 'linear');
        keyframe.o = tangents.o;
        keyframe.i = tangents.i;
      }

      return keyframe;
    });

    return { a: 1, k: lottieKeyframes };
  }

  /**
   * Convert numeric property with animation support
   */
  private static convertNumericProperty(
    defaultValue: number,
    keyframes: Keyframe[],
    propertyName: string,
    fps: number
  ): LottieAnimatedProperty {
    const numericKfs = keyframes.filter(kf => kf.property === propertyName);

    if (numericKfs.length === 0) {
      return { a: 0, k: defaultValue };
    }

    const lottieKeyframes: LottieKeyframe[] = numericKfs.map((kf, index) => {
      const value = typeof kf.value === 'number' ? kf.value : defaultValue;
      const tangents = this.getEasingTangents(kf.easing || 'linear');

      const keyframe: LottieKeyframe = {
        t: Math.round(kf.time * fps),
        s: [value],
      };

      // Add end value
      if (index < numericKfs.length - 1) {
        const nextValue = typeof numericKfs[index + 1].value === 'number'
          ? numericKfs[index + 1].value
          : value;
        keyframe.e = [nextValue];
      }

      // Add easing tangents (always present now)
      keyframe.i = tangents.i;
      keyframe.o = tangents.o;

      return keyframe;
    });

    return { a: 1, k: lottieKeyframes };
  }

  /**
   * Convert element shapes to Lottie shapes
   */
  private static convertShapes(
    layer: Layer,
    keyframes: Keyframe[],
    fps: number
  ): (LottieRectShape | LottieEllipseShape | LottiePathShape | LottieGroupShape | LottieFillShape | LottieStrokeShape)[] {
    const element = layer.element;
    const shapes: any[] = [];

    // Create group for shape + fill + stroke
    const groupItems: any[] = [];

    // Add shape geometry
    // Shapes are positioned relative to the group transform anchor
    // Since layer anchor is at shape center, shapes are centered at origin
    if (element.type === 'rect') {
      const rectShape: LottieRectShape = {
        ty: 'rc',
        nm: 'Rectangle',
        p: { a: 0, k: [0, 0] },  // Centered at origin (anchor handles positioning)
        s: { a: 0, k: [element.width, element.height] },
        r: { a: 0, k: 0 },  // Roundness
      };
      groupItems.push(rectShape);
    } else if (element.type === 'ellipse') {
      const ellipseShape: LottieEllipseShape = {
        ty: 'el',
        nm: 'Ellipse',
        p: { a: 0, k: [0, 0] },  // Centered at origin
        s: { a: 0, k: [element.rx * 2, element.ry * 2] },
      };
      groupItems.push(ellipseShape);
    } else if (element.type === 'circle') {
      const ellipseShape: LottieEllipseShape = {
        ty: 'el',
        nm: 'Circle',
        p: { a: 0, k: [0, 0] },  // Centered at origin
        s: { a: 0, k: [element.r * 2, element.r * 2] },
      };
      groupItems.push(ellipseShape);
    } else if (element.type === 'path') {
      // Convert SVG path data to Lottie bezier format
      const pathData = svgPathToLottiePath(element.d);

      const pathShape: LottiePathShape = {
        ty: 'sh',
        nm: 'Path',
        ks: {
          a: 0,
          k: pathData
        }
      };
      groupItems.push(pathShape);
    }

    // Add fill
    if (element.style.fill && element.style.fill !== 'none') {
      const fillShape: LottieFillShape = {
        ty: 'fl',
        nm: 'Fill',
        c: this.convertColorProperty(element.style.fill, keyframes, 'fill', fps),
        o: { a: 0, k: 100 },
      };
      groupItems.push(fillShape);
    }

    // Add stroke
    if (element.style.stroke && element.style.stroke !== 'none') {
      const strokeShape: LottieStrokeShape = {
        ty: 'st',
        nm: 'Stroke',
        c: this.convertColorProperty(element.style.stroke, keyframes, 'stroke', fps),
        o: { a: 0, k: 100 },
        w: this.convertNumericProperty(element.style.strokeWidth || 1, keyframes, 'strokeWidth', fps),
        lc: 2,  // Round cap
        lj: 2,  // Round join
      };
      groupItems.push(strokeShape);
    }

    // Add transform for the group
    const transformShape: LottieTransformShape = {
      ty: 'tr',
      nm: 'Transform',
      p: { a: 0, k: [0, 0] },
      a: { a: 0, k: [0, 0] },
      s: { a: 0, k: [100, 100] },
      r: { a: 0, k: 0 },
      o: { a: 0, k: 100 },
    };
    groupItems.push(transformShape);

    // Create group
    const group: LottieGroupShape = {
      ty: 'gr',
      nm: 'Group',
      it: groupItems,
      np: groupItems.length - 1,  // Number of properties (excluding transform)
    };

    shapes.push(group);

    return shapes;
  }

  /**
   * Convert color string (hex, rgb, rgba, or named) to RGB
   */
  private static hexToRgb(colorString: string): { r: number; g: number; b: number } {
    // Handle hex format: #RRGGBB or RRGGBB
    const hexResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorString);
    if (hexResult) {
      return {
        r: parseInt(hexResult[1], 16),
        g: parseInt(hexResult[2], 16),
        b: parseInt(hexResult[3], 16),
      };
    }

    // Handle rgb() or rgba() format
    const rgbResult = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(colorString);
    if (rgbResult) {
      return {
        r: parseInt(rgbResult[1]),
        g: parseInt(rgbResult[2]),
        b: parseInt(rgbResult[3]),
      };
    }

    // Handle named colors by using a temporary canvas
    if (typeof document !== 'undefined') {
      const ctx = document.createElement('canvas').getContext('2d');
      if (ctx) {
        ctx.fillStyle = colorString;
        const computed = ctx.fillStyle;
        // fillStyle will be in hex format after setting
        const computedHex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(computed);
        if (computedHex) {
          return {
            r: parseInt(computedHex[1], 16),
            g: parseInt(computedHex[2], 16),
            b: parseInt(computedHex[3], 16),
          };
        }
      }
    }

    // Fallback to black if nothing matches
    console.warn(`Could not parse color: ${colorString}`);
    return { r: 0, g: 0, b: 0 };
  }

  /**
   * Export to JSON string
   */
  static exportToJSON(project: Project, pretty = true): string {
    const lottie = this.exportToLottie(project);
    return JSON.stringify(lottie, null, pretty ? 2 : 0);
  }

  /**
   * Download as JSON file
   */
  static downloadJSON(project: Project, filename?: string): void {
    const json = this.exportToJSON(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${project.name || 'animation'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
