const DAYS_PER_WEEK = 7;

/** Weeks of a month, Monday first, with null for days outside the month; month is 1–12. */
export function calendarGrid(year: number, month: number): (number | null)[][] {
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekCount = Math.ceil((firstWeekday + daysInMonth) / DAYS_PER_WEEK);
  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: DAYS_PER_WEEK }, (_, weekday) => {
      const day = week * DAYS_PER_WEEK + weekday - firstWeekday + 1;
      return day > 0 && day <= daysInMonth ? day : null;
    }),
  );
}
