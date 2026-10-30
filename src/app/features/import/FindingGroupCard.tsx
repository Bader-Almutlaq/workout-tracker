import { weightText } from '../../format/weightText';
import { dateText, explanation, suggestionText, type FindingGroup, type FindingItem } from './importFindingText';
import styles from './StrongImportScreen.module.css';
/** Displays decisions for suspicious sets in one exercise and workout. */
export function FindingGroupCard({
  group,
  apply,
  keep,
  edit,
}: {
  group: FindingGroup;
  apply: (items: readonly FindingItem[]) => void;
  keep: (items: readonly FindingItem[]) => void;
  edit: (item: FindingItem) => void;
}) {
  return (
    <div className={styles.card} key={group.key}>
      <div className={styles.cardHeader}>
        <strong>{group.name}</strong>
        <p className={styles.note}>{dateText(group.date)}</p>
      </div>
      {group.items.map((item) => (
        <div className={styles.finding} key={`${item.finding.id}-${item.finding.issue}`}>
          <div className={styles.findingText}>
            <span>
              {weightText(item.context.set.weightKilograms, item.context.set.entryUnit)} × {item.context.set.reps}
            </span>
            <span>⚠ {explanation(item)}</span>
          </div>
          <div className={styles.buttons}>
            {item.finding.suggestion !== null && (
              <button onClick={() => apply([item])}>Use {suggestionText(item)}</button>
            )}
            <button onClick={() => keep([item])}>Keep</button>
            <button onClick={() => edit(item)}>Edit…</button>
          </div>
        </div>
      ))}
      {group.items.length > 1 && (
        <div className={styles.buttons}>
          <button onClick={() => keep(group.items)}>Keep all as logged</button>
          {group.items.some((item) => item.finding.suggestion !== null) && (
            <button onClick={() => apply(group.items)}>Use suggestions</button>
          )}
        </div>
      )}
    </div>
  );
}
