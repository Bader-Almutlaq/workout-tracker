import { groupWorkoutsByMonth } from '../../../core/queries/WorkoutMonthGroups';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { LinkRow } from '../../design/components/LinkRow';
import { Screen } from '../../design/components/Screen';
import { Section } from '../../design/components/Section';
import { dayText, durationText, monthLabel } from '../../format/dateText';
import { setCountsText } from './setCountsText';
import { volumeText } from '../../format/weightText';
import styles from './HistoryScreen.module.css';
import { HistoryCalendar } from './HistoryCalendar';
import calendarStyles from './HistoryCalendar.module.css';

/** Every finished workout, newest first, grouped by month. Tapping one opens `WorkoutDetailScreen`. */
export function HistoryScreen() {
  const history = useDatabaseQuery('history-summaries', async () => ({
    groups: groupWorkoutsByMonth(await database.historySummaries()),
    counts: await database.personalBestCounts(),
  }));

  return (
    <Screen title="History">
      <HistoryCalendar />
      {history.status === 'loading' && <EmptyState message="Loading…" />}
      {history.status === 'failed' && <EmptyState message={history.message} />}
      {history.status === 'ready' && history.value.groups.length === 0 && (
        <EmptyState message="Import your Strong history from Settings." />
      )}
      {history.status === 'ready' &&
        history.value.groups.map((group) => (
          <Section key={`${group.year}-${group.month}`} label={monthLabel(group.year, group.month)}>
            {group.workouts.map((workout) => (
              <div key={workout.id} id={`history-workout-${workout.id}`} className={calendarStyles.historyAnchor}>
                <LinkRow to={`/history/${workout.id}`}>
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
                      <span>{setCountsText(workout.setCount, workout.warmupCount ?? 0)}</span>
                      <span>{volumeText(workout.volumeKilograms)}</span>
                      {(history.value.counts[workout.id] ?? 0) > 0 && (
                        <span>
                          {history.value.counts[workout.id]} {history.value.counts[workout.id] === 1 ? 'best' : 'bests'}
                        </span>
                      )}
                    </div>
                  </div>
                </LinkRow>
              </div>
            ))}
          </Section>
        ))}
    </Screen>
  );
}
