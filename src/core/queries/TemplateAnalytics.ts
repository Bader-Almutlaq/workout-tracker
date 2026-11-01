import { localDateKey } from '../support/localDate';
import { muscleVolume } from '../analytics/MuscleVolume';
import type { Database } from '../db/Database';
import type { Muscle } from '../library/Muscle';
import type { MuscleRole } from '../library/MuscleRole';
import type { SetKind } from '../models/SetKind';
import { MuscleDashboard } from './MuscleDashboard';
import { intensityMix } from './IntensityMix';
import { ExerciseProgress } from './ExerciseProgress';
import { templateMuscleSummary } from './TemplateMuscleSummary';
import { TemplateSessions, type TemplateSessionScope } from './TemplateSessions';
import { typicalDuration } from './TrainingSummary';
import { summarizeEffort, WeeklyEffort } from './WeeklyEffort';

/** Heuristic: calendar weeks start Monday; comparisons use at most four weeks ending with the latest finished session’s week and eight plotted sessions. */
const Window = Object.freeze({
  daysPerWeek: 7,
  comparisonWeeks: 4,
  sparklineSessions: 8,
  millisecondsPerDay: 86400000,
});

function monday(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % Window.daysPerWeek));
  return result;
}

/** Sessions from the nth-last non-deload one onward, so deloads in that span stay visible as marks. */
function sinceNthLastNormal<T extends { readonly isDeload: boolean }>(
  sessions: readonly T[],
  count: number,
): readonly T[] {
  const normal = sessions.filter((session) => !session.isDeload);
  const first = normal.at(-count) ?? normal[0];
  return first === undefined ? sessions : sessions.slice(sessions.indexOf(first));
}

/** Scoped workout or plan analytics. Durations are seconds, loads kg, and fractional sets per week. */
export function TemplateAnalytics(db: Database, scope: TemplateSessionScope, now = new Date()) {
  const history = TemplateSessions.read(db, scope);
  const planned = templateMuscleSummary(db, scope);
  const templates = db.all<{ id: number; name: string; weekday: number | null }>(
    `SELECT id, name, weekday FROM template WHERE ${'templateId' in scope ? 'id' : 'folderId'} = ? ORDER BY position, id`,
    ['templateId' in scope ? scope.templateId : scope.folderId],
  );
  const exercises = templates.map((template) => ({
    ...template,
    exercises: db
      .all<{ exerciseId: number; name: string }>(
        `SELECT te.exerciseId, e.name FROM templateExercise te JOIN exercise e ON e.id = te.exerciseId
       WHERE te.templateId = ? ORDER BY te.position, te.id`,
        [template.id],
      )
      .map((exercise) => {
        const progress = ExerciseProgress(db, exercise.exerciseId, now, template.id);
        return {
          ...exercise,
          templateId: template.id,
          sessions: sinceNthLastNormal(progress.sessions, Window.sparklineSessions),
          changes: progress.changes,
          latestTopSet: progress.sessions.at(-1)?.topSet ?? null,
        };
      }),
  }));
  const perSession =
    'templateId' in scope
      ? [...history.sessions].reverse().map((session) => {
          const rows = db.all<{ kind: SetKind; rpe: number | null }>(
            `SELECT s.kind, s.rpe FROM workoutExercise we JOIN workoutSet s ON s.workoutExerciseId = we.id
       WHERE we.workoutId = ? AND s.isCompleted = 1 AND s.kind != 'warmup'`,
            [session.id],
          );
          const isDeload =
            (db.value<number>(
              `SELECT EXISTS(SELECT 1 FROM workoutExercise WHERE workoutId = ? AND deloadStage IS NOT NULL)`,
              [session.id],
            ) ?? 0) === 1;
          return { date: session.startedAt, workoutId: session.id, isDeload, ...summarizeEffort(rows) };
        })
      : [];
  const first = history.sessions.at(-1);
  const latest = history.sessions[0];
  const latestMonday = latest === undefined ? null : monday(new Date(latest.startedAt));
  const firstMonday = first === undefined ? null : monday(new Date(first.startedAt));
  const weeksAvailable =
    firstMonday === null || latestMonday === null
      ? 0
      : Math.min(
          Window.comparisonWeeks,
          Math.round(
            (Date.UTC(latestMonday.getFullYear(), latestMonday.getMonth(), latestMonday.getDate()) -
              Date.UTC(firstMonday.getFullYear(), firstMonday.getMonth(), firstMonday.getDate())) /
              Window.millisecondsPerDay /
              Window.daysPerWeek,
          ) + 1,
        );
  const end = latestMonday === null ? monday(now) : new Date(latestMonday);
  end.setDate(end.getDate() + Window.daysPerWeek);
  const start = new Date(end);
  start.setDate(start.getDate() - weeksAvailable * Window.daysPerWeek);
  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  const weekly =
    'folderId' in scope && firstMonday !== null && firstMonday <= now
      ? WeeklyEffort(db, firstMonday, now, undefined, scope)
      : [];
  const selected = history.sessions.filter(
    (session) => new Date(session.startedAt) >= start && new Date(session.startedAt) < end,
  );
  const rows =
    weeksAvailable > 0
      ? db.all<{
          workoutId: number;
          muscle: Muscle;
          role: MuscleRole;
          kind: SetKind;
          rpe: number | null;
          isCompleted: number;
          exerciseId: number;
          name: string;
        }>(
          `SELECT w.id AS workoutId, em.muscleId AS muscle, em.role, s.kind, s.rpe, s.isCompleted, e.id AS exerciseId, e.name
     FROM workout w JOIN workoutExercise we ON we.workoutId = w.id
     JOIN workoutSet s ON s.workoutExerciseId = we.id JOIN exercise e ON e.id = we.exerciseId
     JOIN exerciseMuscle em ON em.exerciseId = e.id
     WHERE w.isInProgress = 0 AND ${'templateId' in scope ? 'w.templateId = ?' : 'w.templateId IN (SELECT id FROM template WHERE folderId = ?)'}
       AND w.startedAt >= ? AND w.startedAt < ?`,
          ['templateId' in scope ? scope.templateId : scope.folderId, start.toISOString(), end.toISOString()],
        )
      : [];
  const sets = rows.map((row) => ({ ...row, isCompleted: row.isCompleted === 1 }));
  const volume = muscleVolume(sets);
  const musclesDoneVsPlanned = planned.muscles.map((item) => ({
    muscle: item.muscle,
    planned: item.fractional,
    done:
      weeksAvailable === 0
        ? null
        : (volume.find((entry) => entry.muscle === item.muscle)?.totalSets ?? 0) / weeksAvailable,
    contributions: [
      ...new Map(rows.filter((row) => row.muscle === item.muscle).map((row) => [row.exerciseId, row.name])).entries(),
    ]
      .map(([exerciseId, name]) => ({
        exerciseId,
        name,
        fractional:
          weeksAvailable === 0
            ? 0
            : (muscleVolume(sets.filter((row) => row.muscle === item.muscle && row.exerciseId === exerciseId)).find(
                (entry) => entry.muscle === item.muscle,
              )?.totalSets ?? 0) / weeksAvailable,
      }))
      .filter((item) => item.fractional > 0),
  }));
  return {
    sessionCount: history.sessions.length,
    typicalSessionSeconds: typicalDuration(history.sessions),
    /** Inclusive local ISO date of the Sunday ending the latest finished session's week; null without history. */
    windowEnd: latest === undefined ? null : localDateKey(lastDay),
    /** Heuristic: after seven elapsed days, label the historical window instead of planned frequency. */
    windowIsHistorical:
      latest !== undefined &&
      now.getTime() - Date.parse(latest.startedAt) > Window.daysPerWeek * Window.millisecondsPerDay,
    weeksAvailable,
    sessionsPerWeek: weeksAvailable === 0 ? null : selected.length / weeksAvailable,
    plannedWorkouts: planned.workouts,
    lastSession:
      'templateId' in scope && history.sessions[0] !== undefined
        ? { workingSets: history.sessions[0].workingSetCount, plannedWorkingSets: planned.sets }
        : null,
    exercises,
    perSession,
    weekly,
    musclesDoneVsPlanned,
    muscleDashboard:
      'folderId' in scope && weeksAvailable > 0 ? MuscleDashboard(db, start, lastDay, scope.folderId) : [],
    intensityMix:
      'folderId' in scope && weeksAvailable > 0 ? intensityMix(db, start, lastDay, undefined, scope.folderId) : null,
  };
}
