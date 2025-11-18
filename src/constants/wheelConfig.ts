/**
 * Configuration constants for the color wheel spinner
 * Centralizes all magic numbers and configuration values
 */

export const WHEEL_CONFIG = {
  // Wheel dimensions
  RADIUS: 200,
  WHEEL_SIZE: 500, // h-[500px]
  SECTOR_LABEL_OFFSET_RATIO: 0.8, // Offset from center as ratio of radius
  LABEL_DISTANCE: 250, // px from center
  BORDER_WIDTH: 4, // px

  // Spin animation
  MIN_SPIN_ROTATIONS: 5,
  MAX_SPIN_ROTATIONS: 10,
  MIN_SPIN_DURATION_MS: 2000,
  MAX_SPIN_DURATION_MS: 6000,

  // Confetti
  CONFETTI_DURATION_MS: 3000,
  CONFETTI_STAGE_WIDTH: 3200,
  CONFETTI_FORCE: 0.3,

  // History and limits
  HISTORY_MAX_ITEMS: 35,
  MAX_OPTIONS: 20,
  MAX_OPTION_LENGTH: 50,
  MAX_TITLE_LENGTH: 100,

  // Colors - Education-friendly, warm, and accessible palette
  COLORS: {
    red: "#FF8A80",      // Soft, warm red
    green: "#81C784",    // Fresh, friendly green
    blue: "#64B5F6",     // Calming, friendly blue
    cyan: "#4DD0E1",     // Soft cyan/turquoise
    magenta: "#CE93D8",  // Soft, friendly magenta
    yellow: "#FFE082",   // Warm, friendly yellow
    orange: "#FFB74D",   // Warm orange
  } as const,

  // UI
  HISTORY_SCROLL_HEIGHT: 400,
  FORM_WIDTH: 400,
} as const;

export type WheelConfig = typeof WHEEL_CONFIG;
