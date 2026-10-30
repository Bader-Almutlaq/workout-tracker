import { useEffect, useState } from 'react';

/** How often a running clock is redrawn. */
const TICK_MILLISECONDS = 1000;

/** The current time, refreshed every second. Read from the system clock, so it stays right after time in the background. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MILLISECONDS);
    return () => clearInterval(timer);
  }, []);
  return now;
}
