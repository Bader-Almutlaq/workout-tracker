import { Section } from '../../design/components/Section';
import styles from './ExerciseInstructions.module.css';

/** Source steps in their original order, available offline with the bundled library. */
export function ExerciseInstructions({ instructions }: { readonly instructions: string | null | undefined }) {
  if (!instructions) return null;
  return (
    <Section label="Instructions">
      <ol className={styles.steps}>
        {instructions.split('\n').map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </Section>
  );
}
