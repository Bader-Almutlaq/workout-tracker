import { HardSetPolicy } from '../analytics/HardSets';
import type { Database } from '../db/Database';
import { MUSCLES, type Muscle } from '../library/Muscle';
import type { MuscleRole } from '../library/MuscleRole';

/** One exercise's planned sets and the saved workouts containing them. */
export interface TemplateMuscleContribution {
  readonly exerciseId: number;
  readonly name: string;
  readonly direct: number;
  readonly indirect: number;
  readonly fractional: number;
  readonly workouts: readonly string[];
}

/** Planned direct and unweighted indirect sets, fractional sets, and qualifying workouts per muscle. */
export interface TemplateMuscleRow {
  readonly muscle: Muscle;
  readonly direct: number;
  readonly indirect: number;
  readonly fractional: number;
  readonly frequency: number;
  readonly contributions: readonly TemplateMuscleContribution[];
}

/** A planned week or workout, including empty muscles and non-warm-up set totals. */
export interface TemplateMuscleSummary {
  readonly sets: number;
  readonly workouts: number;
  readonly exercises: number;
  readonly secondaryWeight: number;
  readonly muscles: readonly TemplateMuscleRow[];
}

/**
 * Summarises saved templates as one week. Fractional sets = direct + indirect × secondary weight;
 * frequency counts workouts with at least one fractional set. Source: research report §12,
 * Pelland 2025; planned sets count regardless of target effort and exclude warm-ups.
 */
export function templateMuscleSummary(
  db: Database,
  scope: { readonly folderId: number } | { readonly templateId: number },
): TemplateMuscleSummary {
  const column = 'folderId' in scope ? 'folderId' : 'id';
  const id = 'folderId' in scope ? scope.folderId : scope.templateId;
  const templates = db.all<{ id: number; name: string }>(
    `SELECT id, name FROM template WHERE ${column} = ? ORDER BY position, id`,
    [id],
  );
  const muscles = MUSCLES.map((muscle) => ({
    muscle,
    direct: 0,
    indirect: 0,
    fractional: 0,
    frequency: 0,
    // An empty array needs an element type before contributions are accumulated.
    contributions: [] as {
      exerciseId: number;
      name: string;
      direct: number;
      indirect: number;
      fractional: number;
      workouts: string[];
    }[],
  }));
  let sets = 0;
  let exercises = 0;
  for (const template of templates) {
    const entries = db.all<{ id: number; exerciseId: number; name: string }>(
      `SELECT te.id, te.exerciseId, e.name FROM templateExercise te
       JOIN exercise e ON e.id = te.exerciseId WHERE te.templateId = ?`,
      [template.id],
    );
    exercises += entries.length;
    const workoutTotals = new Map<Muscle, number>();
    for (const entry of entries) {
      const count =
        db.value<number>("SELECT COUNT(*) FROM templateSet WHERE templateExerciseId = ? AND kind != 'warmup'", [
          entry.id,
        ]) ?? 0;
      sets += count;
      if (count === 0) continue;
      const roles = db.all<{ muscleId: Muscle; role: MuscleRole }>(
        'SELECT muscleId, role FROM exerciseMuscle WHERE exerciseId = ?',
        [entry.exerciseId],
      );
      for (const role of roles) {
        const row = muscles.find((item) => item.muscle === role.muscleId);
        if (row === undefined) continue;
        const weight = role.role === 'primary' ? HardSetPolicy.primaryWeight : HardSetPolicy.secondaryWeight;
        if (role.role === 'primary') row.direct += count;
        else row.indirect += count;
        row.fractional += count * weight;
        let contribution = row.contributions.find((item) => item.exerciseId === entry.exerciseId);
        if (contribution === undefined) {
          contribution = {
            exerciseId: entry.exerciseId,
            name: entry.name,
            direct: 0,
            indirect: 0,
            fractional: 0,
            workouts: [],
          };
          row.contributions.push(contribution);
        }
        if (role.role === 'primary') contribution.direct += count;
        else contribution.indirect += count;
        contribution.fractional += count * weight;
        if (!contribution.workouts.includes(template.name)) contribution.workouts.push(template.name);
        workoutTotals.set(role.muscleId, (workoutTotals.get(role.muscleId) ?? 0) + count * weight);
      }
    }
    for (const row of muscles) {
      if ((workoutTotals.get(row.muscle) ?? 0) >= HardSetPolicy.primaryWeight) row.frequency += 1;
    }
  }
  for (const row of muscles) {
    row.contributions.sort((a, b) => b.fractional - a.fractional || a.name.localeCompare(b.name));
  }
  return { sets, workouts: templates.length, exercises, secondaryWeight: HardSetPolicy.secondaryWeight, muscles };
}
