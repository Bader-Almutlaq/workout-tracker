import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { NumberPad } from './NumberPad';

test('RPE mode exposes quick picks, hide, step and next controls', () => {
  const html = renderToStaticMarkup(
    createElement(NumberPad, {
      title: 'RPE 8 · 2 reps left',
      allowsDecimal: true,
      unit: undefined,
      errorMessage: undefined,
      onDismissError: vi.fn(),
      onKey: vi.fn(),
      onStep: vi.fn(),
      onNext: vi.fn(),
      onDone: vi.fn(),
      onUnitChange: vi.fn(),
      onRpe: vi.fn(),
      onQuickRpe: vi.fn(),
      isRpe: true,
    }),
  );
  expect(html).toContain('RPE 8 · 2 reps left');
  expect(html).toContain('>7.5</button>');
  expect(html).toContain('aria-label="Hide pad"');
  expect(html).toContain('aria-label="Decrease"');
  expect(html).toContain('aria-label="Next field"');
});
