import { describe, expect, test } from 'vitest';
import { isHardSet, type HardSet } from './HardSets';

describe('isHardSet', () => {
  test.each<[HardSet, boolean]>([
    [{ kind: 'working', rpe: 6, isCompleted: true }, true],
    [{ kind: 'working', rpe: 5.5, isCompleted: true }, false],
    [{ kind: 'working', rpe: 10, isCompleted: true }, true],
    [{ kind: 'working', rpe: null, isCompleted: true }, true],
    [{ kind: 'drop', rpe: 8, isCompleted: true }, true],
    [{ kind: 'drop', rpe: 5, isCompleted: true }, false],
    [{ kind: 'failure', rpe: 2, isCompleted: true }, true],
    [{ kind: 'failure', rpe: null, isCompleted: true }, true],
    [{ kind: 'warmup', rpe: 10, isCompleted: true }, false],
    [{ kind: 'warmup', rpe: null, isCompleted: true }, false],
    [{ kind: 'working', rpe: 10, isCompleted: false }, false],
    [{ kind: 'failure', rpe: null, isCompleted: false }, false],
  ])('counts %j as hard: %s (report algorithms 1 and 10)', (set, expected) => {
    expect(isHardSet(set)).toBe(expected);
  });
});
