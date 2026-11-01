import type { RpeChartRow } from '../../../core/analytics/RpeChart';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { weightNumberText } from '../../format/weightText';
import { rpeNumberText } from '../../format/setText';
import styles from './ExerciseRpeTable.module.css';

/** Fractional chart percentages become percent labels; report, RIR reference-chart paragraph. */
const display = Object.freeze({ percent: 100 });

/** Scrollable RPE grid with a sticky row header; muted E > 12 cells remain legible and available to assistive technology. */
export function ExerciseRpeTable({
  rows,
  mode,
  unit,
}: {
  readonly rows: readonly RpeChartRow[];
  readonly mode: 'percent' | 'weight';
  readonly unit: WeightUnit;
}) {
  return (
    <div className={styles.scroll} tabIndex={0} role="region" aria-label="RPE chart, scroll for reps 1–15">
      <table className={styles.table}>
        <caption>RPE × reps · {mode === 'percent' ? '% of 1RM' : unit}</caption>
        <thead>
          <tr>
            <th scope="col">RPE</th>
            {rows[0]?.cells.map((cell) => (
              <th key={cell.reps} scope="col">
                {cell.reps}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rpe}>
              <th scope="row">{rpeNumberText(row.rpe)}</th>
              {row.cells.map((cell) => (
                <td
                  key={cell.reps}
                  className={cell.isMuted ? styles.muted : undefined}
                  aria-label={cell.isMuted ? 'Lower reliability: effective reps above 12' : undefined}
                >
                  {mode === 'percent'
                    ? `${rpeNumberText(cell.percent * display.percent)}%`
                    : cell.weightKilograms === null
                      ? '—'
                      : weightNumberText(cell.weightKilograms, unit)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
