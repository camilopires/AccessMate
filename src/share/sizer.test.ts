import { describe, it, expect } from 'vitest';
import { sizeForPlatform, PLATFORM_LIMITS } from './sizer';

describe('sizeForPlatform', () => {
  it('returns the text untouched when under the platform limit', () => {
    expect(sizeForPlatform('short', 'x')).toBe('short');
    expect(sizeForPlatform('short', 'bluesky')).toBe('short');
    expect(sizeForPlatform('short', 'threads')).toBe('short');
    expect(sizeForPlatform('short', 'instagram')).toBe('short');
  });

  it('trims with an ellipsis when over the limit for X (280)', () => {
    const long = 'a'.repeat(400);
    const out = sizeForPlatform(long, 'x');
    expect(out.length).toBe(280);
    expect(out.endsWith('…')).toBe(true);
  });

  it('respects 300 chars for Bluesky and 500 for Threads', () => {
    const long = 'b'.repeat(800);
    expect(sizeForPlatform(long, 'bluesky').length).toBe(300);
    expect(sizeForPlatform(long, 'threads').length).toBe(500);
  });

  it('does not trim for Instagram captions (no hard limit in app)', () => {
    const long = 'c'.repeat(800);
    expect(sizeForPlatform(long, 'instagram').length).toBe(800);
  });

  it('exposes the limits map', () => {
    expect(PLATFORM_LIMITS.x).toBe(280);
    expect(PLATFORM_LIMITS.bluesky).toBe(300);
    expect(PLATFORM_LIMITS.threads).toBe(500);
    expect(PLATFORM_LIMITS.instagram).toBe(Infinity);
  });
});
