import styles from './WorkoutTitle.module.css';

/** The workout's name as the screen title. Tapping it renames the workout. */
export function WorkoutTitle({ name, onPress }: { readonly name: string; readonly onPress: () => void }) {
  return (
    <button type="button" className={styles.title} aria-label={`Rename workout, ${name}`} onClick={onPress}>
      {name}
    </button>
  );
}
