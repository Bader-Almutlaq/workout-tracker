import { weeklyMuscleVolume, type WeeklyMuscleVolume } from '../core/queries/WeeklyMuscleVolume';
import { workoutDaysInMonth, type WorkoutCalendarDay } from '../core/queries/WorkoutCalendar';
import { ExerciseStrength, type ExerciseStrengthSeries } from '../core/queries/ExerciseStrength';
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
  workoutSummary,
  type WorkoutDetail,
  type WorkoutSummary,
} from '../core/queries/WorkoutHistory';
import { setRestTarget } from '../core/logging/RestTimer';
import { WorkoutLogger, type FinishResult } from '../core/logging/WorkoutLogger';
import type { SetKind } from '../core/models/SetKind';
import { liveWorkoutSnapshot, type LiveWorkoutSnapshot } from '../core/queries/LiveWorkout';
import { TemplateCatalog, type TemplateList } from '../core/queries/TemplateCatalog';
import type { TemplateDraft } from '../core/templates/TemplateDraft';
import { TemplateStore } from '../core/templates/TemplateStore';
import type { WeightUnit } from '../core/units/WeightUnit';
import { liveSetFinding as checkLiveSet } from '../core/validation/LiveSetCheck';
import type { SetFinding } from '../core/validation/SetPlausibility';

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

/** How many finished workouts the Workout tab offers to repeat. */
const RECENT_WORKOUT_LIMIT = 6;

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

    // Analytics (T-035)

    /** Fractional hard sets for each local week in the inclusive date range. */
    async weeklyMuscleVolume(from: string, to: string): Promise<WeeklyMuscleVolume[]> {
      return weeklyMuscleVolume((await liveStore()).database, new Date(from), new Date(to));
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

    // History calendar (T-030)

    /** Local dates with finished workouts in a calendar month; month is 1–12. */
    async workoutDaysInMonth(year: number, month: number): Promise<WorkoutCalendarDay[]> {
      const store = await liveStore();
      return workoutDaysInMonth(store.database, year, month);
    },

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

    // Workout (T-024)
    // Every write is one logger action and notifies listeners, so the logging screen refreshes after each tap.

    /** The workout being logged with last session's sets for each exercise, or `null` when none is in progress. */
    async liveWorkout(): Promise<LiveWorkoutSnapshot | null> {
      const db = (await liveStore()).database;
      const workoutId = new WorkoutLogger(db).activeWorkoutId();
      return workoutId === undefined ? null : (liveWorkoutSnapshot(db, workoutId) ?? null);
    },

    /** The id of the workout being logged, or `null` when none is in progress. */
    async activeWorkoutId(): Promise<number | null> {
      return new WorkoutLogger((await liveStore()).database).activeWorkoutId() ?? null;
    },

    /** The latest finished workouts, newest first, offered under "Repeat a past workout". */
    async recentWorkouts(): Promise<WorkoutSummary[]> {
      return workoutSummaries((await liveStore()).database).slice(0, RECENT_WORKOUT_LIMIT);
    },

    /** The totals of one finished workout, or `null` when it doesn't exist (for example, nothing was logged). */
    async finishedWorkoutSummary(workoutId: number): Promise<WorkoutSummary | null> {
      return workoutSummary((await liveStore()).database, workoutId) ?? null;
    },

    /**
     * The "Is this right?" check for a set about to be completed, judged against the exercise's recent
     * finished sessions. `null` when the set looks normal.
     */
    async liveSetFinding(
      exerciseId: number,
      weightKilograms: number,
      reps: number,
      kind: SetKind,
      workoutId: number,
    ): Promise<SetFinding | null> {
      const db = (await liveStore()).database;
      return checkLiveSet(db, exerciseId, weightKilograms, reps, kind, workoutId, new Date()) ?? null;
    },

    /**
     * Starts a workout and appends `exerciseIds` in order, each pre-filled from its last session.
     * Returns the new workout's id.
     */
    async startWorkout(name: string, exerciseIds: readonly number[]): Promise<number> {
      const logger = new WorkoutLogger((await liveStore()).database);
      const workoutId = logger.start(name, new Date());
      for (const exerciseId of exerciseIds) logger.addExercise(exerciseId, workoutId);
      notifyListeners();
      return workoutId;
    },

    /** Drops the sets that were never completed and ends the workout (or deletes it if nothing was completed). */
    async finishWorkout(workoutId: number): Promise<FinishResult> {
      const result = new WorkoutLogger((await liveStore()).database).finish(workoutId, new Date());
      notifyListeners();
      return result;
    },

    /** Deletes the workout in progress with everything logged in it. */
    async discardWorkout(workoutId: number): Promise<void> {
      new WorkoutLogger((await liveStore()).database).discard(workoutId);
      notifyListeners();
    },

    /** Renames a workout and replaces its notes (`null` clears them). */
    async updateWorkout(workoutId: number, name: string, notes: string | null): Promise<void> {
      new WorkoutLogger((await liveStore()).database).update(workoutId, name, notes);
      notifyListeners();
    },

    /** Appends exercises to a workout in the order given, each pre-filled from its last session. */
    async addExercises(workoutId: number, exerciseIds: readonly number[]): Promise<void> {
      const logger = new WorkoutLogger((await liveStore()).database);
      for (const exerciseId of exerciseIds) logger.addExercise(exerciseId, workoutId);
      notifyListeners();
    },

    /** Removes an exercise entry and its sets from the workout. */
    async removeExercise(entryId: number): Promise<void> {
      new WorkoutLogger((await liveStore()).database).removeExercise(entryId);
      notifyListeners();
    },

    /** Moves an exercise entry to a zero-based position in the workout. */
    async moveExercise(entryId: number, newPosition: number): Promise<void> {
      new WorkoutLogger((await liveStore()).database).moveExercise(entryId, newPosition);
      notifyListeners();
    },

    /** Appends a planned set that copies the exercise's last set. */
    async addSet(entryId: number): Promise<void> {
      new WorkoutLogger((await liveStore()).database).addSet(entryId);
      notifyListeners();
    },

    /** Replaces a set's load (kilograms, with the unit it was typed in), reps, RPE, kind and duration. */
    async updateSet(
      setId: number,
      weightKilograms: number,
      entryUnit: WeightUnit,
      reps: number,
      rpe: number | null,
      kind: SetKind,
      durationSeconds: number | null,
    ): Promise<void> {
      new WorkoutLogger((await liveStore()).database).updateSet(
        setId,
        weightKilograms,
        entryUnit,
        reps,
        rpe,
        kind,
        durationSeconds,
      );
      notifyListeners();
    },

    /** Switches an exercise between kg and lb for its planned sets; stored kilograms don't change. */
    async setEntryUnit(unit: WeightUnit, entryId: number): Promise<void> {
      new WorkoutLogger((await liveStore()).database).setEntryUnit(unit, entryId);
      notifyListeners();
    },

    /** Marks a set done (recording the rest since the previous one) or not done. */
    async setCompleted(setId: number, completed: boolean): Promise<void> {
      new WorkoutLogger((await liveStore()).database).setCompleted(setId, completed, new Date());
      notifyListeners();
    },

    /** Deletes a set. */
    async deleteSet(setId: number): Promise<void> {
      new WorkoutLogger((await liveStore()).database).deleteSet(setId);
      notifyListeners();
    },
    // End of Workout (T-024)

    // Rest timer (T-027)

    /** Remembers the owner's rest target for an exercise, in seconds (kept within the rest timer's limits). */
    async setRestTarget(exerciseId: number, seconds: number): Promise<void> {
      setRestTarget((await liveStore()).database, exerciseId, seconds);
      notifyListeners();
    },
    // End of Rest timer (T-027)

    // Strength (T-034)

    /** Daily best estimates and smoothed strength in kg; no qualifying history returns empty series. */
    async exerciseStrength(exerciseId: number): Promise<ExerciseStrengthSeries> {
      return ExerciseStrength.series((await liveStore()).database, exerciseId, new Date());
    },
    // End of Strength (T-034)

    // Templates (T-029)

    /** Every folder with its templates, and the templates in no folder, in their stored order. */
    async templateList(): Promise<TemplateList> {
      return TemplateCatalog.list((await liveStore()).database);
    },

    /** A template as the editor works on it, or `null` when it doesn't exist. */
    async templateDetail(templateId: number): Promise<TemplateDraft | null> {
      return TemplateCatalog.detail((await liveStore()).database, templateId) ?? null;
    },

    /** Creates a template (no `id`) or replaces one. Returns its id. Throws a `TemplateStoreError` the screen shows as written. */
    async saveTemplate(draft: TemplateDraft): Promise<number> {
      const id = TemplateStore.save((await liveStore()).database, draft, new Date());
      notifyListeners();
      return id;
    },

    /** Renames a template. */
    async renameTemplate(templateId: number, name: string): Promise<void> {
      TemplateStore.rename((await liveStore()).database, templateId, name, new Date());
      notifyListeners();
    },

    /** Deletes a template. Workouts already done from it keep their history. */
    async deleteTemplate(templateId: number): Promise<void> {
      TemplateStore.delete((await liveStore()).database, templateId);
      notifyListeners();
    },

    /** Copies a template next to the original, named "… copy". Returns the copy's id. */
    async duplicateTemplate(templateId: number): Promise<number> {
      const id = TemplateStore.duplicate((await liveStore()).database, templateId, new Date());
      notifyListeners();
      return id;
    },

    /** Moves a template to the end of a folder, or out of every folder (`null`). */
    async moveTemplate(templateId: number, folderId: number | null): Promise<void> {
      TemplateStore.move((await liveStore()).database, templateId, folderId);
      notifyListeners();
    },

    /** Moves a template to a zero-based position within its folder. */
    async reorderTemplate(templateId: number, position: number): Promise<void> {
      TemplateStore.reorder((await liveStore()).database, templateId, position);
      notifyListeners();
    },

    /** Adds a folder after the others and returns its id. */
    async createTemplateFolder(name: string): Promise<number> {
      const id = TemplateStore.createFolder((await liveStore()).database, name);
      notifyListeners();
      return id;
    },

    /** Renames a folder. */
    async renameTemplateFolder(folderId: number, name: string): Promise<void> {
      TemplateStore.renameFolder((await liveStore()).database, folderId, name);
      notifyListeners();
    },

    /** Moves a folder to a zero-based position among the folders. */
    async reorderTemplateFolder(folderId: number, position: number): Promise<void> {
      TemplateStore.reorderFolder((await liveStore()).database, folderId, position);
      notifyListeners();
    },

    /** Deletes a folder; its templates are kept, moved to the end of the unfiled list. */
    async deleteTemplateFolder(folderId: number): Promise<void> {
      TemplateStore.deleteFolder((await liveStore()).database, folderId);
      notifyListeners();
    },

    /** Saves a finished workout's exercises and set kinds as a template with no targets. Returns the template's id. */
    async createTemplateFromWorkout(workoutId: number, name: string, folderId: number | null): Promise<number> {
      const id = TemplateStore.createFromWorkout((await liveStore()).database, workoutId, name, folderId, new Date());
      notifyListeners();
      return id;
    },

    /**
     * Starts a workout from a template and returns its id. When one is already in progress this
     * throws, and first refreshes every screen: the one that offered to start is out of date, and
     * refreshing swaps it for the workout in progress, which is the way to resume it.
     */
    async startFromTemplate(templateId: number): Promise<number> {
      const logger = new WorkoutLogger((await liveStore()).database);
      if (logger.activeWorkoutId() !== undefined) notifyListeners();
      const workoutId = logger.startFromTemplate(templateId, new Date());
      notifyListeners();
      return workoutId;
    },
    // End of Templates (T-029)
  };
}

/** The API as the screen sees it. */
export type WorkerApi = ReturnType<typeof createWorkerApi>;
