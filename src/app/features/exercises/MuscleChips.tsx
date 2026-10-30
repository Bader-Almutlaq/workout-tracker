import type { Muscle } from '../../../core/library/Muscle';
import styles from './MuscleChips.module.css';
import { MuscleLine } from './MuscleLine';

/** The muscles an exercise trains: primary ones in the accent color, secondary ones quieter. */
export function MuscleChips({
  primary,
  secondary,
}: {
  readonly primary: readonly Muscle[];
  readonly secondary: readonly Muscle[];
}) {
  return (
    <div className={styles.box}>
      <MuscleLine label="Primary" tone="accent" muscles={primary} />
      {secondary.length > 0 && <MuscleLine label="Secondary" tone="neutral" muscles={secondary} />}
    </div>
  );
}
