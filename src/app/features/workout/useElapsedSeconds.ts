import { useClock } from './useClock';

/** Seconds since `startedAt` (an ISO timestamp), updated every second. Based on the clock, so it stays right while the app is in the background. */
export function useElapsedSeconds(startedAt: string): number {
  return Math.max(0, (useClock().getTime() - Date.parse(startedAt)) / 1000);
}
