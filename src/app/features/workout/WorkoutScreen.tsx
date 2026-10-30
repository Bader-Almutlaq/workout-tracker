import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';

/** Live workout logging. Ported from the native app in milestone W3 (see docs/PLAN.md). */
export function WorkoutScreen() {
  return (
    <Screen title="Workout">
      <EmptyState message="Logging arrives with milestone W3." />
    </Screen>
  );
}
