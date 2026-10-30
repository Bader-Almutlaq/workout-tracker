import type { StrongImportPlan } from '../../../core/import/StrongImportPlan';
import type { StrongImportOptions } from '../../../core/import/StrongImportOptions';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { Section } from '../../design/components/Section';
import styles from './StrongImportScreen.module.css';
/** Allows review of detected or overridden pound units. */
export function PoundExercisesSection({
  plan,
  options,
  review,
}: {
  plan: StrongImportPlan;
  options: StrongImportOptions;
  review: (options: StrongImportOptions) => void;
}) {
  const poundExercises = plan.exercises.filter((exercise) => exercise.columnUnit === 'lb' || exercise.isOverridden);
  return poundExercises.length > 0 ? (
    <Section
      label="Exercises exported in pounds"
      footnote={
        plan.sourceFormat === 'strong' || plan.sourceFormat === undefined
          ? "Strong exports each exercise in the unit it's set to now. These were detected as pounds and will be converted to kg. Switch one back if it's wrong."
          : "These export columns are in pounds and will be converted to kg. Changing an exercise's unit applies to all its sets."
      }
    >
      {poundExercises.map((exercise) => (
        <div className={styles.unitRow} key={exercise.name}>
          <div>
            {exercise.name}
            <p className={styles.note}>{exercise.setCount} sets</p>
          </div>
          <select
            aria-label={`Unit for ${exercise.name}`}
            value={exercise.columnUnit}
            onChange={(event) => {
              const unit: WeightUnit = event.target.value === 'lb' ? 'lb' : 'kg';
              const unitOverrides = new Map(options.unitOverrides);
              unitOverrides.set(exercise.name, unit);
              review({ ...options, unitOverrides });
            }}
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      ))}
    </Section>
  ) : null;
}
