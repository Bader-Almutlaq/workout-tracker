import Foundation
import WorkoutCore

/// What the Finish sheet shows: the workout as it was saved, read back from the database.
struct FinishSummary: Identifiable, Equatable {
    /// One exercise and how many sets were logged for it.
    struct Line: Identifiable, Equatable {
        var id: Int64
        var exerciseName: String
        var setCount: Int
    }

    /// The finished workout's ID.
    var id: Int64
    var name: String
    /// From start to finish, in seconds.
    var duration: TimeInterval
    var completedSets: Int
    /// Volume load: Σ weight × reps over non-warm-up sets, in kg, as computed by `WorkoutHistory`.
    var volumeKilograms: Double
    var lines: [Line]

    /// Reads the finished workout. `nil` if it no longer exists.
    ///
    /// The totals come from ``WorkoutHistory/summaries(_:)`` so volume load has one definition.
    static func load(workoutID: Int64, from database: AppDatabase) throws -> FinishSummary? {
        let (detail, summaries) = try database.writer.read { db in
            (try WorkoutHistory.detail(workoutID: workoutID, db), try WorkoutHistory.summaries(db))
        }
        guard let detail, let summary = summaries.first(where: { $0.id == workoutID }) else { return nil }
        return FinishSummary(
            id: workoutID,
            name: detail.workout.name,
            duration: (detail.workout.endedAt ?? detail.workout.startedAt).timeIntervalSince(detail.workout.startedAt),
            completedSets: summary.setCount,
            volumeKilograms: summary.volumeKilograms,
            lines: detail.entries.compactMap { entry in
                entry.id.map { Line(id: $0, exerciseName: entry.exercise.name, setCount: entry.sets.count) }
            }
        )
    }
}
