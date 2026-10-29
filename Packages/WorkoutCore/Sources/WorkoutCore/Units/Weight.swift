import Foundation

/// A load, stored in kilograms.
///
/// This is the single place kg ↔ lb conversion happens. Store `kilograms`
/// exactly as entered or imported; convert only for display.
public struct Weight: Hashable, Sendable, Codable, Comparable {
    /// The load in kilograms. Never rounded.
    public var kilograms: Double

    /// Creates a weight from kilograms.
    public init(kilograms: Double) {
        self.kilograms = kilograms
    }

    /// Creates a weight from a number typed in `unit`.
    public init(_ value: Double, unit: WeightUnit) {
        switch unit {
        case .kilograms: kilograms = value
        case .pounds: kilograms = value * WeightUnit.kilogramsPerPound
        }
    }

    /// The exact value in `unit`, without rounding.
    public func value(in unit: WeightUnit) -> Double {
        switch unit {
        case .kilograms: kilograms
        case .pounds: kilograms / WeightUnit.kilogramsPerPound
        }
    }

    /// The value in `unit`, rounded the way a lifter would read it.
    ///
    /// Snaps to the nearest 0.25 when within ``Tolerance/displaySnap`` of it
    /// (so 61.23 kg shows as 135 lb, not 134.99 lb); otherwise rounds to 0.01.
    public func displayValue(in unit: WeightUnit) -> Double {
        let exact = value(in: unit)
        let quarter = (exact * 4).rounded() / 4
        if abs(exact - quarter) <= Tolerance.displaySnap { return quarter }
        return (exact * 100).rounded() / 100
    }

    /// Guesses the unit a stored kilogram value was originally typed in.
    ///
    /// - Returns: `.kilograms` for zero or any multiple of 0.25 kg;
    ///   `.pounds` when the value is a whole number of pounds that Strong
    ///   converted and rounded to 0.01 kg (61.23 kg → 135 lb);
    ///   `nil` when neither pattern fits.
    /// - Note: Heuristic, checked against the owner's export (see `docs/DATA.md`).
    ///   A random value hits the pound grid by chance only ~2.6% of the time.
    public static func inferredEntryUnit(storedKilograms kilograms: Double) -> WeightUnit? {
        let quarterKilograms = (kilograms * 4).rounded() / 4
        if abs(kilograms - quarterKilograms) < Tolerance.floatingPoint { return .kilograms }

        let pounds = kilograms / WeightUnit.kilogramsPerPound
        let wholePoundsInKilograms = pounds.rounded() * WeightUnit.kilogramsPerPound
        if abs(kilograms - wholePoundsInKilograms) <= Tolerance.strongPoundRounding { return .pounds }

        return nil
    }

    public static func < (lhs: Weight, rhs: Weight) -> Bool {
        lhs.kilograms < rhs.kilograms
    }

    /// Numeric tolerances used by this type.
    enum Tolerance {
        /// Absorbs binary floating-point error in values such as 102.5.
        static let floatingPoint = 1e-9
        /// Strong rounds converted pound entries to 0.01 kg (max error 0.005 kg),
        /// plus a small margin for its occasional 0.1 kg rounding of whole pounds.
        static let strongPoundRounding = 0.006
        /// How close a converted value must be to a 0.25 step to display as that step.
        static let displaySnap = 0.02
    }
}
