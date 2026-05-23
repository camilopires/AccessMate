import type { AppleFmAvailability, AppleFmNativeModule } from './AppleFm.types';

export * from './AppleFm.types';

const AppleFm: AppleFmNativeModule = {
  async isAvailable(): Promise<boolean> {
    return false;
  },
  async getAvailability(): Promise<AppleFmAvailability> {
    return { available: false, reason: 'unsupported-device' };
  },
  async polish(): Promise<string> {
    throw new Error('AppleFm is not available on this platform');
  },
};

export default AppleFm;
