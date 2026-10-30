import { MuscleVolumeLimits, muscleVolumeZone, type MuscleVolume } from '../../../core/analytics/MuscleVolume';
import type { WeeklyMuscleVolume } from '../../../core/queries/WeeklyMuscleVolume';

/** The selected calendar period. The average includes this week and the preceding three weeks. */
export type WeekChoice = 'this' | 'last' | 'average';

/** Heuristic: twelve calendar weeks provide the requested history, and four form the average. */
export const VolumePeriods = Object.freeze({ historyWeeks: 12, averageWeeks: 4, daysPerWeek: 7, zoneTail: 4 });

/** Inclusive local dates covering the current week and the preceding eleven weeks. */
export function historyRange(now: Date): { from: Date; to: Date } {
  const to = new Date(now);
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  from.setDate(from.getDate() - (VolumePeriods.historyWeeks - 1) * VolumePeriods.daysPerWeek);
  return { from, to };
}

/** Selects a week or averages four zero-filled calendar weeks, preserving weighted segments. */
export function chooseVolume(weeks: readonly WeeklyMuscleVolume[], choice: WeekChoice): readonly MuscleVolume[] {
  const selected =
    choice === 'last' ? weeks.slice(-2, -1) : weeks.slice(choice === 'average' ? -VolumePeriods.averageWeeks : -1);
  const first = selected[0];
  if (first === undefined) return [];
  if (choice !== 'average') return first.muscles;
  return first.muscles.map((muscle) => {
    const directSets =
      selected.reduce(
        (sum, week) => sum + (week.muscles.find((item) => item.muscle === muscle.muscle)?.directSets ?? 0),
        0,
      ) / VolumePeriods.averageWeeks;
    const indirectSets =
      selected.reduce(
        (sum, week) => sum + (week.muscles.find((item) => item.muscle === muscle.muscle)?.indirectSets ?? 0),
        0,
      ) / VolumePeriods.averageWeeks;
    const totalSets = directSets + indirectSets;
    return {
      ...muscle,
      directSets,
      indirectSets,
      totalSets,
      zone: muscleVolumeZone(totalSets),
      sessionsAboveSoftLimit: [],
    };
  });
}

/** Sorts trained muscles by descending volume, preserving taxonomy order for ties. */
export function sortedVolume(muscles: readonly MuscleVolume[]): MuscleVolume[] {
  return [...muscles].sort((left, right) => right.totalSets - left.totalSets);
}

/** Heuristic: the scale leaves four sets beyond 30 so every zone has a visible label, and extends to the largest total. */
export function volumeScale(muscles: readonly MuscleVolume[]): number {
  return Math.max(MuscleVolumeLimits.fourth + VolumePeriods.zoneTail, ...muscles.map((muscle) => muscle.totalSets));
}

/** Band start and width as percentages of the shared chart scale. */
export function zonePositions(scale: number): readonly { label: string; start: number; width: number }[] {
  const boundaries = [
    0,
    MuscleVolumeLimits.first,
    MuscleVolumeLimits.second,
    MuscleVolumeLimits.third,
    MuscleVolumeLimits.fourth,
    scale,
  ];
  const labels = ['<4', '4–10', '10–20', '20–30', '>30'];
  return labels
    .map((label, index) => {
      const start = boundaries[index] ?? 0;
      const end = boundaries[index + 1] ?? start;
      return { label, start: (start / scale) * 100, width: ((end - start) / scale) * 100 };
    })
    .filter((zone) => zone.width > 0);
}
