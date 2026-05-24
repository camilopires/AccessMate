import type {
  AppleFmAvailability,
  AppleFmConversationTurn,
  AppleFmNativeModule,
} from './AppleFm.types';

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
  async startConversation(): Promise<string> {
    throw new Error('AppleFm is not available on this platform');
  },
  async sendMessage(): Promise<AppleFmConversationTurn> {
    throw new Error('AppleFm is not available on this platform');
  },
  async endConversation(): Promise<void> {
    // no-op
  },
};

export default AppleFm;
