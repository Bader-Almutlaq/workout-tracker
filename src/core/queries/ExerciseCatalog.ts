import type { Database } from '../db/Database';
import { fromExerciseRow, type Exercise, type ExerciseRow } from '../models/Exercise';
import { fromWorkoutSetRow, type WorkoutSet, type WorkoutSetRow } from '../models/WorkoutSet';
import type { Equipment } from '../library/Equipment';
import type { ExerciseLibrary } from '../library/ExerciseLibrary';
import type { ExerciseSearchEntry } from '../library/ExerciseSearch';
import type { Muscle } from '../library/Muscle';

/** Maximum number of workout entries inspected for the recent sessions list, matching native behavior. */
export const recentSessionLimit = 10;
/** One recent workout containing the exercise; top set excludes warmups. */
export interface ExerciseCatalogSession {
  readonly workoutId: number;
  readonly startedAt: Date;
  readonly workSetCount: number;
  readonly topSet: WorkoutSet | null;
}
/** Exercise details, usage totals and recent sessions. */
export interface ExerciseCatalogDetail {
  readonly exercise: Exercise;
  readonly primaryMuscles: readonly Muscle[];
  readonly secondaryMuscles: readonly Muscle[];
  readonly aliases: readonly string[];
  readonly workoutCount: number;
  readonly setCount: number;
  readonly firstUsedAt: Date | null;
  readonly lastUsedAt: Date | null;
  readonly recentSessions: readonly ExerciseCatalogSession[];
}
/** An unmatched Strong exercise and its usage totals. */
export interface ExerciseCatalogUnmatchedImport {
  readonly exercise: Exercise;
  readonly workoutCount: number;
  readonly setCount: number;
}

function muscles(db: Database, id: number, role: string): Muscle[] {
  return db
    .all<{ muscleId: Muscle }>(
      'SELECT muscleId FROM exerciseMuscle WHERE exerciseId = ? AND role = ? ORDER BY muscleId',
      [id, role],
    )
    .map((row) => row.muscleId);
}
function aliases(db: Database, id: number, key: string | null, library: ExerciseLibrary | null): string[] {
  return [
    ...(library?.exercises.find((entry) => entry.key === key)?.aliases ?? []),
    ...db
      .all<{ alias: string }>('SELECT alias FROM exerciseAlias WHERE exerciseId = ? ORDER BY alias', [id])
      .map((row) => row.alias),
  ];
}
function date(value: string | null): Date | null {
  return value === null ? null : new Date(value);
}

/** Read-only database queries for exercise lists, details and unmatched imports. */
export const ExerciseCatalog = {
  /** Returns unarchived search entries, optionally including library aliases. */
  entries(db: Database, library: ExerciseLibrary | null): ExerciseSearchEntry[] {
    const rows = db.all<{
      id: number;
      name: string;
      equipment: Equipment | null;
      source: string;
      libraryKey: string | null;
      usageCount: number;
      lastUsedAt: string | null;
    }>(
      `SELECT e.id, e.name, e.equipment, e.source, e.libraryKey, COUNT(DISTINCT we.workoutId) AS usageCount, MAX(w.startedAt) AS lastUsedAt FROM exercise e LEFT JOIN workoutExercise we ON we.exerciseId = e.id LEFT JOIN workout w ON w.id = we.workoutId WHERE e.isArchived = 0 GROUP BY e.id`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      equipment: row.equipment,
      aliases: aliases(db, row.id, row.libraryKey, library),
      primaryMuscles: muscles(db, row.id, 'primary'),
      secondaryMuscles: muscles(db, row.id, 'secondary'),
      isCustom: row.source !== 'library',
      usageCount: row.usageCount,
      lastUsedAt: date(row.lastUsedAt),
    }));
  },
  /** Returns details for an exercise, or null when it is missing. */
  detail(db: Database, exerciseId: number, library: ExerciseLibrary | null = null): ExerciseCatalogDetail | null {
    const row = db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [exerciseId]);
    if (row === undefined) return null;
    const usage = db.get<{ workouts: number; sets: number; first: string | null; last: string | null }>(
      'SELECT COUNT(DISTINCT we.workoutId) AS workouts, COUNT(s.id) AS sets, MIN(w.startedAt) AS first, MAX(w.startedAt) AS last FROM workoutExercise we JOIN workout w ON w.id = we.workoutId LEFT JOIN workoutSet s ON s.workoutExerciseId = we.id WHERE we.exerciseId = ?',
      [exerciseId],
    );
    const entries = db.all<{ workoutId: number; startedAt: string; entryId: number }>(
      'SELECT w.id AS workoutId, w.startedAt, we.id AS entryId FROM workoutExercise we JOIN workout w ON w.id = we.workoutId WHERE we.exerciseId = ? ORDER BY w.startedAt DESC LIMIT ?',
      [exerciseId, recentSessionLimit],
    );
    const sessions: ExerciseCatalogSession[] = [];
    for (const entry of entries) {
      const work = db
        .all<WorkoutSetRow>("SELECT * FROM workoutSet WHERE workoutExerciseId = ? AND kind != 'warmup'", [
          entry.entryId,
        ])
        .map(fromWorkoutSetRow);
      const top = work.reduce<WorkoutSet | null>(
        (best, set) =>
          best === null ||
          set.weightKilograms > best.weightKilograms ||
          (set.weightKilograms === best.weightKilograms && set.reps > best.reps)
            ? set
            : best,
        null,
      );
      const index = sessions.findIndex((session) => session.workoutId === entry.workoutId);
      const previous = sessions[index];
      if (previous === undefined)
        sessions.push({
          workoutId: entry.workoutId,
          startedAt: new Date(entry.startedAt),
          workSetCount: work.length,
          topSet: top,
        });
      else
        sessions[index] = {
          ...previous,
          workSetCount: previous.workSetCount + work.length,
          topSet:
            top !== null && top.weightKilograms > (previous.topSet?.weightKilograms ?? -1) ? top : previous.topSet,
        };
    }
    return {
      exercise: fromExerciseRow(row),
      primaryMuscles: muscles(db, exerciseId, 'primary'),
      secondaryMuscles: muscles(db, exerciseId, 'secondary'),
      aliases: aliases(db, exerciseId, row.libraryKey, library),
      workoutCount: usage?.workouts ?? 0,
      setCount: usage?.sets ?? 0,
      firstUsedAt: date(usage?.first ?? null),
      lastUsedAt: date(usage?.last ?? null),
      recentSessions: sessions,
    };
  },
  /** Returns Strong exercises ordered by descending set count, then name. */
  unmatchedImports(db: Database): ExerciseCatalogUnmatchedImport[] {
    const rows = db.all<ExerciseRow & { workouts: number; sets: number }>(
      "SELECT e.*, COUNT(DISTINCT we.workoutId) AS workouts, COUNT(s.id) AS sets FROM exercise e LEFT JOIN workoutExercise we ON we.exerciseId = e.id LEFT JOIN workoutSet s ON s.workoutExerciseId = we.id WHERE e.source = 'strong' GROUP BY e.id ORDER BY sets DESC, e.name",
    );
    return rows.map(({ workouts, sets, ...row }) => ({
      exercise: fromExerciseRow(row),
      workoutCount: workouts,
      setCount: sets,
    }));
  },
};
