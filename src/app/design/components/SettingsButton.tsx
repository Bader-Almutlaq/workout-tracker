import { Settings } from 'lucide-react';
import { Link } from 'react-router';
import styles from './SettingsButton.module.css';

/** Header gear leading to Settings, with an accessible label and a full touch target. */
export function SettingsButton() {
  return (
    <Link to="/settings" className={styles.button} aria-label="Settings">
      <Settings size={22} strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
