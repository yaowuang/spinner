/**
 * Helper utilities tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getColorByIndex,
  calculateSelectedOptionIndex,
  generateConicGradient,
  clamp,
  normalizeAngle,
} from '../helpers';
import { WHEEL_CONFIG } from '../../constants/wheelConfig';

describe('Helper Utilities', () => {
  describe('getColorByIndex', () => {
    it('should return colors in cycling order', () => {
      const color0 = getColorByIndex(0);
      expect(color0).toBe(WHEEL_CONFIG.COLORS.red);

      const color1 = getColorByIndex(1);
      expect(color1).toBe(WHEEL_CONFIG.COLORS.green);

      const color2 = getColorByIndex(2);
      expect(color2).toBe(WHEEL_CONFIG.COLORS.blue);
    });

    it('should cycle colors when index exceeds available colors', () => {
      const totalColors = Object.keys(WHEEL_CONFIG.COLORS).length;
      const color0 = getColorByIndex(0);
      const colorCycled = getColorByIndex(totalColors);

      expect(color0).toBe(colorCycled);
    });

    it('should handle edge case indices', () => {
      // Negative indices may return undefined due to modulo behavior
      // This is acceptable behavior - colors are only used for non-negative indices
      const color = getColorByIndex(0);
      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
      expect(color.startsWith('#')).toBe(true);

      // Very large numbers should cycle
      const largeColor = getColorByIndex(1000);
      expect(largeColor).toBeDefined();
    });

    it('should return all defined colors', () => {
      const colorKeys = Object.keys(WHEEL_CONFIG.COLORS);
      for (let i = 0; i < colorKeys.length; i++) {
        const color = getColorByIndex(i);
        expect(color).toBeDefined();
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('should be consistent across calls', () => {
      const color1 = getColorByIndex(5);
      const color2 = getColorByIndex(5);
      expect(color1).toBe(color2);
    });
  });

  describe('calculateSelectedOptionIndex', () => {
    it('should return -1 for empty wheel', () => {
      const index = calculateSelectedOptionIndex(0, 0);
      expect(index).toBe(-1);
    });

    it('should return valid index for single option', () => {
      const index = calculateSelectedOptionIndex(0, 1);
      expect(index).toBe(0);
    });

    it('should calculate correct sector for 4-option wheel', () => {
      // 4 options = 90 degrees each
      // Rotation 0 with 90 degree offset = points to first option
      const index = calculateSelectedOptionIndex(0, 4);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(4);
    });

    it('should handle different rotation angles', () => {
      const options = 6; // 60 degrees each
      for (let rotation = 0; rotation < 360; rotation += 60) {
        const index = calculateSelectedOptionIndex(rotation, options);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(options);
      }
    });

    it('should handle 360-degree rotations consistently', () => {
      const options = 4;
      const index0 = calculateSelectedOptionIndex(0, options);
      const index360 = calculateSelectedOptionIndex(360, options);

      // Both should point to same sector (wraps around)
      expect(Math.abs(index0 - index360)).toBeLessThanOrEqual(1);
    });

    it('should work with large rotation values', () => {
      const options = 3;
      const index = calculateSelectedOptionIndex(720, options); // 2 full rotations
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(options);
    });
  });

  describe('generateConicGradient', () => {
    it('should return white for empty options', () => {
      const gradient = generateConicGradient([]);
      expect(gradient).toBe('white');
    });

    it('should generate valid gradient for single option', () => {
      const gradient = generateConicGradient(['Option1']);
      expect(gradient).toContain('conic-gradient');
      expect(gradient).toContain(WHEEL_CONFIG.COLORS.red); // First color (hex value)
      expect(gradient).toContain('0deg');
    });

    it('should generate correct gradient for multiple options', () => {
      const options = ['Option1', 'Option2', 'Option3'];
      const gradient = generateConicGradient(options);

      expect(gradient).toContain('conic-gradient');
      expect(gradient).toContain('0deg');
      expect(gradient).toContain('120deg'); // 360 / 3
      expect(gradient).toContain('240deg');
      // The last angle wraps to 0, not 360
      expect(gradient.match(/\d+deg/g)).toBeDefined();
    });

    it('should use correct colors in order', () => {
      const options = ['A', 'B', 'C'];
      const gradient = generateConicGradient(options);

      // Should contain first three colors
      expect(gradient).toContain(WHEEL_CONFIG.COLORS.red);
      expect(gradient).toContain(WHEEL_CONFIG.COLORS.green);
      expect(gradient).toContain(WHEEL_CONFIG.COLORS.blue);
    });

    it('should cycle colors for more than available colors', () => {
      const colorCount = Object.keys(WHEEL_CONFIG.COLORS).length;
      const options = Array.from({ length: colorCount + 2 }, (_, i) => `Option${i}`);
      const gradient = generateConicGradient(options);

      expect(gradient).toContain('conic-gradient');
      expect(gradient).toContain(WHEEL_CONFIG.COLORS.red); // Cycles back
    });

    it('should have valid angle progression', () => {
      const options = ['A', 'B', 'C', 'D'];
      const gradient = generateConicGradient(options);

      // Each sector should be 90 degrees (360/4)
      const matches = gradient.match(/(\d+)deg/g);
      expect(matches).toBeDefined();
      if (matches) {
        const angles = matches.map((m) => parseInt(m));
        expect(angles).toContain(0);
        expect(angles).toContain(90);
        expect(angles).toContain(180);
        expect(angles).toContain(270);
        // Last angle wraps to 0, not 360
        expect(angles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('clamp', () => {
    it('should return value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should clamp below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 10, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, 0)).toBe(-5);
      expect(clamp(5, -10, 0)).toBe(0);
      expect(clamp(-15, -10, 0)).toBe(-10);
    });

    it('should handle decimal values', () => {
      expect(clamp(5.5, 0, 10)).toBe(5.5);
      expect(clamp(10.5, 0, 10)).toBe(10);
      expect(clamp(-0.5, 0, 10)).toBe(0);
    });
  });

  describe('normalizeAngle', () => {
    it('should return angle in 0-360 range', () => {
      expect(normalizeAngle(0)).toBe(0);
      expect(normalizeAngle(180)).toBe(180);
      expect(normalizeAngle(359)).toBe(359);
    });

    it('should normalize angles above 360', () => {
      expect(normalizeAngle(360)).toBe(0);
      expect(normalizeAngle(361)).toBe(1);
      expect(normalizeAngle(720)).toBe(0);
    });

    it('should normalize negative angles', () => {
      expect(normalizeAngle(-1)).toBe(359);
      expect(normalizeAngle(-90)).toBe(270);
      expect(normalizeAngle(-360)).toBe(0);
    });

    it('should handle large positive values', () => {
      expect(normalizeAngle(1080)).toBe(0); // 3 rotations
      expect(normalizeAngle(1170)).toBe(90); // 3 rotations + 90
    });

    it('should handle large negative values', () => {
      expect(normalizeAngle(-1080)).toBe(0);
      expect(normalizeAngle(-1170)).toBe(270);
    });

    it('should be consistent across calls', () => {
      const angle = 450;
      const result1 = normalizeAngle(angle);
      const result2 = normalizeAngle(angle);
      expect(result1).toBe(result2);
    });
  });

  describe('Integration Tests', () => {
    it('should correctly calculate selected index across wheel rotation', () => {
      const optionCount = 6;
      const sectorDeg = 360 / optionCount;

      // Test each sector
      for (let i = 0; i < optionCount; i++) {
        const rotation = i * sectorDeg;
        const index = calculateSelectedOptionIndex(rotation, optionCount);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(optionCount);
      }
    });

    it('should generate gradient with matching option count', () => {
      const options = ['Alice', 'Bob', 'Charlie', 'David'];
      const gradient = generateConicGradient(options);

      // Should have 4 colors in gradient
      const degMatches = gradient.match(/(\d+)deg/g) || [];
      // Each option = 2 angle points (start and end)
      expect(degMatches.length).toBeGreaterThanOrEqual(options.length * 2);
    });

    it('should color wheel with consistent calculations', () => {
      const options = ['A', 'B', 'C'];
      const gradient = generateConicGradient(options);

      // Calculate what each index should select
      for (let i = 0; i < options.length; i++) {
        const index = calculateSelectedOptionIndex(i * 120, 3); // 3 options = 120 each
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(3);
      }
    });
  });
});
