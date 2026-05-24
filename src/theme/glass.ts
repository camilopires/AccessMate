/**
 * iOS-only Liquid Glass palette.
 *
 * Used when GlassSurface is rendering its native UIGlassMaterialView
 * (iOS 26+, Reduce Transparency off). Switches the canvas to a cool
 * charcoal so the warm-amber accent is replaced by a vivid coral that
 * reads through glass refraction.
 *
 * Cross-platform code should keep using the warm palette from
 * src/theme/colors.ts. This module is only imported in iOS-conditional
 * code paths (see src/components/GlassSurface.tsx).
 */
export const glassColors = {
  canvas: '#1A1D24',
  glassTint: 'rgba(255, 248, 235, 0.30)',
  ink: {
    onGlass: '#F4EFE5',
    onGlassMuted: '#B8B3A8',
    onCanvas: '#F4EFE5',
  },
  accent: {
    base: '#FF6A4D',
    deep: '#C04829',
  },
  emergency: {
    base: '#FF2D3A',
    deep: '#B11820',
  },
  line: {
    onGlass: 'rgba(255, 248, 235, 0.18)',
  },
} as const;
