import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { TemplateFolderSummary, TemplateList } from '../../../core/queries/TemplateCatalog';
import { BackLink } from '../../design/components/BackLink';
import { Screen } from '../../design/components/Screen';
import { SettingsButton } from '../../design/components/SettingsButton';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import { LoggingErrorBanner } from '../workout/LoggingErrorBanner';
import { PlanMenu } from './PlanMenu';
import { PlanSessions } from './PlanSessions';
import { PlanWorkouts } from './PlanWorkouts';
import { TemplateDialogs } from './TemplateDialogs';
import type { TemplateDialogState } from './templateDialogState';
import { makeTemplateListActions } from './makeTemplateListActions';
import { startTemplateWorkout } from './templateActions';
import styles from './PlanPage.module.css';

/** Plan page sections mirror the owner's Workouts · History · Analytics direction. */
const sections = Object.freeze([
  { value: 'workouts', label: 'Workouts' },
  { value: 'history', label: 'History' },
  { value: 'analytics', label: 'Analytics' },
] as const);

/** One plan's navigation, management and scoped session tabs; starting returns to the live Workout tab. */
export function PlanPage({ folder, list }: { readonly folder: TemplateFolderSummary; readonly list: TemplateList }) {
  const navigate = useNavigate();
  const [section, setSection] = useState<'workouts' | 'history' | 'analytics'>('workouts');
  const [dialog, setDialog] = useState<TemplateDialogState | undefined>();
  const [isStarting, setIsStarting] = useState(false);
  const actions = makeTemplateListActions(list, setDialog);
  const start = (templateId: number) => {
    setIsStarting(true);
    void startTemplateWorkout(templateId).then((workoutId) => {
      setIsStarting(false);
      if (workoutId !== undefined) navigate('/');
    });
  };
  return (
    <Screen
      title={folder.name}
      leading={<BackLink to="/" label="Workout" />}
      trailing={
        <div className={styles.headerActions}>
          <SettingsButton />
          <PlanMenu
            folder={folder}
            index={list.folders.findIndex((candidate) => candidate.id === folder.id)}
            count={list.folders.length}
            actions={actions}
          />
        </div>
      }
    >
      <LoggingErrorBanner />
      <SegmentedControl label="Plan view" options={sections} value={section} onChange={setSection} />
      {section === 'workouts' ? (
        <PlanWorkouts folder={folder} actions={actions} />
      ) : (
        <PlanSessions folderId={folder.id} section={section} />
      )}
      <TemplateDialogs
        dialog={dialog}
        list={list}
        isBusy={isStarting}
        onStart={start}
        onClose={() => setDialog(undefined)}
      />
    </Screen>
  );
}
