/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';
import type { AppleFmNativeModule } from '../../modules/apple-fm/src/AppleFm.types';

/**
 * Returns the native Apple FoundationModels module on iOS, or null on
 * every other platform (web, Android, jest test host). Lazy-required so
 * non-iOS bundles never reach the native binding.
 */
export function defaultAppleFmModule(): AppleFmNativeModule | null {
  if (Platform.OS !== 'ios') return null;
  try {
    const mod = require('../../modules/apple-fm/src') as {
      default: AppleFmNativeModule;
    };
    return mod.default;
  } catch {
    return null;
  }
}
