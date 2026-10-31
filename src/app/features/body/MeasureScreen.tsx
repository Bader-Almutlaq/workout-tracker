import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { BackLink } from '../../design/components/BackLink';
import { Button } from '../../design/components/Button';
import { MeasurementGroupRow } from './MeasurementGroupRow';
import { MeasurementDetail } from './MeasurementDetail';
import { MeasurementLogSheet } from './MeasurementLogSheet';
import { MeasurementSiteSheet } from './MeasurementSiteSheet';
import { AddBodyPartSheet } from './AddBodyPartSheet';
import { partitionMeasurementGroups, measurementSection } from './measurementText';
import { useBodyQueryError } from './useBodyQueryError';
import styles from './Body.module.css';

/** Measure routes: grouped recorded body parts and a bookmarkable detail page. Bodyweight stays stored but hidden. */
export function MeasureScreen() {
  const query = useDatabaseQuery('measurement-sites', () => database.measurementSites());
  const { bodyPart } = useParams();
  const navigate = useNavigate();
  useBodyQueryError(query);
  const [log, setLog] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState(false);
  const groups = query.status === 'ready' ? query.value.groups : [];
  const units = query.status === 'ready' ? query.value.units : null;
  const sites = groups
    .flatMap((group) => group.sites.map((summary) => summary.site))
    .filter((site) => site.key !== 'bodyweight');
  const selected = groups.find((group) => group.key === bodyPart && group.key !== 'bodyweight');
  const { measured, unmeasured } = partitionMeasurementGroups(groups);
  const sections = [...new Set(measured.map(measurementSection))];
  return (
    <Screen
      title={selected?.name ?? 'Measure'}
      leading={bodyPart === undefined ? undefined : <BackLink to="/measure" label="Measure" />}
    >
      {query.status === 'loading' && <EmptyState message="Loading measurements…" />}
      {query.status === 'failed' && <EmptyState message={query.message} />}
      {units !== null &&
        (bodyPart === undefined ? (
          <div className={styles.stack}>
            {measured.length === 0 && <EmptyState message="Add a body part to log your first measurement." />}
            {sections.map((section) => (
              <section key={section} className={styles.stack} aria-label={section}>
                <h2 className={styles.caption}>{section}</h2>
                <div>
                  {measured
                    .filter((group) => measurementSection(group) === section)
                    .map((group) => (
                      <MeasurementGroupRow
                        key={group.key}
                        group={group}
                        units={units}
                        onSelect={(key) => void navigate(`/measure/${encodeURIComponent(key)}`)}
                        onLog={setLog}
                      />
                    ))}
                </div>
              </section>
            ))}
            <Button onPress={() => setAdding(true)}>Add body part</Button>
            {adding && (
              <AddBodyPartSheet
                groups={unmeasured}
                onChoose={(key) => {
                  setAdding(false);
                  setLog(key);
                }}
                onNew={() => {
                  setAdding(false);
                  setCustom(true);
                }}
                onClose={() => setAdding(false)}
              />
            )}
            {custom && (
              <MeasurementSiteSheet
                onClose={() => setCustom(false)}
                onCreated={(key) => void navigate(`/measure/${encodeURIComponent(key)}`)}
              />
            )}
            {log !== null && (
              <MeasurementLogSheet sites={sites} units={units} initialSite={log} onClose={() => setLog(null)} />
            )}
          </div>
        ) : selected === undefined ? (
          <EmptyState message="This body part no longer exists." />
        ) : (
          <MeasurementDetail key={selected.key} group={selected} sites={sites} units={units} />
        ))}
    </Screen>
  );
}
