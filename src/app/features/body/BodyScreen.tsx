import { useState } from 'react';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { Button } from '../../design/components/Button';
import { MeasurementGroupRow } from './MeasurementGroupRow';
import { MeasurementDetail } from './MeasurementDetail';
import { MeasurementLogSheet } from './MeasurementLogSheet';
import { MeasurementSiteSheet } from './MeasurementSiteSheet';
import { MeasurementUnitPicker } from './MeasurementUnitPicker';
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
  if (selected !== null)
    return (
      <MeasurementDetail
        key={selected}
        siteKey={selected}
        sites={sites}
        units={units}
        onBack={() => setSelected(null)}
      />
    );
  const hasHistory = groups.some((group) =>
    group.sites.some((site) => site.relaxed.latest !== null || site.flexed.latest !== null),
  );
  return (
    <div className={styles.stack}>
      <MeasurementUnitPicker units={units} />
      <Button variant="primary" onPress={() => setLog(true)}>
        Log measurement
      </Button>
      {!hasHistory && <EmptyState message="Log a measurement to start your body history." />}
      <div>
        {groups.map((group) => (
          <MeasurementGroupRow key={group.key} group={group} units={units} onSelect={setSelected} />
        ))}
      </div>
      <Button onPress={() => setAddSite(true)}>Add site</Button>
      {log && <MeasurementLogSheet sites={sites} units={units} onClose={() => setLog(false)} />}
      {addSite && <MeasurementSiteSheet onClose={() => setAddSite(false)} />}
    </div>
  );
}
