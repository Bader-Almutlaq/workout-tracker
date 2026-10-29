/// A unit a weight can be entered or displayed in.
///
/// Storage is always kilograms (see `docs/DATA.md`); this type only describes
/// how a number was typed or should be shown.
public enum WeightUnit: String, Codable, Sendable, CaseIterable {
    case kilograms = "kg"
    case pounds = "lb"

    /// Exact kilograms in one avoirdupois pound (international definition, 1959).
    public static let kilogramsPerPound = 0.45359237

    /// Short label shown next to numbers, e.g. "kg".
    public var symbol: String { rawValue }

    /// The other unit; used by the one-tap kg/lb toggle.
    public var toggled: WeightUnit {
        switch self {
        case .kilograms: .pounds
        case .pounds: .kilograms
        }
    }
}
