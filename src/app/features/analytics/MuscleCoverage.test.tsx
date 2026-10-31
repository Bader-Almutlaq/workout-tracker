import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { BalanceRatios } from './BalanceRatios';
import { MuscleFrequencyList } from './MuscleFrequencyList';
import { NeglectedMuscles } from './NeglectedMuscles';

describe('muscle coverage components', () => {
  test('shows the neglected empty message and direct training history', () => {
    expect(renderToStaticMarkup(<NeglectedMuscles muscles={[]} />)).toContain('None in the last 4 weeks');
    expect(
      renderToStaticMarkup(
        <NeglectedMuscles muscles={[{ muscle: 'chest', setsPerWeek: 0, daysPerWeek: 0, daysSince: 9 }]} />,
      ),
    ).toContain('9 days since direct training');
  });
  test('offers the smaller-muscle toggle and hides smaller muscles initially', () => {
    const html = renderToStaticMarkup(
      <MuscleFrequencyList
        muscles={[{ muscle: 'neck', setsPerWeek: 1, daysPerWeek: 1, daysSince: null }]}
        onSelect={() => {}}
      />,
    );
    expect(html).toContain('Show smaller muscles');
    expect(html).not.toContain('>Neck<');
  });
  test('formats ratios and missing values', () => {
    const html = renderToStaticMarkup(
      <BalanceRatios
        ratios={[
          { label: 'Push : pull', first: 7, second: 5, ratio: 1.4 },
          { label: 'Other', first: 0, second: 1, ratio: null },
        ]}
      />,
    );
    expect(html).toContain('1.4 : 1');
    expect(html).toContain('—');
  });
});
