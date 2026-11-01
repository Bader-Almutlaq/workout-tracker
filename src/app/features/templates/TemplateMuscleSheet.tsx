import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import type { TemplateMuscleRow } from '../../../core/queries/TemplateMuscleSummary';
import { BottomSheet } from '../../design/components/BottomSheet';
import styles from './TemplateMuscleList.module.css';

/** Fractional set count with singular wording for exactly one. */
function setsText(count: number): string {
  return count === 1 ? '1 set' : `${count} sets`;
}

/** Exercise contributions to a saved workout or plan's muscle total. */
export function TemplateMuscleSheet({
  row,
  showWorkouts,
  onClose,
}: {
  readonly row: TemplateMuscleRow;
  readonly showWorkouts: boolean;
  readonly onClose: () => void;
}) {
  const parts = [row.direct > 0 && `${row.direct} direct`, row.indirect > 0 && `${row.indirect} indirect`]
    .filter(Boolean)
    .join(' + ');
  return (
    <BottomSheet title={MUSCLE_DISPLAY_NAMES[row.muscle]} onClose={onClose}>
      <p>
        {setsText(row.fractional)} — {parts}
      </p>
      {row.contributions.map((item) => (
        <div className={styles.contribution} key={item.exerciseId}>
          <div>
            <strong>{item.name}</strong>
            {showWorkouts && <div className={styles.detail}>{item.workouts.join(', ')}</div>}
          </div>
          <div className={styles.contributionCount}>
            <span>{setsText(item.fractional)}</span>
            <span className={styles.detail}>
              {[item.direct > 0 && `${item.direct} direct`, item.indirect > 0 && `${item.indirect} indirect`]
                .filter(Boolean)
                .join(' + ')}
            </span>
          </div>
        </div>
      ))}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </BottomSheet>
  );
}
