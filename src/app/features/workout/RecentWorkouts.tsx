import { useNavigate } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { Section } from '../../design/components/Section';
import { RecentWorkoutRow } from './RecentWorkoutRow';

/** "Past workouts": the latest finished workouts. Tapping one starts a workout with the same exercises. Hidden until there are any. */
export function RecentWorkouts() {
  const navigate = useNavigate();
  const recent = useDatabaseQuery('recent-workouts', () => database.recentWorkouts());
  if (recent.status !== 'ready' || recent.value.length === 0) return null;
  return (
    <Section label="Past workouts">
      {recent.value.map((workout) => (
        <RecentWorkoutRow
          key={workout.id}
          workout={workout}
          isDisabled={false}
          onPress={() => navigate(`/history/${workout.id}`)}
        />
      ))}
    </Section>
  );
}
