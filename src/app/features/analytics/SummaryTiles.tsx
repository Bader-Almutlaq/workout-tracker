import type { TrainingSummaryResult } from '../../../core/queries/TrainingSummary';
import { weeklyDurationText } from './weeklyDurationText';
import styles from './Analytics.module.css';

/** Weekly figures and percentage changes; zero baselines have no meaningful percentage. */
export function SummaryTiles({
  current,
  previous,
  weeks,
}: {
  readonly current: TrainingSummaryResult;
  readonly previous: TrainingSummaryResult | null;
  readonly weeks: number;
}) {
  const number = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
  const tiles = [
    {
      label: 'Workouts / week',
      value: current.workoutsPerWeek,
      prior: previous?.workoutsPerWeek,
      text: number(current.workoutsPerWeek),
    },
    {
      label: 'Typical length',
      value: current.typicalSessionSeconds,
      prior: previous?.typicalSessionSeconds,
      text: current.typicalSessionSeconds === null ? '—' : weeklyDurationText(current.typicalSessionSeconds),
    },
    {
      label: 'Hard sets / week',
      value: current.hardSetsPerWeek,
      prior: previous?.hardSetsPerWeek,
      text: number(current.hardSetsPerWeek),
    },
    {
      label: 'Average effort',
      value: current.averageRir,
      prior: previous?.averageRir,
      text: current.averageRir === null ? '—' : `${number(current.averageRir)} RIR`,
    },
  ];
  return (
    <div className={styles.tiles}>
      {tiles.map((tile) => {
        const change =
          tile.value === null || tile.prior === null || tile.prior === undefined || tile.prior === 0
            ? null
            : Math.round((tile.value / tile.prior - 1) * 100);
        return (
          <div className={styles.tile} key={tile.label}>
            <span>{tile.label}</span>
            <strong>{tile.text}</strong>
            {tile.label === 'Average effort' && current.averageRir !== null && (
              <small>RPE {number(10 - current.averageRir)}</small>
            )}
            {change !== null && (
              <small>
                {change > 0 ? '+' : ''}
                {change}% vs previous {weeks} weeks
              </small>
            )}
          </div>
        );
      })}
    </div>
  );
}
