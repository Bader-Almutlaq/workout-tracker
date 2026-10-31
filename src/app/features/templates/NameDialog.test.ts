import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { FolderNameDialog } from './FolderNameDialog';
import { RenameWorkoutDialog } from '../workout/RenameWorkoutDialog';

test('name dialogs submit valid input through a form and disable empty names', () => {
  const blank = renderToStaticMarkup(
    createElement(FolderNameDialog, {
      title: 'New plan',
      confirmLabel: 'Create',
      initialName: '',
      onConfirm: () => undefined,
      onCancel: () => undefined,
    }),
  );
  const filled = renderToStaticMarkup(
    createElement(RenameWorkoutDialog, {
      name: 'Workout',
      onRename: () => undefined,
      onCancel: () => undefined,
    }),
  );
  expect(blank).toContain('<form>');
  expect(blank).toMatch(/type="submit"[^>]*disabled/);
  expect(filled).toContain('<form>');
  expect(filled).toMatch(/type="submit"/);
});
