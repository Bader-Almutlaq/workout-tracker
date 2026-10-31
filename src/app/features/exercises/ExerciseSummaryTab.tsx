import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { Section, SectionRow } from '../../design/components/Section';
import { dayWithYearText } from '../../format/dateText';
import { weightText } from '../../format/weightText';
import { setCountsText } from '../history/setCountsText';
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
        {traits !== '' && <p className={styles.traits}>{traits}</p>}
      </Section>
      <Section label="Usage">
        <SectionRow
          label="Logged"
          value={`${detail.workoutCount} sessions · ${setCountsText(detail.setCount, detail.warmupCount ?? 0)}`}
        />
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
