import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { LongRangeChart, type LongRangeChartProps } from './LongRangeChart';
import { LongRangePlot } from './LongRangePlot';
import { LongRangeChartSheet } from './LongRangeChartSheet';
import styles from './LongRangeChart.module.css';

const props: LongRangeChartProps = {
  title: 'Synthetic trend',
  aggregation: 'mean',
  formatValue: String,
  series: [
    {
      name: 'Example',
      points: [
        { date: '2020-01-01T12:00:00Z', value: 10 },
        { date: '2020-01-02T12:00:00Z', value: 14 },
        { date: '2024-05-01T12:00:00Z', value: 20 },
      ],
    },
  ],
};

test('overview is monthly for years of data, renders the spread, and offers expansion and a table', () => {
  const markup = renderToStaticMarkup(createElement(LongRangeChart, props));
  expect(markup).toContain('Monthly');
  expect(markup).toContain(`class="${styles.band}"`);
  expect(markup).toContain('Open Synthetic trend full screen');
  expect(markup).toContain('Show as table');
  expect(markup).not.toContain('role="slider"');
});

test('full screen offers all four ranges, a close button and the existing touch control', () => {
  const markup = renderToStaticMarkup(createElement(LongRangeChartSheet, { ...props, onClose: () => undefined }));
  for (const label of ['3M', '6M', '1Y', 'All', 'Close']) expect(markup).toContain(`>${label}<`);
  expect(markup).toContain('Synthetic trend full screen');
  expect(markup).toContain('role="slider"');
  expect(markup).toContain('Daily');
  expect(markup).toContain('Show as table');
});

test('All full-screen uses finer weeks and pairs remain named independent lines', () => {
  const markup = renderToStaticMarkup(
    createElement(LongRangePlot, {
      ...props,
      detailed: true,
      series: [...props.series, { name: 'Other side', points: [{ date: '2020-01-01', value: 25 }] }],
    }),
  );
  expect(markup).toContain('Weekly');
  expect(markup).toContain('Other side');
  expect(markup.split(`class="${styles.line}"`)).toHaveLength(3);
});

test('empty input stays readable and a single day with several observations retains its min–max mark', () => {
  const empty = renderToStaticMarkup(createElement(LongRangeChart, { ...props, series: [] }));
  expect(empty).toContain('No data in this range.');
  expect(empty).not.toContain('<svg');
  const markup = renderToStaticMarkup(
    createElement(LongRangeChart, {
      ...props,
      series: [
        {
          name: 'Example',
          points: [
            { date: '2024-01-01T01:00:00Z', value: 3 },
            { date: '2024-01-01T20:00:00Z', value: 7 },
          ],
        },
      ],
    }),
  );
  expect(markup).toContain(`<rect class="${styles.band}"`);
  expect(markup).not.toContain('NaN');
  expect(markup).not.toContain('Infinity');
});

test('weekly session sums keep separate weeks even over a short range and expand to daily totals', () => {
  const frequency: LongRangeChartProps = {
    title: 'Session count',
    aggregation: 'sum',
    overviewBucket: 'week',
    formatValue: String,
    series: [
      {
        name: 'Sessions',
        points: [
          { date: '2024-01-01T12:00:00Z', value: 1 },
          { date: '2024-01-02T12:00:00Z', value: 1 },
          { date: '2024-01-08T12:00:00Z', value: 1 },
        ],
      },
    ],
  };
  const overview = renderToStaticMarkup(createElement(LongRangePlot, frequency));
  expect(overview).toContain('Weekly total');
  expect(overview.match(/<circle /g)).toHaveLength(2);
  expect(overview).not.toContain(`class="${styles.band}"`);
  const expanded = renderToStaticMarkup(createElement(LongRangePlot, { ...frequency, detailed: true }));
  expect(expanded).toContain('Daily total');
  expect(expanded.match(/<circle /g)).toHaveLength(3);
});
