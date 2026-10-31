import { expect, test } from 'vitest';
import type { TemplateDraft } from '../../../core/templates/TemplateDraft';
import { ProgressionRangeDefaults, withProgression } from './templateProgressionEdits';

const draft: TemplateDraft = {
  name: 'Synthetic',
  folderId: null,
  notes: null,
  exercises: [
    {
      exerciseId: 1,
      supersetGroup: null,
      notes: null,
      sets: [
        { kind: 'working', targetRepsLow: null, targetRepsHigh: null, targetRpe: 8 },
        { kind: 'working', targetRepsLow: 4, targetRepsHigh: 6, targetRpe: 9 },
        { kind: 'warmup', targetRepsLow: null, targetRepsHigh: null, targetRpe: null },
      ],
    },
  ],
};
test('confirmed range fills only missing work targets and preserves effort, warm-ups and other ranges', () => {
  const result = withProgression(draft, 0, 'double', ProgressionRangeDefaults);
  expect(result.exercises[0]).toMatchObject({
    progression: 'double',
    sets: [
      { targetRepsLow: 8, targetRepsHigh: 12, targetRpe: 8 },
      { targetRepsLow: 4, targetRepsHigh: 6, targetRpe: 9 },
      { targetRepsLow: null, targetRepsHigh: null },
    ],
  });
  expect(draft.exercises[0]?.progression).toBeUndefined();
});
test('turning off preserves targets and only affects the selected template exercise', () => {
  const enabled = withProgression({ ...draft, exercises: [...draft.exercises, ...draft.exercises] }, 0, 'double', {
    low: 3,
    high: 5,
  });
  const off = withProgression(enabled, 0, null);
  expect(off.exercises[0]?.progression).toBeNull();
  expect(off.exercises[0]?.sets).toEqual(enabled.exercises[0]?.sets);
  expect(off.exercises[1]).toEqual(draft.exercises[0]);
});

test('an owner-confirmed range can differ from the offered 8–12 defaults', () => {
  expect(withProgression(draft, 0, 'double', { low: 3, high: 5 }).exercises[0]?.sets[0]).toMatchObject({
    targetRepsLow: 3,
    targetRepsHigh: 5,
    targetRpe: 8,
  });
});
