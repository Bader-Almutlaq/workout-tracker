import Foundation
import WorkoutCore

extension Weight {
    /// The weight as text in `unit`, e.g. "135 lb" or "102.5 kg".
    /// The only place weights become text in the app; rounding comes from ``Weight/displayValue(in:)``.
    func formatted(in unit: WeightUnit) -> String {
        "\(number(in: unit)) \(unit.symbol)"
    }

    /// Just the number, e.g. "135", for set rows where the unit is shown once.
    func number(in unit: WeightUnit) -> String {
        displayValue(in: unit).formatted(.number.precision(.fractionLength(0...2)))
    }
}
