import type { ImportResult } from '../../../core/import/StrongImporter';
import { BackLink } from '../../design/components/BackLink';
import { Section, SectionRow } from '../../design/components/Section';
import styles from './StrongImportScreen.module.css';
/** Formats the number of set lines selected to leave out. */
export function setsLeftOutText(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? 'set' : 'sets'} left out`;
}
/** Displays counts after a completed import. */
export function ImportResultStep({ result }: { result: ImportResult }) {
  return (
    <>
      <h2 className={styles.result}>✓ Import complete</h2>
      <Section label="Imported">
        <SectionRow label="Workouts added" value={result.workoutsAdded.toLocaleString()} />
        <SectionRow label="Already imported" value={result.workoutsSkipped.toLocaleString()} />
        <SectionRow label="Sets added" value={result.setsAdded.toLocaleString()} />
        <SectionRow label="Left out" value={setsLeftOutText(result.setsExcluded)} />
        <SectionRow label="Exercises created" value={result.exercisesCreated.toLocaleString()} />
        <SectionRow label="Body measurements added" value={result.measurementsAdded.toLocaleString()} />
      </Section>
      <BackLink to="/settings" label="Done" />
    </>
  );
}
