import { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { log } from '../../../core/support/log';
import type { TimeChartProps, TimeChartSeries } from './TimeChart.types';
import { chartHistoryDomain, TimeChartPolicy } from './timeChartMath';
import { TimeChartCanvas } from './TimeChartCanvas';
import { TimeChartExpanded } from './TimeChartExpanded';
import styles from './TimeChart.module.css';

/** Compact, aggregated dated chart with temporary readout and a landscape pinch/pan history view. */
export function TimeChart(props: TimeChartProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullSeries, setFullSeries] = useState<readonly TimeChartSeries[] | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function expand() {
    setError(null);
    if (props.loadHistory !== undefined) {
      setLoading(true);
      try {
        const series = await props.loadHistory();
        if (!mounted.current) return;
        setFullSeries(series);
      } catch (error: unknown) {
        log.ui.error('Could not load chart history', error);
        if (mounted.current)
          setError(error instanceof Error ? error.message : 'Could not load chart history. Try again.');
        return;
      } finally {
        if (mounted.current) setLoading(false);
      }
    }
    if (mounted.current) setExpanded(true);
  }
  const expandedProps = { ...props, series: fullSeries ?? props.series };
  const expandedHistory = chartHistoryDomain(expandedProps.series);
  const history = chartHistoryDomain(props.series) ?? { from: 0, to: TimeChartPolicy.day };
  return (
    <>
      <TimeChartCanvas
        props={props}
        domain={history}
        history={history}
        controls={
          <button
            className={styles.icon}
            type="button"
            aria-label={`Expand ${props.title}`}
            aria-busy={loading}
            disabled={loading}
            onClick={() => {
              void expand();
            }}
          >
            <Maximize2 size={18} aria-hidden />
          </button>
        }
      />
      {error !== null && <p role="alert">{error}</p>}
      {expanded && (
        <TimeChartExpanded
          props={expandedProps}
          history={expandedHistory ?? history}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  );
}
