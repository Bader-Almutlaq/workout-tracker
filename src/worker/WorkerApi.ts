import { CsvTable } from '../core/import/CsvTable';
import { makeStrongImportPlan, type StrongImportPlan } from '../core/import/StrongImportPlan';
import { makeImportOptions, type StrongImportOptions } from '../core/import/StrongImportOptions';
import { importStrongPlan, type ImportResult } from '../core/import/StrongImporter';
import {
  isStrongMeasurementsFile,
  parseStrongMeasurementsFile,
  type PlannedMeasurement,
} from '../core/import/StrongMeasurementsFile';
import { parseStrongWorkoutsFile } from '../core/import/StrongWorkoutsFile';
import type { StrongRow } from '../core/import/StrongRow';
import * as Comlink from 'comlink';
import { backupFileName } from '../core/backup/BackupFile';
import { validateBackup } from '../core/backup/BackupValidation';
import { AppSettingKey, getSetting, setSetting } from '../core/db/AppSetting';
import type { OnDeviceStore, OpenReport } from './OnDeviceStore';
import type { CustomExerciseDraft } from '../core/library/CustomExerciseDraft';
import { ExerciseEditor } from '../core/library/ExerciseEditor';
import { ExerciseLibrary } from '../core/library/ExerciseLibrary';
import type { ExerciseSearchEntry } from '../core/library/ExerciseSearch';
import {
  ExerciseCatalog,
  type ExerciseCatalogDetail,
  type ExerciseCatalogUnmatchedImport,
} from '../core/queries/ExerciseCatalog';
import {
  workoutDetail,
  workoutSummaries,
  type WorkoutDetail,
  type WorkoutSummary,
} from '../core/queries/WorkoutHistory';

/** Called after any write, so screens can re-run their queries. */
export type ChangeListener = () => void;

/** Basic facts about the database, shown in Settings. */
export interface DatabaseSummary {
  readonly workoutCount: number;
  readonly exerciseCount: number;
  readonly snapshotCount: number;
  readonly openReport: OpenReport;
}

/** A complete copy of the database, ready to be saved as a file. */
export interface BackupExport {
  /** `WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite`, named for the moment it was made. */
  readonly fileName: string;
  /** The whole database as one SQLite file. */
  readonly bytes: Uint8Array;
}

/** What a restore did, for the screen to report. */
export interface RestoreResult {
  /** Name of the safety snapshot holding the data as it was before the restore. */
  readonly snapshotName: string;
  /** Finished workouts in the restored data. */
  readonly workoutCount: number;
}

/** A review cannot proceed without a valid, unambiguous selection. */
class StrongImportFlowError extends Error {
  override readonly name = 'StrongImportFlowError';
  readonly kind = 'invalidSelection';
}

/**
 * Everything the screen can ask of the database. Each method maps to one WorkoutCore call.
 *
 * Conventions for adding a method:
 * - Reads return plain data (no class instances), because results are copied between threads.
 * - Writes notify every listener once they succeed (`notifyListeners()`), so every open screen refreshes.
 * - Errors are thrown as-is; the app shows their message to the owner.
 * - Get the store with `await liveStore()` and read `store.database` straight after it, never keeping
 *   the database across an `await`: a restore swaps the connection.
 */
export function createWorkerApi(ready: Promise<OnDeviceStore>) {
  const listeners = new Map<number, ChangeListener>();
  let nextSubscriptionId = 1;
  let importRows: StrongRow[] = [];
  let importMeasurements: PlannedMeasurement[] = [];
  let importPlan: StrongImportPlan | undefined;

  const notifyListeners = () => {
    for (const listener of listeners.values()) listener();
  };

  /** The open store, once any restore in progress has finished. */
  const liveStore = async (): Promise<OnDeviceStore> => {
    const store = await ready;
    await store.whenIdle();
    return store;
  };

  const mergeExercisePairs = async (pairs: readonly (readonly [number, number])[]): Promise<number> => {
    const store = await liveStore();
    await store.takeSnapshot();
    const moved = ExerciseEditor.mergeAll(store.database, new Map(pairs));
    notifyListeners();
    return moved;
  };

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
      const store = await liveStore();
      const db = store.database;
      return {
        workoutCount: db.value<number>('SELECT count(*) FROM workout WHERE isInProgress = 0') ?? 0,
        exerciseCount: db.value<number>('SELECT count(*) FROM exercise WHERE isArchived = 0') ?? 0,
        snapshotCount: store.snapshotNames().length,
        openReport: store.openReport,
      };
    },

    // Backup (T-016)

    /**
     * A complete copy of the database and the file name to save it under. The copy is checked the
     * way a restore would check it, so the owner is never handed a backup that can't be restored.
     * The bytes are moved to the caller, not copied.
     */
    async exportBackup(): Promise<BackupExport> {
      const store = await liveStore();
      const bytes = store.database.exportBytes();
      await validateBackup(bytes);
      return Comlink.transfer({ fileName: backupFileName(new Date()), bytes }, [bytes.buffer]);
    },

    /** ISO time of the last backup the owner completed, or `undefined` if none yet. */
    async lastBackupAt(): Promise<string | undefined> {
      const store = await liveStore();
      return getSetting(store.database, AppSettingKey.lastBackupAt);
    },

    /** Records that a backup was just saved. Call only after the share sheet or download succeeded. */
    async recordBackupMade(): Promise<void> {
      const store = await liveStore();
      setSetting(store.database, AppSettingKey.lastBackupAt, new Date().toISOString());
      notifyListeners();
    },

    /**
     * Replaces all current data with a backup file (see `OnDeviceStore.restore`): checks the file,
     * keeps a safety snapshot, swaps the data, then refreshes every open screen.
     * Throws a `BackupError` whose message says what happened to the data.
     */
    async restoreBackup(bytes: Uint8Array): Promise<RestoreResult> {
      const store = await liveStore();
      // "Last backup" describes this phone, not the file: keep it across the restore.
      const lastBackupAt = getSetting(store.database, AppSettingKey.lastBackupAt);
      const report = await store.restore(bytes);
      if (lastBackupAt !== undefined) setSetting(store.database, AppSettingKey.lastBackupAt, lastBackupAt);
      notifyListeners();
      return {
        snapshotName: report.snapshotName,
        workoutCount: store.database.value<number>('SELECT count(*) FROM workout WHERE isInProgress = 0') ?? 0,
      };
    },

    // Strong import (T-017)

    /** Parses selected CSVs and builds a review plan without writing to the database. */
    async planStrongImport(
      files: readonly { readonly name: string; readonly text: string }[],
    ): Promise<StrongImportPlan> {
      await liveStore();
      importPlan = undefined;
      const rows: StrongRow[] = [];
      const measurements: PlannedMeasurement[] = [];
      let workoutsFileSelected = false;
      for (const file of files) {
        if (isStrongMeasurementsFile(CsvTable.parse(file.text)))
          measurements.push(...parseStrongMeasurementsFile(file.text));
        else {
          if (workoutsFileSelected)
            throw new StrongImportFlowError(
              'Choose only one workouts file at a time, along with any measurement files.',
            );
          rows.push(...parseStrongWorkoutsFile(file.text));
          workoutsFileSelected = true;
        }
      }
      if (rows.length === 0 && measurements.length === 0)
        throw new StrongImportFlowError('No workouts or measurements were found in the chosen files.');
      importRows = rows;
      importMeasurements = measurements;
      importPlan = makeStrongImportPlan(rows, measurements);
      return importPlan;
    },

    /** Rebuilds the review after the owner changes a decision. */
    async reviewStrongImport(options: StrongImportOptions): Promise<StrongImportPlan> {
      await liveStore();
      if (importPlan === undefined) throw new StrongImportFlowError('Choose Strong files before reviewing the import.');
      importPlan = makeStrongImportPlan(importRows, importMeasurements, options);
      return importPlan;
    },

    /** Takes a safety snapshot, then imports the chosen decisions and refreshes screens. */
    async runStrongImport(options: StrongImportOptions): Promise<ImportResult> {
      const store = await liveStore();
      if (importPlan === undefined) throw new StrongImportFlowError('Choose Strong files before importing.');
      const plan = makeStrongImportPlan(importRows, importMeasurements, makeImportOptions(options));
      await store.takeSnapshot();
      const result = importStrongPlan(store.database, plan, new Date());
      notifyListeners();
      return result;
    },

    // History (T-015)

    /** Every finished workout, newest first. */
    async historySummaries(): Promise<WorkoutSummary[]> {
      return workoutSummaries((await liveStore()).database);
    },

    /** One workout with its exercises and sets, or `undefined` when it doesn't exist. */
    async workoutDetail(workoutId: number): Promise<WorkoutDetail | undefined> {
      return workoutDetail((await liveStore()).database, workoutId);
    },
    // End of History (T-015)

    // Exercises (T-022)

    /** Every unarchived exercise as the search needs it, with aliases. The screen keeps these in memory and searches them. */
    async exerciseEntries(): Promise<ExerciseSearchEntry[]> {
      return ExerciseCatalog.entries((await liveStore()).database, ExerciseLibrary.bundled());
    },

    /** One exercise with its muscles, usage and recent sessions, or `null` when it doesn't exist. */
    async exerciseDetail(exerciseId: number): Promise<ExerciseCatalogDetail | null> {
      return ExerciseCatalog.detail((await liveStore()).database, exerciseId, ExerciseLibrary.bundled());
    },

    /** Exercises created by the Strong import that aren't linked to the library yet, most sets first. */
    async unmatchedImports(): Promise<ExerciseCatalogUnmatchedImport[]> {
      return ExerciseCatalog.unmatchedImports((await liveStore()).database);
    },

    /** Creates the owner's own exercise and returns its id. Throws an `ExerciseEditError` the screen shows as written. */
    async createExercise(draft: CustomExerciseDraft): Promise<number> {
      const id = ExerciseEditor.create((await liveStore()).database, draft, new Date());
      notifyListeners();
      return id;
    },

    /** Edits one of the owner's own exercises (or turns a Strong exercise into one). History is unchanged. */
    async updateExercise(exerciseId: number, draft: CustomExerciseDraft): Promise<void> {
      ExerciseEditor.update((await liveStore()).database, exerciseId, draft);
      notifyListeners();
    },

    /** Hides an exercise from search and pickers, or shows it again. History is kept. */
    async setExerciseArchived(exerciseId: number, isArchived: boolean): Promise<void> {
      ExerciseEditor.setArchived((await liveStore()).database, exerciseId, isArchived);
      notifyListeners();
    },

    /**
     * Moves one exercise's history to another and deletes the source (its name stays as an alias).
     * Takes a safety snapshot first. Returns how many logged exercise entries moved.
     */
    async mergeExercise(sourceId: number, targetId: number): Promise<number> {
      return mergeExercisePairs([[sourceId, targetId]]);
    },

    /**
     * Applies several `[sourceId, targetId]` merges in one transaction after one safety snapshot.
     * Returns how many logged exercise entries moved.
     */
    async mergeExercises(pairs: readonly (readonly [number, number])[]): Promise<number> {
      return mergeExercisePairs(pairs);
    },
    // End of Exercises (T-022)
  };
}

/** The API as the screen sees it. */
export type WorkerApi = ReturnType<typeof createWorkerApi>;
