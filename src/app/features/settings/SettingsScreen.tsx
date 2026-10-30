import { useState } from 'react';
import { APPEARANCES, savedAppearance, saveAppearance, type Appearance } from '../../appearance/appearance';
import { database, useDatabaseQuery } from '../../data/database';
import { Screen } from '../../design/components/Screen';
import { Section, SectionRow } from '../../design/components/Section';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import { BackupSection } from './BackupSection';

/** Settings: appearance and what's stored on this phone. Import joins in milestone W1. */
export function SettingsScreen() {
  const [appearance, setAppearance] = useState<Appearance>(savedAppearance);
  const summary = useDatabaseQuery('summary', () => database.summary());

  const choose = (value: Appearance) => {
    setAppearance(value);
    saveAppearance(value);
  };

  return (
    <Screen title="Settings">
      <section>
        <SegmentedControl label="Appearance" options={APPEARANCES} value={appearance} onChange={choose} />
      </section>
      <Section label="On this phone">
        {summary.status === 'ready' ? (
          <>
            <SectionRow label="Workouts" value={summary.value.workoutCount.toLocaleString()} />
            <SectionRow label="Exercises" value={summary.value.exerciseCount.toLocaleString()} />
            <SectionRow label="Safety snapshots" value={summary.value.snapshotCount.toLocaleString()} />
          </>
        ) : (
          <SectionRow label="Database" value={summary.status === 'loading' ? 'Opening…' : summary.message} />
        )}
      </Section>
      <BackupSection />
    </Screen>
  );
}
