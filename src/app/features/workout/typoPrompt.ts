import type { SetFinding } from '../../../core/validation/SetPlausibility';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import { weightText } from '../../format/weightText';
import type { Field } from './Cell';

/** A set the "Is this right?" check flagged, waiting for the owner to save it anyway or fix it. */
export interface TypoPrompt {
  readonly setId: number;
  /** The cell that holds the doubtful number, which "Fix" opens on the pad. */
  readonly field: Field;
  /** What the dialog says. */
  readonly message: string;
}

/** The parts of a set the message quotes. */
type PromptSet = Pick<WorkoutSet, 'id' | 'weightKilograms' | 'entryUnit' | 'reps'>;

/** The cell the finding is about: the weight for weight issues, otherwise the reps. */
export function typoPromptField(finding: SetFinding): Field {
  return finding.issue === 'weightTooHigh' || finding.issue === 'weightTooLow' ? 'weight' : 'reps';
}

/**
 * The prompt for `set` given what the check found. Weights are quoted in the unit the set was typed
 * in, and the likeliest intended value is offered when the check has one. Descriptive, never a verdict.
 */
export function typoPromptFor(finding: SetFinding, set: PromptSet): TypoPrompt {
  const { entryUnit } = set;
  const suggestion = finding.suggestion;
  const weightSuggestion = suggestion === null ? '' : ` Did you mean ${weightText(suggestion, entryUnit)}?`;
  const repsSuggestion = suggestion === null ? '' : ` Did you mean ${Math.round(suggestion)}?`;
  const typical = (): string => weightText(finding.typical, entryUnit);
  let message: string;
  switch (finding.issue) {
    case 'weightTooHigh':
      message = `${weightText(set.weightKilograms, entryUnit)} is far above your usual ${typical()}.${weightSuggestion}`;
      break;
    case 'weightTooLow':
      message = `${weightText(set.weightKilograms, entryUnit)} is far below your usual ${typical()}.${weightSuggestion}`;
      break;
    case 'repsTooHigh':
      message = `${set.reps} reps is far above your usual ${Math.round(finding.typical)}.${repsSuggestion}`;
      break;
    case 'zeroReps':
      message = 'This set has no reps.';
      break;
  }
  return { setId: set.id, field: typoPromptField(finding), message };
}
