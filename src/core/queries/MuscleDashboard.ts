import { HardSetPolicy } from '../analytics/HardSets';
import type { Database } from '../db/Database';
import type { Muscle } from '../library/Muscle';
import { intensityMix } from './IntensityMix';
import { LiftTrends, medianLiftChange, type LiftTrend } from './LiftTrends';
import { muscleCoverage, type ExerciseShare } from './MuscleCoverage';
import { weeklyMuscleVolume } from './WeeklyMuscleVolume';
import { WeeklyEffort } from './WeeklyEffort';

/** Selected-period muscle summary, including direct logged effort and primary-lift strength. */
export interface MuscleDashboardItem {
  readonly muscle: Muscle;
  readonly setsPerWeek: number;
  readonly strengthChangePercent: number | null;
  readonly averageRir: number | null;
  readonly shares: readonly ExerciseShare[];
}

/** Inclusive local-date muscle summaries; fractional sets use the same window as strength and effort. */
export function MuscleDashboard(db: Database, from: Date, to: Date): MuscleDashboardItem[] {
  const coverage = muscleCoverage(db, from, to);
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  const lifts = LiftTrends(db, from, end);
  const primary = db.all<{ muscle: Muscle; exerciseId: number }>(
    "SELECT muscleId AS muscle, exerciseId FROM exerciseMuscle WHERE role = 'primary'",
  );
  return coverage.muscles
    .map((item) => {
      const ids = new Set(primary.filter((row) => row.muscle === item.muscle).map((row) => row.exerciseId));
      const effort = db.get<{ total: number | null; count: number }>(
        `
      SELECT SUM(? - s.rpe) AS total, COUNT(*) AS count FROM workout w
      JOIN workoutExercise we ON we.workoutId = w.id JOIN workoutSet s ON s.workoutExerciseId = we.id
      JOIN exerciseMuscle em ON em.exerciseId = we.exerciseId AND em.role = 'primary' AND em.muscleId = ?
      WHERE w.isInProgress = 0 AND s.isCompleted = 1 AND s.kind != 'warmup' AND s.rpe IS NOT NULL
        AND w.startedAt >= ? AND w.startedAt < ?
    `,
        [
          HardSetPolicy.maximumRpe,
          item.muscle,
          new Date(from.getFullYear(), from.getMonth(), from.getDate()).toISOString(),
          end.toISOString(),
        ],
      );
      return {
        muscle: item.muscle,
        setsPerWeek: item.setsPerWeek,
        strengthChangePercent: medianLiftChange(lifts.filter((lift) => ids.has(lift.id))),
        averageRir:
          effort === undefined || effort.count === 0 || effort.total === null ? null : effort.total / effort.count,
        shares: coverage.shares[item.muscle] ?? [],
      };
    })
    .sort((a, b) => b.setsPerWeek - a.setsPerWeek || a.muscle.localeCompare(b.muscle));
}

/** Detail combines selected muscle's weekly fractional sets, exercise shares, strength and distributions. */
export function MuscleDetail(db: Database, from: Date, to: Date, muscle: Muscle) {
  const summary = MuscleDashboard(db, from, to).find((item) => item.muscle === muscle);
  const ids = new Set(
    db
      .all<{ exerciseId: number }>("SELECT exerciseId FROM exerciseMuscle WHERE muscleId = ? AND role = 'primary'", [
        muscle,
      ])
      .map((row) => row.exerciseId),
  );
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  const strength: readonly LiftTrend[] = LiftTrends(db, from, end).filter((lift) => ids.has(lift.id));
  return {
    summary: summary ?? null,
    weekly: weeklyMuscleVolume(db, from, to, undefined, true).map((week) => ({
      weekStart: week.weekStart,
      muscle: week.muscles.find((item) => item.muscle === muscle) ?? null,
    })),
    strength,
    mix: intensityMix(db, from, to, muscle),
    effort: WeeklyEffort(db, from, to, muscle),
  };
}
