import type { Database } from './Database';
import { DatabaseError } from './DatabaseError';

/** One schema change. `sql` runs once, inside a transaction, in list order. */
export interface Migration {
  /** Stable identifier, recorded in the `migration` table once applied. Never rename one. */
  readonly id: string;
  readonly sql: string;
}

/**
 * The database schema, as an ordered list of migrations.
 *
 * Rules (see `AGENTS.md`):
 * - **Append-only.** Never edit a migration that has shipped; add a new one.
 * - Reference data (muscle rows) is written out inside the migration, frozen, so a migration gives
 *   the same result forever. A test checks the rows match `MUSCLES`.
 * - Column names are camelCase, matching the TypeScript row types.
 * - Weights are kilograms (`REAL`), exactly as entered. Timestamps are UTC ISO 8601 text
 *   (`2026-10-30T13:05:00.000Z`), which sorts correctly as text. Booleans are 0/1 integers.
 * - Effort is stored once, as RPE (1–10, half steps allowed). RIR is derived as 10 − RPE
 *   (Zourdos 2016), so the two can never disagree.
 *
 * `v1-schema` is the native app's three migrations folded into one: no data ever reached a phone
 * from the native app, so there was nothing to migrate (see `docs/DECISIONS.md`).
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    id: 'v1-schema',
    sql: `
      CREATE TABLE muscle (
        id TEXT PRIMARY KEY,                 -- stable slug, e.g. 'rear-delt'
        name TEXT NOT NULL,
        region TEXT NOT NULL                 -- chest, shoulders, back, arms, core, legs, neck
      );

      CREATE TABLE exercise (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        equipment TEXT,
        movementPattern TEXT,
        mechanic TEXT CHECK (mechanic IN ('compound', 'isolation')),
        source TEXT NOT NULL CHECK (source IN ('library', 'custom', 'strong')),
        libraryKey TEXT UNIQUE,              -- the library entry this row mirrors; NULL for custom and unmatched Strong rows
        isLengthenedBiased INTEGER NOT NULL DEFAULT 0 CHECK (isLengthenedBiased IN (0, 1)),
        tracking TEXT NOT NULL DEFAULT 'weight-reps'
          CHECK (tracking IN ('weight-reps', 'bodyweight-reps', 'duration', 'weight-duration')),
        defaultEntryUnit TEXT NOT NULL DEFAULT 'kg' CHECK (defaultEntryUnit IN ('kg', 'lb')),
        isArchived INTEGER NOT NULL DEFAULT 0 CHECK (isArchived IN (0, 1)),
        createdAt TEXT NOT NULL
      );

      CREATE TABLE exerciseMuscle (
        exerciseId INTEGER NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
        muscleId TEXT NOT NULL REFERENCES muscle(id) ON DELETE RESTRICT,
        role TEXT NOT NULL CHECK (role IN ('primary', 'secondary')),
        PRIMARY KEY (exerciseId, muscleId)
      );

      -- Other names that resolve to an exercise. Merging a Strong exercise into a library one stores
      -- the Strong name here, so later imports and searches land on the same row.
      CREATE TABLE exerciseAlias (
        alias TEXT PRIMARY KEY COLLATE NOCASE,
        exerciseId INTEGER NOT NULL REFERENCES exercise(id) ON DELETE CASCADE
      );

      CREATE TABLE workout (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        startedAt TEXT NOT NULL,
        endedAt TEXT,
        name TEXT NOT NULL,
        notes TEXT,
        source TEXT NOT NULL CHECK (source IN ('app', 'strong')),
        sourceKey TEXT UNIQUE,               -- makes re-imports idempotent
        isInProgress INTEGER NOT NULL DEFAULT 0 CHECK (isInProgress IN (0, 1))
      );
      CREATE INDEX workout_startedAt ON workout(startedAt);
      -- At most one workout is being logged at a time.
      CREATE UNIQUE INDEX workout_single_in_progress ON workout(isInProgress) WHERE isInProgress = 1;

      CREATE TABLE workoutExercise (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workoutId INTEGER NOT NULL REFERENCES workout(id) ON DELETE CASCADE,
        exerciseId INTEGER NOT NULL REFERENCES exercise(id) ON DELETE RESTRICT,
        position INTEGER NOT NULL,           -- 0-based order within the workout
        supersetGroup INTEGER,
        notes TEXT,
        UNIQUE (workoutId, position)
      );
      CREATE INDEX workoutExercise_exerciseId ON workoutExercise(exerciseId);

      CREATE TABLE workoutSet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workoutExerciseId INTEGER NOT NULL REFERENCES workoutExercise(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,           -- 0-based order within the exercise
        kind TEXT NOT NULL CHECK (kind IN ('warmup', 'working', 'drop', 'failure')),
        weightKilograms REAL NOT NULL,
        entryUnit TEXT NOT NULL CHECK (entryUnit IN ('kg', 'lb')),
        reps INTEGER NOT NULL,
        rpe REAL,                            -- NULL = effort not logged
        durationSeconds REAL,
        distanceMeters REAL,
        side TEXT NOT NULL DEFAULT 'both' CHECK (side IN ('both', 'left', 'right')),
        restBeforeSeconds REAL,
        completedAt TEXT,
        isCompleted INTEGER NOT NULL DEFAULT 1 CHECK (isCompleted IN (0, 1)),
        notes TEXT,
        UNIQUE (workoutExerciseId, position)
      );

      CREATE TABLE bodyMeasurement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        takenAt TEXT NOT NULL,
        site TEXT NOT NULL,                  -- waist, left-bicep, bodyweight…
        value REAL NOT NULL,                 -- cm for circumferences, kg for bodyweight
        source TEXT NOT NULL CHECK (source IN ('app', 'strong')),
        UNIQUE (takenAt, site)
      );

      CREATE TABLE appSetting (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      INSERT INTO muscle (id, name, region) VALUES
        ('chest', 'Chest', 'chest'),
        ('front-delt', 'Front delts', 'shoulders'),
        ('side-delt', 'Side delts', 'shoulders'),
        ('rear-delt', 'Rear delts', 'shoulders'),
        ('rotator-cuff', 'Rotator cuff', 'shoulders'),
        ('lats', 'Lats', 'back'),
        ('upper-back', 'Upper back', 'back'),
        ('upper-traps', 'Upper traps', 'back'),
        ('lower-back', 'Lower back', 'back'),
        ('biceps', 'Biceps', 'arms'),
        ('triceps', 'Triceps', 'arms'),
        ('forearm-flexors', 'Forearm flexors', 'arms'),
        ('forearm-extensors', 'Forearm extensors', 'arms'),
        ('abs', 'Abs', 'core'),
        ('obliques', 'Obliques', 'core'),
        ('hip-flexors', 'Hip flexors', 'core'),
        ('glutes', 'Glutes', 'legs'),
        ('hip-abductors', 'Hip abductors', 'legs'),
        ('adductors', 'Adductors', 'legs'),
        ('quads', 'Quads', 'legs'),
        ('hamstrings', 'Hamstrings', 'legs'),
        ('calves', 'Calves', 'legs'),
        ('neck', 'Neck', 'neck');
    `,
  },
  {
    // The rest the owner chose for an exercise's timer, in seconds. NULL = the app default
    // (RestTimerDefaults in src/core/logging). Remembered per exercise, like the entry unit.
    id: 'v2-exercise-rest-target',
    sql: `ALTER TABLE exercise ADD COLUMN restTargetSeconds INTEGER CHECK (restTargetSeconds IS NULL OR restTargetSeconds > 0);`,
  },
];

const CREATE_MIGRATION_TABLE = `
  CREATE TABLE IF NOT EXISTS migration (
    id TEXT PRIMARY KEY,
    appliedAt TEXT NOT NULL
  )`;

/**
 * Identifiers of the migrations not yet applied to `db`, in order.
 * Throws `DatabaseError` (`newerSchema`) when `db` has a migration this app doesn't know,
 * meaning it was written by a newer version and opening it could corrupt it.
 */
export function pendingMigrationIds(db: Database, migrations: readonly Migration[] = MIGRATIONS): string[] {
  db.exec(CREATE_MIGRATION_TABLE);
  const applied = new Set(db.all<{ id: string }>('SELECT id FROM migration').map((row) => row.id));
  const known = new Set(migrations.map((migration) => migration.id));
  const unknown = [...applied].filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new DatabaseError(
      'newerSchema',
      `This data was saved by a newer version of the app (${unknown.join(', ')}). Update the app first.`,
    );
  }
  return migrations.filter((migration) => !applied.has(migration.id)).map((migration) => migration.id);
}

/**
 * Applies every pending migration, each in its own transaction.
 * The caller takes a safety snapshot first when `pendingMigrationIds` is not empty (data safety rule).
 * Returns the identifiers it applied.
 */
export function migrate(db: Database, now: Date = new Date(), migrations: readonly Migration[] = MIGRATIONS): string[] {
  const pending = new Set(pendingMigrationIds(db, migrations));
  const applied: string[] = [];
  for (const migration of migrations) {
    if (!pending.has(migration.id)) continue;
    db.transaction(() => {
      db.exec(migration.sql);
      db.run('INSERT INTO migration (id, appliedAt) VALUES (?, ?)', [migration.id, now.toISOString()]);
    });
    applied.push(migration.id);
  }
  return applied;
}
