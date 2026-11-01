/** Calendar keys are local dates, while full timestamps retain their explicit offset; invalid dates return NaN. */
export function chartTimestamp(date: string): number {
  return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date);
}
