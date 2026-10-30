import type { SetKind } from '../models/SetKind';
import { groupBy } from '../support/groupBy';
import { KILOGRAMS_PER_POUND } from '../units/WeightUnit';

/** The facts the check needs about one set. */
export interface SetObservation {
  /** Caller's identifier, returned in `SetFinding.id` (e.g. the export line number). */
  readonly id: number;
  /** Groups sets of the same exercise, e.g. its name. */
  readonly exerciseKey: string;
  /** Groups sets of the same session, e.g. the workout's start time. */
  readonly sessionKey: string;
  /** When the set was done, as a UTC ISO 8601 timestamp (`toISOString()` form, so it sorts as text). */
  readonly date: string;
  readonly kind: SetKind;
  readonly weightKilograms: number;
  readonly reps: number;
}

/** Why a set was flagged. */
export type SetIssue = 'weightTooHigh' | 'weightTooLow' | 'repsTooHigh' | 'zeroReps';

/** A suspicious set, with what's typical and a likely correction. */
export interface SetFinding {
  /** The `SetObservation.id` of the flagged set. */
  readonly id: number;
  readonly issue: SetIssue;
  /** Typical value nearby: kilograms for weight issues, reps for rep issues. */
  readonly typical: number;
  /** A likely intended value in the same unit as `typical`, or `null` if none fits. */
  readonly suggestion: number | null;
}

/** Tuning constants. Heuristic (no literature applies); adjust against real flags if they prove noisy. */
export const SetPlausibilityThreshold = {
  /** Sessions on each side of a set used to judge what's typical. */
  neighbourSessions: 4,
  /** Fewer neighbouring sessions than this: not enough history to judge. */
  minimumNeighbourSessions: 3,
  /** A weight above this multiple of the typical top weight is flagged. */
  highWeightRatio: 1.6,
  /** A weight below this multiple of the typical top weight is flagged. */
  lowWeightRatio: 0.4,
  /** Reps above this multiple of typical reps (and above `minimumSuspiciousReps`) are flagged. */
  highRepsRatio: 2.5,
  /** Reps at or below this count are never flagged as too high. */
  minimumSuspiciousReps: 25,
  /** A correction must land within this ratio band of the typical value (inclusive). */
  suggestionBand: { lower: 0.75, upper: 1.33 },
  /** A missed or extra digit shifts the number by this factor. */
  decimalShift: 10,
} as const;

/** One session of one exercise, reduced to what the check compares against. */
export interface SessionSummary {
  readonly sets: readonly SetObservation[];
  /** Heaviest working or failure set. */
  readonly topWeight: number;
  /** Median reps of working and failure sets. */
  readonly medianReps: number;
}

/** Whether a set counts toward an exercise's typical level: working and failure sets only. */
function isPlausibilityKind(kind: SetKind): boolean {
  return kind === 'working' || kind === 'failure';
}

function isInSuggestionBand(ratio: number): boolean {
  return (
    ratio >= SetPlausibilityThreshold.suggestionBand.lower && ratio <= SetPlausibilityThreshold.suggestionBand.upper
  );
}

/** The median of `values`; 0 for none. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);
  const middle = sorted[middleIndex];
  const below = sorted[middleIndex - 1];
  if (middle === undefined) return 0;
  return sorted.length % 2 === 0 && below !== undefined ? (below + middle) / 2 : middle;
}

/**
 * Groups an exercise's sets into sessions, oldest first (ties keep the order the sets came in), with
 * each session's top working weight and median working reps. Shared by the import review and the
 * live check, so both judge "typical" the same way.
 */
export function summariseSessions(sets: readonly SetObservation[]): SessionSummary[] {
  return [...groupBy(sets, (set) => set.sessionKey).values()]
    .map((sessionSets): SessionSummary => {
      const work = sessionSets.filter((set) => isPlausibilityKind(set.kind));
      return {
        sets: sessionSets,
        topWeight: work.length === 0 ? 0 : Math.max(...work.map((set) => set.weightKilograms)),
        medianReps: median(work.map((set) => set.reps)),
      };
    })
    .sort((a, b) => compareText(a.sets[0]?.date ?? '', b.sets[0]?.date ?? ''));
}

function compareText(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

/** Up to `neighbourSessions` sessions on each side of `index`, excluding it. */
function neighbourhood(index: number, sessions: readonly SessionSummary[]): SessionSummary[] {
  const reach = SetPlausibilityThreshold.neighbourSessions;
  const before = sessions.slice(Math.max(0, index - reach), index);
  const after = sessions.slice(index + 1, Math.min(sessions.length, index + 1 + reach));
  return [...before, ...after];
}

/**
 * The likeliest intended weight in kilograms: a shifted decimal (×10, ÷10) or a number typed in
 * the wrong unit (kg↔lb), whichever lands closest to typical. Exact; round with `displayValue`
 * when showing it.
 */
export function weightCorrection(weight: number, typical: number): number | null {
  const shift = SetPlausibilityThreshold.decimalShift;
  const candidates = [weight / shift, weight * shift, weight * KILOGRAMS_PER_POUND, weight / KILOGRAMS_PER_POUND];
  let closest: number | null = null;
  for (const candidate of candidates) {
    if (!isInSuggestionBand(candidate / typical)) continue;
    if (closest === null || Math.abs(candidate - typical) < Math.abs(closest - typical)) closest = candidate;
  }
  return closest;
}

/**
 * Checks one set against the sessions around it; `undefined` when it looks fine or there is too
 * little history to judge. Live logging calls this directly with the exercise's past sessions.
 */
export function checkSet(set: SetObservation, neighbours: readonly SessionSummary[]): SetFinding | undefined {
  if (!isPlausibilityKind(set.kind)) return undefined;
  if (set.reps === 0) return { id: set.id, issue: 'zeroReps', typical: 0, suggestion: null };
  if (neighbours.length < SetPlausibilityThreshold.minimumNeighbourSessions) return undefined;

  const typicalReps = median(neighbours.map((session) => session.medianReps));
  if (
    set.reps > typicalReps * SetPlausibilityThreshold.highRepsRatio &&
    set.reps > SetPlausibilityThreshold.minimumSuspiciousReps
  ) {
    const tenth = set.reps / SetPlausibilityThreshold.decimalShift;
    const suggestion = isInSuggestionBand(tenth / typicalReps) ? Math.round(tenth) : null;
    return { id: set.id, issue: 'repsTooHigh', typical: typicalReps, suggestion };
  }

  const topWeights = neighbours.map((session) => session.topWeight).filter((weight) => weight > 0);
  if (set.weightKilograms <= 0 || topWeights.length < SetPlausibilityThreshold.minimumNeighbourSessions) {
    return undefined;
  }
  const typicalWeight = median(topWeights);
  const ratio = set.weightKilograms / typicalWeight;
  let issue: SetIssue;
  if (ratio > SetPlausibilityThreshold.highWeightRatio) {
    issue = 'weightTooHigh';
  } else if (ratio < SetPlausibilityThreshold.lowWeightRatio) {
    issue = 'weightTooLow';
  } else {
    return undefined;
  }
  return {
    id: set.id,
    issue,
    typical: typicalWeight,
    suggestion: weightCorrection(set.weightKilograms, typicalWeight),
  };
}

/**
 * Finds sets whose weight or reps look like typing mistakes: a missed digit, an extra zero, or a
 * number typed in the wrong unit. Used by the Strong import review and, later, by live logging.
 *
 * Heuristic (no literature applies): a set is compared with the same exercise's typical top
 * weight and reps in nearby sessions, before *and* after it. A genuine jump in strength is
 * followed by sessions at the new level, so it isn't flagged; a typo stands alone.
 *
 * Only working and failure sets are checked: warm-ups and drop sets are lighter by design.
 *
 * @returns Findings in the order of `observations`.
 */
export function findImplausibleSets(observations: readonly SetObservation[]): SetFinding[] {
  const results = new Map<number, SetFinding>();
  for (const sets of groupBy(observations, (observation) => observation.exerciseKey).values()) {
    const sessions = summariseSessions(sets);
    sessions.forEach((session, index) => {
      const neighbours = neighbourhood(index, sessions);
      for (const set of session.sets) {
        const finding = checkSet(set, neighbours);
        if (finding !== undefined) results.set(set.id, finding);
      }
    });
  }
  return observations.flatMap((observation) => {
    const finding = results.get(observation.id);
    return finding === undefined ? [] : [finding];
  });
}
