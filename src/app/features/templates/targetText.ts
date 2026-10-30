import type { TemplateSetDraft } from '../../../core/templates/TemplateDraft';
import { rpeNumberText } from '../../format/setText';

/** The reps part of a target: "8–12", "8", or "up to 12" when only the top is set. Empty when neither is set. */
function repsText(low: number | null, high: number | null): string {
  if (low !== null && high !== null) return low === high ? String(low) : `${low}–${high}`;
  if (low !== null) return String(low);
  if (high !== null) return `up to ${high}`;
  return '';
}

/**
 * A set's targets as the owner wrote them, e.g. "8–12 @ RPE 8", "8–12" or "RPE 8". Empty when the
 * set has no targets; the app never fills one in.
 */
export function targetText(set: Pick<TemplateSetDraft, 'targetRepsLow' | 'targetRepsHigh' | 'targetRpe'>): string {
  const reps = repsText(set.targetRepsLow, set.targetRepsHigh);
  const effort = set.targetRpe === null ? '' : `RPE ${rpeNumberText(set.targetRpe)}`;
  if (reps !== '' && effort !== '') return `${reps} @ ${effort}`;
  return reps || effort;
}
