import { useState } from 'react';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import type { TemplateSessionReport } from '../../../core/queries/TemplateSessions';
import type { TemplateDraft } from '../../../core/templates/TemplateDraft';
import { Button } from '../../design/components/Button';
import { EmptyState } from '../../design/components/EmptyState';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import { dayWithYearText } from '../../format/dateText';
import { PreviewExercise } from './PreviewExercise';
import { isTimedExercise } from './isTimedExercise';
import { TemplateSessionHistory } from './TemplateSessionHistory';
import { TemplateSessionCharts } from './TemplateSessionCharts';
import styles from './TemplatePreview.module.css';

/** Workout sheet sections follow the same segmented navigation as the plan page. */
const sections = Object.freeze([
  { value: 'exercises', label: 'Exercises' },
  { value: 'history', label: 'History' },
  { value: 'analytics', label: 'Analytics' },
] as const);

/** Description, last performance and tabs for one saved workout; formulas arrive from the worker report. */
export function TemplatePreview({
  template,
  details,
  report,
  onEdit,
}: {
  readonly template: TemplateDraft;
  readonly details: readonly ExerciseCatalogDetail[];
  readonly report: TemplateSessionReport;
  readonly onEdit: () => void;
}) {
  const [section, setSection] = useState<'exercises' | 'history' | 'analytics'>('exercises');
  const latest = report.sessions[0];
  return (
    <>
      {template.notes === null || template.notes.trim() === '' ? (
        <Button onPress={onEdit}>Add a description</Button>
      ) : (
        <p className={styles.notes}>{template.notes}</p>
      )}
      <p className={styles.notes}>
        Last performed: {latest === undefined ? 'Never' : dayWithYearText(latest.startedAt)}
      </p>
      <SegmentedControl label="Workout view" options={sections} value={section} onChange={setSection} />
      {section === 'exercises' && template.exercises.length === 0 && (
        <EmptyState message="No exercises yet. Edit this workout to add one." />
      )}
      {section === 'exercises' &&
        template.exercises.map((exercise, index) => {
          const detail = details.find((candidate) => candidate.exercise.id === exercise.exerciseId);
          return (
            <PreviewExercise
              key={index}
              exercise={exercise}
              name={detail?.exercise.name ?? 'Archived exercise'}
              mainMuscle={
                detail?.primaryMuscles.map((muscle) => MUSCLE_DISPLAY_NAMES[muscle]).join(', ') || 'No main muscle set'
              }
              isTimed={isTimedExercise(detail?.exercise.tracking)}
            />
          );
        })}
      {section === 'history' && <TemplateSessionHistory sessions={report.sessions} />}
      {section === 'analytics' && <TemplateSessionCharts report={report} />}
    </>
  );
}
