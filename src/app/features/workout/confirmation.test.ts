import { describe, expect, test } from 'vitest';
import { confirmationText } from './confirmation';

describe('confirmation text', () => {
  test('Finishing says how many planned sets will be discarded', () => {
    expect(confirmationText({ kind: 'finish', plannedSets: 3 })).toEqual({
      title: 'Finish workout?',
      message: '3 sets weren’t completed and will be discarded.',
      confirmLabel: 'Finish',
    });
    expect(confirmationText({ kind: 'finish', plannedSets: 1 }).message).toBe(
      '1 set wasn’t completed and will be discarded.',
    );
  });

  test('Discarding says nothing will be kept', () => {
    expect(confirmationText({ kind: 'discard' })).toEqual({
      title: 'Discard this workout?',
      message: 'Nothing logged in it will be kept.',
      confirmLabel: 'Discard workout',
    });
  });

  test('Removing an exercise names it', () => {
    expect(confirmationText({ kind: 'removeExercise', entryId: 4, name: 'Bench Press (Barbell)' }).title).toBe(
      'Remove Bench Press (Barbell)?',
    );
  });
});
