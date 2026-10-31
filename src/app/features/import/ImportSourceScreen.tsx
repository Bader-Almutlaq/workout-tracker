import { BackLink } from '../../design/components/BackLink';
import { LinkRow } from '../../design/components/LinkRow';
import { Screen } from '../../design/components/Screen';
import { Section } from '../../design/components/Section';
import { importSources } from './importSources';
import styles from './StrongImportScreen.module.css';

/** Choose the app that created the workout export. */
export function ImportSourceScreen() {
  return (
    <Screen title="Import workouts" leading={<BackLink to="/settings" label="Settings" />}>
      <Section label="Choose an app" footnote="Each app exports its own kind of file. Pick the app you're coming from.">
        {Object.entries(importSources).map(([key, source]) => (
          <LinkRow key={key} to={`/settings/import/${key}`}>
            <div>{source.name}</div>
            <div className={styles.note}>{source.summary}</div>
          </LinkRow>
        ))}
      </Section>
    </Screen>
  );
}
