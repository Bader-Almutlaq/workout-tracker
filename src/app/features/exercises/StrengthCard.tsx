import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { log } from '../../../core/support/log';
import { displayValue } from '../../../core/units/Weight';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { TimeChart } from '../../design/charts/TimeChart';
import { strengthHeadlineText } from './strengthReadout';
import styles from './StrengthCard.module.css';

/** Strength headline and shared estimated-1RM history; display conversion happens before chart aggregation. */
export function StrengthCard({ exerciseId, unit }: { readonly exerciseId: number; readonly unit: WeightUnit }) {
  const query = useDatabaseQuery(`exercise-strength-${exerciseId}`, () => database.exerciseStrength(exerciseId));
  const navigate = useNavigate();
  const progress = useDatabaseQuery(`strength-chart-progress-${exerciseId}`, () =>
    database.exerciseProgress(exerciseId),
  );
  useEffect(() => {
    if (query.status === 'failed') log.ui.error('Could not load strength history', query.message);
    if (progress.status === 'failed') log.ui.error('Could not load strength chart', progress.message);
  }, [query, progress]);
  if (query.status === 'loading' || progress.status === 'loading')
    return <p className={styles.message}>Loading strength history…</p>;
  if (query.status === 'failed')
    return (
      <p className={styles.message} role="alert">
        {query.message}
      </p>
    );
  if (progress.status === 'failed')
    return (
      <p className={styles.message} role="alert">
        {progress.message}
      </p>
    );
  const series = query.value;
  return (
    <section className={styles.card}>
      {series.latest !== null && <p className={styles.value}>{strengthHeadlineText(series.latest, unit)}</p>}
      <TimeChart
        title="Estimated 1RM"
        unit={unit}
        trend
        aggregation="max"
        series={[
          {
            name: 'Estimated 1RM',
            points: (progress.status === 'ready' ? progress.value.sessions : []).map((session) => ({
              date: session.date,
              value:
                session.bestEstimatedOneRepMax === null ? null : displayValue(session.bestEstimatedOneRepMax, unit),
              deload: session.isDeload,
              sessionId: session.workoutId,
            })),
          },
        ]}
        formatValue={(value) => `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`}
        onOpenPoint={(point) => {
          if (point.sessionId !== undefined) void navigate(`/history/${point.sessionId}`);
        }}
      />
    </section>
  );
}
