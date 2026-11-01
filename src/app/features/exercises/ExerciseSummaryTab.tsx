import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { Chip } from '../../design/components/Chip';
import { Section, SectionRow } from '../../design/components/Section';
import { dayWithYearText } from '../../format/dateText';
import { weightText } from '../../format/weightText';
import { ExerciseActions } from './ExerciseActions';
import { exerciseTraitsText } from './exerciseText';
import { MuscleChips } from './MuscleChips';
import { ExerciseStrengthHeadline } from './ExerciseStrengthHeadline';
import styles from './ExerciseDetailScreen.module.css';

/** Exercise metadata, usage, current strength and loading preferences, with the existing edit/actions entry points. */
export function ExerciseSummaryTab({ detail }: { readonly detail: ExerciseCatalogDetail }) {
  const { exercise } = detail;
  const unit = exercise.defaultEntryUnit;
  const traits = exerciseTraitsText(exercise);
  return (
    <>
      <Section label="Muscles">
        <MuscleChips primary={detail.primaryMuscles} secondary={detail.secondaryMuscles} />
        {traits !== '' && (
          <div className={styles.usageTraits}>
            {traits.split(' · ').map((trait) => (
              <Chip key={trait} tone="neutral">
                {trait}
              </Chip>
            ))}
          </div>
        )}
      </Section>
      <Section label="Usage">
        <div className={styles.usageTiles}>
          <div>
            <strong>{detail.workoutCount}</strong>
            <span>Sessions</span>
          </div>
          <div>
            <strong>{detail.setCount}</strong>
            <span>Working sets</span>
          </div>
          {(detail.warmupCount ?? 0) > 0 && (
            <div>
              <strong>{detail.warmupCount}</strong>
              <span>Warm-ups</span>
            </div>
          )}
        </div>
        {detail.firstUsedAt !== null && (
          <SectionRow label="First" value={dayWithYearText(detail.firstUsedAt.toISOString())} />
        )}
        {detail.lastUsedAt !== null && (
          <SectionRow label="Last" value={dayWithYearText(detail.lastUsedAt.toISOString())} />
        )}
      </Section>
      {exercise.tracking === 'weight-reps' && <ExerciseStrengthHeadline exerciseId={exercise.id} unit={unit} />}
      <Section label="Loading">
        <SectionRow label="Unit" value={unit} />
        <SectionRow
          label="Load step"
          value={
            exercise.loadStepKilograms === null || exercise.loadStepKilograms === undefined
              ? 'Equipment default'
              : weightText(exercise.loadStepKilograms, unit)
          }
        />
        {exercise.barWeightKilograms !== null && exercise.barWeightKilograms !== undefined && (
          <SectionRow label="Bar weight" value={weightText(exercise.barWeightKilograms, unit)} />
        )}
        <SectionRow label="Warm-up sets" value={exercise.warmupSetCount ? String(exercise.warmupSetCount) : 'Off'} />
      </Section>
      {detail.aliases.length > 0 && <p className={styles.aliases}>Also known as: {detail.aliases.join(', ')}</p>}
      <ExerciseActions detail={detail} />
    </>
  );
}
