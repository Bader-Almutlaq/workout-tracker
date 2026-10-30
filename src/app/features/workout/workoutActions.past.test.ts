import { afterEach, expect, test, vi } from 'vitest';
import type { WorkoutDetail } from '../../../core/queries/WorkoutHistory';
import type { SetFinding } from '../../../core/validation/SetPlausibility';
import { loggingQueue } from './loggingQueue';
import { makeExercise, makeSet } from './workoutTestData';
import { saveCell } from './workoutActions';

const mocked = vi.hoisted(() => ({
  detail: vi.fn<() => Promise<WorkoutDetail>>(),
  update: vi.fn<() => Promise<void>>(),
  finding: vi.fn<() => Promise<SetFinding | null>>(),
}));
vi.mock('../../data/database', () => ({
  database: {
    workoutDetail: mocked.detail,
    updateSet: mocked.update,
    liveSetFinding: mocked.finding,
  },
}));
vi.mock('../../data/dropbox/cloudBackup', () => ({ dropboxBackup: {} }));

afterEach(() => vi.resetAllMocks());

function setup() {
  const set = makeSet({ isCompleted: true });
  mocked.detail.mockResolvedValue({
    workout: {
      id: 10,
      name: 'Past',
      notes: null,
      source: 'strong',
      sourceKey: 'strong:synthetic',
      startedAt: '2026-10-25T10:00:00.000Z',
      endedAt: '2026-10-25T11:00:00.000Z',
      templateId: null,
      isInProgress: false,
    },
    entries: [
      {
        exercise: makeExercise(),
        entry: { id: 1, workoutId: 10, exerciseId: 1, position: 0, notes: null, supersetGroup: null },
        sets: [set],
      },
    ],
  });
  mocked.update.mockResolvedValue();
  mocked.finding.mockResolvedValue({ id: 0, issue: 'weightTooHigh', typical: 60, suggestion: 60 });
}

test('History weight edits save immediately and prompt with the same live typo check, excluding this workout', async () => {
  setup();
  const prompt = vi.fn();
  saveCell(10, { setId: 1, field: 'weight' }, 600, 'weight-reps', prompt);
  await loggingQueue.enqueue(async () => undefined);
  expect(mocked.update).toHaveBeenCalledWith(1, 600, 'kg', 8, null, 'working', null);
  expect(mocked.finding).toHaveBeenCalledWith(1, 600, 8, 'working', 10);
  expect(prompt).toHaveBeenCalledWith(
    expect.objectContaining({ setId: 1, field: 'weight', message: expect.stringContaining('600 kg') }),
  );
  expect(mocked.update.mock.invocationCallOrder[0]).toBeLessThan(mocked.finding.mock.invocationCallOrder[0] ?? 0);
});

test('History rep edits prompt, ordinary values do not, and RPE edits do not run a typo check', async () => {
  setup();
  const prompt = vi.fn();
  mocked.finding.mockResolvedValueOnce({ id: 0, issue: 'repsTooHigh', typical: 8, suggestion: 8 });
  saveCell(10, { setId: 1, field: 'reps' }, 80, 'weight-reps', prompt);
  await loggingQueue.enqueue(async () => undefined);
  expect(prompt).toHaveBeenCalledWith(expect.objectContaining({ field: 'reps' }));
  mocked.finding.mockResolvedValue(null);
  prompt.mockClear();
  saveCell(10, { setId: 1, field: 'reps' }, 8, 'weight-reps', prompt);
  saveCell(10, { setId: 1, field: 'rpe' }, 8, 'weight-reps', prompt);
  await loggingQueue.enqueue(async () => undefined);
  expect(mocked.finding).toHaveBeenCalledTimes(2);
  expect(prompt).not.toHaveBeenCalled();
});

test('live cell editing retains its existing completion-time check behaviour', async () => {
  setup();
  saveCell(10, { setId: 1, field: 'weight' }, 600, 'weight-reps');
  await loggingQueue.enqueue(async () => undefined);
  expect(mocked.update).toHaveBeenCalledOnce();
  expect(mocked.finding).not.toHaveBeenCalled();
});
