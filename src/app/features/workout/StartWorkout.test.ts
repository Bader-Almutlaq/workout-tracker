import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test, vi } from 'vitest';
import { StartWorkout } from './StartWorkout';

vi.mock('../../design/drag/WorkoutDrag', () => ({ WorkoutDrag: ({ children }: { children: ReactNode }) => children }));
vi.mock('../templates/templateActions', () => ({ startTemplateWorkout: vi.fn() }));
vi.mock('./workoutActions', () => ({ startEmptyWorkout: vi.fn() }));
vi.mock('../templates/TemplatesSection', () => ({ TemplatesSection: () => createElement('div', {}, 'Plans') }));
vi.mock('./LoggingErrorBanner', () => ({ LoggingErrorBanner: () => null }));

test('workout tab shows plans and the history link without a past workouts section', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(StartWorkout)));
  expect(html).toContain('Plans');
  expect(html).toContain('href="/history"');
  expect(html).not.toContain('Past workouts');
});
