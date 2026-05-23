import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { polishViaCloud } from './polish';

describe('polishViaCloud', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, _init) => ({
        ok: true,
        status: 200,
        json: async () => ({ polished: 'Polished narrative.' }),
      })) as unknown as typeof fetch,
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when no endpoint is configured', async () => {
    const got = await polishViaCloud({
      endpoint: '',
      scenarioId: 's',
      narrativeText: 'n',
    });
    expect(got).toBeNull();
  });

  it('POSTs the scenarioId + narrative + optional profile excerpt', async () => {
    await polishViaCloud({
      endpoint: 'https://example.com/polish',
      scenarioId: 'missed-passenger-assist',
      narrativeText: 'I was left at the platform.',
      profileExcerpt: 'Powered wheelchair user',
    });
    const f = global.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(f).toHaveBeenCalledTimes(1);
    const [_url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.scenarioId).toBe('missed-passenger-assist');
    expect(body.profileExcerpt).toBe('Powered wheelchair user');
  });

  it('returns null when the server responds with an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 429,
        json: async () => ({ error: 'rate_limited' }),
      })) as unknown as typeof fetch,
    );
    const got = await polishViaCloud({
      endpoint: 'https://example.com/polish',
      scenarioId: 's',
      narrativeText: 'n',
    });
    expect(got).toBeNull();
  });
});
