import { createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { ActionMenuRow, type ActionMenuItem } from '../../design/components/ActionMenuRow';
import { DeloadChip } from './DeloadChip';
import { ExerciseInfoLine } from './ExerciseInfoLine';
import { exerciseMenuItems } from './exerciseMenuItems';
import type { ExerciseCardActions } from './ExerciseCardActions';
import { WorkoutMenu } from './WorkoutMenu';
import { SetRow } from './SetRow';
import { makeExercise, makeSet } from './workoutTestData';

const previous = makeSet({ weightKilograms: 100 });
const entry: LiveWorkoutEntry = {
  entry: { id: 1, workoutId: 1, exerciseId: 1, position: 0, notes: null, supersetGroup: null, deloadStage: 1 },
  exercise: makeExercise(),
  sets: [previous],
  previous: [previous],
  deload: {
    reductionPercent: 20,
    suggestions: [{ setId: previous.id, weightKilograms: 80, reps: previous.reps, reductionPercent: 20 }],
  },
};
const actions: ExerciseCardActions = {
  edit: vi.fn(),
  toggleCompleted: vi.fn(),
  selectKind: vi.fn(),
  deleteSet: vi.fn(),
  addSet: vi.fn(),
  switchUnit: vi.fn(),
  move: vi.fn(),
  requestRemoval: vi.fn(),
  setDeload: vi.fn(),
  applySuggestion: vi.fn(),
};

test('exercise menu exposes the yellow deload action and forwards stage enable only on selection', () => {
  const items = exerciseMenuItems({
    entry,
    index: 0,
    count: 1,
    actions,
    unit: 'kg',
    live: { editNote: vi.fn(), editRest: vi.fn(), showRpe: vi.fn(), showsRpe: false },
  });
  const action = items.find((item) => item.label === 'Deload this exercise');
  if (action === undefined) throw new Error('Missing deload action');
  expect(renderToStaticMarkup(createElement(ActionMenuRow, { item: action, onChosen: vi.fn() }))).toContain(
    'data-deload="true"',
  );
  expect(actions.setDeload).not.toHaveBeenCalled();
  action.onSelect();
  expect(actions.setDeload).toHaveBeenCalledExactlyOnceWith(1, true);
});

test('whole-workout menu forwards its yellow action without accepting suggestions', () => {
  const onDeload = vi.fn();
  const menu = WorkoutMenu({ onRename: vi.fn(), onDiscard: vi.fn(), onDeload });
  const item = menu.props.items.find((candidate: ActionMenuItem) => candidate.label === 'Deload whole workout');
  expect(item?.isDeload).toBe(true);
  expect(onDeload).not.toHaveBeenCalled();
  item?.onSelect();
  expect(onDeload).toHaveBeenCalledOnce();
});

test('info line shows a nominal reduction and the chip offers End deload, while History uses a tag', () => {
  const onEnd = vi.fn();
  const html = renderToStaticMarkup(createElement(ExerciseInfoLine, { entry, onEndDeload: onEnd }));
  expect(html).toContain('Deload · −20%');
  expect(html).not.toContain('Use suggested');
  const chip = DeloadChip({ reductionPercent: 20, onEnd });
  const child: unknown = chip.props.children;
  if (!isValidElement<{ items: readonly { label: string; onSelect: () => void }[] }>(child))
    throw new Error('Missing chip menu');
  expect(child.props.items[0]?.label).toBe('End deload');
  child.props.items[0]?.onSelect();
  expect(onEnd).toHaveBeenCalledOnce();
  expect(renderToStaticMarkup(createElement(DeloadChip, {}))).toContain('>Deload</span>');
});

test('deload occupies amber beside unchanged grey values, and entered/completed/history cells hide suggestions', () => {
  const render = (options: Partial<Parameters<typeof SetRow>[0]> = {}) =>
    renderToStaticMarkup(
      createElement(SetRow, {
        entry,
        set: previous,
        label: '1',
        previous,
        editing: undefined,
        actions,
        ...options,
      }),
    );
  expect(render()).toContain('Use suggested weight 80');
  expect(render()).toContain('>100</span>');
  expect(render({ actions: { ...actions, isValueEntered: () => true } })).not.toContain('Use suggested');
  expect(render({ set: { ...previous, isCompleted: true } })).not.toContain('Use suggested');
  expect(render({ isPastWorkout: true })).not.toContain('Use suggested');
});
