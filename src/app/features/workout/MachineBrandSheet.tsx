import { useState } from 'react';
import { MACHINE_BRANDS, normalizeMachineBrand } from '../../../core/library/MachineBrands';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import { BottomSheet } from '../../design/components/BottomSheet';
import { Button } from '../../design/components/Button';
import { TextField } from '../../design/components/TextField';
import styles from './MachineBrandSheet.module.css';

/** Selects a previously used, listed or custom manufacturer, or clears the selection. */
export function MachineBrandSheet({
  value,
  onSave,
  onClose,
}: {
  readonly value: string | null;
  readonly onSave: (brand: string | null) => void;
  readonly onClose: () => void;
}) {
  const used = useDatabaseQuery('used-machine-brands', () => database.usedMachineBrands());
  const [other, setOther] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const recent = used.status === 'ready' ? used.value : [];
  const names = [
    ...recent,
    ...MACHINE_BRANDS.filter((name) => !recent.some((item) => item.toLowerCase() === name.toLowerCase())),
  ];
  return (
    <BottomSheet title="Machine" onClose={onClose}>
      {used.status === 'failed' && <p role="alert">{used.message}</p>}
      <div className={styles.list}>
        {value !== null && (
          <button type="button" onClick={() => onSave(null)}>
            None
          </button>
        )}
        {names.map((name) => (
          <button type="button" key={name} onClick={() => onSave(name)}>
            {name}
          </button>
        ))}
        <button type="button" onClick={() => setOther(true)}>
          Other…
        </button>
      </div>
      {other && (
        <div className={styles.other}>
          <TextField label="Manufacturer" value={text} onChange={setText} />
          {error !== '' && <p role="alert">{error}</p>}
          <Button
            onPress={() => {
              try {
                onSave(normalizeMachineBrand(text));
              } catch (failure: unknown) {
                setError(messageOf(failure));
              }
            }}
          >
            Save
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
