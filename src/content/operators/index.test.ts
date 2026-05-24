import { describe, it, expect } from 'vitest';
import { loadBundledOperators } from './index';

describe('loadBundledOperators', () => {
  it('returns 20 bundled operators, all schema-valid', () => {
    const ops = loadBundledOperators();
    expect(ops.length).toBe(20);
  });

  it('includes the major UK rail brands by id', () => {
    const ops = loadBundledOperators();
    const ids = new Set(ops.map((o) => o.id));
    for (const id of [
      'avanti-west-coast',
      'lner',
      'northern',
      'scotrail',
      'southeastern',
      'south-western-railway',
      'great-western-railway',
      'greater-anglia',
      'crosscountry',
      'east-midlands-railway',
      'thameslink',
      'southern',
      'transpennine-express',
      'transport-for-wales',
      'west-midlands-railway',
      'chiltern-railways',
      'c2c',
      'merseyrail',
      'lumo',
      'elizabeth-line',
    ]) {
      expect(ids.has(id), `expected operator id "${id}" in dataset`).toBe(true);
    }
  });

  it('every rail entry has a primary email or url for complaints routing', () => {
    const ops = loadBundledOperators();
    for (const op of ops) {
      expect(
        op.complaintsRoute.primaryEmail || op.complaintsRoute.primaryUrl,
        `operator ${op.id} has no complaints route`,
      ).toBeTruthy();
    }
  });
});
