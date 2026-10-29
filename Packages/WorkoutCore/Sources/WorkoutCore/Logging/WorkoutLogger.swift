import Foundation
import GRDB

/// Every change made while logging a workout: start, add exercises and sets, edit,
/// complete, reorder, finish and discard.
///
/// Each call is one transaction written straight to the database, so a crash or a
/// killed app loses at most the tap in flight. Positions (`workoutExercise.position`,
/// `workoutSet.position`) are kept dense and 0-based after every change.
public struct WorkoutLogger: Sendable {
    /// Limits that catch input mistakes without restricting real training.
    public enum Limits {
        /// Highest weight accepted for one set, in kg. Above every recorded human lift.
        public static let maximumKilograms = 1_000.0
        /// Highest rep count accepted for one set.
        public static let maximumReps = 1_000
        /// RPE scale bounds (Zourdos 2016).
        public static let rpeRange = 1.0...10.0
    }

    /// What finishing a workout kept and dropped.
    public struct FinishResult: Sendable, Equatable {
        /// `nil` when nothing was completed, so the workout was deleted.
        public var workoutID: Int64?
        public var completedSets: Int
        /// Planned sets that were never completed and were removed.
        public var droppedSets: Int
    }

    public let database: AppDatabase

    public init(database: AppDatabase) {
        self.database = database
    }

    // MARK: - Workout

    /// The workout currently being logged, if any.
    public func activeWorkoutID() throws -> Int64? {
        try database.writer.read { db in try Self.activeWorkoutID(db) }
    }

    /// Starts an empty workout. Throws ``WorkoutLoggerError/workoutAlreadyInProgress(workoutID:)`` if one exists.
    @discardableResult
    public func start(name: String, at date: Date = .now) throws -> Int64 {
        try database.writer.write { db in
            if let active = try Self.activeWorkoutID(db) { throw WorkoutLoggerError.workoutAlreadyInProgress(workoutID: active) }
            var workout = Workout(startedAt: date, name: name, source: .app, isInProgress: true)
            try workout.insert(db)
            guard let id = workout.id else { throw WorkoutLoggerError.workoutNotFound }
            return id
        }
    }

    /// Ends the workout: drops sets never completed and exercises left without sets, then
    /// records the end time. A workout with no completed set is deleted entirely.
    @discardableResult
    public func finish(_ workoutID: Int64, at date: Date = .now) throws -> FinishResult {
        try database.writer.write { db in
            guard var workout = try Workout.fetchOne(db, key: workoutID) else { throw WorkoutLoggerError.workoutNotFound }
            try db.execute(sql: """
                DELETE FROM workoutSet WHERE isCompleted = 0
                AND workoutExerciseId IN (SELECT id FROM workoutExercise WHERE workoutId = ?)
                """, arguments: [workoutID])
            let dropped = db.changesCount
            try db.execute(sql: """
                DELETE FROM workoutExercise WHERE workoutId = ?
                AND id NOT IN (SELECT workoutExerciseId FROM workoutSet)
                """, arguments: [workoutID])
            let completed = try Int.fetchOne(db, sql: """
                SELECT COUNT(*) FROM workoutSet s JOIN workoutExercise we ON we.id = s.workoutExerciseId
                WHERE we.workoutId = ?
                """, arguments: [workoutID]) ?? 0

            guard completed > 0 else {
                try Workout.deleteOne(db, key: workoutID)
                return FinishResult(workoutID: nil, completedSets: 0, droppedSets: dropped)
            }
            try Self.renumberExercises(of: workoutID, db)
            for entryID in try Int64.fetchAll(db, sql: "SELECT id FROM workoutExercise WHERE workoutId = ?", arguments: [workoutID]) {
                try Self.renumberSets(of: entryID, db)
            }
            workout.endedAt = date
            workout.isInProgress = false
            try workout.update(db)
            return FinishResult(workoutID: workoutID, completedSets: completed, droppedSets: dropped)
        }
    }

    /// Deletes the workout and everything logged in it. The UI confirms first.
    public func discard(_ workoutID: Int64) throws {
        try database.writer.write { db in
            guard try Workout.deleteOne(db, key: workoutID) else { throw WorkoutLoggerError.workoutNotFound }
        }
    }

    /// Renames the workout or changes its notes.
    public func update(_ workoutID: Int64, name: String, notes: String?) throws {
        try database.writer.write { db in
            guard var workout = try Workout.fetchOne(db, key: workoutID) else { throw WorkoutLoggerError.workoutNotFound }
            workout.name = name
            workout.notes = notes?.nilIfEmpty
            try workout.update(db)
        }
    }

    // MARK: - Exercises

    /// Appends `exerciseID` to the workout and pre-fills planned (not completed) sets
    /// copied from the last time it was done, in the exercise's entry unit. With no history,
    /// adds one empty planned set.
    /// - Returns: The new workout-exercise ID.
    @discardableResult
    public func addExercise(_ exerciseID: Int64, to workoutID: Int64) throws -> Int64 {
        try database.writer.write { db in
            guard try Workout.exists(db, key: workoutID) else { throw WorkoutLoggerError.workoutNotFound }
            guard let exercise = try Exercise.fetchOne(db, key: exerciseID) else { throw WorkoutLoggerError.exerciseNotFound }
            let position = try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM workoutExercise WHERE workoutId = ?", arguments: [workoutID]) ?? 0
            var entry = WorkoutExercise(workoutId: workoutID, exerciseId: exerciseID, position: position)
            try entry.insert(db)
            guard let entryID = entry.id else { throw WorkoutLoggerError.workoutNotFound }

            let previous = try PreviousPerformance.sets(exerciseID: exerciseID, excludingWorkout: workoutID, db)
            let templates = previous.isEmpty
                ? [WorkoutSet(workoutExerciseId: entryID, position: 0, kind: .working, weightKilograms: 0, entryUnit: exercise.defaultEntryUnit, reps: 0)]
                : previous.map {
                    WorkoutSet(workoutExerciseId: entryID, position: $0.position, kind: $0.kind, weightKilograms: $0.weightKilograms,
                               entryUnit: exercise.defaultEntryUnit, reps: $0.reps, rpe: $0.rpe,
                               durationSeconds: $0.durationSeconds, side: $0.side)
                }
            for (index, template) in templates.enumerated() {
                var planned = template
                planned.position = index
                planned.isCompleted = false
                try planned.insert(db)
            }
            return entryID
        }
    }

    /// Removes an exercise and its sets from the workout.
    public func removeExercise(_ entryID: Int64) throws {
        try database.writer.write { db in
            guard let entry = try WorkoutExercise.fetchOne(db, key: entryID) else { throw WorkoutLoggerError.exerciseNotFound }
            try WorkoutExercise.deleteOne(db, key: entryID)
            try Self.renumberExercises(of: entry.workoutId, db)
        }
    }

    /// Moves an exercise to `newPosition` (0-based, clamped) within its workout.
    public func moveExercise(_ entryID: Int64, to newPosition: Int) throws {
        try database.writer.write { db in
            guard let entry = try WorkoutExercise.fetchOne(db, key: entryID) else { throw WorkoutLoggerError.exerciseNotFound }
            var order = try Int64.fetchAll(db, sql: "SELECT id FROM workoutExercise WHERE workoutId = ? ORDER BY position", arguments: [entry.workoutId])
            order.removeAll { $0 == entryID }
            order.insert(entryID, at: min(max(0, newPosition), order.count))
            try Self.assignPositions(order, table: "workoutExercise", db)
        }
    }

    // MARK: - Sets

    /// Appends a planned set copying the exercise's last set (weight, unit, reps, kind).
    /// - Returns: The new set ID.
    @discardableResult
    public func addSet(to entryID: Int64) throws -> Int64 {
        try database.writer.write { db in
            guard let entry = try WorkoutExercise.fetchOne(db, key: entryID),
                  let exercise = try Exercise.fetchOne(db, key: entry.exerciseId) else { throw WorkoutLoggerError.exerciseNotFound }
            let last = try WorkoutSet.filter(Column("workoutExerciseId") == entryID).order(Column("position").desc).fetchOne(db)
            var set = WorkoutSet(
                workoutExerciseId: entryID, position: (last?.position ?? -1) + 1, kind: last?.kind == .warmup ? .working : (last?.kind ?? .working),
                weightKilograms: last?.weightKilograms ?? 0, entryUnit: last?.entryUnit ?? exercise.defaultEntryUnit,
                reps: last?.reps ?? 0, durationSeconds: last?.durationSeconds, side: last?.side ?? .both, isCompleted: false
            )
            try set.insert(db)
            guard let id = set.id else { throw WorkoutLoggerError.setNotFound }
            return id
        }
    }

    /// Changes a set's numbers. `weight` is stored in kg exactly; `entryUnit` is the unit it was typed in.
    /// `durationSeconds` is for timed exercises (``ExerciseTracking/duration``); leave `nil` otherwise.
    public func updateSet(
        _ setID: Int64, weight: Weight, entryUnit: WeightUnit, reps: Int, rpe: Double?, kind: SetKind,
        durationSeconds: Double? = nil
    ) throws {
        guard (0...Limits.maximumKilograms).contains(weight.kilograms) else { throw WorkoutLoggerError.invalidWeight(weight.kilograms) }
        guard (0...Limits.maximumReps).contains(reps) else { throw WorkoutLoggerError.invalidReps(reps) }
        if let rpe, !Limits.rpeRange.contains(rpe) { throw WorkoutLoggerError.invalidRPE(rpe) }
        try database.writer.write { db in
            guard var set = try WorkoutSet.fetchOne(db, key: setID) else { throw WorkoutLoggerError.setNotFound }
            set.weightKilograms = weight.kilograms
            set.entryUnit = entryUnit
            set.reps = reps
            set.rpe = rpe
            set.kind = kind
            set.durationSeconds = durationSeconds
            try set.update(db)
        }
    }

    /// Switches the unit an exercise is logged in, from now on and for this entry's planned sets.
    ///
    /// Stored weights never change (they are kg); only the unit they are shown and typed in.
    /// Completed sets keep the unit they were typed in.
    public func setEntryUnit(_ unit: WeightUnit, for entryID: Int64) throws {
        try database.writer.write { db in
            guard let entry = try WorkoutExercise.fetchOne(db, key: entryID) else { throw WorkoutLoggerError.exerciseNotFound }
            try db.execute(sql: "UPDATE exercise SET defaultEntryUnit = ? WHERE id = ?", arguments: [unit.rawValue, entry.exerciseId])
            try db.execute(
                sql: "UPDATE workoutSet SET entryUnit = ? WHERE workoutExerciseId = ? AND isCompleted = 0",
                arguments: [unit.rawValue, entryID]
            )
        }
    }

    /// Marks a set done (recording the time and the rest since the previous completed set in
    /// this workout) or not done.
    public func setCompleted(_ setID: Int64, _ isCompleted: Bool, at date: Date = .now) throws {
        try database.writer.write { db in
            guard var set = try WorkoutSet.fetchOne(db, key: setID),
                  let entry = try WorkoutExercise.fetchOne(db, key: set.workoutExerciseId) else { throw WorkoutLoggerError.setNotFound }
            set.isCompleted = isCompleted
            if isCompleted {
                let previousCompletion = try Date.fetchOne(db, sql: """
                    SELECT MAX(s.completedAt) FROM workoutSet s JOIN workoutExercise we ON we.id = s.workoutExerciseId
                    WHERE we.workoutId = ? AND s.isCompleted = 1 AND s.id <> ?
                    """, arguments: [entry.workoutId, setID])
                set.completedAt = date
                set.restBeforeSeconds = previousCompletion.map { date.timeIntervalSince($0) }
            } else {
                set.completedAt = nil
                set.restBeforeSeconds = nil
            }
            try set.update(db)
        }
    }

    /// Deletes a set and closes the gap in positions.
    public func deleteSet(_ setID: Int64) throws {
        try database.writer.write { db in
            guard let set = try WorkoutSet.fetchOne(db, key: setID) else { throw WorkoutLoggerError.setNotFound }
            try WorkoutSet.deleteOne(db, key: setID)
            try Self.renumberSets(of: set.workoutExerciseId, db)
        }
    }

    // MARK: - Private

    static func activeWorkoutID(_ db: Database) throws -> Int64? {
        try Int64.fetchOne(db, sql: "SELECT id FROM workout WHERE isInProgress = 1 ORDER BY startedAt DESC LIMIT 1")
    }

    private static func renumberExercises(of workoutID: Int64, _ db: Database) throws {
        let order = try Int64.fetchAll(db, sql: "SELECT id FROM workoutExercise WHERE workoutId = ? ORDER BY position", arguments: [workoutID])
        try assignPositions(order, table: "workoutExercise", db)
    }

    private static func renumberSets(of entryID: Int64, _ db: Database) throws {
        let order = try Int64.fetchAll(db, sql: "SELECT id FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position", arguments: [entryID])
        try assignPositions(order, table: "workoutSet", db)
    }

    /// Writes positions 0, 1, 2… in `order`. Goes through negative values first because
    /// positions are unique per parent and would collide mid-update.
    private static func assignPositions(_ order: [Int64], table: String, _ db: Database) throws {
        for (index, id) in order.enumerated() {
            try db.execute(sql: "UPDATE \(table) SET position = ? WHERE id = ?", arguments: [-(index + 1), id])
        }
        for (index, id) in order.enumerated() {
            try db.execute(sql: "UPDATE \(table) SET position = ? WHERE id = ?", arguments: [index, id])
        }
    }
}
