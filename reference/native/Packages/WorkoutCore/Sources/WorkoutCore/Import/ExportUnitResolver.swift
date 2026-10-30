/// Decides which unit each exercise's weights are written in within a Strong export.
///
/// Strong keeps a unit per exercise and exports each exercise in its *current*
/// unit, whatever the header says (see `docs/DATA.md`). The two cases leave
/// different fingerprints on values that aren't round numbers:
/// - a **kg column** holding sets typed in lb shows whole pounds converted to kg
///   (61.23 = 135 lb), which are *not* round kg once converted back as if lb;
/// - a **lb column** holding sets typed in kg shows round kg converted to lb
///   (99.21 = 45 kg).
///
/// Each non-round value votes for the reading under which it makes sense; the
/// majority wins. Round values (140, 102.5) fit both readings and don't vote.
public enum ExportUnitResolver {
    /// The verdict for one exercise.
    public struct Verdict: Sendable, Equatable {
        /// The unit the exercise's column is written in.
        public var columnUnit: WeightUnit
        /// Non-round values consistent only with a kg column.
        public var kilogramVotes: Int
        /// Non-round values consistent only with a lb column.
        public var poundVotes: Int
    }

    /// Resolves the column unit for one exercise from all its exported weight values.
    /// Ties (including no votes at all) resolve to kilograms, Strong's default.
    public static func resolve(values: [Double]) -> Verdict {
        var kilogramVotes = 0
        var poundVotes = 0
        for value in values where value > 0 {
            let readAsKilograms = Weight.inferredEntryUnit(value: value, columnUnit: .kilograms)
            let readAsPounds = Weight.inferredEntryUnit(value: value, columnUnit: .pounds)
            // A round value is "typed in the column unit" under both readings: no information.
            if readAsKilograms == .kilograms, readAsPounds == .pounds { continue }
            if readAsKilograms != nil, readAsPounds == nil { kilogramVotes += 1 }
            if readAsPounds != nil, readAsKilograms == nil { poundVotes += 1 }
        }
        return Verdict(
            columnUnit: poundVotes > kilogramVotes ? .pounds : .kilograms,
            kilogramVotes: kilogramVotes,
            poundVotes: poundVotes
        )
    }
}
