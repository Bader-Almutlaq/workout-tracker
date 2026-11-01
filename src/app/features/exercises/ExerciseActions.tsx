import { useState } from 'react';
import { log } from '../../../core/support/log';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import { Button } from '../../design/components/Button';
import { LinkButton } from '../../design/components/LinkButton';
import styles from './ExerciseActions.module.css';

/**
 * What the owner can do with an exercise. Built-in exercises can be duplicated into the owner's
 * own; the owner's own and Strong exercises can be edited; any can be archived or brought back.
 */
export function ExerciseActions({ detail }: { readonly detail: ExerciseCatalogDetail }) {
  const [error, setError] = useState<string>();
  const { exercise } = detail;
  const pins = useDatabaseQuery('pinned-exercises', () => database.pinnedExercises());
  const isPinned = pins.status === 'ready' && pins.value.some((pin) => pin.exerciseId === exercise.id);
  const togglePin = async () => {
    try {
      setError(undefined);
      if (isPinned) await database.unpinExercise(exercise.id);
      else await database.pinExercise(exercise.id);
    } catch (failure) {
      log.ui.error('Changing exercise pin failed', failure);
      setError(messageOf(failure));
    }
  };
  const isBuiltIn = exercise.libraryKey !== null;

  const setArchived = async (isArchived: boolean) => {
    try {
      setError(undefined);
      await database.setExerciseArchived(exercise.id, isArchived);
    } catch (failure) {
      log.ui.error('Archiving an exercise failed', failure);
      setError(messageOf(failure));
    }
  };

  return (
    <details>
      <summary className={styles.menu}>
        ⋯ <span>Exercise actions</span>
      </summary>
      <div className={styles.actions}>
        {isBuiltIn ? (
          <>
            <LinkButton to={`/exercises/${exercise.id}/edit`}>Edit loading</LinkButton>
            <LinkButton to={`/exercises/new?copy=${exercise.id}`}>Duplicate as my own</LinkButton>
          </>
        ) : (
          <LinkButton to={`/exercises/${exercise.id}/edit`}>Edit</LinkButton>
        )}
        {exercise.tracking === 'weight-reps' && (
          <Button variant="quiet" isDisabled={pins.status !== 'ready'} onPress={() => void togglePin()}>
            {isPinned ? 'Unpin from Analytics' : 'Pin to Analytics'}
          </Button>
        )}
        {pins.status === 'failed' && <p role="alert">{pins.message}</p>}
        <Button variant="quiet" onPress={() => void setArchived(!exercise.isArchived)}>
          {exercise.isArchived ? 'Unarchive' : 'Archive'}
        </Button>
        {error !== undefined && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
