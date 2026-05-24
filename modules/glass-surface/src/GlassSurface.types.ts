import type { ViewProps } from 'react-native';

export type GlassTint = 'chrome' | 'card' | 'sheet';

export interface GlassSurfaceViewProps extends ViewProps {
  /** Glass tint hint — different surface types get slightly different
   *  refraction / opacity in the native renderer. */
  tint?: GlassTint;
  /** Corner radius for the SwiftUI glass shape. Defaults: 0 chrome / 12 card / 24 sheet. */
  cornerRadius?: number;
}
