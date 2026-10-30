import { useState } from 'react';
import { Section, SectionRow } from '../../design/components/Section';
import { savedExercisePictures, saveExercisePictures } from '../exercises/picturePreference';

/** Phone-local picture preference, on by default; instructions are always available. */
export function ExercisePicturesSetting() {
  const [show, setShow] = useState(savedExercisePictures);
  const [error, setError] = useState<string | null>(null);
  const choose = (value: boolean) => {
    const failure = saveExercisePictures(value);
    setError(failure);
    if (failure === null) setShow(value);
  };
  return (
    <Section label="Exercise pictures" footnote="Pictures download when viewed and are saved for offline use.">
      <SectionRow
        label="Show exercise pictures"
        value={
          <input
            aria-label="Show exercise pictures"
            type="checkbox"
            checked={show}
            onChange={(event) => choose(event.target.checked)}
          />
        }
      />
      {error !== null && <p role="alert">{error}</p>}
    </Section>
  );
}
