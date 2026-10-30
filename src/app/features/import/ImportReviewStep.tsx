import { makeImportOptions, type StrongImportOptions } from '../../../core/import/StrongImportOptions';
import type { StrongImportPlan } from '../../../core/import/StrongImportPlan';
import { FindingGroupCard } from './FindingGroupCard';
import { groupFindings, type FindingItem } from './importFindingText';
import { ImportTotalsSection } from './ImportTotalsSection';
import { PoundExercisesSection } from './PoundExercisesSection';
import styles from './StrongImportScreen.module.css';
/** Shows import totals, unit choices and suspicious-set review. */
export function ImportReviewStep({
  plan,
  options,
  review,
  apply,
  keep,
  edit,
  runImport,
}: {
  plan: StrongImportPlan;
  options: StrongImportOptions;
  review: (options: StrongImportOptions) => void;
  apply: (items: readonly FindingItem[]) => void;
  keep: (items: readonly FindingItem[]) => void;
  edit: (item: FindingItem) => void;
  runImport: () => void;
}) {
  const groups = groupFindings(plan);
  return (
    <>
      <ImportTotalsSection plan={plan} />
      <PoundExercisesSection plan={plan} options={options} review={review} />
      <section>
        <div className={styles.heading}>
          <h2>Check these sets ({plan.findings.length})</h2>
          {options.corrections.size + options.confirmedLines.size > 0 && (
            <button className={styles.link} onClick={() => review(makeImportOptions())}>
              Reset {options.corrections.size + options.confirmedLines.size} decisions
            </button>
          )}
        </div>
        {groups.length === 0 ? (
          <p className={styles.description}>Nothing looks like a typo.</p>
        ) : (
          <p className={styles.note}>
            These differ a lot from the same exercise in nearby sessions: maybe a missed digit, an extra zero or the
            wrong unit.
          </p>
        )}
        {groups.map((group) => (
          <FindingGroupCard key={group.key} group={group} apply={apply} keep={keep} edit={edit} />
        ))}
      </section>
      <div>
        <button className={styles.primary} onClick={runImport}>
          Import {plan.totals.workouts.toLocaleString()} workouts
        </button>
        {plan.findings.length > 0 && <p className={styles.note}>Sets you haven't reviewed import as logged.</p>}
      </div>
    </>
  );
}
