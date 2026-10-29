/// What role a set plays. Stored as text in `workoutSet.kind`.
public enum SetKind: String, Codable, Sendable, CaseIterable {
    /// Warm-up: excluded from volume and e1RM.
    case warmup
    /// A normal working set.
    case working
    /// A drop set (load reduced without rest).
    case drop
    /// A set taken to failure (RIR 0).
    case failure

    /// Whether the set counts as training work (everything except warm-ups).
    public var isWork: Bool { self != .warmup }
}
