import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { SetRow } from './SetRow';
import { makeExercise, makeSet } from './workoutTestData';

function render(overrides: Partial<ComponentProps<typeof SetRow>> = {}) {
  const set = makeSet({ entryUnit: 'lb', weightKilograms: 61.23497, isCompleted: true, notes: 'Line one\nLine two' });
  return renderToStaticMarkup(
    createElement(SetRow, {
      entry: {
        entry: { id: 1, workoutId: 1, exerciseId: 1, position: 0, notes: null, supersetGroup: null },
        exercise: makeExercise({ defaultEntryUnit: 'lb' }),
        sets: [set],
        previous: [],
      },
      set,
      label: '1',
      previous: undefined,
      editing: undefined,
      actions: {
        edit: vi.fn(),
        toggleCompleted: vi.fn(),
        selectKind: vi.fn(),
        deleteSet: vi.fn(),
        addSet: vi.fn(),
        switchUnit: vi.fn(),
        move: vi.fn(),
        requestRemoval: vi.fn(),
      },
      ...overrides,
    }),
  );
}

test('a historical mixed-unit set identifies lb when the card header is kg, even if the future default is lb', () => {
  const html = render({ isPastWorkout: true, displayUnit: 'kg' });
  const weightCell = html.match(/<button[^>]*aria-label="Weight"[^>]*>(.*?)<\/button>/s)?.[1];
  expect(weightCell).toContain('135');
  expect(weightCell).toContain('>lb</span>');
});

test('historical completion is read-only and multiline set notes are preserved in a textarea', () => {
  const html = render({ isPastWorkout: true, displayUnit: 'lb', onNotesChange: vi.fn() });
  expect(html).toMatch(/<button[^>]*aria-label="Completed"[^>]*disabled=""/);
  expect(html).toMatch(/<textarea[^>]*>Line one\nLine two<\/textarea>/);
});

test('live completion remains interactive with no new note controls', () => {
  const html = render();
  expect(html).toMatch(/<button[^>]*aria-label="Completed"/);
  expect(html).not.toContain('disabled=""');
  expect(html).not.toContain('<textarea');
});
