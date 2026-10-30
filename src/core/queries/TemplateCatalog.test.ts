import { expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { TemplateCatalog } from './TemplateCatalog';

it('returns ordered summaries and editor detail, including empty and missing states', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  expect(TemplateCatalog.list(db)).toEqual({ folders: [], unfiled: [] });
  expect(TemplateCatalog.detail(db, 99)).toBeUndefined();
  db.exec(`INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Bench', 'custom', '2026-01-01');
    INSERT INTO template (id, name, position, createdAt, updatedAt, lastStartedAt) VALUES (1, 'Push', 0, 'a', 'b', 'c');
    INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (1, 1, 1, 0);
    INSERT INTO templateSet (templateExerciseId, position, kind) VALUES (1, 0, 'working'), (1, 1, 'drop');`);
  expect(TemplateCatalog.list(db).unfiled[0]).toMatchObject({
    exerciseNames: ['Bench'],
    setCount: 2,
    lastStartedAt: null,
  });
  expect(TemplateCatalog.detail(db, 1)?.exercises[0]?.sets).toHaveLength(2);
});

it('derives last done only from finished workouts, ignoring stale stamps and active workouts', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO template (id, name, position, createdAt, updatedAt, lastStartedAt)
    VALUES (1, 'Push', 0, 'a', 'b', '2099-01-01');
    INSERT INTO workout (startedAt, name, source, templateId, isInProgress)
    VALUES ('2026-01-01', 'Finished', 'app', 1, 0), ('2026-02-01', 'Active', 'app', 1, 1);
  `);
  expect(TemplateCatalog.list(db).unfiled[0]?.lastStartedAt).toBe('2026-01-01');
});
