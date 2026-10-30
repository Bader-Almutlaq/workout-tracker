import Foundation
import GRDB

/// Read-only queries behind the History screen.
public enum WorkoutHistory {
    /// One row in the history list.
    public struct Summary: Sendable, Equatable, Identifiable, Decodable, FetchableRecord {
        public var id: Int64
        public var startedAt: Date
        public var name: String
        public var exerciseCount: Int
        public var setCount: Int
        /// Tonnage: Σ weight × reps over non-warm-up sets, in kg. Secondary
        /// "work done" figure only; it doesn't predict hypertrophy (Refalo 2023).
        public var volumeKilograms: Double
    }

    /// A workout with its exercises and sets, in logged order.
    public struct Detail: Sendable, Equatable {
        public struct Entry: Sendable, Equatable, Identifiable {
            public var entry: WorkoutExercise
            public var exercise: Exercise
            public var sets: [WorkoutSet]
            public var id: Int64? { entry.id }
        }

        public var workout: Workout
        public var entries: [Entry]
    }

    /// All finished workouts, newest first. The workout in progress is excluded (see ``LiveWorkout``).
    public static func summaries(_ db: Database) throws -> [Summary] {
        try Summary.fetchAll(db, sql: summarySQL(where: "w.isInProgress = 0"))
    }

    /// The summary of one finished workout, or `nil` if it doesn't exist or is still in progress.
    public static func summary(workoutID: Int64, _ db: Database) throws -> Summary? {
        try Summary.fetchOne(db, sql: summarySQL(where: "w.isInProgress = 0 AND w.id = ?"), arguments: [workoutID])
    }

    /// The one definition of a workout summary (counts and volume load), filtered by `condition`.
    private static func summarySQL(where condition: String) -> String {
        """
        SELECT w.id, w.startedAt, w.name,
               COUNT(DISTINCT we.id) AS exerciseCount,
               COUNT(s.id) AS setCount,
               COALESCE(SUM(CASE WHEN s.kind <> 'warmup' THEN s.weightKilograms * s.reps END), 0) AS volumeKilograms
        FROM workout w
        LEFT JOIN workoutExercise we ON we.workoutId = w.id
        LEFT JOIN workoutSet s ON s.workoutExerciseId = we.id
        WHERE \(condition)
        GROUP BY w.id
        ORDER BY w.startedAt DESC
        """
    }

    /// ``summaries(_:)``, re-delivered whenever workouts or sets change.
    /// Iterate it from a SwiftUI `.task`; it ends when the task is cancelled.
    public static func observeSummaries(in database: AppDatabase) -> some AsyncSequence<[Summary], any Error> {
        ValueObservation.tracking(summaries).values(in: database.writer)
    }

    /// One workout in full, or `nil` if it no longer exists.
    public static func detail(workoutID: Int64, _ db: Database) throws -> Detail? {
        guard let workout = try Workout.fetchOne(db, key: workoutID) else { return nil }
        let entries = try WorkoutExercise
            .filter(Column("workoutId") == workoutID)
            .order(Column("position"))
            .fetchAll(db)
        let exercises = try Exercise.fetchAll(db, keys: entries.map(\.exerciseId))
        let exercisesByID = Dictionary(uniqueKeysWithValues: exercises.compactMap { exercise in exercise.id.map { ($0, exercise) } })
        let sets = try WorkoutSet
            .filter(entries.compactMap(\.id).contains(Column("workoutExerciseId")))
            .order(Column("workoutExerciseId"), Column("position"))
            .fetchAll(db)
        let setsByEntry = Dictionary(grouping: sets, by: \.workoutExerciseId)

        return Detail(
            workout: workout,
            entries: entries.compactMap { entry in
                guard let id = entry.id, let exercise = exercisesByID[entry.exerciseId] else { return nil }
                return Detail.Entry(entry: entry, exercise: exercise, sets: setsByEntry[id] ?? [])
            }
        )
    }
}
