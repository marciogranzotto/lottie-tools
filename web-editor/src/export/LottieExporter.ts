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
  LottieGroupShape,
  LottieFillShape,
  LottieStrokeShape,
  LottieTransformShape,
} from '../models/LottieTypes';

export class LottieExporter {
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

    return {
      p: this.convertPositionProperty(transform.x, transform.y, keyframes, 'x', 'y', fps),
      a: { a: 0, k: [0, 0] },  // Anchor point (not animated for now)
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

    const lottieKeyframes: LottieKeyframe[] = sortedTimes.map(time => {
      const xKf = xKeyframes.find(kf => kf.time === time);
      const yKf = yKeyframes.find(kf => kf.time === time);

      const xValue = xKf ? (typeof xKf.value === 'number' ? xKf.value : defaultX) : defaultX;
      const yValue = yKf ? (typeof yKf.value === 'number' ? yKf.value : defaultY) : defaultY;

      return {
        t: Math.round(time * fps),  // Convert seconds to frames
        s: [xValue, yValue],
        e: [xValue, yValue],  // For now, same as start
      };
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

    const lottieKeyframes: LottieKeyframe[] = sortedTimes.map(time => {
      const xKf = scaleXKfs.find(kf => kf.time === time);
      const yKf = scaleYKfs.find(kf => kf.time === time);

      const xValue = xKf ? (typeof xKf.value === 'number' ? xKf.value : defaultScaleX) : defaultScaleX;
      const yValue = yKf ? (typeof yKf.value === 'number' ? yKf.value : defaultScaleY) : defaultScaleY;

      return {
        t: Math.round(time * fps),
        s: [xValue * 100, yValue * 100],  // Convert to percentage
        e: [xValue * 100, yValue * 100],
      };
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

    const lottieKeyframes: LottieKeyframe[] = rotationKfs.map(kf => ({
      t: Math.round(kf.time * fps),
      s: [typeof kf.value === 'number' ? kf.value : defaultRotation],
      e: [typeof kf.value === 'number' ? kf.value : defaultRotation],
    }));

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

    const lottieKeyframes: LottieKeyframe[] = opacityKfs.map(kf => ({
      t: Math.round(kf.time * fps),
      s: [typeof kf.value === 'number' ? kf.value * 100 : defaultOpacity * 100],
      e: [typeof kf.value === 'number' ? kf.value * 100 : defaultOpacity * 100],
    }));

    return { a: 1, k: lottieKeyframes };
  }

  /**
   * Convert element shapes to Lottie shapes
   */
  private static convertShapes(
    layer: Layer,
    keyframes: Keyframe[],
    fps: number
  ): (LottieRectShape | LottieEllipseShape | LottieGroupShape | LottieFillShape | LottieStrokeShape)[] {
    const element = layer.element;
    const shapes: any[] = [];

    // Create group for shape + fill + stroke
    const groupItems: any[] = [];

    // Add shape geometry
    if (element.type === 'rect') {
      const rectShape: LottieRectShape = {
        ty: 'rc',
        nm: 'Rectangle',
        p: { a: 0, k: [element.x + element.width / 2, element.y + element.height / 2] },
        s: { a: 0, k: [element.width, element.height] },
        r: { a: 0, k: 0 },  // Roundness
      };
      groupItems.push(rectShape);
    } else if (element.type === 'ellipse') {
      const ellipseShape: LottieEllipseShape = {
        ty: 'el',
        nm: 'Ellipse',
        p: { a: 0, k: [element.cx, element.cy] },
        s: { a: 0, k: [element.rx * 2, element.ry * 2] },
      };
      groupItems.push(ellipseShape);
    } else if (element.type === 'circle') {
      const ellipseShape: LottieEllipseShape = {
        ty: 'el',
        nm: 'Circle',
        p: { a: 0, k: [element.cx, element.cy] },
        s: { a: 0, k: [element.r * 2, element.r * 2] },
      };
      groupItems.push(ellipseShape);
    }

    // Add fill
    if (element.style.fill && element.style.fill !== 'none') {
      const fillColor = this.hexToRgb(element.style.fill);
      const fillShape: LottieFillShape = {
        ty: 'fl',
        nm: 'Fill',
        c: { a: 0, k: [fillColor.r / 255, fillColor.g / 255, fillColor.b / 255, 1] },
        o: { a: 0, k: 100 },
      };
      groupItems.push(fillShape);
    }

    // Add stroke
    if (element.style.stroke && element.style.stroke !== 'none') {
      const strokeColor = this.hexToRgb(element.style.stroke);
      const strokeShape: LottieStrokeShape = {
        ty: 'st',
        nm: 'Stroke',
        c: { a: 0, k: [strokeColor.r / 255, strokeColor.g / 255, strokeColor.b / 255, 1] },
        o: { a: 0, k: 100 },
        w: { a: 0, k: element.style.strokeWidth || 1 },
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
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
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
