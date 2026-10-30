import { useState } from 'react';
import type { BodyMeasurement } from '../../../core/models/BodyMeasurement';
import type { MeasurementSite } from '../../../core/measurements/MeasurementSite';
import type { MeasurementUnits } from '../../../core/measurements/MeasurementUnits';
import { database, useDatabaseQuery } from '../../data/database';
import { BackButton } from '../../design/components/BackButton';
import { Button } from '../../design/components/Button';
import { EmptyState } from '../../design/components/EmptyState';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { MeasurementGuideEditor } from './MeasurementGuideEditor';
import { MeasurementLogSheet } from './MeasurementLogSheet';
import { MeasurementChart } from './MeasurementChart';
import { MeasurementLatest } from './MeasurementLatest';
import { MeasurementChangeFigures } from './MeasurementChangeFigures';
import { MeasurementHistory } from './MeasurementHistory';
import { useBodyAction } from './useBodyAction';
import { useBodyQueryError } from './useBodyQueryError';
import { siteUnit } from './measurementText';
import styles from './Body.module.css';

/** One site's guide, chart, changes and editable history, with a prefilled log action. */
export function MeasurementDetail({
  siteKey,
  sites,
  units,
  onBack,
}: {
  readonly siteKey: string;
  readonly sites: readonly MeasurementSite[];
  readonly units: MeasurementUnits;
  readonly onBack: () => void;
}) {
  const query = useDatabaseQuery(`measurement-${siteKey}`, () => database.measurementDetail(siteKey));
  useBodyQueryError(query);
  const action = useBodyAction();
  const [guide, setGuide] = useState(false);
  const [editor, setEditor] = useState<BodyMeasurement | 'new' | null>(null);
  const [removing, setRemoving] = useState<BodyMeasurement | null>(null);
  const detail = query.status === 'ready' ? query.value : null;
  const unit = detail === null ? units.lengthUnit : siteUnit(detail.site, units);
  return (
    <div className={styles.stack}>
      <BackButton label="Body" onPress={onBack} />
      {query.status === 'loading' && <EmptyState message="Loading measurement history…" />}
      {query.status === 'failed' && <EmptyState message={query.message} />}
      {query.status === 'ready' && detail === null && <EmptyState message="This measurement site no longer exists." />}
      {detail !== null && (
        <>
          <h2 className={styles.title}>{detail.site.name}</h2>
          <button type="button" className={styles.note} onClick={() => setGuide(true)} aria-label="Edit how-to note">
            {detail.site.guide || 'Add a how-to note'}
            <span className={styles.caption}> · Edit note</span>
          </button>
          <Button variant="primary" onPress={() => setEditor('new')}>
            Log
          </Button>
          <MeasurementLatest detail={detail} unit={unit} />
          <MeasurementChart entries={detail.entries} unit={unit} />
          <MeasurementChangeFigures detail={detail} unit={unit} />
          <MeasurementHistory entries={detail.entries} unit={unit} onEdit={setEditor} onDelete={setRemoving} />
          {guide && <MeasurementGuideEditor site={detail.site} onClose={() => setGuide(false)} />}
          {editor !== null && (
            <MeasurementLogSheet
              sites={sites}
              units={units}
              initialSite={siteKey}
              {...(editor === 'new' ? {} : { entry: editor })}
              onClose={() => setEditor(null)}
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
