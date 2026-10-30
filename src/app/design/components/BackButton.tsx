import { ChevronLeft } from 'lucide-react';
import styles from './BackLink.module.css';

/** Like `BackLink`, but for going back within a screen (closing a picker) rather than to another route. */
export function BackButton({ label, onPress }: { readonly label: string; readonly onPress: () => void }) {
  return (
    <button type="button" className={styles.link} onClick={onPress}>
      <ChevronLeft size={20} strokeWidth={2} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
