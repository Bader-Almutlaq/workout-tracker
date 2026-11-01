import { useState } from 'react';
import { Link } from 'react-router';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import { isMainMuscle } from '../../../core/library/MuscleProminence';
import { MuscleVolumeLimits } from '../../../core/analytics/MuscleVolume';
import type { MuscleDashboardItem } from '../../../core/queries/MuscleDashboard';
import type { AnalyticsPeriod } from './analyticsPeriod';
import styles from './Analytics.module.css';

/** Fractional sets, primary-lift changes and direct effort, ordered by sets. */
export function MuscleDashboardTable({
  muscles,
  period,
}: {
  readonly muscles: readonly MuscleDashboardItem[];
  readonly period: AnalyticsPeriod;
}) {
  const [smaller, setSmaller] = useState(false);
  const rows = [...muscles].sort((a, b) => b.setsPerWeek - a.setsPerWeek);
  const maximum = Math.max(1, ...rows.map((item) => item.setsPerWeek));
  return (
    <section>
      <h2>Muscles</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Muscle</th>
            <th>Sets / wk</th>
            <th>Strength</th>
            <th>Effort</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((item) => smaller || isMainMuscle(item.muscle))
            .map((item) => (
              <tr key={item.muscle} className={item.setsPerWeek < MuscleVolumeLimits.first ? styles.muted : undefined}>
                <th>
                  <Link to={`/analytics/muscles/${item.muscle}?period=${period}`}>
                    {MUSCLE_DISPLAY_NAMES[item.muscle]}
                  </Link>
                </th>
                <td>
                  {item.setsPerWeek.toFixed(1)}
                  <span className={styles.miniTrack}>
                    <span style={{ width: `${(item.setsPerWeek / maximum) * 100}%` }} />
                  </span>
                </td>
                <td>
                  {item.strengthChangePercent === null
                    ? '—'
                    : `${item.strengthChangePercent >= 0 ? '+' : ''}${item.strengthChangePercent.toFixed(1)}%`}
                </td>
                <td>{item.averageRir === null ? '—' : `${item.averageRir.toFixed(1)} RIR`}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <button type="button" onClick={() => setSmaller(!smaller)}>
        {smaller ? 'Hide smaller muscles' : 'Show smaller muscles'}
      </button>
    </section>
  );
}
