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

it('plan latest use follows current workouts and ignores active sessions', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  try {
    db.exec(`
      INSERT INTO templateFolder (id, name, position) VALUES (1, 'Synthetic plan', 0), (2, 'Empty plan', 1);
      INSERT INTO template (id, name, folderId, position, createdAt, updatedAt)
      VALUES (1, 'First workout', 1, 0, 'a', 'b'), (2, 'Second workout', 1, 1, 'a', 'b');
      INSERT INTO workout (startedAt, name, source, templateId, isInProgress)
      VALUES ('2024-01-01', 'Earlier', 'app', 1, 0),
             ('2024-01-03', 'Latest finished', 'app', 2, 0),
             ('2024-01-05', 'Active', 'app', 1, 1);
    `);
    expect(TemplateCatalog.list(db).folders.map((folder) => folder.lastStartedAt)).toEqual(['2024-01-03', null]);
  } finally {
    db.close();
  }
});

it('orders scheduled workouts by weekday, then unscheduled workouts in stored order', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db);
    db.exec(`
      INSERT INTO templateFolder (id, name, position) VALUES (1, 'Plan', 0);
      INSERT INTO template (name, folderId, position, createdAt, updatedAt, weekday) VALUES
        ('No day', 1, 0, 'a', 'a', NULL), ('Saturday', 1, 1, 'a', 'a', 6),
        ('Monday', 1, 2, 'a', 'a', 1), ('No day 2', 1, 3, 'a', 'a', NULL);
    `);
    expect(TemplateCatalog.list(db).folders[0]?.templates.map((item) => item.name)).toEqual([
      'Monday',
      'Saturday',
      'No day',
      'No day 2',
    ]);
  } finally {
    db.close();
  }
});
