import { useEffect, useState } from 'react';

/** How often the workout clock is redrawn. */
const TICK_MILLISECONDS = 1000;

/** Seconds since `startedAt` (an ISO timestamp), updated every second. Based on the clock, so it stays right while the app is in the background. */
export function useElapsedSeconds(startedAt: string): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MILLISECONDS);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, (now - Date.parse(startedAt)) / 1000);
}
