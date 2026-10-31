import { useEffect, useState } from 'react';
import type { Muscle } from '../../../core/library/Muscle';
import { localDateKey } from '../../../core/support/localDate';
import { log } from '../../../core/support/log';
import { database, useDatabaseQuery } from '../../data/database';
import { BalanceRatios } from './BalanceRatios';
import { MuscleExerciseShareSheet } from './MuscleExerciseShareSheet';
import { MuscleFrequencyList } from './MuscleFrequencyList';
import { NeglectedMuscles } from './NeglectedMuscles';

/** Standalone muscle coverage for inclusive local dates. */
export function MuscleCoverage({ from, to }: { readonly from: Date; readonly to: Date }) {
  const [selected, setSelected] = useState<Muscle | null>(null);
  const start = localDateKey(from);
  const end = localDateKey(to);
  const key = `coverage-${start}-${end}`;
  const query = useDatabaseQuery(key, async () => ({
    key,
    value: await database.muscleCoverage(`${start}T00:00:00`, `${end}T00:00:00`),
  }));
  useEffect(() => {
    if (query.status === 'failed') log.ui.error('Could not load muscle coverage', query.message);
  }, [query]);
  if (query.status === 'failed') return <p role="alert">{query.message}</p>;
  if (query.status !== 'ready' || query.value.key !== key) return <p>Loading muscle coverage…</p>;
  return (
    <>
      <NeglectedMuscles muscles={query.value.value.neglected} />
      <MuscleFrequencyList muscles={query.value.value.muscles} onSelect={setSelected} />
      <BalanceRatios ratios={query.value.value.ratios} />
      {selected !== null && (
        <MuscleExerciseShareSheet
          muscle={selected}
          shares={query.value.value.shares[selected] ?? []}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
