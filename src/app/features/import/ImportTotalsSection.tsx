import type { StrongImportPlan } from '../../../core/import/StrongImportPlan';
import { Section, SectionRow } from '../../design/components/Section';
import { dateRange } from './importFindingText';
/** Shows the totals in a proposed import. */
export function ImportTotalsSection({ plan }: { plan: StrongImportPlan }) {
  return (
    <Section label="What will be imported">
      <SectionRow label="Workouts" value={plan.totals.workouts.toLocaleString()} />
      <SectionRow
        label="Sets"
        value={`${plan.totals.sets.toLocaleString()} (${plan.totals.workSets.toLocaleString()} excluding warm-ups)`}
      />
      <SectionRow label="Exercises" value={plan.exercises.length.toLocaleString()} />
      <SectionRow label="Dates" value={dateRange(plan)} />
      {plan.measurements.length > 0 && (
        <SectionRow label="Body measurements" value={plan.measurements.length.toLocaleString()} />
      )}
    </Section>
  );
}
