import GRDB

/// The database schema, as an ordered list of migrations.
///
/// Rules (see `AGENTS.md`):
/// - Append-only. Never edit a migration that has run on the phone; add a new one.
/// - Column names are camelCase so GRDB maps them to Swift properties directly.
/// - Weights are kilograms (`REAL`); timestamps are UTC `DATETIME`.
enum Migrations {
    /// Identifiers of every registered migration, in order. Used to reject
    /// backups made by a newer app version during restore.
    static var identifiers: [String] { makeMigrator().migrations }

    /// Builds the migrator with all migrations registered.
    static func makeMigrator() -> DatabaseMigrator {
        var migrator = DatabaseMigrator()
        migrator.registerMigration("v1-core-logging", migrate: createCoreLoggingTables)
        migrator.registerMigration("v2-exercise-library", migrate: addExerciseLibrary)
        migrator.registerMigration("v3-live-logging", migrate: addLiveLogging)
        return migrator
    }

    /// v1: exercises, muscles, workouts, sets and body measurements.
    ///
    /// Effort is stored once, as RPE (`rpe`, 1–10, half steps allowed).
    /// RIR is derived as `10 − RPE` (Zourdos 2016), so the two can never disagree.
    private static func createCoreLoggingTables(_ db: Database) throws {
        try db.create(table: "muscle") { t in
            t.primaryKey("id", .text)                    // stable slug, e.g. "rear-delt"
            t.column("name", .text).notNull()
            t.column("region", .text).notNull()          // e.g. "shoulders", "legs"
        }

        try db.create(table: "exercise") { t in
            t.autoIncrementedPrimaryKey("id")
            t.column("name", .text).notNull().unique(onConflict: .abort).collate(.nocase)
            t.column("equipment", .text)                 // barbell, dumbbell, cable, machine…
            t.column("movementPattern", .text)           // horizontal-push, hip-hinge…
            t.column("mechanic", .text)                  // compound | isolation
            t.column("source", .text).notNull()          // wger | free-exercise-db | curated | custom | strong
            t.column("defaultEntryUnit", .text).notNull().defaults(to: WeightUnit.kilograms.rawValue)
            t.column("isArchived", .boolean).notNull().defaults(to: false)
            t.column("createdAt", .datetime).notNull()
        }

        try db.create(table: "exerciseMuscle") { t in
            t.belongsTo("exercise", onDelete: .cascade).notNull()
            t.belongsTo("muscle", onDelete: .restrict).notNull()
            t.column("role", .text).notNull().check { ["primary", "secondary"].contains($0) }
            t.primaryKey(["exerciseId", "muscleId"])
        }

        try db.create(table: "workout") { t in
            t.autoIncrementedPrimaryKey("id")
            t.column("startedAt", .datetime).notNull().indexed()
            t.column("endedAt", .datetime)
            t.column("name", .text).notNull()
            t.column("notes", .text)
            t.column("source", .text).notNull()          // app | strong
            t.column("sourceKey", .text).unique()        // makes re-imports idempotent
        }

        try db.create(table: "workoutExercise") { t in
            t.autoIncrementedPrimaryKey("id")
            t.belongsTo("workout", onDelete: .cascade).notNull()
            t.belongsTo("exercise", onDelete: .restrict).notNull()
            t.column("position", .integer).notNull()     // 0-based order within the workout
            t.column("supersetGroup", .integer)
            t.column("notes", .text)
            t.uniqueKey(["workoutId", "position"])
        }

        try db.create(table: "workoutSet") { t in
            t.autoIncrementedPrimaryKey("id")
            t.belongsTo("workoutExercise", onDelete: .cascade).notNull()
            t.column("position", .integer).notNull()     // 0-based order within the exercise
            t.column("kind", .text).notNull()
                .check { ["warmup", "working", "drop", "failure"].contains($0) }
            t.column("weightKilograms", .double).notNull()
            t.column("entryUnit", .text).notNull()       // unit the weight was typed in
            t.column("reps", .integer).notNull()
            t.column("rpe", .double)                     // nil = effort not logged
            t.column("durationSeconds", .double)
            t.column("distanceMeters", .double)
            t.column("side", .text).notNull().defaults(to: "both")
                .check { ["both", "left", "right"].contains($0) }
            t.column("restBeforeSeconds", .double)
            t.column("completedAt", .datetime)
            t.column("notes", .text)
            t.uniqueKey(["workoutExerciseId", "position"])
        }

        try db.create(table: "bodyMeasurement") { t in
            t.autoIncrementedPrimaryKey("id")
            t.column("takenAt", .datetime).notNull()
            t.column("site", .text).notNull()            // waist, left-bicep, bodyweight…
            t.column("value", .double).notNull()         // cm for circumferences, kg for bodyweight
            t.column("source", .text).notNull()          // app | strong
            t.uniqueKey(["takenAt", "site"])
        }
    }

    /// v2: ties exercises to the built-in library and records what a set tracks.
    ///
    /// - `exercise.libraryKey`: the ``LibraryExercise/key`` this row mirrors; `NULL` for custom and
    ///   unmatched Strong exercises. Unique, so a library entry maps to exactly one row.
    /// - `exerciseAlias`: other names that resolve to an exercise. Merging a Strong exercise into a
    ///   library one stores the Strong name here, so later imports and searches land on the same row.
    /// - `appSetting`: small key–value settings (for example the seeded library version).
    /// - `muscle` rows for every ``Muscle``. The list is written out here, frozen, because a migration
    ///   must produce the same result forever; a muscle added later gets its own migration.
    ///   `MigrationsTests` checks every ``Muscle`` case has a row.
    private static func addExerciseLibrary(_ db: Database) throws {
        let muscles: [(id: String, name: String, region: String)] = [
            ("chest", "Chest", "chest"),
            ("front-delt", "Front delts", "shoulders"), ("side-delt", "Side delts", "shoulders"),
            ("rear-delt", "Rear delts", "shoulders"), ("rotator-cuff", "Rotator cuff", "shoulders"),
            ("lats", "Lats", "back"), ("upper-back", "Upper back", "back"),
            ("upper-traps", "Upper traps", "back"), ("lower-back", "Lower back", "back"),
            ("biceps", "Biceps", "arms"), ("triceps", "Triceps", "arms"),
            ("forearm-flexors", "Forearm flexors", "arms"), ("forearm-extensors", "Forearm extensors", "arms"),
            ("abs", "Abs", "core"), ("obliques", "Obliques", "core"), ("hip-flexors", "Hip flexors", "core"),
            ("glutes", "Glutes", "legs"), ("hip-abductors", "Hip abductors", "legs"), ("adductors", "Adductors", "legs"),
            ("quads", "Quads", "legs"), ("hamstrings", "Hamstrings", "legs"), ("calves", "Calves", "legs"),
            ("neck", "Neck", "neck"),
        ]
        for muscle in muscles {
            try db.execute(
                sql: "INSERT OR IGNORE INTO muscle (id, name, region) VALUES (?, ?, ?)",
                arguments: [muscle.id, muscle.name, muscle.region]
            )
        }

        try db.alter(table: "exercise") { t in
            t.add(column: "libraryKey", .text)
            t.add(column: "isLengthenedBiased", .boolean).notNull().defaults(to: false)
            t.add(column: "tracking", .text).notNull().defaults(to: ExerciseTracking.weightAndReps.rawValue)
        }
        try db.create(index: "exercise_on_libraryKey", on: "exercise", columns: ["libraryKey"], unique: true)

        try db.create(table: "exerciseAlias") { t in
            t.primaryKey("alias", .text).collate(.nocase)
            t.belongsTo("exercise", onDelete: .cascade).notNull()
        }

        try db.create(table: "appSetting") { t in
            t.primaryKey("key", .text)
            t.column("value", .text).notNull()
        }
    }

    /// v3: state for logging a workout live.
    ///
    /// - `workout.isInProgress`: the session currently being logged (at most one). Existing rows are finished.
    /// - `workoutSet.isCompleted`: whether the set was done or is still only planned (pre-filled from last
    ///   time). Existing rows were all done. Finishing a workout deletes sets that were never completed,
    ///   so analytics can treat every set of a finished workout as performed.
    private static func addLiveLogging(_ db: Database) throws {
        try db.alter(table: "workout") { t in
            t.add(column: "isInProgress", .boolean).notNull().defaults(to: false)
        }
        try db.alter(table: "workoutSet") { t in
            t.add(column: "isCompleted", .boolean).notNull().defaults(to: true)
        }
    }
}
