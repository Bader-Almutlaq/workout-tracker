import { describe, expect, it, vi } from 'vitest';

vi.mock('../../data/database', () => ({}));
import { toggleBulkExclusions, updateExclusions } from './ImportReviewStep';

describe('bulk exclusions', () => {
  it('excludes each flagged set and restores the previous decisions on undo', () => {
    const initial = new Set([1, 5]);
    const bulk = toggleBulkExclusions(initial, [1, 2, 2, 3]);
    expect([...bulk]).toEqual([1, 5, 2, 3]);
    expect([...initial]).toEqual([1, 5]);
    expect([...toggleBulkExclusions(bulk, [1, 2, 3])]).toEqual([1, 5]);
  });

  it('keeps undo available after a per-set change and clears it after undo', () => {
    const bulk = toggleBulkExclusions(new Set([1]), [2, 3]);
    const edited = updateExclusions(bulk, [2], false);
    expect([...edited]).toEqual([1, 3]);
    const restored = toggleBulkExclusions(edited, [2, 3]);
    expect([...restored]).toEqual([1]);
    expect([...toggleBulkExclusions(restored, [2, 3])]).toEqual([1, 2, 3]);
  });
});
