import { describe, it, expect } from 'vitest';
import {
  interpolateLinear,
  interpolateKeyframes,
  getValueAtTime,
  findKeyframeBounds,
  hexToRgb,
  rgbToHex,
  interpolateColor,
  getColorAtTime,
  easeIn,
  easeOut,
  easeInOut,
  applyEasing,
  interpolateAngle,
} from './Interpolation';
import type { Keyframe } from '../models/Keyframe';

describe('Interpolation Engine', () => {
  describe('interpolateLinear', () => {
    it('should interpolate between two numbers', () => {
      expect(interpolateLinear(0, 100, 0)).toBe(0);
      expect(interpolateLinear(0, 100, 0.5)).toBe(50);
      expect(interpolateLinear(0, 100, 1)).toBe(100);
    });

    it('should handle negative numbers', () => {
      expect(interpolateLinear(-50, 50, 0.5)).toBe(0);
      expect(interpolateLinear(-100, -50, 0.5)).toBe(-75);
    });

    it('should clamp t to 0-1 range', () => {
      expect(interpolateLinear(0, 100, -0.5)).toBe(0);
      expect(interpolateLinear(0, 100, 1.5)).toBe(100);
    });

    it('should work with decimal values', () => {
      expect(interpolateLinear(0, 1, 0.333)).toBeCloseTo(0.333, 3);
      expect(interpolateLinear(10.5, 20.7, 0.5)).toBeCloseTo(15.6, 3);
    });
  });

  describe('Easing Functions', () => {
    describe('easeIn', () => {
      it('should start slowly and accelerate', () => {
        expect(easeIn(0)).toBe(0);
        expect(easeIn(0.25)).toBe(0.0625); // 0.25^2
        expect(easeIn(0.5)).toBe(0.25); // 0.5^2
        expect(easeIn(0.75)).toBe(0.5625); // 0.75^2
        expect(easeIn(1)).toBe(1);
      });

      it('should clamp values outside 0-1', () => {
        expect(easeIn(-0.5)).toBe(0);
        expect(easeIn(1.5)).toBe(1);
      });
    });

    describe('easeOut', () => {
      it('should start quickly and decelerate', () => {
        expect(easeOut(0)).toBe(0);
        expect(easeOut(0.5)).toBe(0.75); // 0.5 * (2 - 0.5)
        expect(easeOut(1)).toBe(1);
      });

      it('should clamp values outside 0-1', () => {
        expect(easeOut(-0.5)).toBe(0);
        expect(easeOut(1.5)).toBe(1);
      });
    });

    describe('easeInOut', () => {
      it('should ease in and out', () => {
        expect(easeInOut(0)).toBe(0);
        expect(easeInOut(0.25)).toBeCloseTo(0.0625, 4); // First half: cubic
        expect(easeInOut(0.5)).toBe(0.5); // Midpoint
        expect(easeInOut(0.75)).toBeCloseTo(0.9375, 4); // Second half
        expect(easeInOut(1)).toBe(1);
      });

      it('should clamp values outside 0-1', () => {
        expect(easeInOut(-0.5)).toBe(0);
        expect(easeInOut(1.5)).toBe(1);
      });
    });

    describe('applyEasing', () => {
      it('should apply linear easing (pass through)', () => {
        expect(applyEasing(0.5, 'linear')).toBe(0.5);
        expect(applyEasing(0.25, 'linear')).toBe(0.25);
      });

      it('should apply ease-in (kebab-case)', () => {
        expect(applyEasing(0.5, 'ease-in')).toBe(0.25);
      });

      it('should apply ease-out (kebab-case)', () => {
        expect(applyEasing(0.5, 'ease-out')).toBe(0.75);
      });

      it('should apply ease-in-out (kebab-case)', () => {
        expect(applyEasing(0.5, 'ease-in-out')).toBe(0.5);
      });

      it('should apply easeIn (camelCase)', () => {
        expect(applyEasing(0.5, 'easeIn')).toBe(0.25);
      });

      it('should apply easeOut (camelCase)', () => {
        expect(applyEasing(0.5, 'easeOut')).toBe(0.75);
      });

      it('should apply easeInOut (camelCase)', () => {
        expect(applyEasing(0.5, 'easeInOut')).toBe(0.5);
      });

      it('should default to linear for unknown easing', () => {
        expect(applyEasing(0.5, 'unknown')).toBe(0.5);
        expect(applyEasing(0.75, 'invalid')).toBe(0.75);
      });

      it('should clamp values outside 0-1', () => {
        expect(applyEasing(-0.5, 'linear')).toBe(0);
        expect(applyEasing(1.5, 'linear')).toBe(1);
      });
    });
  });

  describe('findKeyframeBounds', () => {
    const keyframes: Keyframe[] = [
      { id: '1', time: 0, property: 'x', value: 0, easing: 'linear' },
      { id: '2', time: 1, property: 'x', value: 100, easing: 'linear' },
      { id: '3', time: 2, property: 'x', value: 50, easing: 'linear' },
      { id: '4', time: 3, property: 'x', value: 200, easing: 'linear' },
    ];

    it('should find keyframes before and after given time', () => {
      const result = findKeyframeBounds(keyframes, 1.5);
      expect(result?.before.time).toBe(1);
      expect(result?.after.time).toBe(2);
    });

    it('should return null if time is before first keyframe', () => {
      const result = findKeyframeBounds(keyframes, -1);
      expect(result).toBeNull();
    });

    it('should return null if time is after last keyframe', () => {
      const result = findKeyframeBounds(keyframes, 4);
      expect(result).toBeNull();
    });

    it('should handle exact keyframe time', () => {
      const result = findKeyframeBounds(keyframes, 1);
      expect(result?.before.time).toBe(1);
      expect(result?.after.time).toBe(2);
    });

    it('should handle time between first two keyframes', () => {
      const result = findKeyframeBounds(keyframes, 0.5);
      expect(result?.before.time).toBe(0);
      expect(result?.after.time).toBe(1);
    });

    it('should return null for empty keyframes array', () => {
      const result = findKeyframeBounds([], 1);
      expect(result).toBeNull();
    });

    it('should return null for single keyframe', () => {
      const result = findKeyframeBounds([keyframes[0]], 1);
      expect(result).toBeNull();
    });

    it('should handle time matching last segments start time', () => {
      // Create keyframes where we test time === currentKeyframe.time && i === keyframes.length - 2
      const kfs: Keyframe[] = [
        { id: '1', time: 0, property: 'x', value: 0, easing: 'linear' },
        { id: '2', time: 1, property: 'x', value: 100, easing: 'linear' },
        { id: '3', time: 2, property: 'x', value: 200, easing: 'linear' },
      ];
      const result = findKeyframeBounds(kfs, 1);
      expect(result).not.toBeNull();
      expect(result?.before.time).toBe(1);
      expect(result?.after.time).toBe(2);
    });
  });

  describe('interpolateKeyframes', () => {
    it('should interpolate between two keyframes with linear easing', () => {
      const keyframe1: Keyframe = {
        id: '1',
        time: 0,
        property: 'x',
        value: 0,
        easing: 'linear',
      };
      const keyframe2: Keyframe = {
        id: '2',
        time: 2,
        property: 'x',
        value: 100,
        easing: 'linear',
      };

      expect(interpolateKeyframes(keyframe1, keyframe2, 0)).toBe(0);
      expect(interpolateKeyframes(keyframe1, keyframe2, 1)).toBe(50);
      expect(interpolateKeyframes(keyframe1, keyframe2, 2)).toBe(100);
    });

    it('should handle non-zero start time', () => {
      const keyframe1: Keyframe = {
        id: '1',
        time: 1,
        property: 'x',
        value: 50,
        easing: 'linear',
      };
      const keyframe2: Keyframe = {
        id: '2',
        time: 3,
        property: 'x',
        value: 150,
        easing: 'linear',
      };

      expect(interpolateKeyframes(keyframe1, keyframe2, 2)).toBe(100);
    });

    it('should handle negative values', () => {
      const keyframe1: Keyframe = {
        id: '1',
        time: 0,
        property: 'y',
        value: -100,
        easing: 'linear',
      };
      const keyframe2: Keyframe = {
        id: '2',
        time: 2,
        property: 'y',
        value: 100,
        easing: 'linear',
      };

      expect(interpolateKeyframes(keyframe1, keyframe2, 1)).toBe(0);
    });

    it('should return start value when time equals start time', () => {
      const keyframe1: Keyframe = {
        id: '1',
        time: 1,
        property: 'x',
        value: 50,
        easing: 'linear',
      };
      const keyframe2: Keyframe = {
        id: '2',
        time: 3,
        property: 'x',
        value: 150,
        easing: 'linear',
      };

      expect(interpolateKeyframes(keyframe1, keyframe2, 1)).toBe(50);
    });

    it('should return end value when time equals end time', () => {
      const keyframe1: Keyframe = {
        id: '1',
        time: 1,
        property: 'x',
        value: 50,
        easing: 'linear',
      };
      const keyframe2: Keyframe = {
        id: '2',
        time: 3,
        property: 'x',
        value: 150,
        easing: 'linear',
      };

      expect(interpolateKeyframes(keyframe1, keyframe2, 3)).toBe(150);
    });
  });

  describe('getValueAtTime', () => {
    it('should return interpolated value for time between keyframes', () => {
      const keyframes: Keyframe[] = [
        { id: '1', time: 0, property: 'x', value: 0, easing: 'linear' },
        { id: '2', time: 2, property: 'x', value: 100, easing: 'linear' },
      ];

      expect(getValueAtTime(keyframes, 1)).toBe(50);
    });

    it('should return first keyframe value if time is before first keyframe', () => {
      const keyframes: Keyframe[] = [
        { id: '1', time: 1, property: 'x', value: 50, easing: 'linear' },
        { id: '2', time: 2, property: 'x', value: 100, easing: 'linear' },
      ];

      expect(getValueAtTime(keyframes, 0)).toBe(50);
    });

    it('should return last keyframe value if time is after last keyframe', () => {
      const keyframes: Keyframe[] = [
        { id: '1', time: 0, property: 'x', value: 0, easing: 'linear' },
        { id: '2', time: 2, property: 'x', value: 100, easing: 'linear' },
      ];

      expect(getValueAtTime(keyframes, 3)).toBe(100);
    });

    it('should return exact keyframe value when time matches keyframe', () => {
      const keyframes: Keyframe[] = [
        { id: '1', time: 0, property: 'x', value: 0, easing: 'linear' },
        { id: '2', time: 1, property: 'x', value: 50, easing: 'linear' },
        { id: '3', time: 2, property: 'x', value: 100, easing: 'linear' },
      ];

      expect(getValueAtTime(keyframes, 1)).toBe(50);
    });

    it('should handle multiple keyframes correctly', () => {
      const keyframes: Keyframe[] = [
        { id: '1', time: 0, property: 'x', value: 0, easing: 'linear' },
        { id: '2', time: 1, property: 'x', value: 100, easing: 'linear' },
        { id: '3', time: 2, property: 'x', value: 50, easing: 'linear' },
        { id: '4', time: 3, property: 'x', value: 200, easing: 'linear' },
      ];

      expect(getValueAtTime(keyframes, 0.5)).toBe(50); // Between 0 and 1
      expect(getValueAtTime(keyframes, 1.5)).toBe(75); // Between 1 and 2
      expect(getValueAtTime(keyframes, 2.5)).toBe(125); // Between 2 and 3
    });

    it('should return 0 for empty keyframes array', () => {
      expect(getValueAtTime([], 1)).toBe(0);
    });

    it('should return the only keyframe value for single keyframe', () => {
      const keyframes: Keyframe[] = [
        { id: '1', time: 1, property: 'x', value: 42, easing: 'linear' },
      ];

      expect(getValueAtTime(keyframes, 0)).toBe(42);
      expect(getValueAtTime(keyframes, 1)).toBe(42);
      expect(getValueAtTime(keyframes, 2)).toBe(42);
    });
  });

  describe('Color Interpolation', () => {
    describe('hexToRgb', () => {
      it('should convert 6-digit hex to RGB', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      });

      it('should convert 3-digit hex to RGB', () => {
        expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 });
        expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      });

      it('should handle hex without # prefix', () => {
        expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('f00')).toEqual({ r: 255, g: 0, b: 0 });
      });

      it('should handle mixed case', () => {
        expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#Ff00Ff')).toEqual({ r: 255, g: 0, b: 255 });
      });
    });

    describe('rgbToHex', () => {
      it('should convert RGB to 6-digit hex', () => {
        expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
        expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
        expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
        expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
        expect(rgbToHex(0, 0, 0)).toBe('#000000');
      });

      it('should handle decimal values by rounding', () => {
        expect(rgbToHex(127.5, 63.2, 191.8)).toBe('#803fc0');
      });

      it('should clamp values to 0-255 range', () => {
        expect(rgbToHex(-10, 300, 128)).toBe('#00ff80');
        expect(rgbToHex(256, -1, 500)).toBe('#ff00ff');
      });

      it('should pad single digit hex values', () => {
        expect(rgbToHex(1, 2, 3)).toBe('#010203');
        expect(rgbToHex(15, 0, 255)).toBe('#0f00ff');
      });
    });

    describe('interpolateColor', () => {
      it('should interpolate between two colors', () => {
        // Red to Blue
        expect(interpolateColor('#ff0000', '#0000ff', 0)).toBe('#ff0000');
        expect(interpolateColor('#ff0000', '#0000ff', 0.5)).toBe('#800080');
        expect(interpolateColor('#ff0000', '#0000ff', 1)).toBe('#0000ff');
      });

      it('should interpolate between black and white', () => {
        expect(interpolateColor('#000000', '#ffffff', 0)).toBe('#000000');
        expect(interpolateColor('#000000', '#ffffff', 0.5)).toBe('#808080');
        expect(interpolateColor('#000000', '#ffffff', 1)).toBe('#ffffff');
      });

      it('should handle 3-digit hex colors', () => {
        expect(interpolateColor('#f00', '#00f', 0.5)).toBe('#800080');
      });

      it('should clamp t to 0-1 range', () => {
        expect(interpolateColor('#ff0000', '#0000ff', -0.5)).toBe('#ff0000');
        expect(interpolateColor('#ff0000', '#0000ff', 1.5)).toBe('#0000ff');
      });

      it('should interpolate all three RGB channels', () => {
        // Yellow to Cyan
        const result = interpolateColor('#ffff00', '#00ffff', 0.5);
        expect(result).toBe('#80ff80');
      });
    });

    describe('getColorAtTime', () => {
      it('should return interpolated color for time between keyframes', () => {
        const keyframes: Keyframe[] = [
          { id: '1', time: 0, property: 'fill', value: '#ff0000', easing: 'linear' },
          { id: '2', time: 2, property: 'fill', value: '#0000ff', easing: 'linear' },
        ];

        expect(getColorAtTime(keyframes, 1)).toBe('#800080');
      });

      it('should return first color if time is before first keyframe', () => {
        const keyframes: Keyframe[] = [
          { id: '1', time: 1, property: 'fill', value: '#ff0000', easing: 'linear' },
          { id: '2', time: 2, property: 'fill', value: '#0000ff', easing: 'linear' },
        ];

        expect(getColorAtTime(keyframes, 0)).toBe('#ff0000');
      });

      it('should return last color if time is after last keyframe', () => {
        const keyframes: Keyframe[] = [
          { id: '1', time: 0, property: 'fill', value: '#ff0000', easing: 'linear' },
          { id: '2', time: 2, property: 'fill', value: '#0000ff', easing: 'linear' },
        ];

        expect(getColorAtTime(keyframes, 3)).toBe('#0000ff');
      });

      it('should return exact color when time matches keyframe', () => {
        const keyframes: Keyframe[] = [
          { id: '1', time: 0, property: 'fill', value: '#ff0000', easing: 'linear' },
          { id: '2', time: 1, property: 'fill', value: '#00ff00', easing: 'linear' },
          { id: '3', time: 2, property: 'fill', value: '#0000ff', easing: 'linear' },
        ];

        expect(getColorAtTime(keyframes, 1)).toBe('#00ff00');
      });

      it('should handle multiple color keyframes correctly', () => {
        const keyframes: Keyframe[] = [
          { id: '1', time: 0, property: 'fill', value: '#000000', easing: 'linear' },
          { id: '2', time: 1, property: 'fill', value: '#ffffff', easing: 'linear' },
          { id: '3', time: 2, property: 'fill', value: '#000000', easing: 'linear' },
        ];

        expect(getColorAtTime(keyframes, 0.5)).toBe('#808080'); // Between black and white
        expect(getColorAtTime(keyframes, 1.5)).toBe('#808080'); // Between white and black
      });

      it('should return black for empty keyframes array', () => {
        expect(getColorAtTime([], 1)).toBe('#000000');
      });

      it('should return the only color for single keyframe', () => {
        const keyframes: Keyframe[] = [
          { id: '1', time: 1, property: 'fill', value: '#ff00ff', easing: 'linear' },
        ];

        expect(getColorAtTime(keyframes, 0)).toBe('#ff00ff');
        expect(getColorAtTime(keyframes, 1)).toBe('#ff00ff');
        expect(getColorAtTime(keyframes, 2)).toBe('#ff00ff');
      });

      it('should handle non-string values gracefully', () => {
        const keyframes: Keyframe[] = [
          { id: '1', time: 0, property: 'fill', value: 123, easing: 'linear' }, // Invalid type
          { id: '2', time: 1, property: 'fill', value: '#0000ff', easing: 'linear' },
        ];

        // Should default to black for invalid value
        expect(getColorAtTime(keyframes, 0)).toBe('#000000');
      });
    });
  });

  describe('Angle Interpolation', () => {
    describe('interpolateAngle', () => {
      it('should interpolate normally when angles are close', () => {
        // 0 to 90 degrees
        expect(interpolateAngle(0, 90, 0)).toBe(0);
        expect(interpolateAngle(0, 90, 0.5)).toBe(45);
        expect(interpolateAngle(0, 90, 1)).toBe(90);
      });

      it('should take shortest path from 350° to 10° (going forward through 0°)', () => {
        // Should interpolate through 360°/0° (20° total), not backwards (340°)
        expect(interpolateAngle(350, 10, 0)).toBe(350);
        expect(interpolateAngle(350, 10, 0.5)).toBe(0);
        expect(interpolateAngle(350, 10, 1)).toBe(10);
      });

      it('should take shortest path from 10° to 350° (going backward through 0°)', () => {
        // Should interpolate through 360°/0° (-20° total), not forward (340°)
        expect(interpolateAngle(10, 350, 0)).toBe(10);
        expect(interpolateAngle(10, 350, 0.5)).toBe(0);
        expect(interpolateAngle(10, 350, 1)).toBe(350);
      });

      it('should handle 180° transitions correctly (can go either way)', () => {
        // At exactly 180°, both paths are equal. Implementation should be consistent.
        const result = interpolateAngle(0, 180, 0.5);
        expect(result).toBe(90); // Should take positive direction
      });

      it('should handle 180° difference (both paths equal)', () => {
        // When difference is exactly 180°, both paths are equal distance
        // Implementation goes backward: 270° - 180° = 90°
        expect(interpolateAngle(270, 90, 0)).toBe(270);
        expect(interpolateAngle(270, 90, 0.5)).toBe(180); // Midpoint
        expect(interpolateAngle(270, 90, 1)).toBe(90);
      });

      it('should handle angles greater than 360°', () => {
        // 370° should be treated as 10°
        expect(interpolateAngle(370, 20, 0.5)).toBe(15);
      });

      it('should handle negative angles', () => {
        // -10° should be treated as 350°
        expect(interpolateAngle(-10, 10, 0.5)).toBe(0);
      });

      it('should clamp t to 0-1 range', () => {
        expect(interpolateAngle(0, 90, -0.5)).toBe(0);
        expect(interpolateAngle(0, 90, 1.5)).toBe(90);
      });

      it('should handle same start and end angle', () => {
        expect(interpolateAngle(45, 45, 0.5)).toBe(45);
        expect(interpolateAngle(180, 180, 0.3)).toBe(180);
      });

      it('should normalize result to 0-360 range', () => {
        // Result should always be in 0-360 range
        const result1 = interpolateAngle(350, 370, 0.5); // 370 = 10°
        expect(result1).toBeGreaterThanOrEqual(0);
        expect(result1).toBeLessThan(360);
      });
    });
  });
});
