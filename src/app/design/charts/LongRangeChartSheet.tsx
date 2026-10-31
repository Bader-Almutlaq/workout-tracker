import { useEffect, useRef, useState } from 'react';
import type { TimeRange } from '../../../core/analytics/TimeBuckets';
import { SegmentedControl } from '../components/SegmentedControl';
import { Button } from '../components/Button';
import { LongRangePlot } from './LongRangePlot';
import type { LongRangeChartProps } from './LongRangeChart';
import styles from './LongRangeChart.module.css';

/** Heuristic: calendar windows match the owner's 3M / 6M / 1Y / All controls. */
const ranges: readonly { readonly value: string; readonly label: string; readonly range: TimeRange }[] = Object.freeze([
  { value: '3', label: '3M', range: 3 },
  { value: '6', label: '6M', range: 6 },
  { value: '12', label: '1Y', range: 12 },
  { value: 'all', label: 'All', range: 'all' },
]);

/** Heuristic: reserve most of the viewport for the expanded plot. */
const expandedHeightFraction = 0.6;

/** Full-screen modal, with native focus trapping, Escape dismissal and safe-area padding. */
export function LongRangeChartSheet({ onClose, ...props }: LongRangeChartProps & { readonly onClose: () => void }) {
  const [height, setHeight] = useState(() =>
    typeof window === 'undefined' ? undefined : window.innerHeight * expandedHeightFraction,
  );
  useEffect(() => {
    const resize = () => setHeight(window.innerHeight * expandedHeightFraction);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const dialog = useRef<HTMLDialogElement>(null);
  const [range, setRange] = useState<TimeRange>(ranges[0]?.range ?? 'all');
  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);
  return (
    <dialog ref={dialog} className={styles.sheet} aria-label={`${props.title} full screen`} onCancel={onClose}>
      <header className={styles.header}>
        <h2>{props.title}</h2>
        <Button onPress={onClose}>Close</Button>
      </header>
      <SegmentedControl
        label="Chart range"
        value={String(range)}
        options={ranges}
        onChange={(value) => setRange(ranges.find((option) => option.value === value)?.range ?? 'all')}
      />
      <LongRangePlot key={range} {...props} range={range} detailed {...(height === undefined ? {} : { height })} />
    </dialog>
  );
}
