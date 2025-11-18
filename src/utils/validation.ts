/**
 * Input validation and sanitization utilities
 */

import { WHEEL_CONFIG } from '../constants/wheelConfig';

/**
 * Sanitize option label - trim, limit length, remove empty values
 * @param label - Raw input label
 * @returns Sanitized label or empty string if invalid
 */
export const sanitizeOptionLabel = (label: string): string => {
  if (typeof label !== 'string') return '';

  let sanitized = label.trim();

  // Remove commas that break the parsing
  sanitized = sanitized.replace(/,/g, '');

  // Limit length
  if (sanitized.length > WHEEL_CONFIG.MAX_OPTION_LENGTH) {
    sanitized = sanitized.substring(0, WHEEL_CONFIG.MAX_OPTION_LENGTH);
  }

  return sanitized;
};

/**
 * Validate option label
 * @param label - Label to validate
 * @param existingLabels - Array of existing labels to check for duplicates
 * @returns Object with isValid flag and error message if invalid
 */
export const validateOptionLabel = (
  label: string,
  existingLabels: string[] = []
): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeOptionLabel(label);

  if (!sanitized) {
    return { isValid: false, error: 'Label cannot be empty' };
  }

  if (sanitized.length === 0) {
    return { isValid: false, error: 'Label cannot be empty or only whitespace' };
  }

  if (existingLabels.includes(sanitized)) {
    return { isValid: false, error: 'This label already exists' };
  }

  return { isValid: true };
};

/**
 * Sanitize page title
 * @param title - Raw input title
 * @returns Sanitized title
 */
export const sanitizePageTitle = (title: string): string => {
  if (typeof title !== 'string') return '';

  let sanitized = title.trim();

  // Limit length
  if (sanitized.length > WHEEL_CONFIG.MAX_TITLE_LENGTH) {
    sanitized = sanitized.substring(0, WHEEL_CONFIG.MAX_TITLE_LENGTH);
  }

  return sanitized;
};

/**
 * Validate page title
 * @param title - Title to validate
 * @returns Object with isValid flag and error message if invalid
 */
export const validatePageTitle = (title: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizePageTitle(title);

  if (!sanitized) {
    return { isValid: false, error: 'Title cannot be empty' };
  }

  return { isValid: true };
};

/**
 * Parse comma-separated labels from input
 * Handles batch adding via comma-separated values
 * @param input - Comma-separated input
 * @returns Array of sanitized, non-empty labels
 */
export const parseCommaSeparatedLabels = (input: string): string[] => {
  if (typeof input !== 'string') return [];

  return input
    .split(',')
    .map((label) => sanitizeOptionLabel(label))
    .filter((label) => label.length > 0);
};

/**
 * Check if we can add more options
 * @param currentCount - Current number of options
 * @returns true if more options can be added
 */
export const canAddMoreOptions = (currentCount: number): boolean => {
  return currentCount < WHEEL_CONFIG.MAX_OPTIONS;
};
