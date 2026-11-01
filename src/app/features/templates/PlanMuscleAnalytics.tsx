import { useState } from 'react';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import { isMainMuscle } from '../../../core/library/MuscleProminence';
import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { BottomSheet } from '../../design/components/BottomSheet';
import styles from './TemplateAnalytics.module.css';

type Report = ReturnType<typeof TemplateAnalytics>;
/** Done and planned fractional sets per week, with the exercises behind completed sets. */
export function PlanMuscleAnalytics({ report }: { readonly report: Report }) {
  const [smaller, setSmaller] = useState(false);
  const [selected, setSelected] = useState<Report['musclesDoneVsPlanned'][number] | null>(null);
  const rows = report.musclesDoneVsPlanned.filter(
    (row) => ((row.done !== null && row.done !== 0) || row.planned !== 0) && (smaller || isMainMuscle(row.muscle)),
  );
  const max = Math.max(1, ...rows.map((row) => Math.max(row.done ?? 0, row.planned)));
  const number = (value: number | null) =>
    value === null ? '—' : new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
  return (
    <section className={styles.chart}>
      <h2>Sets per muscle, per week</h2>
      <p>
        Done <span className={styles.legendTick} aria-hidden="true" /> Planned · last {report.weeksAvailable} full{' '}
        {report.weeksAvailable === 1 ? 'week' : 'weeks'}
      </p>
      <button type="button" onClick={() => setSmaller(!smaller)}>
        {smaller ? 'Hide smaller muscles' : 'Show smaller muscles'}
      </button>
      {rows.map((row) => (
        <button className={styles.muscle} type="button" key={row.muscle} onClick={() => setSelected(row)}>
          <span>{MUSCLE_DISPLAY_NAMES[row.muscle]}</span>
          <span>
            {number(row.done)} / {number(row.planned)}
          </span>
          <span className={styles.track}>
            <span className={styles.bar} style={{ width: `${((row.done ?? 0) / max) * 100}%` }} />
            <span className={styles.tick} style={{ left: `${(row.planned / max) * 100}%` }} />
          </span>
        </button>
      ))}
      {selected && (
        <BottomSheet title={MUSCLE_DISPLAY_NAMES[selected.muscle]} onClose={() => setSelected(null)}>
          <p>{number(selected.done)} sets per week</p>
          {selected.contributions.length === 0 ? (
            <p>No completed sets in this period.</p>
          ) : (
            selected.contributions.map((item) => (
              <p key={item.exerciseId}>
                {item.name} · {number(item.fractional)} sets
              </p>
            ))
          )}
          <button type="button" onClick={() => setSelected(null)}>
            Close
          </button>
        </BottomSheet>
      )}
    </section>
  );
}
