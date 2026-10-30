import type { MeasurementUnits } from '../../../core/measurements/MeasurementUnits';
import { database } from '../../data/database';
import { SelectField } from '../../design/components/SelectField';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import { useBodyAction } from './useBodyAction';
import styles from './Body.module.css';

/** Body display settings, stored with the database and its backups. */
export function MeasurementUnitPicker({ units }: { readonly units: MeasurementUnits }) {
  const action = useBodyAction();
  function save(next: MeasurementUnits) {
    void action.run(
      () => database.setMeasurementUnits(next),
      () => {},
    );
  }
  return (
    <div className={styles.stack}>
      <div className={styles.actions} aria-busy={action.busy}>
        <SelectField
          label="Length unit"
          value={units.lengthUnit}
          options={[
            { value: 'cm', label: 'cm' },
            { value: 'in', label: 'in' },
          ]}
          onChange={(value) => save({ ...units, lengthUnit: value === 'in' ? 'in' : 'cm' })}
        />
        <SelectField
          label="Weight unit"
          value={units.weightUnit}
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          onChange={(value) => save({ ...units, weightUnit: value === 'lb' ? 'lb' : 'kg' })}
        />
      </div>
      {action.error !== null && <ErrorBanner message={action.error} onDismiss={action.dismiss} />}
    </div>
  );
}
