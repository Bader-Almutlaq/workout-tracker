import type { WorkoutComparison } from '../../../core/queries/WorkoutComparison';
import { Section } from '../../design/components/Section';
import { durationText } from '../../format/dateText';
import { comparisonVolumeText, topSetText } from '../../format/workoutComparisonText';
import { estimateText } from '../../format/estimateText';
import styles from './SavedWorkoutSummary.module.css';

/** Descriptive totals, top sets and exercise changes versus the previous matching workout. */
export function WorkoutComparisonSection({ comparison }: { readonly comparison: WorkoutComparison | null }) {
  if (comparison === null) return null;
  const before = durationText(comparison.previous.workout.startedAt, comparison.previous.workout.endedAt) ?? '—';
  const now = durationText(comparison.current.workout.startedAt, comparison.current.workout.endedAt) ?? '—';
  return (
    <Section label="Compared with last time">
      <div className={styles.line}>
        Duration {before} → {now}
      </div>
      <div className={styles.line}>
        Working sets {comparison.previousSetCount} → {comparison.currentSetCount}
      </div>
      <div className={styles.line}>{comparisonVolumeText(comparison.currentVolume, comparison.previousVolume)}</div>
      {comparison.exercises.map(({ exercise, previous, current, previousEstimate, currentEstimate }) => (
        <div key={exercise.id}>
          {previous !== null && current !== null && (
            <div className={styles.line}>{topSetText(exercise.name, previous, current, exercise.defaultEntryUnit)}</div>
          )}
          {previousEstimate !== null && currentEstimate !== null && (
            <div className={styles.line}>
              e1RM · {estimateText(previousEstimate, exercise.defaultEntryUnit)} →{' '}
              {estimateText(currentEstimate, exercise.defaultEntryUnit)}
            </div>
          )}
        </div>
      ))}
      {comparison.added.map((name) => (
        <div className={styles.line} key={name}>
          New today · {name}
        </div>
      ))}
      {comparison.removed.map((name) => (
        <div className={styles.line} key={name}>
          Not done today · {name}
        </div>
      ))}
    </Section>
  );
}
