import { describe, it, expect } from 'vitest';
import { svgPathToLottiePath } from './svg-to-lottie-path';

describe('svgPathToLottiePath', () => {
  it('should convert simple line path', () => {
    const result = svgPathToLottiePath('M 0 0 L 100 0');

    expect(result.v).toHaveLength(2);
    expect(result.v[0]).toEqual([0, 0]);
    expect(result.v[1]).toEqual([100, 0]);
    expect(result.i).toHaveLength(2);
    expect(result.o).toHaveLength(2);
    expect(result.c).toBe(false);
  });

  it('should convert closed path', () => {
    const result = svgPathToLottiePath('M 0 0 L 100 0 L 100 100 L 0 100 Z');

    expect(result.v).toHaveLength(4);
    expect(result.v[0]).toEqual([0, 0]);
    expect(result.v[1]).toEqual([100, 0]);
    expect(result.v[2]).toEqual([100, 100]);
    expect(result.v[3]).toEqual([0, 100]);
    expect(result.c).toBe(true);
  });

  it('should convert horizontal and vertical lines', () => {
    const result = svgPathToLottiePath('M 0 0 H 100 V 100');

    expect(result.v).toHaveLength(3);
    expect(result.v[0]).toEqual([0, 0]);
    expect(result.v[1]).toEqual([100, 0]);
    expect(result.v[2]).toEqual([100, 100]);
  });

  it('should convert cubic bezier curves', () => {
    const result = svgPathToLottiePath('M 0 0 C 50 0 50 100 100 100');

    expect(result.v).toHaveLength(2);
    expect(result.v[0]).toEqual([0, 0]);
    expect(result.v[1]).toEqual([100, 100]);

    // Check that tangents are set
    expect(result.o[0]).toEqual([50, 0]); // Out tangent from first point
    expect(result.i[1]).toEqual([-50, 0]); // In tangent to second point
  });

  it('should convert quadratic bezier curves', () => {
    const result = svgPathToLottiePath('M 0 0 Q 50 50 100 0');

    expect(result.v).toHaveLength(2);
    expect(result.v[0]).toEqual([0, 0]);
    expect(result.v[1]).toEqual([100, 0]);

    // Quadratic curves are converted to cubic
    expect(result.o[0].length).toBe(2);
    expect(result.i[1].length).toBe(2);
  });

  it('should handle relative move commands', () => {
    const result = svgPathToLottiePath('M 10 10 m 5 5');

    expect(result.v).toHaveLength(2);
    expect(result.v[0]).toEqual([10, 10]);
    expect(result.v[1]).toEqual([15, 15]);
  });

  it('should handle relative line commands', () => {
    const result = svgPathToLottiePath('M 10 10 l 20 0 l 0 20');

    expect(result.v).toHaveLength(3);
    expect(result.v[0]).toEqual([10, 10]);
    expect(result.v[1]).toEqual([30, 10]);
    expect(result.v[2]).toEqual([30, 30]);
  });

  it('should handle empty path', () => {
    const result = svgPathToLottiePath('');

    expect(result.v).toHaveLength(0);
    expect(result.i).toHaveLength(0);
    expect(result.o).toHaveLength(0);
    expect(result.c).toBe(false);
  });

  it('should parse complex path with multiple command types', () => {
    const result = svgPathToLottiePath('M 10 10 L 20 20 H 30 V 40 C 40 40 50 50 60 60 Z');

    expect(result.v.length).toBeGreaterThan(0);
    expect(result.c).toBe(true);
  });
});
