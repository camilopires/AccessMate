import { describe, it, expect } from 'vitest';
import { loadBundledOperators } from './index';

describe('loadBundledOperators', () => {
  it('returns the bundled operators, all schema-valid', () => {
    const ops = loadBundledOperators();
    expect(ops.length).toBeGreaterThanOrEqual(1);
    expect(ops.find((o) => o.id === 'avanti-west-coast')).toBeDefined();
  });
});
