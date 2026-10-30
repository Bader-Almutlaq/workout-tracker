import { useState } from 'react';
import type { LiveWorkoutSnapshot } from '../../../core/queries/LiveWorkout';
import { Button } from '../../design/components/Button';
import { Screen } from '../../design/components/Screen';
import { EmptyState } from '../../design/components/EmptyState';
import { ExerciseCard } from '../workout/ExerciseCard';
import { LoggingErrorBanner } from '../workout/LoggingErrorBanner';
import { loggingQueue, useLoggingError } from '../workout/loggingQueue';
import { NumberPad } from '../workout/NumberPad';
import { padTitle } from '../workout/padTitle';
import { recordsWeight } from '../workout/trackingKinds';
import { TypoPromptDialog } from '../workout/TypoPromptDialog';
import { PastWorkoutExercisePicker } from './PastWorkoutExercisePicker';
import { PastWorkoutMetadata } from './PastWorkoutMetadata';
import { usePastWorkoutEditor } from './usePastWorkoutEditor';
import styles from './PastWorkoutEditor.module.css';

/** A snapshotted History edit session reuses live set cards, pad and typo check; Done waits for writes. */
export function PastWorkoutEditor({
  snapshot,
  onDone,
}: {
  readonly snapshot: LiveWorkoutSnapshot;
  readonly onDone: () => void;
}) {
  const model = usePastWorkoutEditor(snapshot, onDone);
  const [isPicking, setIsPicking] = useState(false);
  const error = useLoggingError();
  const { editing } = model.editor;
  const { entries, workout } = snapshot;
  if (isPicking) return <PastWorkoutExercisePicker workoutId={workout.id} onClose={() => setIsPicking(false)} />;
  return (
    <Screen
      title={`Edit ${workout.name}`}
      leading={
        <Button variant="primary" onPress={model.done}>
          Done
        </Button>
      }
    >
      <LoggingErrorBanner />
      <PastWorkoutMetadata workout={workout} />
      {entries.length === 0 && <EmptyState message="Add an exercise to this workout." />}
      <div className={styles.cards}>
        {entries.map((entry, index) => (
          <ExerciseCard
            key={entry.entry.id}
            entry={entry}
            index={index}
            count={entries.length}
            editing={editing?.entry.entry.id === entry.entry.id ? editing : undefined}
            actions={model.cardActions}
            notes={{
              exercise: (value) => model.saveExerciseNotes(entry.entry.id, value),
              set: model.saveSetNotes,
            }}
          />
        ))}
      </div>
      <Button
        onPress={() => {
          model.editor.close();
          setIsPicking(true);
        }}
      >
        Add exercise
      </Button>
      {editing !== undefined && (
        <NumberPad
          title={padTitle(editing.cell.field, editing.entry.exercise.tracking, editing.set.entryUnit)}
          allowsDecimal={editing.cell.field !== 'reps'}
          unit={
            editing.cell.field === 'weight' && recordsWeight(editing.entry.exercise.tracking)
              ? editing.set.entryUnit
              : undefined
          }
          errorMessage={error}
          onDismissError={() => loggingQueue.dismissError()}
          onKey={model.editor.press}
          onStep={model.editor.step}
          onNext={model.editor.next}
          onDone={model.editor.close}
          onUnitChange={model.switchEditedUnit}
        />
      )}
      {model.typoPrompt !== undefined && (
        <TypoPromptDialog prompt={model.typoPrompt} onSaveAnyway={model.saveAnyway} onFix={model.fix} />
      )}
    </Screen>
  );
}
