/// The owner's decisions in the import review, applied when building a ``StrongImportPlan``.
public struct StrongImportOptions: Sendable, Equatable {
    /// A replacement value for one set, from the typo review.
    public struct Correction: Sendable, Equatable {
        /// Corrected load in kilograms, or `nil` to keep the original.
        public var weightKilograms: Double?
        /// Corrected reps, or `nil` to keep the original.
        public var reps: Int?

        public init(weightKilograms: Double? = nil, reps: Int? = nil) {
            self.weightKilograms = weightKilograms
            self.reps = reps
        }
    }

    /// Column unit chosen by the owner for an exercise, overriding ``ExportUnitResolver``. Keyed by exercise name.
    public var unitOverrides: [String: WeightUnit]
    /// Corrections keyed by the set's line number in the export.
    public var corrections: [Int: Correction]
    /// Lines the owner confirmed as correct; they are no longer flagged.
    public var confirmedLines: Set<Int>

    public init(
        unitOverrides: [String: WeightUnit] = [:], corrections: [Int: Correction] = [:], confirmedLines: Set<Int> = []
    ) {
        self.unitOverrides = unitOverrides
        self.corrections = corrections
        self.confirmedLines = confirmedLines
    }
}
