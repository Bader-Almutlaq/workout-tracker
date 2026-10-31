import { useId, type ReactNode } from 'react';
import { ChartLayout, chartDateLabels, type ChartScales } from './chartScales';
import styles from './ChartFrame.module.css';
import { compactTick } from './compactTick';

/** SVG plot with a subtle background fade, round value gridlines and UTC date labels; horizontal gridlines only (DESIGN.md → Charts). */
export function ChartFrame({
  width,
  scales,
  label,
  height = ChartLayout.height,
  children,
  formatTick = compactTick,
}: {
  readonly width: number;
  readonly scales: ChartScales;
  readonly label: string;
  readonly height?: number;
  readonly children: ReactNode;
  readonly formatTick?: (value: number) => string;
}) {
  const gradientId = useId();
  const labels = chartDateLabels(scales);
  return (
    <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} aria-label={label} role="group">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className={styles.fadeStart} />
          <stop offset="100%" className={styles.fadeEnd} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${gradientId})`} />
      {scales.gridValues
        .filter((value) => formatTick(value) !== '')
        .map((value) => (
          <g key={value}>
            <line
              className={styles.grid}
              x1={scales.left}
              x2={scales.right}
              y1={scales.y(value)}
              y2={scales.y(value)}
            />
            <text
              className={styles.label}
              x={scales.left - ChartLayout.padding.right / 2}
              y={scales.y(value)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatTick(value)}
            </text>
          </g>
        ))}
      {labels.map(({ date, text }) => (
        <text
          key={date.toISOString()}
          className={styles.label}
          x={scales.x(date)}
          y={height - ChartLayout.padding.bottom / 4}
          textAnchor="middle"
        >
          {text}
        </text>
      ))}
      {children}
    </svg>
  );
}
