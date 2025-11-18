/**
 * Validation utility tests
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeOptionLabel,
  validateOptionLabel,
  sanitizePageTitle,
  validatePageTitle,
  parseCommaSeparatedLabels,
  canAddMoreOptions,
} from '../validation';
import { WHEEL_CONFIG } from '../../constants/wheelConfig';

describe('Validation Utilities', () => {
  describe('sanitizeOptionLabel', () => {
    it('should trim whitespace', () => {
      expect(sanitizeOptionLabel('  Alice  ')).toBe('Alice');
    });

    it('should remove commas', () => {
      expect(sanitizeOptionLabel('Alice,Bob')).toBe('AliceBob');
    });

    it('should limit length to MAX_OPTION_LENGTH', () => {
      const longLabel = 'a'.repeat(WHEEL_CONFIG.MAX_OPTION_LENGTH + 10);
      const result = sanitizeOptionLabel(longLabel);
      expect(result.length).toBeLessThanOrEqual(WHEEL_CONFIG.MAX_OPTION_LENGTH);
    });

    it('should handle empty strings', () => {
      expect(sanitizeOptionLabel('')).toBe('');
      expect(sanitizeOptionLabel('   ')).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeOptionLabel(undefined as any)).toBe('');
      expect(sanitizeOptionLabel(null as any)).toBe('');
    });

    it('should preserve valid characters', () => {
      expect(sanitizeOptionLabel('Alice-123!')).toBe('Alice-123!');
    });
  });

  describe('validateOptionLabel', () => {
    it('should accept valid labels', () => {
      const result = validateOptionLabel('Alice', []);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty labels', () => {
      const result = validateOptionLabel('', []);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject duplicate labels', () => {
      const result = validateOptionLabel('Alice', ['Alice', 'Bob']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This label already exists');
    });

    it('should be case-sensitive for duplicates', () => {
      const result = validateOptionLabel('alice', ['Alice']);
      expect(result.isValid).toBe(true); // Different case = valid
    });

    it('should handle multiple existing labels', () => {
      const existing = ['Alice', 'Bob', 'Charlie'];
      const result = validateOptionLabel('David', existing);
      expect(result.isValid).toBe(true);
    });
  });

  describe('sanitizePageTitle', () => {
    it('should trim whitespace', () => {
      expect(sanitizePageTitle('  My Wheel  ')).toBe('My Wheel');
    });

    it('should limit length to MAX_TITLE_LENGTH', () => {
      const longTitle = 'a'.repeat(WHEEL_CONFIG.MAX_TITLE_LENGTH + 10);
      const result = sanitizePageTitle(longTitle);
      expect(result.length).toBeLessThanOrEqual(WHEEL_CONFIG.MAX_TITLE_LENGTH);
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizePageTitle(undefined as any)).toBe('');
      expect(sanitizePageTitle(null as any)).toBe('');
    });

    it('should preserve special characters', () => {
      expect(sanitizePageTitle('My Wheel! 123')).toBe('My Wheel! 123');
    });
  });

  describe('validatePageTitle', () => {
    it('should accept valid titles', () => {
      const result = validatePageTitle('My Wheel');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty titles', () => {
      const result = validatePageTitle('');
      expect(result.isValid).toBe(false);
    });

    it('should reject whitespace-only titles', () => {
      const result = validatePageTitle('   ');
      expect(result.isValid).toBe(false);
    });

    it('should accept max length titles', () => {
      const maxTitle = 'a'.repeat(WHEEL_CONFIG.MAX_TITLE_LENGTH);
      const result = validatePageTitle(maxTitle);
      expect(result.isValid).toBe(true);
    });
  });

  describe('parseCommaSeparatedLabels', () => {
    it('should parse comma-separated values', () => {
      const result = parseCommaSeparatedLabels('Alice,Bob,Charlie');
      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should trim whitespace from each label', () => {
      const result = parseCommaSeparatedLabels('  Alice  ,  Bob  ');
      expect(result).toEqual(['Alice', 'Bob']);
    });

    it('should filter empty labels', () => {
      const result = parseCommaSeparatedLabels('Alice,,Bob');
      expect(result).toEqual(['Alice', 'Bob']);
    });

    it('should handle single value', () => {
      const result = parseCommaSeparatedLabels('Alice');
      expect(result).toEqual(['Alice']);
    });

    it('should return empty array for empty input', () => {
      const result = parseCommaSeparatedLabels('');
      expect(result).toEqual([]);
    });

    it('should handle trailing commas', () => {
      const result = parseCommaSeparatedLabels('Alice,Bob,');
      expect(result).toEqual(['Alice', 'Bob']);
    });

    it('should return empty array for non-string input', () => {
      expect(parseCommaSeparatedLabels(undefined as any)).toEqual([]);
      expect(parseCommaSeparatedLabels(null as any)).toEqual([]);
    });

    it('should enforce MAX_OPTION_LENGTH on parsed labels', () => {
      const longLabel = 'a'.repeat(WHEEL_CONFIG.MAX_OPTION_LENGTH + 10);
      const result = parseCommaSeparatedLabels(`${longLabel},Bob`);
      expect(result[0].length).toBeLessThanOrEqual(WHEEL_CONFIG.MAX_OPTION_LENGTH);
      expect(result[1]).toBe('Bob');
    });
  });

  describe('canAddMoreOptions', () => {
    it('should return true when below max', () => {
      expect(canAddMoreOptions(0)).toBe(true);
      expect(canAddMoreOptions(WHEEL_CONFIG.MAX_OPTIONS - 1)).toBe(true);
    });

    it('should return false when at max', () => {
      expect(canAddMoreOptions(WHEEL_CONFIG.MAX_OPTIONS)).toBe(false);
    });

    it('should return false when above max', () => {
      expect(canAddMoreOptions(WHEEL_CONFIG.MAX_OPTIONS + 1)).toBe(false);
    });

    it('should correctly evaluate at boundary', () => {
      const maxOptions = WHEEL_CONFIG.MAX_OPTIONS;
      expect(canAddMoreOptions(maxOptions - 1)).toBe(true);
      expect(canAddMoreOptions(maxOptions)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should validate a complete workflow', () => {
      const options: string[] = [];

      // Add first option
      const label1 = sanitizeOptionLabel('  Alice  ');
      const val1 = validateOptionLabel(label1, options);
      expect(val1.isValid).toBe(true);
      options.push(label1);

      // Try to add duplicate
      const val2 = validateOptionLabel('Alice', options);
      expect(val2.isValid).toBe(false);

      // Add second option
      const label2 = sanitizeOptionLabel('Bob');
      const val3 = validateOptionLabel(label2, options);
      expect(val3.isValid).toBe(true);
      options.push(label2);

      expect(options).toEqual(['Alice', 'Bob']);
    });

    it('should handle batch import correctly', () => {
      const input = 'Alice, Bob, Charlie';
      const parsed = parseCommaSeparatedLabels(input);

      const options: string[] = [];
      for (const label of parsed) {
        const validation = validateOptionLabel(label, options);
        if (validation.isValid) {
          options.push(label);
        }
      }

      expect(options).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should reject batch with duplicates and invalid', () => {
      const options = ['Alice'];
      const input = 'Alice, Bob, , Charlie';
      const parsed = parseCommaSeparatedLabels(input);

      const validLabels = parsed.filter((label) => {
        const validation = validateOptionLabel(label, options);
        return validation.isValid;
      });

      expect(validLabels).toEqual(['Bob', 'Charlie']);
    });
  });
});
