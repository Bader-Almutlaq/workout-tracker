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
  sites,
  onClose,
}: {
  readonly sites: readonly MeasurementSite[];
  readonly onClose: () => void;
}) {
  const [guide, setGuide] = useState(sites.find((site) => site.guide)?.guide ?? '');
  const action = useBodyAction();
  return (
    <BottomSheet title="How to measure" onClose={onClose}>
      <label className={styles.field}>
        Guide
        <textarea className={styles.input} rows={6} value={guide} onChange={(event) => setGuide(event.target.value)} />
      </label>
      {action.error !== null && <ErrorBanner message={action.error} onDismiss={action.dismiss} />}
      <Button
        variant="primary"
        isDisabled={action.busy}
        onPress={() => {
          void action.run(async () => {
            for (const site of sites) await database.updateMeasurementGuide(site.key, guide);
          }, onClose);
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
