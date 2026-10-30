import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { ExerciseBrowser } from './ExerciseBrowser';

/** The Exercises tab: search the library, filter by muscle or equipment, open an exercise or add your own. */
export function ExercisesScreen() {
  const entries = useDatabaseQuery('exercise-entries', () => database.exerciseEntries());

  return (
    <Screen title="Exercises">
      {entries.status === 'loading' && <EmptyState message="Loading…" />}
      {entries.status === 'failed' && <EmptyState message={entries.message} />}
      {entries.status === 'ready' && <ExerciseBrowser entries={entries.value} />}
    </Screen>
  );
}
