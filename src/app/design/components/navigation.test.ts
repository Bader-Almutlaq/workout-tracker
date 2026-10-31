import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test } from 'vitest';
import { Screen } from './Screen';
import { TabBar, TABS } from './TabBar';

function render(path: string, child: ReturnType<typeof createElement>) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, child));
}

test('the five tabs have the requested order and Measure owns its nested route', () => {
  expect(TABS.map((tab) => tab.label)).toEqual(['Workout', 'History', 'Exercises', 'Measure', 'Analytics']);
  const markup = render('/measure/waist', createElement(TabBar));
  expect(markup).toContain('href="/measure"');
  expect(markup).toContain('lucide-ruler');
  expect(markup).not.toContain('href="/settings"');
  expect(markup).toMatch(/class="[^"]*active" href="\/measure"/);
});

test.each(['/', '/history', '/exercises', '/measure', '/analytics'])(
  'main tab %s has one accessible Settings gear',
  (path) => {
    const markup = render(path, createElement(Screen, { title: 'Test', children: 'Content' }));
    expect(markup.match(/aria-label="Settings"/g)).toHaveLength(1);
    expect(markup).toContain('href="/settings"');
    expect(markup).toContain('lucide-settings');
  },
);

test.each(['/settings', '/settings/import', '/measure/waist', '/history/example'])(
  'pushed page %s does not acquire a main-tab gear',
  (path) => {
    expect(render(path, createElement(Screen, { title: 'Test', children: 'Content' }))).not.toContain(
      'aria-label="Settings"',
    );
  },
);

test('an explicit trailing action occupies the header slot', () => {
  const markup = render(
    '/measure',
    createElement(Screen, {
      title: 'Test',
      trailing: createElement('button', {}, 'Custom action'),
      children: 'Content',
    }),
  );
  expect(markup).toContain('Custom action');
  expect(markup).not.toContain('aria-label="Settings"');
});

test('explicit null suppresses the default Settings gear on a tab root', () => {
  const markup = render('/', createElement(Screen, { title: 'Workout', trailing: null, children: 'Content' }));
  expect(markup).not.toContain('aria-label="Settings"');
});
