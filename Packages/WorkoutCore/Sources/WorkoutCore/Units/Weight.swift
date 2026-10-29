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

    /// Guesses the unit a number was originally typed in, given the unit it is
    /// now expressed in.
    ///
    /// Strong converts an exercise's history when its unit is switched and
    /// rounds the result to 0.01, so a value typed in the *other* unit shows up
    /// as a round number plus a small rounding error (see `docs/DATA.md`).
    ///
    /// - Parameters:
    ///   - value: The number as stored or exported.
    ///   - columnUnit: The unit `value` is expressed in.
    /// - Returns: `columnUnit` when `value` is a multiple of 0.25 in that unit
    ///   (or zero); the other unit when the converted value lands on that unit's
    ///   typing grid (whole pounds, or 0.25 kg) within Strong's rounding error;
    ///   `nil` when neither fits.
    /// - Note: Heuristic, checked against the owner's export. A random value hits
    ///   the whole-pound grid by chance ~2.6% of the time, the 0.25 kg grid ~4.8%.
    public static func inferredEntryUnit(value: Double, columnUnit: WeightUnit) -> WeightUnit? {
        if isMultiple(value, of: 0.25, within: Tolerance.floatingPoint) { return columnUnit }

        switch columnUnit {
        case .kilograms:
            let pounds = value / WeightUnit.kilogramsPerPound
            let wholePoundsInKilograms = pounds.rounded() * WeightUnit.kilogramsPerPound
            if abs(value - wholePoundsInKilograms) <= Tolerance.strongRounding { return .pounds }
        case .pounds:
            let kilograms = value * WeightUnit.kilogramsPerPound
            if isMultiple(kilograms, of: 0.25, within: Tolerance.strongRounding) { return .kilograms }
        }
        return nil
    }

    /// Whether `value` is within `tolerance` of a multiple of `step`.
    static func isMultiple(_ value: Double, of step: Double, within tolerance: Double) -> Bool {
        abs(value - (value / step).rounded() * step) <= tolerance
    }

    public static func < (lhs: Weight, rhs: Weight) -> Bool {
        lhs.kilograms < rhs.kilograms
    }

    /// Numeric tolerances used by this type.
    enum Tolerance {
        /// Absorbs binary floating-point error in values such as 102.5.
        static let floatingPoint = 1e-9
        /// Strong rounds converted values to 0.01 (max error 0.005), plus a small
        /// margin for its occasional 0.1 rounding of whole pounds (110 lb → 49.9 kg).
        static let strongRounding = 0.006
        /// How close a converted value must be to a 0.25 step to display as that step.
        static let displaySnap = 0.02
    }
}
