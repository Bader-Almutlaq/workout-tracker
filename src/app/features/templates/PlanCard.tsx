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
}: {
  readonly folder: TemplateFolderSummary;
  readonly index: number;
  readonly count: number;
  readonly now: Date;
  readonly actions: TemplateListActions;
}) {
  return (
    <article className={styles.card}>
      <Link className={styles.main} to={planPath(folder.id)}>
        <h2>{folder.name}</h2>
        <span>
          {folder.templates.length} {folder.templates.length === 1 ? 'workout' : 'workouts'}
        </span>
        <p>
          {folder.templates.length === 0
            ? 'Add your first workout'
            : folder.templates.map((template) => template.name).join(' · ')}
        </p>
        <span>{lastDoneText(folder.lastStartedAt, now)?.replace('Last done ', 'Last: ') ?? 'Last: never'}</span>
      </Link>
      <div className={styles.menu}>
        <PlanMenu folder={folder} index={index} count={count} actions={actions} />
      </div>
    </article>
  );
}
