import { isHardSet } from '../analytics/HardSets';
import type { Database } from '../db/Database';
import type { Muscle } from '../library/Muscle';
import type { SetKind } from '../models/SetKind';
import type { TemplateSessionScope } from './TemplateSessions';
import { localDateKey } from '../support/localDate';

/** One Monday week with a finished session in scope; zero hard sets is real, while no logged effort yields null. */
export interface WeeklyEffortPoint {
  readonly weekStart: string;
  readonly hardSets: number;
  readonly averageRir: number | null;
  readonly hasDeload: boolean;
}

/** Heuristic: Monday-based civil weeks, matching weekly muscle volume; RIR = 10 − RPE (report §12). */
const Week = Object.freeze({ days: 7, maximumRpe: 10 });

/** Completed working-set effort: hard-set count and mean logged RIR (report §12). */
export function summarizeEffort(rows: readonly { readonly kind: SetKind; readonly rpe: number | null }[]): {
  hardSets: number;
  averageRir: number | null;
} {
  const logged = rows.flatMap((row) => (row.rpe === null ? [] : [Week.maximumRpe - row.rpe]));
  return {
    hardSets: rows.filter((row) => isHardSet({ ...row, isCompleted: true })).length,
    averageRir: logged.length === 0 ? null : logged.reduce((sum, rir) => sum + rir, 0) / logged.length,
  };
}

/** Inclusive local date range; unlogged weeks are omitted. Muscle selects direct exercises, retaining zero-set session weeks. */
export function WeeklyEffort(
  db: Database,
  from: Date,
  to: Date,
  muscle?: Muscle,
  scope?: TemplateSessionScope,
): WeeklyEffortPoint[] {
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) return [];
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  const weeks = new Map<string, { hardSets: number; rir: number; logged: number; hasDeload: boolean }>();
  const rows = db.all<{ startedAt: string; kind: SetKind | null; rpe: number | null; deloadStage: number | null }>(
    `
    SELECT w.startedAt, s.kind, s.rpe, we.deloadStage FROM workout w
    LEFT JOIN workoutExercise we ON we.workoutId = w.id
      AND (? IS NULL OR EXISTS (SELECT 1 FROM exerciseMuscle em WHERE em.exerciseId = we.exerciseId AND em.muscleId = ? AND em.role = 'primary'))
    LEFT JOIN workoutSet s ON s.workoutExerciseId = we.id AND s.isCompleted = 1 AND s.kind != 'warmup'
    WHERE w.isInProgress = 0
      AND w.startedAt >= ? AND w.startedAt < ?
      AND (? IS NULL OR w.templateId = ?)
      AND (? IS NULL OR w.templateId IN (SELECT id FROM template WHERE folderId = ?))
    ORDER BY w.startedAt, w.id, we.position, s.position
  `,
    [
      muscle ?? null,
      muscle ?? null,
      start.toISOString(),
      end.toISOString(),
      scope && 'templateId' in scope ? scope.templateId : null,
      scope && 'templateId' in scope ? scope.templateId : null,
      scope && 'folderId' in scope ? scope.folderId : null,
      scope && 'folderId' in scope ? scope.folderId : null,
    ],
  );
  for (const row of rows) {
    const date = new Date(row.startedAt);
    date.setDate(date.getDate() - ((date.getDay() + 6) % Week.days));
    const key = localDateKey(date);
    const week = weeks.get(key) ?? { hardSets: 0, rir: 0, logged: 0, hasDeload: false };
    weeks.set(key, week);
    if (row.deloadStage !== null) week.hasDeload = true;
    if (row.kind === null) continue;
    const effort = summarizeEffort([{ kind: row.kind, rpe: row.rpe }]);
    week.hardSets += effort.hardSets;
    if (effort.averageRir !== null) {
      week.rir += effort.averageRir;
      week.logged += 1;
    }
  }
  return [...weeks].map(([weekStart, week]) => ({
    weekStart,
    hardSets: week.hardSets,
    hasDeload: week.hasDeload,
    averageRir: week.logged === 0 ? null : week.rir / week.logged,
  }));
}
