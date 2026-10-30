import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';

/** Charts and analytics (milestones W5–W6). */
export function AnalyticsScreen() {
  return (
    <Screen title="Analytics">
      <EmptyState message="Charts arrive in milestones W5–W6." />
    </Screen>
  );
}
