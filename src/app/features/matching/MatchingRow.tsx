import { database, useDatabaseQuery } from '../../data/database';
import { LinkRow } from '../../design/components/LinkRow';
import styles from './MatchingRow.module.css';

/** The Settings row that opens the matching screen, with how many Strong exercises still need it. Hidden at zero. */
export function MatchingRow() {
  const unmatched = useDatabaseQuery('unmatched-imports', () => database.unmatchedImports());
  if (unmatched.status !== 'ready' || unmatched.value.length === 0) return null;
  return (
    <LinkRow to="/settings/matching">
      <div className={styles.row}>
        <span>Match Strong exercises</span>
        <span className={styles.count}>{unmatched.value.length.toLocaleString('en-US')}</span>
      </div>
    </LinkRow>
  );
}
