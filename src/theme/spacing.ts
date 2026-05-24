/** 4pt spacing scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const hairline = 1;

/** Minimum tap target — Apple HIG + WCAG 2.5.5 (Target Size). */
export const minTapTarget = 56;
