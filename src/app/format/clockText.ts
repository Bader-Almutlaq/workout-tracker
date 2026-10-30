const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

/** Pads minutes and seconds to two digits once an hours part is shown ("1:05:03"). */
const twoDigits = (value: number): string => String(value).padStart(2, '0');

/**
 * A clock reading such as "5:03" (minutes and seconds) or "1:05:03" from one hour up. Used for the
 * workout timer and for timed sets. Fractions of a second are dropped and negative values read as zero.
 * Port of `TimeInterval.clockText` in the native app.
 */
export function clockText(totalSeconds: number): string {
  const whole = Math.max(0, Math.floor(totalSeconds));
  const seconds = whole % SECONDS_PER_MINUTE;
  const totalMinutes = Math.floor(whole / SECONDS_PER_MINUTE);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  if (hours === 0) return `${totalMinutes}:${twoDigits(seconds)}`;
  return `${hours}:${twoDigits(minutes)}:${twoDigits(seconds)}`;
}
