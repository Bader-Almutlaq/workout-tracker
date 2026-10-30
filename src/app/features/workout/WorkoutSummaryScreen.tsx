import { useNavigate, useParams } from 'react-router';
import { Button } from '../../design/components/Button';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { SavedWorkoutSummary } from './SavedWorkoutSummary';

/** Shown after Finish: what was saved, or a note that nothing was. One Done button; no praise or celebration. */
export function WorkoutSummaryScreen() {
  const workoutId = Number(useParams().workoutId);
  const navigate = useNavigate();
  const done = (
    <Button variant="primary" onPress={() => navigate('/', { replace: true })}>
      Done
    </Button>
  );

  if (Number.isNaN(workoutId))
    return (
      <Screen title="Workout">
        <EmptyState message="Nothing was logged, so the workout was discarded." />
        {done}
      </Screen>
    );
  return <SavedWorkoutSummary workoutId={workoutId} done={done} />;
}
