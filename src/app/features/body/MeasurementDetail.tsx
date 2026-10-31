import { useState } from 'react';
import type { BodyMeasurement } from '../../../core/models/BodyMeasurement';
import type { MeasurementGroup } from '../../../core/measurements/MeasurementQueries';
import type { MeasurementState } from '../../../core/measurements/MeasurementSite';
import type { MeasurementSite } from '../../../core/measurements/MeasurementSite';
import type { MeasurementUnits } from '../../../core/measurements/MeasurementUnits';
import { database, useDatabaseQuery } from '../../data/database';
import { Button } from '../../design/components/Button';
import { EmptyState } from '../../design/components/EmptyState';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { MeasurementGuideEditor } from './MeasurementGuideEditor';
import { MeasurementLogSheet } from './MeasurementLogSheet';
import { MeasurementChart } from './MeasurementChart';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import { MeasurementChangeFigures } from './MeasurementChangeFigures';
import { MeasurementHistory } from './MeasurementHistory';
import { useBodyAction } from './useBodyAction';
import { useBodyQueryError } from './useBodyQueryError';
import { siteUnit } from './measurementText';
import styles from './Body.module.css';

/** One site's guide, chart, changes and editable history, with a prefilled log action. */
export function MeasurementDetail({
  group,
  sites,
  units,
}: {
  readonly group: MeasurementGroup;
  readonly sites: readonly MeasurementSite[];
  readonly units: MeasurementUnits;
}) {
  const query = useDatabaseQuery(`measurement-group-${group.key}`, () =>
    Promise.all(group.sites.map((item) => database.measurementDetail(item.site.key))),
  );
  const [section, setSection] = useState<'chart' | 'history'>('chart');
  const [state, setState] = useState<MeasurementState>('relaxed');
  useBodyQueryError(query);
  const action = useBodyAction();
  const [guide, setGuide] = useState(false);
  const [editor, setEditor] = useState<BodyMeasurement | 'new' | null>(null);
  const [removing, setRemoving] = useState<BodyMeasurement | null>(null);
  const details = query.status === 'ready' ? query.value.filter((item) => item !== null) : [];
  const first = group.sites[0]?.site;
  const unit = first === undefined ? units.lengthUnit : siteUnit(first, units);
  const entries = details
    .flatMap((detail) => detail.entries)
    .sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt));
  return (
    <div className={styles.stack}>
      {query.status === 'loading' && <EmptyState message="Loading measurement history…" />}
      {query.status === 'failed' && <EmptyState message={query.message} />}
      {query.status === 'ready' && details.length === 0 && <EmptyState message="This body part no longer exists." />}
      {details.length > 0 && (
        <>
          <SegmentedControl
            label="Body part view"
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'history', label: 'History' },
            ]}
            value={section}
            onChange={setSection}
          />
          <Button variant="primary" onPress={() => setEditor('new')}>
            Log
          </Button>
          {section === 'chart' && (
            <>
              <button
                type="button"
                className={styles.note}
                onClick={() => setGuide(true)}
                aria-label="Edit how-to note"
              >
                {group.sites.find((item) => item.site.guide)?.site.guide || 'Add a how-to note'}
                <span className={styles.caption}> · Edit note</span>
              </button>
              {group.sites.some((item) => item.site.supportsFlexed) && (
                <SegmentedControl
                  label="Measurement state"
                  options={[
                    { value: 'relaxed', label: 'Relaxed' },
                    { value: 'flexed', label: 'Flexed' },
                  ]}
                  value={state}
                  onChange={setState}
                />
              )}
              <MeasurementChart
                title={group.name}
                entries={entries.filter((entry) => entry.state === state)}
                sites={group.sites.map((item) => item.site)}
                unit={unit}
              />
              {details.map((detail) => (
                <MeasurementChangeFigures key={detail.site.key} detail={detail} state={state} unit={unit} />
              ))}
            </>
          )}
          {section === 'history' && (
            <MeasurementHistory
              entries={entries}
              sites={group.sites.map((item) => item.site)}
              unit={unit}
              onEdit={setEditor}
              onDelete={setRemoving}
            />
          )}
          {guide && (
            <MeasurementGuideEditor sites={group.sites.map((item) => item.site)} onClose={() => setGuide(false)} />
          )}
          {editor !== null && (
            <MeasurementLogSheet
              sites={sites}
              units={units}
              initialSite={first?.key ?? ''}
              {...(editor === 'new' ? {} : { entry: editor })}
              onClose={() => setEditor(null)}
              onDelete={(entry) => {
                setEditor(null);
                setRemoving(entry);
              }}
            />
          )}
        </>
      )}
      {action.error !== null && <ErrorBanner message={action.error} onDismiss={action.dismiss} />}
      {removing !== null && (
        <ConfirmDialog
          title="Delete this measurement?"
          confirmLabel="Delete measurement"
          isBusy={action.busy}
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            void action.run(
              () => database.deleteMeasurement(removing.id),
              () => setRemoving(null),
            );
          }}
        >
          This entry will be removed from the history.
          {action.error !== null && <p role="alert">{action.error}</p>}
        </ConfirmDialog>
      )}
    </div>
  );
}
