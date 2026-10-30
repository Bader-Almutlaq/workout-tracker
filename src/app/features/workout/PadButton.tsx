import type { ReactNode } from 'react';
import styles from './PadButton.module.css';

/** How a key on the number pad is drawn. `primary` is the one key that closes the pad. */
export type PadButtonTone = 'plain' | 'accent' | 'primary';

/** One large key of the number pad. */
export function PadButton({
  label,
  tone = 'plain',
  isDisabled = false,
  onPress,
  children,
}: {
  /** Read by screen readers; the visible content is `children`. */
  readonly label: string;
  readonly tone?: PadButtonTone;
  readonly isDisabled?: boolean;
  readonly onPress: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={styles.key}
      data-tone={tone}
      aria-label={label}
      disabled={isDisabled}
      onClick={onPress}
    >
      {children}
    </button>
  );
}
