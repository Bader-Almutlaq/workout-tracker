import { database, useDatabaseQuery } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { MatchingWorkspace } from './MatchingWorkspace';

/**
 * Settings → Match Strong exercises. Names imported from Strong that aren't in the library have no
 * muscles, so analytics can't count their sets. Here each one is matched to a library exercise
 * (its history moves over) or kept as the owner's own with muscles of its own.
 */
export function StrongMatchingScreen() {
  const unmatched = useDatabaseQuery('unmatched-imports', () => database.unmatchedImports());
  const entries = useDatabaseQuery('exercise-entries', () => database.exerciseEntries());
  const back = <BackLink to="/settings" label="Settings" />;

  return (
    <Screen title="Match exercises" leading={back}>
      {(unmatched.status === 'loading' || entries.status === 'loading') && <EmptyState message="Loading…" />}
      {unmatched.status === 'failed' && <EmptyState message={unmatched.message} />}
      {entries.status === 'failed' && <EmptyState message={entries.message} />}
      {unmatched.status === 'ready' && entries.status === 'ready' && (
        <MatchingWorkspace unmatched={unmatched.value} entries={entries.value} />
      )}
    </Screen>
  );
}
