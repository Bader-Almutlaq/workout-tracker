import { makeImportOptions, type StrongImportOptions } from '../../../core/import/StrongImportOptions';
import type { StrongImportPlan } from '../../../core/import/StrongImportPlan';
import { database, useDatabaseQuery } from '../../data/database';
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
  const setExcluded = (items: readonly FindingItem[], excluded: boolean) => {
    const excludedLines = new Set(options.excludedLines);
    for (const item of items) {
      if (excluded) excludedLines.add(item.finding.id);
      else excludedLines.delete(item.finding.id);
    }
    review({ ...options, excludedLines });
  };
  const decisionCount = options.corrections.size + options.confirmedLines.size + options.excludedLines.size;
  const counts = useDatabaseQuery('strong-import-counts', () => database.strongImportWorkoutCounts(plan.workouts));
  return (
    <>
      <ImportTotalsSection plan={plan} />
      {counts.status === 'ready' && (
        <p className={styles.note}>
          {counts.value.alreadyImported} already imported · {counts.value.newWorkouts} new
        </p>
      )}
      {counts.status === 'failed' && <p className={styles.note}>{counts.message}</p>}
      <PoundExercisesSection plan={plan} options={options} review={review} />
      <section>
        <div className={styles.heading}>
          <h2>Check these sets ({plan.findings.length})</h2>
          {decisionCount > 0 && (
            <button className={styles.link} onClick={() => review(makeImportOptions())}>
              Reset {decisionCount} {decisionCount === 1 ? 'decision' : 'decisions'}
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
          <FindingGroupCard
            key={group.key}
            group={group}
            apply={apply}
            keep={keep}
            edit={edit}
            excludedLines={options.excludedLines}
            setExcluded={setExcluded}
          />
        ))}
      </section>
      <div>
        <button
          className={styles.primary}
          onClick={runImport}
          disabled={counts.status !== 'ready' || (counts.value.newWorkouts === 0 && plan.measurements.length === 0)}
        >
          {counts.status === 'ready' && counts.value.newWorkouts === 0 && plan.measurements.length === 0
            ? 'Nothing new to import'
            : counts.status === 'ready' && counts.value.newWorkouts === 0
              ? 'Import measurements'
              : `Import ${counts.status === 'ready' ? counts.value.newWorkouts.toLocaleString() : '…'} ${counts.status === 'ready' && counts.value.newWorkouts === 1 ? 'workout' : 'workouts'}`}
        </button>
        {plan.findings.length > 0 && <p className={styles.note}>Sets you haven't reviewed import as logged.</p>}
      </div>
    </>
  );
}
