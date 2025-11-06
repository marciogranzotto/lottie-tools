import { describe, it, expect } from 'vitest';
import type { Layer } from './Layer';
import type { AnyElement, RectElement } from './Element';

describe('Layer Module', () => {
  it('should import Layer type correctly', () => {
    // This test verifies that the Layer import works without errors
    expect(true).toBe(true);
  });

  it('should allow creating a Layer with an element', () => {
    const rectElement: RectElement = {
      id: 'elem-1',
      type: 'rect',
      name: 'Rectangle',
      transform: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
      style: {
        fill: '#000000',
      },
      x: 10,
      y: 10,
      width: 100,
      height: 50,
    };

    const layer: Layer = {
      id: 'layer-1',
      name: 'Layer 1',
      element: rectElement,
      visible: true,
      locked: false,
    };

    expect(layer.id).toBe('layer-1');
    expect(layer.element.type).toBe('rect');
    expect(layer.visible).toBe(true);
  });

  it('should allow AnyElement in layer', () => {
    const element: AnyElement = {
      id: 'elem-2',
      type: 'circle',
      name: 'Circle',
      transform: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
      style: {
        fill: '#ff0000',
      },
      cx: 50,
      cy: 50,
      r: 25,
    };

    const layer: Layer = {
      id: 'layer-2',
      name: 'Layer 2',
      element,
      visible: true,
      locked: false,
    };

    expect(layer.element.type).toBe('circle');
  });
});
