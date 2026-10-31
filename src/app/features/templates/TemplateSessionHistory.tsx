import { Link } from 'react-router';
import type { TemplateSession } from '../../../core/queries/TemplateSessions';
import { EmptyState } from '../../design/components/EmptyState';
import { dayAndTimeText } from '../../format/dateText';
import { volumeText } from '../../format/weightText';
import { sessionDurationText } from './sessionDurationText';
import styles from './PlanPage.module.css';

/** All sessions in the supplied scope; each opens the existing History entry. */
export function TemplateSessionHistory({ sessions }: { readonly sessions: readonly TemplateSession[] }) {
  if (sessions.length === 0) return <EmptyState message="No sessions yet. Start a workout to record one." />;
  return (
    <div className={styles.stack}>
      {sessions.map((session) => (
        <Link key={session.id} className={styles.session} to={`/history/${session.id}`}>
          <strong>{session.name}</strong>
          <span>{dayAndTimeText(session.startedAt)}</span>
          <span>
            {session.workingSetCount} working sets · {volumeText(session.volumeKilograms)} ·{' '}
            {sessionDurationText(session.durationSeconds)}
          </span>
        </Link>
      ))}
    </div>
  );
}
