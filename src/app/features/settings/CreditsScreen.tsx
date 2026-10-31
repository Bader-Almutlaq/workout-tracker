import { BackLink } from '../../design/components/BackLink';
import { Screen } from '../../design/components/Screen';
import { Section, SectionRow } from '../../design/components/Section';

/** Attribution for bundled exercise instructions and optional public-domain pictures. */
export function CreditsScreen() {
  return (
    <Screen title="Credits" leading={<BackLink to="/settings" label="Settings" />}>
      <Section
        label="Exercise library"
        footnote="Instructions and pictures from free-exercise-db, dedicated to the public domain under the Unlicense. JEM maintains its own exercise names and muscle tags."
      >
        <SectionRow
          label="free-exercise-db"
          value={
            <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
              Source · Unlicense
            </a>
          }
        />
      </Section>
      <Section label="Exercise illustrations" footnote="Illustrations shown unmodified; licensed under CC BY-SA 4.0.">
        <SectionRow
          label="everkinetic"
          value={
            <a href="https://github.com/everkinetic/data" target="_blank" rel="noreferrer">
              Source · CC BY-SA 4.0
            </a>
          }
        />
        <SectionRow
          label="Licence"
          value={
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
              CC BY-SA 4.0
            </a>
          }
        />
      </Section>
    </Screen>
  );
}
