import { describe, it, expect, vi } from 'vitest';
import { polishViaAppleFm, buildSystemPrompt } from './apple-fm';
import type { AppleFmNativeModule } from '../../modules/apple-fm/src/AppleFm.types';

function fakeModule(overrides: Partial<AppleFmNativeModule> = {}): AppleFmNativeModule {
  return {
    isAvailable: async () => true,
    getAvailability: async () => ({ available: true }) as const,
    polish: async () => 'polished',
    ...overrides,
  };
}

describe('polishViaAppleFm', () => {
  it('returns null when the native module reports unavailable', async () => {
    const module = fakeModule({
      isAvailable: async () => false,
      getAvailability: async () => ({ available: false, reason: 'unsupported-device' }),
    });
    const got = await polishViaAppleFm({ scenarioId: 's', narrativeText: 'n' }, { module });
    expect(got).toBeNull();
  });

  it('passes the narrative and a forbid-citations system prompt to the module', async () => {
    const polish = vi.fn(async (_prompt: string, _systemPrompt: string) => 'polished narrative');
    const module = fakeModule({ polish });
    await polishViaAppleFm(
      { scenarioId: 'missed-passenger-assist', narrativeText: 'I was left.' },
      { module },
    );
    expect(polish).toHaveBeenCalledTimes(1);
    const [prompt, systemPrompt] = polish.mock.calls[0];
    expect(prompt).toContain('I was left.');
    expect(systemPrompt).toMatch(/do not .*legal citations/i);
  });

  it('returns the polished string from the module', async () => {
    const module = fakeModule({ polish: async () => 'cleaned up' });
    const got = await polishViaAppleFm({ scenarioId: 's', narrativeText: 'n' }, { module });
    expect(got).toBe('cleaned up');
  });

  it('returns null when the module throws', async () => {
    const module = fakeModule({
      polish: async () => {
        throw new Error('model busy');
      },
    });
    const got = await polishViaAppleFm({ scenarioId: 's', narrativeText: 'n' }, { module });
    expect(got).toBeNull();
  });
});

describe('buildSystemPrompt', () => {
  it('forbids adding legal citations', () => {
    const sys = buildSystemPrompt({ scenarioId: 's', narrativeText: 'n' });
    expect(sys.toLowerCase()).toMatch(/do not .*legal citations/);
  });

  it('caps output length deterministically', () => {
    const sys = buildSystemPrompt({ scenarioId: 's', narrativeText: 'x'.repeat(100) });
    expect(sys).toMatch(/within \d+ characters/i);
  });
});
