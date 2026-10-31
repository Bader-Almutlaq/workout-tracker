/** Heuristic: round weekly time to minutes, retaining a visible indication of positive sub-minute values. */
export function weeklyDurationText(seconds: number): string {
  const minute = 60;
  if (seconds > 0 && seconds < minute) return '<1m';
  const minutes = Math.round(seconds / minute);
  const hours = Math.floor(minutes / minute);
  const remainder = minutes % minute;
  return hours === 0 ? `${minutes}m` : remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}
