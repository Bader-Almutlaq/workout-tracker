import type { TimeChartModel } from './timeChartModel';
import styles from './TimeChart.module.css';

/** Named categorical swatches and one dashed trend key; a lone series needs no legend. */
export function TimeChartLegend({ model }: { readonly model: TimeChartModel }) {
  const hasTrend = model.series.some((item) => item.trend.length > 0);
  if (model.series.length < 2 && !hasTrend) return null;
  return (
    <ul className={styles.legend} aria-label="Series legend">
      {model.series.map((item, index) => (
        <li key={item.name} className={styles.series} data-series={index}>
          <span className={styles.swatch} aria-hidden />
          {item.name}
        </li>
      ))}
      {hasTrend && (
        <li>
          <span className={`${styles.swatch} ${styles.trendSwatch}`} aria-hidden />
          Trend
        </li>
      )}
    </ul>
  );
}
