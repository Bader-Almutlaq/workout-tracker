import GRDB

/// The database schema, as an ordered list of migrations.
///
/// Rules (see `.claude/CLAUDE.md`):
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
}
