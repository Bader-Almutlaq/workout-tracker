import { estimatedOneRepMax } from '../analytics/EstimatedOneRepMax';
import type { DatedValue } from '../analytics/TimeBuckets';
import type { Database } from '../db/Database';
import { fromExerciseRow, type Exercise, type ExerciseRow } from '../models/Exercise';
import { isWorkSetKind } from '../models/SetKind';
import { fromWorkoutSetRow, type WorkoutSet, type WorkoutSetRow } from '../models/WorkoutSet';

/** Heuristic: bound History rendering and worker responses to 200 sessions per page. */
export const ExerciseHistoryPolicy = Object.freeze({ pageSize: 200 });

/** One finished session, including completed warm-ups, across repeated exercise entries. */
export interface ExerciseSession {
  readonly workoutId: number;
  readonly date: string;
  readonly name: string;
  readonly sets: readonly WorkoutSet[];
}

/** Per-session value in kg, kg × reps, reps or seconds; never rounded or converted. */
export interface ExerciseSeriesPoint extends DatedValue {
  readonly workoutId: number;
  readonly set: WorkoutSet;
}

/** Shared read-only source for exercise charts and records; missing exercises have null metadata. */
export interface ExerciseSeriesHistory {
  readonly exercise: Exercise | null;
  readonly sessions: readonly ExerciseSession[];
}

interface SessionRow {
  readonly workoutId: number;
  readonly date: string;
  readonly name: string;
}

function sessions(db: Database, exerciseId: number, now: Date, limit: number, offset: number): ExerciseSession[] {
  const selected = db.all<SessionRow>(
    `
    SELECT w.id AS workoutId, w.startedAt AS date, w.name
    FROM workout w
    WHERE w.isInProgress = 0 AND w.startedAt <= ?
      AND EXISTS (SELECT 1 FROM workoutExercise we WHERE we.workoutId = w.id AND we.exerciseId = ?)
    ORDER BY w.startedAt DESC, w.id DESC
    LIMIT ? OFFSET ?
    `,
    [now.toISOString(), exerciseId, limit, offset],
  );
  if (selected.length === 0) return [];
  const placeholders = selected.map(() => '?').join(', ');
  const sets = db.all<WorkoutSetRow & { readonly workoutId: number }>(
    `
    SELECT s.*, we.workoutId
    FROM workoutExercise we
    JOIN workoutSet s ON s.workoutExerciseId = we.id
    WHERE we.exerciseId = ? AND s.isCompleted = 1 AND we.workoutId IN (${placeholders})
    ORDER BY we.position, we.id, s.position, s.id
    `,
    [exerciseId, ...selected.map((session) => session.workoutId)],
  );
  const grouped = new Map<number, WorkoutSet[]>();
  for (const row of sets) {
    const group = grouped.get(row.workoutId) ?? [];
    group.push(fromWorkoutSetRow(row));
    grouped.set(row.workoutId, group);
  }
  return selected.map((session) => ({ ...session, sets: grouped.get(session.workoutId) ?? [] }));
}

function workSets(session: ExerciseSession): readonly WorkoutSet[] {
  return session.sets.filter((set) => isWorkSetKind(set.kind));
}

function maximums(history: ExerciseSeriesHistory, valueOf: (set: WorkoutSet) => number | null): ExerciseSeriesPoint[] {
  const points: ExerciseSeriesPoint[] = [];
  for (const session of history.sessions) {
    let best: ExerciseSeriesPoint | undefined;
    for (const set of workSets(session)) {
      const value = valueOf(set);
      if (value !== null && Number.isFinite(value) && (best === undefined || value > best.value)) {
        best = { workoutId: session.workoutId, date: session.date, value, set };
      }
    }
    if (best !== undefined) points.push(best);
  }
  return points;
}

/** Queries and descriptive series for finished sessions. Ties retain the first logged set; sessions stay distinct even on the same day. */
export const ExerciseSeries = Object.freeze({
  /** Completed sets, newest sessions first; a bounded page, including warm-ups for History. */
  history(db: Database, exerciseId: number, offset = 0, now = new Date()): readonly ExerciseSession[] {
    return sessions(db, exerciseId, now, ExerciseHistoryPolicy.pageSize, Math.max(0, Math.floor(offset)));
  },

  /** All finished history through now, oldest first, read once per Charts or Records request. */
  read(db: Database, exerciseId: number, now = new Date()): ExerciseSeriesHistory {
    const row = db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [exerciseId]);
    return {
      exercise: row === undefined ? null : fromExerciseRow(row),
      sessions: row === undefined ? [] : sessions(db, exerciseId, now, -1, 0).reverse(),
    };
  },

  /** Maximum qualifying e1RM per session, kg. Research report, recommended algorithms 1, 2 and 4; delegates all eligibility and arithmetic. */
  estimatedOneRepMax(history: ExerciseSeriesHistory): readonly ExerciseSeriesPoint[] {
    const exercise = history.exercise;
    return exercise === null
      ? []
      : maximums(history, (set) => estimatedOneRepMax(set, exercise)?.e1rmKilograms ?? null);
  },

  /** Heuristic: largest positive external load per session, independent of reps/RPE; only weight-reps and weight-duration track loads. */
  heaviestWeight(history: ExerciseSeriesHistory): readonly ExerciseSeriesPoint[] {
    if (history.exercise?.tracking !== 'weight-reps' && history.exercise?.tracking !== 'weight-duration') return [];
    return maximums(history, (set) => (set.weightKilograms > 0 ? set.weightKilograms : null));
  },

  /** Heuristic: sum(load kg × positive integer reps) over completed work sets per session, including drop/failure; not a measure of hypertrophy. */
  sessionVolume(history: ExerciseSeriesHistory): readonly ExerciseSeriesPoint[] {
    if (history.exercise?.tracking !== 'weight-reps') return [];
    return history.sessions.flatMap((session) => {
      const valid = workSets(session).filter(
        (set) =>
          Number.isFinite(set.weightKilograms) && set.weightKilograms > 0 && Number.isInteger(set.reps) && set.reps > 0,
      );
      const set = valid[0];
      if (set === undefined) return [];
      return [
        {
          workoutId: session.workoutId,
          date: session.date,
          value: valid.reduce((sum, item) => sum + item.weightKilograms * item.reps, 0),
          set,
        },
      ];
    });
  },

  /** Heuristic: most positive integer reps in one completed work set, regardless of load; bodyweight load is never treated as total mass. */
  bestReps(history: ExerciseSeriesHistory): readonly ExerciseSeriesPoint[] {
    if (history.exercise?.tracking !== 'weight-reps' && history.exercise?.tracking !== 'bodyweight-reps') return [];
    return maximums(history, (set) => (Number.isInteger(set.reps) && set.reps > 0 ? set.reps : null));
  },

  /** Heuristic: longest completed work set in seconds; only timed tracking kinds apply. */
  duration(history: ExerciseSeriesHistory): readonly ExerciseSeriesPoint[] {
    if (history.exercise?.tracking !== 'duration' && history.exercise?.tracking !== 'weight-duration') return [];
    return maximums(history, (set) =>
      set.durationSeconds !== null && set.durationSeconds > 0 ? set.durationSeconds : null,
    );
  },

  /** Heuristic: cumulative maximum of qualifying session e1RM in kg, retained at every qualifying session to show plateaus. */
  progression(history: ExerciseSeriesHistory): readonly ExerciseSeriesPoint[] {
    let best = 0;
    return ExerciseSeries.estimatedOneRepMax(history).map((point) => {
      best = Math.max(best, point.value);
      return { ...point, value: best };
    });
  },
});
