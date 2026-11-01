import { useState } from 'react';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import { isMainMuscle } from '../../../core/library/MuscleProminence';
import type { TemplateMuscleSummary } from '../../../core/queries/TemplateMuscleSummary';
import { TemplateMuscleSheet } from './TemplateMuscleSheet';
import styles from './TemplateMuscleList.module.css';

/** Planned muscle counts, with optional weekly workout frequency. */
export function TemplateMuscleList({
  summary,
  weekly,
}: {
  readonly summary: TemplateMuscleSummary;
  readonly weekly: boolean;
}) {
  const [selectedMuscle, setSelectedMuscle] = useState<TemplateMuscleSummary['muscles'][number] | null>(null);
  const [showSmaller, setShowSmaller] = useState(false);
  const rows = summary.muscles.filter((row) => row.fractional > 0).sort((a, b) => b.fractional - a.fractional);
  const main = rows.filter((row) => isMainMuscle(row.muscle));
  const smaller = rows.filter((row) => !isMainMuscle(row.muscle));
  const maximum = Math.max(0, ...main.map((row) => row.fractional));
  const renderRow = (row: TemplateMuscleSummary['muscles'][number], compact: boolean) => (
    <button
      type="button"
      className={`${styles.rowButton} ${compact ? styles.compact : ''}`}
      key={row.muscle}
      onClick={() => setSelectedMuscle(row)}
    >
      <span className={styles.columns}>
        <span>
          <strong>{MUSCLE_DISPLAY_NAMES[row.muscle]}</strong> {row.fractional}
        </span>
        <span>{row.direct}</span>
        <span>{row.indirect}</span>
      </span>
      {!compact && (
        <span className={styles.track}>
          <span className={styles.bar} style={{ width: `${maximum === 0 ? 0 : (row.fractional / maximum) * 100}%` }} />
        </span>
      )}
      {weekly && row.frequency > 0 && <span className={styles.detail}>{row.frequency}× a week</span>}
    </button>
  );
  return (
    <section className={styles.section}>
      <h2>Sets per muscle</h2>
      <p>
        Indirect sets count as {summary.secondaryWeight === 0.5 ? 'half a set' : `${summary.secondaryWeight} of a set`}.
      </p>
      <button type="button" onClick={() => setShowSmaller(!showSmaller)}>
        {showSmaller ? 'Hide smaller muscles' : 'Show smaller muscles'}
      </button>
      <div className={styles.columns}>
        <span>Muscle / sets</span>
        <span>Direct</span>
        <span>Indirect</span>
      </div>
      {main.map((row) => renderRow(row, false))}
      {showSmaller && smaller.length > 0 && (
        <>
          <h3 className={styles.smallerHeading}>Smaller muscles</h3>
          {smaller.map((row) => renderRow(row, true))}
        </>
      )}
      {selectedMuscle !== null && (
        <TemplateMuscleSheet
          row={selectedMuscle}
          showWorkouts={weekly && summary.workouts > 1}
          onClose={() => setSelectedMuscle(null)}
        />
      )}
    </section>
  );
}
