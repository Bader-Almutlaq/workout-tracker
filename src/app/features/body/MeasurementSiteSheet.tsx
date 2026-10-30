import { useState } from 'react';
import type { MeasurementKind } from '../../../core/measurements/MeasurementSite';
import { database } from '../../data/database';
import { BottomSheet } from '../../design/components/BottomSheet';
import { Button } from '../../design/components/Button';
import { TextField } from '../../design/components/TextField';
import { SelectField } from '../../design/components/SelectField';
import { CheckboxField } from '../../design/components/CheckboxField';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import { useBodyAction } from './useBodyAction';
import styles from './Body.module.css';

/** Adds an unpaired custom site with its measurement guide. */
export function MeasurementSiteSheet({ onClose }: { readonly onClose: () => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<MeasurementKind>('length');
  const [flexed, setFlexed] = useState(false);
  const [guide, setGuide] = useState('');
  const action = useBodyAction();
  return (
    <BottomSheet title="Add site" onClose={onClose}>
      <TextField label="Site name" value={name} onChange={setName} />
      <SelectField
        label="Measurement kind"
        value={kind}
        options={[
          { value: 'length', label: 'Length' },
          { value: 'mass', label: 'Mass' },
        ]}
        onChange={(value) => {
          setKind(value === 'mass' ? 'mass' : 'length');
          setFlexed(false);
        }}
      />
      <CheckboxField label="Supports flexed measurements" isChecked={flexed} onChange={setFlexed} />
      <label className={styles.field}>
        How to measure
        <textarea className={styles.input} rows={4} value={guide} onChange={(event) => setGuide(event.target.value)} />
      </label>
      {action.error !== null && <ErrorBanner message={action.error} onDismiss={action.dismiss} />}
      <Button
        variant="primary"
        isDisabled={action.busy || name.trim() === ''}
        onPress={() => {
          void action.run(() => database.addMeasurementSite({ name, kind, supportsFlexed: flexed, guide }), onClose);
        }}
      >
        Add site
      </Button>
      <Button isDisabled={action.busy} onPress={onClose}>
        Cancel
      </Button>
    </BottomSheet>
  );
}
