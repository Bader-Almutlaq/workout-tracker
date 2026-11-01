import { useState } from 'react';
import type { LiftTrend } from '../../../core/queries/LiftTrends';
import { LiftTrendList } from './LiftTrendList';

/** Period-ranked strength changes, initially limited to eight lifts. */
export function StrengthSection({
  ranking,
  weeks,
}: {
  readonly ranking: { readonly lifts: readonly LiftTrend[]; readonly medianChangePercent: number | null };
  readonly weeks: number;
}) {
  const [all, setAll] = useState(false);
  const median = ranking.medianChangePercent;
  return (
    <section>
      <h2>Strength</h2>
      <p>
        {median === null
          ? 'Not enough lift history in this period.'
          : `Median change across ${ranking.lifts.length} lifts: ${median >= 0 ? '+' : ''}${median.toFixed(1)}% over ${weeks} weeks`}
      </p>
      <LiftTrendList lifts={all ? ranking.lifts : ranking.lifts.slice(0, 8)} />
      {ranking.lifts.length > 8 && (
        <button type="button" onClick={() => setAll(!all)}>
          {all ? 'Show less' : 'Show all'}
        </button>
      )}
    </section>
  );
}
