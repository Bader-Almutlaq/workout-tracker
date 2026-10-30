import type { Database } from '../db/Database';
import { estimatedOneRepMax } from '../analytics/EstimatedOneRepMax';
import { fromExerciseRow, type Exercise, type ExerciseRow } from '../models/Exercise';
import { fromWorkoutSetRow, type WorkoutSet, type WorkoutSetRow } from '../models/WorkoutSet';

/** Heuristic: loads within 0.01 kg are equivalent after unit conversion; rep records stop at 12. */
const Limits = { tolerance: 0.01, maximumReps: 12 } as const;

/** A descriptive exercise record; session volume identifies its largest contributing set. Values are in kg. */
export interface PersonalBest {
  readonly exercise: Exercise;
  readonly kind: 'e1rm' | 'weight' | 'reps' | 'setVolume' | 'sessionVolume';
  readonly value: number;
  readonly previous: number;
  readonly reps: number | null;
  readonly set: WorkoutSet;
}

type Row = WorkoutSetRow & { readonly workoutId: number; readonly startedAt: string; readonly exerciseId: number };
type RecordValue = { value: number; set: WorkoutSet };
type Session = { workoutId: number; startedAt: string; exercise: Exercise; sets: WorkoutSet[] };
type Records = {
  weight?: RecordValue;
  e1rm?: RecordValue;
  setVolume?: RecordValue;
  sessionVolume?: RecordValue;
  reps: Map<number, RecordValue>;
};

function improves(value: number, previous: number): boolean {
  return value - previous > Limits.tolerance + Number.EPSILON * Math.max(value, previous);
}

function sessions(db: Database): Session[] {
  const exercises = new Map(db.all<ExerciseRow>('SELECT * FROM exercise').map((row) => [row.id, fromExerciseRow(row)]));
  const rows = db.all<Row>(`
    SELECT s.*, w.id AS workoutId, w.startedAt, we.exerciseId
    FROM workout w JOIN workoutExercise we ON we.workoutId = w.id
    JOIN workoutSet s ON s.workoutExerciseId = we.id
    JOIN exercise e ON e.id = we.exerciseId
    WHERE w.isInProgress = 0 AND s.isCompleted = 1 AND s.kind <> 'warmup' AND e.tracking = 'weight-reps'
    ORDER BY w.startedAt, w.id, we.exerciseId, we.position, s.position
  `);
  const groups = new Map<string, Session>();
  for (const row of rows) {
    const exercise = exercises.get(row.exerciseId);
    if (exercise === undefined) continue;
    const key = `${row.workoutId}:${row.exerciseId}`;
    let group = groups.get(key);
    if (group === undefined) {
      group = { workoutId: row.workoutId, startedAt: row.startedAt, exercise, sets: [] };
      groups.set(key, group);
    }
    group.sets.push(fromWorkoutSetRow(row));
  }
  return [...groups.values()];
}

function candidates(session: Session): Records {
  const result: Records = { reps: new Map() };
  let volume = 0;
  let lastEstimateKey = '';
  let lastEstimate: ReturnType<typeof estimatedOneRepMax> = null;
  for (const set of session.sets) {
    const weight = set.weightKilograms;
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(set.reps) || set.reps <= 0) continue;
    const setVolume = weight * set.reps;
    volume += setVolume;
    if (result.weight === undefined || weight > result.weight.value) result.weight = { value: weight, set };
    if (result.setVolume === undefined || setVolume > result.setVolume.value)
      result.setVolume = { value: setVolume, set };
    const estimateKey = `${set.kind}:${weight}:${set.reps}:${set.rpe}`;
    if (estimateKey !== lastEstimateKey) {
      lastEstimate = estimatedOneRepMax(set, session.exercise);
      lastEstimateKey = estimateKey;
    }
    const estimate = lastEstimate;
    if (estimate !== null && (result.e1rm === undefined || estimate.e1rmKilograms > result.e1rm.value)) {
      result.e1rm = { value: estimate.e1rmKilograms, set };
    }
    for (let reps = 1; reps <= Math.min(Limits.maximumReps, set.reps); reps += 1) {
      const previous = result.reps.get(reps);
      if (previous === undefined || weight > previous.value) result.reps.set(reps, { value: weight, set });
    }
  }
  if (result.setVolume !== undefined) result.sessionVolume = { value: volume, set: result.setVolume.set };
  return result;
}

function merge(history: Records, current: Records): void {
  for (const kind of ['weight', 'e1rm', 'setVolume', 'sessionVolume'] as const) {
    const next = current[kind];
    const old = history[kind];
    if (next !== undefined && (old === undefined || next.value > old.value)) history[kind] = next;
  }
  for (const [reps, next] of current.reps) {
    const old = history.reps.get(reps);
    if (old === undefined || next.value > old.value) history.reps.set(reps, next);
  }
}

function compare(session: Session, current: Records, history: Records): PersonalBest[] {
  const bests: PersonalBest[] = [];
  for (const kind of ['e1rm', 'weight', 'setVolume', 'sessionVolume'] as const) {
    const next = current[kind];
    const old = history[kind];
    if (next !== undefined && old !== undefined && improves(next.value, old.value)) {
      bests.push({
        exercise: session.exercise,
        kind,
        value: next.value,
        previous: old.value,
        reps: null,
        set: next.set,
      });
    }
  }
  const repBests = new Map<number, PersonalBest>();
  for (const [reps, next] of current.reps) {
    const old = history.reps.get(reps);
    if (old !== undefined && improves(next.value, old.value)) {
      repBests.set(next.value, {
        exercise: session.exercise,
        kind: 'reps',
        value: next.value,
        previous: old.value,
        reps,
        set: next.set,
      });
    }
  }
  return [...bests, ...repBests.values()];
}

function allBests(db: Database): Map<number, PersonalBest[]> {
  const history = new Map<number, Records>();
  const result = new Map<number, PersonalBest[]>();
  const all = sessions(db);
  let index = 0;
  while (index < all.length) {
    const time = all[index]?.startedAt;
    const batch: { session: Session; current: Records }[] = [];
    while (index < all.length && all[index]?.startedAt === time) {
      const session = all[index];
      index += 1;
      if (session === undefined) continue;
      const current = candidates(session);
      const prior = history.get(session.exercise.id);
      if (prior !== undefined) {
        const bests = compare(session, current, prior);
        result.set(session.workoutId, [...(result.get(session.workoutId) ?? []), ...bests]);
      }
      batch.push({ session, current });
    }
    for (const { session, current } of batch) {
      const prior = history.get(session.exercise.id) ?? { reps: new Map() };
      merge(prior, current);
      history.set(session.exercise.id, prior);
    }
  }
  return result;
}

/** Personal records in a finished workout versus strictly earlier finished workouts. */
export function personalBestsForWorkout(db: Database, workoutId: number): PersonalBest[] {
  return allBests(db).get(workoutId) ?? [];
}

/** Counts records per workout in one chronological pass through finished history. */
export function personalBestCounts(db: Database): Record<number, number> {
  return Object.fromEntries([...allBests(db)].map(([id, bests]) => [id, bests.length]));
}
