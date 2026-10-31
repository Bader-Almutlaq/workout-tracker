import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { Section, SectionRow } from '../../design/components/Section';
import { strengthHeadlineText, strengthWeeklyChangeText } from './strengthReadout';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';

/** Summary headline uses the existing smoothed StrengthCard value without loading or drawing its old chart. */
export function ExerciseStrengthHeadline({
  exerciseId,
  unit,
}: {
  readonly exerciseId: number;
  readonly unit: WeightUnit;
}) {
  const query = useDatabaseQuery(`exercise-strength-${exerciseId}`, () => database.exerciseStrength(exerciseId));
  return (
    <Section label="Estimated 1RM">
      {query.status !== 'ready' ? (
        <ExerciseQueryMessage query={query} />
      ) : query.value.latest === null ? (
        <p>No qualifying strength estimate yet.</p>
      ) : (
        <SectionRow
          label={strengthWeeklyChangeText(query.value.changePerWeekPercent)}
          value={strengthHeadlineText(query.value.latest, unit)}
        />
      )}
    </Section>
  );
}
