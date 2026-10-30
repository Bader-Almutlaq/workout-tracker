/// Which side a set trained, for one-sided exercises. Stored in `workoutSet.side`.
public enum SetSide: String, Codable, Sendable, CaseIterable {
    case both
    case left
    case right
}
