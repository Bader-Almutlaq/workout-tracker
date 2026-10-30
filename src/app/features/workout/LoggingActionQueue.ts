import { log } from '../../../core/support/log';

/**
 * Runs every logging write one at a time, in the order the owner tapped.
 *
 * Running them in parallel would let "save the weight" and "complete the set" arrive out of order,
 * so each action waits for the one before it: never two writes in flight. A failure is logged and
 * kept in `errorMessage` for the screen to show; the screen itself only changes through the
 * database subscription, so a failed write leaves it showing what is really saved.
 * Port of `LoggingActionQueue` in the native app.
 */
export class LoggingActionQueue {
  private tail: Promise<unknown> = Promise.resolve();
  private message: string | undefined;
  private readonly listeners = new Set<() => void>();

  /** The latest failure, in words the owner can read; `undefined` when there is none to show. */
  readonly errorMessage = (): string | undefined => this.message;

  /** Registers `listener` for changes to `errorMessage` and returns the function that removes it. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Queues `work` to run after every earlier action has finished and clears the banner. Resolves to
   * the result of `work`, or `undefined` if it threw (the failure is then in `errorMessage`).
   * Never rejects, so callers that only need the side effect can ignore the promise.
   */
  enqueue<Result>(work: () => Promise<Result>): Promise<Result | undefined> {
    this.setMessage(undefined);
    const result = this.tail.then(async (): Promise<Result | undefined> => {
      try {
        return await work();
      } catch (error) {
        this.report(error);
        return undefined;
      }
    });
    this.tail = result;
    return result;
  }

  /** Shows `error` in the banner and writes it to the log. */
  report(error: unknown): void {
    log.ui.error('Logging action failed', error);
    this.setMessage(error instanceof Error ? error.message : String(error));
  }

  /** Hides the banner. */
  dismissError(): void {
    this.setMessage(undefined);
  }

  private setMessage(message: string | undefined): void {
    if (message === this.message) return;
    this.message = message;
    for (const listener of this.listeners) listener();
  }
}
