import { ExerciseProgressTab } from './ExerciseProgressTab';
import { ExerciseTimedCharts } from './ExerciseTimedCharts';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';

/** Shared exercise Progress content; timed tracking retains its applicable duration/load charts. */
export function ExerciseChartsTab(props: {
  readonly exerciseId: number;
  readonly tracking: ExerciseTracking;
  readonly templateId?: number;
  readonly machine?: string | null;
  readonly onMachine?: (value: string | null) => void;
  readonly unit?: WeightUnit;
}) {
  if (props.tracking === 'duration' || props.tracking === 'weight-duration') return <ExerciseTimedCharts {...props} />;
  return (
    <ExerciseProgressTab
      key={`${props.exerciseId}-${props.templateId}-${props.machine}`}
      {...props}
      unit={props.unit ?? 'kg'}
      bodyweight={props.tracking === 'bodyweight-reps'}
    />
  );
}
