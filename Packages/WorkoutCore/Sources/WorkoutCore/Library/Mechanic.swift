/// Whether an exercise moves one joint or several. Stored in `exercise.mechanic`.
public enum Mechanic: String, CaseIterable, Codable, Sendable {
    /// Several joints move (squat, row, press).
    case compound
    /// One joint moves (curl, leg extension, lateral raise).
    case isolation
}
