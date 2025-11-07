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
  });
});
