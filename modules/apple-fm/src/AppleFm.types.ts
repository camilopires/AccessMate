export type AppleFmUnavailableReason =
  | 'unsupported-device'
  | 'apple-intelligence-not-enabled'
  | 'model-not-ready'
  | 'unknown';

export type AppleFmAvailability =
  | { available: true }
  | { available: false; reason: AppleFmUnavailableReason };

export interface AppleFmNativeModule {
  isAvailable(): Promise<boolean>;
  getAvailability(): Promise<AppleFmAvailability>;
  polish(prompt: string, systemPrompt: string): Promise<string>;
}
