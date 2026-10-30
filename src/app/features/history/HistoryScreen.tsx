import { groupWorkoutsByMonth } from '../../../core/queries/WorkoutMonthGroups';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { LinkRow } from '../../design/components/LinkRow';
import { Screen } from '../../design/components/Screen';
import { Section } from '../../design/components/Section';
import { dayText, durationText, monthLabel } from '../../format/dateText';
import { setCountText } from '../../format/setText';
import { volumeText } from '../../format/weightText';
import styles from './HistoryScreen.module.css';

/** Every finished workout, newest first, grouped by month. Tapping one opens `WorkoutDetailScreen`. */
export function HistoryScreen() {
  const history = useDatabaseQuery('history-summaries', async () =>
    groupWorkoutsByMonth(await database.historySummaries()),
  );

  return (
    <Screen title="History">
      {history.status === 'loading' && <EmptyState message="Loading…" />}
      {history.status === 'failed' && <EmptyState message={history.message} />}
      {history.status === 'ready' && history.value.length === 0 && (
        <EmptyState message="Import your Strong history from Settings." />
      )}
      {history.status === 'ready' &&
        history.value.map((group) => (
          <Section key={`${group.year}-${group.month}`} label={monthLabel(group.year, group.month)}>
            {group.workouts.map((workout) => (
              <LinkRow key={workout.id} to={`/history/${workout.id}`}>
                <div className={styles.row}>
                  <div className={styles.main}>
                    <span className={styles.name}>{workout.name}</span>
                    <span className={styles.meta}>
                      {[dayText(workout.startedAt), durationText(workout.startedAt, workout.endedAt)]
                        .filter((part) => part !== undefined)
                        .join(' · ')}
                    </span>
                  </div>
                  <div className={styles.totals}>
                    <span>{setCountText(workout.setCount)}</span>
                    <span>{volumeText(workout.volumeKilograms)}</span>
                  </div>
                </div>
              </LinkRow>
            ))}
          </Section>
        ))}
    </Screen>
  );
}
