import { describe, expect, it } from 'vitest';

import {
  chooseDenseRackStackPickIndex,
  chooseRandomDenseRackIndex,
} from '../components/dashboard/storeMapPicking';

describe('Rack B stack picking', () => {
  it('picks the center lobe first for a precision-picked triplet stack', () => {
    expect(chooseDenseRackStackPickIndex([true, true, true], 0)).toBe(1);
    expect(chooseDenseRackStackPickIndex([true, true, true], 1)).toBe(1);
    expect(chooseDenseRackStackPickIndex([true, true, true], 2)).toBe(1);
  });

  it('randomizes only between side lobes after the center lobe is missing', () => {
    const pickedIndex = chooseDenseRackStackPickIndex([true, false, true], 0);

    expect([0, 2]).toContain(pickedIndex);
  });

  it('applies center-first picking when a Rack B random pull selects a stack', () => {
    expect(chooseRandomDenseRackIndex([false, false, false, true, true, true])).toBe(4);
  });
});
