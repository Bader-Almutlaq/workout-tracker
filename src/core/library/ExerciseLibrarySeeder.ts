import { AppSettingKey, getSetting, setSetting } from '../db/AppSetting';
import type { Database } from '../db/Database';
import type { ExerciseRow } from '../models/Exercise';
import { log } from '../support/log';
import type { ExerciseLibrary } from './ExerciseLibrary';
import { ExerciseLibraryError } from './ExerciseLibraryError';
import type { LibraryExercise } from './LibraryExercise';
import { exerciseIdNamed } from './ExerciseNameResolver';
import { replaceExerciseMuscles } from './replaceExerciseMuscles';

/** What one seeding pass did. */
export interface ExerciseLibrarySeedResult {
  /** Library exercises added as new rows. */
  readonly inserted: number;
  /** Existing rows with the same name (for example imported from Strong) now tied to the library. */
  readonly linked: number;
  /** Rows already tied to the library whose library fields were refreshed. */
  readonly updated: number;
  /** True when the database already had this library version, so nothing was done. */
  readonly skipped: boolean;
}

/**
 * Copies the built-in library into the database, once per library version.
 *
 * For each library exercise: the row already tied to it (`libraryKey`) is refreshed; otherwise a
 * row with the same name or alias that isn't tied to the library is linked (so imported Strong
 * history joins the library exercise); otherwise a new row is added. Library fields (name,
 * equipment, pattern, mechanic, tracking, muscles) are overwritten; the owner's fields
 * (`defaultEntryUnit`, `isArchived`) and all history are kept.
 *
 * Runs in one transaction. Needs no snapshot: it only adds rows and refreshes library-owned fields.
 */
export const ExerciseLibrarySeeder = {
  /** Seeds `library` unless this version is already in `db`. `now` stamps new rows. */
  seed(db: Database, library: ExerciseLibrary, now: Date): ExerciseLibrarySeedResult {
    return db.transaction(() => {
      if (getSetting(db, AppSettingKey.seededLibraryVersion) === String(library.version)) {
        return { inserted: 0, linked: 0, updated: 0, skipped: true };
      }
      const counts = { inserted: 0, linked: 0, updated: 0 };
      for (const entry of library.exercises) {
        const exercise = rowFor(db, entry, now, counts);
        writeLibraryFields(db, exercise, entry);
        replaceExerciseMuscles(db, exercise.id, entry.primaryMuscles, entry.secondaryMuscles);
      }
      setSetting(db, AppSettingKey.seededLibraryVersion, String(library.version));
      return { ...counts, skipped: false };
    });
  },
};

/** Finds, links or inserts the row for one library exercise, counting what it did. */
function rowFor(
  db: Database,
  entry: LibraryExercise,
  now: Date,
  counts: { inserted: number; linked: number; updated: number },
): ExerciseRow {
  const tied = db.get<ExerciseRow>('SELECT * FROM exercise WHERE libraryKey = ?', [entry.key]);
  if (tied !== undefined) {
    counts.updated += 1;
    return tied;
  }

  const sameNameId = exerciseIdNamed(db, entry.name);
  const sameName = sameNameId === undefined ? undefined : exerciseById(db, sameNameId);
  if (sameName !== undefined && sameName.libraryKey === null) {
    db.run("UPDATE exercise SET source = 'library', libraryKey = ? WHERE id = ?", [entry.key, sameName.id]);
    counts.linked += 1;
    return sameName;
  }

  const { lastInsertRowId } = db.run(
    "INSERT INTO exercise (name, source, libraryKey, createdAt) VALUES (?, 'library', ?, ?)",
    [entry.name, entry.key, now.toISOString()],
  );
  counts.inserted += 1;
  const inserted = exerciseById(db, lastInsertRowId);
  if (inserted === undefined) {
    throw new ExerciseLibraryError('malformed', `“${entry.name}” could not be added to the database.`);
  }
  return inserted;
}

/**
 * Writes the library-owned fields. A renamed library entry keeps its old name when the new one is
 * already used by another exercise, so seeding never fails on a name clash.
 */
function writeLibraryFields(db: Database, exercise: ExerciseRow, entry: LibraryExercise): void {
  const isRename = exercise.name.toLowerCase() !== entry.name.toLowerCase();
  const nameTaken = isRename && exerciseIdNamed(db, entry.name) !== undefined;
  if (nameTaken) {
    log.database.error(`Library rename of “${exercise.name}” to “${entry.name}” skipped: that name is in use`);
  }
  db.run(
    `UPDATE exercise
        SET name = ?, equipment = ?, movementPattern = ?, mechanic = ?, isLengthenedBiased = ?, tracking = ?
      WHERE id = ?`,
    [
      nameTaken ? exercise.name : entry.name,
      entry.equipment,
      entry.pattern,
      entry.mechanic,
      Number(entry.isLengthenedBiased),
      entry.tracking,
      exercise.id,
    ],
  );
}

function exerciseById(db: Database, id: number): ExerciseRow | undefined {
  return db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [id]);
}
