import { line } from 'd3-shape';
import { Link } from 'react-router';
import { LiftTrendPolicy, type LiftTrend } from '../../../core/queries/LiftTrends';
import { KILOGRAMS_PER_POUND } from '../../../core/units/WeightUnit';
import styles from './Analytics.module.css';

/** Ranked lift trends, in each exercise's display unit, linking to its Charts tab. */
export function LiftTrendList({ lifts }: { readonly lifts: readonly LiftTrend[] }) {
  if (lifts.length === 0) return <p>Log at least 2 sessions of a lift in this period to see its trend.</p>;
  return (
    <div>
      {lifts.map((lift) => {
        const min = Math.min(...lift.points);
        const span = Math.max(...lift.points) - min || 1;
        const path =
          line<number>()
            .x((_, index) => (index * 100) / Math.max(1, lift.points.length - 1))
            .y((value) => 28 - ((value - min) / span) * 26)(lift.points) ?? '';
        const value = lift.unit === 'lb' ? lift.latest / KILOGRAMS_PER_POUND : lift.latest;
        return (
          <Link className={styles.lift} key={lift.id} to={`/exercises/${lift.id}?tab=charts`}>
            <span>
              {lift.name}
              {lift.mixedMachines && <small>mixed machines</small>}
              {lift.weeksSinceBest !== undefined && lift.weeksSinceBest >= LiftTrendPolicy.staleWeeks && (
                <small>no new best in 6 wk</small>
              )}
            </span>
            <svg viewBox="0 0 100 30" aria-hidden="true">
              <path d={path} fill="none" stroke="currentColor" />
              {lift.points.length > 0 && (
                <circle
                  cx={lift.points.length === 1 ? 0 : 100}
                  cy={28 - (((lift.points.at(-1) ?? min) - min) / span) * 26}
                  r="2.5"
                  fill="currentColor"
                />
              )}
            </svg>
            <span>
              {value.toFixed(1)} {lift.unit}
              <small
                className={lift.changePercent > 0 ? styles.good : lift.changePercent < 0 ? styles.bad : styles.neutral}
              >
                {lift.changePercent >= 0 ? '+' : ''}
                {lift.changePercent.toFixed(1)}%
              </small>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
