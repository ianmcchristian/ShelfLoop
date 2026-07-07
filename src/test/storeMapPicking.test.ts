import { describe, expect, it } from 'vitest';

import {
  chooseDenseRackStackPickIndex,
  chooseRandomDenseRackIndex,
} from '../components/dashboard/storeMapPicking';

describe('Rack B stack picking', () => {
  it('picks one active lobe from a precision-picked triplet stack', () => {
    const pickedIndex = chooseDenseRackStackPickIndex([true, true, true], 0);

    expect([0, 1, 2]).toContain(pickedIndex);
  });

  it('does not pick an already-missing lobe from a triplet stack', () => {
    const pickedIndex = chooseDenseRackStackPickIndex([true, false, true], 0);

    expect([0, 2]).toContain(pickedIndex);
  });

  it('applies random in-stack lobe picking when a Rack B random pull selects a stack', () => {
    const pickedIndex = chooseRandomDenseRackIndex([false, false, false, true, true, true]);

    expect([3, 4, 5]).toContain(pickedIndex);
  });
});
