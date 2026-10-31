import type { TemplateSessionTotals } from '../../../core/queries/TemplateSessions';
import { dayWithYearText } from '../../format/dateText';
import { sessionDurationText } from './sessionDurationText';
import styles from './PlanPage.module.css';

/** Per-workout counts and known-duration means, including workouts that have no sessions. */
export function PlanWorkoutTable({ workouts }: { readonly workouts: readonly TemplateSessionTotals[] }) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption>Workouts in this plan</caption>
        <thead>
          <tr>
            <th scope="col">Workout</th>
            <th scope="col">Sessions</th>
            <th scope="col">Last done</th>
            <th scope="col">Avg time</th>
          </tr>
        </thead>
        <tbody>
          {workouts.map((workout) => (
            <tr key={workout.templateId}>
              <th scope="row">{workout.name}</th>
              <td>{workout.sessionCount}</td>
              <td>{workout.lastStartedAt === null ? 'Never' : dayWithYearText(workout.lastStartedAt)}</td>
              <td>
                {workout.averageDurationSeconds === null ? '—' : sessionDurationText(workout.averageDurationSeconds)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
