/// What a set of this exercise records. Stored in `exercise.tracking`.
/// The logging screen (M3) shows the fields that match.
public enum ExerciseTracking: String, CaseIterable, Codable, Sendable {
    /// Weight and reps. The default.
    case weightAndReps = "weight-reps"
    /// Reps, with optional added (weighted) or removed (assisted) load.
    case bodyweightReps = "bodyweight-reps"
    /// A timed hold, such as a plank.
    case duration
    /// A loaded hold or carry: weight and time.
    case weightAndDuration = "weight-duration"
}
