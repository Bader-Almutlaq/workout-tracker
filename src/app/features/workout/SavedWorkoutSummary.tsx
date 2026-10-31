import { PersonalBestsSection } from './PersonalBestsSection';
import { WorkoutComparisonSection } from './WorkoutComparisonSection';
import type { ReactNode } from 'react';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { Section } from '../../design/components/Section';
import { durationText } from '../../format/dateText';
import { countWorkoutSets } from '../../../core/queries/WorkoutHistory';
import { setCountsText } from '../history/setCountsText';
import { volumeText } from '../../format/weightText';
import { SaveAsTemplate } from '../templates/SaveAsTemplate';
import { BackupReminderLine } from './BackupReminderLine';
import { SummaryStat } from './SummaryStat';
import styles from './SavedWorkoutSummary.module.css';

/** The totals and exercises of a workout that was just finished. `done` is the button that leaves the screen. */
export function SavedWorkoutSummary({ workoutId, done }: { readonly workoutId: number; readonly done: ReactNode }) {
  const summary = useDatabaseQuery(`workout-summary-${workoutId}`, async () => ({
    totals: await database.finishedWorkoutSummary(workoutId),
    detail: await database.workoutDetail(workoutId),
    bests: await database.personalBestsForWorkout(workoutId),
    comparison: await database.workoutComparison(workoutId),
  }));

  if (summary.status !== 'ready' || summary.value.totals === null || summary.value.detail === undefined) {
    const message = summary.status === 'failed' ? summary.message : 'Loading…';
    return (
      <Screen title="Workout">
        <EmptyState message={message} />
        {summary.status === 'loading' ? null : done}
      </Screen>
    );
  }

  const { totals, detail } = summary.value;
  return (
    <Screen title={totals.name}>
      <div className={styles.stats}>
        <SummaryStat label="Duration" value={durationText(totals.startedAt, totals.endedAt) ?? '—'} />
        <SummaryStat label="Sets" value={setCountsText(totals.setCount, totals.warmupCount ?? 0)} />
        <SummaryStat label="Volume load" value={volumeText(totals.volumeKilograms)} />
      </div>
      <WorkoutComparisonSection comparison={summary.value.comparison} />
      <PersonalBestsSection bests={summary.value.bests} />
      <Section label="Exercises">
        {detail.entries.map(({ entry, exercise, sets }) => (
          <div key={entry.id} className={styles.line}>
            <span className={styles.name}>{exercise.name}</span>
            <span className={styles.count}>
              {setCountsText(countWorkoutSets(sets).setCount, countWorkoutSets(sets).warmupCount)}
            </span>
          </div>
        ))}
      </Section>
      <BackupReminderLine />
      <SaveAsTemplate workoutId={workoutId} workoutName={totals.name} templateId={detail.workout.templateId} />
      {done}
    </Screen>
  );
}
