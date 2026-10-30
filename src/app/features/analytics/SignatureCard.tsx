import { useEffect, useState } from 'react';
import { recentVsBaseline } from '../../../core/analytics/RecentVsBaseline';
import { MUSCLES, MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import { localDateKey } from '../../../core/support/localDate';
import { log } from '../../../core/support/log';
import { database, useDatabaseQuery } from '../../data/database';
import { ChartFrame } from '../../design/charts/ChartFrame';
import { ChartTable } from '../../design/charts/ChartTable';
import { chartScales } from '../../design/charts/chartScales';
import { ClassifiedDots } from '../../design/charts/ClassifiedDots';
import { ComparisonLines } from '../../design/charts/ComparisonLines';
import { TouchRule } from '../../design/charts/TouchRule';
import { useChartSize } from '../../design/charts/useChartSize';
import { dayWithYearText } from '../../format/dateText';
import { signatureDifferenceText, signatureHeadline, signatureReadout, signatureSetsText } from './signatureReadout';
import styles from './SignatureCard.module.css';

/** Heuristic: T-036's calendar-month ranges and 34 leading days provide complete rolling windows on day one. */
const signaturePolicy = Object.freeze({ ranges: [1, 3, 6], defaultMonths: 3, historyDays: 34 });

/** Read-only recent versus baseline hard sets, with metric/range controls and daily touch inspection. */
export function SignatureCard() {
  const [metric, setMetric] = useState('');
  const [months, setMonths] = useState<number>(signaturePolicy.defaultMonths);
  const muscle = MUSCLES.find((candidate) => candidate === metric);
  const today = new Date();
  const to = localDateKey(today);
  // Clamp the day before changing month so month-end dates cannot overflow into the following month.
  const start = new Date(today.getFullYear(), today.getMonth() - months, 1);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  start.setDate(Math.min(today.getDate(), lastDay));
  const from = localDateKey(start);
  const loadedStart = new Date(start);
  loadedStart.setDate(loadedStart.getDate() - signaturePolicy.historyDays);
  const loadedFrom = localDateKey(loadedStart);
  const queryKey = `signature-${loadedFrom}-${to}-${metric}`;
  const query = useDatabaseQuery(queryKey, async () => ({
    key: queryKey,
    series: await database.dailyHardSets(loadedFrom, to, muscle),
  }));
  useEffect(() => {
    if (query.status === 'failed') log.ui.error('Could not load daily hard sets', query.message);
  }, [query]);
  const [selection, setSelection] = useState<{ readonly key: string; readonly index: number | null }>({
    key: '',
    index: null,
  });
  const selectedIndex = selection.key === queryKey ? selection.index : null;
  const series = query.status === 'ready' && query.value.key === queryKey ? query.value.series : null;
  const points = recentVsBaseline(series ?? [], { cadence: 'daily' }).filter((point) => point.date >= from);
  const recent = points.flatMap((point) => (point.recent === null ? [] : [{ ...point, value: point.recent }]));
  const baseline = points.flatMap((point) =>
    point.baseline === null ? [] : [{ date: point.date, value: point.baseline }],
  );
  const { ref, width } = useChartSize();
  const scales = chartScales([...recent, ...baseline], width, { zeroBaseline: true });
  const selected = selectedIndex === null ? undefined : points[selectedIndex];
  const headline = signatureHeadline(points.at(-1), muscle === undefined ? undefined : MUSCLE_DISPLAY_NAMES[muscle]);
  const hasSets = series?.some((point) => point.value > 0) ?? false;
  return (
    <section className={styles.card} aria-label="Recent vs baseline hard sets">
      <div className={styles.controls}>
        <select
          className={styles.picker}
          aria-label="Hard sets metric"
          value={metric}
          onChange={(event) => setMetric(event.target.value)}
        >
          <option value="">All training</option>
          {MUSCLES.map((item) => (
            <option key={item} value={item}>
              {MUSCLE_DISPLAY_NAMES[item]}
            </option>
          ))}
        </select>
        <div className={styles.ranges} aria-label="Chart range">
          {signaturePolicy.ranges.map((range) => (
            <button
              type="button"
              className={styles.chip}
              key={range}
              aria-pressed={months === range}
              onClick={() => setMonths(range)}
            >
              {range}M
            </button>
          ))}
        </div>
      </div>
      {query.status === 'failed' && (
        <p className={styles.message} role="alert">
          {query.message}
        </p>
      )}
      {query.status !== 'failed' && series === null && <p className={styles.message}>Loading hard sets…</p>}
      {series !== null && !hasSets && <p className={styles.message}>Log a few workouts to see this chart.</p>}
      <div ref={ref}>
        {hasSets && (
          <>
            <div className={styles.headline} aria-live="polite">
              {selected === undefined ? (
                <>
                  <p className={styles.value}>{headline.value}</p>
                  <p className={styles.caption}>{headline.caption}</p>
                </>
              ) : (
                <p className={styles.readout}>{signatureReadout(selected)}</p>
              )}
            </div>
            <p className={styles.legend}>Thick: last 7 days · thin: 28-day baseline, scaled to 7 days</p>
            <ChartFrame
              width={width}
              scales={scales}
              label="Daily hard sets: last 7 days compared with the 28-day baseline"
            >
              <ComparisonLines recent={recent} baseline={baseline} scales={scales} />
              <ClassifiedDots points={recent} scales={scales} />
              <TouchRule
                points={recent}
                scales={scales}
                label="Daily hard sets; drag or use arrow keys"
                selectedIndex={selectedIndex}
                onSelect={(index) => setSelection({ key: queryKey, index })}
              />
            </ChartFrame>
            <ChartTable
              caption="Daily hard sets; baseline scaled to 7 days"
              columns={['Date', 'Last 7 days', 'Baseline', 'Difference']}
              rows={points.map((point) => ({
                key: point.date,
                cells: [
                  dayWithYearText(point.date, 'UTC'),
                  signatureSetsText(point.recent),
                  signatureSetsText(point.baseline),
                  signatureDifferenceText(point.percentDifference),
                ],
              }))}
            />
          </>
        )}
      </div>
    </section>
  );
}
