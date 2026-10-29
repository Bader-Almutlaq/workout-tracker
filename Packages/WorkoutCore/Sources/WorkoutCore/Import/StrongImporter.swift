import Foundation
import GRDB

/// Writes a reviewed ``StrongImportPlan`` into the database.
///
/// Safety: takes a local snapshot first, runs in a single transaction (all or
/// nothing), and only ever *adds* rows. Workouts already imported (same
/// `sourceKey`) and measurements already present are skipped, so importing the
/// same file twice changes nothing.
public struct StrongImporter: Sendable {
    /// Counts of what an import added and skipped.
    public struct Result: Sendable, Equatable {
        public var workoutsAdded = 0
        public var workoutsSkipped = 0
        public var setsAdded = 0
        public var exercisesCreated = 0
        public var measurementsAdded = 0
    }

    public let database: AppDatabase
    /// Where the pre-import snapshot goes.
    public let snapshotDirectory: URL

    public init(database: AppDatabase, snapshotDirectory: URL) {
        self.database = database
        self.snapshotDirectory = snapshotDirectory
    }

    /// Imports `plan`. Exercises are matched to existing ones by name or saved
    /// alias (case-insensitive, see ``ExerciseNameResolver``); unknown names
    /// become new exercises. An exercise without history takes the unit Strong
    /// currently uses for it as its default entry unit.
    public func importPlan(_ plan: StrongImportPlan) throws -> Result {
        let snapshot = try AppDatabase.writeSnapshot(of: database.writer, into: snapshotDirectory)
        Log.importer.notice("Pre-import snapshot: \(snapshot.lastPathComponent, privacy: .public)")

        let columnUnits = Dictionary(uniqueKeysWithValues: plan.exercises.map { ($0.name, $0.columnUnit) })
        let result = try database.writer.write { db in
            var result = Result()
            var exerciseIDs: [String: Int64] = [:]

            func exerciseID(named name: String) throws -> Int64 {
                if let id = exerciseIDs[name] { return id }
                let unit = columnUnits[name] ?? .kilograms
                let id: Int64
                if let existingID = try ExerciseNameResolver.exerciseID(named: name, db) {
                    id = existingID
                    // An exercise with no history yet (a fresh library entry) adopts Strong's unit for it.
                    let hasHistory = try WorkoutExercise.filter(Column("exerciseId") == existingID).fetchCount(db) > 0
                    if !hasHistory {
                        try db.execute(
                            sql: "UPDATE exercise SET defaultEntryUnit = ? WHERE id = ?",
                            arguments: [unit.rawValue, existingID]
                        )
                    }
                } else {
                    var exercise = Exercise(name: name, source: .strong, defaultEntryUnit: unit)
                    try exercise.insert(db)
                    result.exercisesCreated += 1
                    id = try exercise.id.orThrow()
                }
                exerciseIDs[name] = id
                return id
            }

            for planned in plan.workouts {
                if try Workout.filter(Column("sourceKey") == planned.sourceKey).fetchCount(db) > 0 {
                    result.workoutsSkipped += 1
                    continue
                }
                var workout = Workout(
                    startedAt: planned.startedAt, endedAt: planned.endedAt, name: planned.name,
                    notes: planned.notes, source: .strong, sourceKey: planned.sourceKey
                )
                try workout.insert(db)
                let workoutID = try workout.id.orThrow()

                for plannedExercise in planned.exercises {
                    var entry = WorkoutExercise(
                        workoutId: workoutID, exerciseId: try exerciseID(named: plannedExercise.name),
                        position: plannedExercise.position, notes: plannedExercise.notes
                    )
                    try entry.insert(db)
                    let entryID = try entry.id.orThrow()

                    for plannedSet in plannedExercise.sets {
                        var set = WorkoutSet(
                            workoutExerciseId: entryID, position: plannedSet.position, kind: plannedSet.kind,
                            weightKilograms: plannedSet.weightKilograms, entryUnit: plannedSet.entryUnit,
                            reps: plannedSet.reps, rpe: plannedSet.rpe, durationSeconds: plannedSet.durationSeconds,
                            distanceMeters: plannedSet.distanceMeters, notes: plannedSet.notes
                        )
                        try set.insert(db)
                        result.setsAdded += 1
                    }
                }
                result.workoutsAdded += 1
            }

            for var measurement in plan.measurements {
                try measurement.insert(db, onConflict: .ignore)
                if db.changesCount > 0 { result.measurementsAdded += 1 }
            }
            return result
        }
        Log.importer.notice(
            "Imported \(result.workoutsAdded) workouts, \(result.setsAdded) sets; skipped \(result.workoutsSkipped)"
        )
        return result
    }
}

private extension Optional where Wrapped == Int64 {
    /// GRDB sets the ID on insert, so `nil` here would be a GRDB bug; fail the transaction rather than crash.
    func orThrow() throws -> Int64 {
        guard let self else { throw DatabaseError(message: "Inserted row has no ID") }
        return self
    }
}
