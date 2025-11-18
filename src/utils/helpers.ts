/**
 * Helper utility functions
 */

import { WHEEL_CONFIG } from '../constants/wheelConfig';

/**
 * Get color by index with cycling through available colors
 * @param index - Index of the option
 * @returns Hex color value
 */
export const getColorByIndex = (index: number): string => {
  const colorKeys = Object.keys(WHEEL_CONFIG.COLORS) as (keyof typeof WHEEL_CONFIG.COLORS)[];
  const colorKey = colorKeys[index % colorKeys.length];
  return WHEEL_CONFIG.COLORS[colorKey];
};

/**
 * Safely get DOM element with type safety
 * @param id - Element ID
 * @returns HTMLElement or null if not found
 */
export const getDOMElement = (id: string): HTMLElement | null => {
  return document.getElementById(id) as HTMLElement | null;
};

/**
 * Set document title safely
 * @param title - Title to set
 */
export const setDocumentTitle = (title: string): void => {
  document.title = title;
};

/**
 * Apply rotation transform to wheel element
 * @param element - DOM element to transform
 * @param degrees - Rotation in degrees
 */
export const applyWheelRotation = (element: HTMLElement, degrees: number): void => {
  element.style.transform = `rotate(-${degrees}deg)`;
};

/**
 * Calculate selected option based on rotation
 * @param currentRotation - Current wheel rotation in degrees
 * @param optionCount - Total number of options
 * @returns Index of selected option
 */
export const calculateSelectedOptionIndex = (
  currentRotation: number,
  optionCount: number
): number => {
  if (optionCount === 0) return -1;

  const sectorDeg = 360 / optionCount;
  const selectedRotation = currentRotation + 90; // Arrow is on right side
  const normalizedRotation =
    selectedRotation >= 0 ? selectedRotation : 360 + (selectedRotation % 360);
  const sectorIndex = Math.floor(normalizedRotation / sectorDeg) % optionCount;

  return sectorIndex;
};

/**
 * Generate conic gradient for wheel colors
 * @param options - Array of option labels
 * @returns CSS conic-gradient string
 */
export const generateConicGradient = (options: string[]): string => {
  if (options.length === 0) return 'white';

  const sectorDeg = 360 / options.length;

  const gradientStops = options
    .map((_option, index) => {
      const startAngle = (sectorDeg * index) % 360;
      const endAngle = (startAngle + sectorDeg) % 360;
      const color = getColorByIndex(index);

      return `${color} ${startAngle}deg ${endAngle}deg`;
    })
    .join(', ');

  return `conic-gradient(${gradientStops})`;
};

/**
 * Debounce function to prevent rapid calls
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

/**
 * Clamp value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Format angle to 0-360 range
 * @param angle - Angle in degrees
 * @returns Normalized angle
 */
export const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};
