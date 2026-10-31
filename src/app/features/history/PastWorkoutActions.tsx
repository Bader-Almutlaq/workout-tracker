import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Workout } from '../../../core/models/Workout';
import { database } from '../../data/database';
import { Button } from '../../design/components/Button';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { dayAndTimeText } from '../../format/dateText';
import { AddToPlanDialog } from './AddToPlanDialog';
import { repeatWorkout } from '../workout/workoutActions';
import { loggingQueue } from '../workout/loggingQueue';

/** Edit and delete are available only after their safety snapshot succeeds; repeated taps cannot create duplicate sessions. */
export function PastWorkoutActions({ workout, onEdit }: { readonly workout: Workout; readonly onEdit: () => void }) {
  const [isBusy, setIsBusy] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const begin = () => {
    setIsBusy(true);
    void loggingQueue
      .enqueue(async () => {
        await database.beginPastWorkoutEdit(workout.id);
        return true;
      })
      .then((saved) => {
        setIsBusy(false);
        if (saved === true) onEdit();
      });
  };
  const remove = () => {
    setIsBusy(true);
    void loggingQueue
      .enqueue(async () => {
        await database.deletePastWorkout(workout.id);
        return true;
      })
      .then((saved) => {
        setIsBusy(false);
        setIsDeleting(false);
        if (saved === true) navigate('/history');
      });
  };
  return (
    <>
      <Button
        isDisabled={isBusy}
        onPress={() => {
          setIsBusy(true);
          void repeatWorkout(workout.id).then((result) => {
            setIsBusy(false);
            if (result !== undefined) navigate('/');
          });
        }}
      >
        Repeat this workout
      </Button>
      <Button isDisabled={isBusy} onPress={() => setIsAdding(true)}>
        Add to plan…
      </Button>
      {isAdding && <AddToPlanDialog workoutId={workout.id} name={workout.name} onClose={() => setIsAdding(false)} />}
      <Button onPress={begin} isDisabled={isBusy}>
        Edit
      </Button>
      <Button variant="destructive" onPress={() => setIsDeleting(true)} isDisabled={isBusy}>
        Delete workout
      </Button>
      {isDeleting && (
        <ConfirmDialog
          title={`Delete ${workout.name} on ${dayAndTimeText(workout.startedAt)}?`}
          confirmLabel="Delete workout"
          isBusy={isBusy}
          onConfirm={remove}
          onCancel={() => {
            if (!isBusy) setIsDeleting(false);
          }}
        >
          This can't be undone in the app; a safety copy is kept.
        </ConfirmDialog>
      )}
    </>
  );
}
