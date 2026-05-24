/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform, View, type ViewProps, type ViewStyle } from 'react-native';
import { colors } from '../theme';

export type GlassTint = 'chrome' | 'card' | 'sheet';

interface Props extends ViewProps {
  tint?: GlassTint;
}

/**
 * Cross-platform "raised surface" that becomes a true Liquid Glass view
 * on iOS 26+ (via modules/glass-surface/) and a warm-paper fallback on
 * Android / web / older iOS. Respects Reduce Transparency natively.
 */
export function GlassSurface({ tint = 'card', style, children, ...rest }: Props) {
  if (Platform.OS === 'ios') {
    try {
      const NativeGlass = require('../../modules/glass-surface/src').default as React.ComponentType<
        Props & { tint?: string }
      >;
      return (
        <NativeGlass tint={tint} style={style} {...rest}>
          {children}
        </NativeGlass>
      );
    } catch {
      // Falls through to the paper fallback if the native module
      // hasn't been linked yet (e.g. before the first prebuild).
    }
  }
  return (
    <View style={[paperFallback(tint), style]} {...rest}>
      {children}
    </View>
  );
}

function paperFallback(tint: GlassTint): ViewStyle {
  if (tint === 'chrome') {
    return {
      backgroundColor: colors.bg.paper,
      borderTopWidth: 1,
      borderTopColor: colors.line.hairline,
    };
  }
  if (tint === 'sheet') {
    return { backgroundColor: colors.bg.raised };
  }
  return { backgroundColor: colors.bg.raised, borderRadius: 12 };
}
