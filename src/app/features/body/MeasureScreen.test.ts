import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { expect, test, vi } from 'vitest';
import { measurementChange } from '../../../core/measurements/MeasurementChange';
import type { MeasurementGroup } from '../../../core/measurements/MeasurementQueries';
import { MeasureScreen } from './MeasureScreen';
import { AddBodyPartSheet } from './AddBodyPartSheet';
import { partitionMeasurementGroups } from './measurementText';

vi.mock('../../data/database', () => ({
  database: {},
  useDatabaseQuery: (key: string) => ({
    status: 'ready',
    value: key.startsWith('measurement-group-')
      ? fixtureGroups()
          .filter((group) => key === `measurement-group-${group.key}`)
          .flatMap((group) =>
            group.sites.map((summary) => ({
              ...summary,
              entries: summary.relaxed.latest === null ? [] : [summary.relaxed.latest],
            })),
          )
      : { groups: fixtureGroups(), units: { lengthUnit: 'cm', weightUnit: 'kg' } },
  }),
}));

function fixtureGroups(): MeasurementGroup[] {
  return ['neck', 'waist', 'bodyweight'].map((key, index) => ({
    key,
    name: key === 'neck' ? 'Neck' : key === 'waist' ? 'Waist' : 'Bodyweight',
    sites: [
      {
        site: {
          key,
          name: key,
          kind: key === 'bodyweight' ? 'mass' : 'length',
          groupKey: key,
          side: null,
          supportsFlexed: false,
          guide: '',
          position: index,
          isCustom: false,
        },
        relaxed: measurementChange(
          key === 'neck'
            ? []
            : [
                {
                  id: index,
                  takenAt: '2025-01-01',
                  site: key,
                  value: 71.5,
                  state: 'relaxed',
                  entryUnit: null,
                  source: 'app',
                },
              ],
          'relaxed',
        ),
        flexed: measurementChange([], 'flexed'),
      },
    ],
  }));
}

test('Measure hides never-recorded parts and bodyweight, with a row-level quick log and a Settings gear', () => {
  const markup = renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: ['/measure'] }, createElement(MeasureScreen)),
  );
  expect(markup).toContain('Waist');
  expect(markup).toContain('71.5 cm');
  expect(markup).toContain('aria-label="Log Waist"');
  expect(markup).toContain('aria-label="Settings"');
  expect(markup).toContain('Add body part');
  expect(markup).not.toContain('Neck');
  expect(markup).not.toContain('Bodyweight');
  expect(markup).not.toContain('Not measured yet');
});

test('Add body part offers hidden built-ins and new creation without exposing bodyweight', () => {
  const { unmeasured } = partitionMeasurementGroups(fixtureGroups());
  const markup = renderToStaticMarkup(
    createElement(AddBodyPartSheet, {
      groups: unmeasured,
      onChoose: () => undefined,
      onNew: () => undefined,
      onClose: () => undefined,
    }),
  );
  expect(markup).toContain('Neck');
  expect(markup).toContain('New body part…');
  expect(markup).not.toContain('Bodyweight');
  expect(markup).not.toContain('Waist');
});

test('body-part deep links render the shared sections and keep the Measure back link', () => {
  const markup = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/measure/waist'] },
      createElement(
        Routes,
        {},
        createElement(Route, { path: '/measure/:bodyPart', element: createElement(MeasureScreen) }),
      ),
    ),
  );
  expect(markup).toContain('href="/measure"');
  expect(markup).toContain('Body part view');
  expect(markup).toContain('>Chart<');
  expect(markup).toContain('>History<');
  expect(markup).toContain('>Log<');
  expect(markup).toContain('Open Waist full screen');
  expect(markup).not.toContain('aria-label="Settings"');
});

test('bodyweight cannot be reached through a Measure deep link', () => {
  const markup = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/measure/bodyweight'] },
      createElement(
        Routes,
        {},
        createElement(Route, { path: '/measure/:bodyPart', element: createElement(MeasureScreen) }),
      ),
    ),
  );
  expect(markup).toContain('This body part no longer exists.');
  expect(markup).not.toContain('Measurement history chart');
});
