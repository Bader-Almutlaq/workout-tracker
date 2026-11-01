import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { weeklyDurationText } from '../analytics/weeklyDurationText';
import styles from '../analytics/Analytics.module.css';
import layout from './TemplateAnalytics.module.css';

type Report = ReturnType<typeof TemplateAnalytics>;
/** Scoped workout or plan headline figures, using the dashboard tile styling. */
export function TemplateAnalyticsTiles({ report, plan }: { readonly report: Report; readonly plan: boolean }) {
  const tiles = plan
    ? [
        { label: 'On this plan', value: `${report.weeksOnPlan ?? 0} wk`, detail: '' },
        {
          label: 'Sessions / week',
          value: report.sessionsPerWeek?.toFixed(1) ?? '—',
          detail: `of ${report.plannedWorkouts} planned · ${report.weeksAvailable} full weeks`,
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
          label: 'Last sets',
          value: String(report.lastSession?.workingSets ?? 0),
          detail: `of ${report.lastSession?.plannedWorkingSets ?? 0} planned`,
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
