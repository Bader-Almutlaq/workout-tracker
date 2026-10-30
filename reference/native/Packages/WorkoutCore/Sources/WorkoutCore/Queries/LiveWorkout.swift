import Foundation
import GRDB

/// Read side of the workout being logged: its exercises and sets plus, for each
/// exercise, what was done last time (``PreviousPerformance``).
public enum LiveWorkout {
    /// The workout as the logging screen shows it.
    public struct Snapshot: Sendable, Equatable {
        public var workout: Workout
        public var entries: [Entry]
    }

    /// One exercise in the workout.
    public struct Entry: Sendable, Equatable, Identifiable {
        public var entry: WorkoutExercise
        public var exercise: Exercise
        /// Planned and completed sets, in order.
        public var sets: [WorkoutSet]
        /// Completed sets from the last finished session of this exercise; matched to rows by index.
        public var previous: [WorkoutSet]
        public var id: Int64? { entry.id }
    }

    /// The workout with its previous-performance context, or `nil` if it no longer exists.
    public static func snapshot(workoutID: Int64, _ db: Database) throws -> Snapshot? {
        guard let detail = try WorkoutHistory.detail(workoutID: workoutID, db) else { return nil }
        return Snapshot(
            workout: detail.workout,
            entries: try detail.entries.map { item in
                Entry(
                    entry: item.entry, exercise: item.exercise, sets: item.sets,
                    previous: try PreviousPerformance.sets(exerciseID: item.exercise.id ?? -1, excludingWorkout: workoutID, db)
                )
            }
        )
    }

    /// ``snapshot(workoutID:_:)``, re-delivered after every change.
    public static func observe(workoutID: Int64, in database: AppDatabase) -> some AsyncSequence<Snapshot?, any Error> {
        ValueObservation.tracking { db in try snapshot(workoutID: workoutID, db) }.values(in: database.writer)
    }

    /// The ID of the workout in progress (or `nil`), re-delivered when one starts or ends.
    public static func observeActiveWorkoutID(in database: AppDatabase) -> some AsyncSequence<Int64?, any Error> {
        ValueObservation.tracking { db in try WorkoutLogger.activeWorkoutID(db) }.removeDuplicates().values(in: database.writer)
    }
}
