import { Button } from '../../design/components/Button';
import styles from './AddExerciseBar.module.css';

/** The bar above the tab bar with the button that adds the picked exercises. A space the bar's height keeps the last rows reachable. */
export function AddExerciseBar({ count, onAdd }: { readonly count: number; readonly onAdd: () => void }) {
  return (
    <div className={styles.dock}>
      <div className={styles.spacer} />
      <div className={styles.bar}>
        <Button variant="primary" isDisabled={count === 0} onPress={onAdd}>
          {count === 0 ? 'Add' : `Add (${count})`}
        </Button>
      </div>
    </div>
  );
}
