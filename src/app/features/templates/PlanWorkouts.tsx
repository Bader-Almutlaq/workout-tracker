import type { TemplateFolderSummary } from '../../../core/queries/TemplateCatalog';
import { LinkButton } from '../../design/components/LinkButton';
import { EmptyState } from '../../design/components/EmptyState';
import { PlanWorkoutCard } from './PlanWorkoutCard';
import cardStyles from './WorkoutPage.module.css';
import type { TemplateListActions } from './TemplateListActions';
import { newPlanWorkoutPath } from './templatePaths';
import styles from './PlanPage.module.css';

/** Ordered workout cards inside one plan, plus creation already assigned to that plan. */
export function PlanWorkouts({
  folder,
  actions,
}: {
  readonly folder: TemplateFolderSummary;
  readonly actions: TemplateListActions;
}) {
  return (
    <div className={styles.stack}>
      <LinkButton to={newPlanWorkoutPath(folder.id)}>+ Workout</LinkButton>
      {folder.templates.length === 0 && <EmptyState message="No workouts yet. Add a workout to this plan." />}
      <div className={cardStyles.grid}>
        {folder.templates.map((template) => (
          <PlanWorkoutCard key={template.id} template={template} actions={actions} />
        ))}
      </div>
    </div>
  );
}
