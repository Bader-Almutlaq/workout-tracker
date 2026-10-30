import { afterEach, expect, test, vi } from 'vitest';
import { finishWorkout } from './workoutActions';

const mocked = vi.hoisted(() => ({
  finish: vi.fn<() => Promise<{ workoutId: number | null }>>(),
  afterWorkout: vi.fn<() => Promise<void>>(),
}));
vi.mock('../../data/database', () => ({ database: { finishWorkout: mocked.finish } }));
vi.mock('../../data/dropbox/cloudBackup', () => ({ dropboxBackup: { afterWorkout: mocked.afterWorkout } }));

afterEach(() => vi.resetAllMocks());

test('finishing saves first, triggers cloud backup, and resolves without awaiting the upload', async () => {
  mocked.finish.mockResolvedValue({ workoutId: 42 });
  // A suspended upload must not trap the owner on the logging screen.
  mocked.afterWorkout.mockReturnValue(new Promise(() => undefined));
  await expect(finishWorkout(42)).resolves.toBe(42);
  expect(mocked.finish).toHaveBeenCalledOnce();
  expect(mocked.afterWorkout).toHaveBeenCalledOnce();
  expect(mocked.finish.mock.invocationCallOrder[0]).toBeLessThan(mocked.afterWorkout.mock.invocationCallOrder[0] ?? 0);
});

test('discarding an empty finished workout does not request a cloud upload', async () => {
  mocked.finish.mockResolvedValue({ workoutId: null });
  await expect(finishWorkout(42)).resolves.toBeNull();
  expect(mocked.afterWorkout).not.toHaveBeenCalled();
});
