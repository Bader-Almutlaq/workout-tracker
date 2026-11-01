/**
 * Percentage of the reference e1RM for a positive load. The reference is the largest of
 * the trend, the session best and the load itself, so an unqualified heavy set cannot exceed
 * 100%. Heuristic: the load is a lower bound on strength when no estimate qualifies.
 * Returns null when neither estimate is positive. See docs/ANALYTICS.md, Definitions.
 */
export function PercentOfMax(
  weightKilograms: number,
  trendKilograms: number | null,
  sessionBestKilograms: number | null,
): number | null {
  if (!Number.isFinite(weightKilograms) || weightKilograms <= 0) return null;
  const reference = Math.max(trendKilograms ?? 0, sessionBestKilograms ?? 0);
  if (!Number.isFinite(reference) || reference <= 0) return null;
  return (weightKilograms / Math.max(reference, weightKilograms)) * 100;
}
