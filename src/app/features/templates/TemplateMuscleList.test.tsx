import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import type { TemplateMuscleRow } from '../../../core/queries/TemplateMuscleSummary';
import { TemplateMuscleList } from './TemplateMuscleList';
import { TemplateMuscleSheet } from './TemplateMuscleSheet';

it('shows fractional and unweighted counts, frequency, untrained muscles, and the smaller-muscle toggle', () => {
  const html = renderToStaticMarkup(
    <TemplateMuscleList
      weekly
      summary={{
        sets: 3,
        workouts: 1,
        exercises: 1,
        secondaryWeight: 0.5,
        muscles: [
          { muscle: 'chest', direct: 2, indirect: 2, fractional: 3, frequency: 1, contributions: [] },
          { muscle: 'biceps', direct: 0, indirect: 0, fractional: 0, frequency: 0, contributions: [] },
          { muscle: 'neck', direct: 1, indirect: 0, fractional: 1, frequency: 1, contributions: [] },
        ],
      }}
    />,
  );
  expect(html).toContain('>Direct<');
  expect(html).toContain('>Indirect<');
  expect(html).toContain('1× a week');
  expect(html).not.toContain('Biceps');
  expect(html).toContain('Chest');
  expect(html).toContain('Show smaller muscles');
  expect(html).not.toContain('>Neck<');
});

it('renders contributions in the muscle sheet', () => {
  const row: TemplateMuscleRow = {
    muscle: 'chest',
    direct: 4,
    indirect: 4,
    fractional: 6,
    frequency: 2,
    contributions: [
      { exerciseId: 1, name: 'Press', direct: 4, indirect: 0, fractional: 4, workouts: ['Push A', 'Push B'] },
      { exerciseId: 2, name: 'Fly', direct: 0, indirect: 4, fractional: 2, workouts: ['Push A'] },
    ],
  };
  const html = renderToStaticMarkup(<TemplateMuscleSheet row={row} showWorkouts onClose={() => {}} />);
  expect(html).toContain('6 sets — 4 direct + 4 indirect');
  expect(html).toContain('Press');
  expect(html).toContain('Push A, Push B');
  expect(html).toContain('4 indirect');
  expect(html).toContain('2 sets');
});
