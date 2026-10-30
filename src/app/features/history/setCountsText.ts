import { setCountText } from '../../format/setText';

/** Formats work sets and, when present, their separate warm-up count. */
export function setCountsText(setCount: number, warmupCount: number): string {
  const warmups = warmupCount === 0 ? '' : ` · ${warmupCount} warm-up${warmupCount === 1 ? '' : 's'}`;
  return `${setCountText(setCount)}${warmups}`;
}
