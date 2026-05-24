/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform, View, type ViewProps, type ViewStyle } from 'react-native';
import { colors } from '../theme';

export type GlassTint = 'chrome' | 'card' | 'sheet';

interface Props extends ViewProps {
  tint?: GlassTint;
  cornerRadius?: number;
}

const DEFAULT_RADIUS: Record<GlassTint, number> = { chrome: 0, card: 12, sheet: 24 };

/**
 * Cross-platform "raised surface" that becomes a true Liquid Glass view
 * on iOS 26+ (via modules/glass-surface/, which uses SwiftUI's
 * `.glassEffect()` modifier) and a warm-paper fallback on Android /
 * web / older iOS. Respects Reduce Transparency natively.
 */
export function GlassSurface({ tint = 'card', cornerRadius, style, children, ...rest }: Props) {
  const radius = cornerRadius ?? DEFAULT_RADIUS[tint];

  if (Platform.OS === 'ios') {
    try {
      const NativeGlass = require('../../modules/glass-surface/src').default as React.ComponentType<
        Props & { tint?: string; cornerRadius?: number }
      >;
      return (
        <NativeGlass tint={tint} cornerRadius={radius} style={style} {...rest}>
          {children}
        </NativeGlass>
      );
    } catch {
      // Falls through to the paper fallback if the native module
      // hasn't been linked yet (e.g. before the first prebuild).
    }
  }
  return (
    <View style={[paperFallback(tint, radius), style]} {...rest}>
      {children}
    </View>
  );
}

function paperFallback(tint: GlassTint, radius: number): ViewStyle {
  if (tint === 'chrome') {
    return {
      backgroundColor: colors.bg.paper,
      borderTopWidth: 1,
      borderTopColor: colors.line.hairline,
    };
  }
  if (tint === 'sheet') {
    return { backgroundColor: colors.bg.raised, borderRadius: radius };
  }
  return { backgroundColor: colors.bg.raised, borderRadius: radius };
}
