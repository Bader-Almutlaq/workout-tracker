import type { IntensityMixResult } from '../../../core/queries/IntensityMix';
import type { WeeklyEffortPoint } from '../../../core/queries/WeeklyEffort';
import { RepRangeBars } from './RepRangeBars';
import { EffortHistogram } from './EffortHistogram';
import { DistributionBars } from './DistributionBars';
import { WeeklyCharts } from './WeeklyCharts';

/** Set distributions and aligned weekly hard-set and effort charts. */
export function EffortAndReps({
  mix,
  effort,
}: {
  readonly mix: IntensityMixResult;
  readonly effort: readonly WeeklyEffortPoint[];
}) {
  return (
    <section>
      <h2>Effort and reps</h2>
      <RepRangeBars buckets={mix.reps} />
      <EffortHistogram buckets={mix.effort} notLogged={mix.notLogged} />
      <DistributionBars title="% of 1RM" buckets={mix.percentOfMax} />
      <WeeklyCharts points={effort} />
    </section>
  );
}
