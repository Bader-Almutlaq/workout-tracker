import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { MemoryRouter } from 'react-router';
import { SessionEffortChart } from './SessionEffortChart';

test('the table contains each session date and value for both measures', () => {
  const sessions = [{ date: '2026-01-05T12:00:00Z', workoutId: 1, isDeload: true, hardSets: 3, averageRir: 2 }];
  for (const effort of [false, true]) {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(SessionEffortChart, { sessions, effort })),
    );
    expect(html).toContain('<table');
    expect(html).toContain('Jan');
    expect(html).toContain(effort ? '2.0 RIR' : '3.0 sets');
    expect(html).toContain('Deload');
  }
});
