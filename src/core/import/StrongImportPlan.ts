import { isWorkSetKind, type SetKind } from '../models/SetKind';
import { groupBy } from '../support/groupBy';
import { inferEntryUnit, toKilograms } from '../units/Weight';
import type { WeightUnit } from '../units/WeightUnit';
import { findImplausibleSets, type SetFinding, type SetObservation } from '../validation/SetPlausibility';
import { resolveExportUnit, type UnitVerdict } from './ExportUnitResolver';
import { makeImportOptions, type SetCorrection, type StrongImportOptions } from './StrongImportOptions';
import type { PlannedMeasurement } from './StrongMeasurementsFile';
import type { StrongRow } from './StrongRow';

/** Prefix of `PlannedWorkout.sourceKey`; keeps Strong keys apart from any other source's. */
const SOURCE_KEY_PREFIX = 'strong:';

/** Milliseconds in a second, for turning a duration into an end time. */
const MILLISECONDS_PER_SECOND = 1000;

/** Valid RPE values; anything else in an export is dropped rather than stored. */
const RpeRange = { min: 1, max: 10 } as const;

/** Joins an exercise's several note rows. */
const NOTE_SEPARATOR = '\n';

/** A set ready to store, weights already in kilograms. */
export interface PlannedSet {
  /** Line in the export, for the review screen. */
  readonly line: number;
  readonly position: number;
  readonly kind: SetKind;
  readonly weightKilograms: number;
  readonly entryUnit: WeightUnit;
  readonly reps: number;
  readonly rpe: number | null;
  readonly durationSeconds: number | null;
  readonly distanceMeters: number | null;
  readonly notes: string | null;
  /** Whether the owner corrected this set in the review. */
  readonly isCorrected: boolean;
}

/** One exercise entry within a workout. */
export interface PlannedExercise {
  readonly name: string;
  readonly position: number;
  readonly notes: string | null;
  readonly sets: readonly PlannedSet[];
}

/** One workout. */
export interface PlannedWorkout {
  /** "strong:" + the exported start timestamp; makes re-imports idempotent. */
  readonly sourceKey: string;
  /** UTC ISO 8601 timestamp. */
  readonly startedAt: string;
  /** UTC ISO 8601 timestamp, or `null` when duration is missing or exceeds the supported calendar range. */
  readonly endedAt: string | null;
  readonly name: string;
  readonly notes: string | null;
  readonly exercises: readonly PlannedExercise[];
}

/** Per-exercise overview for the review screen. */
export interface ExerciseOverview {
  readonly name: string;
  /** Unit the export writes this exercise in (resolved or overridden). */
  readonly columnUnit: WeightUnit;
  /** What the resolver found, kept even when overridden. */
  readonly verdict: UnitVerdict;
  readonly isOverridden: boolean;
  readonly setCount: number;
  /** UTC ISO 8601 timestamp of the exercise's earliest set. */
  readonly firstDate: string;
  /** UTC ISO 8601 timestamp of the exercise's latest set. */
  readonly lastDate: string;
}

/** Totals for verifying the import against the file. */
export interface ImportTotals {
  readonly workouts: number;
  readonly sets: number;
  /** Sets that are not warm-ups. */
  readonly workSets: number;
  /** Σ weight × reps over non-warm-up sets, in kilograms. */
  readonly volumeKilograms: number;
  /** UTC ISO 8601 timestamp of the earliest workout, or `null` if there are none. */
  readonly firstDate: string | null;
  /** UTC ISO 8601 timestamp of the latest workout, or `null` if there are none. */
  readonly lastDate: string | null;
  /** Rest-timer rows skipped (newer exports only). */
  readonly skippedRestTimerRows: number;
}

/** Where a set sits, for showing a finding in context. */
export interface SetContext {
  readonly workoutStartedAt: string;
  readonly workoutName: string;
  readonly exerciseName: string;
  readonly set: PlannedSet;
}

/**
 * Everything a Strong import would write, worked out in memory so the owner can review it before
 * anything touches the database.
 *
 * Building a plan never fails: rows were already validated by the parsers. Rebuild it with new
 * `StrongImportOptions` whenever the owner changes a decision.
 */
export interface StrongImportPlan {
  readonly workouts: readonly PlannedWorkout[];
  /** One entry per exercise with sets, most sets first (ties in order of first appearance). */
  readonly exercises: readonly ExerciseOverview[];
  /** Every set keyed by its export line number. */
  readonly setsByLine: ReadonlyMap<number, SetContext>;
  /** Suspicious sets, minus those the owner confirmed or corrected. */
  readonly findings: readonly SetFinding[];
  readonly measurements: readonly PlannedMeasurement[];
  readonly totals: ImportTotals;
}

/** Mutable working copy of `PlannedExercise` while its rows are being read. */
interface ExerciseDraft {
  readonly name: string;
  readonly position: number;
  notes: string | null;
  readonly sets: PlannedSet[];
}

/** The rows of one workout: at least one, since a workout exists only because a row started it. */
type WorkoutRows = readonly [StrongRow, ...StrongRow[]];

type SetRow = StrongRow & { readonly content: { readonly kind: 'set'; readonly order: string } };

function isSetRow(row: StrongRow): row is SetRow {
  return row.content.kind === 'set';
}

/**
 * Builds the plan.
 * @param rows From `parseStrongWorkoutsFile`.
 * @param measurements From `parseStrongMeasurementsFile`; may be empty.
 * @param options The owner's review decisions.
 */
export function makeStrongImportPlan(
  rows: readonly StrongRow[],
  measurements: readonly PlannedMeasurement[] = [],
  options: StrongImportOptions = makeImportOptions(),
): StrongImportPlan {
  const setRows = rows.filter(isSetRow);
  const verdicts = resolveVerdicts(setRows);
  const columnUnitOf = (exerciseName: string): WeightUnit =>
    options.unitOverrides.get(exerciseName) ?? verdicts.get(exerciseName)?.columnUnit ?? 'kg';

  const workouts = groupIntoWorkouts(rows).map((workoutRows) =>
    makeWorkout(workoutRows, columnUnitOf, options.corrections),
  );

  let sets = 0;
  let workSets = 0;
  let volumeKilograms = 0;
  const setsByLine = new Map<number, SetContext>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        sets += 1;
        if (isWorkSetKind(set.kind)) {
          workSets += 1;
          volumeKilograms += set.weightKilograms * set.reps;
        }
        setsByLine.set(set.line, {
          workoutStartedAt: workout.startedAt,
          workoutName: workout.name,
          exerciseName: exercise.name,
          set,
        });
      }
    }
  }
  const startTimes = workouts.map((workout) => workout.startedAt).sort();

  return {
    workouts,
    exercises: makeOverviews(setRows, verdicts, columnUnitOf, options.unitOverrides),
    setsByLine,
    findings: findSuspiciousSets(workouts, options.confirmedLines),
    measurements,
    totals: {
      workouts: workouts.length,
      sets,
      workSets,
      volumeKilograms,
      firstDate: startTimes[0] ?? null,
      lastDate: startTimes[startTimes.length - 1] ?? null,
      skippedRestTimerRows: rows.filter((row) => row.content.kind === 'restTimer').length,
    },
  };
}

/** What `resolveExportUnit` finds for each exercise, before any override. */
function resolveVerdicts(setRows: readonly SetRow[]): Map<string, UnitVerdict> {
  const verdicts = new Map<string, UnitVerdict>();
  for (const [name, rows] of groupBy(setRows, (row) => row.exerciseName)) {
    verdicts.set(name, resolveExportUnit(rows.map((row) => row.weightValue)));
  }
  return verdicts;
}

/**
 * Splits rows into workouts, keeping file order. Strong writes each workout's rows contiguously,
 * keyed by its start timestamp.
 */
function groupIntoWorkouts(rows: readonly StrongRow[]): WorkoutRows[] {
  const groups: [StrongRow, ...StrongRow[]][] = [];
  for (const row of rows) {
    const current = groups[groups.length - 1];
    if (current !== undefined && current[current.length - 1]?.workoutKey === row.workoutKey) {
      current.push(row);
    } else {
      groups.push([row]);
    }
  }
  return groups;
}

function makeWorkout(
  rows: WorkoutRows,
  columnUnitOf: (exerciseName: string) => WeightUnit,
  corrections: ReadonlyMap<number, SetCorrection>,
): PlannedWorkout {
  const exercises: ExerciseDraft[] = [];
  for (const row of rows) {
    if (row.content.kind === 'restTimer') continue;
    // A new exercise entry starts whenever the exercise name changes.
    let exercise = exercises[exercises.length - 1];
    if (exercise?.name !== row.exerciseName) {
      exercise = { name: row.exerciseName, position: exercises.length, notes: null, sets: [] };
      exercises.push(exercise);
    }
    if (row.content.kind === 'note') {
      const joined = [exercise.notes, row.notes].filter((note) => note !== null).join(NOTE_SEPARATOR);
      exercise.notes = joined === '' ? null : joined;
    } else {
      exercise.sets.push(
        makeSet(
          row,
          row.content.order,
          exercise.sets.length,
          columnUnitOf(row.exerciseName),
          corrections.get(row.line),
        ),
      );
    }
  }

  const [first] = rows;
  return {
    sourceKey: SOURCE_KEY_PREFIX + first.workoutKey,
    startedAt: first.startedAt,
    endedAt: workoutEnd(first.startedAt, first.durationSeconds),
    name: first.workoutName,
    notes: rows.find((row) => row.workoutNotes !== null)?.workoutNotes ?? null,
    exercises: exercises.filter((exercise) => exercise.sets.length > 0 || exercise.notes !== null),
  };
}

function workoutEnd(startedAt: string, durationSeconds: number | null): string | null {
  if (durationSeconds === null) return null;
  const end = new Date(Date.parse(startedAt) + durationSeconds * MILLISECONDS_PER_SECOND);
  // Duration is informational: an unrepresentable end must not prevent preserving performed sets.
  return Number.isFinite(end.getTime()) ? end.toISOString() : null;
}

/** The kind a "Set Order" value stands for: W warm-up, D drop, F failure, anything else working. */
function setKindOf(order: string): SetKind {
  switch (order.toUpperCase()) {
    case 'W':
      return 'warmup';
    case 'D':
      return 'drop';
    case 'F':
      return 'failure';
    default:
      return 'working';
  }
}

function makeSet(
  row: StrongRow,
  order: string,
  position: number,
  columnUnit: WeightUnit,
  correction: SetCorrection | undefined,
): PlannedSet {
  return {
    line: row.line,
    position,
    kind: setKindOf(order),
    weightKilograms: correction?.weightKilograms ?? toKilograms(row.weightValue, columnUnit),
    entryUnit: inferEntryUnit(row.weightValue, columnUnit) ?? columnUnit,
    reps: correction?.reps ?? row.reps,
    rpe: row.rpe !== null && row.rpe >= RpeRange.min && row.rpe <= RpeRange.max ? row.rpe : null,
    durationSeconds: row.seconds,
    distanceMeters: row.distanceMeters,
    notes: row.notes,
    isCorrected: correction !== undefined,
  };
}

function makeOverviews(
  setRows: readonly SetRow[],
  verdicts: ReadonlyMap<string, UnitVerdict>,
  columnUnitOf: (exerciseName: string) => WeightUnit,
  overrides: ReadonlyMap<string, WeightUnit>,
): ExerciseOverview[] {
  const overviews: ExerciseOverview[] = [];
  for (const [name, rows] of groupBy(setRows, (row) => row.exerciseName)) {
    const verdict = verdicts.get(name);
    if (verdict === undefined) continue;
    const dates = rows.map((row) => row.startedAt).sort();
    overviews.push({
      name,
      columnUnit: columnUnitOf(name),
      verdict,
      isOverridden: overrides.has(name),
      setCount: rows.length,
      firstDate: dates[0] ?? '',
      lastDate: dates[dates.length - 1] ?? '',
    });
  }
  // Array.prototype.sort is stable, so equal counts stay in order of first appearance.
  return overviews.sort((a, b) => b.setCount - a.setCount);
}

function findSuspiciousSets(workouts: readonly PlannedWorkout[], confirmed: ReadonlySet<number>): SetFinding[] {
  // Corrected sets still serve as history for their neighbours; they just aren't reported.
  const observations: SetObservation[] = [];
  const corrected = new Set<number>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.isCorrected) corrected.add(set.line);
        observations.push({
          id: set.line,
          exerciseKey: exercise.name,
          sessionKey: workout.sourceKey,
          date: workout.startedAt,
          kind: set.kind,
          weightKilograms: set.weightKilograms,
          reps: set.reps,
        });
      }
    }
  }
  return findImplausibleSets(observations).filter(
    (finding) => !confirmed.has(finding.id) && !corrected.has(finding.id),
  );
}
