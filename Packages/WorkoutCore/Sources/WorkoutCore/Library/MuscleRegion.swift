/// The body area a ``Muscle`` belongs to. Used to group muscles in lists and filters.
public enum MuscleRegion: String, CaseIterable, Codable, Sendable {
    case chest, shoulders, back, arms, core, legs, neck

    /// Name shown in the UI.
    public var displayName: String {
        switch self {
        case .chest: "Chest"
        case .shoulders: "Shoulders"
        case .back: "Back"
        case .arms: "Arms"
        case .core: "Core"
        case .legs: "Legs"
        case .neck: "Neck"
        }
    }
}
