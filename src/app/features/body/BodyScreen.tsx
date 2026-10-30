import { useState } from 'react';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { Button } from '../../design/components/Button';
import { MeasurementGroupRow } from './MeasurementGroupRow';
import { MeasurementDetail } from './MeasurementDetail';
import { MeasurementLogSheet } from './MeasurementLogSheet';
import { MeasurementSiteSheet } from './MeasurementSiteSheet';
import { partitionMeasurementGroups } from './measurementText';
import { useBodyQueryError } from './useBodyQueryError';
import styles from './Body.module.css';

/** Measurements home inside Analytics → Body; navigation stays within this tab. */
export function BodyScreen() {
  const query = useDatabaseQuery('measurement-sites', () => database.measurementSites());
  useBodyQueryError(query);
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState(false);
  const [addSite, setAddSite] = useState(false);
  if (query.status === 'loading') return <EmptyState message="Loading measurements…" />;
  if (query.status === 'failed') return <EmptyState message={query.message} />;
  const { groups, units } = query.value;
  const sites = groups.flatMap((group) => group.sites.map((summary) => summary.site));
  const selectedGroup = groups.find((group) => group.key === selected);
  if (selectedGroup !== undefined)
    return (
      <MeasurementDetail
        key={selected}
        group={selectedGroup}
        sites={sites}
        units={units}
        onBack={() => setSelected(null)}
      />
    );
  const { measured, unmeasured } = partitionMeasurementGroups(groups);
  return (
    <div className={styles.stack}>
      <Button variant="primary" onPress={() => setLog(true)}>
        Log measurement
      </Button>
      {measured.length === 0 && <EmptyState message="Log a measurement to start your body history." />}
      <div>
        {measured.map((group) => (
          <MeasurementGroupRow key={group.key} group={group} units={units} onSelect={setSelected} />
        ))}
      </div>
      {unmeasured.length > 0 && (
        <details>
          <summary>Not measured yet ({unmeasured.length})</summary>
          {unmeasured.map((group) => (
            <MeasurementGroupRow key={group.key} group={group} units={units} onSelect={setSelected} empty />
          ))}
        </details>
      )}
      <Button onPress={() => setAddSite(true)}>Add site</Button>
      {log && <MeasurementLogSheet sites={sites} units={units} onClose={() => setLog(false)} />}
      {addSite && <MeasurementSiteSheet onClose={() => setAddSite(false)} />}
    </div>
  );
}
