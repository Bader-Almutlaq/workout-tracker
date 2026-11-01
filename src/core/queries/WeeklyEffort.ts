import { isHardSet } from '../analytics/HardSets';
import type { Database } from '../db/Database';
import type { Muscle } from '../library/Muscle';
import type { SetKind } from '../models/SetKind';
import type { TemplateSessionScope } from './TemplateSessions';
import { localDateKey } from '../support/localDate';

/** One Monday week of hard sets and mean logged RIR; no logged effort yields null. */
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

/** Inclusive local date range, zero-filled by Monday week; muscle selects direct exercises. */
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
  const monday = new Date(start);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % Week.days));
  const weeks = new Map<string, { hardSets: number; rir: number; logged: number; hasDeload: boolean }>();
  for (const cursor = new Date(monday); cursor < end; cursor.setDate(cursor.getDate() + Week.days)) {
    weeks.set(localDateKey(cursor), { hardSets: 0, rir: 0, logged: 0, hasDeload: false });
  }
  const rows = db.all<{ startedAt: string; kind: SetKind; rpe: number | null; deloadStage: number | null }>(
    `
    SELECT w.startedAt, s.kind, s.rpe, we.deloadStage FROM workout w
    JOIN workoutExercise we ON we.workoutId = w.id JOIN workoutSet s ON s.workoutExerciseId = we.id
    WHERE w.isInProgress = 0 AND s.isCompleted = 1 AND s.kind != 'warmup'
      AND w.startedAt >= ? AND w.startedAt < ?
      AND (? IS NULL OR w.templateId = ?)
      AND (? IS NULL OR w.templateId IN (SELECT id FROM template WHERE folderId = ?))
      AND (? IS NULL OR EXISTS (SELECT 1 FROM exerciseMuscle em WHERE em.exerciseId = we.exerciseId AND em.muscleId = ? AND em.role = 'primary'))
  `,
    [
      start.toISOString(),
      end.toISOString(),
      scope && 'templateId' in scope ? scope.templateId : null,
      scope && 'templateId' in scope ? scope.templateId : null,
      scope && 'folderId' in scope ? scope.folderId : null,
      scope && 'folderId' in scope ? scope.folderId : null,
      muscle ?? null,
      muscle ?? null,
    ],
  );
  for (const row of rows) {
    const date = new Date(row.startedAt);
    date.setDate(date.getDate() - ((date.getDay() + 6) % Week.days));
    const week = weeks.get(localDateKey(date));
    if (week === undefined) continue;
    if (row.deloadStage !== null) week.hasDeload = true;
    const effort = summarizeEffort([row]);
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
