/**
 * Where the day is split for naming a workout.
 *
 * Heuristic: the everyday meaning of the words (afternoon from noon, evening from 5 pm); no source
 * applies, and the owner can rename the workout.
 */
export const DayPart = {
  /** The hour (24-hour clock) at which "Afternoon" begins. */
  afternoonStartHour: 12,
  /** The hour (24-hour clock) at which "Evening" begins. */
  eveningStartHour: 17,
} as const;

/** "Morning workout", "Afternoon workout" or "Evening workout", from the phone's local hour of `date`. */
export function workoutNameAt(date: Date): string {
  const hour = date.getHours();
  if (hour < DayPart.afternoonStartHour) return 'Morning workout';
  return hour < DayPart.eveningStartHour ? 'Afternoon workout' : 'Evening workout';
}
