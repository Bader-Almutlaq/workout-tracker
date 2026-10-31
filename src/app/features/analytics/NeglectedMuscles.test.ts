import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { NeglectedMuscles } from './NeglectedMuscles';

test('collapses muscles with no recent training while retaining trained rows', () => {
  const html = renderToStaticMarkup(
    createElement(NeglectedMuscles, {
      muscles: [
        { muscle: 'chest', setsPerWeek: 0, recentSetsPerWeek: 0.5, daysPerWeek: 0, daysSince: 9 },
        { muscle: 'lats', setsPerWeek: 1, recentSetsPerWeek: 0, daysPerWeek: 0, daysSince: 100 },
      ],
    }),
  );
  expect(html).toContain('9 days since direct training');
  expect(html).toContain('Not trained in the last 4 weeks:');
  expect(html).not.toContain('100 days');
});
