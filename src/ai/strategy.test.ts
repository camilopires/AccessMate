import { describe, it, expect, vi } from 'vitest';
import { aiPolish } from './strategy';

describe('aiPolish', () => {
  it('returns null when every adapter returns null', async () => {
    const got = await aiPolish(
      { scenarioId: 's', narrativeText: 'n' },
      { tryAppleFm: async () => null, tryCloud: async () => null },
    );
    expect(got).toEqual({ provider: 'none', polished: null });
  });

  it('prefers Apple FM when it returns text', async () => {
    const tryAppleFm = vi.fn(async () => 'fm output');
    const tryCloud = vi.fn(async () => 'cloud output');
    const got = await aiPolish({ scenarioId: 's', narrativeText: 'n' }, { tryAppleFm, tryCloud });
    expect(got).toEqual({ provider: 'apple-fm', polished: 'fm output' });
    expect(tryCloud).not.toHaveBeenCalled();
  });

  it('falls back to cloud when Apple FM returns null', async () => {
    const tryAppleFm = vi.fn(async () => null);
    const tryCloud = vi.fn(async () => 'cloud output');
    const got = await aiPolish({ scenarioId: 's', narrativeText: 'n' }, { tryAppleFm, tryCloud });
    expect(got).toEqual({ provider: 'cloud', polished: 'cloud output' });
    expect(tryAppleFm).toHaveBeenCalledTimes(1);
  });

  it('continues past an adapter that throws', async () => {
    const tryAppleFm = vi.fn(async () => {
      throw new Error('fm exploded');
    });
    const tryCloud = vi.fn(async () => 'cloud output');
    const got = await aiPolish({ scenarioId: 's', narrativeText: 'n' }, { tryAppleFm, tryCloud });
    expect(got).toEqual({ provider: 'cloud', polished: 'cloud output' });
  });
});
