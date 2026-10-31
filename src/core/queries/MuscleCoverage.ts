import { HardSetPolicy, isHardSet, type HardSet } from '../analytics/HardSets';
import type { Database } from '../db/Database';
import { MUSCLES, type Muscle } from '../library/Muscle';
import { isMainMuscle } from '../library/MuscleProminence';
import type { MuscleRole } from '../library/MuscleRole';
import { MOVEMENT_PATTERNS, type MovementPattern } from '../library/MovementPattern';
import { localDateKey } from '../support/localDate';

/** Heuristic: classify isolated limb patterns by the limb moved; trunk, carries and Olympic lifts are neither. */
export const PATTERN_REGION: Readonly<Record<MovementPattern, 'upper' | 'lower' | 'neither'>> = Object.freeze({
  'horizontal-push': 'upper',
  'vertical-push': 'upper',
  'horizontal-pull': 'upper',
  'vertical-pull': 'upper',
  'chest-fly': 'upper',
  'shoulder-abduction': 'upper',
  'shoulder-flexion': 'upper',
  'rear-delt-fly': 'upper',
  'shoulder-extension': 'upper',
  'shoulder-rotation': 'upper',
  shrug: 'upper',
  squat: 'lower',
  lunge: 'lower',
  hinge: 'lower',
  'hip-thrust': 'lower',
  'knee-extension': 'lower',
  'knee-flexion': 'lower',
  'hip-abduction': 'lower',
  'hip-adduction': 'lower',
  'calf-raise': 'lower',
  'elbow-flexion': 'upper',
  'elbow-extension': 'upper',
  'wrist-flexion': 'upper',
  'wrist-extension': 'upper',
  grip: 'upper',
  'spinal-flexion': 'neither',
  'spinal-extension': 'neither',
  rotation: 'neither',
  'anti-movement': 'neither',
  carry: 'neither',
  olympic: 'neither',
  neck: 'neither',
});

/** Weekly means and elapsed local calendar days since direct hard training, or null if never trained. */
export interface MuscleCoverageItem {
  readonly muscle: Muscle;
  readonly setsPerWeek: number;
  readonly daysPerWeek: number;
  /** Fractional hard sets per week in the trailing four weeks. */
  readonly recentSetsPerWeek: number;
  readonly daysSince: number | null;
}
/** Whole hard sets on either side of a descriptive ratio; ratio is null if either side is zero. */
export interface CoverageRatio {
  readonly label: string;
  readonly first: number;
  readonly second: number;
  readonly ratio: number | null;
}
/** An exercise's fractional sets and percentage of one muscle's total. */
export interface ExerciseShare {
  readonly exerciseId: number;
  readonly name: string;
  readonly sets: number;
  readonly percent: number;
}
/** Coverage for the selected inclusive local dates and trailing four weeks. */
export interface MuscleCoverageResult {
  readonly muscles: readonly MuscleCoverageItem[];
  readonly neglected: readonly MuscleCoverageItem[];
  readonly ratios: readonly CoverageRatio[];
  readonly shares: Readonly<Partial<Record<Muscle, readonly ExerciseShare[]>>>;
}
interface Row extends HardSet {
  readonly startedAt: string;
  readonly muscle: Muscle | null;
  readonly role: MuscleRole | null;
  readonly exerciseId: number;
  readonly name: string;
  readonly pattern: MovementPattern | null;
}
interface RawRow extends Omit<Row, 'isCompleted'> {
  readonly isCompleted: number;
}
/** Report §12: four weeks, <4 sets/week and at least one fractional set for a training day. */
const policy = Object.freeze({
  daysPerWeek: 7,
  neglectedWeeks: 4,
  neglectedLimit: 4,
  frequencyThreshold: 1,
  millisecondsPerDay: 86_400_000,
});
function day(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function shift(date: Date, days: number): Date {
  const result = day(date);
  result.setDate(result.getDate() + days);
  return result;
}
function monday(date: Date): Date {
  const result = day(date);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
function elapsed(first: Date, last: Date): number {
  return Math.round(
    (Date.UTC(last.getFullYear(), last.getMonth(), last.getDate()) -
      Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) /
      policy.millisecondsPerDay,
  );
}
function weight(role: MuscleRole): number {
  return role === 'primary' ? HardSetPolicy.primaryWeight : HardSetPolicy.secondaryWeight;
}

/**
 * Finished completed hard sets over inclusive local dates; weeks are Monday-based and zero-filled.
 * Frequency counts days with at least one fractional set. Neglect uses the 28 days ending at `to`.
 * Report, muscle coverage and recommended algorithms §12; ratios describe counts without targets.
 */
export function muscleCoverage(db: Database, from: Date, to: Date): MuscleCoverageResult {
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) {
    return { muscles: [], neglected: [], ratios: [], shares: {} };
  }
  const start = day(from);
  const end = shift(to, 1);
  const trailing = shift(end, -policy.daysPerWeek * policy.neglectedWeeks);
  const rows = db
    .all<RawRow>(
      `
    SELECT w.startedAt, s.kind, s.rpe, s.isCompleted, em.muscleId AS muscle, em.role,
           e.id AS exerciseId, e.name, e.movementPattern AS pattern
    FROM workout w JOIN workoutExercise we ON we.workoutId = w.id
    JOIN exercise e ON e.id = we.exerciseId JOIN workoutSet s ON s.workoutExerciseId = we.id
    LEFT JOIN exerciseMuscle em ON em.exerciseId = e.id
    WHERE w.isInProgress = 0 AND w.startedAt < ?
    ORDER BY w.startedAt, w.id, we.position, s.position
  `,
      [end.toISOString()],
    )
    .map((row) => ({ ...row, isCompleted: row.isCompleted === 1 }))
    .filter(isHardSet);
  const weeks = Math.floor(elapsed(monday(start), monday(to)) / policy.daysPerWeek) + 1;
  const days = new Map<Muscle, Map<string, number>>();
  const totals = new Map<Muscle, number>();
  const recent = new Map<Muscle, number>();
  const last = new Map<Muscle, Date>();
  const exerciseTotals = new Map<Muscle, Map<number, { name: string; sets: number }>>();
  for (const row of rows) {
    if (row.muscle === null || row.role === null) continue;
    const date = new Date(row.startedAt);
    const amount = weight(row.role);
    if (row.role === 'primary') last.set(row.muscle, date);
    if (date >= trailing) recent.set(row.muscle, (recent.get(row.muscle) ?? 0) + amount);
    if (date < start) continue;
    totals.set(row.muscle, (totals.get(row.muscle) ?? 0) + amount);
    const muscleDays = days.get(row.muscle) ?? new Map<string, number>();
    const key = localDateKey(date);
    muscleDays.set(key, (muscleDays.get(key) ?? 0) + amount);
    days.set(row.muscle, muscleDays);
    const exercises = exerciseTotals.get(row.muscle) ?? new Map<number, { name: string; sets: number }>();
    const prior = exercises.get(row.exerciseId);
    exercises.set(row.exerciseId, { name: row.name, sets: (prior?.sets ?? 0) + amount });
    exerciseTotals.set(row.muscle, exercises);
  }
  const muscles = MUSCLES.map((muscle) => ({
    muscle,
    setsPerWeek: (totals.get(muscle) ?? 0) / weeks,
    recentSetsPerWeek: (recent.get(muscle) ?? 0) / policy.neglectedWeeks,
    daysPerWeek:
      [...(days.get(muscle)?.values() ?? [])].filter((value) => value >= policy.frequencyThreshold).length / weeks,
    daysSince: last.has(muscle) ? elapsed(day(last.get(muscle) ?? to), day(to)) : null,
  }));
  const neglected = muscles.filter(
    (item) =>
      isMainMuscle(item.muscle) && (recent.get(item.muscle) ?? 0) / policy.neglectedWeeks < policy.neglectedLimit,
  );
  const definitions: readonly [string, readonly MovementPattern[], readonly MovementPattern[]][] = [
    ['Horizontal push : pull', ['horizontal-push'], ['horizontal-pull']],
    ['Vertical push : pull', ['vertical-push'], ['vertical-pull']],
    ['Knee-dominant : hip-dominant', ['squat', 'lunge', 'knee-extension'], ['hinge', 'hip-thrust', 'knee-flexion']],
    [
      'Upper : lower',
      MOVEMENT_PATTERNS.filter((pattern) => PATTERN_REGION[pattern] === 'upper'),
      MOVEMENT_PATTERNS.filter((pattern) => PATTERN_REGION[pattern] === 'lower'),
    ],
  ];
  // Each joined association represents the same set, so count each set only once for patterns.
  const patternRows = db
    .all<{ pattern: MovementPattern | null; kind: HardSet['kind']; rpe: number | null; isCompleted: number }>(
      `
    SELECT e.movementPattern AS pattern, s.kind, s.rpe, s.isCompleted
    FROM workout w JOIN workoutExercise we ON we.workoutId = w.id JOIN exercise e ON e.id = we.exerciseId
    JOIN workoutSet s ON s.workoutExerciseId = we.id
    WHERE w.isInProgress = 0 AND w.startedAt >= ? AND w.startedAt < ?
  `,
      [start.toISOString(), end.toISOString()],
    )
    .filter((row) => isHardSet({ ...row, isCompleted: row.isCompleted === 1 }));
  const ratios = definitions.map(([label, a, b]) => {
    const first = patternRows.filter((row) => row.pattern !== null && a.includes(row.pattern)).length;
    const second = patternRows.filter((row) => row.pattern !== null && b.includes(row.pattern)).length;
    return { label, first, second, ratio: first === 0 || second === 0 ? null : first / second };
  });
  const shares: Partial<Record<Muscle, ExerciseShare[]>> = {};
  for (const [muscle, exercises] of exerciseTotals) {
    const total = totals.get(muscle) ?? 0;
    shares[muscle] = [...exercises]
      .map(([exerciseId, item]) => ({ exerciseId, ...item, percent: (item.sets / total) * 100 }))
      .sort((a, b) => b.sets - a.sets);
  }
  return { muscles, neglected, ratios, shares };
}
