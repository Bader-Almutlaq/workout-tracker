import { fromExerciseRow, type ExerciseRow } from '../models/Exercise';
import { loadProfileFor } from '../units/LoadableWeight';
import { defaultWarmupCount, refreshWarmups, warmupSets } from './WarmupPlan';
import type { Database } from '../db/Database';
import type { SetKind } from '../models/SetKind';
import type { WorkoutSetRow } from '../models/WorkoutSet';
import type { WeightUnit } from '../units/WeightUnit';
import { matchPreviousSets, previousPerformance } from '../queries/PreviousPerformance';
import { WorkoutLoggerError } from './WorkoutLoggerError';
import type { ExerciseTracking } from '../library/ExerciseTracking';

import { TemplateStoreError } from '../templates/TemplateStoreError';

/** Tracking kinds whose sets record a duration; their template targets are seconds. */
const TIMED_TRACKINGS: ReadonlySet<ExerciseTracking> = new Set(['duration', 'weight-duration']);

/** Limits that catch input mistakes without restricting real training; RPE bounds: Zourdos 2016. */
export const WorkoutLoggerLimits = {
  /** Highest weight accepted for one set, in kg. Above every recorded human lift. */
  maximumKilograms: 1000,
  /** Highest rep count accepted for one set. */
  maximumReps: 1000,
  /** RPE scale bounds (Zourdos 2016). */
  rpeRange: { minimum: 1, maximum: 10 },
} as const;

/** What finishing a workout kept and dropped; workoutId is null if nothing was completed. */
export interface FinishResult {
  readonly workoutId: number | null;
  readonly completedSets: number;
  readonly droppedSets: number;
}

/** Each logging action is a transaction; positions stay dense and zero-based. */
export class WorkoutLogger {
  private readonly warmupState = new Map<
    number,
    { edited: Set<number>; suggested: Set<number>; suppressed: boolean }
  >();

  constructor(private readonly db: Database) {}

  /** Untouched generated warm-ups in this worker session; the UI draws their stored values as suggestions. */
  suggestedWarmupSetIds(entryId: number): number[] {
    const state = this.warmupState.get(entryId);
    if (state === undefined) return [];
    return this.db
      .all<{ id: number }>(
        `
      SELECT id FROM workoutSet WHERE workoutExerciseId = ? AND kind = 'warmup' AND isCompleted = 0
    `,
        [entryId],
      )
      .filter((set) => state.suggested.has(set.id))
      .map((set) => set.id);
  }

  private warmupStateFor(entryId: number) {
    let state = this.warmupState.get(entryId);
    if (state === undefined) {
      // After reload, preserve existing rows and absent warm-ups when work already had a load.
      const existing = this.db.all<{ id: number }>(
        `
        SELECT id FROM workoutSet WHERE workoutExerciseId = ? AND kind = 'warmup'
      `,
        [entryId],
      );
      const workingWeight =
        this.db.value<number>(
          `
        SELECT weightKilograms FROM workoutSet WHERE workoutExerciseId = ? AND kind <> 'warmup' ORDER BY position LIMIT 1
      `,
          [entryId],
        ) ?? 0;
      state = {
        edited: new Set(existing.map((set) => set.id)),
        suggested: new Set<number>(),
        suppressed: existing.length === 0 && workingWeight > 0,
      };
      this.warmupState.set(entryId, state);
    }
    return state;
  }

  private initializeWarmups(entryId: number): void {
    this.warmupState.set(entryId, { edited: new Set(), suggested: new Set(), suppressed: false });
    this.refreshEntryWarmups(entryId);
  }

  private refreshEntryWarmups(entryId: number): void {
    const entry = this.requireEntry(entryId);
    if (this.db.value<number>('SELECT isInProgress FROM workout WHERE id = ?', [entry.workoutId]) !== 1) return;
    const row = this.db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [entry.exerciseId]);
    if (row === undefined) throw new WorkoutLoggerError('exerciseNotFound');
    const exercise = fromExerciseRow(row);
    // Unclassified legacy exercises keep their historical/template warm-ups until an owner sets a count.
    if (exercise.mechanic === null && (exercise.warmupSetCount === null || exercise.warmupSetCount === undefined))
      return;
    const existing = this.db.all<WorkoutSetRow>(
      `
      SELECT * FROM workoutSet WHERE workoutExerciseId = ? AND kind = 'warmup' ORDER BY position
    `,
      [entryId],
    );
    const state = this.warmupStateFor(entryId);
    if (state.suppressed) return;
    const first = this.db.get<WorkoutSetRow>(
      `
      SELECT * FROM workoutSet WHERE workoutExerciseId = ? AND kind <> 'warmup' ORDER BY position LIMIT 1
    `,
      [entryId],
    );
    const plan = warmupSets(
      first?.weightKilograms ?? 0,
      defaultWarmupCount(exercise),
      loadProfileFor(exercise, exercise.defaultEntryUnit),
    );
    const refreshed = refreshWarmups(
      existing.map((set) => ({ ...set, isCompleted: set.isCompleted === 1 })),
      plan,
      state.edited,
    );
    const retained = new Set(refreshed.map((set) => set.id));
    for (const old of existing) {
      if (!retained.has(old.id)) {
        this.db.run('DELETE FROM workoutSet WHERE id = ?', [old.id]);
        state.suggested.delete(old.id);
      }
    }
    const order = this.db
      .all<{ id: number }>(
        `
      SELECT id FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position
    `,
        [entryId],
      )
      .map((set) => set.id);
    // Move retained rows aside before inserting, avoiding the unique (entry, position) constraint.
    const temporaryPositionOffset = order.length + refreshed.length;
    order.forEach((id, index) =>
      this.db.run('UPDATE workoutSet SET position = ? WHERE id = ?', [-(temporaryPositionOffset + index + 1), id]),
    );
    const warmupIds: number[] = [];
    for (const [index, suggestion] of refreshed.entries()) {
      let id = suggestion.id;
      if (id === null) {
        id = this.db.run(
          `
          INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted)
          VALUES (?, ?, 'warmup', ?, ?, ?, 0)
        `,
          [entryId, index, suggestion.weightKilograms, exercise.defaultEntryUnit, suggestion.reps],
        ).lastInsertRowId;
        state.suggested.add(id);
      } else if (!state.edited.has(id) && !existing.some((set) => set.id === id && set.isCompleted === 1)) {
        this.db.run(
          `
          UPDATE workoutSet SET weightKilograms = ?, reps = ?, entryUnit = ? WHERE id = ?
        `,
          [suggestion.weightKilograms, suggestion.reps, exercise.defaultEntryUnit, id],
        );
        state.suggested.add(id);
      }
      warmupIds.push(id);
    }
    this.assignPositions([...warmupIds, ...order.filter((id) => !warmupIds.includes(id))], 'workoutSet');
  }

  /** The workout currently being logged, if any. */
  activeWorkoutId(): number | undefined {
    return this.db.value<number>('SELECT id FROM workout WHERE isInProgress = 1 ORDER BY startedAt DESC LIMIT 1');
  }

  /** Starts an empty workout at the given time; only one can be in progress. */
  start(name: string, now: Date): number {
    return this.db.transaction(() => {
      const active = this.activeWorkoutId();
      if (active !== undefined) throw new WorkoutLoggerError('workoutAlreadyInProgress', active);
      return this.db.run(`INSERT INTO workout (startedAt, name, source, isInProgress) VALUES (?, ?, 'app', 1)`, [
        now.toISOString(),
        name,
      ]).lastInsertRowId;
    });
  }

  /** Starts a template workout, using its set kinds and the latest performed values. */
  startFromTemplate(templateId: number, now: Date): number {
    return this.db.transaction(() => {
      const active = this.activeWorkoutId();
      if (active !== undefined) throw new WorkoutLoggerError('workoutAlreadyInProgress', active);
      const template = this.db.get<{ name: string }>('SELECT name FROM template WHERE id = ?', [templateId]);
      if (template === undefined) throw new TemplateStoreError('notFound');
      const workoutId = this.db.run(
        `
        INSERT INTO workout (startedAt, name, source, isInProgress, templateId) VALUES (?, ?, 'app', 1, ?)
      `,
        [now.toISOString(), template.name, templateId],
      ).lastInsertRowId;
      const exercises = this.db.all<{
        id: number;
        exerciseId: number;
        position: number;
        supersetGroup: number | null;
        notes: string | null;
        defaultEntryUnit: WeightUnit;
        tracking: ExerciseTracking;
      }>(
        `
        SELECT te.*, e.defaultEntryUnit, e.tracking FROM templateExercise te JOIN exercise e ON e.id = te.exerciseId
        WHERE te.templateId = ? ORDER BY te.position
      `,
        [templateId],
      );
      for (const exercise of exercises) {
        const entry = this.db.run(
          `
          INSERT INTO workoutExercise (workoutId, exerciseId, position, supersetGroup, notes) VALUES (?, ?, ?, ?, ?)
        `,
          [workoutId, exercise.exerciseId, exercise.position, exercise.supersetGroup, exercise.notes],
        ).lastInsertRowId;
        const previous = previousPerformance(this.db, exercise.exerciseId, workoutId);
        const sets = this.db.all<{ kind: SetKind; targetRepsLow: number | null }>(
          `
          SELECT kind, targetRepsLow FROM templateSet WHERE templateExerciseId = ? ORDER BY position
        `,
          [exercise.id],
        );
        const isTimed = TIMED_TRACKINGS.has(exercise.tracking);
        const matches = matchPreviousSets(sets, previous);
        sets.forEach((set, index) => {
          const prior = matches[index];
          this.db.run(
            `
            INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, durationSeconds, isCompleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
          `,
            [
              entry,
              index,
              set.kind,
              prior?.weightKilograms ?? 0,
              exercise.defaultEntryUnit,
              prior?.reps ?? (isTimed ? 0 : (set.targetRepsLow ?? 0)),
              prior?.rpe ?? null,
              // For timed exercises the template's target is seconds, not reps.
              prior?.durationSeconds ?? (isTimed ? set.targetRepsLow : null),
            ],
          );
        });
        this.initializeWarmups(entry);
      }
      return workoutId;
    });
  }

  /** Drops planned sets and ends the workout. Repeating a finish never changes finished data; missing ids are a no-op. */
  finish(workoutId: number, now: Date): FinishResult {
    return this.db.transaction(() => {
      const workout = this.db.get<{ isInProgress: number }>('SELECT isInProgress FROM workout WHERE id = ?', [
        workoutId,
      ]);
      if (workout === undefined) return { workoutId: null, completedSets: 0, droppedSets: 0 };
      if (workout.isInProgress === 0) {
        const completedSets =
          this.db.value<number>(
            `
          SELECT COUNT(*) FROM workoutSet s
          JOIN workoutExercise entry ON entry.id = s.workoutExerciseId
          WHERE entry.workoutId = ? AND s.isCompleted = 1
        `,
            [workoutId],
          ) ?? 0;
        return { workoutId, completedSets, droppedSets: 0 };
      }
      const droppedSets = this.db.run(
        `
        DELETE FROM workoutSet WHERE isCompleted = 0
        AND workoutExerciseId IN (SELECT id FROM workoutExercise WHERE workoutId = ?)
      `,
        [workoutId],
      ).changes;
      this.db.run(
        `
        DELETE FROM workoutExercise WHERE workoutId = ?
        AND id NOT IN (SELECT workoutExerciseId FROM workoutSet)
      `,
        [workoutId],
      );
      const completedSets =
        this.db.value<number>(
          `
        SELECT COUNT(*) FROM workoutSet s JOIN workoutExercise we ON we.id = s.workoutExerciseId
        WHERE we.workoutId = ?
      `,
          [workoutId],
        ) ?? 0;
      if (completedSets === 0) {
        this.db.run('DELETE FROM workout WHERE id = ?', [workoutId]);
        return { workoutId: null, completedSets, droppedSets };
      }
      this.renumberExercises(workoutId);
      const entries = this.db.all<{ id: number }>('SELECT id FROM workoutExercise WHERE workoutId = ?', [workoutId]);
      for (const entry of entries) this.renumberSets(entry.id);
      this.db.run('UPDATE workout SET endedAt = ?, isInProgress = 0 WHERE id = ?', [now.toISOString(), workoutId]);
      this.db.run(
        `UPDATE template SET lastStartedAt = (SELECT startedAt FROM workout WHERE id = ?)
         WHERE id = (SELECT templateId FROM workout WHERE id = ?)`,
        [workoutId, workoutId],
      );
      return { workoutId, completedSets, droppedSets };
    });
  }

  /** Deletes a workout and its exercises and sets. */
  discard(workoutId: number): void {
    this.db.transaction(() => {
      if (this.db.run('DELETE FROM workout WHERE id = ?', [workoutId]).changes === 0)
        throw new WorkoutLoggerError('workoutNotFound');
    });
  }

  /** Renames a workout and changes its notes; empty notes become null. */
  update(workoutId: number, name: string, notes: string | null): void {
    this.db.transaction(() => {
      this.requireWorkout(workoutId);
      this.db.run('UPDATE workout SET name = ?, notes = ? WHERE id = ?', [
        name,
        notes === '' ? null : notes,
        workoutId,
      ]);
    });
  }

  /** Appends an exercise, copying the last session into planned sets, or one empty set. */
  addExercise(exerciseId: number, workoutId: number): number {
    return this.db.transaction(() => {
      this.requireWorkout(workoutId);
      const exercise = this.db.get<{ defaultEntryUnit: WeightUnit }>(
        'SELECT defaultEntryUnit FROM exercise WHERE id = ?',
        [exerciseId],
      );
      if (exercise === undefined) throw new WorkoutLoggerError('exerciseNotFound');
      const position =
        this.db.value<number>('SELECT COUNT(*) FROM workoutExercise WHERE workoutId = ?', [workoutId]) ?? 0;
      const entryId = this.db.run('INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, ?)', [
        workoutId,
        exerciseId,
        position,
      ]).lastInsertRowId;
      const previous = previousPerformance(this.db, exerciseId, workoutId);
      if (previous.length === 0) {
        this.db.run(
          `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted) VALUES (?, 0, 'working', 0, ?, 0, 0)`,
          [entryId, exercise.defaultEntryUnit],
        );
      } else {
        previous.forEach((set, index) => {
          this.db.run(
            `
            INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, durationSeconds, side, isCompleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
          `,
            [
              entryId,
              index,
              set.kind,
              set.weightKilograms,
              exercise.defaultEntryUnit,
              set.reps,
              set.rpe,
              set.durationSeconds,
              set.side,
            ],
          );
        });
      }
      this.initializeWarmups(entryId);
      return entryId;
    });
  }

  /** Removes an exercise and its sets, closing the position gap. */
  removeExercise(entryId: number): void {
    this.db.transaction(() => {
      const entry = this.requireEntry(entryId);
      this.db.run('DELETE FROM workoutExercise WHERE id = ?', [entryId]);
      this.warmupState.delete(entryId);
      this.renumberExercises(entry.workoutId);
    });
  }

  /** Moves an exercise to a clamped zero-based position. */
  moveExercise(entryId: number, newPosition: number): void {
    this.db.transaction(() => {
      const entry = this.requireEntry(entryId);
      const order = this.db
        .all<{ id: number }>('SELECT id FROM workoutExercise WHERE workoutId = ? ORDER BY position', [entry.workoutId])
        .map((row) => row.id)
        .filter((id) => id !== entryId);
      order.splice(Math.min(Math.max(0, newPosition), order.length), 0, entryId);
      this.assignPositions(order, 'workoutExercise');
    });
  }

  /** Appends a planned set copying the last set; a warm-up becomes a working set. */
  addSet(entryId: number): number {
    return this.db.transaction(() => {
      const entry = this.requireEntry(entryId);
      const exercise = this.db.get<{ defaultEntryUnit: WeightUnit }>(
        'SELECT defaultEntryUnit FROM exercise WHERE id = ?',
        [entry.exerciseId],
      );
      if (exercise === undefined) throw new WorkoutLoggerError('exerciseNotFound');
      const last = this.db.get<WorkoutSetRow>(
        'SELECT * FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position DESC LIMIT 1',
        [entryId],
      );
      const id = this.db.run(
        `
        INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, durationSeconds, side, isCompleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `,
        [
          entryId,
          (last?.position ?? -1) + 1,
          last?.kind === 'warmup' ? 'working' : (last?.kind ?? 'working'),
          last?.weightKilograms ?? 0,
          last?.entryUnit ?? exercise.defaultEntryUnit,
          last?.reps ?? 0,
          last?.durationSeconds ?? null,
          last?.side ?? 'both',
        ],
      ).lastInsertRowId;
      this.refreshEntryWarmups(entryId);
      return id;
    });
  }

  /** Updates kg load, typed unit, reps, RPE, kind and duration in seconds (null or finite and nonnegative). */
  updateSet(
    setId: number,
    weightKilograms: number,
    entryUnit: WeightUnit,
    reps: number,
    rpe: number | null,
    kind: SetKind,
    durationSeconds: number | null = null,
  ): void {
    if (!(weightKilograms >= 0 && weightKilograms <= WorkoutLoggerLimits.maximumKilograms))
      throw new WorkoutLoggerError('invalidWeight', weightKilograms);
    if (!Number.isInteger(reps) || reps < 0 || reps > WorkoutLoggerLimits.maximumReps)
      throw new WorkoutLoggerError('invalidReps', reps);
    if (rpe !== null && !(rpe >= WorkoutLoggerLimits.rpeRange.minimum && rpe <= WorkoutLoggerLimits.rpeRange.maximum))
      throw new WorkoutLoggerError('invalidRPE', rpe);
    if (durationSeconds !== null && (!Number.isFinite(durationSeconds) || durationSeconds < 0))
      throw new WorkoutLoggerError('invalidDuration', durationSeconds);
    this.db.transaction(() => {
      const original = this.db.get<WorkoutSetRow>('SELECT * FROM workoutSet WHERE id = ?', [setId]);
      if (original === undefined) throw new WorkoutLoggerError('setNotFound');
      const warmupState = this.warmupStateFor(original.workoutExerciseId);
      if (
        this.db.run(
          `
        UPDATE workoutSet SET weightKilograms = ?, entryUnit = ?, reps = ?, rpe = ?, kind = ?, durationSeconds = ? WHERE id = ?
      `,
          [weightKilograms, entryUnit, reps, rpe, kind, durationSeconds, setId],
        ).changes === 0
      )
        throw new WorkoutLoggerError('setNotFound');
      if (original.kind === 'warmup' || kind === 'warmup') {
        const state = warmupState;
        if (original.weightKilograms !== weightKilograms || original.reps !== reps || original.kind !== kind) {
          state?.edited.add(setId);
          state?.suggested.delete(setId);
        }
      }
      if (original.kind !== kind || (kind !== 'warmup' && original.weightKilograms !== weightKilograms)) {
        this.refreshEntryWarmups(original.workoutExerciseId);
      }
    });
  }

  /** Changes the exercise default and this entry's planned units without changing kg values. */
  setEntryUnit(unit: WeightUnit, entryId: number): void {
    this.db.transaction(() => {
      const entry = this.requireEntry(entryId);
      this.db.run('UPDATE exercise SET defaultEntryUnit = ? WHERE id = ?', [unit, entry.exerciseId]);
      this.db.run('UPDATE workoutSet SET entryUnit = ? WHERE workoutExerciseId = ? AND isCompleted = 0', [
        unit,
        entryId,
      ]);
      this.refreshEntryWarmups(entryId);
    });
  }

  /** Sets completion, recording time and rest in seconds only when the state changes; repeated requests are a no-op. */
  setCompleted(setId: number, completed: boolean, now: Date): void {
    this.db.transaction(() => {
      const set = this.db.get<{ workoutId: number; isCompleted: number }>(
        `
        SELECT we.workoutId, s.isCompleted
        FROM workoutSet s
        JOIN workoutExercise we ON we.id = s.workoutExerciseId
        WHERE s.id = ?
      `,
        [setId],
      );
      if (set === undefined) throw new WorkoutLoggerError('setNotFound');
      if (set.isCompleted === Number(completed)) return;
      const previous = completed
        ? this.db.value<string | null>(
            `
        SELECT MAX(s.completedAt) FROM workoutSet s JOIN workoutExercise we ON we.id = s.workoutExerciseId
        WHERE we.workoutId = ? AND s.isCompleted = 1 AND s.id <> ?
      `,
            [set.workoutId, setId],
          )
        : null;
      const rest =
        previous === null || previous === undefined ? null : (now.getTime() - new Date(previous).getTime()) / 1000;
      this.db.run('UPDATE workoutSet SET isCompleted = ?, completedAt = ?, restBeforeSeconds = ? WHERE id = ?', [
        completed ? 1 : 0,
        completed ? now.toISOString() : null,
        rest,
        setId,
      ]);
    });
  }

  /** Deletes a set and closes the gap in positions. */
  deleteSet(setId: number): void {
    this.db.transaction(() => {
      const set = this.db.get<{ workoutExerciseId: number; kind: SetKind }>(
        'SELECT workoutExerciseId, kind FROM workoutSet WHERE id = ?',
        [setId],
      );
      if (set === undefined) throw new WorkoutLoggerError('setNotFound');
      this.db.run('DELETE FROM workoutSet WHERE id = ?', [setId]);
      this.renumberSets(set.workoutExerciseId);
      if (set.kind === 'warmup') {
        const state = this.warmupState.get(set.workoutExerciseId);
        state?.suggested.delete(setId);
        state?.edited.delete(setId);
        const remaining =
          this.db.value<number>(
            `
          SELECT COUNT(*) FROM workoutSet WHERE workoutExerciseId = ? AND kind = 'warmup'
        `,
            [set.workoutExerciseId],
          ) ?? 0;
        if (remaining === 0)
          this.warmupState.set(set.workoutExerciseId, { edited: new Set(), suggested: new Set(), suppressed: true });
      } else {
        this.refreshEntryWarmups(set.workoutExerciseId);
      }
    });
  }

  private requireWorkout(workoutId: number): void {
    if (this.db.value<number>('SELECT id FROM workout WHERE id = ?', [workoutId]) === undefined)
      throw new WorkoutLoggerError('workoutNotFound');
  }

  private requireEntry(entryId: number): { workoutId: number; exerciseId: number } {
    const entry = this.db.get<{ workoutId: number; exerciseId: number }>(
      'SELECT workoutId, exerciseId FROM workoutExercise WHERE id = ?',
      [entryId],
    );
    if (entry === undefined) throw new WorkoutLoggerError('exerciseNotFound');
    return entry;
  }

  private renumberExercises(workoutId: number): void {
    const order = this.db
      .all<{ id: number }>('SELECT id FROM workoutExercise WHERE workoutId = ? ORDER BY position', [workoutId])
      .map((row) => row.id);
    this.assignPositions(order, 'workoutExercise');
  }

  private renumberSets(entryId: number): void {
    const order = this.db
      .all<{ id: number }>('SELECT id FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position', [entryId])
      .map((row) => row.id);
    this.assignPositions(order, 'workoutSet');
  }

  private assignPositions(order: readonly number[], table: 'workoutExercise' | 'workoutSet'): void {
    order.forEach((id, index) => this.db.run(`UPDATE ${table} SET position = ? WHERE id = ?`, [-(index + 1), id]));
    order.forEach((id, index) => this.db.run(`UPDATE ${table} SET position = ? WHERE id = ?`, [index, id]));
  }
}
