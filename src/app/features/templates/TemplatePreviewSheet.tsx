import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { TemplatePreview } from './TemplatePreview';
import { WorkoutSheet } from './WorkoutSheet';

/** Loads one saved workout, including archived exercise details, and keeps Start pinned outside its scroller. */
export function TemplatePreviewSheet({
  templateId,
  name,
  isBusy,
  onStart,
  onEdit,
  onClose,
}: {
  readonly templateId: number;
  readonly name: string;
  readonly isBusy: boolean;
  readonly onStart: () => void;
  readonly onEdit: () => void;
  readonly onClose: () => void;
}) {
  const template = useDatabaseQuery(`template-${templateId}`, () => database.templateDetail(templateId));
  const report = useDatabaseQuery(`template-sessions-${templateId}`, () => database.templateSessions({ templateId }));
  const details = useDatabaseQuery(`template-exercises-${templateId}`, async () => {
    const draft = await database.templateDetail(templateId);
    const ids = [...new Set(draft?.exercises.map((exercise) => exercise.exerciseId) ?? [])];
    const entries = await Promise.all(ids.map((id) => database.exerciseDetail(id)));
    return entries.flatMap((detail) => (detail === null ? [] : [detail]));
  });
  const body = () => {
    if (template.status === 'ready' && template.value === null)
      return <EmptyState message="This workout no longer exists." />;
    const failure = [template, report, details].find((query) => query.status === 'failed');
    if (failure?.status === 'failed') return <EmptyState message={failure.message} />;
    if (
      template.status !== 'ready' ||
      template.value === null ||
      report.status !== 'ready' ||
      details.status !== 'ready'
    )
      return <EmptyState message="Loading…" />;
    return (
      <TemplatePreview
        key={templateId}
        template={template.value}
        details={details.value}
        report={report.value}
        onEdit={onEdit}
      />
    );
  };
  return (
    <WorkoutSheet
      title={template.status === 'ready' && template.value !== null ? template.value.name : name}
      isBusy={isBusy}
      canStart={template.status === 'ready' && template.value !== null}
      onStart={onStart}
      onEdit={onEdit}
      onClose={onClose}
    >
      {body()}
    </WorkoutSheet>
  );
}
