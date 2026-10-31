import { ActionMenu } from '../../design/components/ActionMenu';
import styles from './DeloadChip.module.css';

/** Yellow stored-stage label; live entries offer End deload, History keeps a noninteractive tag. */
export function DeloadChip({
  reductionPercent,
  onEnd,
}: {
  readonly reductionPercent?: number;
  readonly onEnd?: (() => void) | undefined;
}) {
  const label = reductionPercent === undefined || reductionPercent === 0 ? 'Deload' : `Deload · −${reductionPercent}%`;
  return (
    <span className={styles.chip}>
      {onEnd === undefined ? (
        label
      ) : (
        <ActionMenu label={label} items={[{ label: 'End deload', isDeload: true, onSelect: onEnd }]}>
          <span className={styles.label}>{label}</span>
        </ActionMenu>
      )}
    </span>
  );
}
