import type { TimeAggregation } from '../../../core/analytics/TimeBuckets';

/** One observation in display units. Null explicitly means nothing logged; sessionId enables expanded session navigation. */
export interface TimeChartPoint {
  readonly date: string;
  readonly value: number | null;
  readonly sessionId?: number;
  readonly deload?: boolean;
}

/** One independent series; names should be unique within the chart. */
export interface TimeChartSeries {
  readonly name: string;
  readonly points: readonly TimeChartPoint[];
}

/** Optional dated deload annotation for callers that do not attach deload to individual points. */
export interface TimeChartMark {
  readonly date: string;
  readonly kind: 'deload';
}

/** Shared dated-chart inputs. Values and formatValue use display units, never stored kilograms requiring a second conversion. */
export interface TimeChartProps {
  readonly title: string;
  readonly unit: string;
  readonly series: readonly TimeChartSeries[];
  readonly kind?: 'line' | 'bars';
  readonly aggregation: TimeAggregation;
  readonly marks?: readonly TimeChartMark[];
  readonly trend?: boolean;
  readonly formatValue: (value: number) => string;
  /** Optional full-history loader when the page supplies only its selected period inline. Invoked only on expansion. */
  readonly loadHistory?: () => Promise<readonly TimeChartSeries[]>;
  readonly onOpenPoint?: (point: TimeChartPoint) => void;
}

/** Inclusive time window in epoch milliseconds; finite endpoints and to > from are required. */
export interface TimeChartDomain {
  readonly from: number;
  readonly to: number;
}
