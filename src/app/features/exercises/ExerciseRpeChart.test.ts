import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { rtsRpeChart, liftRpeChart } from '../../../core/analytics/RpeChart';
import { ExerciseRpeChartContent } from './ExerciseRpeChartContent';
import { ExerciseRpeTable } from './ExerciseRpeTable';

const curve = { k: 20, kStart: 29, personalSets: 46, isPersonal: true };
const guide = rtsRpeChart();
const lift = liftRpeChart(curve, 120, { minimumKilograms: 20, stepKilograms: 2.5 });
test('Records defaults to kg for a fitted lift and displays learned-set count and muted cells', () => {
  const markup = renderToStaticMarkup(
    createElement(ExerciseRpeChartContent, { chart: { guide, lift, curve, estimate: 120 }, unit: 'kg' }),
  );
  expect(markup).toContain('RPE chart');
  expect(markup).toContain('From e1RM 120 kg');
  expect(markup).toContain('learned from 46 sets');
  expect(markup).toContain('aria-checked="true"');
  expect(markup).toContain('Lower reliability: effective reps above 12');
  expect(markup).not.toContain('95.5%');
});
test('no estimate defaults to the RTS percentage guide, with all half-step rows and reps', () => {
  const markup = renderToStaticMarkup(
    createElement(ExerciseRpeChartContent, { chart: { guide, lift: [], curve, estimate: null }, unit: 'kg' }),
  );
  expect(markup).toContain('Guide: RTS chart, the same for every lift');
  expect(markup).toContain('95.5%');
  expect(markup).toContain('97.8%');
  expect(markup).toContain('46.4%');
  expect(markup).toContain('>9.5</th>');
  expect(markup).toContain('>15</th>');
});
test('both table modes use their own data and unit conversion, with lift-type default caption', () => {
  expect(renderToStaticMarkup(createElement(ExerciseRpeTable, { rows: guide, mode: 'percent', unit: 'kg' }))).toContain(
    '95.5%',
  );
  expect(renderToStaticMarkup(createElement(ExerciseRpeTable, { rows: lift, mode: 'weight', unit: 'lb' }))).toContain(
    '264.55',
  );
  const markup = renderToStaticMarkup(
    createElement(ExerciseRpeChartContent, {
      chart: { guide, lift, curve: { ...curve, isPersonal: false }, estimate: 120 },
      unit: 'kg',
    }),
  );
  expect(markup).toContain('lift-type default');
});
