import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';

/** Exercise library, search and custom exercises. Ported from the native app in milestone W2. */
export function ExercisesScreen() {
  return (
    <Screen title="Exercises">
      <EmptyState message="The exercise library arrives with milestone W2." />
    </Screen>
  );
}
