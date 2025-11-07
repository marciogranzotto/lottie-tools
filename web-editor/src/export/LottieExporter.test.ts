import { describe, it, expect } from 'vitest';
import { LottieExporter } from './LottieExporter';
import type { Project } from '../models/Project';
import type { Layer } from '../models/Layer';
import type { RectElement } from '../models/Element';

describe('LottieExporter', () => {
  describe('exportToLottie', () => {
    it('should export basic project metadata', () => {
      const project: Project = {
        name: 'Test Animation',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [],
        keyframes: [],
      };

      const lottie = LottieExporter.exportToLottie(project);

      expect(lottie.v).toBe('5.5.7');  // Bodymovin version
      expect(lottie.fr).toBe(30);
      expect(lottie.ip).toBe(0);
      expect(lottie.op).toBe(60);  // 2 seconds * 30 fps
      expect(lottie.w).toBe(800);
      expect(lottie.h).toBe(600);
      expect(lottie.nm).toBe('Test Animation');
    });

    it('should export a simple rectangle shape layer', () => {
      const rectElement: RectElement = {
        type: 'rect',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        transform: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        style: {
          fill: '#ff0000',
          stroke: 'none',
          strokeWidth: 1,
          opacity: 1,
        },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'Rectangle Layer',
        element: rectElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [],
      };

      const lottie = LottieExporter.exportToLottie(project);

      expect(lottie.layers).toHaveLength(1);
      expect(lottie.layers[0].ty).toBe(4);  // Shape layer
      expect(lottie.layers[0].nm).toBe('Rectangle Layer');
    });

    it('should convert animated position property', () => {
      const rectElement: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: {
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        style: {
          fill: '#ff0000',
          stroke: 'none',
          strokeWidth: 1,
          opacity: 1,
        },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'Animated Rectangle',
        element: rectElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [
          {
            id: 'kf1',
            time: 0,
            property: 'x',
            value: 100,
            easing: 'linear',
            layerId: 'layer1',
          } as any,
          {
            id: 'kf2',
            time: 1,
            property: 'x',
            value: 300,
            easing: 'linear',
            layerId: 'layer1',
          } as any,
        ],
      };

      const lottie = LottieExporter.exportToLottie(project);
      const shapeLayer = lottie.layers[0] as any;

      expect(shapeLayer.ks.p.a).toBe(1);  // Animated
      expect(Array.isArray(shapeLayer.ks.p.k)).toBe(true);  // Has keyframes
      expect(shapeLayer.ks.p.k.length).toBeGreaterThan(0);
    });

    it('should export easing functions to Lottie bezier tangents', () => {
      const rectElement: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: {
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        style: {
          fill: '#ff0000',
          stroke: 'none',
          strokeWidth: 1,
          opacity: 1,
        },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'Eased Rectangle',
        element: rectElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [
          {
            id: 'kf1',
            time: 0,
            property: 'x',
            value: 100,
            easing: 'ease-in',
            layerId: 'layer1',
          } as any,
          {
            id: 'kf2',
            time: 1,
            property: 'x',
            value: 300,
            easing: 'ease-in',
            layerId: 'layer1',
          } as any,
        ],
      };

      const lottie = LottieExporter.exportToLottie(project);
      const shapeLayer = lottie.layers[0] as any;
      const firstKeyframe = shapeLayer.ks.p.k[0];

      // Should have bezier tangents for ease-in
      expect(firstKeyframe.i).toBeDefined();
      expect(firstKeyframe.o).toBeDefined();
      expect(firstKeyframe.o.x).toEqual([0.42, 0.42]); // Out tangent for ease-in
      expect(firstKeyframe.o.y).toEqual([0, 0]);
      expect(firstKeyframe.i.x).toEqual([1, 1]); // In tangent
      expect(firstKeyframe.i.y).toEqual([1, 1]);
    });

    it('should export multi-property animation', () => {
      const rectElement: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: {
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        style: {
          fill: '#ff0000',
          stroke: 'none',
          strokeWidth: 1,
          opacity: 1,
        },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'Multi-prop Rectangle',
        element: rectElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [
          // Position
          { id: 'kf1', time: 0, property: 'x', value: 100, easing: 'linear', layerId: 'layer1' } as any,
          { id: 'kf2', time: 1, property: 'x', value: 300, easing: 'linear', layerId: 'layer1' } as any,
          // Rotation
          { id: 'kf3', time: 0, property: 'rotation', value: 0, easing: 'ease-out', layerId: 'layer1' } as any,
          { id: 'kf4', time: 1, property: 'rotation', value: 360, easing: 'ease-out', layerId: 'layer1' } as any,
          // Opacity
          { id: 'kf5', time: 0, property: 'opacity', value: 1, easing: 'ease-in-out', layerId: 'layer1' } as any,
          { id: 'kf6', time: 1, property: 'opacity', value: 0.5, easing: 'ease-in-out', layerId: 'layer1' } as any,
        ],
      };

      const lottie = LottieExporter.exportToLottie(project);
      const shapeLayer = lottie.layers[0] as any;

      // Check position animated
      expect(shapeLayer.ks.p.a).toBe(1);
      expect(Array.isArray(shapeLayer.ks.p.k)).toBe(true);

      // Check rotation animated
      expect(shapeLayer.ks.r.a).toBe(1);
      expect(Array.isArray(shapeLayer.ks.r.k)).toBe(true);

      // Check opacity animated
      expect(shapeLayer.ks.o.a).toBe(1);
      expect(Array.isArray(shapeLayer.ks.o.k)).toBe(true);
    });

    it('should export multi-layer animation', () => {
      const rect1: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
        style: { fill: '#ff0000', stroke: 'none', strokeWidth: 1, opacity: 1 },
      };

      const rect2: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 150,
        height: 150,
        transform: { x: 200, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
        style: { fill: '#00ff00', stroke: 'none', strokeWidth: 1, opacity: 1 },
      };

      const layer1: Layer = {
        id: 'layer1',
        name: 'Rectangle 1',
        element: rect1,
        visible: true,
        locked: false,
      };

      const layer2: Layer = {
        id: 'layer2',
        name: 'Rectangle 2',
        element: rect2,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Multi-layer Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer1, layer2],
        keyframes: [],
      };

      const lottie = LottieExporter.exportToLottie(project);

      expect(lottie.layers).toHaveLength(2);
      expect(lottie.layers[0].nm).toBe('Rectangle 1');
      expect(lottie.layers[1].nm).toBe('Rectangle 2');
    });

    it('should handle edge case: no keyframes', () => {
      const rectElement: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: { x: 100, y: 100, rotation: 45, scaleX: 1.5, scaleY: 1.5 },
        style: { fill: '#ff0000', stroke: 'none', strokeWidth: 1, opacity: 0.8 },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'Static Rectangle',
        element: rectElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Static',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [],
      };

      const lottie = LottieExporter.exportToLottie(project);
      const shapeLayer = lottie.layers[0] as any;

      // Static values should not be animated
      expect(shapeLayer.ks.p.a).toBe(0);
      expect(shapeLayer.ks.r.a).toBe(0);
      expect(shapeLayer.ks.s.a).toBe(0);
      expect(shapeLayer.ks.o.a).toBe(0);

      // Check values are exported correctly
      // Position = transform.x + centerX = 100 + (0 + 50) = 150
      expect(shapeLayer.ks.p.k).toEqual([150, 150]);
      // Anchor = centerX, centerY = 50, 50
      expect(shapeLayer.ks.a.k).toEqual([50, 50]);
      expect(shapeLayer.ks.r.k).toBe(45);
      expect(shapeLayer.ks.s.k).toEqual([150, 150]); // 1.5 * 100%
      expect(shapeLayer.ks.o.k).toBe(80); // 0.8 * 100
    });

    it('should export path elements with SVG path data', () => {
      const pathElement = {
        type: 'path' as const,
        id: 'path1',
        name: 'Test Path',
        d: 'M 10 10 L 90 10 L 90 90 L 10 90 Z', // Simple square path
        transform: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        style: {
          fill: 'none',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
        },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'Path Layer',
        element: pathElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Path Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [],
      };

      const lottie = LottieExporter.exportToLottie(project);
      const shapeLayer = lottie.layers[0] as any;

      // Check layer exists
      expect(lottie.layers).toHaveLength(1);
      expect(shapeLayer.ty).toBe(4); // Shape layer
      expect(shapeLayer.nm).toBe('Path Layer');

      // Check that shapes include a path shape
      expect(shapeLayer.shapes).toHaveLength(1);
      const group = shapeLayer.shapes[0];
      expect(group.ty).toBe('gr'); // Group

      // Find the path shape within the group
      const pathShape = group.it.find((item: any) => item.ty === 'sh');
      expect(pathShape).toBeDefined();
      expect(pathShape.nm).toBe('Path');

      // Check path data structure
      expect(pathShape.ks).toBeDefined();
      expect(pathShape.ks.a).toBe(0); // Not animated
      expect(pathShape.ks.k).toBeDefined();
      expect(pathShape.ks.k.v).toBeDefined(); // Vertices
      expect(pathShape.ks.k.i).toBeDefined(); // In tangents
      expect(pathShape.ks.k.o).toBeDefined(); // Out tangents
      expect(pathShape.ks.k.c).toBeDefined(); // Closed flag

      // Path should be closed (ends with Z)
      expect(pathShape.ks.k.c).toBe(true);

      // Should have vertices for M L L L
      expect(pathShape.ks.k.v.length).toBeGreaterThan(0);
    });

    it('should export animated stroke color', () => {
      const rectElement: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: {
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        style: {
          fill: 'none',
          stroke: '#ff0000',
          strokeWidth: 2,
          opacity: 1,
        },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'Stroke Animated',
        element: rectElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [
          {
            id: 'kf1',
            time: 0,
            property: 'stroke',
            value: '#ff0000',
            easing: 'linear',
            layerId: 'layer1',
          } as any,
          {
            id: 'kf2',
            time: 1,
            property: 'stroke',
            value: '#0000ff',
            easing: 'linear',
            layerId: 'layer1',
          } as any,
        ],
      };

      const lottie = LottieExporter.exportToLottie(project);
      const shapeLayer = lottie.layers[0] as any;
      const group = shapeLayer.shapes[0];
      const strokeShape = group.it.find((item: any) => item.ty === 'st');

      // Check stroke color is animated
      expect(strokeShape.c.a).toBe(1); // Animated
      expect(Array.isArray(strokeShape.c.k)).toBe(true);
      expect(strokeShape.c.k.length).toBeGreaterThan(0);

      // Check first keyframe has red color with easing
      const firstKf = strokeShape.c.k[0];
      expect(firstKf.t).toBe(0); // Frame 0
      expect(firstKf.s).toEqual([1, 0, 0]); // Red in normalized RGB
      // First keyframe should have easing handles (not last keyframe)
      expect(firstKf.i).toBeDefined();
      expect(firstKf.o).toBeDefined();
      expect(firstKf.i.x).toEqual([1, 1]); // Linear easing
      expect(firstKf.i.y).toEqual([1, 1]);
      expect(firstKf.o.x).toEqual([0, 0]);
      expect(firstKf.o.y).toEqual([0, 0]);

      // Check second keyframe has blue color
      const secondKf = strokeShape.c.k[1];
      expect(secondKf.t).toBe(30); // Frame 30 (1 second * 30 fps)
      expect(secondKf.s).toEqual([0, 0, 1]); // Blue in normalized RGB
      // Last keyframe should not have easing handles
      expect(secondKf.i).toBeUndefined();
      expect(secondKf.o).toBeUndefined();
    });

    it('should export animated stroke width', () => {
      const rectElement: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: {
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        style: {
          fill: 'none',
          stroke: '#000000',
          strokeWidth: 1,
          opacity: 1,
        },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'Stroke Width Animated',
        element: rectElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 2,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [
          {
            id: 'kf1',
            time: 0,
            property: 'strokeWidth',
            value: 1,
            easing: 'linear',
            layerId: 'layer1',
          } as any,
          {
            id: 'kf2',
            time: 1,
            property: 'strokeWidth',
            value: 10,
            easing: 'linear',
            layerId: 'layer1',
          } as any,
        ],
      };

      const lottie = LottieExporter.exportToLottie(project);
      const shapeLayer = lottie.layers[0] as any;
      const group = shapeLayer.shapes[0];
      const strokeShape = group.it.find((item: any) => item.ty === 'st');

      // Check stroke width is animated
      expect(strokeShape.w.a).toBe(1); // Animated
      expect(Array.isArray(strokeShape.w.k)).toBe(true);
      expect(strokeShape.w.k.length).toBeGreaterThan(0);

      // Check keyframe values
      const firstKf = strokeShape.w.k[0];
      expect(firstKf.s).toEqual([1]);
      if (strokeShape.w.k.length > 1) {
        expect(firstKf.e).toEqual([10]);
      }
    });

    it('should handle rgb() color format in stroke', () => {
      const rectElement: RectElement = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        style: {
          fill: 'none',
          stroke: 'rgb(255, 0, 0)',  // RGB format instead of hex
          strokeWidth: 1,
          opacity: 1,
        },
      };

      const layer: Layer = {
        id: 'layer1',
        name: 'RGB Color',
        element: rectElement,
        visible: true,
        locked: false,
      };

      const project: Project = {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 1,
        currentTime: 0,
        isPlaying: false,
        layers: [layer],
        keyframes: [],
      };

      const lottie = LottieExporter.exportToLottie(project);
      const shapeLayer = lottie.layers[0] as any;
      const group = shapeLayer.shapes[0];
      const strokeShape = group.it.find((item: any) => item.ty === 'st');

      // Check stroke color is parsed correctly (red = [1, 0, 0])
      expect(strokeShape.c.k).toEqual([1, 0, 0]);
    });
  });
});
