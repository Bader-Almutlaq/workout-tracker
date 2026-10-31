import { useState } from 'react';
import { Section, SectionRow } from '../../design/components/Section';
import { savedExercisePictures, saveExercisePictures, type PicturePreference } from '../exercises/picturePreference';

/** Phone-local picture preference; instructions are always available. */
export function ExercisePicturesSetting() {
  const [preference, setPreference] = useState(savedExercisePictures);
  const [error, setError] = useState<string | null>(null);
  const choose = (value: PicturePreference) => {
    const failure = saveExercisePictures(value);
    setError(failure);
    if (failure === null) setPreference(value);
  };
  return (
    <Section label="Exercise pictures" footnote="Pictures download when viewed and are saved for offline use.">
      <SectionRow
        label="Exercise pictures"
        value={
          <select
            aria-label="Exercise pictures"
            value={preference}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'drawings' || value === 'photos' || value === 'off') choose(value);
            }}
          >
            <option value="drawings">Drawings first</option>
            <option value="photos">Photos only</option>
            <option value="off">Off</option>
          </select>
        }
      />
      {error !== null && <p role="alert">{error}</p>}
    </Section>
  );
}
