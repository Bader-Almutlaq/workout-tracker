import Foundation

/// One data row of a Strong workouts export, with values parsed but not yet
/// interpreted (weights are still in the export's per-exercise unit).
public struct StrongRow: Sendable, Equatable {
    /// What the row holds.
    public enum Content: Sendable, Equatable {
        /// A set. `order` is the raw "Set Order" value, e.g. "1", "W", "D", "F".
        case set(order: String)
        /// A note attached to the exercise (newer exports only).
        case note
        /// A rest-timer entry (newer exports only). Not imported.
        case restTimer
    }

    /// 1-based line number in the file, for error messages and the typo review.
    public var line: Int
    /// The workout's start timestamp exactly as exported, e.g. "2021-11-20 20:53:38".
    /// Strong has no workout ID in older exports, so this identifies the workout.
    public var workoutKey: String
    public var startedAt: Date
    public var workoutName: String
    /// Session length in seconds, if exported.
    public var durationSeconds: Double?
    public var exerciseName: String
    public var content: Content
    /// The weight number exactly as exported, in the exercise's export unit.
    public var weightValue: Double
    public var reps: Int
    public var rpe: Double?
    public var distanceMeters: Double?
    public var seconds: Double?
    public var notes: String?
    public var workoutNotes: String?
}
