import { roundToLoadable, type LoadProfile } from '../units/LoadableWeight';
import type { PersonalCurve } from './PersonalCurve';

/** Report, “RIR plugs in naturally”: RTS is one max-effort curve indexed by E = reps + RIR (1–20). */
export const RtsPercentages = Object.freeze([
  1, 0.955, 0.922, 0.892, 0.863, 0.837, 0.811, 0.786, 0.762, 0.739, 0.707, 0.68, 0.653, 0.626, 0.599, 0.572, 0.545,
  0.518, 0.491, 0.464,
]);

/** Owner's reference grid; report items 1–2 cap reliable E at 12. Half-RIR values interpolate neighbours. */
const policy = Object.freeze({
  maximumRpe: 10,
  minimumRpe: 5,
  rpeStep: 0.5,
  maximumReps: 15,
  reliableEffectiveReps: 12,
});

/** A grid cell with a fractional percentage and optional exact kg rounded to the equipment ladder. */
export interface RpeChartCell {
  readonly reps: number;
  readonly percent: number;
  readonly weightKilograms: number | null;
  readonly isMuted: boolean;
}

/** RPE rows descending from 10 to 5; columns are reps 1–15. */
export interface RpeChartRow {
  readonly rpe: number;
  readonly cells: readonly RpeChartCell[];
}

function grid(
  value: (effectiveReps: number) => { percent: number; weightKilograms: number | null },
): readonly RpeChartRow[] {
  const rows: RpeChartRow[] = [];
  for (let rpe = policy.maximumRpe; rpe >= policy.minimumRpe; rpe -= policy.rpeStep) {
    rows.push({
      rpe,
      cells: Array.from({ length: policy.maximumReps }, (_, index) => {
        const reps = index + 1;
        const effectiveReps = reps + policy.maximumRpe - rpe;
        return { reps, ...value(effectiveReps), isMuted: effectiveReps > policy.reliableEffectiveReps };
      }),
    });
  }
  return rows;
}

/** RTS guide, independent of lift; fractional E averages adjacent max-effort percentages (report, RIR paragraph). */
export function rtsRpeChart(): readonly RpeChartRow[] {
  return grid((effectiveReps) => {
    const lower = Math.floor(effectiveReps);
    const first = RtsPercentages[lower - 1] ?? 0;
    const next = RtsPercentages[lower] ?? first;
    return { percent: first + (next - first) * (effectiveReps - lower), weightKilograms: null };
  });
}

/** Lift grid: fraction = 1/(1+(E−1)/k), kg = e1RM*fraction rounded by LoadableWeight. Report items 2, 3, 5. Invalid/missing k or e1RM returns no grid. */
export function liftRpeChart(
  curve: PersonalCurve,
  estimatedOneRepMaxKilograms: number | null,
  profile: LoadProfile,
): readonly RpeChartRow[] {
  const k = curve.k;
  if (
    k === null ||
    !Number.isFinite(k) ||
    k <= 0 ||
    estimatedOneRepMaxKilograms === null ||
    !Number.isFinite(estimatedOneRepMaxKilograms) ||
    estimatedOneRepMaxKilograms <= 0
  )
    return [];
  return grid((effectiveReps) => {
    const percent = 1 / (1 + (effectiveReps - 1) / k);
    return { percent, weightKilograms: roundToLoadable(estimatedOneRepMaxKilograms * percent, profile, 'nearest') };
  });
}
