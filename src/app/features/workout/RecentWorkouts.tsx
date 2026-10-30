import { database, useDatabaseQuery } from '../../data/database';
import { Section } from '../../design/components/Section';
import { RecentWorkoutRow } from './RecentWorkoutRow';

/** "Repeat a past workout": the latest finished workouts. Tapping one starts a workout with the same exercises. Hidden until there are any. */
export function RecentWorkouts({
  isBusy,
  onRepeat,
}: {
  readonly isBusy: boolean;
  readonly onRepeat: (workoutId: number) => void;
}) {
  const recent = useDatabaseQuery('recent-workouts', () => database.recentWorkouts());
  if (recent.status !== 'ready' || recent.value.length === 0) return null;
  return (
    <Section label="Repeat a past workout">
      {recent.value.map((workout) => (
        <RecentWorkoutRow key={workout.id} workout={workout} isDisabled={isBusy} onPress={() => onRepeat(workout.id)} />
      ))}
    </Section>
  );
}
