import type { SetCorrection } from '../../../core/import/StrongImportOptions';
import type { StrongImportPlan, SetContext } from '../../../core/import/StrongImportPlan';
import type { SetFinding } from '../../../core/validation/SetPlausibility';
import { weightText } from '../../format/weightText';

/** A finding paired with its original set context. */
export interface FindingItem {
  readonly finding: SetFinding;
  readonly context: SetContext;
}
/** Findings for one exercise in one workout. */
export interface FindingGroup {
  readonly key: string;
  readonly date: string;
  readonly name: string;
  readonly items: FindingItem[];
}

/** Groups findings by workout date and exercise, ignoring missing set contexts. */
export function groupFindings(plan: StrongImportPlan): FindingGroup[] {
  const groups = new Map<string, FindingGroup>();
  for (const finding of plan.findings) {
    const context = plan.setsByLine.get(finding.id);
    if (context === undefined) continue;
    const key = JSON.stringify([context.workoutStartedAt, context.exerciseName]);
    let group = groups.get(key);
    if (group === undefined) {
      group = { key, date: context.workoutStartedAt, name: context.exerciseName, items: [] };
      groups.set(key, group);
    }
    group.items.push({ finding, context });
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}
/** Converts a suggested value into a weight in kilograms or rounded reps. */
export function correction(finding: SetFinding, value: number): SetCorrection {
  return finding.issue === 'weightTooHigh' || finding.issue === 'weightTooLow'
    ? { weightKilograms: value }
    : { reps: Math.round(value) };
}
/** Formats an import date for display. */
export function dateText(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
/** Formats the plan date range, or a dash when unavailable. */
export function dateRange(plan: StrongImportPlan): string {
  return plan.totals.firstDate === null || plan.totals.lastDate === null
    ? '—'
    : `${dateText(plan.totals.firstDate)} – ${dateText(plan.totals.lastDate)}`;
}
/** Describes why a set was flagged. */
export function explanation(item: FindingItem): string {
  const { finding, context } = item;
  if (finding.issue === 'zeroReps') return '0 reps';
  if (finding.issue === 'repsTooHigh') return `usually ~${Math.round(finding.typical)} reps`;
  return `usually ~${weightText(finding.typical, context.set.entryUnit)}`;
}
/** Formats a suggested weight or reps, or an empty string when absent. */
export function suggestionText(item: FindingItem): string {
  const value = item.finding.suggestion;
  if (value === null) return '';
  return item.finding.issue === 'weightTooHigh' || item.finding.issue === 'weightTooLow'
    ? weightText(value, item.context.set.entryUnit)
    : `${Math.round(value)} reps`;
}
