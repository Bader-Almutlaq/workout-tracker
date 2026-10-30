import { useId, type ReactNode } from 'react';
import { FORMAT_LOCALE } from '../../format/formatLocale';
import { ChartLayout, type ChartScales } from './chartScales';
import styles from './ChartFrame.module.css';

const axisFormat = new Intl.NumberFormat(FORMAT_LOCALE, { maximumFractionDigits: 1 });
const monthFormat = new Intl.DateTimeFormat(FORMAT_LOCALE, { month: 'short', year: '2-digit', timeZone: 'UTC' });

/** SVG plot with a subtle background fade, three value gridlines and UTC month labels. */
export function ChartFrame({
  width,
  scales,
  label,
  children,
}: {
  readonly width: number;
  readonly scales: ChartScales;
  readonly label: string;
  readonly children: ReactNode;
}) {
  const gradientId = useId();
  const seenMonths = new Set<string>();
  const months = scales.x.ticks(ChartLayout.monthLabelCount).filter((date) => {
    const month = monthFormat.format(date);
    if (seenMonths.has(month)) return false;
    seenMonths.add(month);
    return true;
  });
  return (
    <svg className={styles.chart} viewBox={`0 0 ${width} ${ChartLayout.height}`} aria-label={label} role="group">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className={styles.fadeStart} />
          <stop offset="100%" className={styles.fadeEnd} />
        </linearGradient>
      </defs>
      <rect width={width} height={ChartLayout.height} fill={`url(#${gradientId})`} />
      {scales.gridValues.map((value) => (
        <g key={value}>
          <line className={styles.grid} x1={scales.left} x2={scales.right} y1={scales.y(value)} y2={scales.y(value)} />
          <text
            className={styles.label}
            x={scales.left - ChartLayout.padding.right / 2}
            y={scales.y(value)}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {axisFormat.format(value)}
          </text>
        </g>
      ))}
      {months.map((date) => (
        <text
          key={date.toISOString()}
          className={styles.label}
          x={scales.x(date)}
          y={ChartLayout.height - ChartLayout.padding.bottom / 4}
          textAnchor="middle"
        >
          {monthFormat.format(date)}
        </text>
      ))}
      {children}
    </svg>
  );
}
