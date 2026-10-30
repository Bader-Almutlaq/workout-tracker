/// A muscle the app counts sets for. The raw value is the stable slug stored in
/// the `muscle` table and in `Library/Resources/library.json`; never rename one.
///
/// The research report recommends about 20 muscles with the front, side and rear
/// delts separated, because neither open dataset splits the shoulder and set
/// counts for side and rear delts are what most programmes under-dose
/// (report, "Two open databases give you about 1,200–1,500 exercises").
/// The forearm is split into flexors and extensors because the owner trains both directly.
public enum Muscle: String, CaseIterable, Codable, Sendable, Comparable {
    case chest
    case frontDelt = "front-delt"
    case sideDelt = "side-delt"
    case rearDelt = "rear-delt"
    case rotatorCuff = "rotator-cuff"
    case lats
    /// Rhomboids plus middle and lower trapezius: what rows and face pulls train besides the lats.
    case upperBack = "upper-back"
    /// Upper trapezius: what shrugs train.
    case upperTraps = "upper-traps"
    /// Spinal erectors.
    case lowerBack = "lower-back"
    /// Biceps brachii and brachialis.
    case biceps
    case triceps
    /// Wrist and finger flexors: wrist curls and grip work.
    case forearmFlexors = "forearm-flexors"
    /// Wrist extensors and brachioradialis: reverse wrist curls, reverse and hammer curls.
    case forearmExtensors = "forearm-extensors"
    case abs
    case obliques
    case hipFlexors = "hip-flexors"
    case glutes
    /// Gluteus medius and minimus: what the hip abductor machine trains.
    case hipAbductors = "hip-abductors"
    case adductors
    case quads
    case hamstrings
    case calves
    case neck

    /// Name shown in the UI.
    public var displayName: String {
        switch self {
        case .chest: "Chest"
        case .frontDelt: "Front delts"
        case .sideDelt: "Side delts"
        case .rearDelt: "Rear delts"
        case .rotatorCuff: "Rotator cuff"
        case .lats: "Lats"
        case .upperBack: "Upper back"
        case .upperTraps: "Upper traps"
        case .lowerBack: "Lower back"
        case .biceps: "Biceps"
        case .triceps: "Triceps"
        case .forearmFlexors: "Forearm flexors"
        case .forearmExtensors: "Forearm extensors"
        case .abs: "Abs"
        case .obliques: "Obliques"
        case .hipFlexors: "Hip flexors"
        case .glutes: "Glutes"
        case .hipAbductors: "Hip abductors"
        case .adductors: "Adductors"
        case .quads: "Quads"
        case .hamstrings: "Hamstrings"
        case .calves: "Calves"
        case .neck: "Neck"
        }
    }

    /// The body area this muscle is listed under.
    public var region: MuscleRegion {
        switch self {
        case .chest: .chest
        case .frontDelt, .sideDelt, .rearDelt, .rotatorCuff: .shoulders
        case .lats, .upperBack, .upperTraps, .lowerBack: .back
        case .biceps, .triceps, .forearmFlexors, .forearmExtensors: .arms
        case .abs, .obliques, .hipFlexors: .core
        case .glutes, .hipAbductors, .adductors, .quads, .hamstrings, .calves: .legs
        case .neck: .neck
        }
    }

    /// Orders muscles head to toe (declaration order), which is how lists show them.
    public static func < (lhs: Muscle, rhs: Muscle) -> Bool {
        allCases.firstIndex(of: lhs) ?? 0 < allCases.firstIndex(of: rhs) ?? 0
    }
}
