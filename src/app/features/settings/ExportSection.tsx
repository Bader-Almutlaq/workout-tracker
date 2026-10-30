import { useState } from 'react';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import { Section } from '../../design/components/Section';
import { log } from '../../../core/support/log';
import styles from './BackupSection.module.css';

/** Heuristic: allow Safari a minute to start reading a temporary download URL. */
const DOWNLOAD_LINK_LIFETIME_MS = 60_000;

/** Prepares CSV files before a tap so iOS can open its share sheet with user activation. */
export function ExportSection() {
  const workouts = useDatabaseQuery('export-workouts', () => database.exportWorkoutsCsv());
  const measurements = useDatabaseQuery('export-measurements', () => database.exportMeasurementsCsv());
  const [error, setError] = useState<string>();
  const share = (text: string, kind: string) => {
    const date = new Date();
    const stamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    const file = new File([text], `JEM-${kind}-${stamp}.csv`, { type: 'text/csv;charset=utf-8' });
    setError(undefined);
    if (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      void navigator.share({ files: [file] }).catch((failure: unknown) => {
        if (failure instanceof DOMException && failure.name === 'AbortError') return;
        log.ui.error('CSV export could not be shared.');
        setError(messageOf(failure));
      });
    } else {
      const address = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = address;
      link.download = file.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(address), DOWNLOAD_LINK_LIFETIME_MS);
    }
  };
  return (
    <Section label="Export" footnote="Workout weights are in kilograms. CSV exports do not replace a full backup.">
      <button
        className={styles.action}
        type="button"
        disabled={workouts.status !== 'ready'}
        onClick={() => workouts.status === 'ready' && share(workouts.value, 'workouts')}
      >
        Export workouts…
      </button>
      <button
        className={styles.action}
        type="button"
        disabled={measurements.status !== 'ready'}
        onClick={() => measurements.status === 'ready' && share(measurements.value, 'measurements')}
      >
        Export measurements…
      </button>
      {workouts.status === 'failed' && <p role="alert">{workouts.message}</p>}
      {measurements.status === 'failed' && <p role="alert">{measurements.message}</p>}
      {error && <p role="alert">{error}</p>}
    </Section>
  );
}
