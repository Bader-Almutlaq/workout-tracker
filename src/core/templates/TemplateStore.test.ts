import { beforeEach, describe, expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { TemplateCatalog } from '../queries/TemplateCatalog';
import { TemplateStore } from './TemplateStore';
import type { TemplateDraft } from './TemplateDraft';

const now = new Date('2026-01-01T00:00:00Z');
const draft: TemplateDraft = {
  name: 'Push',
  folderId: null,
  notes: 'notes',
  exercises: [
    {
      exerciseId: 1,
      supersetGroup: 2,
      notes: 'entry',
      sets: [{ kind: 'working', targetRepsLow: 5, targetRepsHigh: 8, targetRpe: 8 }],
    },
  ],
};
let db: Database;
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
  db.exec(`INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Bench', 'custom', '2026-01-01')`);
});
describe('template store', () => {
  it('creates, renames, reorders and deletes folders while preserving template order', () => {
    const first = TemplateStore.createFolder(db, 'First');
    const second = TemplateStore.createFolder(db, 'Second');
    TemplateStore.renameFolder(db, first, 'Renamed');
    TemplateStore.reorderFolder(db, second, 0);
    const unfiled = TemplateStore.save(db, draft, now);
    const a = TemplateStore.save(db, { ...draft, name: 'A', folderId: first }, now);
    const b = TemplateStore.save(db, { ...draft, name: 'B', folderId: first }, now);
    TemplateStore.reorder(db, b, 0);
    expect(TemplateCatalog.list(db).folders.map((folder) => folder.name)).toEqual(['Second', 'Renamed']);
    TemplateStore.deleteFolder(db, first);
    expect(TemplateCatalog.list(db).unfiled.map((item) => item.id)).toEqual([unfiled, b, a]);
  });
  it('saves, replaces, renames, moves, duplicates and deletes templates', () => {
    const folder = TemplateStore.createFolder(db, 'Folder');
    const id = TemplateStore.save(db, draft, now);
    TemplateStore.save(
      db,
      {
        ...draft,
        id,
        notes: null,
        exercises: [
          {
            ...draft.exercises[0],
            exerciseId: 1,
            supersetGroup: null,
            notes: null,
            sets: [{ kind: 'drop', targetRepsLow: null, targetRepsHigh: null, targetRpe: null }],
          },
        ],
      },
      now,
    );
    TemplateStore.rename(db, id, 'New', now);
    TemplateStore.move(db, id, folder);
    const copy = TemplateStore.duplicate(db, id, now);
    expect(TemplateCatalog.detail(db, copy)).toMatchObject({
      name: 'New copy',
      folderId: folder,
      exercises: [{ sets: [{ kind: 'drop' }] }],
    });
    TemplateStore.delete(db, id);
    expect(TemplateCatalog.list(db).folders[0]?.templates.map((item) => item.id)).toEqual([copy]);
  });
  it('rejects invalid drafts atomically', () => {
    const set = draft.exercises[0]?.sets[0];
    if (set === undefined) throw new Error('Missing fixture');
    const exercise = draft.exercises[0];
    if (exercise === undefined) throw new Error('Missing fixture');
    for (const invalid of [
      { ...draft, name: ' ' },
      { ...draft, exercises: [] },
      { ...draft, exercises: [{ ...exercise, sets: [] }] },
      { ...draft, exercises: [{ ...exercise, sets: [{ ...set, targetRepsHigh: 4 }] }] },
      { ...draft, exercises: [{ ...exercise, sets: [{ ...set, targetRpe: 11 }] }] },
    ])
      expect(() => TemplateStore.save(db, invalid, now)).toThrow();
    expect(db.value('SELECT COUNT(*) FROM template')).toBe(0);
  });
  it('copies a finished workout with unspecified targets', () => {
    db.exec(`INSERT INTO workout (id, startedAt, endedAt, name, source) VALUES (1, '2025-01-01', '2025-01-02', 'Old', 'app');
      INSERT INTO workoutExercise (id, workoutId, exerciseId, position, supersetGroup) VALUES (1, 1, 1, 0, 3);
      INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps) VALUES (1, 0, 'failure', 30, 'kg', 5);`);
    const id = TemplateStore.createFromWorkout(db, 1, 'Copy', null, now);
    expect(TemplateCatalog.detail(db, id)?.exercises).toMatchObject([
      { supersetGroup: 3, sets: [{ kind: 'failure', targetRepsLow: null, targetRepsHigh: null, targetRpe: null }] },
    ]);
    expect(() => TemplateStore.createFromWorkout(db, 99, 'Missing', null, now)).toThrow();
  });
});
