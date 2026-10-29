/// What an exercise is performed with. The raw value is the stable slug stored in
/// the `exercise.equipment` column and in `library.json`.
public enum Equipment: String, CaseIterable, Codable, Sendable {
    case barbell
    case dumbbell
    case ezBar = "ez-bar"
    case trapBar = "trap-bar"
    case safetyBar = "safety-bar"
    case smithMachine = "smith-machine"
    case cable
    /// Selectorised (pin-loaded) machine.
    case machine
    case plateLoaded = "plate-loaded"
    case landmine
    case kettlebell
    case band
    /// A single weight plate held in the hands.
    case plate
    /// No external load; the exercise name carries no "(…)" suffix, as in Strong.
    case bodyweight
    /// Bodyweight plus a belt, vest or dumbbell.
    case weighted
    /// Bodyweight with machine or band assistance.
    case assisted

    /// The text shown in an exercise name's brackets, e.g. "Bench Press (**Smith Machine**)".
    public var displayName: String {
        switch self {
        case .barbell: "Barbell"
        case .dumbbell: "Dumbbell"
        case .ezBar: "EZ Bar"
        case .trapBar: "Trap Bar"
        case .safetyBar: "Safety Bar"
        case .smithMachine: "Smith Machine"
        case .cable: "Cable"
        case .machine: "Machine"
        case .plateLoaded: "Plate Loaded"
        case .landmine: "Landmine"
        case .kettlebell: "Kettlebell"
        case .band: "Band"
        case .plate: "Plate"
        case .bodyweight: "Bodyweight"
        case .weighted: "Weighted"
        case .assisted: "Assisted"
        }
    }
}
