import { isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { TemplateMuscleList } from './TemplateMuscleList';

const state = vi.hoisted(() => ({ smaller: false, calls: 0 }));
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useState: (initial: unknown) => {
    state.calls += 1;
    return state.calls % 2 === 1
      ? [initial, vi.fn()]
      : [
          state.smaller,
          (value: boolean) => {
            state.smaller = value;
          },
        ];
  },
}));
const summary = {
  sets: 2,
  workouts: 1,
  exercises: 1,
  secondaryWeight: 0.5,
  muscles: [
    { muscle: 'chest' as const, direct: 1, indirect: 0, fractional: 1, frequency: 1, contributions: [] },
    { muscle: 'neck' as const, direct: 1, indirect: 0, fractional: 1, frequency: 1, contributions: [] },
  ],
};
function renderList() {
  state.calls = 0;
  return TemplateMuscleList({ summary, weekly: false });
}
function findButton(node: ReactNode, label: string): (() => void) | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findButton(child, label);
      if (found !== undefined) return found;
    }
  }
  if (isValidElement<{ children?: ReactNode; onClick?: () => void }>(node)) {
    if (node.type === 'button' && node.props.children === label) return node.props.onClick;
    return findButton(node.props.children, label);
  }
  return undefined;
}
test('smaller muscles appear in a separate group and can be hidden again', () => {
  state.smaller = false;
  let tree = renderList();
  expect(renderToStaticMarkup(tree)).not.toContain('>Neck<');
  const show = findButton(tree, 'Show smaller muscles');
  expect(show).toBeDefined();
  show?.();
  tree = renderList();
  const html = renderToStaticMarkup(tree);
  expect(html).toContain('>Smaller muscles</h3>');
  expect(html.indexOf('>Smaller muscles</h3>')).toBeLessThan(html.indexOf('>Neck</strong>'));
  const hide = findButton(tree, 'Hide smaller muscles');
  expect(hide).toBeDefined();
  hide?.();
  expect(renderToStaticMarkup(renderList())).not.toContain('>Neck<');
});
