import { DeloadChip } from './DeloadChip';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { progressionText } from './progressionText';
import { clockText } from '../../format/clockText';
import styles from './ExerciseCard.module.css';

/** Only existing metadata appears; unset rest and notes leave no blank line. */
export function ExerciseInfoLine({
  entry,
  onEndDeload,
}: {
  readonly entry: LiveWorkoutEntry;
  readonly onEndDeload?: (() => void) | undefined;
}) {
  const rest = entry.exercise.restTargetSeconds;
  const note = entry.entry.notes;
  const progression = progressionText(entry);
  if (rest === null && !note && progression === undefined && (entry.entry.deloadStage ?? null) === null) return null;
  return (
    <div className={styles.info}>
      {(entry.entry.deloadStage ?? null) !== null && (
        <DeloadChip
          {...(entry.deload === undefined ? {} : { reductionPercent: entry.deload.reductionPercent })}
          onEnd={onEndDeload}
        />
      )}
      {(entry.entry.deloadStage ?? null) === null && progression !== undefined && <span>{progression}</span>}
      {rest !== null && <span>Rest {clockText(rest)}</span>}
      {note && <span className={styles.note}>{note}</span>}
    </div>
  );
}
