import { useState } from 'react';
import { log } from '../../../core/support/log';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { database, messageOf } from '../../data/database';
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
    <div className={styles.actions}>
      {isBuiltIn ? (
        <>
          <LinkButton to={`/exercises/${exercise.id}/edit`}>Edit loading</LinkButton>
          <LinkButton to={`/exercises/new?copy=${exercise.id}`}>Duplicate as my own</LinkButton>
        </>
      ) : (
        <LinkButton to={`/exercises/${exercise.id}/edit`}>Edit</LinkButton>
      )}
      <Button variant="quiet" onPress={() => void setArchived(!exercise.isArchived)}>
        {exercise.isArchived ? 'Unarchive' : 'Archive'}
      </Button>
      {error !== undefined && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
