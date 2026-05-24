import { View } from 'react-native';
import type { GlassSurfaceViewProps } from './GlassSurface.types';

export * from './GlassSurface.types';

// Web fallback: just a plain View. The cross-platform GlassSurface
// component (src/components/GlassSurface.tsx) applies a paper-tinted
// style around it.
const GlassSurfaceView = View as React.ComponentType<GlassSurfaceViewProps>;

export default GlassSurfaceView;
