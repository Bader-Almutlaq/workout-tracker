import { useParams, useSearchParams } from 'react-router';
import type { CustomExerciseDraft } from '../../../core/library/CustomExerciseDraft';
import { database, useDatabaseQuery } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { draftFromDetail } from './exerciseDraft';
import { ExerciseForm } from './ExerciseForm';
import { RETURN_TO_PARAM, safeReturnPath } from './returnPath';

const MISSING_MESSAGE = 'This exercise no longer exists.';

/**
 * Creates or edits an exercise. Three ways in, all the same form:
 * - `/exercises/new` starts empty (or with `?name=` already typed, from a search that found nothing);
 * - `/exercises/new?copy=ID` starts as a copy of exercise ID;
 * - `/exercises/ID/edit` edits that exercise. `?next=PATH` says where to go afterwards.
 */
export function ExerciseFormScreen() {
  const [params] = useSearchParams();
  const editId = useParams().exerciseId;
  const copyId = params.get('copy');
  const sourceId = editId ?? copyId;
  const source = useDatabaseQuery(`exercise-${sourceId ?? 'none'}`, () =>
    sourceId === null ? Promise.resolve(null) : database.exerciseDetail(Number(sourceId)),
  );
  const returnTo = safeReturnPath(params.get(RETURN_TO_PARAM));
  const backPath = returnTo ?? (editId === undefined ? '/exercises' : `/exercises/${editId}`);
  const title = editId === undefined ? 'New exercise' : 'Edit exercise';
  const back = <BackLink to={backPath} label="Cancel" />;

  if (sourceId !== null && source.status !== 'ready') {
    return (
      <Screen title={title} leading={back}>
        <EmptyState message={source.status === 'loading' ? 'Loading…' : source.message} />
      </Screen>
    );
  }
  const detail = source.status === 'ready' ? source.value : null;
  if (sourceId !== null && detail === null) {
    return (
      <Screen title={title} leading={back}>
        <EmptyState message={MISSING_MESSAGE} />
      </Screen>
    );
  }

  const initial: CustomExerciseDraft =
    detail === null ? { name: params.get('name') ?? '' } : draftFromDetail(detail, editId === undefined);

  return (
    <Screen title={title} leading={back}>
      <ExerciseForm
        exerciseId={editId === undefined ? undefined : Number(editId)}
        initial={initial}
        unit={detail?.exercise.defaultEntryUnit ?? 'kg'}
        loadingOnly={editId !== undefined && detail !== null && detail.exercise.libraryKey !== null}
        backPath={backPath}
      />
    </Screen>
  );
}
