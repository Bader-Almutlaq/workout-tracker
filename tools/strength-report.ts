import { estimatedOneRepMax } from '../src/core/analytics/EstimatedOneRepMax';
import { PersonalCurvePolicy } from '../src/core/analytics/PersonalCurve';
import { strengthTrend } from '../src/core/analytics/StrengthTrend';
import { Database } from '../src/core/db/Database';
import { migrate } from '../src/core/db/migrations';
import { importStrongPlan } from '../src/core/import/StrongImporter';
import type { StrongImportPlan } from '../src/core/import/StrongImportPlan';
import { ExerciseLibrary } from '../src/core/library/ExerciseLibrary';
import { ExerciseLibrarySeeder } from '../src/core/library/ExerciseLibrarySeeder';
import { exerciseIdNamed } from '../src/core/library/ExerciseNameResolver';
import { ExerciseSeries, type ExerciseSeriesPoint } from '../src/core/queries/ExerciseSeries';

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

function source(point: ExerciseSeriesPoint | undefined): string {
  if (point === undefined) return 'no qualifying set';
  const { set } = point;
  const effort = set.rpe === null ? 'no RPE' : `RPE ${set.rpe}`;
  return `${point.date}: ${set.weightKilograms.toFixed(2)} kg × ${set.reps}, ${effort}${set.kind === 'failure' ? ', failure' : ''}`;
}

/** Imports a supplied plan into memory only and prints canonical strength estimates and their source sets; never reads or writes files. */
export async function printStrengthReport(plan: StrongImportPlan, name: string): Promise<void> {
  const db = await Database.openInMemory();
  try {
    const now = new Date();
    migrate(db, now);
    ExerciseLibrarySeeder.seed(db, ExerciseLibrary.bundled(), now);
    // A fresh disposable database has no owner data to snapshot.
    importStrongPlan(db, plan, now);
    const id = exerciseIdNamed(db, name);
    if (id === undefined) {
      print(`Strength: “${name}” not found.`);
      return;
    }
    const history = ExerciseSeries.read(db, id, now);
    const exercise = history.exercise;
    if (exercise === null) return;
    const curve = exercise.strengthCurve;
    const eligibility = { ...exercise, strengthCurve: { ...curve, k: PersonalCurvePolicy.minimumK } };
    const qualifying = history.sessions.flatMap((session) =>
      session.sets.filter((set) => estimatedOneRepMax(set, eligibility) !== null),
    );
    const known = qualifying.filter((set) => set.rpe !== null || set.kind === 'failure').length;
    const points = ExerciseSeries.estimatedOneRepMax(history);
    const deloads = new Set(
      history.sessions.filter((session) => session.deloadEntryIds.length > 0).map((session) => session.workoutId),
    );
    const normal = points.filter((point) => !deloads.has(point.workoutId));
    const trend = strengthTrend(
      normal.map((point) => ({
        date: point.date,
        e1rmKilograms: point.value,
        trendWeight: estimatedOneRepMax(point.set, exercise)?.trendWeight ?? 1,
      })),
      now,
    );
    const accepted = normal[trend.trend.findLastIndex((point) => !point.isHeld)];
    const best = points.reduce<ExerciseSeriesPoint | undefined>(
      (previous, point) => (previous === undefined || point.value > previous.value ? point : previous),
      undefined,
    );
    print('');
    print(`Strength: ${exercise.name}`);
    print(`Qualifying sets: ${known} known effort, ${qualifying.length - known} unknown effort`);
    print(`k_start: ${curve.kStart ?? 'unclassified'}`);
    print(`Fitted k: ${curve.isPersonal ? curve.k?.toFixed(4) : 'not personal'} (${curve.personalSets} fitting sets)`);
    print(`Current e1RM trend: ${trend.latest === null ? 'none' : `${trend.latest.toFixed(2)} kg`}`);
    print(`  Latest accepted source (trend smooths history): ${source(accepted)}`);
    print(`Best session e1RM: ${best === undefined ? 'none' : `${best.value.toFixed(2)} kg`}`);
    print(`  Source: ${source(best)}`);
  } finally {
    db.close();
  }
}
