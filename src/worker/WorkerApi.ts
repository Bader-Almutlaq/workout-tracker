import type { OnDeviceStore, OpenReport } from './OnDeviceStore';

/** Called after any write, so screens can re-run their queries. */
export type ChangeListener = () => void;

/** Basic facts about the database, shown in Settings. */
export interface DatabaseSummary {
  readonly workoutCount: number;
  readonly exerciseCount: number;
  readonly snapshotCount: number;
  readonly openReport: OpenReport;
}

/**
 * Everything the screen can ask of the database. Each method maps to one WorkoutCore call.
 *
 * Conventions for adding a method:
 * - Reads return plain data (no class instances), because results are copied between threads.
 * - Writes notify every listener once they succeed, so every open screen refreshes.
 * - Errors are thrown as-is; the app shows their message to the owner.
 */
export function createWorkerApi(ready: Promise<OnDeviceStore>) {
  // Write methods (added by feature tasks) end with: for (const listener of listeners.values()) listener();
  const listeners = new Map<number, ChangeListener>();
  let nextSubscriptionId = 1;

  return {
    /** Resolves once the database is open and migrated; rejects with the reason it couldn't open. */
    async whenReady(): Promise<OpenReport> {
      return (await ready).openReport;
    },

    /**
     * Registers `listener` to run after every write and returns a subscription id for `unsubscribe`.
     * (An id rather than the listener itself, because a listener sent between threads arrives as a new object each time.)
     */
    subscribe(listener: ChangeListener): number {
      const id = nextSubscriptionId++;
      listeners.set(id, listener);
      return id;
    },

    unsubscribe(subscriptionId: number): void {
      listeners.delete(subscriptionId);
    },

    async summary(): Promise<DatabaseSummary> {
      const store = await ready;
      const db = store.database;
      return {
        workoutCount: db.value<number>('SELECT count(*) FROM workout WHERE isInProgress = 0') ?? 0,
        exerciseCount: db.value<number>('SELECT count(*) FROM exercise WHERE isArchived = 0') ?? 0,
        snapshotCount: store.snapshotNames().length,
        openReport: store.openReport,
      };
    },
  };
}

/** The API as the screen sees it. */
export type WorkerApi = ReturnType<typeof createWorkerApi>;
