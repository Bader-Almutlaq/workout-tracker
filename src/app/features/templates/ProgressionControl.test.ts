import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import type { TemplateEditorActions } from './TemplateEditorActions';
import { ProgressionControl } from './ProgressionControl';
import { ProgressionRangeDialog } from './ProgressionRangeDialog';

const actions: TemplateEditorActions = {
  edit: vi.fn(),
  addSet: vi.fn(),
  removeSet: vi.fn(),
  cycleKind: vi.fn(),
  move: vi.fn(),
  toggleSuperset: vi.fn(),
  removeExercise: vi.fn(),
  setProgression: vi.fn(),
  setExerciseNotes: vi.fn(),
  setMachineBrand: vi.fn(),
};
const exercise: TemplateExerciseDraft = {
  exerciseId: 1,
  supersetGroup: null,
  notes: null,
  sets: [{ kind: 'working', targetRepsLow: null, targetRepsHigh: null, targetRpe: null }],
};
test('the editor labels progression off and on', () => {
  const render = (source: TemplateExerciseDraft) =>
    renderToStaticMarkup(createElement(ProgressionControl, { exercise: source, index: 0, actions }));
  expect(render(exercise)).toContain('Progression');
  expect(
    render({
      ...exercise,
      progression: 'double',
      sets: [{ kind: 'working', targetRepsLow: 8, targetRepsHigh: 12, targetRpe: null }],
    }),
  ).toContain('8–12 reps');
  expect(actions.setProgression).not.toHaveBeenCalled();
});
test('the missing-range prompt offers 8–12 for explicit confirmation and explains per-set targets', () => {
  const html = renderToStaticMarkup(createElement(ProgressionRangeDialog, { onSave: vi.fn(), onCancel: vi.fn() }));
  expect(html).toContain('Choose a rep range');
  expect(html).toContain('value="8"');
  expect(html).toContain('value="12"');
  expect(html).toContain('Use range');
  expect(html).toContain('optional target RPE');
});
