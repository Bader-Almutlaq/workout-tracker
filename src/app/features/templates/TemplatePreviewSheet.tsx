import { database, useDatabaseQuery } from '../../data/database';
import { BottomSheet } from '../../design/components/BottomSheet';
import { Button } from '../../design/components/Button';
import { EmptyState } from '../../design/components/EmptyState';
import { exerciseNamesById } from './exerciseNames';
import { useTemplateTracking } from './useTemplateTracking';
import { TemplatePreview } from './TemplatePreview';

/**
 * A compact look at a template before starting it: its exercises with their sets, then Start and
 * Edit. Tapping outside the sheet closes it.
 */
export function TemplatePreviewSheet({
  templateId,
  name,
  isBusy,
  onStart,
  onEdit,
  onClose,
}: {
  readonly templateId: number;
  /** The name shown in the sheet's title while the rest loads. */
  readonly name: string;
  readonly isBusy: boolean;
  readonly onStart: () => void;
  readonly onEdit: () => void;
  readonly onClose: () => void;
}) {
  const template = useDatabaseQuery(`template-${templateId}`, () => database.templateDetail(templateId));
  const entries = useDatabaseQuery('exercise-entries', () => database.exerciseEntries());
  const tracking = useTemplateTracking(
    template.status === 'ready' && template.value !== null ? template.value.exercises : [],
  );

  const body = () => {
    if (template.status === 'failed') return <EmptyState message={template.message} />;
    if (entries.status === 'failed') return <EmptyState message={entries.message} />;
    if (tracking.status === 'failed') return <EmptyState message={tracking.message} />;
    if (template.status !== 'ready' || entries.status !== 'ready') return <EmptyState message="Loading…" />;
    if (template.value === null)
      return (
        <>
          <EmptyState message="This template no longer exists." />
          <Button onPress={onClose}>Close</Button>
        </>
      );
    return (
      <TemplatePreview
        template={template.value}
        names={exerciseNamesById(entries.value)}
        tracking={tracking.status === 'ready' ? tracking.value : new Map()}
        isBusy={isBusy}
        onStart={onStart}
        onEdit={onEdit}
      />
    );
  };

  return (
    <BottomSheet title={name} onClose={onClose}>
      {body()}
    </BottomSheet>
  );
}
