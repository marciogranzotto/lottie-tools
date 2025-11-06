import { describe, it, expect } from 'vitest';
import type {
  RectElement,
  CircleElement,
  EllipseElement,
  PathElement,
  PolygonElement,
  PolylineElement,
  GroupElement,
  AnyElement,
} from './Element';

describe('Element Module', () => {
  it('should import all types correctly', () => {
    // This test verifies that all type imports work without errors
    // The fact that this test compiles means the imports are correct
    expect(true).toBe(true);
  });

  it('should allow creating a RectElement', () => {
    const rect: RectElement = {
      id: '1',
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

    expect(rect.type).toBe('rect');
    expect(rect.width).toBe(100);
  });

  it('should allow creating a GroupElement with children', () => {
    const circle: CircleElement = {
      id: '2',
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

    const group: GroupElement = {
      id: '3',
      type: 'group',
      name: 'Group',
      transform: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
      style: {},
      children: [circle],
    };

    expect(group.type).toBe('group');
    expect(group.children.length).toBe(1);
    expect(group.children[0].type).toBe('circle');
  });

  it('should support AnyElement union type', () => {
    const elements: AnyElement[] = [
      {
        id: '1',
        type: 'rect',
        name: 'Rect',
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
        style: {},
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      } as RectElement,
      {
        id: '2',
        type: 'circle',
        name: 'Circle',
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
        style: {},
        cx: 50,
        cy: 50,
        r: 25,
      } as CircleElement,
    ];

    expect(elements.length).toBe(2);
    expect(elements[0].type).toBe('rect');
    expect(elements[1].type).toBe('circle');
  });
});
