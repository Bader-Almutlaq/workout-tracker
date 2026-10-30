import styles from './MatchAllList.module.css';
import type { ProposedMerge } from './matchingPlan';

/** The pairs "Match all suggested" would merge, each as the Strong name then the library name. */
export function MatchAllList({ merges }: { readonly merges: readonly ProposedMerge[] }) {
  return (
    <ul className={styles.list}>
      {merges.map(({ source, target }) => (
        <li key={source.exercise.id} className={styles.pair}>
          <span className={styles.from}>{source.exercise.name}</span>
          <span className={styles.to}>{target.name}</span>
        </li>
      ))}
    </ul>
  );
}
