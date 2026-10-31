import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, test, vi } from 'vitest';
import type { WorkoutFileFormat } from '../../../core/import/formats/detectWorkoutFileFormat';
import { ImportPickStep } from './ImportPickStep';
import { importSources, isImportSource, wrongImportSource } from './importSources';

vi.mock('../../data/database', () => ({}));
import { StrongImportScreen } from './StrongImportScreen';

describe('import sources', () => {
  test('covers all supported formats with export steps', () => {
    const formats: Exclude<WorkoutFileFormat, 'unknown'>[] = ['strong', 'hevy', 'fitnotes', 'fitbod'];
    expect(Object.keys(importSources)).toEqual(formats);
    for (const format of formats) expect(importSources[format].steps.length).toBeGreaterThan(0);
    expect(isImportSource('__proto__')).toBe(false);
  });

  test('unknown source redirects to the list', () => {
    // Navigate uses an effect in the browser; the rendered redirect itself has no page content.
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/settings/import/unknown']}>
        <Routes>
          <Route path="/settings/import/:source" element={<StrongImportScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(markup).toBe('');
  });

  test('offers the detected app after a wrong-file error', () => {
    const message = 'This looks like a Hevy export, not a Strong export.';
    const detected = wrongImportSource(message, 'strong');
    const markup = renderToStaticMarkup(
      <ImportPickStep
        source="strong"
        failed
        message={message}
        choose={() => {}}
        detected={detected}
        switchSource={() => {}}
      />,
    );
    expect(markup).toContain(message);
    expect(markup).toContain('Import as Hevy instead');
    expect(markup).toContain('Choose files again');
  });
});
