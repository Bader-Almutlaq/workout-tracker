import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { AddExerciseBar } from './AddExerciseBar';

test('the add button reports the entire selection count', () => {
  const html = renderToStaticMarkup(createElement(AddExerciseBar, { count: 2, onAdd: () => undefined }));
  expect(html).toContain('Add (2)');
});
