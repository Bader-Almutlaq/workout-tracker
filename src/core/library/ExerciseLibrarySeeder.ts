import { AppSettingKey, getSetting, setSetting } from '../db/AppSetting';
import type { Database } from '../db/Database';
import type { ExerciseRow } from '../models/Exercise';
import { log } from '../support/log';
import type { ExerciseLibrary } from './ExerciseLibrary';

/** Counts of library rows inserted, linked or updated by one seed. */
export interface ExerciseLibrarySeedResult {
  readonly inserted: number;
  readonly linked: number;
  readonly updated: number;
  readonly skipped: boolean;
}

/** Seeds or updates library rows atomically, preserving owner fields and history. No snapshot is needed. */
export const ExerciseLibrarySeeder = {
  /** Seeds when the version changes; `now` timestamps new rows. */
  seed(db: Database, library: ExerciseLibrary, now: Date): ExerciseLibrarySeedResult {
    return db.transaction(() => {
      if (getSetting(db, AppSettingKey.seededLibraryVersion) === String(library.version)) return { inserted: 0, linked: 0, updated: 0, skipped: true };
      let inserted = 0; let linked = 0; let updated = 0;
      for (const entry of library.exercises) {
        let exercise = db.get<ExerciseRow>('SELECT * FROM exercise WHERE libraryKey = ?', [entry.key]);
        if (exercise !== undefined) updated += 1;
        else {
          const id = db.value<number>('SELECT id FROM exercise WHERE name = ? COLLATE NOCASE UNION ALL SELECT exerciseId FROM exerciseAlias WHERE alias = ? COLLATE NOCASE LIMIT 1', [entry.name, entry.name]);
          const match = id === undefined ? undefined : db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [id]);
          if (match !== undefined && match.libraryKey === null) {
            exercise = match;
            db.run('UPDATE exercise SET source = ?, libraryKey = ? WHERE id = ?', ['library', entry.key, match.id]);
            linked += 1;
          } else {
            const result = db.run('INSERT INTO exercise (name, source, libraryKey, createdAt) VALUES (?, ?, ?, ?)', [entry.name, 'library', entry.key, now.toISOString()]);
            exercise = db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [result.lastInsertRowId]);
            inserted += 1;
          }
        }
        if (exercise === undefined) throw new Error('The seeded exercise could not be found.');
        const collision = db.value<number>('SELECT id FROM exercise WHERE name = ? COLLATE NOCASE UNION ALL SELECT exerciseId FROM exerciseAlias WHERE alias = ? COLLATE NOCASE LIMIT 1', [entry.name, entry.name]);
        const name = exercise.name.toLowerCase() !== entry.name.toLowerCase() && collision !== undefined ? exercise.name : entry.name;
        if (name !== entry.name) log.database.error(`Library rename to ${entry.name} skipped: name in use`);
        db.run('UPDATE exercise SET name = ?, equipment = ?, movementPattern = ?, mechanic = ?, isLengthenedBiased = ?, tracking = ? WHERE id = ?', [name, entry.equipment, entry.pattern, entry.mechanic, Number(entry.isLengthenedBiased), entry.tracking, exercise.id]);
        db.run('DELETE FROM exerciseMuscle WHERE exerciseId = ?', [exercise.id]);
        for (const muscle of entry.primaryMuscles) db.run('INSERT INTO exerciseMuscle VALUES (?, ?, ?)', [exercise.id, muscle, 'primary']);
        for (const muscle of entry.secondaryMuscles) db.run('INSERT INTO exerciseMuscle VALUES (?, ?, ?)', [exercise.id, muscle, 'secondary']);
      }
      setSetting(db, AppSettingKey.seededLibraryVersion, String(library.version));
      return { inserted, linked, updated, skipped: false };
    });
  },
};
