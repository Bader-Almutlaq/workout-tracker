import Foundation
import GRDB

/// What the owner did the last time they performed an exercise. Shown inline on
/// every set row while logging, and used to pre-fill planned sets.
public enum PreviousPerformance {
    /// The completed sets of `exerciseID` from the most recent finished workout that
    /// contains it, in logged order. Workouts in progress and `excludingWorkout` are skipped.
    /// If the exercise appears twice in that workout, both entries' sets are returned in order.
    public static func sets(exerciseID: Int64, excludingWorkout: Int64? = nil, _ db: Database) throws -> [WorkoutSet] {
        guard let workoutID = try Int64.fetchOne(db, sql: """
            SELECT w.id FROM workout w JOIN workoutExercise we ON we.workoutId = w.id
            WHERE we.exerciseId = ? AND w.isInProgress = 0 AND w.id IS NOT ?
            ORDER BY w.startedAt DESC LIMIT 1
            """, arguments: [exerciseID, excludingWorkout]) else { return [] }
        return try WorkoutSet.fetchAll(db, sql: """
            SELECT s.* FROM workoutSet s JOIN workoutExercise we ON we.id = s.workoutExerciseId
            WHERE we.workoutId = ? AND we.exerciseId = ? AND s.isCompleted = 1
            ORDER BY we.position, s.position
            """, arguments: [workoutID, exerciseID])
    }
}
