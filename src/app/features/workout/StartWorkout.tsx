import { useState } from 'react';
import { Button } from '../../design/components/Button';
import { Screen } from '../../design/components/Screen';
import { LoggingErrorBanner } from './LoggingErrorBanner';
import { RecentWorkouts } from './RecentWorkouts';
import { repeatWorkout, startEmptyWorkout } from './workoutActions';

/** The Workout tab with nothing in progress: start an empty workout, or repeat a recent one. */
export function StartWorkout() {
  const [isStarting, setIsStarting] = useState(false);

  // One tap starts one workout; the button stays disabled until the start has finished, so a second tap can't ask for another.
  const start = (action: () => Promise<unknown>) => {
    setIsStarting(true);
    void action().then(() => setIsStarting(false));
  };

  return (
    <Screen title="Workout">
      <LoggingErrorBanner />
      <Button variant="primary" isDisabled={isStarting} onPress={() => start(() => startEmptyWorkout())}>
        Start empty workout
      </Button>
      <RecentWorkouts isBusy={isStarting} onRepeat={(workoutId) => start(() => repeatWorkout(workoutId))} />
    </Screen>
  );
}
