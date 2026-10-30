import { useEffect, useId, useState } from 'react';
import { log } from '../../../core/support/log';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { ChartFrame } from '../../design/charts/ChartFrame';
import { chartScales } from '../../design/charts/chartScales';
import { DotSeries } from '../../design/charts/DotSeries';
import { TouchRule } from '../../design/charts/TouchRule';
import { TrendLine } from '../../design/charts/TrendLine';
import { useChartSize } from '../../design/charts/useChartSize';
import { dayWithYearText } from '../../format/dateText';
import { weightText } from '../../format/weightText';
import {
  strengthBestSetText,
  strengthHeadlineText,
  strengthReadout,
  strengthWeeklyChangeText,
} from './strengthReadout';
import styles from './StrengthCard.module.css';

/** Heuristic: two qualifying daily observations are the minimum needed to draw a trend (T-034). */
const strengthCardPolicy = Object.freeze({ minimumSessions: 2 });

/** Read-only strength history: worker-owned trend, session inspection and an accessible table alternative. */
export function StrengthCard({ exerciseId, unit }: { readonly exerciseId: number; readonly unit: WeightUnit }) {
  const query = useDatabaseQuery(`exercise-strength-${exerciseId}`, () => database.exerciseStrength(exerciseId));
  useEffect(() => {
    if (query.status === 'failed') log.ui.error('Could not load strength history', query.message);
  }, [query]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const titleId = useId();
  const { ref, width } = useChartSize();
  const series = query.status === 'ready' ? query.value : null;
  const sessions = series?.sessions ?? [];
  const points = sessions.map((session) => ({ date: session.date, value: session.e1rmKilograms }));
  const trend = (series?.trend ?? []).map((point) => ({ date: point.date, value: point.e1rmKilograms }));
  const scales = chartScales([...points, ...trend], width);
  const selected = selectedIndex === null ? undefined : sessions[selectedIndex];
  const hasTrend = sessions.length >= strengthCardPolicy.minimumSessions && series?.latest !== null;

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Estimated 1RM
      </h2>
      {query.status === 'loading' && <p className={styles.message}>Loading strength history…</p>}
      {query.status === 'failed' && (
        <p className={styles.message} role="alert">
          {query.message}
        </p>
      )}
      {query.status === 'ready' && !hasTrend && (
        <p className={styles.message}>Log this exercise a few times to see a trend.</p>
      )}
      <div ref={ref}>
        {hasTrend && series !== null && series.latest !== null && (
          <>
            <div className={styles.headline} aria-live="polite">
              {selected === undefined ? (
                <>
                  <p className={styles.value}>{strengthHeadlineText(series.latest, unit)}</p>
                  <p className={styles.caption}>{strengthWeeklyChangeText(series.changePerWeekPercent)}</p>
                </>
              ) : (
                <p className={styles.readout}>{strengthReadout(selected, unit)}</p>
              )}
            </div>
            <p className={styles.axisUnit}>e1RM · kg</p>
            <ChartFrame width={width} scales={scales} label="Estimated one-rep max in kilograms over time">
              <TrendLine points={trend} scales={scales} />
              <DotSeries points={points} scales={scales} />
              <TouchRule points={points} scales={scales} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
            </ChartFrame>
          </>
        )}
      </div>
      {query.status === 'ready' && sessions.length > 0 && (
        <>
          <button
            className={styles.toggle}
            type="button"
            aria-expanded={showTable}
            aria-controls={tableId}
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? 'Hide table' : 'Show as table'}
          </button>
          {showTable && (
            <div className={styles.tableScroll} id={tableId}>
              <table className={styles.table}>
                <caption className={styles.caption}>Session estimates · kg</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">e1RM</th>
                    <th scope="col">Best set</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.date}>
                      <th scope="row">{dayWithYearText(session.date, 'UTC')}</th>
                      <td>{weightText(session.e1rmKilograms, 'kg')}</td>
                      <td>{strengthBestSetText(session, unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
