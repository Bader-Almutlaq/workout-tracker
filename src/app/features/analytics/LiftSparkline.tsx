import { line } from 'd3-shape';

/** Heuristic: inset points and a compact viewbox make the sparkline legible in a row. */
const geometry = Object.freeze({ width: 100, height: 30, bottom: 28, range: 26, radius: 2.5 });

/** Compact strength history; null values leave gaps and deload observations are highlighted. */
export function LiftSparkline({
  points,
  bars = false,
}: {
  readonly points: readonly { readonly value: number | null; readonly deload: boolean }[];
  readonly bars?: boolean;
}) {
  const values = points.flatMap((point) => (point.value === null ? [] : [point.value]));
  if (values.length === 0) return <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" />;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const x = (index: number) => (index * geometry.width) / Math.max(1, points.length - 1);
  const y = (value: number) => geometry.bottom - ((value - min) / span) * geometry.range;
  const path =
    line<(typeof points)[number]>()
      .defined((point) => point.value !== null)
      .x((_, index) => x(index))
      .y((point) => y(point.value ?? 0))(points) ?? '';
  return (
    <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
      {bars ? (
        points.map((point, index) => {
          if (point.value === null) return null;
          const width = geometry.width / points.length;
          const height = (point.value / (Math.max(...values) || 1)) * geometry.range;
          return (
            <rect
              key={index}
              x={index * width}
              y={geometry.bottom - height}
              width={width * 0.7}
              height={height}
              fill={point.deload ? 'var(--color-deload)' : 'currentColor'}
            />
          );
        })
      ) : (
        <path d={path} fill="none" stroke="currentColor" />
      )}
      {points.map((point, index) =>
        !bars && point.value !== null && (point.deload || index === points.length - 1) ? (
          <circle
            key={index}
            cx={x(index)}
            cy={y(point.value)}
            r={geometry.radius}
            fill={point.deload ? 'var(--color-deload)' : 'currentColor'}
          />
        ) : null,
      )}
    </svg>
  );
}
