import type { RepMaxRow } from '../../../core/queries/RepMaxTable';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { dayWithYearText } from '../../format/dateText';
import { estimateText } from '../../format/estimateText';
import { weightText } from '../../format/weightText';
import styles from './ExercisePage.module.css';

/** Actual loads retain display precision; predictions use the shared estimate rounding in the exercise unit. */
export function ExerciseRepMaxTable({
  rows,
  unit,
}: {
  readonly rows: readonly RepMaxRow[];
  readonly unit: WeightUnit;
}) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption>Rep-max table · {unit}</caption>
        <thead>
          <tr>
            <th scope="col">Reps</th>
            <th scope="col">Best performance</th>
            <th scope="col">Predicted</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.reps}>
              <th scope="row">{row.reps}</th>
              <td>
                {row.best === null ? (
                  '—'
                ) : (
                  <>
                    {weightText(row.best.value, unit)} × {row.best.set.reps}
                    <span className={styles.date}>{dayWithYearText(row.best.date)}</span>
                  </>
                )}
              </td>
              <td>{row.predictedKilograms === null ? '—' : estimateText(row.predictedKilograms, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>
        Best performance: heaviest set with at least these reps. Predicted: best qualifying e1RM at maximal effort (RIR
        0), rounded for display. Estimates are less certain above 10 reps.
      </p>
    </div>
  );
}
