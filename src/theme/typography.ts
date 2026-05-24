import type { TextStyle } from 'react-native';

/**
 * Type scale — Fraunces for display (warm, distinctive serif with the SOFT
 * axis) and Manrope for body (geometric sans, refined ink quality).
 *
 * Sizes follow a 1.25 ratio on mobile and stay >= 14pt so font-scale
 * accessibility settings can amplify without text getting tiny.
 */

export const fontFamily = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemibold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
} as const;

export const type = {
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  heading: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.1,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  bodyEmphasis: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  } satisfies TextStyle,
  action: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  } satisfies TextStyle,
} as const;

export const FONT_NAMES_TO_LOAD = {
  Fraunces_600SemiBold: 'fraunces',
  Fraunces_700Bold: 'fraunces',
  Manrope_400Regular: 'manrope',
  Manrope_500Medium: 'manrope',
  Manrope_600SemiBold: 'manrope',
  Manrope_700Bold: 'manrope',
} as const;
