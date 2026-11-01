import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { weeklyDurationText } from '../analytics/weeklyDurationText';
import styles from '../analytics/Analytics.module.css';
import layout from './TemplateAnalytics.module.css';

type Report = ReturnType<typeof TemplateAnalytics>;

function frequencyDetail(report: Report): string {
  if (!report.windowIsHistorical || report.windowEnd === null) return `of ${report.plannedWorkouts} planned`;
  const date = new Date(`${report.windowEnd}T12:00:00`);
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  return `${report.weeksAvailable} wk to ${day} ${month}`;
}

/** Scoped workout or plan headline figures, using the dashboard tile styling. */
export function TemplateAnalyticsTiles({ report, plan }: { readonly report: Report; readonly plan: boolean }) {
  const tiles = plan
    ? [
        { label: 'Workouts', value: String(report.sessionCount), detail: '' },
        {
          label: 'Per week',
          value: report.sessionsPerWeek?.toFixed(1) ?? '—',
          detail: frequencyDetail(report),
        },
        {
          label: 'Typical length',
          value: report.typicalSessionSeconds === null ? '—' : weeklyDurationText(report.typicalSessionSeconds),
          detail: '',
        },
      ]
    : [
        { label: 'Sessions', value: String(report.sessionCount), detail: '' },
        {
          label: 'Typical length',
          value: report.typicalSessionSeconds === null ? '—' : weeklyDurationText(report.typicalSessionSeconds),
          detail: '',
        },
        {
          label: 'Sets last time',
          value: `${report.lastSession?.workingSets ?? 0} / ${report.lastSession?.plannedWorkingSets ?? 0}`,
          detail: 'planned',
        },
      ];
  return (
    <div className={`${styles.tiles} ${layout.tiles}`}>
      {tiles.map((tile) => (
        <div className={styles.tile} key={tile.label}>
          <span>{tile.label}</span>
          <strong>{tile.value}</strong>
          {tile.detail && <small>{tile.detail}</small>}
        </div>
      ))}
    </div>
  );
}
