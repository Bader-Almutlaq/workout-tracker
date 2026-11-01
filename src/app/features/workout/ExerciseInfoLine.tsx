import { DeloadChip } from './DeloadChip';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { progressionText } from './progressionText';
import { clockText } from '../../format/clockText';
import styles from './ExerciseCard.module.css';

/** Only existing metadata appears; unset rest and notes leave no blank line. */
export function ExerciseInfoLine({
  entry,
  onEndDeload,
  onMachine,
  onNote,
}: {
  readonly entry: LiveWorkoutEntry;
  readonly onMachine?: () => void;
  readonly onNote?: () => void;
  readonly onEndDeload?: (() => void) | undefined;
}) {
  const rest = entry.exercise.restTargetSeconds;
  const note = entry.entry.notes;
  const progression = progressionText(entry);
  const target = entry.plannedTargets?.find((set) => set.kind === 'working');
  const low = target?.targetRepsLow ?? null;
  const high = target?.targetRepsHigh ?? null;
  const reps = low === null ? high : high === null || low === high ? low : `${low}–${high}`;
  const range =
    reps === null
      ? undefined
      : `${reps} reps${target?.targetRpe === null || target?.targetRpe === undefined ? '' : ` @ RPE ${target.targetRpe}`}`;
  if (
    range === undefined &&
    rest === null &&
    !note &&
    progression === undefined &&
    (entry.entry.deloadStage ?? null) === null &&
    !entry.entry.machineBrand &&
    !entry.previousOtherMachine
  )
    return null;
  return (
    <>
      {(range !== undefined ||
        rest !== null ||
        progression !== undefined ||
        (entry.entry.deloadStage ?? null) !== null ||
        entry.entry.machineBrand ||
        entry.previousOtherMachine) && (
        <div className={styles.info}>
          {(range !== undefined || rest !== null) && (
            <span className={styles.targets}>
              {[range, rest === null ? undefined : `Rest ${clockText(rest)}`].filter(Boolean).join(' · ')}
            </span>
          )}
          {(entry.entry.deloadStage ?? null) !== null && <DeloadChip entry={entry} onOpen={onEndDeload} />}
          {(entry.entry.deloadStage ?? null) === null && progression !== undefined && <span>{progression}</span>}
          {entry.entry.machineBrand && (
            <button type="button" onClick={onMachine}>
              {entry.entry.machineBrand}
            </button>
          )}
          {entry.previousOtherMachine && <span>Previous: other machine</span>}
        </div>
      )}
      {note && (
        <button type="button" className={styles.note} onClick={onNote}>
          {note}
        </button>
      )}
    </>
  );
}
