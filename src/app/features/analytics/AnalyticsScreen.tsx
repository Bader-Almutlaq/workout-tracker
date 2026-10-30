import { useState } from 'react';
import { BodyScreen } from '../body/BodyScreen';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import type { Muscle } from '../../../core/library/Muscle';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { SignatureCard } from './SignatureCard';
import { MuscleBars } from './MuscleBars';
import { MuscleHistory } from './MuscleHistory';
import { VolumeTable } from './VolumeTable';
import { WeekChips } from './WeekChips';
import { chooseVolume, historyRange, type WeekChoice } from './volumeLayout';
import styles from './Analytics.module.css';

/** Weekly fractional hard sets by muscle, with a twelve-week history and table. */
export function AnalyticsScreen() {
  const [mode, setMode] = useState<'training' | 'body'>('training');
  const [choice, setChoice] = useState<WeekChoice>('this');
  const [selected, setSelected] = useState<Muscle | null>(null);
  const [table, setTable] = useState(false);
  const range = historyRange(new Date());
  const query = useDatabaseQuery(`muscle-volume-${range.to.toDateString()}`, async () => {
    const [weeks, summary] = await Promise.all([
      database.weeklyMuscleVolume(range.from.toISOString(), range.to.toISOString()),
      database.summary(),
    ]);
    return { weeks, workoutCount: summary.workoutCount };
  });
  return (
    <Screen title="Analytics" subtitle={mode === 'training' ? 'Weekly hard sets by muscle' : 'Body measurements'}>
      <SegmentedControl
        label="Analytics view"
        options={[
          { value: 'training', label: 'Training' },
          { value: 'body', label: 'Body' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'body' ? (
        <BodyScreen />
      ) : (
        <>
          <SignatureCard />
          {query.status === 'loading' && <EmptyState message="Loading…" />}
          {query.status === 'failed' && <EmptyState message={query.message} />}
          {query.status === 'ready' && query.value.workoutCount === 0 && (
            <EmptyState message="Import or log workouts to see your weekly sets." />
          )}
          {query.status === 'ready' && query.value.workoutCount > 0 && (
            <>
              <WeekChips choice={choice} onChange={setChoice} />
              <button type="button" className={styles.toggle} onClick={() => setTable(!table)}>
                {table ? 'Show as chart' : 'Show as table'}
              </button>
              {table ? (
                <VolumeTable muscles={chooseVolume(query.value.weeks, choice)} onSelect={setSelected} />
              ) : (
                <MuscleBars muscles={chooseVolume(query.value.weeks, choice)} onSelect={setSelected} />
              )}
              {selected !== null && (
                <MuscleHistory muscle={selected} weeks={query.value.weeks} onClose={() => setSelected(null)} />
              )}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
