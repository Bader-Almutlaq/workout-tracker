import { useState } from 'react';
import { Link } from 'react-router';
import { History } from 'lucide-react';
import styles from '../../design/components/SettingsButton.module.css';
import { WorkoutDrag } from '../../design/drag/WorkoutDrag';
import { Button } from '../../design/components/Button';
import { Screen } from '../../design/components/Screen';
import { startTemplateWorkout } from '../templates/templateActions';
import { TemplatesSection } from '../templates/TemplatesSection';
import { LoggingErrorBanner } from './LoggingErrorBanner';
import { RecentWorkouts } from './RecentWorkouts';
import { startEmptyWorkout } from './workoutActions';

/** The Workout tab with nothing in progress: start an empty workout, start one of the owner's templates, or repeat a recent one. */
export function StartWorkout() {
  const [isStarting, setIsStarting] = useState(false);

  // One tap starts one workout; the button stays disabled until the start has finished, so a second tap can't ask for another.
  const start = (action: () => Promise<unknown>) => {
    setIsStarting(true);
    void action().then(() => setIsStarting(false));
  };

  return (
    <Screen
      title="Workout"
      trailing={
        <Link to="/history" className={styles.button} aria-label="History">
          <History size={22} aria-hidden />
        </Link>
      }
    >
      <LoggingErrorBanner />
      <Button variant="primary" isDisabled={isStarting} onPress={() => start(() => startEmptyWorkout())}>
        Start empty workout
      </Button>
      <WorkoutDrag>
        <TemplatesSection isBusy={isStarting} onStart={(templateId) => start(() => startTemplateWorkout(templateId))} />
        <RecentWorkouts />
      </WorkoutDrag>
    </Screen>
  );
}
