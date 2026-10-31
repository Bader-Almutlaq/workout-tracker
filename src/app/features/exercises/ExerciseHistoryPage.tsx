import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import { ExerciseHistoryPolicy } from '../../../core/queries/ExerciseSeries';
import { database, useDatabaseQuery } from '../../data/database';
import { Button } from '../../design/components/Button';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';
import { ExerciseSessionRow } from './ExerciseSessionRow';
import styles from './ExercisePage.module.css';

/** One worker-loaded page; remount on offset changes so stale rows never appear under a new page index. */
export function ExerciseHistoryPage({
  exerciseId,
  tracking,
  offset,
  onPrevious,
  onNext,
}: {
  readonly exerciseId: number;
  readonly tracking: ExerciseTracking;
  readonly offset: number;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}) {
  const query = useDatabaseQuery(`exercise-history-${exerciseId}-${offset}`, () =>
    database.exerciseHistory(exerciseId, offset),
  );
  if (query.status !== 'ready') return <ExerciseQueryMessage query={query} />;
  return (
    <>
      {query.value.length === 0 && <p>{offset === 0 ? 'No sessions for this exercise yet.' : 'No more sessions.'}</p>}
      {query.value.map((session) => (
        <ExerciseSessionRow key={session.workoutId} session={session} tracking={tracking} />
      ))}
      <div className={styles.pagination}>
        {offset > 0 && (
          <Button variant="quiet" onPress={onPrevious}>
            Newer sessions
          </Button>
        )}
        {query.value.length === ExerciseHistoryPolicy.pageSize && (
          <Button variant="quiet" onPress={onNext}>
            Older sessions
          </Button>
        )}
      </div>
    </>
  );
}
