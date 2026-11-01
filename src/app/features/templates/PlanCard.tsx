import { ChevronRight } from 'lucide-react';
import { Chip } from '../../design/components/Chip';
import { workoutPath } from './templatePaths';
import { useWorkoutDrag } from '../../design/drag/WorkoutDrag';
import { Link } from 'react-router';
import type { TemplateFolderSummary } from '../../../core/queries/TemplateCatalog';
import { lastDoneText } from './lastDoneText';
import { PlanMenu } from './PlanMenu';
import { planPath } from './templatePaths';
import type { TemplateListActions } from './TemplateListActions';
import styles from './PlanCard.module.css';

/** A plan as a navigation card, with its workouts and latest finished session; never a collapsible folder. */
export function PlanCard({
  folder,
  index,
  count,
  now,
  actions,
  isActive,
}: {
  readonly folder: TemplateFolderSummary;
  readonly index: number;
  readonly count: number;
  readonly now: Date;
  readonly actions: TemplateListActions;
  readonly isActive: boolean;
}) {
  const drag = useWorkoutDrag();
  const today = folder.templates.find((template) => template.weekday === (now.getDay() || 7));
  return (
    <article
      className={`${styles.card} ${drag?.state?.target === folder.id ? styles.target : ''}`}
      data-plan-id={folder.id}
      data-plan-name={folder.name}
    >
      <Link className={styles.main} to={planPath(folder.id)}>
        <div className={styles.heading}>
          <h2>{folder.name}</h2>
          {isActive && <Chip tone="accent">Active</Chip>}
        </div>
        <span>
          {folder.templates.length} {folder.templates.length === 1 ? 'workout' : 'workouts'}
        </span>
        {folder.templates.length === 0 ? (
          <p>Add your first workout</p>
        ) : (
          <div className={styles.workouts}>
            {folder.templates.map((template) => (
              <Chip key={template.id} tone="neutral">
                {template.name}
              </Chip>
            ))}
          </div>
        )}
        <span>{lastDoneText(folder.lastStartedAt, now)?.replace('Last done ', 'Last: ') ?? 'Last: never'}</span>
      </Link>
      {isActive && today !== undefined && (
        <Link className={styles.today} to={workoutPath(today.id)}>
          Today: {today.name}
          <ChevronRight size={18} aria-hidden />
        </Link>
      )}
      <div className={styles.menu}>
        <PlanMenu folder={folder} index={index} count={count} actions={actions} />
      </div>
    </article>
  );
}
