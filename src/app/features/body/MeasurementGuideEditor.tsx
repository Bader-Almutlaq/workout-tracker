import { useState } from 'react';
import type { MeasurementSite } from '../../../core/measurements/MeasurementSite';
import { database } from '../../data/database';
import { BottomSheet } from '../../design/components/BottomSheet';
import { Button } from '../../design/components/Button';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import { useBodyAction } from './useBodyAction';
import styles from './Body.module.css';

/** Edits the how-to note verbatim; empty notes are allowed. */
export function MeasurementGuideEditor({
  site,
  onClose,
}: {
  readonly site: MeasurementSite;
  readonly onClose: () => void;
}) {
  const [guide, setGuide] = useState(site.guide);
  const action = useBodyAction();
  return (
    <BottomSheet title={`How to measure · ${site.name}`} onClose={onClose}>
      <label className={styles.field}>
        Guide
        <textarea className={styles.input} rows={6} value={guide} onChange={(event) => setGuide(event.target.value)} />
      </label>
      {action.error !== null && <ErrorBanner message={action.error} onDismiss={action.dismiss} />}
      <Button
        variant="primary"
        isDisabled={action.busy}
        onPress={() => {
          void action.run(() => database.updateMeasurementGuide(site.key, guide), onClose);
        }}
      >
        Save note
      </Button>
      <Button isDisabled={action.busy} onPress={onClose}>
        Cancel
      </Button>
    </BottomSheet>
  );
}
