import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { TemplateMuscleList } from './TemplateMuscleList';

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
          { muscle: 'chest', direct: 2, indirect: 2, fractional: 3, frequency: 1 },
          { muscle: 'biceps', direct: 0, indirect: 0, fractional: 0, frequency: 0 },
          { muscle: 'neck', direct: 1, indirect: 0, fractional: 1, frequency: 1 },
        ],
      }}
    />,
  );
  expect(html).toContain('2 direct + 2 indirect');
  expect(html).toContain('1× a week');
  expect(html).toContain('Not trained');
  expect(html).toContain('Show smaller muscles');
  expect(html).not.toContain('>Neck<');
});
