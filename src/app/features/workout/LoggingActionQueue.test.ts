import { describe, expect, test, vi } from 'vitest';
import { LoggingActionQueue } from './LoggingActionQueue';

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe('logging action queue', () => {
  test('Actions run one at a time, in the order they were queued', async () => {
    const queue = new LoggingActionQueue();
    const events: string[] = [];
    const slow = queue.enqueue(async () => {
      events.push('slow starts');
      await delay(20);
      events.push('slow ends');
    });
    const fast = queue.enqueue(async () => {
      events.push('fast starts');
    });
    await Promise.all([slow, fast]);
    expect(events).toEqual(['slow starts', 'slow ends', 'fast starts']);
  });

  test('An action resolves to its result', async () => {
    const queue = new LoggingActionQueue();
    expect(await queue.enqueue(async () => 42)).toBe(42);
  });

  test('A failure is kept for the banner and does not stop later actions', async () => {
    const queue = new LoggingActionQueue();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failed = await queue.enqueue(async () => {
      throw new Error('That set no longer exists.');
    });
    expect(failed).toBeUndefined();
    expect(queue.errorMessage()).toBe('That set no longer exists.');
    expect(await queue.enqueue(async () => 'next')).toBe('next');
  });

  test('Queueing a new action clears the banner and the banner can be dismissed', async () => {
    const queue = new LoggingActionQueue();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await queue.enqueue(async () => {
      throw new Error('boom');
    });
    queue.dismissError();
    expect(queue.errorMessage()).toBeUndefined();
    queue.report(new Error('again'));
    expect(queue.errorMessage()).toBe('again');
    await queue.enqueue(async () => undefined);
    expect(queue.errorMessage()).toBeUndefined();
  });

  test('Listeners hear about changes to the message until they unsubscribe', () => {
    const queue = new LoggingActionQueue();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const listener = vi.fn();
    const unsubscribe = queue.subscribe(listener);
    queue.report(new Error('one'));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    queue.dismissError();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
