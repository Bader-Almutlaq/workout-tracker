import { createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import type { ExerciseCardActions } from './ExerciseCardActions';
import { CheckButton } from './CheckButton';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseInfoLine } from './ExerciseInfoLine';
import { SetRow } from './SetRow';
import { SetColumnHeader } from './SetColumnHeader';
import { SET_KIND_CHOICES, SET_KIND_NAMES } from './setKindItems';
import { exerciseMenuItems } from './exerciseMenuItems';
import { ValueCell } from './ValueCell';
import { makeExercise, makeSet } from './workoutTestData';

vi.mock('../../data/database', () => ({
  database: {},
  useDatabaseQuery: () => ({ status: 'ready', value: [1] }),
}));

const actions: ExerciseCardActions = {
  edit: vi.fn(),
  toggleCompleted: vi.fn(),
  selectKind: vi.fn(),
  deleteSet: vi.fn(),
  addSet: vi.fn(),
  switchUnit: vi.fn(),
  move: vi.fn(),
  requestRemoval: vi.fn(),
};
const entry: LiveWorkoutEntry = {
  entry: { id: 1, workoutId: 1, exerciseId: 1, position: 0, notes: null, supersetGroup: null },
  exercise: makeExercise(),
  sets: [makeSet()],
  previous: [makeSet()],
};

function row(options: Partial<Parameters<typeof SetRow>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(SetRow, {
      entry,
      set: entry.sets[0] ?? makeSet(),
      label: '1',
      previous: entry.previous[0],
      editing: undefined,
      actions,
      ...options,
    }),
  );
}

test('live headers have five columns; History keeps a separate RPE column', () => {
  const header = (isPastWorkout: boolean) =>
    renderToStaticMarkup(createElement(SetColumnHeader, { tracking: 'weight-reps', unit: 'kg', isPastWorkout }));
  expect(header(false)).toContain('>Previous<');
  expect(header(false)).not.toContain('>RPE<');
  expect(header(true)).toContain('>RPE<');
});

test('empty RPE badges are hidden until requested, while entered effort is always visible', () => {
  const render = (rpe: number | null, showsEmptyRpe = false) =>
    renderToStaticMarkup(
      createElement(CheckButton, {
        isCompleted: false,
        onPress: vi.fn(),
        onEditRpe: vi.fn(),
        rpe,
        showsEmptyRpe,
      }),
    );
  expect(render(null)).not.toContain('aria-label="Set RPE"');
  expect(render(null, true)).toContain('aria-label="Set RPE"');
  expect(render(7.5)).toContain('aria-label="Edit RPE 7.5"');
  expect(row({ set: makeSet({ rpe: 7.5 }) })).not.toContain('aria-label="RPE"');
});

test('planned live cells are greyed until typed/accepted; completed cells and history are ordinary values', () => {
  expect(row()).toMatch(/data-placeholder="true"[^>]*aria-label="Weight"/);
  expect(row({ actions: { ...actions, isValueEntered: () => true } })).toMatch(
    /data-placeholder="false"[^>]*aria-label="Weight"/,
  );
  expect(row({ set: makeSet({ isCompleted: true }) })).toMatch(/data-placeholder="false"[^>]*aria-label="Weight"/);
  expect(row({ isPastWorkout: true })).toMatch(/data-placeholder="false"[^>]*aria-label="Weight"/);
});

test('the opt-in suggestion stays beside the current value and copies only when its button is tapped', () => {
  const accept = vi.fn();
  const cell = ValueCell({
    name: 'Weight',
    text: '41',
    isPlaceholder: true,
    isEditing: false,
    onPress: vi.fn(),
    suggestion: { value: 43.5, text: '43.5', onAccept: accept },
  });
  const html = renderToStaticMarkup(cell);
  expect(html).toContain('>41</span>');
  expect(html).toContain('Use suggested weight 43.5');
  expect(accept).not.toHaveBeenCalled();
  const suggestionButton: unknown = cell.props.children[1];
  if (!isValidElement<{ onClick: () => void }>(suggestionButton)) throw new Error('Missing suggestion button');
  suggestionButton.props.onClick();
  expect(accept).toHaveBeenCalledWith(43.5);
});

test('warm-up suggestions use set entry units, disappear when accepted, and do not appear in history', () => {
  const warmup = makeSet({ kind: 'warmup', entryUnit: 'lb', weightKilograms: 20.41165665 });
  const options = { set: warmup, isSuggested: true, actions: { ...actions, applySuggestion: vi.fn() } };
  // The untouched value already is the suggestion, so it shows once, in amber, without a second copy.
  expect(row(options)).toMatch(/data-suggested="true" aria-label="Weight"><span[^>]*>45</);
  expect(row(options)).not.toContain('Use suggested');
  expect(row({ ...options, actions: { ...options.actions, isValueEntered: () => true } })).not.toContain(
    'data-suggested="true"',
  );
  expect(row({ ...options, isPastWorkout: true })).not.toContain('data-suggested="true"');
});

test('warm-up surface and working-set separator use theme classes; failure uses the bad-status token', () => {
  expect(row({ set: makeSet({ kind: 'warmup' }), label: 'W' })).toContain('data-kind="warmup"');
  expect(row({ separatesWarmups: true })).toContain('data-separator="true"');
  expect(row({ set: makeSet({ kind: 'failure' }), label: 'F' })).toContain('data-kind="failure">F');
  expect(SET_KIND_CHOICES.map((kind) => SET_KIND_NAMES[kind])).toEqual(['Warm-up', 'Normal', 'Drop', 'Failure']);
});

test('info line omits absent metadata and preserves existing note lines', () => {
  expect(renderToStaticMarkup(createElement(ExerciseInfoLine, { entry }))).toBe('');
  const html = renderToStaticMarkup(
    createElement(ExerciseInfoLine, {
      entry: {
        ...entry,
        exercise: makeExercise({ restTargetSeconds: 135 }),
        entry: { ...entry.entry, notes: 'Line one\nLine two' },
      },
    }),
  );
  expect(html).toContain('Rest 2:15');
  expect(html).toContain('Line one\nLine two');
});

test('menu exposes only supported operations, units and RPE; Show RPE is exercise-local', () => {
  const live = { editNote: vi.fn(), editRest: vi.fn(), showRpe: vi.fn(), showsRpe: false };
  const capable = { ...actions, toggleWarmups: vi.fn(), saveNotes: vi.fn(), setRestTarget: vi.fn() };
  const menu = exerciseMenuItems({ entry, index: 0, count: 1, actions: capable, unit: 'kg', live });
  expect(menu.map((item) => item.label)).toEqual([
    'Add note',
    'Add warm-up sets',
    'Rest time',
    'Show RPE',
    'Unit: kg → lb',
    'Move up',
    'Move down',
    'Remove exercise',
  ]);
  menu.find((item) => item.label === 'Show RPE')?.onSelect();
  expect(live.showRpe).toHaveBeenCalledOnce();
  menu.find((item) => item.label.startsWith('Unit:'))?.onSelect();
  expect(capable.switchUnit).toHaveBeenCalledWith(1, 'lb');
  expect(menu.find((item) => item.label === 'Move up')?.isDisabled).toBe(true);
  const minimal = exerciseMenuItems({ entry, index: 0, count: 1, actions, unit: 'kg' });
  expect(minimal.map((item) => item.label)).toEqual(['Move up', 'Move down', 'Remove exercise']);
  expect(
    exerciseMenuItems({ entry, index: 0, count: 1, actions, unit: 'kg', live: { ...live, showsRpe: true } }).map(
      (item) => item.label,
    ),
  ).not.toContain('Show RPE');
});

test('shared history card retains notes, separate RPE entry, mixed-unit labelling and disabled completion', () => {
  const html = renderToStaticMarkup(
    createElement(ExerciseCard, {
      entry: {
        ...entry,
        sets: [makeSet({ isCompleted: true, rpe: 7.5, entryUnit: 'lb' }), makeSet({ id: 2, isCompleted: true })],
      },
      index: 0,
      count: 1,
      actions,
      editing: undefined,
      notes: { exercise: vi.fn(), set: vi.fn() },
    }),
  );
  expect(html).toContain('>RPE</span>');
  expect(html).toContain('aria-label="RPE"');
  expect(html).toContain('Add exercise notes');
  expect(html).toMatch(/aria-label="Completed"[^>]*disabled=""/);
  expect(html).toContain('>kg</span>');
  expect(html).not.toContain('Use suggested');
});
