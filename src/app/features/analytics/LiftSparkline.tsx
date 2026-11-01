import { line } from 'd3-shape';

/** Heuristic: inset points and a compact viewbox make the sparkline legible in a row. */
const geometry = Object.freeze({ width: 100, height: 30, bottom: 28, range: 26, radius: 2.5 });

/** Compact strength history; null estimates are omitted and deload observations are highlighted. */
export function LiftSparkline({
  points,
}: {
  readonly points: readonly { readonly value: number; readonly deload: boolean }[];
}) {
  if (points.length === 0) return <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" />;
  const min = Math.min(...points.map((point) => point.value));
  const span = Math.max(...points.map((point) => point.value)) - min || 1;
  const x = (index: number) => (index * geometry.width) / Math.max(1, points.length - 1);
  const y = (value: number) => geometry.bottom - ((value - min) / span) * geometry.range;
  const path =
    line<(typeof points)[number]>()
      .x((_, index) => x(index))
      .y((point) => y(point.value))(points) ?? '';
  return (
    <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" />
      {points.map((point, index) =>
        point.deload || index === points.length - 1 ? (
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
