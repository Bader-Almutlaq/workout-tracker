import { TriangleAlert, X } from 'lucide-react';
import styles from './ErrorBanner.module.css';

/** A quiet message that something failed, with the reason in words and a way to dismiss it. */
export function ErrorBanner({ message, onDismiss }: { readonly message: string; readonly onDismiss: () => void }) {
  return (
    <div className={styles.banner} role="alert">
      <TriangleAlert size={16} strokeWidth={2} className={styles.icon} aria-hidden />
      <span className={styles.message}>{message}</span>
      <button type="button" className={styles.dismiss} aria-label="Dismiss" onClick={onDismiss}>
        <X size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
