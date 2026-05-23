import { requireNativeModule } from 'expo-modules-core';
import type { AppleFmNativeModule } from './AppleFm.types';

export * from './AppleFm.types';

const AppleFm = requireNativeModule<AppleFmNativeModule>('AppleFm');
export default AppleFm;
