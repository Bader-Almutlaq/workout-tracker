/// The joint action an exercise trains. Used for filtering and, later, for
/// pattern balance (for example horizontal push against horizontal pull, report section 12).
public enum MovementPattern: String, CaseIterable, Codable, Sendable {
    case horizontalPush = "horizontal-push"
    case verticalPush = "vertical-push"
    case horizontalPull = "horizontal-pull"
    case verticalPull = "vertical-pull"
    /// Chest flys and crossovers (shoulder horizontal adduction).
    case chestFly = "chest-fly"
    /// Lateral and Y raises.
    case shoulderAbduction = "shoulder-abduction"
    /// Front raises.
    case shoulderFlexion = "shoulder-flexion"
    /// Reverse flys, face pulls and rear-delt rows.
    case rearDeltFly = "rear-delt-fly"
    /// Pullovers and straight-arm pulldowns.
    case shoulderExtension = "shoulder-extension"
    case shoulderRotation = "shoulder-rotation"
    case shrug
    case squat
    case lunge
    case hinge
    case hipThrust = "hip-thrust"
    case kneeExtension = "knee-extension"
    case kneeFlexion = "knee-flexion"
    case hipAbduction = "hip-abduction"
    case hipAdduction = "hip-adduction"
    case calfRaise = "calf-raise"
    case elbowFlexion = "elbow-flexion"
    case elbowExtension = "elbow-extension"
    case wristFlexion = "wrist-flexion"
    case wristExtension = "wrist-extension"
    case grip
    case spinalFlexion = "spinal-flexion"
    case spinalExtension = "spinal-extension"
    case rotation
    case antiMovement = "anti-movement"
    case carry
    case olympic
    case neck

    /// Name shown in filters.
    public var displayName: String {
        switch self {
        case .horizontalPush: "Horizontal push"
        case .verticalPush: "Vertical push"
        case .horizontalPull: "Horizontal pull"
        case .verticalPull: "Vertical pull"
        case .chestFly: "Chest fly"
        case .shoulderAbduction: "Lateral raise"
        case .shoulderFlexion: "Front raise"
        case .rearDeltFly: "Rear delt"
        case .shoulderExtension: "Pullover"
        case .shoulderRotation: "Shoulder rotation"
        case .shrug: "Shrug"
        case .squat: "Squat"
        case .lunge: "Lunge"
        case .hinge: "Hinge"
        case .hipThrust: "Hip thrust"
        case .kneeExtension: "Knee extension"
        case .kneeFlexion: "Knee flexion"
        case .hipAbduction: "Hip abduction"
        case .hipAdduction: "Hip adduction"
        case .calfRaise: "Calf raise"
        case .elbowFlexion: "Curl"
        case .elbowExtension: "Triceps extension"
        case .wristFlexion: "Wrist flexion"
        case .wristExtension: "Wrist extension"
        case .grip: "Grip"
        case .spinalFlexion: "Spinal flexion"
        case .spinalExtension: "Spinal extension"
        case .rotation: "Rotation"
        case .antiMovement: "Anti-movement"
        case .carry: "Carry"
        case .olympic: "Olympic lift"
        case .neck: "Neck"
        }
    }
}
