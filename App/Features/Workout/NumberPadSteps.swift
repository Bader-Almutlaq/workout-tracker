import Foundation
import WorkoutCore

/// How far the number pad's − and + buttons move each kind of value.
///
/// Heuristic: the smallest plate jump in common use. Gym plates come in pairs of 1.25 kg
/// (2.5 kg per step) or 2.5 lb (5 lb per step); reps count in ones; RPE is rated in half steps
/// (Zourdos 2016, the scale WorkoutCore's `WorkoutLogger.Limits.rpeRange` follows).
enum NumberPadSteps {
    /// Weight step in kilograms.
    static let kilograms = 2.5
    /// Weight step in pounds.
    static let pounds = 5.0
    /// Reps and seconds step.
    static let reps = 1.0
    /// RPE step.
    static let rpe = 0.5

    /// The weight step for a set typed in `unit`.
    static func weight(in unit: WeightUnit) -> Double {
        switch unit {
        case .kilograms: kilograms
        case .pounds: pounds
        }
    }
}
