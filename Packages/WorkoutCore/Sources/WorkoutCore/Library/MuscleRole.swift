/// How an exercise trains a muscle. Stored in `exerciseMuscle.role`.
///
/// Analytics weight sets by role when counting fractional sets
/// (primary 1.0, secondary 0.5; Pelland 2025, report section 12). That
/// weighting lives with the analytics, not here.
public enum MuscleRole: String, Codable, Sendable {
    /// A prime mover: the muscle the exercise is chosen for.
    case primary
    /// A meaningful synergist that also gets trained.
    case secondary
}
