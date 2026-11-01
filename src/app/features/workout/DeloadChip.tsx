import { DeloadPlan } from '../../../core/logging/DeloadPlan';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import styles from './DeloadChip.module.css';

/** Stored-stage label; live entries open settings and History remains noninteractive. */
export function DeloadChip({
  entry,
  onOpen,
}: {
  readonly entry?: LiveWorkoutEntry;
  readonly onOpen?: (() => void) | undefined;
}) {
  const mode = entry?.entry.deloadMode ?? 'load';
  const stage = entry?.entry.deloadStage;
  const count = entry?.sets.filter((set) => set.kind !== 'warmup').length ?? 0;
  const percent = entry?.entry.deloadSetPercent ?? null;
  const total = percent === null ? count : Math.round(count / (1 - percent / 100));
  const parts = [`Deload${stage === 2 ? ' build-back' : ''}`];
  const reduction =
    entry === undefined || stage === null || stage === undefined
      ? 0
      : DeloadPlan.reductionPercent(entry.exercise, stage, {
          mode,
          loadPercent: entry.entry.deloadLoadPercent ?? null,
          setPercent: percent,
        });
  if (mode !== 'sets' && reduction > 0) parts.push(`−${reduction}%`);
  if (stage !== 2 && mode !== 'load') parts.push(`${count} of ${total} ${total === 1 ? 'set' : 'sets'}`);
  const label = parts.join(' · ');
  return (
    <span className={styles.chip}>
      {onOpen === undefined ? (
        label
      ) : (
        <button type="button" className={styles.label} onClick={onOpen}>
          {label}
        </button>
      )}
    </span>
  );
}
