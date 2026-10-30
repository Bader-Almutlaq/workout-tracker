import { useState } from 'react';
import type { BodyMeasurement } from '../../../core/models/BodyMeasurement';
import type { MeasurementSite, MeasurementState, MeasurementUnit } from '../../../core/measurements/MeasurementSite';
import { measurementValueIn, type MeasurementUnits } from '../../../core/measurements/MeasurementUnits';
import { database } from '../../data/database';
import { BottomSheet } from '../../design/components/BottomSheet';
import { Button } from '../../design/components/Button';
import { SelectField } from '../../design/components/SelectField';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import { measurementDateInput, siteUnit } from './measurementText';
import { useBodyAction } from './useBodyAction';
import styles from './Body.module.css';

/** Logs or edits a measurement; a failed save leaves the draft and its date intact. */
export function MeasurementLogSheet({
  sites,
  units,
  initialSite,
  entry,
  onClose,
}: {
  readonly sites: readonly MeasurementSite[];
  readonly units: MeasurementUnits;
  readonly initialSite?: string;
  readonly entry?: BodyMeasurement;
  readonly onClose: () => void;
}) {
  const first = sites.find((site) => site.key === (entry?.site ?? initialSite)) ?? sites[0];
  const [key, setKey] = useState(first?.key ?? '');
  const [state, setState] = useState<MeasurementState>(entry?.state ?? 'relaxed');
  const [unit, setUnit] = useState<MeasurementUnit>(
    entry?.entryUnit ?? (first === undefined ? 'cm' : siteUnit(first, units)),
  );
  const [value, setValue] = useState(entry === undefined ? '' : String(measurementValueIn(entry.value, unit)));
  const [date, setDate] = useState(measurementDateInput(entry?.takenAt ?? new Date().toISOString()));
  const action = useBodyAction();
  const site = sites.find((candidate) => candidate.key === key);
  function chooseSite(next: string) {
    const nextSite = sites.find((candidate) => candidate.key === next);
    if (nextSite === undefined) return;
    setKey(next);
    setState('relaxed');
    setUnit(siteUnit(nextSite, units));
    setValue('');
  }
  function save() {
    void action.run(async () => {
      await database.saveMeasurement({
        ...(entry === undefined ? {} : { id: entry.id }),
        site: key,
        state,
        value: Number(value),
        unit,
        // Keep the original offset during a repeated local hour when the date field was untouched.
        takenAt: entry !== undefined && date === measurementDateInput(entry.takenAt) ? entry.takenAt : date,
      });
    }, onClose);
  }
  return (
    <BottomSheet title={entry === undefined ? 'Log measurement' : 'Edit measurement'} onClose={onClose}>
      <form
        className={styles.stack}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <SelectField
          label="Site"
          value={key}
          options={sites.map((candidate) => ({ value: candidate.key, label: candidate.name }))}
          onChange={chooseSite}
        />
        {site !== undefined && <p className={styles.caption}>{site.guide}</p>}
        <SelectField
          label="State"
          value={state}
          options={
            site?.supportsFlexed === true
              ? [
                  { value: 'relaxed', label: 'Relaxed' },
                  { value: 'flexed', label: 'Flexed' },
                ]
              : [{ value: 'relaxed', label: 'Relaxed' }]
          }
          onChange={(next) => setState(next === 'flexed' ? 'flexed' : 'relaxed')}
        />
        <SelectField
          label="Entry unit"
          value={unit}
          options={(site?.kind === 'mass' ? ['kg', 'lb'] : ['cm', 'in']).map((option) => ({
            value: option,
            label: option,
          }))}
          onChange={(next) => {
            if (next === 'cm' || next === 'in' || next === 'kg' || next === 'lb') setUnit(next);
          }}
        />
        <label className={styles.field}>
          Value ({unit})
          <input
            className={styles.input}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          Date and time
          <input
            className={styles.input}
            type="datetime-local"
            step="any"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        {action.error !== null && <ErrorBanner message={action.error} onDismiss={action.dismiss} />}
        <Button variant="primary" isDisabled={action.busy || value.trim() === '' || date === ''} onPress={save}>
          Save measurement
        </Button>
        <Button isDisabled={action.busy} onPress={onClose}>
          Cancel
        </Button>
      </form>
    </BottomSheet>
  );
}
