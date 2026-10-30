import type { Muscle } from '../../../core/library/Muscle';
import { Section } from '../../design/components/Section';
import { ToggleChip } from '../../design/components/ToggleChip';
import styles from './MusclePicker.module.css';
import { MUSCLE_GROUPS } from './muscleGroups';

/**
 * Pick any number of muscles, listed by body region. Muscles in `unavailable` (the primary ones,
 * when picking secondary muscles) are shown dimmed and can't be chosen.
 */
export function MusclePicker({
  label,
  footnote,
  selected,
  unavailable = [],
  onToggle,
}: {
  readonly label: string;
  readonly footnote?: string;
  readonly selected: readonly Muscle[];
  readonly unavailable?: readonly Muscle[];
  readonly onToggle: (muscle: Muscle) => void;
}) {
  return (
    <Section label={label} {...(footnote === undefined ? {} : { footnote })}>
      {MUSCLE_GROUPS.map((group) => (
        <div key={group.label} className={styles.group}>
          <span className={styles.region}>{group.label}</span>
          <div className={styles.chips}>
            {group.muscles.map(({ muscle, label: muscleLabel }) => (
              <ToggleChip
                key={muscle}
                isOn={selected.includes(muscle)}
                isDisabled={unavailable.includes(muscle)}
                onToggle={() => onToggle(muscle)}
              >
                {muscleLabel}
              </ToggleChip>
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}
