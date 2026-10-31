import { useState } from 'react';
import type { Muscle } from '../../../core/library/Muscle';
import { localDateKey } from '../../../core/support/localDate';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { MuscleBars } from './MuscleBars';
import { MuscleCoverage } from './MuscleCoverage';
import { MuscleHistory } from './MuscleHistory';
import { VolumeTable } from './VolumeTable';
import { WeekChips } from './WeekChips';
import { chooseVolume, VolumePeriods, type WeekChoice } from './volumeLayout';
import styles from './Analytics.module.css';

/** Weekly fractional hard sets by muscle, with a selected-period history and table, then coverage over the period. */
export function AnalyticsMuscles({
  from,
  to,
  lastDay,
}: {
  readonly from: Date;
  readonly to: Date;
  /** The period's last local day, for the coverage section's inclusive range. */
  readonly lastDay: Date;
}) {
  const [choice, setChoice] = useState<WeekChoice>('this');
  const [selected, setSelected] = useState<Muscle | null>(null);
  const [table, setTable] = useState(false);
  const start = new Date(to);
  start.setDate(start.getDate() - VolumePeriods.averageWeeks * VolumePeriods.daysPerWeek);
  const range = { from: start < from ? start : from, to };
  const query = useDatabaseQuery(`muscle-volume-${range.from.toISOString()}-${range.to.toISOString()}`, async () => {
    const [weeks, summary] = await Promise.all([
      database.weeklyMuscleVolume(range.from.toISOString(), new Date(range.to.getTime() - 1).toISOString()),
      database.summary(),
    ]);
    return { weeks, workoutCount: summary.workoutCount };
  });
  return (
    <>
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
            <MuscleHistory
              muscle={selected}
              weeks={query.value.weeks.filter((week) => week.weekStart >= localDateKey(from))}
              onClose={() => setSelected(null)}
            />
          )}
          <MuscleCoverage from={from} to={lastDay} />
        </>
      )}
    </>
  );
}
