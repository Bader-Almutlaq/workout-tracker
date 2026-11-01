import type { TimeChartModel } from './timeChartModel';
import type { TimeChartProps } from './TimeChart.types';
import { chartPeriodText } from './chartPeriodText';
import styles from './TimeChart.module.css';

/** Accessible visible-bucket table, always available to screen readers; session buttons exist only in expansion. */
export function TimeChartTable({
  model,
  props,
  visible = false,
  expanded = false,
}: {
  readonly model: TimeChartModel;
  readonly props: TimeChartProps;
  readonly visible?: boolean;
  readonly expanded?: boolean;
}) {
  return (
    <div className={visible ? styles.tableScroll : styles.hidden}>
      <table className={styles.table}>
        <caption>{props.title}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {model.series.map((item) => (
              <th scope="col" key={item.name}>
                {item.name} ({props.unit})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.dates.map((date) => (
            <tr key={date}>
              <th scope="row">
                {chartPeriodText(
                  date,
                  model.size,
                  model.series.flatMap((item) => item.points).find((point) => point.date === date)?.span ?? 1,
                )}
              </th>
              {model.series.map((item) => {
                const point = item.points.find((point) => point.date === date);
                return (
                  <td key={item.name}>
                    {point?.value === null || point === undefined ? '—' : props.formatValue(point.value)}
                    {point?.deload ? ' · Deload' : ''}
                    {expanded &&
                      props.onOpenPoint !== undefined &&
                      point?.sources.map((source, index) =>
                        source.sessionId === undefined ? null : (
                          <button
                            key={`${source.sessionId}-${index}`}
                            type="button"
                            className={styles.open}
                            onClick={() => props.onOpenPoint?.(source)}
                          >
                            Open session {source.sessionId}
                          </button>
                        ),
                      )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
