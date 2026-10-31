import { useState } from 'react';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import { isMainMuscle } from '../../../core/library/MuscleProminence';
import type { TemplateMuscleSummary } from '../../../core/queries/TemplateMuscleSummary';
import styles from './TemplateMuscleList.module.css';

/** Planned muscle counts, with optional weekly workout frequency. */
export function TemplateMuscleList({
  summary,
  weekly,
}: {
  readonly summary: TemplateMuscleSummary;
  readonly weekly: boolean;
}) {
  const [showSmaller, setShowSmaller] = useState(false);
  const rows = summary.muscles
    .filter((row) => showSmaller || isMainMuscle(row.muscle))
    .sort((a, b) => b.fractional - a.fractional);
  const maximum = Math.max(0, ...rows.map((row) => row.fractional));
  return (
    <section className={styles.section}>
      <h2>Sets per muscle</h2>
      <p>
        Indirect sets count as {summary.secondaryWeight === 0.5 ? 'half a set' : `${summary.secondaryWeight} of a set`}.
      </p>
      <button type="button" onClick={() => setShowSmaller(!showSmaller)}>
        {showSmaller ? 'Hide smaller muscles' : 'Show smaller muscles'}
      </button>
      {rows.map((row) => (
        <div className={styles.row} key={row.muscle}>
          <div className={styles.top}>
            <strong>{MUSCLE_DISPLAY_NAMES[row.muscle]}</strong>
            <span>{row.fractional === 0 ? 'Not trained' : row.fractional}</span>
          </div>
          {row.fractional > 0 && (
            <>
              <div className={styles.detail}>
                {row.direct} direct + {row.indirect} indirect{weekly ? ` · ${row.frequency}× a week` : ''}
              </div>
              <div className={styles.track}>
                <div
                  className={styles.bar}
                  style={{ width: `${maximum === 0 ? 0 : (row.fractional / maximum) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
