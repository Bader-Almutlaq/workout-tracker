/** Supported whole-week analytics ranges. */
export type AnalyticsPeriod = '4W' | '12W' | '6M' | '1Y' | 'All';

/** Heuristic: month and year choices use fixed whole-week spans. */
const policy = Object.freeze({
  daysPerWeek: 7,
  millisecondsPerDay: 86400000,
  weeks: { '4W': 4, '12W': 12, '6M': 26, '1Y': 52 },
});

/** Local Monday at midnight containing the supplied date. */
function monday(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % policy.daysPerWeek));
  return result;
}

/** Inclusive start and exclusive end, plus an equal preceding range; All has no comparison. */
export function analyticsPeriod(period: AnalyticsPeriod, now: Date, firstWorkout: string | null) {
  const end = monday(now);
  end.setDate(end.getDate() + policy.daysPerWeek);
  const from = period === 'All' && firstWorkout !== null ? monday(new Date(firstWorkout)) : new Date(end);
  if (period !== 'All') from.setDate(from.getDate() - policy.weeks[period] * policy.daysPerWeek);
  if (period === 'All' && firstWorkout === null) from.setDate(from.getDate() - policy.daysPerWeek);
  const previousFrom = new Date(from);
  const weeks = Math.round(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      (policy.millisecondsPerDay * policy.daysPerWeek),
  );
  previousFrom.setDate(previousFrom.getDate() - weeks * policy.daysPerWeek);
  return { from, to: end, weeks, previous: period === 'All' ? null : { from: previousFrom, to: from } };
}
