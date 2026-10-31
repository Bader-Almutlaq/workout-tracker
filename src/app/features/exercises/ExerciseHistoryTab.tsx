import { useState } from 'react';
import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import { ExerciseHistoryPolicy } from '../../../core/queries/ExerciseSeries';
import { ExerciseHistoryPage } from './ExerciseHistoryPage';

/** Bounded session pages keep long histories from growing the DOM indefinitely. */
export function ExerciseHistoryTab({
  exerciseId,
  tracking,
}: {
  readonly exerciseId: number;
  readonly tracking: ExerciseTracking;
}) {
  const [offset, setOffset] = useState(0);
  return (
    <ExerciseHistoryPage
      key={offset}
      exerciseId={exerciseId}
      tracking={tracking}
      offset={offset}
      onPrevious={() => setOffset(Math.max(0, offset - ExerciseHistoryPolicy.pageSize))}
      onNext={() => setOffset(offset + ExerciseHistoryPolicy.pageSize)}
    />
  );
}
