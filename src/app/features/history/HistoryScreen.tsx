import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';

/** Past workouts. Ported from the native app in milestone W1 (see docs/PLAN.md). */
export function HistoryScreen() {
  return (
    <Screen title="History">
      <EmptyState message="Import your Strong history from Settings once milestone W1 lands." />
    </Screen>
  );
}
