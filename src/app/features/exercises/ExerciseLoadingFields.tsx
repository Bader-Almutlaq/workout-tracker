import { WarmupSchemes } from '../../../core/logging/WarmupPlan';
import type { ExerciseLoadingSettings } from '../../../core/library/ExerciseEditor';
import type { Equipment } from '../../../core/library/Equipment';
import { isBarEquipment } from '../../../core/units/LoadableWeight';
import { displayValue, toKilograms } from '../../../core/units/Weight';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { SelectField } from '../../design/components/SelectField';
import { LoadingWeightField } from './LoadingWeightField';

/** Count choices from the owner-approved T-044 schemes; Off is the default. */
const WARMUP_OPTIONS = Object.keys(WarmupSchemes)
  .filter((count) => count !== '0')
  .map((count) => ({ value: count, label: count }));

/** Optional exact kg loading overrides, displayed in this exercise's entry unit; blank inputs reset defaults. */
export function ExerciseLoadingFields({
  settings,
  equipment,
  unit,
  onChange,
}: {
  readonly settings: ExerciseLoadingSettings;
  readonly equipment: Equipment | null | undefined;
  readonly unit: WeightUnit;
  readonly onChange: (settings: ExerciseLoadingSettings) => void;
}) {
  return (
    <>
      <LoadingWeightField
        label={`Load step (${unit})`}
        value={
          settings.loadStepKilograms === null || settings.loadStepKilograms === undefined
            ? ''
            : String(displayValue(settings.loadStepKilograms, unit))
        }
        onChange={(value) =>
          onChange({ ...settings, loadStepKilograms: value === '' ? null : toKilograms(Number(value), unit) })
        }
      />
      {isBarEquipment(equipment) && (
        <LoadingWeightField
          label={`Bar weight (${unit})`}
          value={
            settings.barWeightKilograms === null || settings.barWeightKilograms === undefined
              ? ''
              : String(displayValue(settings.barWeightKilograms, unit))
          }
          onChange={(value) =>
            onChange({ ...settings, barWeightKilograms: value === '' ? null : toKilograms(Number(value), unit) })
          }
        />
      )}
      <SelectField
        label="Warm-up sets"
        noneLabel="Off (default)"
        options={WARMUP_OPTIONS}
        value={
          settings.warmupSetCount === null || settings.warmupSetCount === undefined
            ? ''
            : String(settings.warmupSetCount)
        }
        onChange={(value) => onChange({ ...settings, warmupSetCount: value === '' ? null : Number(value) })}
      />
    </>
  );
}
