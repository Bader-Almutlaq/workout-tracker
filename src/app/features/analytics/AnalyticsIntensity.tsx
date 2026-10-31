import { useEffect, useState } from 'react';
import { MUSCLES, MUSCLE_DISPLAY_NAMES, type Muscle } from '../../../core/library/Muscle';
import { isMainMuscle } from '../../../core/library/MuscleProminence';
import { localDateKey } from '../../../core/support/localDate';
import { log } from '../../../core/support/log';
import { database, useDatabaseQuery } from '../../data/database';
import { ToggleChip } from '../../design/components/ToggleChip';
import { EffortHistogram } from './EffortHistogram';
import { IntensityVolumeMap } from './IntensityVolumeMap';
import { RepRangeBars } from './RepRangeBars';
import styles from './AnalyticsIntensity.module.css';

/** Standalone working-set intensity views for inclusive local dates. */
export function AnalyticsIntensity({ from, to }: { readonly from: Date; readonly to: Date }) {
  const [muscle, setMuscle] = useState<Muscle | undefined>();
  const start = localDateKey(from);
  const end = localDateKey(to);
  const key = `intensity-${start}-${end}-${muscle ?? 'all'}`;
  const query = useDatabaseQuery(key, async () => ({
    key,
    value: await database.intensityMix(`${start}T00:00:00`, `${end}T00:00:00`, muscle),
  }));
  useEffect(() => {
    if (query.status === 'failed') log.ui.error('Could not load intensity', query.message);
  }, [query]);
  const data = query.status === 'ready' && query.value.key === key ? query.value.value : null;
  return (
    <>
      <div className={styles.filters} aria-label="Muscle filter">
        <ToggleChip isOn={muscle === undefined} onToggle={() => setMuscle(undefined)}>
          All training
        </ToggleChip>
        {MUSCLES.filter(isMainMuscle).map((item) => (
          <ToggleChip key={item} isOn={muscle === item} onToggle={() => setMuscle(item)}>
            {MUSCLE_DISPLAY_NAMES[item]}
          </ToggleChip>
        ))}
      </div>
      {query.status === 'failed' ? (
        <p role="alert">{query.message}</p>
      ) : data === null ? (
        <p>Loading intensity…</p>
      ) : (
        <>
          <RepRangeBars buckets={data.reps} />
          <EffortHistogram buckets={data.effort} notLogged={data.notLogged} />
          <IntensityVolumeMap points={data.weeks} />
        </>
      )}
    </>
  );
}
