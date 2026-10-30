import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { Button } from '../../design/components/Button';
import { LinkButton } from '../../design/components/LinkButton';
import { usageText } from '../exercises/exerciseText';
import { editExercisePath } from '../exercises/returnPath';
import styles from './UnmatchedCard.module.css';
import type { UnmatchedWithSuggestions } from './matchingPlan';
import { SuggestionRow } from './SuggestionRow';

/** Where "Keep as my own" returns to after the owner has tagged the muscles. */
const MATCHING_PATH = '/settings/matching';

/**
 * One imported exercise: its name and usage, up to three suggested library exercises with a
 * "Match" button each, a way to search the library, and "Keep as my own".
 */
export function UnmatchedCard({
  item,
  onMatch,
  onSearch,
}: {
  readonly item: UnmatchedWithSuggestions;
  readonly onMatch: (target: ExerciseSearchEntry) => void;
  readonly onSearch: () => void;
}) {
  const { unmatched, suggestions } = item;
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.name}>{unmatched.exercise.name}</h2>
        <p className={styles.usage}>{usageText(unmatched.workoutCount, unmatched.setCount)}</p>
      </header>
      {suggestions.map((entry) => (
        <SuggestionRow key={entry.id} entry={entry} onMatch={() => onMatch(entry)} />
      ))}
      <div className={styles.actions}>
        <Button onPress={onSearch}>Search library…</Button>
        <LinkButton to={editExercisePath(unmatched.exercise.id, MATCHING_PATH)}>Keep as my own</LinkButton>
      </div>
    </section>
  );
}
