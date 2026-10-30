import type { PersonalBest } from '../../../core/queries/PersonalBests';
import { Section } from '../../design/components/Section';
import { personalBestText } from '../../format/workoutComparisonText';
import styles from './SavedWorkoutSummary.module.css';

/** Plain personal record lines; absent when no records were set. */
export function PersonalBestsSection({ bests }: { readonly bests: readonly PersonalBest[] }) {
  if (bests.length === 0) return null;
  return (
    <Section label="Personal bests">
      {bests.map((best, index) => (
        <div className={styles.line} key={`${best.exercise.id}-${best.kind}-${index}`}>
          {personalBestText(best)}
        </div>
      ))}
    </Section>
  );
}
