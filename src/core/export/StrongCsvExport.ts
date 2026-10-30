import type { Database } from '../db/Database';

interface WorkoutRow {
  workoutId: number;
  startedAt: string;
  endedAt: string | null;
  workoutName: string;
  workoutNotes: string | null;
  exerciseId: number;
  exerciseName: string;
  exerciseNotes: string | null;
  kind: string;
  weightKilograms: number;
  reps: number;
  distanceMeters: number | null;
  durationSeconds: number | null;
  notes: string | null;
  rpe: number | null;
}

/** Heuristic: database fields lost or recreated when completed records pass through Strong CSV. */
export const StrongCsvRoundTripLosses = [
  'workout.id',
  'workout.source',
  'workout.sourceKey',
  'workout.templateId',
  'workoutExercise.id',
  'workoutExercise.exerciseId',
  'workoutExercise.supersetGroup',
  'workoutExercise.notes',
  'workoutSet.id',
  'workoutSet.entryUnit',
  'workoutSet.side',
  'workoutSet.restBeforeSeconds',
  'workoutSet.completedAt',
  'bodyMeasurement.id',
  'bodyMeasurement.source',
  'bodyMeasurement.entryUnit',
] as const;

/** RFC 4180 record, with embedded quotes doubled and fields quoted when necessary. */
export function csvRecord(fields: readonly (string | number | null)[]): string {
  return fields
    .map((field) => {
      const value = field === null ? '' : String(field);
      return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
    })
    .join(',');
}

/** Formats an instant as a local Strong timestamp, at whole-second precision. */
export function strongLocalTimestamp(instant: string): string {
  const date = new Date(instant);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Formats elapsed seconds in Strong's duration syntax, including seconds when needed. */
export function strongDuration(start: string, end: string | null): string {
  if (end === null) return '';
  const seconds = (Date.parse(end) - Date.parse(start)) / 1000;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const parts = [
    hours ? `${hours}h` : '',
    minutes ? `${minutes}m` : '',
    remainder || seconds === 0 ? `${remainder}s` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

/** Exports completed sets of finished workouts as the older Strong CSV layout, with weights in kg. */
export function exportStrongCsv(db: Database): string {
  const rows = db.all<WorkoutRow>(`
    SELECT w.id AS workoutId, w.startedAt, w.endedAt, w.name AS workoutName, w.notes AS workoutNotes,
      we.id AS exerciseId, e.name AS exerciseName, we.notes AS exerciseNotes,
      s.kind, s.weightKilograms, s.reps, s.distanceMeters, s.durationSeconds, s.notes, s.rpe
    FROM workout w
    JOIN workoutExercise we ON we.workoutId = w.id
    JOIN exercise e ON e.id = we.exerciseId
    JOIN workoutSet s ON s.workoutExerciseId = we.id
    WHERE w.isInProgress = 0 AND s.isCompleted = 1
    ORDER BY w.startedAt, w.id, we.position, we.id, s.position, s.id
  `);
  const records = [
    'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
  ];
  let workoutId: number | undefined;
  let exerciseId: number | undefined;
  let workCount = 0;
  for (const row of rows) {
    const firstWorkout = row.workoutId !== workoutId;
    const firstExercise = row.exerciseId !== exerciseId;
    if (firstExercise) workCount = 0;
    if (row.kind !== 'warmup') workCount += 1;
    const order =
      row.kind === 'warmup' ? 'W' : row.kind === 'drop' ? 'D' : row.kind === 'failure' ? 'F' : String(workCount);
    records.push(
      csvRecord([
        strongLocalTimestamp(row.startedAt),
        row.workoutName,
        strongDuration(row.startedAt, row.endedAt),
        row.exerciseName,
        order,
        row.weightKilograms,
        row.reps,
        row.distanceMeters,
        row.durationSeconds,
        row.notes ?? (firstExercise ? row.exerciseNotes : null),
        firstWorkout ? row.workoutNotes : null,
        row.rpe,
      ]),
    );
    workoutId = row.workoutId;
    exerciseId = row.exerciseId;
  }
  return `${records.join('\r\n')}\r\n`;
}
