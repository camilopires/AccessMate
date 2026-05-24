import { requireNativeViewManager } from 'expo-modules-core';
import type { ComponentType } from 'react';
import type { GlassSurfaceViewProps } from './GlassSurface.types';

export * from './GlassSurface.types';

const NativeView: ComponentType<GlassSurfaceViewProps> = requireNativeViewManager('GlassSurface');

export default NativeView;
