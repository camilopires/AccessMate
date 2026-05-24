import { describe, it, expect } from 'vitest';
import { chooseFlow, type ChooseFlowDeps } from './conversation';

function deps(overrides: Partial<ChooseFlowDeps> = {}): ChooseFlowDeps {
  return {
    platform: 'ios',
    aiProvider: 'on-device',
    isAppleFmAvailable: async () => true,
    ...overrides,
  };
}

describe('chooseFlow', () => {
  it('returns template on non-iOS platforms', async () => {
    expect(await chooseFlow(deps({ platform: 'android' }))).toBe('template');
    expect(await chooseFlow(deps({ platform: 'web' }))).toBe('template');
  });

  it('returns template when AI is turned off in settings', async () => {
    expect(await chooseFlow(deps({ aiProvider: 'off' }))).toBe('template');
  });

  it('returns template when the on-device model reports unavailable', async () => {
    const got = await chooseFlow(deps({ isAppleFmAvailable: async () => false }));
    expect(got).toBe('template');
  });

  it('returns conversational on iOS with AI on and the model available', async () => {
    expect(await chooseFlow(deps())).toBe('conversational');
    expect(await chooseFlow(deps({ aiProvider: 'cloud' }))).toBe('conversational');
  });

  it('treats a thrown availability check as unavailable', async () => {
    const got = await chooseFlow(
      deps({
        isAppleFmAvailable: async () => {
          throw new Error('module not linked');
        },
      }),
    );
    expect(got).toBe('template');
  });
});
