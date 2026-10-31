import type { TrainingSummaryResult } from '../../../core/queries/TrainingSummary';
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
  const duration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  };
  const number = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
  const tiles = [
    {
      label: 'Workouts / week',
      value: current.workoutsPerWeek,
      prior: previous?.workoutsPerWeek,
      text: number(current.workoutsPerWeek),
    },
    {
      label: 'Hard sets / week',
      value: current.hardSetsPerWeek,
      prior: previous?.hardSetsPerWeek,
      text: number(current.hardSetsPerWeek),
    },
    {
      label: 'Time / week',
      value: current.secondsPerWeek,
      prior: previous?.secondsPerWeek,
      text: duration(current.secondsPerWeek),
    },
    {
      label: 'Volume / week',
      value: current.volumePerWeek,
      prior: previous?.volumePerWeek,
      text: `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(current.volumePerWeek)} kg`,
    },
  ];
  return (
    <div className={styles.tiles}>
      {tiles.map((tile) => {
        const change =
          tile.prior === undefined || tile.prior === 0 ? null : Math.round((tile.value / tile.prior - 1) * 100);
        return (
          <div className={styles.tile} key={tile.label}>
            <span>{tile.label}</span>
            <strong>{tile.text}</strong>
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
