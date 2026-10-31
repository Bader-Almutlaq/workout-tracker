import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import { ExerciseChartsTab } from '../exercises/ExerciseChartsTab';
import { ExerciseHistoryTab } from '../exercises/ExerciseHistoryTab';
import { workoutPath } from './templatePaths';
import styles from './WorkoutPage.module.css';

const sections = [
  { value: 'history', label: 'History' },
  { value: 'charts', label: 'Charts' },
] as const;

/** Exercise history and charts limited to sessions started from one workout. */
export function WorkoutExercisePage() {
  const { templateId, exerciseId } = useParams();
  const workoutId = Number(templateId);
  const id = Number(exerciseId);
  const [params, setParams] = useSearchParams();
  const template = useDatabaseQuery(`template-${workoutId}`, () => database.templateDetail(workoutId));
  const detail = useDatabaseQuery(`exercise-${id}`, () => database.exerciseDetail(id));
  if (template.status === 'ready' && template.value === null) return <Navigate to="/" replace />;
  if (template.status !== 'ready' || template.value === null || detail.status !== 'ready' || detail.value === null) {
    const failure = [template, detail].find((query) => query.status === 'failed');
    return (
      <Screen title="Exercise" leading={<BackLink to={workoutPath(workoutId)} label="Workout" />}>
        <EmptyState
          message={
            failure?.status === 'failed'
              ? failure.message
              : detail.status === 'ready'
                ? 'This exercise no longer exists.'
                : 'Loading…'
          }
        />
      </Screen>
    );
  }
  const tab = params.get('tab') === 'charts' ? 'charts' : 'history';
  const machine = params.get('machine');
  return (
    <Screen
      title={detail.value.exercise.name}
      subtitle={`In ${template.value.name}`}
      leading={<BackLink to={workoutPath(workoutId)} label="Workout" />}
    >
      <div className={styles.stack}>
        <SegmentedControl
          label="Exercise sections"
          options={sections}
          value={tab}
          onChange={(next) => {
            const updated = new URLSearchParams(params);
            updated.set('tab', next);
            setParams(updated);
          }}
        />
        {tab === 'history' ? (
          <ExerciseHistoryTab exerciseId={id} tracking={detail.value.exercise.tracking} templateId={workoutId} />
        ) : (
          <ExerciseChartsTab
            exerciseId={id}
            tracking={detail.value.exercise.tracking}
            templateId={workoutId}
            machine={machine}
            onMachine={(value) => {
              const updated = new URLSearchParams(params);
              if (value === null) updated.delete('machine');
              else updated.set('machine', value);
              setParams(updated);
            }}
          />
        )}
        <Link to={`/exercises/${id}`}>All sessions of this exercise</Link>
      </div>
    </Screen>
  );
}
